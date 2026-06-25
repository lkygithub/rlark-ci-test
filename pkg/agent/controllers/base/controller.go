package base

import (
	"fmt"

	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

type KubernetesResource struct {
	Name string
	Type client.Object
}

type KubernetesReconciler reconcile.TypedReconciler[reconcile.Request]

type Reconciler interface {
	KubernetesResource() KubernetesResource
	AsPullReconciler() KubernetesReconciler
	AsKubePushReconcilers() map[KubernetesResource]KubernetesReconciler
	AsDockerPushReconcilers() map[string]any
	AsRawPushReconcilers() map[string]any
}

type BaseController struct {
	ManagementClient    client.Client
	ManagementNamespace string
	AgentType           string // Kubernetes/Docker/Raw

	LocalKubeClient   client.Client
	LocalDockerClient any // TODO
	LocalRawClient    any // TODO

	C Reconciler
}

func (c *BaseController) SetupPullController(mgr ctrl.Manager) error {
	pullReconciler := c.C.AsPullReconciler()
	if pullReconciler == nil {
		// Skip setup — no pull logic needed (e.g. Node controller)
		return nil
	}
	kubeResource := c.C.KubernetesResource()
	return ctrl.NewControllerManagedBy(mgr).
		For(kubeResource.Type).
		Named(kubeResource.Name + "-pull").
		Complete(pullReconciler)
}

func (c *BaseController) SetupPushController(mgr any) error {
	if mgr == nil {
		return fmt.Errorf("manager is nil")
	}

	if kubeMgr, ok := mgr.(ctrl.Manager); ok {
		if c.LocalKubeClient == nil {
			return fmt.Errorf("controller is not running in a Kubernetes environment")
		}
		for kubeResource, reconciler := range c.C.AsKubePushReconcilers() {
			err := ctrl.NewControllerManagedBy(kubeMgr).
				For(kubeResource.Type).
				Named(kubeResource.Name + "-push").
				Complete(reconciler)
			if err != nil {
				return fmt.Errorf("failed to setup push controller for %s: %w", kubeResource.Name, err)
			}
		}
		return nil
	}
	if dockerMgr, ok := mgr.(interface {
		/* docker manager */
	}); ok {
		if c.LocalDockerClient == nil {
			return fmt.Errorf("controller is not running in a Docker environment")
		}
		// TODO: setup push controller for Docker resources
		_ = dockerMgr
		return fmt.Errorf("SetupPushController for Docker not implemented")
	}
	if rawMgr, ok := mgr.(interface {
		/* raw manager */
	}); ok {
		if c.LocalRawClient == nil {
			return fmt.Errorf("controller is not running in a raw environment")
		}
		// TODO: setup push controller for raw resources
		_ = rawMgr
		return fmt.Errorf("SetupPushController for raw not implemented")
	}
	return fmt.Errorf("unknown manager type: %T", mgr)
}
