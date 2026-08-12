package deviceplugin

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"path/filepath"
	"sync"

	"github.com/rlinf/rlark/apps/embodied-runtime/pkg/netmac"
	"github.com/rlinf/rlark/apps/embodied-runtime/pkg/utils"
	devicepb "github.com/rlinf/rlark/sdks/embodied-runtime-go/gen/device/v1"
	"google.golang.org/grpc"
)

// ---------------------------------------------------------------------------
// DeviceServer — on-demand device gRPC service exposed by the device
// plugin over a Unix socket (inside RunDir, already mounted into
// requesting pods). A pod's init container runs the `devinit` CLI, which
// connects to the socket and calls Setup; the server reads the caller's
// PID from the socket peer credentials (SO_PEERCRED) to target that PID's
// namespace.
//
// DeviceServer is the general host for on-demand device setup that cannot
// be delivered via Allocate (which only does device mounts). Macvlan setup
// is one such service — the only one today: a macvlan is a network
// interface that must be created inside the target netns, so it cannot be
// mounted. It is created via pkg/netmac (NewMACVLAN + WithPID), and pods
// using hostNetwork are detected (their netns == host netns) and skipped
// so a macvlan is never dropped into the host netns. As more on-demand
// device services are needed they can be hosted here alongside the
// macvlan setup RPC.
// ---------------------------------------------------------------------------

// DeviceServer implements device.v1.DeviceService (the macvlan setup RPC,
// the first service it hosts). It owns the Unix socket listener and gRPC
// server, and serves the node-level host_macvlans config to whichever pod
// asks.
type DeviceServer struct {
	devicepb.UnimplementedDeviceServiceServer

	cfgs   []netmac.MACVLANConfig
	socket string

	// srv is set in Start and read in Stop. mu guards started + srv so Stop
	// does not race with a concurrent/incomplete Start.
	mu      sync.Mutex
	srv     *grpc.Server
	started bool
}

// NewDeviceServer builds a DeviceServer for the given macvlan configs and
// socket path. Each config is enriched and validated (Linux) at this point
// so an invalid config is logged and dropped rather than failing a later
// pod request; on non-Linux EnrichMACVLANConfig is a no-op so configs must
// be fully specified. An empty cfgs slice yields a nil-meaning server (the
// caller checks HasMacvlans instead of constructing one).
func NewDeviceServer(cfgs []netmac.MACVLANConfig, socketPath string) *DeviceServer {
	prepared := make([]netmac.MACVLANConfig, 0, len(cfgs))
	for i := range cfgs {
		c := cfgs[i]
		netmac.EnrichMACVLANConfig(&c, "[device-plugin/macvlan]")
		if err := netmac.ValidateMACVLANConfig(c); err != nil {
			log.Printf("[device-plugin/macvlan] WARNING: skipping macvlan %q: %v", c.Name, err)
			continue
		}
		prepared = append(prepared, c)
	}
	return &DeviceServer{
		cfgs:   prepared,
		socket: socketPath,
	}
}

// HasMacvlans reports whether the server has any usable macvlan config to
// serve. When false the device plugin does not start the service.
func (s *DeviceServer) HasMacvlans() bool { return s != nil && len(s.cfgs) > 0 }

// SocketPath returns the Unix socket path the service listens on.
func (s *DeviceServer) SocketPath() string { return s.socket }

// Start creates the socket, registers the gRPC service, and serves. It
// blocks until Stop is called or the listener errors. Safe to call once.
func (s *DeviceServer) Start() error {
	s.mu.Lock()
	if s.started {
		s.mu.Unlock()
		return fmt.Errorf("macvlan server already started")
	}
	s.started = true
	s.mu.Unlock()

	if err := os.MkdirAll(filepath.Dir(s.socket), 0755); err != nil {
		return fmt.Errorf("create macvlan socket dir: %w", err)
	}
	if err := os.Remove(s.socket); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove stale macvlan socket: %w", err)
	}

	raw, err := net.Listen("unix", s.socket)
	if err != nil {
		return fmt.Errorf("listen macvlan socket %s: %w", s.socket, err)
	}
	// Wrap the listener so each accepted connection carries its peer PID
	// through to the gRPC handler (see utils.PeerPIDListener /
	// utils.PIDFromContext).
	listener := &utils.PeerPIDListener{Listener: raw}

	srv := grpc.NewServer()
	devicepb.RegisterDeviceServiceServer(srv, s)

	// Publish srv under the lock so Stop (which may be called concurrently)
	// sees a fully-constructed server to GracefulStop.
	s.mu.Lock()
	s.srv = srv
	s.mu.Unlock()

	log.Printf("[device-plugin/macvlan] gRPC listening on %s (%d macvlans)",
		s.socket, len(s.cfgs))
	return srv.Serve(listener)
}

// Stop gracefully shuts down the macvlan gRPC server. Safe to call even if
// Start was never called or is still in progress (no-op in those cases).
func (s *DeviceServer) Stop() {
	s.mu.Lock()
	srv := s.srv
	started := s.started
	s.mu.Unlock()
	if !started || srv == nil {
		return
	}
	srv.GracefulStop()
}

// Setup implements device.v1.DeviceService. It reads the caller's PID
// from the connection peer credentials, skips the request when the caller
// is in the host network namespace, and otherwise creates each configured
// macvlan inside the caller's network namespace.
func (s *DeviceServer) Setup(ctx context.Context, _ *devicepb.SetupRequest) (*devicepb.SetupResponse, error) {
	pid, err := utils.PIDFromContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("identify caller: %w", err)
	}

	hostNet, err := utils.IsHostNetwork(pid)
	if err != nil {
		return nil, fmt.Errorf("check host network for pid %d: %w", pid, err)
	}
	if hostNet {
		log.Printf("[device-plugin/macvlan] caller pid=%d is in host netns — skipping", pid)
		return &devicepb.SetupResponse{
			HostNetwork: true,
			Skipped:     macvlanNames(s.cfgs),
		}, nil
	}

	created := make([]string, 0, len(s.cfgs))
	mvs := make([]*netmac.MACVLAN, 0, len(s.cfgs))
	for _, c := range s.cfgs {
		mv := netmac.NewMACVLAN(c, netmac.WithPID(pid))
		if err := mv.Create(); err != nil {
			// Roll back the macvlans already created in this call so a
			// partial setup does not leak interfaces in the pod netns.
			log.Printf("[device-plugin/macvlan] create %s for pid=%d failed: %v — rolling back",
				c.Name, pid, err)
			for _, done := range mvs {
				done.Destroy()
			}
			return nil, fmt.Errorf("create macvlan %s for pid %d: %w", c.Name, pid, err)
		}
		mvs = append(mvs, mv)
		created = append(created, c.Name)
	}
	log.Printf("[device-plugin/macvlan] set up %d macvlan(s) for pid=%d: %v",
		len(created), pid, created)
	return &devicepb.SetupResponse{Created: created}, nil
}

// macvlanNames returns the Name field of each config, for the skipped list.
func macvlanNames(cfgs []netmac.MACVLANConfig) []string {
	out := make([]string, 0, len(cfgs))
	for _, c := range cfgs {
		out = append(out, c.Name)
	}
	return out
}
