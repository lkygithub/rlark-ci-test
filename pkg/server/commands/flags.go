package commands

import (
	"github.com/spf13/pflag"

	"github.com/rlinf/rlark/pkg/server"
)

var (
	KubeClientConfig server.KubernetesClientConfig
	Port             int = 8443
)

func SetupPersistentFlags(fs *pflag.FlagSet) {
	fs.IntVar(&Port, "port", Port, "Port for the server to listen on")
	KubeClientConfig.SetupFlags(fs)
}
