package addon

import (
	rlarkv1alpha1 "github.com/rlinf/rlark/api/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/agent/controllers/base"
)

const (
	AddonFinalizer = "rlark.io/agent-cleanup"
)

type AddonController struct {
	base.BaseController
}

var _ base.Reconciler = (*AddonController)(nil)

func NewAddonController(bc base.BaseController) *AddonController {
	ac := &AddonController{BaseController: bc}
	ac.C = ac
	return ac
}

func (c *AddonController) KubernetesResource() base.KubernetesResource {
	return base.KubernetesResource{
		Name: "addon",
		Type: &rlarkv1alpha1.Addon{},
	}
}

func (c *AddonController) AsPullReconciler() base.KubernetesReconciler {
	return &pullReconciler{c: c}
}

func (c *AddonController) AsKubePushReconcilers() map[base.KubernetesResource]base.KubernetesReconciler {
	return nil
}

func (c *AddonController) AsDockerPushReconcilers() map[base.DockerResource]base.DockerReconciler {
	return nil
}

func (c *AddonController) AsRawPushReconcilers() map[base.RawResource]base.RawReconciler {
	return nil
}