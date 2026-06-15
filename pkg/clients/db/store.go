package db

import (
	"context"

	"github.com/uptrace/bun"
)

// Store groups all repository interfaces into a single dependency.
type Store struct {
	db          *bun.DB
	TaskHistory TaskHistoryStore
}

// NewStore creates a Store with all repositories backed by Bun.
func NewStore(db *bun.DB) *Store {
	return &Store{
		db:          db,
		TaskHistory: newTaskHistoryStore(db),
	}
}

// DB returns the underlying Bun database handle for raw queries.
func (s *Store) DB() *bun.DB {
	return s.db
}

// HealthCheck pings the database.
func (s *Store) HealthCheck(ctx context.Context) error {
	return s.db.PingContext(ctx)
}
