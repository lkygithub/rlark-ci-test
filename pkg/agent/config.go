package agent

import (
	"github.com/spf13/pflag"

	"github.com/rlinf/rlark/pkg/clients"
	"github.com/rlinf/rlark/pkg/server"
)

type Config struct {
	ClientConfig     server.ClientConfig
	KubeClientConfig clients.KubernetesClientConfig
}

func DefaultConfig() Config {
	return Config{
		ClientConfig:     server.DefaultClientConfig(),
		KubeClientConfig: clients.DefaultKubernetesClientConfig(),
	}
}

func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	c.ClientConfig.SetupFlags(fs)
	c.KubeClientConfig.SetupFlags(fs)
}
