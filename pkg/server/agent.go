package server

import (
	"context"
	"fmt"
	"time"

	v1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/tools/leaderelection"
	"k8s.io/client-go/tools/leaderelection/resourcelock"

	"github.com/rlinf/rlark/pkg/apis"
)

func (s *Server) registerAgent(ctx context.Context, agentID string) error {
	// 检查 agent 是否已经完成注册，如果没有，则进行注册流程。

	// 1. 创建 Kubernetes Namespace
	namespace := apis.RLarkAgentNamespacePrefix + agentID
	_, err := s.kubeClient.CoreV1().Namespaces().Get(ctx, namespace, metav1.GetOptions{})
	if err != nil {
		if !errors.IsNotFound(err) {
			return fmt.Errorf("get namespace %s: %w", namespace, err)
		}
		_, err = s.kubeClient.CoreV1().Namespaces().Create(ctx, &v1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: namespace,
			},
		}, metav1.CreateOptions{})
		if err != nil {
			return fmt.Errorf("create namespace %s: %w", namespace, err)
		}
	}

	// 2. 创建 ServiceAccount
	saName := apis.RLarkAgentServiceAccountName
	_, err = s.kubeClient.CoreV1().ServiceAccounts(namespace).Get(ctx, saName, metav1.GetOptions{})
	if err != nil {
		if !errors.IsNotFound(err) {
			return fmt.Errorf("get serviceaccount %s/%s: %w", namespace, saName, err)
		}
		_, err = s.kubeClient.CoreV1().ServiceAccounts(namespace).Create(ctx, &v1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{
				Name:      saName,
				Namespace: namespace,
			},
		}, metav1.CreateOptions{})
		if err != nil {
			return fmt.Errorf("create serviceaccount %s/%s: %w", namespace, saName, err)
		}
	}

	// 3. 创建 RBAC 规则 (ClusterRole + ClusterRoleBinding)
	// agent 需要集群范围权限来 watch/list 跨 namespace 的 nodes、tasks、pods 等资源
	rules := []rbacv1.PolicyRule{
		{APIGroups: []string{"rlinf.io"}, Resources: []string{"nodes", "tasks", "pods"}, Verbs: []string{"get", "list", "watch", "create", "update", "patch", "delete"}},
		{APIGroups: []string{"rlinf.io"}, Resources: []string{"nodes/status", "tasks/status", "pods/status"}, Verbs: []string{"get", "update", "patch"}},
		{APIGroups: []string{"coordination.k8s.io"}, Resources: []string{"leases"}, Verbs: []string{"get", "create", "update", "patch"}},
	}
	_, err = s.kubeClient.RbacV1().ClusterRoles().Get(ctx, saName, metav1.GetOptions{})
	if err != nil {
		if !errors.IsNotFound(err) {
			return fmt.Errorf("get ClusterRole %s: %w", saName, err)
		}
		_, err = s.kubeClient.RbacV1().ClusterRoles().Create(ctx, &rbacv1.ClusterRole{
			ObjectMeta: metav1.ObjectMeta{Name: saName},
			Rules:      rules,
		}, metav1.CreateOptions{})
		if err != nil {
			return fmt.Errorf("create ClusterRole %s: %w", saName, err)
		}
	}

	_, err = s.kubeClient.RbacV1().ClusterRoleBindings().Get(ctx, saName, metav1.GetOptions{})
	if err != nil {
		if !errors.IsNotFound(err) {
			return fmt.Errorf("get ClusterRoleBinding %s: %w", saName, err)
		}
		_, err = s.kubeClient.RbacV1().ClusterRoleBindings().Create(ctx, &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: saName},
			Subjects:   []rbacv1.Subject{{Kind: "ServiceAccount", Name: saName, Namespace: namespace}},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: saName, APIGroup: "rbac.authorization.k8s.io"},
		}, metav1.CreateOptions{})
		if err != nil {
			return fmt.Errorf("create ClusterRoleBinding %s: %w", saName, err)
		}
	}

	return nil
}

func (s *Server) startAgentBroadcaster(ctx context.Context, agentID, role, connID string) error {
	// 向集群广播该 Agent 的存在信息。
	// 这主要用于：标记 Agent 的活跃状态。
	// 暂时只对主 Agent（role 为空）进行广播，其他角色的 Agent 不进行广播。

	if role != "" {
		return nil
	}

	namespace := apis.RLarkAgentNamespacePrefix + agentID
	id := "heartbeat"
	rl, err := resourcelock.New(
		resourcelock.LeasesResourceLock,
		namespace, id,
		s.kubeClient.CoreV1(),
		s.kubeClient.CoordinationV1(),
		resourcelock.ResourceLockConfig{
			Identity: connID,
		},
	)
	if err != nil {
		return fmt.Errorf("create lock: %w", err)
	}
	le, err := leaderelection.NewLeaderElector(leaderelection.LeaderElectionConfig{
		Lock:          rl,
		LeaseDuration: time.Second * 30,
		RenewDeadline: time.Second * 10,
		RetryPeriod:   time.Second * 5,
		Callbacks: leaderelection.LeaderCallbacks{
			OnStartedLeading: func(ctx context.Context) {
				<-ctx.Done()
			},
			OnStoppedLeading: func() {},
			OnNewLeader:      func(identity string) {},
		},
	})
	if err != nil {
		return fmt.Errorf("create leader elector: %w", err)
	}

	go le.Run(ctx)
	return nil
}
