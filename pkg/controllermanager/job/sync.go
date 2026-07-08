package job

import (
	"context"
	"fmt"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"

	rlarkv1alpha1 "github.com/rlinf/rlark/api/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/log"
	"github.com/rlinf/rlark/pkg/utils"
)

func (r *JobReconciler) syncTaskStatuses(
	ctx context.Context,
	job *rlarkv1alpha1.Job,
) (bool, error) {
	statusMap := buildTaskStatusMap(job)
	changed := false

	for _, t := range job.Spec.Tasks {
		ts := statusMap[t.Name]
		if ts == nil || ts.Phase == "" {
			continue
		}

		taskName := utils.ChildName(job.Name, t.Name)
		taskNamespace := r.resolveTaskNamespace(ctx, &t)
		var task rlarkv1alpha1.Task
		err := r.Get(ctx, types.NamespacedName{Name: taskName, Namespace: taskNamespace}, &task)
		if err != nil {
			if errors.IsNotFound(err) {
				continue
			}
			return false, fmt.Errorf("get Task %s/%s: %w", taskNamespace, taskName, err)
		}
		if utils.SyncStatusEntry(ts, string(task.Status.Phase), task.Status.Message) {
			changed = true
		}
	}

	return changed, nil
}

func (r *JobReconciler) dispatchTasks(
	ctx context.Context,
	job *rlarkv1alpha1.Job,
	logger logr.Logger,
) (bool, error) {
	statusMap := buildTaskStatusMap(job)
	changed := false

	for _, t := range job.Spec.Tasks {
		ts := statusMap[t.Name]
		if ts != nil && ts.Phase != "" {
			continue
		}

		task, err := r.reconcileTask(ctx, job, t, logger)
		if err != nil {
			return false, err
		}
		if utils.SyncStatusEntry(ts, string(task.Status.Phase), task.Status.Message) {
			changed = true
		}
	}

	return changed, nil
}

func (r *JobReconciler) reconcileTask(
	ctx context.Context,
	job *rlarkv1alpha1.Job,
	t rlarkv1alpha1.JobTaskTemplate,
	logger logr.Logger,
) (*rlarkv1alpha1.Task, error) {
	taskNamespace := r.resolveTaskNamespace(ctx, &t)
	taskName := utils.ChildName(job.Name, t.Name)
	var task rlarkv1alpha1.Task
	err := r.Get(ctx, types.NamespacedName{Name: taskName, Namespace: taskNamespace}, &task)
	if err == nil {
		return &task, nil
	}
	if !errors.IsNotFound(err) {
		return nil, fmt.Errorf("get Task %s/%s: %w", taskNamespace, taskName, err)
	}

	newTask := buildTask(job, t, taskName, taskNamespace)
	if err := ctrl.SetControllerReference(job, newTask, r.Scheme); err != nil {
		return nil, fmt.Errorf("set controller reference on Task %s: %w", taskName, err)
	}
	if err := r.Create(ctx, newTask); err != nil && !errors.IsAlreadyExists(err) {
		return nil, fmt.Errorf("create Task %s/%s: %w", taskNamespace, taskName, err)
	}

	logger.Info("Created Task for job", "task", taskName, "namespace", taskNamespace)
	newTask.Status.Phase = rlarkv1alpha1.TaskPhasePending
	return newTask, nil
}

func (r *JobReconciler) reconcileWithStateMachine(
	ctx context.Context,
	job *rlarkv1alpha1.Job,
) (bool, error) {
	f := newJobStateMachine()
	f.SetState(string(job.Status.Phase))

	changed := false

	if f.Can(EventInit) {
		if err := f.Event(ctx, EventInit, job); err != nil {
			return false, err
		}
		changed = true
	}

	syncChanged, err := r.syncTaskStatuses(ctx, job)
	if err != nil {
		return false, err
	}
	if syncChanged {
		changed = true
	}

	dispatchChanged, err := r.dispatchTasks(ctx, job, log.FromContext(ctx))
	if err != nil {
		return false, err
	}
	if dispatchChanged {
		changed = true
	}

	event := r.evaluateJobEvent(job)
	if event != "" && f.Can(event) {
		if err := f.Event(ctx, event, job); err != nil {
			return false, err
		}
		changed = true
	}

	return changed, nil
}

func (r *JobReconciler) evaluateJobEvent(job *rlarkv1alpha1.Job) string {
	phases := make([]string, len(job.Status.Tasks))
	for i, ts := range job.Status.Tasks {
		phases[i] = string(ts.Phase)
	}
	s := utils.SummarizePhases(phases,
		string(rlarkv1alpha1.TaskPhaseSucceeded),
		string(rlarkv1alpha1.TaskPhaseFailed),
		string(rlarkv1alpha1.TaskPhaseRunning),
	)
	if s.AnyFailed {
		return EventAnyTaskFailed
	}
	if s.AllSucceeded && s.HasItems {
		return EventAllTasksDone
	}
	if s.AnyRunning {
		return EventTasksRunning
	}
	return ""
}
