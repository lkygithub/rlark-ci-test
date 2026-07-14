package task

import (
	rlarkv1alpha1 "github.com/rlinf/rlark/api/rlark.io/v1alpha1"
	corev1 "k8s.io/api/core/v1"

	"github.com/rlinf/rlark/pkg/utils"
)

const (
	sidecarContainerName  = "rlark-network-sidecar"
	sidecarUnixSocketPath = "/run/rlark"
	sidecarVolumeName     = "rlark-nodeserver-socket"
)

func applyNetworkSidecar(template *corev1.PodTemplateSpec, mgmtTask *rlarkv1alpha1.Task, sidecarImage string) {
	if sidecarImage == "" || mgmtTask.Spec.Domain == "" {
		return
	}

	for i := range template.Spec.Containers {
		if template.Spec.Containers[i].Name == sidecarContainerName {
			return
		}
	}

	template.Spec.Containers = append(template.Spec.Containers, corev1.Container{
		Name:            sidecarContainerName,
		Image:           sidecarImage,
		ImagePullPolicy: corev1.PullIfNotPresent,
		SecurityContext: &corev1.SecurityContext{
			Privileged: utils.Ptr(true),
			Capabilities: &corev1.Capabilities{
				Add: []corev1.Capability{"NET_ADMIN"},
			},
		},
		VolumeMounts: []corev1.VolumeMount{
			{
				Name:      sidecarVolumeName,
				MountPath: sidecarUnixSocketPath,
			},
		},
	})

	template.Spec.Volumes = append(template.Spec.Volumes, corev1.Volume{
		Name: sidecarVolumeName,
		VolumeSource: corev1.VolumeSource{
			HostPath: &corev1.HostPathVolumeSource{
				Path: sidecarUnixSocketPath,
			},
		},
	})
}
