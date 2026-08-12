package netmac

import (
	"reflect"
	"testing"
)

// TestIsAlreadyExists verifies the "File exists" detection used to make
// macvlan configuration commands idempotent (so reusing a leftover
// interface from a previous container instance does not fail).
func TestIsAlreadyExists(t *testing.T) {
	cases := []struct {
		out  string
		want bool
	}{
		{"RTNETLINK answers: File exists\n", true},
		{"Error: File exists\n", true},
		{"RTNETLINK answers: No such process\n", false},
		{"Device or resource busy\n", false},
		{"", false},
	}
	for _, c := range cases {
		if got := isAlreadyExists([]byte(c.out)); got != c.want {
			t.Errorf("isAlreadyExists(%q) = %v, want %v", c.out, got, c.want)
		}
	}
}

// TestNewMACVLANDefaultPID verifies the default (no creation option) targets
// the current network namespace (PID 0), preserving the original behaviour.
func TestNewMACVLANDefaultPID(t *testing.T) {
	cfg := MACVLANConfig{
		Name:    "macvlan0",
		HostNIC: "eno1",
		IP:      "172.16.0.100/24",
		Gateway: "172.16.0.1",
	}
	m := NewMACVLAN(cfg)
	if m.PID != 0 {
		t.Errorf("default PID = %d, want 0 (current netns)", m.PID)
	}
	if m.Name != "macvlan0" || m.HostNIC != "eno1" ||
		m.IP != "172.16.0.100/24" || m.Gateway != "172.16.0.1" {
		t.Errorf("NewMACVLAN config not copied: %+v", m)
	}
}

// TestNewMACVLANWithPID verifies that the WithPID creation option targets
// another process's network namespace while leaving the declarative config
// fields untouched.
func TestNewMACVLANWithPID(t *testing.T) {
	cfg := MACVLANConfig{
		Name:    "macvlan0",
		HostNIC: "eno1",
		IP:      "172.16.0.100/24",
		Gateway: "172.16.0.1",
	}
	m := NewMACVLAN(cfg, WithPID(4321))
	if m.PID != 4321 {
		t.Errorf("WithPID(4321): PID = %d, want 4321", m.PID)
	}
	if m.Name != "macvlan0" || m.HostNIC != "eno1" ||
		m.IP != "172.16.0.100/24" || m.Gateway != "172.16.0.1" {
		t.Errorf("WithPID clobbered config fields: %+v", m)
	}

	// WithPID(0) explicitly selects the current netns.
	m = NewMACVLAN(cfg, WithPID(0))
	if m.PID != 0 {
		t.Errorf("WithPID(0): PID = %d, want 0", m.PID)
	}
}

// TestNetnsCmd verifies the per-namespace command wrapping:
//   - PID 0  → plain `ip <args>` (current netns)
//   - PID >0 → `nsenter --target <pid> --net -- ip <args>`
//
// Only the constructed command's Args are inspected; nothing is executed,
// so this does not require `ip` or `nsenter` to exist on the test host.
func TestNetnsCmd(t *testing.T) {
	m := &MACVLAN{Name: "macvlan0"}

	// PID 0 → current netns: plain `ip`.
	c := m.netnsCmd("link", "show", "macvlan0")
	want := []string{"ip", "link", "show", "macvlan0"}
	if !reflect.DeepEqual(c.Args, want) {
		t.Errorf("PID 0: cmd args = %v, want %v", c.Args, want)
	}

	// PID 1234 → nsenter into that PID's netns.
	m.PID = 1234
	c = m.netnsCmd("addr", "add", "172.16.0.100/24", "dev", "macvlan0")
	want = []string{
		"nsenter", "--target", "1234", "--net", "--", "ip",
		"addr", "add", "172.16.0.100/24", "dev", "macvlan0",
	}
	if !reflect.DeepEqual(c.Args, want) {
		t.Errorf("PID 1234: cmd args = %v, want %v", c.Args, want)
	}
}

// TestCreateRejectsNegativePID verifies that a negative PID — a programming
// error — fails fast at Create instead of leaking into nsenter. The guard
// runs before any command is executed, so this is safe on any platform.
func TestCreateRejectsNegativePID(t *testing.T) {
	cfg := MACVLANConfig{Name: "macvlan0", HostNIC: "eno1", IP: "172.16.0.100/24"}
	m := NewMACVLAN(cfg, WithPID(-1))
	if err := m.Create(); err == nil {
		t.Error("Create with PID -1: expected error, got nil")
	}
	if m.created {
		t.Error("Create with PID -1: should not mark created")
	}
}
