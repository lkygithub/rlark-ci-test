package server

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"fmt"
	"math/big"
	"net/http"

	gossh "golang.org/x/crypto/ssh"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rlinf/rlark/pkg/server/cert"
)

const (
	defaultTLSCASecretName     = "rlark-tls-ca"
	defaultTLSSecretName       = "rlark-tls"
	defaultClientCASecretName  = "rlark-client-ca"
	defaultAdminCertSecretName = "rlark-admin-cert"
)

func (s *Server) loadTLSCA(ctx context.Context) error {
	// 读取 Kubernetes Secret 中保存的 TLS CA 证书和私钥，如果不存在则跳过（因为 TLS 证书可能是由外部 CA 签发的，不需要服务器自己管理 CA）。

	secret, err := s.kubeClient.CoreV1().Secrets(s.config.Namespace()).Get(ctx, defaultTLSCASecretName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return nil
		}
		return err
	}
	if secret.Data == nil {
		return fmt.Errorf("TLS CA secret %s/%s has no data", s.config.Namespace(), defaultTLSCASecretName)
	}
	ca, err := cert.LoadData(secret.Data["ca.crt"], secret.Data["ca.key"])
	if err != nil {
		return err
	}

	s.tlsCA = ca
	return nil
}

func (s *Server) loadTLSConfig(ctx context.Context) error {
	// 读取 Kubernetes Secret 中保存的 TLS 证书和私钥，如果不存在则返回错误提示用户创建。

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
		return fmt.Errorf("load TLS data: %w", err)
	}

	s.tls = *data
	return nil
}

func (s *Server) initCAConfigs(ctx context.Context) error {
	// 读取 Kubernetes Secret 中保存的 CA 证书和私钥，如果不存在则创建一个新的 CA 并保存到 Kubernetes 中。

	secret, err := s.kubeClient.CoreV1().Secrets(s.config.Namespace()).Get(ctx, defaultClientCASecretName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			// 如果 Secret 不存在，则创建一个新的 CA 并保存到 Kubernetes 中。
			return s.createAndStoreCA(ctx)
		}
		return err
	}
	if secret.Data == nil {
		return fmt.Errorf("CA secret %s/%s has no data", s.config.Namespace(), defaultClientCASecretName)
	}
	ca, err := cert.LoadData(secret.Data["ca.crt"], secret.Data["ca.key"])
	if err != nil {
		return err
	}

	s.ca = append(s.ca, *ca)
	return nil
}

func (s *Server) createAndStoreCA(ctx context.Context) error {
	// 生成一个新的 CA 证书和私钥，并且保存到 Kubernetes Secret 中。

	ca, err := cert.GenerateCA(cert.GenerateTemplateCA())
	if err != nil {
		return err
	}

	secret := &v1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      defaultClientCASecretName,
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

func (s *Server) signAdminCert(ctx context.Context) error {
	if len(s.ca) == 0 {
		return fmt.Errorf("no CA available to sign admin certificate")
	}

	// 生成一个新的 Admin 证书，并且使用第一个 CA 进行签名。
	// 证书用于其他内部组件访问服务器的 API，具有管理员权限。

	leafKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return fmt.Errorf("generate admin cert key: %w", err)
	}
	serial, _ := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	template := &x509.Certificate{
		SerialNumber: serial,
		Subject:      pkix.Name{CommonName: "admin"},
		NotBefore:    s.ca[0].Cert.NotBefore,
		NotAfter:     s.ca[0].Cert.NotAfter,
		KeyUsage:     x509.KeyUsageDigitalSignature,
		PublicKey:    leafKey.Public(),
		SubjectKeyId: []byte(uuid.NewString()),
	}
	cert.SetX509CertMeta(template, map[string]string{
		"permission.admin": "true", // TODO
	})

	ca := s.ca[0]
	certPEM, err := ca.SignX509Certificate(template)
	if err != nil {
		return fmt.Errorf("sign admin certificate: %w", err)
	}
	keyPEM, err := cert.EncodePrivateKeyToPEM(leafKey)
	if err != nil {
		return fmt.Errorf("encode admin private key: %w", err)
	}

	data := map[string][]byte{
		"client.crt": certPEM,
		"client.key": keyPEM,
	}

	secret, err := s.kubeClient.CoreV1().Secrets(s.config.Namespace()).Get(ctx, defaultAdminCertSecretName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			secret = &v1.Secret{
				ObjectMeta: metav1.ObjectMeta{
					Name:      defaultAdminCertSecretName,
					Namespace: s.config.Namespace(),
					Labels: map[string]string{
						"app":  "rlark",
						"type": "admin-cert",
					},
					Annotations: map[string]string{
						"description": "Admin client certificate and key for RLark server",
					},
					Finalizers: []string{"rlark.io/admin-cert-secret-protection"},
				},
				Data: data,
				Type: v1.SecretTypeOpaque,
			}
			if _, err := s.kubeClient.CoreV1().Secrets(s.config.Namespace()).Create(ctx, secret, metav1.CreateOptions{}); err != nil {
				return fmt.Errorf("create admin cert secret: %w", err)
			}
			return nil
		}
		return fmt.Errorf("get admin cert secret: %w", err)
	}

	secret.Data = data
	if _, err := s.kubeClient.CoreV1().Secrets(s.config.Namespace()).Update(ctx, secret, metav1.UpdateOptions{}); err != nil {
		return fmt.Errorf("update admin cert secret: %w", err)
	}
	return nil
}

func (s *Server) checkCertRevoked(keyID string) bool {
	// TODO
	return false
}

func (s *Server) handleCertCheck(ctx *gin.Context) {
	if len(ctx.Request.TLS.PeerCertificates) > 0 {
		clientCert := ctx.Request.TLS.PeerCertificates[0]
		if s.checkCertRevoked(string(clientCert.SubjectKeyId)) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "client certificate revoked"})
			ctx.Abort()
			return
		}
	} else {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "client certificate required"})
		ctx.Abort()
		return
	}

	ctx.Next()
}

// TODO: API 化
type signRequest struct {
	Type string            `json:"type"`
	Meta map[string]string `json:"meta"`
}

func (s *Server) handleSignCertificate(ctx *gin.Context) {
	var req signRequest
	if err := ctx.BindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if req.Meta == nil {
		req.Meta = make(map[string]string)
	}

	if len(s.ca) == 0 {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "no CA available"})
		return
	}
	ca := s.ca[0]

	leafKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "generate certificate key failed"})
		return
	}
	keyPEM, err := cert.EncodePrivateKeyToPEM(leafKey)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "encode private key failed"})
		return
	}
	serial, _ := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))

	var certPEM []byte
	switch req.Type {
	case "x509", "":
		template := &x509.Certificate{
			SerialNumber: serial,
			Subject:      pkix.Name{CommonName: "client"},
			NotBefore:    ca.Cert.NotBefore,
			NotAfter:     ca.Cert.NotAfter,
			KeyUsage:     x509.KeyUsageDigitalSignature,
			PublicKey:    leafKey.Public(),
			SubjectKeyId: []byte(uuid.NewString()),
		}
		cert.SetX509CertMeta(template, req.Meta)
		certPEM, err = ca.SignX509Certificate(template)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "sign certificate failed"})
			return
		}

	case "ssh":
		sshKey, err := gossh.NewPublicKey(leafKey.Public())
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "create SSH public key failed"})
			return
		}
		template := &gossh.Certificate{
			Key:             sshKey,
			Serial:          serial.Uint64(),
			CertType:        gossh.UserCert,
			KeyId:           uuid.NewString(),
			ValidPrincipals: []string{"client"},
			ValidAfter:      uint64(ca.Cert.NotBefore.Unix()),
			ValidBefore:     uint64(ca.Cert.NotAfter.Unix()),
			Permissions:     gossh.Permissions{},
		}
		cert.SetSSHCertMeta(template, req.Meta)
		certPEM, err = ca.SignSSHCertificate(template)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "sign SSH certificate failed"})
			return
		}

	default:
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "unsupported certificate type"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"cert": string(certPEM),
		"key":  string(keyPEM),
	})
}
