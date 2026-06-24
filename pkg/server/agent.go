package server

import (
	"context"
	"fmt"
	"time"

	v1 "k8s.io/api/core/v1"
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

	// 3. TODO: 创建必要的 RBAC 规则

	// 4. TODO: 其他初始化操作

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
