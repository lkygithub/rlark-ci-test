package roscontroller

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
// NIC and moved into the container's network namespace.
//
// Layout:
//
//	Host
//	┌────────────────────────────────────────────┐
//	│ Physical NIC: enp0s1 (172.16.0.0/24)       │
//	│   └── macvlan-franka-0 ────────────────────┼──→ Container netns
//	│                                              │
//	│ Physical Robot: 172.16.0.2                  │
//	└──────────────────────────────────────────────┘
//
//	Container
//	┌────────────────────────────────────────────┐
//	│ eth0: 10.1.0.5 (pod network)              │
//	│ macvlan0: 172.16.0.100/24 (robot network) │
//	│                                            │
//	│ roslaunch (runs directly)                  │
//	│   → pod network: ROS Core                  │
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

	created bool
}

// Create attaches a macvlan interface to the container's network namespace.
//
// A container restart within the same pod reuses the pause container's
// network namespace, so a macvlan created by a previous container instance
// may still exist here. Create is idempotent: if the interface already
// exists in this netns it is reused and only its configuration is
// (re)applied, instead of failing on a duplicate "ip link add".
//
// Steps (when not reusing an existing interface):
//  1. nsenter into the host → create macvlan on the host's physical NIC
//  2. Move the macvlan into our container's network namespace
//  3. Configure IP, bring up, add route
func (m *MACVLAN) Create() error {
	// A leftover macvlan in this netns means a previous container instance
	// within the same pod already created it. Reuse it and just (re)apply
	// config — the host-side link was already moved here before.
	if linkExists(m.Name) {
		log.Printf("[ros-controller] macvlan %s already exists in netns; reusing", m.Name)
		m.created = true
		if err := m.configure(); err != nil {
			m.Destroy()
			return err
		}
		log.Printf("[ros-controller] reused macvlan %s in container: %s", m.Name, m.IP)
		return nil
	}

	// Get our PID on the host (with hostPID, container PID == host PID).
	myPID := os.Getpid()
	pidStr := strconv.Itoa(myPID)

	// 1. Create macvlan on the host's physical NIC.
	cmd := exec.Command("nsenter", "--target", "1", "--net", "--pid", "--mount", "--",
		"ip", "link", "add", m.Name, "link", m.HostNIC, "type", "macvlan", "mode", "bridge")
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("create macvlan on host: %w\n%s", err, string(out))
	}

	// 2. Move the macvlan into our container's network namespace.
	cmd = exec.Command("nsenter", "--target", "1", "--net", "--",
		"ip", "link", "set", m.Name, "netns", pidStr)
	if out, err := cmd.CombinedOutput(); err != nil {
		// Rollback: delete the orphaned macvlan on the host.
		_ = exec.Command("nsenter", "--target", "1", "--net", "--",
			"ip", "link", "delete", m.Name).Run()
		return fmt.Errorf("move macvlan to container: %w\n%s", err, string(out))
	}

	// Mark created before configuring so a configure failure is still cleaned
	// up by Destroy() — the interface now lives in our netns.
	m.created = true
	if err := m.configure(); err != nil {
		m.Destroy()
		return err
	}
	log.Printf("[ros-controller] created macvlan %s on host %s → container: %s",
		m.Name, m.HostNIC, m.IP)
	return nil
}

// configure assigns the IP, brings the interface up, and adds the default
// route. It is idempotent so re-running on a reused interface (container
// restart within the same pod) is safe:
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
	if out, err := exec.Command("ip", "-4", "addr", "flush", "dev", m.Name).CombinedOutput(); err != nil {
		log.Printf("[ros-controller] WARNING: flush addrs on macvlan %s: %s",
			m.Name, strings.TrimSpace(string(out)))
	}

	cmds := [][]string{
		{"ip", "addr", "add", m.IP, "dev", m.Name},
		{"ip", "link", "set", m.Name, "up"},
	}
	if m.Gateway != "" {
		cmds = append(cmds, []string{"ip", "route", "add", "default", "via", m.Gateway, "dev", m.Name})
	}
	for _, args := range cmds {
		out, err := exec.Command(args[0], args[1:]...).CombinedOutput()
		// Tolerate "File exists" (e.g. the default route already present on
		// a reused interface, or the address if the flush above failed).
		if err != nil && !isAlreadyExists(out) {
			return fmt.Errorf("configure macvlan %s: %w\n%s", m.Name, err, string(out))
		}
	}
	return nil
}

// linkExists reports whether a network interface with the given name exists
// in the current (container) network namespace.
func linkExists(name string) bool {
	_, err := exec.Command("ip", "link", "show", name).CombinedOutput()
	return err == nil
}

// isAlreadyExists reports whether an `ip` command's output indicates the
// object already exists ("RTNETLINK answers: File exists"). Used to make
// configuration commands idempotent.
func isAlreadyExists(out []byte) bool {
	return strings.Contains(string(out), "File exists")
}

// Destroy deletes the macvlan interface from the container's network namespace.
func (m *MACVLAN) Destroy() {
	if !m.created {
		return
	}

	_ = exec.Command("ip", "link", "delete", m.Name).Run()
	m.created = false
	log.Printf("[ros-controller] deleted macvlan %s", m.Name)
}
