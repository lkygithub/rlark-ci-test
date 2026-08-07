package node

import (
	corev1 "k8s.io/api/core/v1"

	rlarkv1alpha1 "github.com/rlinf/rlark/api/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/apps/rlark/pkg/agent/controllers/base"
)

// NodeController manages node reporting from data-plane to management cluster.
type NodeController struct {
	base.BaseController
}

var _ base.Reconciler = (*NodeController)(nil)

func NewNodeController(bc base.BaseController) *NodeController {
	nc := &NodeController{
		BaseController: bc,
	}
	nc.C = nc
	return nc
}

func (c *NodeController) KubernetesResource() base.KubernetesResource {
	return base.KubernetesResource{
		Name: "node",
		Type: &rlarkv1alpha1.Node{},
	}
}

func (c *NodeController) AsPullReconciler() base.KubernetesReconciler {
	return &pullNodeReconciler{c: c}
}

func (c *NodeController) AsKubePushReconcilers() map[base.KubernetesResource]base.KubernetesReconciler {
	return map[base.KubernetesResource]base.KubernetesReconciler{
		base.KubernetesResource{
			Name: "node-k8snode",
			Type: &corev1.Node{},
		}: &pushNodeReconciler{c: c},
	}
}

func (c *NodeController) AsDockerPushReconcilers() map[base.DockerResource]base.DockerReconciler {
	return nil
}

func (c *NodeController) AsRawPushReconcilers() map[base.RawResource]base.RawReconciler {
	return nil
}
