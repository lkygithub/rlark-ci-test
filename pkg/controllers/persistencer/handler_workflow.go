package persistencer

import (
	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/clients/db"
)

// WorkflowSyncHandler handles syncing Workflow resources.
type WorkflowSyncHandler struct {
	*GenericSyncHandlerImpl[*rlarkv1alpha1.Workflow, *db.WorkflowModel]
}

// NewWorkflowSyncHandler creates a new sync handler for Workflow resources.
func NewWorkflowSyncHandler() *WorkflowSyncHandler {
	return &WorkflowSyncHandler{
		GenericSyncHandlerImpl: NewGenericSyncHandler[*rlarkv1alpha1.Workflow, *db.WorkflowModel](
			"workflows.rlinf.io",
			func() *db.WorkflowModel { return &db.WorkflowModel{} },
			extractWorkflowIndexFields,
			WithShouldSync[*rlarkv1alpha1.Workflow, *db.WorkflowModel](shouldSyncWorkflow),
		),
	}
}

func shouldSyncWorkflow(workflow *rlarkv1alpha1.Workflow) bool {
	if _, ok := workflow.Annotations["skip-sync"]; ok {
		return false
	}
	return true
}

func extractWorkflowIndexFields(workflow *rlarkv1alpha1.Workflow) map[string]interface{} {
	fields := make(map[string]interface{})
	if workflow.Status.Phase != "" {
		fields["status.phase"] = string(workflow.Status.Phase)
	}
	if tenant, ok := workflow.Labels["tenant"]; ok {
		fields["metadata.labels.tenant"] = tenant
	}
	return fields
}
