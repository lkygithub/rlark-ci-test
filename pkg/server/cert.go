package server

import (
	"context"
	"fmt"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/rlinf/rlark/pkg/server/cert"
)

const defaultCASecretName = "rlark-ca"
const defaultTLSSecretName = "rlark-tls"

func (s *Server) initCAConfigs(ctx context.Context) error {
	secret, err := s.kubeClient.CoreV1().Secrets(s.config.Namespace()).Get(ctx, defaultCASecretName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			// 如果 Secret 不存在，则创建一个新的 CA 并保存到 Kubernetes 中。
			return s.createAndStoreCA(ctx)
		}
		return err
	}
	if secret.Data == nil {
		return fmt.Errorf("CA secret %s/%s has no data", s.config.Namespace(), defaultCASecretName)
	}
	ca, err := cert.LoadData(secret.Data["ca.crt"], secret.Data["ca.key"])
	if err != nil {
		return err
	}

	s.ca = append(s.ca, *ca)
	return nil
}

func (s *Server) createAndStoreCA(ctx context.Context) error {
	ca, err := cert.GenerateCA(cert.GenerateTemplateCA())
	if err != nil {
		return err
	}

	secret := &v1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      defaultCASecretName,
			Namespace: s.config.Namespace(),
			Labels: map[string]string{
				"app":  "rlark",
				"type": "ca",
			},
			Annotations: map[string]string{
				"description": "CA certificate and key for RLark server",
			},
			Finalizers: []string{"rlark.io/ca-secret-protection"},
		},
		Data: map[string][]byte{
			"ca.crt": ca.CertPEM,
			"ca.key": ca.KeyPEM,
		},
		Type: v1.SecretTypeOpaque,
	}
	_, err = s.kubeClient.CoreV1().Secrets(s.config.Namespace()).Create(ctx, secret, metav1.CreateOptions{})
	if err != nil {
		return err
	}

	s.ca = append(s.ca, *ca)
	return nil
}

func (s *Server) initTLSConfig(ctx context.Context) error {
	secret, err := s.kubeClient.CoreV1().Secrets(s.config.Namespace()).Get(ctx, defaultTLSSecretName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return fmt.Errorf("TLS secret %s/%s not found, please create it with the server certificate and key", s.config.Namespace(), defaultTLSSecretName)
		}
		return err
	}
	if secret.Data == nil {
		return fmt.Errorf("TLS secret %s/%s has no data", s.config.Namespace(), defaultTLSSecretName)
	}
	data, err := cert.LoadData(secret.Data[v1.TLSCertKey], secret.Data[v1.TLSPrivateKeyKey])
	if err != nil {
		return fmt.Errorf("failed to load TLS data: %w", err)
	}

	s.tls = *data
	return nil
}

func (s *Server) checkCertRevoked(keyID string) bool {
	// TODO
	return false
}
