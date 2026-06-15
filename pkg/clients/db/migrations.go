package db

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/migrate"
)

// Migrations is the registry of all database migrations.
// Registered in init() so they're available on package import.
var Migrations = migrate.NewMigrations()

func init() {
	// 20260615_001_initial_tables
	Migrations.MustRegister(
		func(ctx context.Context, db *bun.DB) error {
			if _, err := db.NewCreateTable().
				Model((*TaskHistory)(nil)).
				IfNotExists().
				Exec(ctx); err != nil {
				return fmt.Errorf("create task_history: %w", err)
			}

			for _, idx := range []string{
				"CREATE INDEX IF NOT EXISTS idx_task_history_uid       ON task_history (task_uid)",
				"CREATE INDEX IF NOT EXISTS idx_task_history_phase     ON task_history (phase)",
				"CREATE INDEX IF NOT EXISTS idx_task_history_namespace ON task_history (task_namespace)",
				"CREATE INDEX IF NOT EXISTS idx_task_history_node      ON task_history (node_name)",
			} {
				if _, err := db.ExecContext(ctx, idx); err != nil {
					return fmt.Errorf("create index: %w", err)
				}
			}
			return nil
		},
		func(ctx context.Context, db *bun.DB) error {
			if _, err := db.NewDropTable().
				Model((*TaskHistory)(nil)).
				IfExists().
				Exec(ctx); err != nil {
				return fmt.Errorf("drop task_history: %w", err)
			}

			for _, idx := range []string{
				"idx_task_history_uid",
				"idx_task_history_phase",
				"idx_task_history_namespace",
				"idx_task_history_node",
			} {
				if _, err := db.ExecContext(ctx,
					"DROP INDEX IF EXISTS "+idx); err != nil {
					return fmt.Errorf("drop index %s: %w", idx, err)
				}
			}
			return nil
		},
	)
}
