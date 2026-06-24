package clicommands

import (
	"github.com/spf13/pflag"

	"github.com/rlinf/rlark/pkg/clients"
)

var (
	KubeClientConfig clients.KubernetesClientConfig
	Port             int = 8443
)

func SetupPersistentFlags(fs *pflag.FlagSet) {
	fs.IntVar(&Port, "port", Port, "Port for the server to listen on")
	KubeClientConfig.SetupFlags(fs)
}
