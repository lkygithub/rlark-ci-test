package db

import (
	"time"
)

// ----- Task History -----

// TaskHistory represents a row in the task_history table.
type TaskHistory struct {
	ID            int64      `bun:",pk,autoincrement" json:"id"`
	TaskUID       string     `bun:"task_uid,type:text,notnull" json:"taskUid"`
	TaskName      string     `bun:"task_name,type:text,notnull" json:"taskName"`
	TaskNamespace string     `bun:"task_namespace,type:text,notnull" json:"taskNamespace"`
	AgentType     string     `bun:"agent_type,type:text,notnull" json:"agentType"`
	Phase         string     `bun:"phase,type:text,notnull,default:'Pending'" json:"phase"`
	NodeName      string     `bun:"node_name,type:text,notnull,default:''" json:"nodeName"`
	Message       string     `bun:"message,type:text,notnull,default:''" json:"message"`
	RetryCount    int32      `bun:"retry_count,notnull,default:0" json:"retryCount"`
	StartedAt     *time.Time `bun:"started_at,type:timestamptz" json:"startedAt,omitempty"`
	CompletedAt   *time.Time `bun:"completed_at,type:timestamptz" json:"completedAt,omitempty"`
	CreatedAt     time.Time  `bun:"created_at,type:timestamptz,notnull,default:now()" json:"createdAt"`
	UpdatedAt     time.Time  `bun:"updated_at,type:timestamptz,notnull,default:now()" json:"updatedAt"`
	RawData       any        `bun:"raw_data,type:jsonb" json:"rawData,omitempty"`
}
