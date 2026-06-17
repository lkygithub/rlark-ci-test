package server

import (
	"cmp"
	"time"

	"github.com/spf13/pflag"
)

type KubernetesClientConfig struct {
	// KubeconfigPath is the path to the kubeconfig file for connecting to the Kubernetes cluster.
	KubeconfigPath string

	// Master is the address of the Kubernetes API server. If not specified, the client will use the default in-cluster configuration or kubeconfig file configuration.
	Master string

	// InCluster indicates whether to use in-cluster configuration.
	InCluster bool

	// Namespace is the Kubernetes namespace to configure the client for. If empty, the client will use the default namespace.
	Namespace string

	// QPS is the maximum number of queries per second allowed for the Kubernetes client.
	QPS float32

	// Burst is the maximum burst for throttle when connecting to the Kubernetes cluster.
	Burst int

	// Timeout is the timeout for Kubernetes client requests (optional).
	Timeout time.Duration
}

// Config holds the server configuration parameters.
type Config struct {
	// HTTPS Port to listen on.
	HTTPSPort int
	// SSH Port to listen on.
	SSHPort int

	// Kubernetes client configuration.
	KubeClientConfig KubernetesClientConfig

	// DBConfigPath is the file path to the database configuration (e.g., YAML or JSON).
	DBConfigPath string

	// PeerServiceName is the DNS name of the peer service for clustering (optional).
	PeerServiceName string
	// Peers is a list of peer server addresses for clustering (optional).
	Peers []string
}

// DefaultConfig returns a Config with sensible defaults.
func DefaultConfig() Config {
	return Config{
		HTTPSPort: 8443,
		SSHPort:   2222,
		KubeClientConfig: KubernetesClientConfig{
			InCluster: true,
			QPS:       5.0,
			Burst:     10,
		},
		DBConfigPath:    "config/db_config.yaml",
		PeerServiceName: "",
		Peers:           []string{},
	}
}

// SetupFlags defines command-line flags for the server configuration.
func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	fs.IntVar(&c.HTTPSPort, "https-port", c.HTTPSPort, "HTTPS port to listen on")
	fs.IntVar(&c.SSHPort, "ssh-port", c.SSHPort, "SSH port to listen on")
	fs.StringVar(&c.DBConfigPath, "db-config", c.DBConfigPath, "Path to database configuration file")
	fs.StringVar(&c.PeerServiceName, "peer-service", c.PeerServiceName, "DNS name of the peer service for clustering")
	fs.StringSliceVar(&c.Peers, "peers", c.Peers, "Comma-separated list of peer server addresses for clustering")

	// Kubernetes client flags
	fs.StringVar(&c.KubeClientConfig.KubeconfigPath, "kubeconfig", c.KubeClientConfig.KubeconfigPath, "Path to kubeconfig file (if not using in-cluster config)")
	fs.BoolVar(&c.KubeClientConfig.InCluster, "in-cluster", c.KubeClientConfig.InCluster, "Use in-cluster Kubernetes configuration")
	fs.StringVar(&c.KubeClientConfig.Namespace, "kube-namespace", c.KubeClientConfig.Namespace, "Kubernetes namespace to configure the client for")
	fs.Float32Var(&c.KubeClientConfig.QPS, "kube-qps", c.KubeClientConfig.QPS, "Kubernetes client QPS")
	fs.IntVar(&c.KubeClientConfig.Burst, "kube-burst", c.KubeClientConfig.Burst, "Kubernetes client burst")
	fs.DurationVar(&c.KubeClientConfig.Timeout, "kube-timeout", c.KubeClientConfig.Timeout, "Kubernetes client request timeout")
}

func (c Config) Namespace() string {
	return cmp.Or(c.KubeClientConfig.Namespace, "default")
}
