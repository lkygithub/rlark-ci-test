package rlarkctl

import (
	"context"

	"github.com/spf13/pflag"

	"github.com/rlinf/rlark/pkg/configs"
	"github.com/rlinf/rlark/pkg/server"
)

var (
	ClientConfig     server.ClientConfig            = server.DefaultClientConfig()
	KubeClientConfig configs.KubernetesClientConfig = configs.DefaultKubernetesClientConfig()
)

func SetupPersistentFlags(fs *pflag.FlagSet) {
	ClientConfig.SetupFlags(fs)
	KubeClientConfig.SetupFlags(fs)
}

func NewClient(ctx context.Context) (*server.Client, error) {
	if ClientConfig.ServerAddress != "" && ClientConfig.ClientCertPath != "" && ClientConfig.ClientKeyPath != "" {
		return server.NewClientFromConfig(ClientConfig)
	}
	return server.NewClientFromKubernetes(ctx, ClientConfig.ServerAddress, KubeClientConfig)
}
