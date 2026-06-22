package agent

import (
	"os"

	"github.com/spf13/pflag"

	"github.com/rlinf/rlark/pkg/server"
)

type Config struct {
	ServerAddress         string
	ServerHostname        string
	ClientCertPath        string
	ClientKeyPath         string
	CAPath                string
	InsecureSkipTLSVerify bool

	KubeClientConfig server.KubernetesClientConfig
}

func DefaultConfig() *Config {
	return &Config{
		ServerAddress:         "localhost:8443",
		ServerHostname:        "",
		ClientCertPath:        "",
		ClientKeyPath:         "",
		CAPath:                "",
		InsecureSkipTLSVerify: false,

		KubeClientConfig: server.KubernetesClientConfig{
			KubeconfigPath: os.Getenv("KUBECONFIG"),
		},
	}
}

func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	fs.StringVar(&c.ServerAddress, "server-address", c.ServerAddress, "Address of the server to connect to")
	fs.StringVar(&c.ServerHostname, "server-hostname", c.ServerHostname, "Expected hostname of the server for TLS verification (optional)")
	fs.StringVar(&c.ClientCertPath, "client-cert", c.ClientCertPath, "Path to the client TLS certificate")
	fs.StringVar(&c.ClientKeyPath, "client-key", c.ClientKeyPath, "Path to the client TLS private key")
	fs.StringVar(&c.CAPath, "ca-cert", c.CAPath, "Path to the CA certificate for verifying the server")
	fs.BoolVar(&c.InsecureSkipTLSVerify, "insecure-skip-tls-verify", c.InsecureSkipTLSVerify, "Skip TLS certificate verification (not recommended)")
}
