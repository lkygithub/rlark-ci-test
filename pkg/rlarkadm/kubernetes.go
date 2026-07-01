package rlarkadm

import (
	"context"
	"fmt"

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

	for _, c := range ComponentsForPlane(cfg.Plane) {
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
