package agent

import (
	"fmt"
	"os"

	"github.com/spf13/pflag"

	"github.com/rlinf/rlark/pkg/clients"
	"github.com/rlinf/rlark/pkg/server"
)

type Config struct {
	ClientConfig     server.ClientConfig
	KubeClientConfig clients.KubernetesClientConfig

	// Agent 运行模式，分为三种 cluster/node/both
	// 在 Kubernetes 集群中运行时，需要用 Deployment 来运行 cluster 模式的 Agent，
	// 并且用 DaemonSet 来运行 node 模式的 Agent。
	// 在单节点运行时，可以使用 both 模式来同时启动 cluster 和 node 的功能。
	Mode string

	LeaderElection    bool
	LeaderElectionKey string // namespace/name
	LeaderElectionID  string // 用于区分不同的 Agent 实例，通常使用 hostname
}

func DefaultConfig() Config {
	return Config{
		ClientConfig:     server.DefaultClientConfig(),
		KubeClientConfig: clients.DefaultKubernetesClientConfig(),
		Mode:             "cluster",

		LeaderElectionKey: "default/rlark-agent",
		LeaderElectionID:  fmt.Sprintf("%s-%d", os.Getenv("HOSTNAME"), os.Getpid()),
	}
}

func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	c.ClientConfig.SetupFlags(fs)
	c.KubeClientConfig.SetupFlags(fs)

	fs.StringVar(&c.Mode, "mode", c.Mode, "agent mode: cluster/node/both")

	fs.BoolVar(&c.LeaderElection, "leader-election", c.LeaderElection, "enable leader election for agent")
	fs.StringVar(&c.LeaderElectionKey, "leader-election-key", c.LeaderElectionKey, "leader election key (namespace/name)")
	fs.StringVar(&c.LeaderElectionID, "leader-election-id", c.LeaderElectionID, "leader election id (unique identifier for this agent instance)")
}
