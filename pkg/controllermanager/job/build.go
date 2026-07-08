package job

import (
	"context"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"sigs.k8s.io/controller-runtime/pkg/client"

	rlarkv1alpha1 "github.com/rlinf/rlark/api/rlark.io/v1alpha1"
)

func (r *JobReconciler) resolveTaskNamespace(ctx context.Context, t *rlarkv1alpha1.JobTaskTemplate) string {
	if len(t.NodeSelector) == 0 {
		return "default"
	}

	selector := labels.SelectorFromSet(t.NodeSelector)

	var nodeList rlarkv1alpha1.NodeList
	if err := r.List(ctx, &nodeList, &client.ListOptions{LabelSelector: selector}); err != nil {
		return "default"
	}

	if len(nodeList.Items) == 0 {
		return "default"
	}

	return nodeList.Items[0].Namespace
}

func buildTaskStatusMap(job *rlarkv1alpha1.Job) map[string]*rlarkv1alpha1.JobTaskStatus {
	m := make(map[string]*rlarkv1alpha1.JobTaskStatus, len(job.Status.Tasks))
	for i := range job.Status.Tasks {
		m[job.Status.Tasks[i].Name] = &job.Status.Tasks[i]
	}
	return m
}

func buildTask(
	job *rlarkv1alpha1.Job,
	t rlarkv1alpha1.JobTaskTemplate,
	taskName, namespace string,
) *rlarkv1alpha1.Task {
	taskSpec := t.TaskSpec
	taskSpec.Domain = job.Spec.Domain // 从 Job 继承 Domain
	return &rlarkv1alpha1.Task{
		ObjectMeta: metav1.ObjectMeta{
			Name:      taskName,
			Namespace: namespace,
			Labels: map[string]string{
				"rlinf.io/job": job.Name,
			},
		},
		Spec: taskSpec,
	}
}
