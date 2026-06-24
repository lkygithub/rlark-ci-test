package workflow

import (
	"context"

	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/controllermanager/controller"
)

// WorkflowReconciler reconciles Workflow resources.
type WorkflowReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=rlinf.io,resources=workflows,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=rlinf.io,resources=workflows/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=rlinf.io,resources=workflows/finalizers,verbs=update
// +kubebuilder:rbac:groups=rlinf.io,resources=jobs,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=rlinf.io,resources=jobs/status,verbs=get;update;patch

// Reconcile handles a Workflow reconciliation request.
func (r *WorkflowReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	return controller.ReconcileWith(ctx, req, &rlarkv1alpha1.Workflow{}, "workflow", r)
}

func (r *WorkflowReconciler) IsTerminal(obj client.Object) bool {
	wf := obj.(*rlarkv1alpha1.Workflow)
	return wf.Status.Phase == rlarkv1alpha1.WorkflowPhaseSucceeded ||
		wf.Status.Phase == rlarkv1alpha1.WorkflowPhaseFailed
}

func (r *WorkflowReconciler) ReconcileStateMachine(ctx context.Context, obj client.Object) (bool, error) {
	return r.reconcileWithStateMachine(ctx, obj.(*rlarkv1alpha1.Workflow))
}

// SetupWithManager registers the controller with the manager.
func (r *WorkflowReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&rlarkv1alpha1.Workflow{}).
		Owns(&rlarkv1alpha1.Job{}).
		Named("workflow").
		Complete(r)
}
