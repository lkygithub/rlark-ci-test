package nodeserver

import (
	"context"
	"io"
	"net"
	"net/url"
	"time"

	"github.com/rlinf/rlark/pkg/log"
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
	logger := log.FromContext(ctx)
	l, err := s.config.Listen()
	if err != nil {
		return err
	}
	defer func() { _ = l.Close() }()

	logger.Info("Node server listening", "address", s.config.UnixSocketAddress)

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
				logger.Error(nil, "Failed to get peer process", "err", err)
				_ = conn.Close()
				continue
			}
			cred, err := s.getCred(ctx, pid)
			if err != nil {
				logger.Error(nil, "Failed to get credentials", "pid", pid, "err", err)
				_ = conn.Close()
				continue
			}
			go s.handleConnection(ctx, utils.NewWrapConn(conn), cred)
		}
	}
}

func (s *NodeServer[C]) handleConnection(ctx context.Context, conn *utils.WrapConn, cred C) {
	logger := log.FromContext(ctx)
	ctx, cancel := context.WithTimeout(ctx, time.Second*30)
	defer cancel()

	defer func() { _ = conn.Close() }()

	network, host, port, query, err := utils.ReadTargetFromConn(conn)
	if err != nil {
		logger.Error(nil, "Failed to read target from connection", "err", err)
		return
	}
	dial, err := s.getDial(ctx, cred, host, query)
	if err != nil {
		logger.Error(nil, "Failed to get target", "host", host, "err", err)
		return
	}
	conn2, err := dial(ctx)
	if err != nil {
		logger.Error(nil, "Failed to connect to target", "host", host, "port", port, "err", err)
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
		logger.Error(nil, "Failed to write target to proxy", "target", targetUrl.String(), "err", err)
		return
	}

	go func() {
		_, _ = io.Copy(conn2, conn)
	}()
	_, _ = io.Copy(conn, conn2)
}
