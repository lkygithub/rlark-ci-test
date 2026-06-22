package server

import (
	"cmp"
	"os"
	"time"

	"github.com/spf13/pflag"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
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

func (c *KubernetesClientConfig) SetupFlags(fs *pflag.FlagSet) {
	// Kubernetes client flags
	fs.StringVar(&c.KubeconfigPath, "kubeconfig", c.KubeconfigPath, "Path to kubeconfig file (if not using in-cluster config)")
	fs.StringVar(&c.Master, "master", c.Master, "The address of the Kubernetes API server (overrides kubeconfig)")
	fs.BoolVar(&c.InCluster, "in-cluster", c.InCluster, "Use in-cluster Kubernetes configuration")
	fs.StringVar(&c.Namespace, "kube-namespace", c.Namespace, "Kubernetes namespace to configure the client for")
	fs.Float32Var(&c.QPS, "kube-qps", c.QPS, "Kubernetes client QPS")
	fs.IntVar(&c.Burst, "kube-burst", c.Burst, "Kubernetes client burst")
	fs.DurationVar(&c.Timeout, "kube-timeout", c.Timeout, "Kubernetes client request timeout")
}

func (c KubernetesClientConfig) BuildRestConfig() (*rest.Config, error) {
	var restConfig *rest.Config
	var err error
	if c.InCluster {
		restConfig, err = rest.InClusterConfig()
	} else {
		restConfig, err = clientcmd.BuildConfigFromFlags(c.Master, c.KubeconfigPath)
	}
	if err != nil {
		return nil, err
	}
	restConfig.QPS = c.QPS
	restConfig.Burst = c.Burst
	restConfig.Timeout = c.Timeout
	return restConfig, nil
}

// Config holds the server configuration parameters.
type Config struct {
	// HTTPS Port to listen on.
	HTTPSPort int
	// SSH Port to listen on.
	SSHPort int

	// UnsafeHTTPPort is the port to listen on for unsafe HTTP connections.
	UnsafeHTTPPort int

	// AutoSignTLSCACert indicates whether to automatically sign a TLS CA certificate if it does not exist in Kubernetes.
	AutoSignTLSCACert bool

	// TLSDomains is the list of domain names to include in the TLS certificate (e.g., "rlark.example.com", "localhost").
	TLSDomains []string

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
		HTTPSPort:         8443,
		SSHPort:           2222,
		UnsafeHTTPPort:    8888,
		AutoSignTLSCACert: false,
		TLSDomains:        []string{"localhost"},
		KubeClientConfig: KubernetesClientConfig{
			KubeconfigPath: os.Getenv("KUBECONFIG"),
		},
		DBConfigPath:    "",
		PeerServiceName: "",
		Peers:           []string{},
	}
}

// SetupFlags defines command-line flags for the server configuration.
func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	fs.IntVar(&c.HTTPSPort, "https-port", c.HTTPSPort, "HTTPS port to listen on")
	fs.IntVar(&c.SSHPort, "ssh-port", c.SSHPort, "SSH port to listen on")
	fs.IntVar(&c.UnsafeHTTPPort, "unsafe-http-port", c.UnsafeHTTPPort, "Unsafe HTTP port to listen on")
	fs.BoolVar(&c.AutoSignTLSCACert, "auto-sign-tls-ca-cert", c.AutoSignTLSCACert, "Automatically sign a TLS CA certificate if it does not exist in Kubernetes")
	fs.StringSliceVar(&c.TLSDomains, "tls-domains", c.TLSDomains, "Comma-separated list of domain names to include in the TLS certificate (e.g., \"localhost\")")
	fs.StringVar(&c.DBConfigPath, "db-config", c.DBConfigPath, "Path to database configuration file")
	fs.StringVar(&c.PeerServiceName, "peer-service", c.PeerServiceName, "DNS name of the peer service for clustering")
	fs.StringSliceVar(&c.Peers, "peers", c.Peers, "Comma-separated list of peer server addresses for clustering")

	c.KubeClientConfig.SetupFlags(fs)
}

func (c Config) Namespace() string {
	return cmp.Or(c.KubeClientConfig.Namespace, "default")
}
