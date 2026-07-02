package rlarkadm

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/sirupsen/logrus"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

type KubernetesDeployer struct{}

func (d *KubernetesDeployer) Deploy(cfg *DeployConfig, certBundle *CertBundle) error {
	kubeconfig := cfg.Kubernetes.Kubeconfig
	if kubeconfig == "" {
		kubeconfig = clientcmd.NewDefaultClientConfigLoadingRules().GetDefaultFilename()
	}
	restConfig, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return fmt.Errorf("build kubeconfig: %w", err)
	}
	clientset, err := kubernetes.NewForConfig(restConfig)
	if err != nil {
		return fmt.Errorf("create clientset: %w", err)
	}
	ctx := context.Background()

	if err := ensureNamespace(ctx, clientset); err != nil {
		return err
	}

	if certBundle != nil {
		if err := createCertSecret(ctx, clientset, cfg, certBundle); err != nil {
			return err
		}
	}

	if cfg.DB != nil {
		if err := createDBConfigMap(ctx, clientset, cfg); err != nil {
			return err
		}
		if err := createPostgresInitConfigMap(ctx, clientset); err != nil {
			return err
		}
	}

	// todo 可以并发部署

	for _, c := range ComponentsForPlane(cfg) {
		c.HealthCheckFn = k8sDeploymentHealthCheck(clientset, c.Name)
		if c.Name == ComponentKCP {
			c.PostDeployFn = extractKCPKubeconfigFn(ctx, clientset)
		}

		if err := createDeployment(ctx, clientset, c.Deployment(cfg)); err != nil {
			return err
		}

		if svc := c.Service(); svc != nil {
			if err := createService(ctx, clientset, svc); err != nil {
				return err
			}
		}

		logrus.Infof("  - %s: Deployment (port %d)", c.Name, c.Port)
		if c.Service() != nil {
			logrus.Infof("    + Service (port %d)", c.Port)
		}

		if err := waitForHealthy(cfg, c); err != nil {
			return err
		}

		if c.PostDeployFn != nil {
			if err := c.PostDeployFn(cfg); err != nil {
				return err
			}
		}
	}

	logrus.Infof("%s plane deployed to namespace %s", cfg.Plane, Namespace)
	return nil
}

func ensureNamespace(ctx context.Context, clientset *kubernetes.Clientset) error {
	_, err := clientset.CoreV1().Namespaces().Get(ctx, Namespace, metav1.GetOptions{})
	if err == nil {
		return nil
	}
	if !errors.IsNotFound(err) {
		return fmt.Errorf("get namespace %s: %w", Namespace, err)
	}
	_, err = clientset.CoreV1().Namespaces().Create(ctx, &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{Name: Namespace},
	}, metav1.CreateOptions{})
	if err != nil && !errors.IsAlreadyExists(err) {
		return fmt.Errorf("create namespace %s: %w", Namespace, err)
	}
	return nil
}

// extractKCPKubeconfigFn returns a PostDeployFn that extracts admin.kubeconfig
// from the KCP pod and creates a ConfigMap for other components to mount.
func extractKCPKubeconfigFn(ctx context.Context, clientset *kubernetes.Clientset) func(cfg *DeployConfig) error {
	return func(cfg *DeployConfig) error {
		pods, err := clientset.CoreV1().Pods(Namespace).List(ctx, metav1.ListOptions{
			LabelSelector: "app=" + ComponentKCP,
		})
		if err != nil {
			return fmt.Errorf("list kcp pods: %w", err)
		}
		if len(pods.Items) == 0 {
			return fmt.Errorf("no kcp pods found")
		}

		podName := pods.Items[0].Name

		// Wait for admin.kubeconfig to be available, then extract via kubectl exec
		deadline := time.Now().Add(60 * time.Second)
		var kubeconfigData string
		for {
			cmd := exec.Command("kubectl", "-n", Namespace, "exec", podName, "--", "cat", KCPDataDir+"/admin.kubeconfig")
			var buf bytes.Buffer
			cmd.Stdout = &buf
			err := cmd.Run()
			if err == nil && buf.Len() > 0 {
				kubeconfigData = buf.String()
				break
			}
			if time.Now().After(deadline) {
				return fmt.Errorf("timeout waiting for kcp admin.kubeconfig: %w", err)
			}
			time.Sleep(2 * time.Second)
		}

		_, err = clientset.CoreV1().ConfigMaps(Namespace).Create(ctx, &corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: "rlark-kcp-kubeconfig"},
			Data:       map[string]string{"admin.kubeconfig": kubeconfigData},
		}, metav1.CreateOptions{})
		if err != nil && !errors.IsAlreadyExists(err) {
			return fmt.Errorf("create kcp kubeconfig configmap: %w", err)
		}
		if errors.IsAlreadyExists(err) {
			_, err = clientset.CoreV1().ConfigMaps(Namespace).Update(ctx, &corev1.ConfigMap{
				ObjectMeta: metav1.ObjectMeta{Name: "rlark-kcp-kubeconfig"},
				Data:       map[string]string{"admin.kubeconfig": kubeconfigData},
			}, metav1.UpdateOptions{})
			if err != nil {
				return fmt.Errorf("update kcp kubeconfig configmap: %w", err)
			}
		}

		logrus.Info("  - extracted admin.kubeconfig from kcp to ConfigMap rlark-kcp-kubeconfig")

		if err := installCRDs(podName); err != nil {
			return fmt.Errorf("install CRDs to kcp: %w", err)
		}

		return nil
	}
}

// installCRDs copies CRD manifests into the KCP pod and applies them using
// kubectl inside the pod, since the local machine cannot reach the KCP API directly.
func installCRDs(podName string) error {
	crdDir := filepath.Join("config", "crd", "bases")
	matches, err := filepath.Glob(filepath.Join(crdDir, "*.yaml"))
	if err != nil {
		return fmt.Errorf("glob crd files: %w", err)
	}
	if len(matches) == 0 {
		logrus.Warn("  - no CRD files found in config/crd/bases/, skipping CRD install")
		return nil
	}

	for _, crdFile := range matches {
		tmpPath := "/tmp/" + filepath.Base(crdFile)

		cpCmd := exec.Command("kubectl", "-n", Namespace, "cp", crdFile, podName+":"+tmpPath)
		var cpErr bytes.Buffer
		cpCmd.Stderr = &cpErr
		if err := cpCmd.Run(); err != nil {
			return fmt.Errorf("copy %s to pod: %w: %s", filepath.Base(crdFile), err, cpErr.String())
		}

		kc := KCPDataDir + "/admin.kubeconfig"
		var lastErr error
		for attempt := 0; attempt < 5; attempt++ {
			createCmd := exec.Command("kubectl", "-n", Namespace, "exec", podName, "--",
				"kubectl", "--kubeconfig", kc, "create", "--validate=false", "-f", tmpPath)
			var createErr bytes.Buffer
			createCmd.Stderr = &createErr
			if err := createCmd.Run(); err == nil {
				lastErr = nil
				break
			}
			replaceCmd := exec.Command("kubectl", "-n", Namespace, "exec", podName, "--",
				"kubectl", "--kubeconfig", kc, "replace", "--validate=false", "-f", tmpPath)
			var replaceErr bytes.Buffer
			replaceCmd.Stderr = &replaceErr
			if err := replaceCmd.Run(); err == nil {
				lastErr = nil
				break
			}
			lastErr = fmt.Errorf("apply %s: create: %s | replace: %s", filepath.Base(crdFile), createErr.String(), replaceErr.String())
			if attempt < 2 {
				time.Sleep(5 * time.Second)
			}
		}
		if lastErr != nil {
			return lastErr
		}
		logrus.Infof("  - applied CRD %s", filepath.Base(crdFile))
	}

	return nil
}

func createDBConfigMap(ctx context.Context, clientset *kubernetes.Clientset, cfg *DeployConfig) error {
	yamlData, err := DBConfigYAML(cfg.DB)
	if err != nil {
		return err
	}
	_, err = clientset.CoreV1().ConfigMaps(Namespace).Create(ctx, &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "rlark-db-config"},
		Data:       map[string]string{"db.yaml": string(yamlData)},
	}, metav1.CreateOptions{})
	if err != nil && !errors.IsAlreadyExists(err) {
		return fmt.Errorf("create db configmap: %w", err)
	}
	return nil
}

func createPostgresInitConfigMap(ctx context.Context, clientset *kubernetes.Clientset) error {
	_, err := clientset.CoreV1().ConfigMaps(Namespace).Create(ctx, &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "rlark-postgres-init"},
		Data:       map[string]string{"init-db.sql": initDBSQL},
	}, metav1.CreateOptions{})
	if err != nil && !errors.IsAlreadyExists(err) {
		return fmt.Errorf("create postgres init configmap: %w", err)
	}
	return nil
}

func createCertSecret(ctx context.Context, clientset *kubernetes.Clientset, cfg *DeployConfig, bundle *CertBundle) error {
	name := "rlark-tls"
	if cfg.Plane == PlaneData {
		name = "rlark-agent-cert"
	}
	_, err := clientset.CoreV1().Secrets(Namespace).Create(ctx, &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: name},
		Data: map[string][]byte{
			"ca.crt":  bundle.CACertPEM,
			"tls.crt": bundle.CertPEM,
			"tls.key": bundle.KeyPEM,
		},
	}, metav1.CreateOptions{})
	if err != nil && !errors.IsAlreadyExists(err) {
		return fmt.Errorf("create cert secret: %w", err)
	}
	return nil
}

func createDeployment(ctx context.Context, clientset *kubernetes.Clientset, dep *appsv1.Deployment) error {
	_, err := clientset.AppsV1().Deployments(Namespace).Create(ctx, dep, metav1.CreateOptions{})
	if err != nil {
		if errors.IsAlreadyExists(err) {
			_, err = clientset.AppsV1().Deployments(Namespace).Update(ctx, dep, metav1.UpdateOptions{})
			if err != nil {
				return fmt.Errorf("update deployment %s: %w", dep.Name, err)
			}
			return nil
		}
		return fmt.Errorf("create deployment %s: %w", dep.Name, err)
	}
	return nil
}

func createService(ctx context.Context, clientset *kubernetes.Clientset, svc *corev1.Service) error {
	_, err := clientset.CoreV1().Services(Namespace).Create(ctx, svc, metav1.CreateOptions{})
	if err != nil && !errors.IsAlreadyExists(err) {
		return fmt.Errorf("create service %s: %w", svc.Name, err)
	}
	return nil
}
