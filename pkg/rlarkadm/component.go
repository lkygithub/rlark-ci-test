package rlarkadm

import (
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

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
	NeedsCert    bool
	NeedsService bool
}

// 全局部署配置，后续新部署的组件往上添加，也可通过配置文件控制
var components = []Component{
	{Name: ComponentGateway, Port: 8080, Plane: PlaneControl, NeedsService: true},
	{Name: ComponentControllerManager, Port: 8081, Plane: PlaneControl},
	{Name: ComponentServer, Port: 8082, Plane: PlaneControl, NeedsService: true},
	{Name: ComponentAgent, Port: 8081, Plane: PlaneData, NeedsCert: true},
}

func ComponentsForPlane(plane Plane) []Component {
	var result []Component
	for _, c := range components {
		if c.Plane == plane {
			result = append(result, c)
		}
	}
	return result
}

func (c *Component) Image(cfg *DeployConfig) string {
	switch cfg.EnvMode() {
	case "kubernetes":
		return c.kubernetesImage(cfg.Kubernetes)
	case "docker":
		return c.dockerImage(cfg.Docker)
	default:
		return ""
	}
}

func (c *Component) Artifact(cfg *DeployConfig) string {
	if cfg.Raw == nil {
		return ""
	}
	switch c.Name {
	case ComponentGateway:
		return cfg.Raw.GatewayArtifact
	case ComponentControllerManager:
		return cfg.Raw.ControllerManagerArtifact
	case ComponentServer:
		return cfg.Raw.ServerArtifact
	case ComponentAgent:
		return cfg.Raw.AgentArtifact
	default:
		return ""
	}
}

func (c *Component) kubernetesImage(env *KubernetesEnv) string {
	if env == nil {
		return ""
	}
	switch c.Name {
	case ComponentGateway:
		return env.GatewayImage
	case ComponentControllerManager:
		return env.ControllerManagerImage
	case ComponentServer:
		return env.ServerImage
	case ComponentAgent:
		return env.AgentImage
	default:
		return ""
	}
}

func (c *Component) dockerImage(env *DockerEnv) string {
	if env == nil {
		return ""
	}
	switch c.Name {
	case ComponentGateway:
		return env.GatewayImage
	case ComponentControllerManager:
		return env.ControllerManagerImage
	case ComponentServer:
		return env.ServerImage
	case ComponentAgent:
		return env.AgentImage
	default:
		return ""
	}
}

func (c *Component) EnvVars(cfg *DeployConfig) []corev1.EnvVar {
	if c.Name == ComponentAgent && cfg.ControlPlaneAddress != "" {
		return []corev1.EnvVar{
			{Name: "CONTROL_PLANE", Value: cfg.ControlPlaneAddress},
		}
	}
	return nil
}

func (c *Component) Deployment(cfg *DeployConfig) *appsv1.Deployment {
	labels := map[string]string{"app": c.Name}
	env := c.EnvVars(cfg)

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
						Image:           c.Image(cfg),
						ImagePullPolicy: corev1.PullIfNotPresent,
						Ports: []corev1.ContainerPort{{
							ContainerPort: c.Port,
						}},
						Env: env,
					}},
				},
			},
		},
	}

	if c.NeedsCert {
		dep.Spec.Template.Spec.Volumes = []corev1.Volume{
			{Name: "cert", VolumeSource: corev1.VolumeSource{
				Secret: &corev1.SecretVolumeSource{SecretName: "rlark-agent-cert"},
			}},
		}
		dep.Spec.Template.Spec.Containers[0].VolumeMounts = []corev1.VolumeMount{
			{Name: "cert", MountPath: "/etc/rlark/certs", ReadOnly: true},
		}
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
