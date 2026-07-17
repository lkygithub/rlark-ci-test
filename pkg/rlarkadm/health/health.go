package health

import (
	"context"
	"fmt"
	"os/exec"
	"time"

	"github.com/rlinf/rlark/pkg/log"
	"github.com/rlinf/rlark/pkg/rlarkadm/constants"
	"github.com/rlinf/rlark/pkg/rlarkadm/types"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

const (
	checkTimeout  = 120 * time.Second
	checkInterval = 3 * time.Second
)

// WaitForHealthy retries the component's HealthCheckFn until it passes or times out.
func WaitForHealthy(cfg *types.DeployConfig, comp types.Component) error {
	logger := log.GetLogger()
	if comp.HealthCheckFn == nil {
		return nil
	}

	logger.Info("waiting for component to become healthy", "name", comp.Name)

	deadline := time.Now().Add(checkTimeout)
	ticker := time.NewTicker(checkInterval)
	defer ticker.Stop()

	for {
		err := comp.HealthCheckFn(cfg)
		if err == nil {
			logger.Info("component is healthy", "name", comp.Name)
			return nil
		}

		if time.Now().After(deadline) {
			return fmt.Errorf("%s health check failed after %v: %w", comp.Name, checkTimeout, err)
		}

		logger.V(1).Info("component not ready, retrying", "name", comp.Name, "err", err, "interval", checkInterval)
		<-ticker.C
	}
}

// ModeHealthCheck returns a HealthCheckFn for docker/raw modes.
// For kubernetes mode, the deployer overrides HealthCheckFn with K8sDeploymentHealthCheck.
func ModeHealthCheck(comp types.Component) func(cfg *types.DeployConfig) error {
	return func(cfg *types.DeployConfig) error {
		switch cfg.EnvMode() {
		case "Docker":
			return exec.Command("docker", "inspect", "--format", "{{.State.Running}}", comp.Name).Run()
		case "Raw":
			return exec.Command("systemctl", "is-active", "--quiet", comp.Name).Run()
		default:
			return nil
		}
	}
}

// K8sDeploymentHealthCheck returns a HealthCheckFn that checks Deployment readyReplicas.
func K8sDeploymentHealthCheck(clientset *kubernetes.Clientset, name string) func(cfg *types.DeployConfig) error {
	return func(cfg *types.DeployConfig) error {
		dep, err := clientset.AppsV1().Deployments(constants.Namespace).Get(
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
