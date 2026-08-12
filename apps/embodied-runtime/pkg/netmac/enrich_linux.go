//go:build linux

package netmac

import (
	"fmt"
	"log"
	"net"
	"os/exec"
	"strings"
)

// EnrichMACVLANConfig fills in placeholders in a MACVLANConfig by inspecting
// the host's network interfaces and ARP cache. The host is reached via
// `nsenter --target 1 --net` — the same host-network trick used by
// MACVLAN.Create, which works because the controller pod runs with
// hostPID:true + privileged (and in local mode the controller is already on
// the host).
//
// Two placeholders are resolved:
//
//  1. If HostNIC is empty, the host interface whose subnet contains the
//     configured IP is selected automatically.
//
//  2. If the configured IP is the network address (e.g. "172.16.0.0/24"),
//     an unused IP in the subnet is picked automatically, starting at .100
//     and skipping the host's own IP plus any IP with a resolved MAC in the
//     host's ARP cache. The host IP is always avoided even when the ARP
//     cache is empty or unreachable — matching the "avoid the host's IP"
//     fallback.
//
// Best-effort: any error is logged and the config is left with whatever was
// resolved so far; the caller surfaces the failure when the macvlan is
// created.
func EnrichMACVLANConfig(cfg *MACVLANConfig, logPrefix string) {
	if cfg == nil {
		return
	}
	prefix := logPrefix
	if prefix == "" {
		prefix = "[netmac]"
	}
	ip, ipNet, err := parseIPNet(cfg.IP)
	if err != nil {
		log.Printf("%s enrich macvlan %q: %v", prefix, cfg.Name, err)
		return
	}

	nics, err := queryHostNICs()
	if err != nil {
		log.Printf("%s enrich macvlan %q: query host NICs: %v", prefix, cfg.Name, err)
		return
	}

	// Step 1: resolve HostNIC if missing.
	var hostIP net.IP
	if cfg.HostNIC == "" {
		name, nicIP, ok := findNICForSubnet(nics, ip)
		if !ok {
			log.Printf("%s enrich macvlan %q: no host NIC in subnet of %s", prefix, cfg.Name, ip)
			return
		}
		cfg.HostNIC = name
		hostIP = nicIP
		log.Printf("%s enrich macvlan %q: auto-detected host NIC %s (%s)",
			prefix, cfg.Name, name, hostIP)
	} else if nicIP, ok := ipv4OnNIC(nics, cfg.HostNIC); ok {
		hostIP = nicIP
	}

	// Step 2: if IP is the network address, auto-pick an unused IP.
	if !isNetworkAddress(ip, ipNet) {
		return
	}
	used := readHostARPCache()
	if hostIP != nil {
		used[hostIP.String()] = true
	}
	newIP := pickUnusedIP(ipNet, used, 100)
	if newIP == nil {
		log.Printf("%s enrich macvlan %q: no unused IP in %s", prefix, cfg.Name, ipNet)
		return
	}
	ones, _ := ipNet.Mask.Size()
	cfg.IP = fmt.Sprintf("%s/%d", newIP.String(), ones)
	log.Printf("%s enrich macvlan %q: auto-picked IP %s", prefix, cfg.Name, cfg.IP)
}

// runHostNet runs a command in the host's network namespace (PID 1) via
// nsenter and returns its stdout. Mirrors MACVLAN.Create's nsenter usage.
func runHostNet(args ...string) ([]byte, error) {
	nsArgs := append([]string{"--target", "1", "--net", "--"}, args...)
	out, err := exec.Command("nsenter", nsArgs...).Output()
	if err != nil {
		if ee, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("nsenter %s: %w\n%s",
				strings.Join(args, " "), err, ee.Stderr)
		}
		return nil, fmt.Errorf("nsenter %s: %w", strings.Join(args, " "), err)
	}
	return out, nil
}

// queryHostNICs lists the host's IPv4 interfaces via `ip -o -4 addr show`.
func queryHostNICs() ([]hostNIC, error) {
	out, err := runHostNet("ip", "-o", "-4", "addr", "show")
	if err != nil {
		return nil, err
	}
	return parseIPAddrOutput(out), nil
}

// readHostARPCache returns the set of IPs that have a resolved MAC in the
// host's neighbor table (`ip neigh show`). Returns nil on error — the
// host IP (added by the caller) is still avoided.
func readHostARPCache() map[string]bool {
	out, err := runHostNet("ip", "neigh", "show")
	if err != nil {
		return nil
	}
	return parseIPNeighOutput(out)
}
