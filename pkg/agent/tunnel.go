package agent

import (
	"context"
	"net"
	"time"

	"github.com/rancher/remotedialer"
	"github.com/sirupsen/logrus"
)

func (a *Agent) runTunnel(ctx context.Context) error {
	auth := func(proto, address string) bool {
		return true
	}
	netDialer := func(ctx context.Context, network, addr string) (net.Conn, error) {
		var d net.Dialer
		return d.DialContext(ctx, network, addr)
	}
	connect := func() error {
		ws, _, err := a.serverClient.DialWebsocket(ctx, nil)
		if err != nil {
			return err
		}
		defer func() { _ = ws.Close() }()

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
