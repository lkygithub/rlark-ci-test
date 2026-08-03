package task

import (
	"fmt"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	rlarkv1alpha1 "github.com/rlinf/rlark/api/rlark.io/v1alpha1"
)

const (
	rayScriptMountPath = "/rlark/scripts"
	rayCheckScriptName = "ray_check.py"
	rayPort            = "6379"

	rayInitVolumeName = "ray-init-scripts"
)

type rayRoleConfig struct {
	configMapName string
	scriptName    string
	scriptContent string
}

var rayRoleConfigs = map[string]rayRoleConfig{
	rlarkv1alpha1.RayRoleHead: {
		configMapName: "ray-head-init",
		scriptName:    "ray_head.sh",
		scriptContent: rayHeadScript,
	},
	rlarkv1alpha1.RayRoleWorker: {
		configMapName: "ray-worker-init",
		scriptName:    "ray_worker.sh",
		scriptContent: rayWorkerScript,
	},
}

func buildRayConfigMap(namespace, role string) *corev1.ConfigMap {
	cfg := rayRoleConfigs[role]
	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      cfg.configMapName,
			Namespace: namespace,
		},
		Data: map[string]string{
			cfg.scriptName:     cfg.scriptContent,
			rayCheckScriptName: rayCheckScript,
		},
	}
}

func rayHeadServiceName(taskName string) string {
	return fmt.Sprintf("%s-ray-head", taskName)
}

func buildRayHeadService(namespace, taskName string) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      rayHeadServiceName(taskName),
			Namespace: namespace,
			Labels: map[string]string{
				"app":                  taskName,
				"prometheus.io/scrape": "true",
				"prometheus.io/port":   "8080",
			},
		},
		Spec: corev1.ServiceSpec{
			ClusterIP:                "None",
			PublishNotReadyAddresses: true,
			Selector: map[string]string{
				"app": taskName,
			},
			Ports: []corev1.ServicePort{
				{
					Name:     "ray",
					Port:     6379,
					Protocol: corev1.ProtocolTCP,
				},
				{
					Name:     "dashboard",
					Port:     8265,
					Protocol: corev1.ProtocolTCP,
				},
				{
					Name:     "metrics",
					Port:     8080,
					Protocol: corev1.ProtocolTCP,
				},
			},
		},
	}
}

func applyRayInit(template *corev1.PodTemplateSpec, mgmtTask *rlarkv1alpha1.Task) {
	annotations := mgmtTask.Annotations
	if annotations == nil {
		return
	}

	role := annotations[rlarkv1alpha1.RayRoleAnnotation]
	cfg, ok := rayRoleConfigs[role]
	if !ok {
		return
	}

	for i := range template.Spec.Containers {
		c := &template.Spec.Containers[i]
		if c.Name != "main" {
			continue
		}

		envs := []corev1.EnvVar{{Name: "RLARK_RAY_PORT", Value: rayPort}}
		if mgmtTask.Spec.PrepareScript != "" {
			envs = append(envs, corev1.EnvVar{Name: "RLARK_PREPARE_SCRIPT", Value: mgmtTask.Spec.PrepareScript})
		}
		if role == rlarkv1alpha1.RayRoleHead && mgmtTask.Spec.RunScript != "" {
			envs = append(envs, corev1.EnvVar{Name: "RLARK_RUN_SCRIPT", Value: mgmtTask.Spec.RunScript})
		}

		// Inject RLARK_NODE_RANK_START and POD_NAME (via Downward API) for rank computation
		envs = append(envs,
			corev1.EnvVar{Name: "RLARK_NODE_RANK_START", Value: annotations[rlarkv1alpha1.RayNodeRankStartAnnotation]},
			corev1.EnvVar{
				Name: "POD_NAME",
				ValueFrom: &corev1.EnvVarSource{
					FieldRef: &corev1.ObjectFieldSelector{
						FieldPath: "metadata.name",
					},
				},
			},
		)

		if role == rlarkv1alpha1.RayRoleHead {
			envs = append(envs,
				corev1.EnvVar{Name: "RLARK_TOTAL_NODES", Value: annotations[rlarkv1alpha1.RayTotalNodesAnnotation]},
				corev1.EnvVar{
					Name: "RLARK_NODE_IP",
					ValueFrom: &corev1.EnvVarSource{
						FieldRef: &corev1.ObjectFieldSelector{
							FieldPath: "status.podIP",
						},
					},
				},
			)
		} else {
			headTaskName := annotations[rlarkv1alpha1.RayHeadTaskNameAnnotation]
			if headTaskName != "" {
				envs = append(envs, corev1.EnvVar{Name: "RLARK_HEAD_ADDRESS", Value: rayHeadServiceName(headTaskName)})
			}
		}

		c.Env = append(c.Env, envs...)
		c.Command = []string{"bash", rayScriptMountPath + "/" + cfg.scriptName}
		c.VolumeMounts = append(c.VolumeMounts, corev1.VolumeMount{
			Name:      rayInitVolumeName,
			MountPath: rayScriptMountPath,
		})
		break
	}

	template.Spec.Volumes = append(template.Spec.Volumes, corev1.Volume{
		Name: rayInitVolumeName,
		VolumeSource: corev1.VolumeSource{
			ConfigMap: &corev1.ConfigMapVolumeSource{
				LocalObjectReference: corev1.LocalObjectReference{
					Name: cfg.configMapName,
				},
			},
		},
	})
}
