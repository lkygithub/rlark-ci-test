package agent

import (
	"fmt"
	"os"

	"github.com/spf13/pflag"

	"github.com/rlinf/rlark/pkg/clients"
	"github.com/rlinf/rlark/pkg/network/nodeserver"
	"github.com/rlinf/rlark/pkg/server"
)

type Config struct {
	ClientConfig     server.ClientConfig
	KubeClientConfig clients.KubernetesClientConfig

	// AgentType is the type of agent (Kubernetes/Docker/Raw)
	AgentType string
	// Agent mode: cluster/node/both
	// In a Kubernetes cluster, use Deployment for cluster mode and DaemonSet for node mode.
	// For single-node, use both mode to start both cluster and node functionality.
	Mode string

	LeaderElection    bool
	LeaderElectionKey string // namespace/name
	LeaderElectionID  string // unique identifier for this agent instance, usually hostname

	NodeServerConfig nodeserver.Config
}

func DefaultConfig() Config {
	return Config{
		ClientConfig:      server.DefaultClientConfig(),
		KubeClientConfig:  clients.DefaultKubernetesClientConfig(),
		AgentType:         "Kubernetes",
		Mode:              "cluster",
		LeaderElectionKey: "default/rlark-agent",
		LeaderElectionID:  fmt.Sprintf("%s-%d", os.Getenv("HOSTNAME"), os.Getpid()),
		NodeServerConfig:  nodeserver.DefaultConfig(),
	}
}

func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	c.ClientConfig.SetupFlags(fs)
	c.KubeClientConfig.SetupFlags(fs)
	c.NodeServerConfig.SetupFlags(fs)

	fs.StringVar(&c.AgentType, "agent-type", c.AgentType, "agent type: Kubernetes/Docker/Raw")
	fs.StringVar(&c.Mode, "mode", c.Mode, "agent mode: cluster/node/both")
	fs.BoolVar(&c.LeaderElection, "leader-election", c.LeaderElection, "enable leader election for agent")
	fs.StringVar(&c.LeaderElectionKey, "leader-election-key", c.LeaderElectionKey, "leader election key (namespace/name)")
	fs.StringVar(&c.LeaderElectionID, "leader-election-id", c.LeaderElectionID, "leader election id (unique identifier for this agent instance)")
}
