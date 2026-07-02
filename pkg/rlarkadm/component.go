package rlarkadm

import (
	"fmt"

	"github.com/sirupsen/logrus"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"

	"go.yaml.in/yaml/v2"
)

const (
	DBConfigPath      = "/etc/rlark/db.yaml"
	CertDir           = "/etc/rlark/certs"
	KCPDataDir        = "/.kcp"
	KCPKubeconfigPath = "/etc/kcp/admin.kubeconfig"
	PostgresqlDataDir = "/var/lib/postgresql/data"
	PostgresqlInitDir = "/docker-entrypoint-initdb.d"
)

const initDBSQL = `-- scripts/init-db.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL PRIVILEGES ON DATABASE rlark TO postgres;
`

const (
	Namespace = "rlark-system"

	ComponentGateway           = "rlark-gateway"
	ComponentControllerManager = "rlark-controller-manager"
	ComponentServer            = "rlark-server"
	ComponentAgent             = "rlark-agent"

	ComponentPrometheus = "prometheus"
	ComponentPostgresql = "postgresql"
	ComponentKCP        = "kcp"
)

type Component struct {
	Name         string
	Port         int32
	Plane        Plane
	NeedsService bool

	Dependencies  []string
	EnabledFn     func(cfg *DeployConfig) bool
	ImageFn       func(cfg *DeployConfig) string
	ArtifactFn    func(cfg *DeployConfig) string
	ArgsFn        func(cfg *DeployConfig) []string
	EnvFn         func(cfg *DeployConfig) map[string]string
	VolumeFn      func(cfg *DeployConfig) ([]corev1.Volume, []corev1.VolumeMount)
	HealthCheckFn func(cfg *DeployConfig) error
	PostDeployFn  func(cfg *DeployConfig) error
}

func commonArgs() []string {
	return []string{"--kubeconfig", KCPKubeconfigPath}
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
			MountPath: DBConfigPath,
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
			MountPath: CertDir,
			ReadOnly:  true,
		}}
}

func kcpDataVolume() ([]corev1.Volume, []corev1.VolumeMount) {
	return []corev1.Volume{{
			Name: "kcp-data",
			VolumeSource: corev1.VolumeSource{
				EmptyDir: &corev1.EmptyDirVolumeSource{},
			},
		}},
		[]corev1.VolumeMount{{
			Name:      "kcp-data",
			MountPath: KCPDataDir,
		}}
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
			MountPath: KCPKubeconfigPath,
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
			MountPath: PostgresqlDataDir,
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
			MountPath: PostgresqlInitDir,
			ReadOnly:  true,
		}}
}

// 全局部署配置，后续新部署的组件往上添加，也可通过配置文件控制
var components = []Component{
	{
		Name: ComponentGateway, Port: 8090, Plane: PlaneControl, NeedsService: true,
		Dependencies:  []string{ComponentKCP},
		HealthCheckFn: modeHealthCheck(Component{Name: ComponentGateway}),
		ImageFn: func(cfg *DeployConfig) string {
			return imageByMode(cfg, func(k *KubernetesEnv) string { return k.GatewayImage }, func(d *DockerEnv) string { return d.GatewayImage })
		},
		ArtifactFn: func(cfg *DeployConfig) string { return cfg.Raw.GatewayArtifact },
		ArgsFn: func(cfg *DeployConfig) []string {
			args := []string{"--addr=:8090"}
			if cfg.DB != nil {
				args = append(args, "--db-config="+DBConfigPath)
			}
			return append(args, commonArgs()...)
		},
		VolumeFn: func(cfg *DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
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
		Name: ComponentControllerManager, Port: 8081, Plane: PlaneControl,
		Dependencies:  []string{ComponentKCP},
		HealthCheckFn: modeHealthCheck(Component{Name: ComponentControllerManager}),
		ImageFn: func(cfg *DeployConfig) string {
			return imageByMode(cfg, func(k *KubernetesEnv) string { return k.ControllerManagerImage }, func(d *DockerEnv) string { return d.ControllerManagerImage })
		},
		ArtifactFn: func(cfg *DeployConfig) string { return cfg.Raw.ControllerManagerArtifact },
		ArgsFn: func(cfg *DeployConfig) []string {
			args := []string{
				"--metrics-bind-address=:8080",
				"--health-probe-bind-address=:8081",
				"--leader-elect=false",
			}
			if cfg.DB != nil {
				args = append(args, "--db-config="+DBConfigPath)
			}
			return append(args, commonArgs()...)
		},
		VolumeFn: func(cfg *DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
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
		Name: ComponentServer, Port: 8443, Plane: PlaneControl, NeedsService: true,
		Dependencies:  []string{ComponentKCP},
		HealthCheckFn: modeHealthCheck(Component{Name: ComponentServer}),
		ImageFn: func(cfg *DeployConfig) string {
			return imageByMode(cfg, func(k *KubernetesEnv) string { return k.ServerImage }, func(d *DockerEnv) string { return d.ServerImage })
		},
		ArtifactFn: func(cfg *DeployConfig) string { return cfg.Raw.ServerArtifact },
		ArgsFn: func(cfg *DeployConfig) []string {
			args := []string{
				"--https-port=8443",
				"--unsafe-http-port=8888",
				"--ssh-port=2222",
				"--auto-sign-tls-ca-cert",
				"--tls-domains=localhost,rlark-server",
			}
			if cfg.DB != nil {
				args = append(args, "--db-config="+DBConfigPath)
			}
			return append(args, commonArgs()...)
		},
		VolumeFn: func(cfg *DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
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
		Name: ComponentAgent, Port: 8081, Plane: PlaneData,
		HealthCheckFn: modeHealthCheck(Component{Name: ComponentAgent}),
		ImageFn: func(cfg *DeployConfig) string {
			return imageByMode(cfg, func(k *KubernetesEnv) string { return k.AgentImage }, func(d *DockerEnv) string { return d.AgentImage })
		},
		ArtifactFn: func(cfg *DeployConfig) string { return cfg.Raw.AgentArtifact },
		ArgsFn: func(cfg *DeployConfig) []string {
			return append([]string{
				"--server-address=" + cfg.ControlPlaneAddress,
				"--agent-type=" + cfg.EnvMode(),
				"--client-cert=" + CertDir + "/tls.crt",
				"--client-key=" + CertDir + "/tls.key",
				"--ca-cert=" + CertDir + "/ca.crt",
				"--leader-election=false",
				"--mode=cluster",
			}, commonArgs()...)
		},
		VolumeFn: func(cfg *DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			return certVolume()
		},
	},
	{
		Name: ComponentKCP, Port: 6443, Plane: PlaneControl, NeedsService: true,
		HealthCheckFn: modeHealthCheck(Component{Name: ComponentKCP}),
		ImageFn: func(cfg *DeployConfig) string {
			return imageByMode(cfg, func(k *KubernetesEnv) string { return k.KCPImage }, func(d *DockerEnv) string { return d.KCPImage })
		},
		ArtifactFn: func(cfg *DeployConfig) string { return cfg.Raw.KCPArtifact },
		ArgsFn:     func(cfg *DeployConfig) []string { return []string{"start"} },
		EnvFn: func(cfg *DeployConfig) map[string]string {
			return map[string]string{"KCP_LOG_LEVEL": "2"}
		},
		VolumeFn: func(cfg *DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			return kcpDataVolume()
		},
	},
	{
		Name: ComponentPostgresql, Port: 5432, Plane: PlaneControl, NeedsService: true,
		EnabledFn:     func(cfg *DeployConfig) bool { return cfg.DB != nil },
		HealthCheckFn: modeHealthCheck(Component{Name: ComponentPostgresql}),
		ImageFn: func(cfg *DeployConfig) string {
			return imageByMode(cfg, func(k *KubernetesEnv) string { return k.PostgresqlImage }, func(d *DockerEnv) string { return d.PostgresqlImage })
		},
		ArtifactFn: func(cfg *DeployConfig) string { return cfg.Raw.PostgresqlArtifact },
		ArgsFn:     func(cfg *DeployConfig) []string { return []string{} },
		EnvFn: func(cfg *DeployConfig) map[string]string {
			return map[string]string{
				"POSTGRES_USER":     cfg.DB.User,
				"POSTGRES_PASSWORD": cfg.DB.Password,
				"POSTGRES_DB":       cfg.DB.Database,
			}
		},
		VolumeFn: func(cfg *DeployConfig) ([]corev1.Volume, []corev1.VolumeMount) {
			dv, dm := postgresqlDataVolume()
			iv, im := postgresqlInitVolume()
			return append(dv, iv...), append(dm, im...)
		},
	},
}

func imageByMode(cfg *DeployConfig, k8sFn func(*KubernetesEnv) string, dockerFn func(*DockerEnv) string) string {
	switch cfg.EnvMode() {
	case "kubernetes":
		if cfg.Kubernetes != nil {
			return k8sFn(cfg.Kubernetes)
		}
	case "docker":
		if cfg.Docker != nil {
			return dockerFn(cfg.Docker)
		}
	}
	return ""
}

func ComponentsForPlane(cfg *DeployConfig) []Component {
	var result []Component
	for _, c := range components {
		if c.Plane != cfg.Plane {
			continue
		}
		if c.EnabledFn != nil && !c.EnabledFn(cfg) {
			continue
		}
		result = append(result, c)
	}

	sorted, err := topologicalSort(result)
	if err != nil {
		logrus.Warnf("topological sort failed, using original order: %v", err)
		return result
	}

	return sorted
}

func (c *Component) Deployment(cfg *DeployConfig) *appsv1.Deployment {
	labels := map[string]string{"app": c.Name}

	dep := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      c.Name,
			Namespace: Namespace,
			Labels:    labels,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: ptr(int32(1)),
			Selector: &metav1.LabelSelector{MatchLabels: labels},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: labels},
				Spec: corev1.PodSpec{
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

func (c *Component) Service() *corev1.Service {
	if !c.NeedsService {
		return nil
	}
	labels := map[string]string{"app": c.Name}
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      c.Name,
			Namespace: Namespace,
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

func ptr[T any](v T) *T { return &v }

func DBConfigYAML(cfg *DBConfig) ([]byte, error) {
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return nil, fmt.Errorf("marshal db config: %w", err)
	}
	return data, nil
}
