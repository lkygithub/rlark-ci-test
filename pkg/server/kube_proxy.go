package server

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/sirupsen/logrus"
	"k8s.io/client-go/rest"
)

type KubeProxy struct {
	apiServer *url.URL
	transport http.RoundTripper
}

// NewKubeProxy creates a new KubeProxy instance
func NewKubeProxy(restConfig *rest.Config) (*KubeProxy, error) {
	// Build API Server URL
	apiURL, err := url.Parse(restConfig.Host)
	if err != nil {
		return nil, fmt.Errorf("parse API server URL: %w", err)
	}
	// Build Transport (automatically handles certificates, tokens, etc.)
	transport, err := rest.TransportFor(restConfig)
	if err != nil {
		return nil, fmt.Errorf("create transport for API server: %w", err)
	}
	return &KubeProxy{
		apiServer: apiURL,
		transport: transport,
	}, nil
}

// GetHandler returns an http.Handler that proxies requests to the Kubernetes API server
func (p *KubeProxy) GetHandler() http.Handler {
	proxy := httputil.NewSingleHostReverseProxy(p.apiServer)
	proxy.Transport = p.transport
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = p.apiServer.Host
		req.Header.Set("Accept", "application/json, */*")
	}
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		logrus.Errorf("KubeProxy error: %v", err)
		http.Error(w, "KubeProxy error: "+err.Error(), http.StatusBadGateway)
	}
	return proxy
}
