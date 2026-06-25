package task

import (
	appsv1 "k8s.io/api/apps/v1"

	"github.com/rlinf/rlark/pkg/agent/controllers/base"
	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
)

type TaskController struct {
	base.BaseController
}

var _ base.Reconciler = (*TaskController)(nil)

func NewTaskController(bc base.BaseController) *TaskController {
	tc := &TaskController{
		BaseController: bc,
	}
	tc.C = tc
	return tc
}

func (c *TaskController) KubernetesResource() base.KubernetesResource {
	return base.KubernetesResource{
		Name: "task",
		Type: &rlarkv1alpha1.Task{},
	}
}

func (c *TaskController) AsPullReconciler() base.KubernetesReconciler {
	return &pullReconciler{c: c}
}

func (c *TaskController) AsKubePushReconcilers() map[base.KubernetesResource]base.KubernetesReconciler {
	return map[base.KubernetesResource]base.KubernetesReconciler{
		base.KubernetesResource{
			Name: "task-deployment",
			Type: &appsv1.Deployment{},
		}: &pushDeploymentReconciler{c: c},
		base.KubernetesResource{
			Name: "task-daemonset",
			Type: &appsv1.DaemonSet{},
		}: &pushDaemonSetReconciler{c: c},
		base.KubernetesResource{
			Name: "task-statefulset",
			Type: &appsv1.StatefulSet{},
		}: &pushStatefulSetReconciler{c: c},
	}
}

func (c *TaskController) AsDockerPushReconcilers() map[base.DockerResource]base.DockerReconciler {
	return nil
}

func (c *TaskController) AsRawPushReconcilers() map[base.RawResource]base.RawReconciler {
	return nil
}
