package job

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
)

func resolveTaskNamespace(t *rlarkv1alpha1.JobTaskTemplate) string {
	// todo 需要根据 node 找到 cluster id
	return "default"
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
