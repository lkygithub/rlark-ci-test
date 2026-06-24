package gateway

import (
	"github.com/rlinf/rlark/pkg/clients"
	"github.com/spf13/pflag"
)

// Config holds the configuration for the API gateway.
type Config struct {
	// Address is the address the API gateway binds to.
	Address string

	// KubeClientConfig is the Kubernetes client configuration.
	KubeClientConfig clients.KubernetesClientConfig

	// DBConfigPath is the file path to the database configuration (e.g., YAML or JSON).
	DBConfigPath string
}

// DefaultConfig returns a Config with sensible defaults.
func DefaultConfig() Config {
	return Config{
		Address:          ":8080",
		KubeClientConfig: clients.DefaultKubernetesClientConfig(),
	}
}

// SetupFlags registers command-line flags for the configuration.
func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	fs.StringVar(&c.Address, "addr", c.Address, "The address the API gateway binds to.")
	fs.StringVar(&c.DBConfigPath, "db-config", c.DBConfigPath, "The file path to the database configuration (e.g., YAML or JSON).")

	c.KubeClientConfig.SetupFlags(fs)
}
