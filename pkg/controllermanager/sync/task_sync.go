package sync

import (
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/clients/db"
)

// newTaskSyncHandler creates a new sync handler for Task resources.
func newTaskSyncHandler() Handler {
	return &genericSyncHandler{
		tableName:    "tasks",
		resourceType: "tasks.rlinf.io",
		wrapBaseModel: func(base db.BaseResourceModel) db.ResourceModel {
			return &db.TaskModel{BaseResourceModel: base}
		},
		wrapLatestBaseModel: func(base db.BaseResourceModel) db.ResourceModel {
			return &db.LatestTaskModel{BaseResourceModel: base}
		},
	}
}

// TaskReconciler reconciles Task resources.
type TaskReconciler struct {
	config Config
	*genericReconciler[*rlarkv1alpha1.Job]
}

// +kubebuilder:rbac:groups=rlinf.io,resources=tasks,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=rlinf.io,resources=tasks/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=rlinf.io,resources=tasks/finalizers,verbs=update

func NewTaskReconciler(config Config, client client.Client, scheme *runtime.Scheme) *TaskReconciler {
	return &TaskReconciler{
		config: config,
		genericReconciler: &genericReconciler[*rlarkv1alpha1.Job]{
			client:  client,
			handler: newTaskSyncHandler(),
		},
	}
}

// SetupWithManager registers the controller with the manager.
func (r *TaskReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&rlarkv1alpha1.Task{}).
		WithOptions(r.config.ToControllerOptions()).
		Named("task").
		Complete(r)
}
