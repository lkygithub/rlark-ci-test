package node

import (
	"context"
	"time"

	"github.com/go-logr/logr"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	rlarkv1alpha1 "github.com/rlinf/rlark/api/rlark.io/v1alpha1"
)

const (
	AgentVersion      = "0.1.0"
	HeartbeatInterval = 30 * time.Second
)

// pushNodeReconciler watches local K8s Nodes and reports their info to management Node CRs.
type pushNodeReconciler struct {
	c *NodeController
}

func (r *pushNodeReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
	logger := log.FromContext(ctx).WithValues("node", req.NamespacedName)

	var k8sNode corev1.Node
	if err := r.c.LocalKubeClient.Get(ctx, types.NamespacedName{Name: req.Name}, &k8sNode); err != nil {
		if client.IgnoreNotFound(err) != nil {
			logger.Error(err, "failed to get local K8s Node")
			return reconcile.Result{RequeueAfter: HeartbeatInterval}, err
		}
		logger.Info("local K8s Node not found, waiting")
		return reconcile.Result{RequeueAfter: HeartbeatInterval}, nil
	}

	desiredNode := r.buildRLarkNodeFromK8sNode(&k8sNode)
	return r.updateManagementNode(ctx, logger, desiredNode)
}

func (r *pushNodeReconciler) buildRLarkNodeFromK8sNode(k8sNode *corev1.Node) *rlarkv1alpha1.Node {
	return &rlarkv1alpha1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name:      k8sNode.Name,
			Namespace: r.c.ManagementNamespace,
			Labels:    k8sNode.Labels,
		},
		Spec: rlarkv1alpha1.NodeSpec{
			AgentType:     rlarkv1alpha1.AgentType(r.c.AgentType),
			Unschedulable: k8sNode.Spec.Unschedulable,
		},
		Status: rlarkv1alpha1.NodeStatus{
			Phase:       rlarkv1alpha1.NodeOnline,
			Capacity:    k8sNode.Status.Capacity,
			Allocatable: k8sNode.Status.Allocatable,
			Addresses:   k8sNode.Status.Addresses,
			NodeInfo: rlarkv1alpha1.NodeInfo{
				Architecture:    k8sNode.Status.NodeInfo.Architecture,
				KernelVersion:   k8sNode.Status.NodeInfo.KernelVersion,
				OperatingSystem: k8sNode.Status.NodeInfo.OperatingSystem,
				AgentVersion:    AgentVersion,
			},
		},
	}
}

func (r *pushNodeReconciler) updateManagementNode(ctx context.Context, logger logr.Logger, desiredNode *rlarkv1alpha1.Node) (reconcile.Result, error) {
	var mgmtNode rlarkv1alpha1.Node
	err := r.c.ManagementClient.Get(ctx, types.NamespacedName{Name: desiredNode.Name, Namespace: desiredNode.Namespace}, &mgmtNode)
	if err != nil && client.IgnoreNotFound(err) != nil {
		logger.Error(err, "failed to get management Node")
		return reconcile.Result{RequeueAfter: HeartbeatInterval}, err
	}

	if err != nil {
		logger.Info("creating Node on management cluster")
		if err := r.c.ManagementClient.Create(ctx, desiredNode); err != nil {
			logger.Error(err, "failed to create management Node")
			return reconcile.Result{RequeueAfter: HeartbeatInterval}, err
		}
		return reconcile.Result{RequeueAfter: HeartbeatInterval}, nil
	}

	mgmtNode.Spec = desiredNode.Spec
	mgmtNode.Labels = desiredNode.Labels
	if err := r.c.ManagementClient.Update(ctx, &mgmtNode); err != nil {
		logger.Error(err, "failed to update management Node spec")
		return reconcile.Result{RequeueAfter: HeartbeatInterval}, err
	}

	mgmtNode.Status = desiredNode.Status
	if err := r.c.ManagementClient.Status().Update(ctx, &mgmtNode); err != nil {
		logger.Error(err, "failed to update management Node status")
		return reconcile.Result{RequeueAfter: HeartbeatInterval}, err
	}

	logger.Info("management Node reported successfully")
	return reconcile.Result{RequeueAfter: HeartbeatInterval}, nil
}
