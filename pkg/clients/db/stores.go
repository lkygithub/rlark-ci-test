package db

import (
	"context"

	"github.com/uptrace/bun"
)

// TaskHistoryStore provides CRUD for task execution history.
type TaskHistoryStore interface {
	Create(ctx context.Context, record *TaskHistory) error
	GetByUID(ctx context.Context, uid string) (*TaskHistory, error)
	ListByNamespace(ctx context.Context, namespace string, limit, offset int) ([]TaskHistory, error)
	ListByPhase(ctx context.Context, phase string, limit, offset int) ([]TaskHistory, error)
	UpdatePhase(ctx context.Context, id int64, phase, message, nodeName string) error
	Delete(ctx context.Context, id int64) error
}

type taskHistoryStore struct {
	db *bun.DB
}

func newTaskHistoryStore(db *bun.DB) TaskHistoryStore {
	return &taskHistoryStore{db: db}
}

func (s *taskHistoryStore) Create(ctx context.Context, record *TaskHistory) error {
	_, err := s.db.NewInsert().Model(record).Exec(ctx)
	return err
}

func (s *taskHistoryStore) GetByUID(ctx context.Context, uid string) (*TaskHistory, error) {
	record := new(TaskHistory)
	err := s.db.NewSelect().
		Model(record).
		Where("task_uid = ?", uid).
		Order("id DESC").
		Limit(1).
		Scan(ctx)
	return record, err
}

func (s *taskHistoryStore) ListByNamespace(ctx context.Context, namespace string, limit, offset int) ([]TaskHistory, error) {
	var records []TaskHistory
	err := s.db.NewSelect().
		Model(&records).
		Where("task_namespace = ?", namespace).
		Order("id DESC").
		Limit(limit).Offset(offset).
		Scan(ctx)
	return records, err
}

func (s *taskHistoryStore) ListByPhase(ctx context.Context, phase string, limit, offset int) ([]TaskHistory, error) {
	var records []TaskHistory
	err := s.db.NewSelect().
		Model(&records).
		Where("phase = ?", phase).
		Order("id DESC").
		Limit(limit).Offset(offset).
		Scan(ctx)
	return records, err
}

func (s *taskHistoryStore) UpdatePhase(ctx context.Context, id int64, phase, message, nodeName string) error {
	_, err := s.db.NewUpdate().
		Model((*TaskHistory)(nil)).
		Set("phase = ?", phase).
		Set("message = ?", message).
		Set("node_name = ?", nodeName).
		Set("updated_at = now()").
		Where("id = ?", id).
		Exec(ctx)
	return err
}

func (s *taskHistoryStore) Delete(ctx context.Context, id int64) error {
	_, err := s.db.NewDelete().
		Model((*TaskHistory)(nil)).
		Where("id = ?", id).
		Exec(ctx)
	return err
}
