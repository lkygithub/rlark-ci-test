package persistencer

import (
	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/clients/db"
)

// TaskSyncHandler handles syncing Task resources.
type TaskSyncHandler struct {
	*GenericSyncHandlerImpl[*rlarkv1alpha1.Task, *db.TaskModel]
}

// NewTaskSyncHandler creates a new sync handler for Task resources.
func NewTaskSyncHandler() *TaskSyncHandler {
	return &TaskSyncHandler{
		GenericSyncHandlerImpl: NewGenericSyncHandler[*rlarkv1alpha1.Task, *db.TaskModel](
			"tasks.rlinf.io",
			func() *db.TaskModel { return &db.TaskModel{} },
			extractTaskIndexFields,
			WithShouldSync[*rlarkv1alpha1.Task, *db.TaskModel](shouldSyncTask),
		),
	}
}

func shouldSyncTask(task *rlarkv1alpha1.Task) bool {
	if _, ok := task.Annotations["skip-sync"]; ok {
		return false
	}
	return true
}

func extractTaskIndexFields(task *rlarkv1alpha1.Task) map[string]interface{} {
	fields := make(map[string]interface{})
	if task.Status.Phase != "" {
		fields["status.phase"] = string(task.Status.Phase)
	}
	if task.Spec.AgentType != "" {
		fields["spec.agentType"] = string(task.Spec.AgentType)
	}
	if task.Spec.Role != "" {
		fields["spec.role"] = string(task.Spec.Role)
	}
	return fields
}
