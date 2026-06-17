package db

import (
	"time"

	"github.com/uptrace/bun"
)

// ----- Base Resource Model -----

// BaseResourceModel contains the common fields for all resource tables.
// Each resource type embeds this and overrides TableName().
type BaseResourceModel struct {
	// Primary key
	ID string `bun:"id,pk,notnull"`

	// Kubernetes metadata
	Namespace string `bun:"namespace"`
	Name      string `bun:"name,notnull"`
	UID       string `bun:"uid,notnull,unique"`

	// Timestamps
	CreatedAt time.Time  `bun:"created_at,notnull"`
	DeletedAt *time.Time `bun:"deleted_at,soft_delete"`

	// Raw resource data (spec + status + metadata) as JSON
	Raw map[string]interface{} `bun:"raw,type:jsonb,notnull"`
}

// IsDeleted returns true if the resource has been soft-deleted.
func (r *BaseResourceModel) IsDeleted() bool {
	return r.DeletedAt != nil
}

// ----- Resource-specific Models -----

// JobModel is the database model for Job resources.
type JobModel struct {
	bun.BaseModel `bun:"table:jobs,alias:j"`

	BaseResourceModel
}

// TableName returns the table name for JobModel.
func (JobModel) TableName() string {
	return "jobs"
}

// NodeModel is the database model for Node resources.
type NodeModel struct {
	bun.BaseModel `bun:"table:nodes,alias:n"`

	BaseResourceModel
}

// TableName returns the table name for NodeModel.
func (NodeModel) TableName() string {
	return "nodes"
}

// TaskModel is the database model for Task resources.
type TaskModel struct {
	bun.BaseModel `bun:"table:tasks,alias:t"`

	BaseResourceModel
}

// TableName returns the table name for TaskModel.
func (TaskModel) TableName() string {
	return "tasks"
}

// WorkflowModel is the database model for Workflow resources.
type WorkflowModel struct {
	bun.BaseModel `bun:"table:workflows,alias:w"`

	BaseResourceModel
}

// TableName returns the table name for WorkflowModel.
func (WorkflowModel) TableName() string {
	return "workflows"
}
