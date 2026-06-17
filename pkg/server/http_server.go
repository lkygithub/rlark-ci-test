package server

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func (s *Server) registerHTTPHandlers(r *gin.Engine) {
	api := r.Group("/api", func(ctx *gin.Context) {
		if len(ctx.Request.TLS.PeerCertificates) > 0 {
			clientCert := ctx.Request.TLS.PeerCertificates[0]
			if s.checkCertRevoked(string(clientCert.SubjectKeyId)) {
				ctx.JSON(http.StatusUnauthorized, gin.H{"error": "client certificate revoked"})
				ctx.Abort()
				return
			}
		}
	})
	api.GET("connect", s.handleProxyConnect)
}

func (s *Server) runHTTPServer(ctx context.Context) error {
	r := gin.Default()
	s.registerHTTPHandlers(r)

	certPool := x509.NewCertPool()
	for _, ca := range s.ca {
		if ca.Cert != nil {
			certPool.AddCert(ca.Cert)
		}
	}
	tlsCert, err := tls.X509KeyPair(s.tls.CertPEM, s.tls.KeyPEM)
	if err != nil {
		return fmt.Errorf("failed to load server TLS certificate: %w", err)
	}
	server := http.Server{
		Addr:    fmt.Sprintf(":%d", s.config.HTTPSPort),
		Handler: r,
		TLSConfig: &tls.Config{
			ClientAuth:   tls.RequireAndVerifyClientCert,
			ClientCAs:    certPool,
			MinVersion:   tls.VersionTLS12,
			Certificates: []tls.Certificate{tlsCert},
			NextProtos:   []string{"http/1.1"},
		},
		TLSNextProto: map[string]func(*http.Server, *tls.Conn, http.Handler){},
	}

	l, err := net.Listen("tcp", server.Addr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", server.Addr, err)
	}
	tlsListener := tls.NewListener(l, server.TLSConfig)

	go func() {
		<-ctx.Done()
		logrus.Printf("Shutting down HTTP server on port %d", s.config.HTTPSPort)
		if err := server.Shutdown(context.Background()); err != nil {
			logrus.Printf("HTTP server shutdown error: %v", err)
		}
	}()

	logrus.Printf("Starting HTTPS server on port %d", s.config.HTTPSPort)
	return server.Serve(tlsListener)
}
