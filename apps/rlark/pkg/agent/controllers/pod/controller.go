package pod

import (
	corev1 "k8s.io/api/core/v1"

	rlarkv1alpha1 "github.com/rlinf/rlark/api/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/apps/rlark/pkg/agent/controllers/base"
)

// PodController manages pod reporting from data-plane to management cluster.
type PodController struct {
	base.BaseController
}

var _ base.Reconciler = (*PodController)(nil)

func NewPodController(bc base.BaseController) *PodController {
	pc := &PodController{
		BaseController: bc,
	}
	pc.C = pc
	return pc
}

func (c *PodController) KubernetesResource() base.KubernetesResource {
	return base.KubernetesResource{
		Name: "pod",
		Type: &rlarkv1alpha1.Pod{},
	}
}

// AsPullReconciler returns nil — Pod CR is push-only, no need to create local resources from management Pod CRs.
func (c *PodController) AsPullReconciler() base.KubernetesReconciler {
	return nil
}

// AsKubePushReconcilers watches local K8s Pods and reports their info to management Pod CRs.
func (c *PodController) AsKubePushReconcilers() map[base.KubernetesResource]base.KubernetesReconciler {
	return map[base.KubernetesResource]base.KubernetesReconciler{
		base.KubernetesResource{
			Name: "pod-k8spod",
			Type: &corev1.Pod{},
		}: &pushPodReconciler{c: c},
	}
}

func (c *PodController) AsDockerPushReconcilers() map[base.DockerResource]base.DockerReconciler {
	return nil
}

func (c *PodController) AsRawPushReconcilers() map[base.RawResource]base.RawReconciler {
	return nil
}
