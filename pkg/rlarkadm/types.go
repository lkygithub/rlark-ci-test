package rlarkadm

import (
	"fmt"
	"os"

	"go.yaml.in/yaml/v2"
)

type Plane string

const (
	PlaneControl Plane = "control"
	PlaneData    Plane = "data"
)

type DeployConfig struct {
	APIVersion          string         `yaml:"apiVersion"`
	Kind                string         `yaml:"kind"`
	Plane               Plane          `yaml:"plane"`
	ControlPlaneAddress string         `yaml:"control-plane-address,omitempty"`
	Kubernetes          *KubernetesEnv `yaml:"kubernetes,omitempty"`
	Docker              *DockerEnv     `yaml:"docker,omitempty"`
	Raw                 *RawEnv        `yaml:"raw,omitempty"`
	Cert                *CertConfig    `yaml:"cert,omitempty"`
}

type KubernetesEnv struct {
	Kubeconfig             string `yaml:"kubeconfig,omitempty"`
	GatewayImage           string `yaml:"gateway-image"`
	ControllerManagerImage string `yaml:"controller-manager-image"`
	ServerImage            string `yaml:"server-image"`
	AgentImage             string `yaml:"agent-image"`
}

type DockerEnv struct {
	GatewayImage           string `yaml:"gateway-image"`
	ControllerManagerImage string `yaml:"controller-manager-image"`
	ServerImage            string `yaml:"server-image"`
	AgentImage             string `yaml:"agent-image"`
}

type RawEnv struct {
	GatewayArtifact           string `yaml:"gateway-artifact"`
	ControllerManagerArtifact string `yaml:"controller-manager-artifact"`
	ServerArtifact            string `yaml:"server-artifact"`
	AgentArtifact             string `yaml:"agent-artifact"`
}

type CertConfig struct {
	CACert string `yaml:"ca-cert,omitempty"`
	CAKey  string `yaml:"ca-key,omitempty"`
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
		return "kubernetes"
	}
	if c.Docker != nil {
		return "docker"
	}
	return "raw"
}
