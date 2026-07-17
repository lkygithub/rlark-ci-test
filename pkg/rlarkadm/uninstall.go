package rlarkadm

import (
	"fmt"

	"github.com/rlinf/rlark/pkg/log"
	"github.com/rlinf/rlark/pkg/rlarkadm/deployer/docker"
	"github.com/rlinf/rlark/pkg/rlarkadm/deployer/kubernetes"
	"github.com/rlinf/rlark/pkg/rlarkadm/deployer/raw"
	"github.com/rlinf/rlark/pkg/rlarkadm/types"
)

type Uninstaller interface {
	Uninstall(cfg *types.DeployConfig, purge bool) error
}

func Uninstall(cfg *types.DeployConfig, purge bool) error {
	logger := log.GetLogger()
	logger.Info("uninstalling plane", "plane", cfg.Plane, "mode", cfg.EnvMode(), "purge", purge)

	uninstaller, err := newUninstaller(cfg)
	if err != nil {
		return err
	}

	if err := uninstaller.Uninstall(cfg, purge); err != nil {
		return fmt.Errorf("uninstall: %w", err)
	}

	logger.Info("plane uninstalled successfully", "plane", cfg.Plane)
	return nil
}

func newUninstaller(cfg *types.DeployConfig) (Uninstaller, error) {
	switch {
	case cfg.Kubernetes != nil:
		return &kubernetes.Installer{}, nil
	case cfg.Docker != nil:
		return &docker.Installer{}, nil
	case cfg.Raw != nil:
		return &raw.Installer{}, nil
	default:
		return nil, fmt.Errorf("no deployment mode specified")
	}
}
