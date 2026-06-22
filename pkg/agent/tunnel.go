package agent

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net"
	"net/url"
	"os"
	"path"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rancher/remotedialer"
	"github.com/sirupsen/logrus"
)

func (a *Agent) runTunnel(ctx context.Context) error {
	clientCert, err := tls.LoadX509KeyPair(a.config.ClientCertPath, a.config.ClientKeyPath)
	if err != nil {
		return fmt.Errorf("load client certificate: %w", err)
	}
	var caCertPool *x509.CertPool
	if a.config.CAPath != "" {
		caCertPool = x509.NewCertPool()
		caCertData, err := os.ReadFile(a.config.CAPath)
		if err != nil {
			return fmt.Errorf("read CA certificate: %w", err)
		}
		if ok := caCertPool.AppendCertsFromPEM(caCertData); !ok {
			return fmt.Errorf("failed to append CA certificate")
		}
	}

	surl, err := url.Parse(a.config.ServerAddress)
	if err != nil {
		return err
	}
	dialerTarget := surl.Host
	connectNetDialer := func(ctx context.Context, network, addr string) (net.Conn, error) {
		var d net.Dialer
		return d.DialContext(ctx, network, dialerTarget)
	}

	if a.config.ServerHostname != "" {
		if port := surl.Port(); port != "" {
			surl.Host = a.config.ServerHostname + ":" + port
		} else {
			surl.Host = a.config.ServerHostname
		}
	}
	surl.Scheme = "wss"
	surl.Path = path.Join(surl.Path, "api", "connect")
	dialer := &websocket.Dialer{
		TLSClientConfig: &tls.Config{
			Certificates:       []tls.Certificate{clientCert},
			RootCAs:            caCertPool,
			MinVersion:         tls.VersionTLS12,
			InsecureSkipVerify: a.config.InsecureSkipTLSVerify,
		},
		HandshakeTimeout: remotedialer.HandshakeTimeOut,
		NetDialContext:   connectNetDialer,
	}
	auth := func(proto, address string) bool {
		return true
	}
	netDialer := func(ctx context.Context, network, addr string) (net.Conn, error) {
		var d net.Dialer
		return d.DialContext(ctx, network, addr)
	}
	connect := func() error {
		ws, _, err := dialer.DialContext(ctx, surl.String(), nil)
		if err != nil {
			return err
		}
		defer ws.Close()

		sessCtx, cancel := context.WithCancel(ctx)
		defer cancel()

		session := remotedialer.NewClientSessionWithDialer(auth, ws, netDialer)
		defer session.Close()

		_, err = session.Serve(sessCtx)
		return err
	}

	for {
		if err := connect(); err != nil {
			logrus.WithError(err).Error("tunnel connection error")
		}
		select {
		case <-ctx.Done():
			return nil
		default:
			time.Sleep(5 * time.Second)
		}
	}
}
