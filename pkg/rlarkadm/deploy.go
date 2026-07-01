package rlarkadm

import (
	"fmt"

	"github.com/sirupsen/logrus"
)

type Deployer interface {
	Deploy(cfg *DeployConfig, certBundle *CertBundle) error
}

func Deploy(cfg *DeployConfig) error {
	logrus.Infof("deploying %s plane (%s mode)", cfg.Plane, cfg.EnvMode())

	var certBundle *CertBundle
	if cfg.Cert != nil {
		logrus.Info("preparing certificates")
		bundle, err := GenerateCertBundle(cfg.Cert)
		if err != nil {
			return fmt.Errorf("generate certs: %w", err)
		}
		certBundle = bundle
		logrus.Info("certificates ready")
	}

	deployer, err := newDeployer(cfg)
	if err != nil {
		return err
	}

	if err := deployer.Deploy(cfg, certBundle); err != nil {
		return fmt.Errorf("deploy: %w", err)
	}

	logrus.Infof("%s plane deployed successfully", cfg.Plane)
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
