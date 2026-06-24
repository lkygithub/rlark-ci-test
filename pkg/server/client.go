package server

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/rlinf/rlark/pkg/server/cert"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type Client struct {
	baseURL    string
	transport  http.RoundTripper
	httpClient *http.Client
}

func NewClientFromKubernetes(ctx context.Context, port int, kubeConfig KubernetesClientConfig) (*Client, error) {
	restConfig, err := kubeConfig.BuildRestConfig()
	if err != nil {
		return nil, fmt.Errorf("build rest config: %w", err)
	}
	kubeClient, err := kubernetes.NewForConfig(restConfig)
	if err != nil {
		return nil, fmt.Errorf("create kube client: %w", err)
	}
	namespace := kubeConfig.DefaultNamespace()

	leases, err := kubeClient.CoordinationV1().Leases(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list leases in namespace %s: %w", namespace, err)
	}
	serverIPs := make([]string, 0)
	for _, item := range leases.Items {
		if strings.HasPrefix(item.Name, ServerPeerPrefix) {
			if item.Spec.HolderIdentity == nil || item.Spec.LeaseDurationSeconds == nil {
				continue
			}
			if time.Since(item.Spec.RenewTime.Time) > time.Duration(*item.Spec.LeaseDurationSeconds)*time.Second {
				continue
			}
			ip, _, _ := strings.Cut(*item.Spec.HolderIdentity, "/")
			if net.ParseIP(ip) != nil {
				serverIPs = append(serverIPs, ip)
			}
		}
	}
	if len(serverIPs) == 0 {
		return nil, fmt.Errorf("no server peers found in namespace %s", namespace)
	}
	serverIP := serverIPs[rand.Intn(len(serverIPs))]

	clientSecret, err := kubeClient.CoreV1().Secrets(namespace).Get(ctx, defaultAdminCertSecretName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("get secret %s/%s: %w", namespace, defaultAdminCertSecretName, err)
	}
	certData, err := cert.LoadData(clientSecret.Data["client.crt"], clientSecret.Data["client.key"])
	if err != nil {
		return nil, fmt.Errorf("load cert data from secret: %w", err)
	}
	clientCert, err := tls.X509KeyPair(certData.CertPEM, certData.KeyPEM)
	if err != nil {
		return nil, fmt.Errorf("create client certificate: %w", err)
	}

	var caCertPool *x509.CertPool
	caSecret, err := kubeClient.CoreV1().Secrets(namespace).Get(ctx, defaultTLSCASecretName, metav1.GetOptions{})
	if err == nil {
		caCertPool = x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caSecret.Data["ca.crt"])
	}

	transport := &http.Transport{
		TLSClientConfig: &tls.Config{
			Certificates:       []tls.Certificate{clientCert},
			RootCAs:            caCertPool,
			MinVersion:         tls.VersionTLS12,
			InsecureSkipVerify: true,
		},
	}

	return &Client{
		baseURL:   fmt.Sprintf("https://%s:%d", serverIP, port),
		transport: transport,
		httpClient: &http.Client{
			Transport: transport,
			Timeout:   30 * time.Second,
		},
	}, nil
}

// BuildURL 构建完整的请求 URL
func (c *Client) BuildURL(parts ...string) string {
	u, _ := url.Parse(c.baseURL)
	u.Path = path.Join(u.Path, path.Join(parts...))
	return u.String()
}

// BuildURLWithQuery 构建带查询参数的请求 URL
func (c *Client) BuildURLWithQuery(query url.Values, parts ...string) string {
	u, _ := url.Parse(c.baseURL)
	u.Path = path.Join(u.Path, path.Join(parts...))
	if query != nil {
		u.RawQuery = query.Encode()
	}
	return u.String()
}

// DoRequest 执行 HTTP 请求
func (c *Client) DoRequest(ctx context.Context, method, rawURL string, body io.Reader, requestOptions ...func(*http.Request)) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, method, rawURL, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	for _, option := range requestOptions {
		option(req)
	}
	return c.httpClient.Do(req)
}

func (c Client) DoRequestWithObject(ctx context.Context, method, rawURL string, obj any, requestOptions ...func(*http.Request)) (*http.Response, error) {
	body, err := json.Marshal(obj)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal object: %w", err)
	}
	return c.DoRequest(ctx, method, rawURL, bytes.NewReader(body), requestOptions...)
}
