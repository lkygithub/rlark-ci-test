package base

import (
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

type KubernetesResource struct {
	Name string
	Type client.Object
}

type KubernetesReconciler reconcile.TypedReconciler[reconcile.Request]

type DockerResource struct {
	// TODO
}

type DockerRequest struct {
	// TODO
}

type DockerReconciler reconcile.TypedReconciler[DockerRequest]

type DockerControllerManager interface {
	// TODO
	SetupReconciler(reconciler DockerReconciler) error
}

type RawResource struct {
	// TODO
}

type RawRequest struct {
	// TODO
}

type RawReconciler reconcile.TypedReconciler[RawRequest]

type RawControllerManager interface {
	// TODO
	SetupReconciler(reconciler RawReconciler) error
}
