package rlarkadm

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/sirupsen/logrus"
)

type DockerDeployer struct{}

func (d *DockerDeployer) Deploy(cfg *DeployConfig, certBundle *CertBundle) error {
	certDir := ""
	if certBundle != nil {
		certDir = "/etc/rlark/certs"
		if err := certBundle.WriteToDir(certDir); err != nil {
			return err
		}
	}

	for _, c := range ComponentsForPlane(cfg.Plane) {
		var env []string
		if c.Name == ComponentAgent && cfg.ControlPlaneAddress != "" {
			env = []string{"CONTROL_PLANE=" + cfg.ControlPlaneAddress}
		}
		if err := dockerRun(c.Name, c.Image(cfg), c.Port, certDir, env); err != nil {
			return err
		}
		logrus.Infof("  - %s container (port %d)", c.Name, c.Port)
	}

	logrus.Infof("%s plane deployed via Docker", cfg.Plane)
	if cfg.Plane == PlaneData {
		logrus.Infof("  - agent connecting to control plane: %s", cfg.ControlPlaneAddress)
	}
	return nil
}

func dockerRun(name, image string, port int32, certDir string, env []string) error {
	if err := exec.Command("docker", "rm", "-f", name).Run(); err != nil {
		logrus.Debugf("remove existing container %s: %v", name, err)
	}
	args := []string{
		"run", "-d", "--name", name,
		"--restart", "unless-stopped",
		"-p", fmt.Sprintf("%d:%d", port, port),
	}
	if certDir != "" {
		args = append(args, "-v", fmt.Sprintf("%s:/etc/rlark/certs:ro", certDir))
	}
	for _, e := range env {
		args = append(args, "-e", e)
	}
	args = append(args, image)

	cmd := exec.Command("docker", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("docker run %s: %w", name, err)
	}
	return nil
}
