package controllers

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"

	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
)

// WorkflowReconciler reconciles Workflow resources.
type WorkflowReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=rlinf.io,resources=workflows,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=rlinf.io,resources=workflows/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=rlinf.io,resources=workflows/finalizers,verbs=update

// Reconcile handles a Workflow reconciliation request.
func (r *WorkflowReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx).WithValues("workflow", req.NamespacedName)
	logger.Info("Reconciling Workflow")

	var wf rlarkv1alpha1.Workflow
	if err := r.Get(ctx, req.NamespacedName, &wf); err != nil {
		logger.Error(err, "unable to fetch Workflow")
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	logger.Info(fmt.Sprintf("Workflow %s/%s phase=%s", wf.Namespace, wf.Name, wf.Status.Phase))

	// TODO: implement reconciliation logic
	// - resolve DAG: create Job resources based on WorkflowJobTemplate.Dependencies
	// - track job status and advance workflow phase
	// - handle transitions: Pending → Running → Succeeded/Failed

	return ctrl.Result{}, nil
}

// SetupWithManager registers the controller with the manager.
func (r *WorkflowReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&rlarkv1alpha1.Workflow{}).
		Named("workflow").
		Complete(r)
}
