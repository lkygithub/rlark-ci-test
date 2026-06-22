package api

import (
	"github.com/rlinf/rlark/pkg/clients/db"
	"github.com/rlinf/rlark/pkg/server"
	"github.com/spf13/pflag"
)

// Config holds the configuration for the API gateway.
type Config struct {
	// Addr is the address the API gateway binds to.
	Addr string
	// DBEnabled controls whether database is used for read operations.
	DBEnabled bool
	// DBConfig is the database configuration.
	DBConfig db.Config
	// KubeClientConfig is the Kubernetes client configuration.
	KubeClientConfig server.KubernetesClientConfig
}

// DefaultConfig returns a Config with sensible defaults.
func DefaultConfig() Config {
	return Config{
		Addr:      ":8090",
		DBEnabled: true,
		DBConfig:  db.DefaultConfig(),
		KubeClientConfig: server.KubernetesClientConfig{
			KubeconfigPath: "",
		},
	}
}

// SetupFlags registers command-line flags for the configuration.
func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	fs.StringVar(&c.Addr, "addr", c.Addr, "The address the API gateway binds to.")
	fs.BoolVar(&c.DBEnabled, "db-enabled", c.DBEnabled, "Enable database for read operations; when disabled, read operations fall back to the Kubernetes API server")
	fs.StringVar(&c.DBConfig.Host, "db-host", c.DBConfig.Host, "Database host")
	fs.IntVar(&c.DBConfig.Port, "db-port", c.DBConfig.Port, "Database port")
	fs.StringVar(&c.DBConfig.Database, "db-name", c.DBConfig.Database, "Database name")
	fs.StringVar(&c.DBConfig.User, "db-user", c.DBConfig.User, "Database user")
	fs.StringVar(&c.DBConfig.Password, "db-password", c.DBConfig.Password, "Database password")

	c.KubeClientConfig.SetupFlags(fs)
}
