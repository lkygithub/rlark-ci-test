package agent

import (
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/rlinf/rlark/pkg/clients/kubernetes/clientset/versioned"
	"github.com/rlinf/rlark/pkg/server"
)

type Agent struct {
	config Config

	serverClient *server.Client

	managementConfig *rest.Config
	managementClient versioned.Interface
	kubeConfig       *rest.Config
	kubeClient       kubernetes.Interface
}

func NewAgent(config Config) *Agent {
	return &Agent{
		config: config,
	}
}

func (a *Agent) init(ctx context.Context) error {
	var err error

	// Initialize server client
	a.serverClient, err = server.NewClientFromConfig(a.config.ClientConfig)
	if err != nil {
		return fmt.Errorf("create server client: %w", err)
	}

	// Initialize Management Kube API client
	a.managementConfig, err = a.config.ClientConfig.BuildRestConfig()
	if err != nil {
		return fmt.Errorf("build management API config: %w", err)
	}
	a.managementClient, err = versioned.NewForConfig(a.managementConfig)
	if err != nil {
		return fmt.Errorf("create management API client: %w", err)
	}

	// Initialize Kubernetes client
	a.kubeConfig, err = a.config.KubeClientConfig.BuildRestConfig()
	if err != nil {
		return fmt.Errorf("build Kubernetes REST config: %w", err)
	}
	a.kubeClient, err = kubernetes.NewForConfig(a.kubeConfig)
	if err != nil {
		return fmt.Errorf("create Kubernetes client: %w", err)
	}

	return nil
}

func (a *Agent) Run(ctx context.Context) error {
	if err := a.init(ctx); err != nil {
		return err
	}

	var eg errgroup.Group
	eg.Go(func() error {
		return a.runTunnel(ctx)
	})

	if err := eg.Wait(); err != nil {
		return fmt.Errorf("agent run error: %w", err)
	}
	return nil
}
