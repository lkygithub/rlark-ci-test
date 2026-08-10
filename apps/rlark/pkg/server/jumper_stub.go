package server

import (
	"context"
	"fmt"

	"github.com/charmbracelet/ssh"
	"github.com/rlinf/rlark/apps/rlark/pkg/jumper"
)

// JumperStub implements jumper.TargetResolver and jumper.TerminalDialer for the
// SSH bastion host. It is created per SSH session and bridges the SSH session's
// I/O with the jumper.Terminal I/O bridge.
//
// JumperStub is passed to jumper.Serve which handles the target selection menu
// and terminal session loop. The SSH session's stdin/stdout and resize channel
// are translated into jumper.Window events and passed to the jumper package.
type JumperStub struct {
	s    *Server
	sess ssh.Session

	// User is the authenticated SSH username from the session.
	User string
	// Meta holds certificate metadata extracted from the SSH certificate.
	Meta map[string]string
}

// NewJumperStub creates a new JumperStub for the given SSH session.
func NewJumperStub(s *Server, sess ssh.Session, user string, meta map[string]string) *JumperStub {
	return &JumperStub{
		s:    s,
		sess: sess,
		User: user,
		Meta: meta,
	}
}

// JumperAvailable reports whether the bastion host is available for the session.
// Currently always returns true.
func (j *JumperStub) JumperAvailable() bool {
	return true
}

// Resolve implements jumper.TargetResolver. It returns the list of targets
// the authenticated user may connect to via the bastion host.
func (j *JumperStub) Resolve(ctx context.Context) ([]jumper.Target, error) {
	// TODO: Implement target resolution based on the user's permissions and available resources.
	return []jumper.Target{}, nil
}

// Dial implements jumper.TerminalDialer. It establishes a terminal session to
// the given target and returns a jumper.Terminal.
func (j *JumperStub) Dial(ctx context.Context, target jumper.Target) (jumper.Terminal, error) {
	// TODO: Implement terminal dialing to the target.
	return nil, fmt.Errorf("not implemented")
}

// Serve handles the SSH bastion host session. It bridges the SSH pty resize
// events into jumper.Window events and delegates to jumper.Serve for the
// target selection menu and terminal I/O loop.
func (j *JumperStub) Serve(ctx context.Context, pty ssh.Pty, sizeCh <-chan ssh.Window) {
	resizeCh := make(chan jumper.Window, 1)
	go func() {
		for w := range sizeCh {
			resizeCh <- jumper.Window{Width: w.Width, Height: w.Height}
		}
	}()

	_ = jumper.Serve(ctx, j, j, j.sess, j.sess, resizeCh)
}
