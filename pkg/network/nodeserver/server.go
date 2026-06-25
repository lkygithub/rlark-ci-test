package nodeserver

import (
	"context"
	"io"
	"net"
	"net/url"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/rlinf/rlark/pkg/utils"
)

type CredGetter[C any] func(ctx context.Context, pid int32) (C, error)
type DialGetter[C any] func(ctx context.Context, cred C, host string, query url.Values) (utils.Dial, error)

type NodeServer[C any] struct {
	config  Config
	getCred CredGetter[C]
	getDial DialGetter[C]
}

func NewNodeServer[C any](config Config, getCred CredGetter[C], getDial DialGetter[C]) *NodeServer[C] {
	return &NodeServer[C]{
		config:  config,
		getCred: getCred,
		getDial: getDial,
	}
}

func (s *NodeServer[C]) Run(ctx context.Context) error {
	l, err := s.config.Listen()
	if err != nil {
		return err
	}
	defer func() { _ = l.Close() }()

	logrus.Infof("Node server listening on %s", s.config.UnixSocketAddress)

	for {
		select {
		case <-ctx.Done():
			return nil
		default:
			conn, err := l.Accept()
			if err != nil {
				return err
			}
			pid, err := GetPeerProcess(conn)
			if err != nil {
				logrus.Errorf("Failed to get peer process: %v", err)
				_ = conn.Close()
				continue
			}
			cred, err := s.getCred(ctx, pid)
			if err != nil {
				logrus.Errorf("Failed to get credentials for pid %d: %v", pid, err)
				_ = conn.Close()
				continue
			}
			go s.handleConnection(ctx, utils.NewWrapConn(conn), cred)
		}
	}
}

func (s *NodeServer[C]) handleConnection(ctx context.Context, conn *utils.WrapConn, cred C) {
	ctx, cancel := context.WithTimeout(ctx, time.Second*30)
	defer cancel()

	defer func() { _ = conn.Close() }()

	network, host, port, query, err := utils.ReadTargetFromConn(conn)
	if err != nil {
		logrus.Errorf("Failed to read target from connection: %v", err)
		return
	}
	dial, err := s.getDial(ctx, cred, host, query)
	if err != nil {
		logrus.Errorf("Failed to get target for host %s: %v", host, err)
		return
	}
	conn2, err := dial(ctx)
	if err != nil {
		logrus.Errorf("Failed to connect to target %s:%s: %v", host, port, err)
		return
	}
	defer func() { _ = conn2.Close() }()

	targetUrl := &url.URL{
		Scheme:   network,
		Host:     net.JoinHostPort(host, port),
		RawQuery: query.Encode(),
	}
	proxyData := []byte(targetUrl.String() + "\n")
	if _, err := conn2.Write(proxyData); err != nil {
		logrus.Errorf("Failed to write target to proxy for %s: %v", targetUrl.String(), err)
		return
	}

	go func() {
		_, _ = io.Copy(conn2, conn)
	}()
	_, _ = io.Copy(conn, conn2)
}
