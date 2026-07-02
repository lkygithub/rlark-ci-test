package rlarkadm

import (
	"context"
	"fmt"
	"os/exec"
	"time"

	"github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

const (
	healthCheckTimeout  = 120 * time.Second
	healthCheckInterval = 3 * time.Second
)

// waitForHealthy retries the component's HealthCheckFn until it passes or times out.
func waitForHealthy(cfg *DeployConfig, comp Component) error {
	if comp.HealthCheckFn == nil {
		return nil
	}

	logrus.Infof("  waiting for %s to become healthy...", comp.Name)

	deadline := time.Now().Add(healthCheckTimeout)
	ticker := time.NewTicker(healthCheckInterval)
	defer ticker.Stop()

	for {
		err := comp.HealthCheckFn(cfg)
		if err == nil {
			logrus.Infof("  %s is healthy", comp.Name)
			return nil
		}

		if time.Now().After(deadline) {
			return fmt.Errorf("%s health check failed after %v: %w", comp.Name, healthCheckTimeout, err)
		}

		logrus.Debugf("  %s not ready: %v, retrying in %v...", comp.Name, err, healthCheckInterval)
		<-ticker.C
	}
}

// modeHealthCheck returns a HealthCheckFn for docker/raw modes.
// For kubernetes mode, the deployer overrides HealthCheckFn with k8sDeploymentHealthCheck.
func modeHealthCheck(comp Component) func(cfg *DeployConfig) error {
	return func(cfg *DeployConfig) error {
		switch cfg.EnvMode() {
		case "docker":
			return exec.Command("docker", "inspect", "--format", "{{.State.Running}}", comp.Name).Run()
		case "raw":
			return exec.Command("systemctl", "is-active", "--quiet", comp.Name).Run()
		default:
			return nil
		}
	}
}

// k8sDeploymentHealthCheck returns a HealthCheckFn that checks Deployment readyReplicas.
func k8sDeploymentHealthCheck(clientset *kubernetes.Clientset, name string) func(cfg *DeployConfig) error {
	return func(cfg *DeployConfig) error {
		dep, err := clientset.AppsV1().Deployments(Namespace).Get(
			context.Background(), name, metav1.GetOptions{})
		if err != nil {
			return fmt.Errorf("get deployment %s: %w", name, err)
		}
		if dep.Status.ReadyReplicas != *dep.Spec.Replicas {
			return fmt.Errorf("deployment %s: %d/%d replicas ready",
				name, dep.Status.ReadyReplicas, *dep.Spec.Replicas)
		}
		return nil
	}
}
