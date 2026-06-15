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

// JobReconciler reconciles Job resources.
type JobReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=rlinf.io,resources=jobs,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=rlinf.io,resources=jobs/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=rlinf.io,resources=jobs/finalizers,verbs=update

// Reconcile handles a Job reconciliation request.
func (r *JobReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx).WithValues("job", req.NamespacedName)
	logger.Info("Reconciling Job")

	var job rlarkv1alpha1.Job
	if err := r.Get(ctx, req.NamespacedName, &job); err != nil {
		logger.Error(err, "unable to fetch Job")
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	logger.Info(fmt.Sprintf("Job %s/%s phase=%s", job.Namespace, job.Name, job.Status.Phase))

	// TODO: implement reconciliation logic
	// - resolve JobTaskTemplate into Task resources
	// - track task status and update job phase
	// - handle transitions: Pending → Running → Succeeded/Failed

	return ctrl.Result{}, nil
}

// SetupWithManager registers the controller with the manager.
func (r *JobReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&rlarkv1alpha1.Job{}).
		Named("job").
		Complete(r)
}
