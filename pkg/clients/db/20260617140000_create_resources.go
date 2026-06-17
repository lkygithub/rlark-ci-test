package db

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"
)

func init() {
	Migrations.MustRegister(func(ctx context.Context, db *bun.DB) error {
		// Create tables for each resource type
		models := []interface{}{
			(*JobModel)(nil),
			(*NodeModel)(nil),
			(*TaskModel)(nil),
			(*WorkflowModel)(nil),
		}
		for _, m := range models {
			if _, err := db.NewCreateTable().Model(m).IfNotExists().Exec(ctx); err != nil {
				return fmt.Errorf("create table: %w", err)
			}
		}

		// Common indexes for all resource tables
		commonIndexes := map[string][]string{
			"jobs": {
				"CREATE INDEX IF NOT EXISTS idx_jobs_namespace_name ON jobs (namespace, name)",
				"CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs (deleted_at)",
				"CREATE INDEX IF NOT EXISTS idx_jobs_raw_phase ON jobs ((raw->>'status.phase'))",
				"CREATE INDEX IF NOT EXISTS idx_jobs_raw_labels_tenant ON jobs ((raw->'metadata.labels'->>'tenant'))",
			},
			"nodes": {
				"CREATE INDEX IF NOT EXISTS idx_nodes_name ON nodes (name)",
				"CREATE INDEX IF NOT EXISTS idx_nodes_deleted_at ON nodes (deleted_at)",
				"CREATE INDEX IF NOT EXISTS idx_nodes_raw_phase ON nodes ((raw->>'status.phase'))",
				"CREATE INDEX IF NOT EXISTS idx_nodes_raw_agent_type ON nodes ((raw->>'spec.agentType'))",
			},
			"tasks": {
				"CREATE INDEX IF NOT EXISTS idx_tasks_namespace_name ON tasks (namespace, name)",
				"CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks (deleted_at)",
				"CREATE INDEX IF NOT EXISTS idx_tasks_raw_phase ON tasks ((raw->>'status.phase'))",
				"CREATE INDEX IF NOT EXISTS idx_tasks_raw_agent_type ON tasks ((raw->>'spec.agentType'))",
				"CREATE INDEX IF NOT EXISTS idx_tasks_raw_role ON tasks ((raw->>'spec.role'))",
			},
			"workflows": {
				"CREATE INDEX IF NOT EXISTS idx_workflows_namespace_name ON workflows (namespace, name)",
				"CREATE INDEX IF NOT EXISTS idx_workflows_deleted_at ON workflows (deleted_at)",
				"CREATE INDEX IF NOT EXISTS idx_workflows_raw_phase ON workflows ((raw->>'status.phase'))",
				"CREATE INDEX IF NOT EXISTS idx_workflows_raw_labels_tenant ON workflows ((raw->'metadata.labels'->>'tenant'))",
			},
		}

		for table, indexes := range commonIndexes {
			for _, idx := range indexes {
				if _, err := db.ExecContext(ctx, idx); err != nil {
					return fmt.Errorf("create index on %s: %w", table, err)
				}
			}
		}

		return nil
	}, func(ctx context.Context, db *bun.DB) error {
		tables := []string{"workflows", "tasks", "nodes", "jobs"}
		for _, t := range tables {
			if _, err := db.ExecContext(ctx, "DROP TABLE IF EXISTS "+t+" CASCADE"); err != nil {
				return fmt.Errorf("drop table %s: %w", t, err)
			}
		}
		return nil
	})
}
