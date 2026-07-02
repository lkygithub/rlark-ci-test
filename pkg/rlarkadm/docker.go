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
		certDir = CertDir
		if err := certBundle.WriteToDir(certDir); err != nil {
			return err
		}
	}

	dbDir := ""
	if cfg.DB != nil {
		dbDir = "/etc/rlark"
		if err := writeDBConfigFile(cfg.DB); err != nil {
			return err
		}
		if err := writeInitDBScript(); err != nil {
			return err
		}
	}

	for _, c := range ComponentsForPlane(cfg) {
		var env map[string]string
		if c.EnvFn != nil {
			env = c.EnvFn(cfg)
		}
		args := c.ArgsFn(cfg)
		var volMounts [][2]string
		if c.Name == ComponentPostgresql {
			volMounts = append(volMounts, [2]string{"/etc/rlark/init-db.sql", PostgresqlInitDir + "/init-db.sql"})
		}
		if err := dockerRun(c.Name, c.ImageFn(cfg), c.Port, certDir, dbDir, env, args, volMounts); err != nil {
			return err
		}
		logrus.Infof("  - %s container (port %d)", c.Name, c.Port)
		if err := waitForHealthy(cfg, c); err != nil {
			return err
		}
	}

	logrus.Infof("%s plane deployed via Docker", cfg.Plane)
	if cfg.Plane == PlaneData {
		logrus.Infof("  - agent connecting to control plane: %s", cfg.ControlPlaneAddress)
	}
	return nil
}

func dockerRun(name, image string, port int32, certDir, dbDir string, env map[string]string, args []string, volMounts [][2]string) error {
	if err := exec.Command("docker", "rm", "-f", name).Run(); err != nil {
		logrus.Debugf("remove existing container %s: %v", name, err)
	}
	dockerArgs := []string{
		"run", "-d", "--name", name,
		"--restart", "unless-stopped",
		"-p", fmt.Sprintf("%d:%d", port, port),
	}
	if certDir != "" {
		dockerArgs = append(dockerArgs, "-v", fmt.Sprintf("%s:%s:ro", certDir, CertDir))
	}
	if dbDir != "" {
		dockerArgs = append(dockerArgs, "-v", fmt.Sprintf("%s/%s:%s:ro", dbDir, "db.yaml", DBConfigPath))
	}
	for _, m := range volMounts {
		dockerArgs = append(dockerArgs, "-v", fmt.Sprintf("%s:%s:ro", m[0], m[1]))
	}
	for k, v := range env {
		dockerArgs = append(dockerArgs, "-e", fmt.Sprintf("%s=%s", k, v))
	}
	dockerArgs = append(dockerArgs, image)
	dockerArgs = append(dockerArgs, args...)

	cmd := exec.Command("docker", dockerArgs...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("docker run %s: %w", name, err)
	}
	return nil
}

func writeDBConfigFile(cfg *DBConfig) error {
	if err := os.MkdirAll("/etc/rlark", 0755); err != nil {
		return fmt.Errorf("create db config dir: %w", err)
	}
	yamlData, err := DBConfigYAML(cfg)
	if err != nil {
		return err
	}
	if err := os.WriteFile(DBConfigPath, yamlData, 0644); err != nil {
		return fmt.Errorf("write db config file: %w", err)
	}
	return nil
}

func writeInitDBScript() error {
	if err := os.WriteFile("/etc/rlark/init-db.sql", []byte(initDBSQL), 0644); err != nil {
		return fmt.Errorf("write init-db.sql: %w", err)
	}
	return nil
}
