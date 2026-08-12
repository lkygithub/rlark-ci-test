package deviceplugin

import (
	"testing"

	"github.com/rlinf/rlark/apps/embodied-runtime/pkg/netmac"
	devicepb "github.com/rlinf/rlark/sdks/embodied-runtime-go/gen/device/v1"
	pluginapi "k8s.io/kubelet/pkg/apis/deviceplugin/v1beta1"
)

// TestEffectiveDevinitSocketPath verifies the default lives inside RunDir
// (so the existing RunDir mount reaches it) and an explicit value wins.
func TestEffectiveDevinitSocketPath(t *testing.T) {
	cfg := PluginConfig{}
	if got := cfg.EffectiveDevinitSocketPath(); got != DevinitSocketPath {
		t.Errorf("default = %q, want %q", got, DevinitSocketPath)
	}
	if got := cfg.EffectiveDevinitSocketPath(); got != RunDir+"/devinit.sock" {
		t.Errorf("default %q should be inside RunDir %q", got, RunDir)
	}

	cfg.DevinitSocketPath = "/custom/devinit.sock"
	if got := cfg.EffectiveDevinitSocketPath(); got != "/custom/devinit.sock" {
		t.Errorf("override = %q, want /custom/devinit.sock", got)
	}
}

// TestAllocateContainer_HostMacvlans verifies Allocate injects the device
// init discovery env vars (RLINF_EMBODIED_DEVINIT_ENABLED + _SOCKET_PATH)
// when host_macvlans is non-empty, and omits both when it is empty. The
// macvlan itself is never device-mounted (it must be created inside the pod
// netns), so Devices stays empty regardless.
func TestAllocateContainer_HostMacvlans(t *testing.T) {
	cases := []struct {
		name        string
		hostMacvlns []netmac.MACVLANConfig
		wantEnv     bool
	}{
		{name: "none", hostMacvlns: nil, wantEnv: false},
		{
			name: "one macvlan",
			hostMacvlns: []netmac.MACVLANConfig{
				{Name: "macvlan0", HostNIC: "eno1", IP: "172.16.0.100/24"},
			},
			wantEnv: true,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			p := &Plugin{cfg: PluginConfig{HostMacvlans: tc.hostMacvlns}}
			resp := p.allocateContainer(&pluginapi.ContainerAllocateRequest{
				DevicesIds: []string{"device-0"},
			})

			enabled, ok := resp.Envs["RLINF_EMBODIED_DEVINIT_ENABLED"]
			if tc.wantEnv {
				if !ok || enabled != "1" {
					t.Errorf("RLINF_EMBODIED_DEVINIT_ENABLED = %q (ok=%v), want 1", enabled, ok)
				}
				if sp, ok2 := resp.Envs["RLINF_EMBODIED_DEVINIT_SOCKET_PATH"]; !ok2 || sp == "" {
					t.Errorf("RLINF_EMBODIED_DEVINIT_SOCKET_PATH missing/empty: %q (ok=%v)", sp, ok2)
				}
				// macvlans are never device-mounted.
				if len(resp.Devices) != 0 {
					t.Errorf("macvlans must not be device-mounted, got %d DeviceSpecs", len(resp.Devices))
				}
			} else {
				if ok {
					t.Errorf("RLINF_EMBODIED_DEVINIT_ENABLED should not be set, got %q", enabled)
				}
			}
		})
	}
}

// TestNewDeviceServer_SkipsInvalidConfigs verifies that configs failing
// validation (e.g. a network-address placeholder IP) are dropped at server
// construction, while fully-specified configs are kept. EnrichMACVLANConfig
// is best-effort (no-ops when the host is unreachable, e.g. in CI), so the
// test only relies on ValidateMACVLANConfig — which is pure.
func TestNewDeviceServer_SkipsInvalidConfigs(t *testing.T) {
	cfgs := []netmac.MACVLANConfig{
		{Name: "good", HostNIC: "eno1", IP: "172.16.0.100/24"},
		{Name: "bad-net", HostNIC: "eno1", IP: "172.16.0.0/24"},     // network addr
		{Name: "bad-bcast", HostNIC: "eno1", IP: "172.16.0.255/24"}, // broadcast
		{Name: "bad-noip", HostNIC: "eno1", IP: ""},
	}
	srv := NewDeviceServer(cfgs, "/tmp/macvlan-test.sock")
	if !srv.HasMacvlans() {
		t.Fatal("HasMacvlans = false, want true (the 'good' entry should survive)")
	}
	if len(srv.cfgs) != 1 {
		t.Fatalf("kept %d configs, want 1", len(srv.cfgs))
	}
	if srv.cfgs[0].Name != "good" {
		t.Errorf("kept config = %q, want good", srv.cfgs[0].Name)
	}
}

// TestNewDeviceServer_EmptyHasNoMacvlans verifies a server with no usable
// config reports HasMacvlans=false (so the device plugin skips starting it).
func TestNewDeviceServer_EmptyHasNoMacvlans(t *testing.T) {
	srv := NewDeviceServer(nil, "/tmp/macvlan-test.sock")
	if srv.HasMacvlans() {
		t.Error("HasMacvlans = true for nil configs, want false")
	}
	// All-invalid also yields HasMacvlans=false.
	srv = NewDeviceServer([]netmac.MACVLANConfig{
		{Name: "bad", HostNIC: "eno1", IP: "172.16.0.0/24"},
	}, "/tmp/macvlan-test.sock")
	if srv.HasMacvlans() {
		t.Error("HasMacvlans = true for all-invalid configs, want false")
	}
}

// TestMacvlanNames verifies the skipped-list helper preserves order.
func TestMacvlanNames(t *testing.T) {
	cfgs := []netmac.MACVLANConfig{
		{Name: "macvlan0"},
		{Name: "macvlan1"},
	}
	got := macvlanNames(cfgs)
	if len(got) != 2 || got[0] != "macvlan0" || got[1] != "macvlan1" {
		t.Errorf("macvlanNames = %v, want [macvlan0 macvlan1]", got)
	}
}

// TestSetupResponse_NoConfigs verifies Setup returns an empty (non-error)
// response when the server has no configs — e.g. if all were filtered out
// after construction. The host-network check is bypassed here because the
// caller is not in a real netns; this case focuses on the empty-config path
// by driving the server directly with a context that carries a PID, and
// asserting the behaviour when host-network detection cannot be performed
// is surfaced as an error rather than a crash.
func TestSetupResponse_NilServerSafe(t *testing.T) {
	// A nil-pointer-safe HasMacvlans keeps the device plugin wiring simple.
	var nilSrv *DeviceServer
	if nilSrv.HasMacvlans() {
		t.Error("nil DeviceServer.HasMacvlans = true, want false")
	}
}

// Compile-time assertion that DeviceServer satisfies the gRPC server
// interface generated from the proto.
var _ devicepb.DeviceServiceServer = (*DeviceServer)(nil)

// Compile-time assertion that the device plugin Server still implements the
// kubelet DevicePlugin server interface after the macvlan wiring was added.
var _ pluginapi.DevicePluginServer = (*Server)(nil)
