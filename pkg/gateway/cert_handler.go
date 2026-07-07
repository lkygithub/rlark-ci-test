package gateway

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/rlinf/rlark/pkg/log"
)

const (
	kcpAdminCertSecret = "rlark-admin-cert"
	kcpTLSCASecret     = "rlark-tls-ca"
	kcpSecretNamespace = "default"
)

type signAgentCertRequest struct {
	ClusterID string `json:"cluster_id" binding:"required"`
}

type signAgentCertResponse struct {
	ClusterID  string `json:"cluster_id"`
	CACert     string `json:"ca_cert"`
	AgentCert  string `json:"agent_cert"`
	AgentKey   string `json:"agent_key"`
	ServerAddr string `json:"server_addr"`
}

func (g *Gateway) handleSignAgentCert(c *gin.Context) {
	logger := log.FromContext(c.Request.Context())

	var req signAgentCertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cluster_id is required"})
		return
	}

	if g.config.ServerAddress == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "server-address is not configured"})
		return
	}

	adminCertPEM, adminKeyPEM, caCertPEM, err := g.getKCPAdminCerts()
	if err != nil {
		logger.Error(err, "failed to get KCP admin certificates")
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("get admin cert: %v", err)})
		return
	}

	agentCertPEM, agentKeyPEM, err := g.signCertViaServer(adminCertPEM, adminKeyPEM, caCertPEM, req.ClusterID)
	if err != nil {
		logger.Error(err, "failed to sign agent certificate")
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("sign agent cert: %v", err)})
		return
	}

	c.JSON(http.StatusOK, signAgentCertResponse{
		ClusterID:  req.ClusterID,
		CACert:     string(caCertPEM),
		AgentCert:  agentCertPEM,
		AgentKey:   agentKeyPEM,
		ServerAddr: g.config.ServerAddress,
	})
}

func (g *Gateway) getKCPAdminCerts() (certPEM, keyPEM, caPEM []byte, err error) {
	if g.rawClient == nil {
		return nil, nil, nil, fmt.Errorf("raw kubernetes client not initialized")
	}

	ctx := context.Background()

	adminSecret, err := g.rawClient.CoreV1().Secrets(kcpSecretNamespace).Get(ctx, kcpAdminCertSecret, metav1.GetOptions{})
	if err != nil {
		return nil, nil, nil, fmt.Errorf("get secret %s: %w", kcpAdminCertSecret, err)
	}

	caSecret, err := g.rawClient.CoreV1().Secrets(kcpSecretNamespace).Get(ctx, kcpTLSCASecret, metav1.GetOptions{})
	if err != nil {
		return nil, nil, nil, fmt.Errorf("get secret %s: %w", kcpTLSCASecret, err)
	}

	certPEM = adminSecret.Data["client.crt"]
	keyPEM = adminSecret.Data["client.key"]
	caPEM = caSecret.Data["ca.crt"]

	if len(certPEM) == 0 || len(keyPEM) == 0 || len(caPEM) == 0 {
		return nil, nil, nil, fmt.Errorf("incomplete certificate data in secrets")
	}

	return certPEM, keyPEM, caPEM, nil
}

func (g *Gateway) signCertViaServer(adminCertPEM, adminKeyPEM, caCertPEM []byte, clusterID string) (certPEM, keyPEM string, err error) {
	cert, err := tls.X509KeyPair(adminCertPEM, adminKeyPEM)
	if err != nil {
		return "", "", fmt.Errorf("load admin keypair: %w", err)
	}

	caPool := x509.NewCertPool()
	if !caPool.AppendCertsFromPEM(caCertPEM) {
		return "", "", fmt.Errorf("failed to parse CA cert")
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      caPool,
	}

	httpClient := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
	}

	signReq := map[string]string{
		"role":      "agent",
		"client_id": clusterID,
	}
	reqBody, _ := json.Marshal(signReq)

	serverURL := strings.TrimSuffix(g.config.ServerAddress, "/") + "/api/sign"
	resp, err := httpClient.Post(serverURL, "application/json", bytes.NewReader(reqBody))
	if err != nil {
		return "", "", fmt.Errorf("call server /api/sign: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("read sign response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("server sign failed: HTTP %d: %s", resp.StatusCode, string(body))
	}

	var signResp struct {
		CertPEM string `json:"cert_pem"`
		KeyPEM  string `json:"key_pem"`
	}
	if err := json.Unmarshal(body, &signResp); err != nil {
		return "", "", fmt.Errorf("unmarshal sign response: %w", err)
	}

	return signResp.CertPEM, signResp.KeyPEM, nil
}
