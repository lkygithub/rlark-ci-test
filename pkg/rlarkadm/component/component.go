package component

import (
	"fmt"

	"github.com/rlinf/rlark/pkg/log"
	"github.com/rlinf/rlark/pkg/rlarkadm/constants"
	"github.com/rlinf/rlark/pkg/rlarkadm/health"
	"github.com/rlinf/rlark/pkg/rlarkadm/types"
	"github.com/rlinf/rlark/pkg/utils"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"

	"go.yaml.in/yaml/v2"
)

type Component = types.Component

func commonArgs() []string {
	return []string{"--kubeconfig", constants.KCPKubeconfigPath}
}

func dbConfigVolume() ([]corev1.Volume, []corev1.VolumeMount) {
	return []corev1.Volume{{
			Name: "db-config",
			VolumeSource: corev1.VolumeSource{
				ConfigMap: &corev1.ConfigMapVolumeSource{
					LocalObjectReference: corev1.LocalObjectReference{Name: "rlark-db-config"},
				},
			},
		}},
		[]corev1.VolumeMount{{
			Name:      "db-config",
			MountPath: constants.DBConfigPath,
			SubPath:   "db.yaml",
			ReadOnly:  true,
		}}
}

func certVolume() ([]corev1.Volume, []corev1.VolumeMount) {
	return []corev1.Volume{{
			Name: "cert",
			VolumeSource: corev1.VolumeSource{
				Secret: &corev1.SecretVolumeSource{SecretName: "rlark-agent-cert"},
			},
		}},
		[]corev1.VolumeMount{{
			Name:      "cert",
			MountPath: constants.CertDir,
			ReadOnly:  true,
		}}
}

func kcpDataVolume(cfg *types.DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
	storage := resolveComponentStorage(cfg, constants.ComponentKCP)
	switch storage.Type {
	case "", types.StorageEmptyDir:
		return []corev1.Volume{{
				Name: "kcp-data",
				VolumeSource: corev1.VolumeSource{
					EmptyDir: &corev1.EmptyDirVolumeSource{},
				},
			}},
			[]corev1.VolumeMount{{
				Name:      "kcp-data",
				MountPath: constants.KCPDataDir,
			}}
	case types.StorageHostPath:
		return []corev1.Volume{{
				Name: "kcp-data",
				VolumeSource: corev1.VolumeSource{
					HostPath: &corev1.HostPathVolumeSource{
						Path: storage.HostPath,
						Type: &[]corev1.HostPathType{corev1.HostPathDirectoryOrCreate}[0],
					},
				},
			}},
			[]corev1.VolumeMount{{
				Name:      "kcp-data",
				MountPath: constants.KCPDataDir,
			}}
	default:
		return nil, nil
	}
}

func kcpVolumeClaim(cfg *types.DeployConfig) []corev1.PersistentVolumeClaim {
	storage := resolveComponentStorage(cfg, constants.ComponentKCP)
	if storage.Type != types.StoragePVC {
		return nil
	}
	size := storage.Size
	if size == "" {
		size = "10Gi"
	}
	return []corev1.PersistentVolumeClaim{{
		ObjectMeta: metav1.ObjectMeta{Name: "kcp-data"},
		Spec: corev1.PersistentVolumeClaimSpec{
			AccessModes:      []corev1.PersistentVolumeAccessMode{corev1.ReadWriteOnce},
			StorageClassName: stringPtr(storage.StorageClass),
			Resources: corev1.VolumeResourceRequirements{
				Requests: corev1.ResourceList{corev1.ResourceStorage: mustParseQuantity(size)},
			},
		},
	}}
}

func resolveComponentConfig(cfg *types.DeployConfig, name string) *types.ComponentConfig {
	if cfg.Kubernetes == nil {
		return &types.ComponentConfig{}
	}
	switch name {
	case constants.ComponentKCP:
		if cfg.Kubernetes.KCP != nil {
			return cfg.Kubernetes.KCP
		}
	case constants.ComponentPostgresql:
		if cfg.Kubernetes.Postgresql != nil {
			return cfg.Kubernetes.Postgresql
		}
	}
	return &types.ComponentConfig{}
}

func resolveComponentStorage(cfg *types.DeployConfig, name string) *types.StorageConfig {
	if cfg.Kubernetes == nil {
		return &types.StorageConfig{}
	}
	cc := resolveComponentConfig(cfg, name)
	if cc.Storage != nil {
		return cc.Storage
	}
	if cfg.Kubernetes.Storage != nil {
		return cfg.Kubernetes.Storage
	}
	return &types.StorageConfig{}
}

func resolveComponentReplicas(cfg *types.DeployConfig, name string) int32 {
	if cfg.Kubernetes == nil {
		return 1
	}
	cc := resolveComponentConfig(cfg, name)
	if cc.Replicas != 0 {
		return cc.Replicas
	}
	if cfg.Kubernetes.Replicas != 0 {
		return cfg.Kubernetes.Replicas
	}
	return 1
}

func resolveComponentNodeSelector(cfg *types.DeployConfig, name string) map[string]string {
	storage := resolveComponentStorage(cfg, name)
	return storage.NodeSelector
}

func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func mustParseQuantity(s string) resource.Quantity {
	q, err := resource.ParseQuantity(s)
	if err != nil {
		return resource.MustParse("10Gi")
	}
	return q
}

func kubeconfigVolume() ([]corev1.Volume, []corev1.VolumeMount) {
	return []corev1.Volume{{
			Name: "kcp-kubeconfig",
			VolumeSource: corev1.VolumeSource{
				ConfigMap: &corev1.ConfigMapVolumeSource{
					LocalObjectReference: corev1.LocalObjectReference{Name: "rlark-kcp-kubeconfig"},
				},
			},
		}},
		[]corev1.VolumeMount{{
			Name:      "kcp-kubeconfig",
			MountPath: constants.KCPKubeconfigPath,
			SubPath:   "admin.kubeconfig",
			ReadOnly:  true,
		}}
}

func postgresqlDataVolume() ([]corev1.Volume, []corev1.VolumeMount) {
	return []corev1.Volume{{
			Name: "pg-data",
			VolumeSource: corev1.VolumeSource{
				EmptyDir: &corev1.EmptyDirVolumeSource{},
			},
		}},
		[]corev1.VolumeMount{{
			Name:      "pg-data",
			MountPath: constants.PostgresqlDataDir,
		}}
}

func postgresqlInitVolume() ([]corev1.Volume, []corev1.VolumeMount) {
	return []corev1.Volume{{
			Name: "pg-init",
			VolumeSource: corev1.VolumeSource{
				ConfigMap: &corev1.ConfigMapVolumeSource{
					LocalObjectReference: corev1.LocalObjectReference{Name: "rlark-postgres-init"},
				},
			},
		}},
		[]corev1.VolumeMount{{
			Name:      "pg-init",
			MountPath: constants.PostgresqlInitDir,
			ReadOnly:  true,
		}}
}

// 全局部署配置，后续新部署的组件往上添加，也可通过配置文件控制
var components = []types.Component{
	{
		Name: constants.ComponentGateway, Port: 8090, Plane: types.PlaneControl, NeedsService: true,
		Dependencies:  []string{constants.ComponentKCP},
		HealthCheckFn: health.ModeHealthCheck(types.Component{Name: constants.ComponentGateway}),
		ImageFn: func(cfg *types.DeployConfig) string {
			return imageByMode(cfg, func(k *types.KubernetesEnv) string { return k.GatewayImage }, func(d *types.DockerEnv) string { return d.GatewayImage })
		},
		ArtifactFn: func(cfg *types.DeployConfig) string { return cfg.Raw.GatewayArtifact },
		ArgsFn: func(cfg *types.DeployConfig) []string {
			args := []string{"--addr=:8090"}
			if cfg.DB != nil {
				args = append(args, "--db-config="+constants.DBConfigPath)
			}
			return append(args, commonArgs()...)
		},
		VolumeFn: func(cfg *types.DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			vols, mounts := kubeconfigVolume()
			if cfg.DB != nil {
				dv, dm := dbConfigVolume()
				vols = append(vols, dv...)
				mounts = append(mounts, dm...)
			}
			return vols, mounts
		},
	},
	{
		Name: constants.ComponentControllerManager, Port: 8081, Plane: types.PlaneControl,
		Dependencies:  []string{constants.ComponentKCP},
		HealthCheckFn: health.ModeHealthCheck(types.Component{Name: constants.ComponentControllerManager}),
		ImageFn: func(cfg *types.DeployConfig) string {
			return imageByMode(cfg, func(k *types.KubernetesEnv) string { return k.ControllerManagerImage }, func(d *types.DockerEnv) string { return d.ControllerManagerImage })
		},
		ArtifactFn: func(cfg *types.DeployConfig) string { return cfg.Raw.ControllerManagerArtifact },
		ArgsFn: func(cfg *types.DeployConfig) []string {
			args := []string{
				"--metrics-bind-address=:8080",
				"--health-probe-bind-address=:8081",
				"--leader-elect=false",
			}
			if cfg.DB != nil {
				args = append(args, "--db-config="+constants.DBConfigPath)
			}
			return append(args, commonArgs()...)
		},
		VolumeFn: func(cfg *types.DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			vols, mounts := kubeconfigVolume()
			if cfg.DB != nil {
				dv, dm := dbConfigVolume()
				vols = append(vols, dv...)
				mounts = append(mounts, dm...)
			}
			return vols, mounts
		},
	},
	{
		Name: constants.ComponentServer, Port: 8443, Plane: types.PlaneControl, NeedsService: true,
		Dependencies:  []string{constants.ComponentKCP},
		HealthCheckFn: health.ModeHealthCheck(types.Component{Name: constants.ComponentServer}),
		ImageFn: func(cfg *types.DeployConfig) string {
			return imageByMode(cfg, func(k *types.KubernetesEnv) string { return k.ServerImage }, func(d *types.DockerEnv) string { return d.ServerImage })
		},
		ArtifactFn: func(cfg *types.DeployConfig) string { return cfg.Raw.ServerArtifact },
		ArgsFn: func(cfg *types.DeployConfig) []string {
			args := []string{
				"--https-port=8443",
				"--unsafe-http-port=8888",
				"--ssh-port=2222",
				"--auto-sign-tls-ca-cert",
				"--tls-domains=localhost,rlark-server,rlark-server." + constants.Namespace + ",rlark-server." + constants.Namespace + ".svc",
			}
			if cfg.DB != nil {
				args = append(args, "--db-config="+constants.DBConfigPath)
			}
			return append(args, commonArgs()...)
		},
		VolumeFn: func(cfg *types.DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			vols, mounts := kubeconfigVolume()
			if cfg.DB != nil {
				dv, dm := dbConfigVolume()
				vols = append(vols, dv...)
				mounts = append(mounts, dm...)
			}
			return vols, mounts
		},
	},
	{
		Name: constants.ComponentAgent, Port: 8081, Plane: types.PlaneData,
		HealthCheckFn:  health.ModeHealthCheck(types.Component{Name: constants.ComponentAgent}),
		ServiceAccount: "rlark-agent",
		RBACRules: []rbacv1.PolicyRule{
			{APIGroups: []string{""}, Resources: []string{"nodes"}, Verbs: []string{"get", "list", "watch", "update"}},
			{APIGroups: []string{""}, Resources: []string{"pods"}, Verbs: []string{"get", "list", "watch", "create", "update", "delete"}},
			{APIGroups: []string{""}, Resources: []string{"pods/log"}, Verbs: []string{"get"}},
			{APIGroups: []string{""}, Resources: []string{"configmaps", "services"}, Verbs: []string{"get", "list", "watch", "create", "update", "delete"}},
			{APIGroups: []string{"apps"}, Resources: []string{"deployments", "daemonsets", "statefulsets"}, Verbs: []string{"get", "list", "watch", "create", "update", "delete"}},
		},
		ImageFn: func(cfg *types.DeployConfig) string {
			return imageByMode(cfg, func(k *types.KubernetesEnv) string { return k.AgentImage }, func(d *types.DockerEnv) string { return d.AgentImage })
		},
		ArtifactFn: func(cfg *types.DeployConfig) string { return cfg.Raw.AgentArtifact },
		ArgsFn: func(cfg *types.DeployConfig) []string {
			args := []string{
				"--server-address=" + cfg.ControlPlaneAddress,
				"--agent-type=" + cfg.EnvMode(),
				"--client-cert=" + constants.CertDir + "/tls.crt",
				"--client-key=" + constants.CertDir + "/tls.key",
				"--ca-cert=" + constants.CertDir + "/ca.crt",
				"--leader-election=false",
				"--mode=cluster",
			}

			if cfg.Kubernetes != nil {
				args = append(args, "--in-cluster")
			}

			if cfg.InsecureSkipTLSVerify {
				args = append(args, "--insecure-skip-tls-verify")
			}

			return args
		},
		VolumeFn: func(cfg *types.DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			return certVolume()
		},
	},
	{
		Name: constants.ComponentAgentNode, Port: 8081, Plane: types.PlaneData, WorkloadKind: "DaemonSet",
		HealthCheckFn:  health.ModeHealthCheck(types.Component{Name: constants.ComponentAgentNode}),
		ServiceAccount: "rlark-agent",
		ImageFn: func(cfg *types.DeployConfig) string {
			return imageByMode(cfg, func(k *types.KubernetesEnv) string { return k.AgentImage }, func(d *types.DockerEnv) string { return d.AgentImage })
		},
		ArtifactFn: func(cfg *types.DeployConfig) string { return cfg.Raw.AgentArtifact },
		ArgsFn: func(cfg *types.DeployConfig) []string {
			args := []string{
				"--server-address=" + cfg.ControlPlaneAddress,
				"--agent-type=" + cfg.EnvMode(),
				"--client-cert=" + constants.CertDir + "/tls.crt",
				"--client-key=" + constants.CertDir + "/tls.key",
				"--ca-cert=" + constants.CertDir + "/ca.crt",
				"--leader-election=false",
				"--mode=node",
			}

			if cfg.Kubernetes != nil {
				args = append(args, "--in-cluster")
			}

			if cfg.InsecureSkipTLSVerify {
				args = append(args, "--insecure-skip-tls-verify")
			}

			return args
		},
		VolumeFn: func(cfg *types.DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			vols, mounts := certVolume()
			vols = append(vols, corev1.Volume{
				Name: "nodeserver-socket",
				VolumeSource: corev1.VolumeSource{
					HostPath: &corev1.HostPathVolumeSource{
						Path: "/run/rlark",
						Type: &[]corev1.HostPathType{corev1.HostPathDirectoryOrCreate}[0],
					},
				},
			})
			mounts = append(mounts, corev1.VolumeMount{
				Name:      "nodeserver-socket",
				MountPath: "/run/rlark",
			})
			return vols, mounts
		},
	},
	{
		Name: constants.ComponentKCP, Port: 6443, Plane: types.PlaneControl, NeedsService: true,
		WorkloadKind:  "StatefulSet",
		HealthCheckFn: health.ModeHealthCheck(types.Component{Name: constants.ComponentKCP}),
		ImageFn: func(cfg *types.DeployConfig) string {
			return imageByMode(cfg, func(k *types.KubernetesEnv) string { return k.KCPImage }, func(d *types.DockerEnv) string { return d.KCPImage })
		},
		ArtifactFn: func(cfg *types.DeployConfig) string { return cfg.Raw.KCPArtifact },
		ArgsFn:     func(cfg *types.DeployConfig) []string { return []string{"start"} },
		EnvFn: func(cfg *types.DeployConfig) map[string]string {
			return map[string]string{"KCP_LOG_LEVEL": "2"}
		},
		VolumeFn: func(cfg *types.DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			return kcpDataVolume(cfg)
		},
		VolumeClaimFn: func(cfg *types.DeployConfig) []corev1.PersistentVolumeClaim {
			return kcpVolumeClaim(cfg)
		},
	},
	{
		Name: constants.ComponentPostgresql, Port: 5432, Plane: types.PlaneControl, NeedsService: true,
		EnabledFn:     func(cfg *types.DeployConfig) bool { return cfg.DB != nil },
		HealthCheckFn: health.ModeHealthCheck(types.Component{Name: constants.ComponentPostgresql}),
		ImageFn: func(cfg *types.DeployConfig) string {
			return imageByMode(cfg, func(k *types.KubernetesEnv) string { return k.PostgresqlImage }, func(d *types.DockerEnv) string { return d.PostgresqlImage })
		},
		ArtifactFn: func(cfg *types.DeployConfig) string { return cfg.Raw.PostgresqlArtifact },
		ArgsFn:     func(cfg *types.DeployConfig) []string { return []string{} },
		EnvFn: func(cfg *types.DeployConfig) map[string]string {
			return map[string]string{
				"POSTGRES_USER":     cfg.DB.User,
				"POSTGRES_PASSWORD": cfg.DB.Password,
				"POSTGRES_DB":       cfg.DB.Database,
			}
		},
		VolumeFn: func(cfg *types.DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			dv, dm := postgresqlDataVolume()
			iv, im := postgresqlInitVolume()
			return append(dv, iv...), append(dm, im...)
		},
	},
	{
		Name: constants.ComponentUI, Port: 80, Plane: types.PlaneControl, NeedsService: true,
		Dependencies:  []string{constants.ComponentGateway},
		HealthCheckFn: health.ModeHealthCheck(types.Component{Name: constants.ComponentUI}),
		ImageFn: func(cfg *types.DeployConfig) string {
			return imageByMode(cfg, func(k *types.KubernetesEnv) string { return k.UIImage }, func(d *types.DockerEnv) string { return d.UIImage })
		},
		ArgsFn: func(cfg *types.DeployConfig) []string { return []string{} },
	},
}

func imageByMode(cfg *types.DeployConfig, k8sFn func(*types.KubernetesEnv) string, dockerFn func(*types.DockerEnv) string) string {
	switch cfg.EnvMode() {
	case "Kubernetes":
		if cfg.Kubernetes != nil {
			return k8sFn(cfg.Kubernetes)
		}
	case "Docker":
		if cfg.Docker != nil {
			return dockerFn(cfg.Docker)
		}
	}
	return ""
}

func ComponentsForPlane(cfg *types.DeployConfig) []types.Component {
	logger := log.GetLogger()
	var result []types.Component
	var topos []utils.Topo
	for i := range components {
		c := &components[i]
		if c.Plane != cfg.Plane {
			continue
		}
		if c.EnabledFn != nil && !c.EnabledFn(cfg) {
			continue
		}
		result = append(result, *c)
		topos = append(topos, c)
	}

	sorted, err := utils.TopologicalSort(topos)
	if err != nil {
		logger.Error(nil, "topological sort failed, using original order", "err", err)
		return result
	}

	var sortedComps []types.Component
	for _, t := range sorted {
		sortedComps = append(sortedComps, *t.(*types.Component))
	}
	return sortedComps
}

func Deployment(cfg *types.DeployConfig, c *types.Component) *appsv1.Deployment {
	labels := map[string]string{"app": c.Name}

	dep := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      c.Name,
			Namespace: constants.Namespace,
			Labels:    labels,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: utils.Ptr(resolveComponentReplicas(cfg, c.Name)),
			Selector: &metav1.LabelSelector{MatchLabels: labels},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: labels},
				Spec: corev1.PodSpec{
					ServiceAccountName: ServiceAccountName(c),
					Containers: []corev1.Container{{
						Name:            c.Name,
						Image:           c.ImageFn(cfg),
						ImagePullPolicy: corev1.PullIfNotPresent,
						Ports: []corev1.ContainerPort{{
							ContainerPort: c.Port,
						}},
						Args: c.ArgsFn(cfg),
					}},
				},
			},
		},
	}

	if c.EnvFn != nil {
		envMap := c.EnvFn(cfg)
		var envs []corev1.EnvVar
		for k, v := range envMap {
			envs = append(envs, corev1.EnvVar{Name: k, Value: v})
		}
		dep.Spec.Template.Spec.Containers[0].Env = envs
	}

	if c.VolumeFn != nil {
		vols, mounts := c.VolumeFn(cfg)
		dep.Spec.Template.Spec.Volumes = append(dep.Spec.Template.Spec.Volumes, vols...)
		dep.Spec.Template.Spec.Containers[0].VolumeMounts = append(dep.Spec.Template.Spec.Containers[0].VolumeMounts, mounts...)
	}

	return dep
}

func DaemonSet(cfg *types.DeployConfig, c *types.Component) *appsv1.DaemonSet {
	labels := map[string]string{"app": c.Name}

	ds := &appsv1.DaemonSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      c.Name,
			Namespace: constants.Namespace,
			Labels:    labels,
		},
		Spec: appsv1.DaemonSetSpec{
			Selector: &metav1.LabelSelector{MatchLabels: labels},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: labels},
				Spec: corev1.PodSpec{
					ServiceAccountName: ServiceAccountName(c),
					Containers: []corev1.Container{{
						Name:            c.Name,
						Image:           c.ImageFn(cfg),
						ImagePullPolicy: corev1.PullIfNotPresent,
						Ports: []corev1.ContainerPort{{
							ContainerPort: c.Port,
						}},
						Args: c.ArgsFn(cfg),
						SecurityContext: &corev1.SecurityContext{
							Privileged: utils.Ptr(true),
						},
					}},
				},
			},
		},
	}

	if c.EnvFn != nil {
		envMap := c.EnvFn(cfg)
		var envs []corev1.EnvVar
		for k, v := range envMap {
			envs = append(envs, corev1.EnvVar{Name: k, Value: v})
		}
		ds.Spec.Template.Spec.Containers[0].Env = envs
	}

	if c.VolumeFn != nil {
		vols, mounts := c.VolumeFn(cfg)
		ds.Spec.Template.Spec.Volumes = append(ds.Spec.Template.Spec.Volumes, vols...)
		ds.Spec.Template.Spec.Containers[0].VolumeMounts = append(ds.Spec.Template.Spec.Containers[0].VolumeMounts, mounts...)
	}

	return ds
}

func StatefulSet(cfg *types.DeployConfig, c *types.Component) *appsv1.StatefulSet {
	labels := map[string]string{"app": c.Name}

	sts := &appsv1.StatefulSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      c.Name,
			Namespace: constants.Namespace,
			Labels:    labels,
		},
		Spec: appsv1.StatefulSetSpec{
			Replicas: utils.Ptr(resolveComponentReplicas(cfg, c.Name)),
			Selector: &metav1.LabelSelector{MatchLabels: labels},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: labels},
				Spec: corev1.PodSpec{
					ServiceAccountName: ServiceAccountName(c),
					Containers: []corev1.Container{{
						Name:            c.Name,
						Image:           c.ImageFn(cfg),
						ImagePullPolicy: corev1.PullIfNotPresent,
						Ports: []corev1.ContainerPort{{
							ContainerPort: c.Port,
						}},
						Args: c.ArgsFn(cfg),
					}},
				},
			},
		},
	}

	if c.EnvFn != nil {
		envMap := c.EnvFn(cfg)
		var envs []corev1.EnvVar
		for k, v := range envMap {
			envs = append(envs, corev1.EnvVar{Name: k, Value: v})
		}
		sts.Spec.Template.Spec.Containers[0].Env = envs
	}

	if c.VolumeFn != nil {
		vols, mounts := c.VolumeFn(cfg)
		sts.Spec.Template.Spec.Volumes = append(sts.Spec.Template.Spec.Volumes, vols...)
		sts.Spec.Template.Spec.Containers[0].VolumeMounts = append(sts.Spec.Template.Spec.Containers[0].VolumeMounts, mounts...)
	}

	if c.VolumeClaimFn != nil {
		sts.Spec.VolumeClaimTemplates = c.VolumeClaimFn(cfg)
	}

	nodeSelector := resolveComponentNodeSelector(cfg, c.Name)
	if nodeSelector != nil {
		sts.Spec.Template.Spec.NodeSelector = nodeSelector
	}

	return sts
}

func ServiceAccountName(c *types.Component) string {
	if c.ServiceAccount != "" {
		return c.ServiceAccount
	}
	return "default"
}

func RBAC(c *types.Component) (*corev1.ServiceAccount, *rbacv1.ClusterRole, *rbacv1.ClusterRoleBinding) {
	if len(c.RBACRules) == 0 {
		return nil, nil, nil
	}
	sa := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{Name: c.ServiceAccount, Namespace: constants.Namespace},
	}
	cr := &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{Name: c.ServiceAccount},
		Rules:      c.RBACRules,
	}
	crb := &rbacv1.ClusterRoleBinding{
		ObjectMeta: metav1.ObjectMeta{Name: c.ServiceAccount},
		Subjects:   []rbacv1.Subject{{Kind: "ServiceAccount", Name: c.ServiceAccount, Namespace: constants.Namespace}},
		RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: c.ServiceAccount, APIGroup: "rbac.authorization.k8s.io"},
	}
	return sa, cr, crb
}

func Service(c *types.Component) *corev1.Service {
	if !c.NeedsService {
		return nil
	}
	labels := map[string]string{"app": c.Name}
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      c.Name,
			Namespace: constants.Namespace,
			Labels:    labels,
		},
		Spec: corev1.ServiceSpec{
			Selector: labels,
			Ports: []corev1.ServicePort{{
				Name:       "http",
				Port:       c.Port,
				TargetPort: intstr.FromInt32(c.Port),
			}},
		},
	}
}

func DBConfigYAML(cfg *types.DBConfig) ([]byte, error) {
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return nil, fmt.Errorf("marshal db config: %w", err)
	}
	return data, nil
}
