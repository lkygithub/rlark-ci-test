package types

import (
	"fmt"
	"os"

	"go.yaml.in/yaml/v2"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
)

type Plane string

const (
	PlaneControl Plane = "control"
	PlaneData    Plane = "data"
)

type StorageType string

const (
	StorageEmptyDir StorageType = "emptyDir"
	StorageHostPath StorageType = "hostPath"
	StoragePVC      StorageType = "pvc"
)

type DeployConfig struct {
	APIVersion            string         `yaml:"apiVersion"`
	Kind                  string         `yaml:"kind"`
	Plane                 Plane          `yaml:"plane"`
	ControlPlaneAddress   string         `yaml:"control-plane-address,omitempty"`
	DB                    *DBConfig      `yaml:"db,omitempty"`
	Kubernetes            *KubernetesEnv `yaml:"kubernetes,omitempty"`
	Docker                *DockerEnv     `yaml:"docker,omitempty"`
	Raw                   *RawEnv        `yaml:"raw,omitempty"`
	Cert                  *CertConfig    `yaml:"cert,omitempty"`
	InsecureSkipTLSVerify bool           `yaml:"insecure-skip-tls-verify,omitempty"`
}

type KubernetesEnv struct {
	Kubeconfig             string           `yaml:"kubeconfig,omitempty"`
	GatewayImage           string           `yaml:"gateway-image"`
	ControllerManagerImage string           `yaml:"controller-manager-image"`
	ServerImage            string           `yaml:"server-image"`
	AgentImage             string           `yaml:"agent-image"`
	NetworkSidecarImage    string           `yaml:"network-sidecar-image,omitempty"`
	KCPImage               string           `yaml:"kcp-image,omitempty"`
	PostgresqlImage        string           `yaml:"postgresql-image,omitempty"`
	UIImage                string           `yaml:"ui-image,omitempty"`
	Replicas               int32            `yaml:"replicas,omitempty"`
	Storage                *StorageConfig   `yaml:"storage,omitempty"`
	KCP                    *ComponentConfig `yaml:"kcp,omitempty"`
	Postgresql             *ComponentConfig `yaml:"postgresql,omitempty"`
}

type ComponentConfig struct {
	Replicas int32          `yaml:"replicas,omitempty"`
	Storage  *StorageConfig `yaml:"storage,omitempty"`
}

type StorageConfig struct {
	Type         StorageType       `yaml:"type"`
	HostPath     string            `yaml:"host-path,omitempty"`
	StorageClass string            `yaml:"storage-class,omitempty"`
	Size         string            `yaml:"size,omitempty"`
	NodeSelector map[string]string `yaml:"node-selector,omitempty"`
}

type DockerEnv struct {
	GatewayImage           string `yaml:"gateway-image"`
	ControllerManagerImage string `yaml:"controller-manager-image"`
	ServerImage            string `yaml:"server-image"`
	AgentImage             string `yaml:"agent-image"`
	NetworkSidecarImage    string `yaml:"network-sidecar-image,omitempty"`
	KCPImage               string `yaml:"kcp-image,omitempty"`
	PostgresqlImage        string `yaml:"postgresql-image,omitempty"`
	UIImage                string `yaml:"ui-image,omitempty"`
}

type RawEnv struct {
	GatewayArtifact           string `yaml:"gateway-artifact"`
	ControllerManagerArtifact string `yaml:"controller-manager-artifact"`
	ServerArtifact            string `yaml:"server-artifact"`
	AgentArtifact             string `yaml:"agent-artifact"`
	NetworkSidecarArtifact    string `yaml:"network-sidecar-artifact,omitempty"`
	KCPArtifact               string `yaml:"kcp-artifact,omitempty"`
	PostgresqlArtifact        string `yaml:"postgresql-artifact,omitempty"`
}

type CertConfig struct {
	CACert    string `yaml:"ca-cert,omitempty"`
	AgentCert string `yaml:"agent-cert,omitempty"`
	AgentKey  string `yaml:"agent-key,omitempty"`
}

type DBConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Database string `yaml:"database"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
}

type Component struct {
	Name           string
	Port           int32
	Plane          Plane
	NeedsService   bool
	WorkloadKind   string
	ServiceAccount string
	RBACRules      []rbacv1.PolicyRule
	Dependencies   []string
	MetricsPort    int32
	EnabledFn      func(cfg *DeployConfig) bool
	ImageFn        func(cfg *DeployConfig) string
	ArtifactFn     func(cfg *DeployConfig) string
	ArgsFn         func(cfg *DeployConfig) []string
	EnvFn          func(cfg *DeployConfig) map[string]string
	VolumeFn       func(cfg *DeployConfig) ([]corev1.Volume, []corev1.VolumeMount)
	VolumeClaimFn  func(cfg *DeployConfig) []corev1.PersistentVolumeClaim
	HealthCheckFn  func(cfg *DeployConfig) error
	PostDeployFn   func(cfg *DeployConfig) error
}

func (c *Component) GetName() string {
	return c.Name
}

func (c *Component) GetDependencies() []string {
	return c.Dependencies
}

func LoadDeployConfig(path string) (*DeployConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read deploy config: %w", err)
	}
	var cfg DeployConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("unmarshal deploy config: %w", err)
	}
	if err := cfg.Validate(); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func (c *DeployConfig) Validate() error {
	if c.APIVersion == "" {
		return fmt.Errorf("apiVersion is required")
	}

	if c.Kind != "DeployConfig" {
		return fmt.Errorf("kind must be DeployConfig, got %q", c.Kind)
	}

	if c.Plane != PlaneControl && c.Plane != PlaneData {
		return fmt.Errorf("plane must be %q or %q", PlaneControl, PlaneData)
	}

	modes := 0
	if c.Kubernetes != nil {
		modes++
	}

	if c.Docker != nil {
		modes++
	}

	if c.Raw != nil {
		modes++
	}

	if modes != 1 {
		return fmt.Errorf("exactly one of kubernetes/docker/raw must be specified")
	}

	if c.Plane == PlaneData {
		if c.Cert == nil {
			return fmt.Errorf("cert is required for data plane")
		}

		if c.ControlPlaneAddress == "" {
			return fmt.Errorf("control-plane-address is required for data plane")
		}
	}

	return nil
}

func (c *DeployConfig) EnvMode() string {
	if c.Kubernetes != nil {
		return "Kubernetes"
	}
	if c.Docker != nil {
		return "Docker"
	}
	return "Raw"
}
