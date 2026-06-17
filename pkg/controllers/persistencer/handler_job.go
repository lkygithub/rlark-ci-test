package persistencer

import (
	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/clients/db"
)

// JobSyncHandler handles syncing Job resources.
type JobSyncHandler struct {
	*GenericSyncHandlerImpl[*rlarkv1alpha1.Job, *db.JobModel]
}

// NewJobSyncHandler creates a new sync handler for Job resources.
func NewJobSyncHandler() *JobSyncHandler {
	return &JobSyncHandler{
		GenericSyncHandlerImpl: NewGenericSyncHandler[*rlarkv1alpha1.Job, *db.JobModel](
			"jobs.rlinf.io",
			func() *db.JobModel { return &db.JobModel{} },
			extractJobIndexFields,
			WithShouldSync[*rlarkv1alpha1.Job, *db.JobModel](shouldSyncJob),
		),
	}
}

// shouldSyncJob returns true if the Job should be synced.
func shouldSyncJob(job *rlarkv1alpha1.Job) bool {
	if _, ok := job.Annotations["skip-sync"]; ok {
		return false
	}
	return true
}

// extractJobIndexFields extracts index fields from a Job resource.
func extractJobIndexFields(job *rlarkv1alpha1.Job) map[string]interface{} {
	fields := make(map[string]interface{})
	if job.Status.Phase != "" {
		fields["status.phase"] = string(job.Status.Phase)
	}
	if tenant, ok := job.Labels["tenant"]; ok {
		fields["metadata.labels.tenant"] = tenant
	}
	return fields
}
