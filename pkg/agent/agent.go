package agent

import (
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"

	"github.com/rlinf/rlark/pkg/clients/kubernetes/clientset/versioned"
)

type Agent struct {
	config Config

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
	// Initialize Management API client
	mgmtConfig, err := clientcmd.BuildConfigFromKubeconfigGetter("", func() (*api.Config, error) {
		config := api.NewConfig()

		cluster := api.NewCluster()
		cluster.Server = fmt.Sprintf("%s/api/kubernetes", a.config.ServerAddress)
		if a.config.InsecureSkipTLSVerify {
			cluster.InsecureSkipTLSVerify = true
		} else if a.config.CAPath != "" {
			cluster.CertificateAuthority = a.config.CAPath
		}
		config.Clusters["management"] = cluster

		user := api.NewAuthInfo()
		user.ClientCertificate = a.config.ClientCertPath
		user.ClientKey = a.config.ClientKeyPath
		config.AuthInfos["agent"] = user

		context := api.NewContext()
		context.Cluster = "management"
		context.AuthInfo = "agent"
		config.Contexts["default"] = context
		config.CurrentContext = "default"
		return config, nil
	})
	if err != nil {
		return fmt.Errorf("build management API config: %w", err)
	}
	a.managementConfig = mgmtConfig
	a.managementClient, err = versioned.NewForConfig(mgmtConfig)
	if err != nil {
		return fmt.Errorf("create management API client: %w", err)
	}

	// Initialize Kubernetes client
	restConfig, err := a.config.KubeClientConfig.BuildRestConfig()
	if err != nil {
		return fmt.Errorf("build Kubernetes REST config: %w", err)
	}
	a.kubeConfig = restConfig
	a.kubeClient, err = kubernetes.NewForConfig(restConfig)
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
