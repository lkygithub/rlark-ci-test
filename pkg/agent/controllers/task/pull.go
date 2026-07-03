package task

import (
	"context"
	"fmt"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
)

const (
	ManagementTaskNameAnnotation      = "rlark.io/management-task-name"
	ManagementTaskNamespaceAnnotation = "rlark.io/management-task-namespace"
	ManagementTaskUIDAnnotation       = "rlark.io/management-task-uid"
	ManagementTaskDomainAnnotation    = "rlark.io/management-task-domain"
	ManagementTaskFinalizer           = "rlark.io/agent-cleanup"
)

// pullReconciler watches management Tasks and creates workloads on local cluster.
type pullReconciler struct {
	c *TaskController
}

func (r *pullReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
	logger := log.FromContext(ctx).WithValues("task", req.NamespacedName)

	var mgmtTask rlarkv1alpha1.Task
	if err := r.c.ManagementClient.Get(ctx, req.NamespacedName, &mgmtTask); err != nil {
		if client.IgnoreNotFound(err) == nil {
			logger.Info("management Task deleted, cleaning up local workload")
			if cleanupErr := r.cleanupWorkload(ctx, req.Name, req.Namespace); cleanupErr != nil {
				logger.Error(cleanupErr, "failed to clean up workload")
			}
			return reconcile.Result{}, nil
		}
		return reconcile.Result{}, err
	}

	// Handle deletion: clean up local workload and remove finalizer
	if mgmtTask.DeletionTimestamp != nil {
		logger.Info("management Task being deleted, cleaning up local workload")
		workloadNs := getWorkloadNamespace(&mgmtTask)
		if err := r.cleanupWorkload(ctx, mgmtTask.Name, workloadNs); err != nil {
			logger.Error(err, "failed to clean up workload")
			return reconcile.Result{}, err
		}
		mgmtTask.Finalizers = removeString(mgmtTask.Finalizers, ManagementTaskFinalizer)
		if err := r.c.ManagementClient.Update(ctx, &mgmtTask); err != nil {
			logger.Error(err, "failed to remove finalizer")
			return reconcile.Result{}, err
		}
		return reconcile.Result{}, nil
	}

	// Add finalizer if not present
	if !containsString(mgmtTask.Finalizers, ManagementTaskFinalizer) {
		mgmtTask.Finalizers = append(mgmtTask.Finalizers, ManagementTaskFinalizer)
		if err := r.c.ManagementClient.Update(ctx, &mgmtTask); err != nil {
			logger.Error(err, "failed to add finalizer")
			return reconcile.Result{}, err
		}
		return reconcile.Result{Requeue: true}, nil
	}

	// Compare mgmtTask.Spec.AgentType with controller AgentType — skip if mismatch
	if mgmtTask.Spec.AgentType != rlarkv1alpha1.AgentType(r.c.AgentType) {
		logger.Info(fmt.Sprintf("Task AgentType %s does not match controller AgentType %s, skipping", mgmtTask.Spec.AgentType, r.c.AgentType))
		return reconcile.Result{}, nil
	}

	if mgmtTask.Spec.Kubernetes == nil || mgmtTask.Spec.Kubernetes.Workload == nil {
		logger.Info("Task has no Kubernetes workload spec, skipping")
		return reconcile.Result{}, nil
	}

	workloadSpec := mgmtTask.Spec.Kubernetes.Workload

	switch workloadSpec.Kind {
	case rlarkv1alpha1.KubernetesWorkloadDeployment:
		return r.createOrUpdateDeployment(ctx, &mgmtTask, workloadSpec)
	case rlarkv1alpha1.KubernetesWorkloadDaemonSet:
		return r.createOrUpdateDaemonSet(ctx, &mgmtTask, workloadSpec)
	case rlarkv1alpha1.KubernetesWorkloadStatefulSet:
		return r.createOrUpdateStatefulSet(ctx, &mgmtTask, workloadSpec)
	default:
		logger.Info(fmt.Sprintf("unknown workload kind: %s, skipping", workloadSpec.Kind))
		return reconcile.Result{}, nil
	}
}

// createOrUpdateWorkload is a generic helper that handles the create-or-update pattern for all workload types.
// existingObj is a pre-allocated empty object for Get, newObj is the fully-built object for Create,
// applyUpdate is a callback that applies spec changes to the existing object when UID annotation mismatches.
func (r *pullReconciler) createOrUpdateWorkload(
	ctx context.Context,
	mgmtTask *rlarkv1alpha1.Task,
	workloadKind string,
	existingObj client.Object,
	newObj client.Object,
	applyUpdate func(existingObj client.Object),
) (reconcile.Result, error) {
	logger := log.FromContext(ctx)
	key := types.NamespacedName{Name: newObj.GetName(), Namespace: newObj.GetNamespace()}

	err := r.c.LocalKubeClient.Get(ctx, key, existingObj)
	if err != nil && client.IgnoreNotFound(err) != nil {
		return reconcile.Result{}, err
	}

	if err != nil {
		// NotFound — create
		logger.Info(fmt.Sprintf("creating %s", workloadKind))
		if err := r.c.LocalKubeClient.Create(ctx, newObj); err != nil {
			logger.Error(err, fmt.Sprintf("failed to create %s", workloadKind))
			return reconcile.Result{}, err
		}
		return reconcile.Result{}, nil
	}

	// Found — check UID annotation and apply update if mismatch
	annotations := existingObj.GetAnnotations()
	if annotations == nil || annotations[ManagementTaskUIDAnnotation] != string(mgmtTask.UID) {
		logger.Info(fmt.Sprintf("%s UID mismatch, updating", workloadKind))
		applyUpdate(existingObj)
		if err := r.c.LocalKubeClient.Update(ctx, existingObj); err != nil {
			logger.Error(err, fmt.Sprintf("failed to update %s", workloadKind))
			return reconcile.Result{}, err
		}
	}
	return reconcile.Result{}, nil
}

func (r *pullReconciler) createOrUpdateDeployment(ctx context.Context, mgmtTask *rlarkv1alpha1.Task, spec *rlarkv1alpha1.KubernetesWorkloadSpec) (reconcile.Result, error) {
	return r.createOrUpdateWorkload(ctx, mgmtTask, "Deployment",
		&appsv1.Deployment{},
		buildDeployment(mgmtTask, spec),
		func(obj client.Object) {
			deploy := obj.(*appsv1.Deployment)
			if deploy.Annotations == nil {
				deploy.Annotations = make(map[string]string)
			}
			deploy.Annotations[ManagementTaskUIDAnnotation] = string(mgmtTask.UID)
			deploy.Spec.Replicas = spec.Replicas
			deploy.Spec.Template = spec.Template
		})
}

func (r *pullReconciler) createOrUpdateDaemonSet(ctx context.Context, mgmtTask *rlarkv1alpha1.Task, spec *rlarkv1alpha1.KubernetesWorkloadSpec) (reconcile.Result, error) {
	return r.createOrUpdateWorkload(ctx, mgmtTask, "DaemonSet",
		&appsv1.DaemonSet{},
		buildDaemonSet(mgmtTask, spec),
		func(obj client.Object) {
			ds := obj.(*appsv1.DaemonSet)
			if ds.Annotations == nil {
				ds.Annotations = make(map[string]string)
			}
			ds.Annotations[ManagementTaskUIDAnnotation] = string(mgmtTask.UID)
			ds.Spec.Template = spec.Template
		})
}

func (r *pullReconciler) createOrUpdateStatefulSet(ctx context.Context, mgmtTask *rlarkv1alpha1.Task, spec *rlarkv1alpha1.KubernetesWorkloadSpec) (reconcile.Result, error) {
	return r.createOrUpdateWorkload(ctx, mgmtTask, "StatefulSet",
		&appsv1.StatefulSet{},
		buildStatefulSet(mgmtTask, spec),
		func(obj client.Object) {
			sts := obj.(*appsv1.StatefulSet)
			if sts.Annotations == nil {
				sts.Annotations = make(map[string]string)
			}
			sts.Annotations[ManagementTaskUIDAnnotation] = string(mgmtTask.UID)
			sts.Spec.Replicas = spec.Replicas
			sts.Spec.Template = spec.Template
		})
}

func (r *pullReconciler) cleanupWorkload(ctx context.Context, name string, namespace string) error {
	if r.c.LocalKubeClient == nil {
		return nil
	}
	workloadKey := types.NamespacedName{Name: name, Namespace: namespace}

	for _, obj := range []client.Object{&appsv1.Deployment{}, &appsv1.DaemonSet{}, &appsv1.StatefulSet{}} {
		if err := r.c.LocalKubeClient.Get(ctx, workloadKey, obj); err == nil {
			if err := r.c.LocalKubeClient.Delete(ctx, obj); err != nil {
				return err
			}
		}
	}
	return nil
}

func getWorkloadNamespace(mgmtTask *rlarkv1alpha1.Task) string {
	if mgmtTask.Spec.Kubernetes != nil && mgmtTask.Spec.Kubernetes.Workload != nil {
		if ns := mgmtTask.Spec.Kubernetes.Workload.Template.Namespace; ns != "" {
			return ns
		}
	}
	return mgmtTask.Namespace
}

// --- workload builder functions ---

// ensureLabels ensures the pod template has labels, adding a default if none are set.
func ensureLabels(template *corev1.PodTemplateSpec, name string) {
	if template.Labels == nil || len(template.Labels) == 0 {
		template.Labels = map[string]string{
			"app": name,
		}
	}
}

func buildDeployment(mgmtTask *rlarkv1alpha1.Task, spec *rlarkv1alpha1.KubernetesWorkloadSpec) *appsv1.Deployment {
	applyDomainAnnotation(&spec.Template, mgmtTask)
	ensureLabels(&spec.Template, mgmtTask.Name)
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      mgmtTask.Name,
			Namespace: getWorkloadNamespace(mgmtTask),
			Annotations: map[string]string{
				ManagementTaskNameAnnotation:      mgmtTask.Name,
				ManagementTaskNamespaceAnnotation: mgmtTask.Namespace,
				ManagementTaskUIDAnnotation:       string(mgmtTask.UID),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: spec.Replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: spec.Template.Labels,
			},
			Template: spec.Template,
		},
	}
}

func buildDaemonSet(mgmtTask *rlarkv1alpha1.Task, spec *rlarkv1alpha1.KubernetesWorkloadSpec) *appsv1.DaemonSet {
	applyDomainAnnotation(&spec.Template, mgmtTask)
	ensureLabels(&spec.Template, mgmtTask.Name)
	return &appsv1.DaemonSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      mgmtTask.Name,
			Namespace: getWorkloadNamespace(mgmtTask),
			Annotations: map[string]string{
				ManagementTaskNameAnnotation:      mgmtTask.Name,
				ManagementTaskNamespaceAnnotation: mgmtTask.Namespace,
				ManagementTaskUIDAnnotation:       string(mgmtTask.UID),
			},
		},
		Spec: appsv1.DaemonSetSpec{
			Selector: &metav1.LabelSelector{
				MatchLabels: spec.Template.Labels,
			},
			Template: spec.Template,
		},
	}
}

func buildStatefulSet(mgmtTask *rlarkv1alpha1.Task, spec *rlarkv1alpha1.KubernetesWorkloadSpec) *appsv1.StatefulSet {
	applyDomainAnnotation(&spec.Template, mgmtTask)
	ensureLabels(&spec.Template, mgmtTask.Name)
	return &appsv1.StatefulSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      mgmtTask.Name,
			Namespace: getWorkloadNamespace(mgmtTask),
			Annotations: map[string]string{
				ManagementTaskNameAnnotation:      mgmtTask.Name,
				ManagementTaskNamespaceAnnotation: mgmtTask.Namespace,
				ManagementTaskUIDAnnotation:       string(mgmtTask.UID),
			},
		},
		Spec: appsv1.StatefulSetSpec{
			Replicas: spec.Replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: spec.Template.Labels,
			},
			Template: spec.Template,
		},
	}
}

// --- helper functions ---

// applyDomainAnnotation injects the management-task annotations (including domain)
// into the Pod template spec so that pods created by the workload carry these annotations.
func applyDomainAnnotation(template *corev1.PodTemplateSpec, mgmtTask *rlarkv1alpha1.Task) {
	if template.Annotations == nil {
		template.Annotations = make(map[string]string)
	}
	template.Annotations[ManagementTaskNameAnnotation] = mgmtTask.Name
	template.Annotations[ManagementTaskNamespaceAnnotation] = mgmtTask.Namespace
	if mgmtTask.Spec.Domain != "" {
		template.Annotations[ManagementTaskDomainAnnotation] = mgmtTask.Spec.Domain
	}
}

func containsString(slice []string, s string) bool {
	for _, item := range slice {
		if item == s {
			return true
		}
	}
	return false
}

func removeString(slice []string, s string) []string {
	result := make([]string, 0, len(slice))
	for _, item := range slice {
		if item != s {
			result = append(result, item)
		}
	}
	return result
}
