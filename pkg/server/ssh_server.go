package server

import (
	"context"
	"crypto/subtle"
	"fmt"
	"net"

	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/wish"
	"github.com/sirupsen/logrus"
	gossh "golang.org/x/crypto/ssh"

	"github.com/rlinf/rlark/pkg/apis/protocol"
	"github.com/rlinf/rlark/pkg/server/cert"
	"github.com/rlinf/rlark/pkg/server/reverseproxy"
)

func (s *Server) runSSHServer(ctx context.Context) error {
	server, err := wish.NewServer(
		wish.WithAddress(fmt.Sprintf(":%d", s.config.SSHPort)),
		s.channelOption,
		ssh.PublicKeyAuth(s.sshPublicKeyAuth()),
		wish.WithMiddleware(),
	)
	if err != nil {
		return fmt.Errorf("failed to create SSH server: %w", err)
	}

	go func() {
		<-ctx.Done()
		logrus.Printf("Shutting down SSH server on port %d", s.config.SSHPort)
		if err := server.Shutdown(context.Background()); err != nil {
			logrus.Printf("SSH server shutdown error: %v", err)
		}
	}()

	logrus.Printf("Starting SSH server on port %d", s.config.SSHPort)
	return server.ListenAndServe()
}

func (s *Server) sshMiddleware() wish.Middleware {
	return func(next ssh.Handler) ssh.Handler {
		return func(sess ssh.Session) {
			if len(sess.Command()) > 0 {
				_, _ = fmt.Fprintln(sess, "Disallowed command")
			} else {
				_, _, isPty := sess.Pty()
				if !isPty {
					_, _ = fmt.Fprintf(sess, "Welcome to RLark, @%v!\n", sess.User())
				} else {
					_, _ = fmt.Fprintln(sess, "PTY allocation request failed")
				}
			}
		}
	}
}

type wrapSSHMetadata struct {
	ssh.Context
}

func (m wrapSSHMetadata) SessionID() []byte {
	return []byte(m.Context.SessionID())
}

func (m wrapSSHMetadata) ClientVersion() []byte {
	return []byte(m.Context.ClientVersion())
}

func (m wrapSSHMetadata) ServerVersion() []byte {
	return []byte(m.Context.ServerVersion())
}

func (s *Server) sshPublicKeyAuth() ssh.PublicKeyHandler {
	// 从 s.caRootPEM 加载受信任的 CA 公钥
	var caKeys []gossh.PublicKey
	for _, ca := range s.ca {
		if ca.Key != nil {
			key, err := gossh.NewPublicKey(ca.Key.Public())
			if err == nil {
				caKeys = append(caKeys, key)
			}
		}
	}
	if len(caKeys) == 0 {
		logrus.Warning("No SSH CA keys found in caRootPEM, all certificate auth will be rejected")
	}

	cc := &gossh.CertChecker{
		IsUserAuthority: func(auth gossh.PublicKey) bool {
			a := auth.Marshal()
			for _, caKey := range caKeys {
				b := caKey.Marshal()
				if len(a) == len(b) && subtle.ConstantTimeCompare(a, b) == 1 {
					return true
				}
			}
			return false
		},
		IsRevoked: func(cert *gossh.Certificate) bool {
			return s.checkCertRevoked(cert.KeyId)
		},
		UserKeyFallback: func(conn gossh.ConnMetadata, key gossh.PublicKey) (*gossh.Permissions, error) {
			return nil, fmt.Errorf("certificate authentication required")
		},
	}

	return func(ctx ssh.Context, key ssh.PublicKey) bool {
		perm, err := cc.Authenticate(wrapSSHMetadata{ctx}, key)
		if err != nil {
			return false
		}
		ctx.Permissions().Permissions = perm
		return true
	}
}

func (s *Server) channelOption(srv *ssh.Server) error {
	if srv.ChannelHandlers == nil {
		srv.ChannelHandlers = make(map[string]ssh.ChannelHandler)
	}
	srv.ChannelHandlers["direct-tcpip"] = s.handleSSHChannel
	srv.ChannelHandlers["session"] = ssh.DefaultSessionHandler
	return nil
}

func (s *Server) rejectSSHChannel(newChan gossh.NewChannel, message string) {
	if err := newChan.Reject(gossh.Prohibited, message); err != nil {
		logrus.Errorf("Cannot reject channel: %v", err)
	}
}

func (s *Server) handleSSHChannel(srv *ssh.Server, conn *gossh.ServerConn, newChan gossh.NewChannel, ctx ssh.Context) {
	logrus.Debugf("Handle direct-tcpip for user %v in %v", ctx.User(), ctx.SessionID())

	permissions := ctx.Permissions()
	if permissions == nil || permissions.Permissions == nil {
		logrus.Errorf("No permissions found for session %v", ctx.SessionID())
		s.rejectSSHChannel(newChan, "No permissions found")
		return
	}
	userMata, ok := cert.GetSSHCertMeta(&gossh.Certificate{Permissions: *permissions.Permissions})
	if !ok {
		logrus.Errorf("No metadata found for session %v", ctx.SessionID())
		s.rejectSSHChannel(newChan, "No metadata found in certificate")
		return
	}

	var payload protocol.DirectPayload
	err := gossh.Unmarshal(newChan.ExtraData(), &payload)
	if err != nil {
		logrus.Errorf("Cannot accept extra data for %v: %v", ctx.SessionID(), err)
		s.rejectSSHChannel(newChan, fmt.Sprintf("Invalid channel payload: %v", err))
		return
	}

	address := net.JoinHostPort(payload.Host, fmt.Sprint(payload.Port))
	dialer, target, err := s.GetDial(ctx, address, userMata)
	if err != nil {
		logrus.Errorf("Cannot get dialer for %v: %v", ctx.SessionID(), err)
		s.rejectSSHChannel(newChan, fmt.Sprintf("Cannot get dialer: %v", err))
		return
	}

	ch, _, err := newChan.Accept()
	if err != nil {
		logrus.Errorf("Cannot accept channel for %v: %v", ctx.SessionID(), err)
		s.rejectSSHChannel(newChan, fmt.Sprintf("Failed to accept channel: %v", err))
		return
	}
	defer func() { _ = ch.Close() }()

	c, err := dialer(ctx, "tcp", target)
	if err != nil {
		logrus.Errorf("Cannot dial for %v: %v", ctx.SessionID(), err)
		s.rejectSSHChannel(newChan, fmt.Sprintf("Failed to connect to target: %v", err))
		return
	}
	reverseproxy.PipeConnections(ch, c)
}
