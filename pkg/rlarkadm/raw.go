package rlarkadm

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/sirupsen/logrus"
)

const (
	installDir = "/opt/rlark"
	configDir  = "/etc/rlark"
	systemdDir = "/etc/systemd/system"
)

type RawDeployer struct{}

func (d *RawDeployer) Deploy(cfg *DeployConfig, certBundle *CertBundle) error {
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
		binPath, err := downloadArtifact(c.ArtifactFn(cfg), c.Name)
		if err != nil {
			return err
		}
		args := c.ArgsFn(cfg)
		if err := writeSystemdUnit(c.Name, binPath, args); err != nil {
			return err
		}
		binPaths = append(binPaths, c.Name)
		logrus.Infof("  - %s.service (port %d)", c.Name, c.Port)
	}

	if err := systemctlReloadAndEnable(binPaths...); err != nil {
		return err
	}

	for _, c := range comps {
		if err := waitForHealthy(cfg, c); err != nil {
			return err
		}
	}

	logrus.Infof("%s plane deployed via systemd", cfg.Plane)
	if cfg.Plane == PlaneData {
		logrus.Infof("  - agent connecting to control plane: %s", cfg.ControlPlaneAddress)
	}
	return nil
}

func downloadArtifact(url, binName string) (string, error) {
	dest := filepath.Join(installDir, binName)
	logrus.Infof("downloading %s from %s", binName, url)

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
