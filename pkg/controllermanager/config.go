package controllermanager

import (
	"os"

	"github.com/rlinf/rlark/pkg/clients/db"
	"github.com/rlinf/rlark/pkg/controllermanager/sync"
	"github.com/rlinf/rlark/pkg/server"
	"github.com/spf13/pflag"
)

type Config struct {
	KubeClientConfig server.KubernetesClientConfig
	Database         db.Config

	LeaderElection   bool
	LeaderElectionID string

	MetricsBindAddress string
	ProbeBindAddress   string

	SyncConfig sync.Config
}

func DefaultConfig() Config {
	return Config{
		KubeClientConfig: server.KubernetesClientConfig{
			KubeconfigPath: os.Getenv("KUBE_CONFIG"),
		},
		Database: db.DefaultConfig(),

		LeaderElection:   true,
		LeaderElectionID: "rlark-controller-manager",

		MetricsBindAddress: ":8080",
		ProbeBindAddress:   ":8081",

		SyncConfig: sync.DefaultConfig(),
	}
}

func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	// TODO
}
