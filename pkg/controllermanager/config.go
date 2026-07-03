package controllermanager

import (
	"github.com/spf13/pflag"

	"github.com/rlinf/rlark/pkg/clients"
	"github.com/rlinf/rlark/pkg/controllermanager/sync"
)

type Config struct {
	// Kubernetes client configuration.
	KubeClientConfig clients.KubernetesClientConfig

	// Server Address
	ServerAddress string

	// DBConfigPath is the file path to the database configuration (e.g., YAML or JSON).
	DBConfigPath string

	LeaderElection   bool
	LeaderElectionID string

	MetricsBindAddress string
	ProbeBindAddress   string

	SyncConfig sync.Config
}

func DefaultConfig() Config {
	return Config{
		KubeClientConfig: clients.DefaultKubernetesClientConfig(),
		DBConfigPath:     "",

		LeaderElection:   true,
		LeaderElectionID: "rlark-controller-manager",

		MetricsBindAddress: ":8080",
		ProbeBindAddress:   ":8081",

		SyncConfig: sync.DefaultConfig(),
	}
}

func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	c.KubeClientConfig.SetupFlags(fs)

	fs.StringVar(&c.DBConfigPath, "db-config", c.DBConfigPath, "Path to database configuration file")
	fs.BoolVar(&c.LeaderElection, "leader-elect", c.LeaderElection, "Enable leader election for controller manager")
	fs.StringVar(&c.LeaderElectionID, "leader-election-id", c.LeaderElectionID, "Leader election ID for controller manager")
	fs.StringVar(&c.MetricsBindAddress, "metrics-bind-address", c.MetricsBindAddress, "The address the metric endpoint binds to.")
	fs.StringVar(&c.ProbeBindAddress, "health-probe-bind-address", c.ProbeBindAddress, "The address the probe endpoint binds to.")

	c.SyncConfig.SetupFlags(fs)
}
