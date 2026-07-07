package rlarkadm

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/rlinf/rlark/pkg/log"
)

const (
	installDir = "/opt/rlark"
	configDir  = "/etc/rlark"
	systemdDir = "/etc/systemd/system"
)

type RawDeployer struct{}

func (d *RawDeployer) Deploy(cfg *DeployConfig, certBundle *CertBundle) error {
	logger := log.GetLogger()
	certDir := filepath.Join(configDir, "certs")
	if certBundle != nil {
		if err := certBundle.WriteToDir(certDir); err != nil {
			return err
		}
	}

	for _, dir := range []string{installDir, configDir, systemdDir} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("create dir %s: %w", dir, err)
		}
	}

	if cfg.DB != nil {
		if err := writeDBConfigFile(cfg.DB); err != nil {
			return err
		}
	}

	comps := ComponentsForPlane(cfg)
	binPaths := make([]string, 0, len(comps))

	for _, c := range comps {
		// 如果组件已存在且健康，跳过部署
		if c.HealthCheckFn != nil && c.HealthCheckFn(cfg) == nil {
			logger.Info("component already healthy, skipping", "name", c.Name)
			continue
		}

		binPath, err := downloadArtifact(c.ArtifactFn(cfg), c.Name)
		if err != nil {
			return err
		}
		args := c.ArgsFn(cfg)
		if err := writeSystemdUnit(c.Name, binPath, args); err != nil {
			return err
		}
		binPaths = append(binPaths, c.Name)
		logger.Info("service deployed", "name", c.Name, "port", c.Port)
	}

	if err := systemctlReloadAndEnable(binPaths...); err != nil {
		return err
	}

	for _, c := range comps {
		if err := waitForHealthy(cfg, c); err != nil {
			return err
		}
	}

	logger.Info("plane deployed via systemd", "plane", cfg.Plane)
	if cfg.Plane == PlaneData {
		logger.Info("agent connecting to control plane", "address", cfg.ControlPlaneAddress)
	}
	return nil
}

func downloadArtifact(url, binName string) (string, error) {
	logger := log.GetLogger()
	dest := filepath.Join(installDir, binName)
	logger.Info("downloading binary", "name", binName, "url", url)

	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("download %s: %w", binName, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download %s: HTTP %d", binName, resp.StatusCode)
	}

	out, err := os.Create(dest)
	if err != nil {
		return "", fmt.Errorf("create %s: %w", dest, err)
	}
	defer out.Close()

	if _, err := io.Copy(out, resp.Body); err != nil {
		return "", fmt.Errorf("write %s: %w", dest, err)
	}
	if err := os.Chmod(dest, 0755); err != nil {
		return "", fmt.Errorf("chmod %s: %w", dest, err)
	}
	return dest, nil
}

func writeSystemdUnit(name, binPath string, args []string) error {
	execStart := binPath
	if len(args) > 0 {
		execStart += " " + strings.Join(args, " ")
	}

	unit := fmt.Sprintf(`[Unit]
Description=%s
After=network.target

[Service]
ExecStart=%s
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
`, name, execStart)

	path := filepath.Join(systemdDir, name+".service")
	if err := os.WriteFile(path, []byte(unit), 0644); err != nil {
		return fmt.Errorf("write systemd unit %s: %w", path, err)
	}
	return nil
}

func systemctlReloadAndEnable(units ...string) error {
	if err := exec.Command("systemctl", "daemon-reload").Run(); err != nil {
		return fmt.Errorf("systemctl daemon-reload: %w", err)
	}
	for _, u := range units {
		if err := exec.Command("systemctl", "enable", "--now", u).Run(); err != nil {
			return fmt.Errorf("systemctl enable --now %s: %w", u, err)
		}
	}
	return nil
}
