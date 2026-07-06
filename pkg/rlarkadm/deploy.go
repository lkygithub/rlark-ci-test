package rlarkadm

import (
	"fmt"

	"github.com/rlinf/rlark/pkg/log"
)

type Deployer interface {
	Deploy(cfg *DeployConfig, certBundle *CertBundle) error
}

func Deploy(cfg *DeployConfig) error {
	logger := log.GetLogger()
	logger.Info("deploying plane", "plane", cfg.Plane, "mode", cfg.EnvMode())

	var certBundle *CertBundle
	if cfg.Cert != nil {
		logger.Info("preparing certificates")
		bundle, err := GenerateCertBundle(cfg.Cert)
		if err != nil {
			return fmt.Errorf("generate certs: %w", err)
		}
		certBundle = bundle
		logger.Info("certificates ready")
	}

	deployer, err := newDeployer(cfg)
	if err != nil {
		return err
	}

	if err := deployer.Deploy(cfg, certBundle); err != nil {
		return fmt.Errorf("deploy: %w", err)
	}

	logger.Info("plane deployed successfully", "plane", cfg.Plane)
	return nil
}

func newDeployer(cfg *DeployConfig) (Deployer, error) {
	switch {
	case cfg.Kubernetes != nil:
		return &KubernetesDeployer{}, nil
	case cfg.Docker != nil:
		return &DockerDeployer{}, nil
	case cfg.Raw != nil:
		return &RawDeployer{}, nil
	default:
		return nil, fmt.Errorf("no deployment mode specified")
	}
}
