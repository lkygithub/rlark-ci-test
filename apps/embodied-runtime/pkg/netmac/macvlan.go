package netmac

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

// MACVLAN manages a macvlan interface that connects the container to the
// robot's physical network. The interface is created on the host's physical
// NIC and moved into the target network namespace.
//
// By default the target namespace is the current one — i.e. the network
// namespace of the process running the controller (thanks to hostPID:true,
// the container's PID equals its host PID, so moving the link into the
// current PID's netns lands it in the container). Set PID to a non-zero
// value to operate on the network namespace of another process — e.g. a
// robot container whose PID is visible on the host. A PID of 0 means "the
// current network namespace" (the original behaviour).
//
// Layout:
//
//	Host
//	┌────────────────────────────────────────────┐
//	│ Physical NIC: enp0s1 (172.16.0.0/24)       │
//	│   └── macvlan-franka-0 ────────────────────┼──→ Target netns (PID)
//	│                                              │
//	│ Physical Robot: 172.16.0.2                  │
//	└──────────────────────────────────────────────┘
//
//	Target netns (current process, or PID-specified container)
//	┌────────────────────────────────────────────┐
//	│ eth0: 10.1.0.5 (pod network)              │
//	│ macvlan0: 172.16.0.100/24 (robot network) │
//	│                                            │
//	│ launch process (runs directly)             │
//	│   → pod network: ROS middleware            │
//	│   → macvlan0:   physical robot             │
//	└────────────────────────────────────────────┘
type MACVLAN struct {
	// Name is the macvlan interface name (e.g. "macvlan0").
	Name string

	// HostNIC is the host's physical NIC connected to the robot network.
	// e.g. "enp0s1", "eth0", "ens3"
	HostNIC string

	// IP is the IP address with CIDR prefix for the macvlan interface.
	// e.g. "172.16.0.100/24"
	IP string

	// Gateway is the optional default gateway for the robot subnet.
	Gateway string

	// PID optionally targets another process's network namespace.
	// When 0 (the default) the current network namespace is used —
	// i.e. the namespace of the controller process itself, which (with
	// hostPID:true) is the container's own netns. When non-zero, all
	// namespace-local operations (link/addr/route) are performed inside
	// the network namespace of the given PID via `nsenter --target <pid>
	// --net`. The host-side create/move steps still enter PID 1.
	//
	// Set with the WithPID creation option rather than the yaml config,
	// since the PID is a runtime parameter (not a static, declarative
	// value).
	PID int

	created bool
}

// CreateOption is a creation-time option for NewMACVLAN. It carries the
// runtime parameters that are NOT part of the declarative MACVLANConfig
// (which is yaml-deserialised) — e.g. the PID whose network namespace the
// macvlan should be moved into.
type CreateOption func(*MACVLAN)

// WithPID targets the network namespace of the given PID instead of the
// current one. A PID of 0 selects the current network namespace (the
// default). The PID must be visible on the host — e.g. the controller pod
// runs with hostPID:true, so a robot container's host PID can be passed in
// to manage that container's netns.
func WithPID(pid int) CreateOption {
	return func(m *MACVLAN) { m.PID = pid }
}

// NewMACVLAN creates a MACVLAN from a MACVLANConfig plus optional creation
// options. The returned MACVLAN targets the current network namespace
// unless WithPID is supplied. Existing callers that pass only the config
// (NewMACVLAN(cfg)) are unchanged.
func NewMACVLAN(cfg MACVLANConfig, opts ...CreateOption) *MACVLAN {
	m := &MACVLAN{
		Name:    cfg.Name,
		HostNIC: cfg.HostNIC,
		IP:      cfg.IP,
		Gateway: cfg.Gateway,
	}
	for _, opt := range opts {
		if opt != nil {
			opt(m)
		}
	}
	return m
}

// Create attaches a macvlan interface to the target network namespace.
//
// A container restart within the same pod reuses the pause container's
// network namespace, so a macvlan created by a previous container instance
// may still exist here. Create is idempotent: if the interface already
// exists in the target netns it is reused and only its configuration is
// (re)applied, instead of failing on a duplicate "ip link add".
//
// Steps (when not reusing an existing interface):
//  1. nsenter into the host → create macvlan on the host's physical NIC
//  2. Move the macvlan into the target network namespace (current PID when
//     m.PID == 0, otherwise m.PID)
//  3. Configure IP, bring up, add route inside the target netns
func (m *MACVLAN) Create() error {
	// PID is a host PID; negative values are programming errors that
	// would otherwise surface as confusing nsenter failures. Treat
	// them as invalid up front.
	if m.PID < 0 {
		return fmt.Errorf("create macvlan %s: invalid pid %d (must be >= 0)", m.Name, m.PID)
	}

	// A leftover macvlan in the target netns means a previous instance
	// already created it. Reuse it and just (re)apply config — the
	// host-side link was already moved here before.
	if m.linkExists() {
		log.Printf("[netmac] %s already exists in netns(pid=%d); reusing", m.Name, m.PID)
		m.created = true
		if err := m.configure(); err != nil {
			m.Destroy()
			return err
		}
		log.Printf("[netmac] reused %s: %s", m.Name, m.IP)
		return nil
	}

	// The PID whose netns we move the macvlan into. PID 0 means "current
	// netns" — resolve it to the current process's PID on the host
	// (hostPID:true makes container PID == host PID).
	targetPID := m.PID
	if targetPID == 0 {
		targetPID = os.Getpid()
	}
	pidStr := strconv.Itoa(targetPID)

	// 1. Create macvlan on the host's physical NIC.
	cmd := exec.Command("nsenter", "--target", "1", "--net", "--pid", "--mount", "--",
		"ip", "link", "add", m.Name, "link", m.HostNIC, "type", "macvlan", "mode", "bridge")
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("create macvlan on host: %w\n%s", err, string(out))
	}

	// 2. Move the macvlan into the target network namespace.
	cmd = exec.Command("nsenter", "--target", "1", "--net", "--",
		"ip", "link", "set", m.Name, "netns", pidStr)
	if out, err := cmd.CombinedOutput(); err != nil {
		// Rollback: delete the orphaned macvlan on the host.
		_ = exec.Command("nsenter", "--target", "1", "--net", "--",
			"ip", "link", "delete", m.Name).Run()
		return fmt.Errorf("move macvlan to netns: %w\n%s", err, string(out))
	}

	// Mark created before configuring so a configure failure is still cleaned
	// up by Destroy() — the interface now lives in the target netns.
	m.created = true
	if err := m.configure(); err != nil {
		m.Destroy()
		return err
	}
	log.Printf("[netmac] created %s on host %s → netns(pid=%d): %s",
		m.Name, m.HostNIC, targetPID, m.IP)
	return nil
}

// configure assigns the IP, brings the interface up, and adds the default
// route inside the target network namespace. It is idempotent so
// re-running on a reused interface (container restart within the same pod)
// is safe:
//   - IPv4 addresses are flushed first, so a stale IP from a previous run
//     (e.g. a config change between restarts) is removed instead of
//     accumulating as a second address. Best-effort: a flush failure falls
//     back to the "File exists" tolerance below.
//   - "File exists" from `ip route add` (default route already present on a
//     reused interface) is tolerated. `ip route replace` is deliberately
//     NOT used — it could clobber the pod's eth0 default route.
func (m *MACVLAN) configure() error {
	// Drop any addresses already on the interface so the subsequent
	// `ip addr add` always applies cleanly and never leaves a duplicate.
	if out, err := m.netnsCmd("-4", "addr", "flush", "dev", m.Name).CombinedOutput(); err != nil {
		log.Printf("[netmac] WARNING: flush addrs on %s: %s",
			m.Name, strings.TrimSpace(string(out)))
	}

	cmds := [][]string{
		{"addr", "add", m.IP, "dev", m.Name},
		{"link", "set", m.Name, "up"},
	}
	if m.Gateway != "" {
		cmds = append(cmds, []string{"route", "add", "default", "via", m.Gateway, "dev", m.Name})
	}
	for _, args := range cmds {
		out, err := m.netnsCmd(args...).CombinedOutput()
		// Tolerate "File exists" (e.g. the default route already present on
		// a reused interface, or the address if the flush above failed).
		if err != nil && !isAlreadyExists(out) {
			return fmt.Errorf("configure macvlan %s: %w\n%s", m.Name, err, string(out))
		}
	}
	return nil
}

// netnsCmd returns a command that runs `ip <args>` either in the current
// network namespace (PID 0) or inside the network namespace of m.PID via
// `nsenter --target <pid> --net`. Callers drive it with CombinedOutput /
// Run / Output. The host-side create/move steps are NOT routed through
// here — they always enter PID 1 (see Create).
func (m *MACVLAN) netnsCmd(args ...string) *exec.Cmd {
	if m.PID == 0 {
		return exec.Command("ip", args...)
	}
	nsArgs := append([]string{"--target", strconv.Itoa(m.PID), "--net", "--", "ip"}, args...)
	return exec.Command("nsenter", nsArgs...)
}

// linkExists reports whether a network interface named m.Name exists in the
// target network namespace (current netns when PID is 0).
func (m *MACVLAN) linkExists() bool {
	_, err := m.netnsCmd("link", "show", m.Name).CombinedOutput()
	return err == nil
}

// isAlreadyExists reports whether an `ip` command's output indicates the
// object already exists ("RTNETLINK answers: File exists"). Used to make
// configuration commands idempotent.
func isAlreadyExists(out []byte) bool {
	return strings.Contains(string(out), "File exists")
}

// Destroy deletes the macvlan interface from the target network namespace.
func (m *MACVLAN) Destroy() {
	if !m.created {
		return
	}

	_ = m.netnsCmd("link", "delete", m.Name).Run()
	m.created = false
	log.Printf("[netmac] deleted %s", m.Name)
}
