package roscontroller

import (
	"net"
	"reflect"
	"testing"
)

// TestIsBroadcast covers the /24 and /30 broadcast detection.
func TestIsBroadcast(t *testing.T) {
	cases := []struct {
		ip   string
		want bool
	}{
		{"172.16.0.255/24", true},
		{"172.16.0.0/24", false}, // network, not broadcast
		{"172.16.0.5/24", false},
		{"192.168.1.3/30", true}, // /30 broadcast
		{"192.168.1.1/30", false},
	}
	for _, c := range cases {
		ip, ipNet, err := parseIPNet(c.ip)
		if err != nil {
			t.Fatalf("parseIPNet(%q): %v", c.ip, err)
		}
		if got := isBroadcast(ip, ipNet); got != c.want {
			t.Errorf("isBroadcast(%s) = %v, want %v", c.ip, got, c.want)
		}
	}
}

// TestValidateMACVLANConfig verifies that unresolved placeholders and
// missing required fields are rejected, and a fully-resolved config passes.
func TestValidateMACVLANConfig(t *testing.T) {
	t.Run("valid", func(t *testing.T) {
		cfg := MACVLANConfig{Name: "macvlan0", HostNIC: "eno1", IP: "172.16.0.100/24"}
		if err := ValidateMACVLANConfig(cfg); err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})
	t.Run("missing_name", func(t *testing.T) {
		cfg := MACVLANConfig{HostNIC: "eno1", IP: "172.16.0.100/24"}
		if err := ValidateMACVLANConfig(cfg); err == nil {
			t.Error("expected error for empty name")
		}
	})
	t.Run("missing_host_nic", func(t *testing.T) {
		cfg := MACVLANConfig{Name: "macvlan0", IP: "172.16.0.100/24"}
		if err := ValidateMACVLANConfig(cfg); err == nil {
			t.Error("expected error for empty host_nic")
		}
	})
	t.Run("invalid_ip", func(t *testing.T) {
		cfg := MACVLANConfig{Name: "macvlan0", HostNIC: "eno1", IP: "not-an-ip"}
		if err := ValidateMACVLANConfig(cfg); err == nil {
			t.Error("expected error for invalid ip")
		}
	})
	t.Run("network_address_placeholder", func(t *testing.T) {
		cfg := MACVLANConfig{Name: "macvlan0", HostNIC: "eno1", IP: "172.16.0.0/24"}
		if err := ValidateMACVLANConfig(cfg); err == nil {
			t.Error("expected error for unresolved network-address placeholder")
		}
	})
	t.Run("broadcast_address", func(t *testing.T) {
		cfg := MACVLANConfig{Name: "macvlan0", HostNIC: "eno1", IP: "172.16.0.255/24"}
		if err := ValidateMACVLANConfig(cfg); err == nil {
			t.Error("expected error for broadcast address")
		}
	})
}

// TestParseIPNet covers the default-prefix (/24), explicit-prefix, and
// rejection of empty / IPv6 inputs.
func TestParseIPNet(t *testing.T) {
	t.Run("no_prefix_defaults_to_24", func(t *testing.T) {
		ip, ipNet, err := parseIPNet("172.16.0.0")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !ip.Equal(net.IPv4(172, 16, 0, 0)) {
			t.Errorf("ip = %v", ip)
		}
		ones, _ := ipNet.Mask.Size()
		if ones != 24 {
			t.Errorf("prefix = %d, want 24", ones)
		}
	})
	t.Run("explicit_prefix", func(t *testing.T) {
		_, ipNet, err := parseIPNet("172.16.0.5/16")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		ones, _ := ipNet.Mask.Size()
		if ones != 16 {
			t.Errorf("prefix = %d, want 16", ones)
		}
	})
	t.Run("empty", func(t *testing.T) {
		if _, _, err := parseIPNet(""); err == nil {
			t.Error("expected error for empty ip")
		}
	})
	t.Run("ipv6_rejected", func(t *testing.T) {
		if _, _, err := parseIPNet("2001:db8::1/64"); err == nil {
			t.Error("expected error for IPv6")
		}
	})
	t.Run("invalid", func(t *testing.T) {
		if _, _, err := parseIPNet("not-an-ip"); err == nil {
			t.Error("expected error for invalid ip")
		}
	})
}

// TestIsNetworkAddress verifies the placeholder detection: a network
// address triggers enrichment, a concrete host address does not.
func TestIsNetworkAddress(t *testing.T) {
	cases := []struct {
		ip   string
		want bool
	}{
		{"172.16.0.0/24", true},  // network address → placeholder
		{"172.16.0.5/24", false}, // concrete host
		{"172.16.5.0/24", true},  // network of a different /24
		{"10.0.0.0/16", true},    // network /16
		{"10.0.0.5/16", false},
	}
	for _, c := range cases {
		ip, ipNet, err := parseIPNet(c.ip)
		if err != nil {
			t.Fatalf("parseIPNet(%q): %v", c.ip, err)
		}
		if got := isNetworkAddress(ip, ipNet); got != c.want {
			t.Errorf("isNetworkAddress(%s) = %v, want %v", c.ip, got, c.want)
		}
	}
}

// TestPickUnusedIP covers the common /24 case: default start, used entries,
// host avoidance, wrap-around, and exhaustion.
func TestPickUnusedIP(t *testing.T) {
	_, ipNet, _ := parseIPNet("172.16.0.0/24")

	t.Run("empty_picks_100", func(t *testing.T) {
		got := pickUnusedIP(ipNet, nil, 100)
		if got == nil || got.String() != "172.16.0.100" {
			t.Errorf("got %v, want 172.16.0.100", got)
		}
	})
	t.Run("skip_used", func(t *testing.T) {
		used := map[string]bool{"172.16.0.100": true, "172.16.0.101": true}
		got := pickUnusedIP(ipNet, used, 100)
		if got == nil || got.String() != "172.16.0.102" {
			t.Errorf("got %v, want 172.16.0.102", got)
		}
	})
	t.Run("wrap_from_254_to_1", func(t *testing.T) {
		// Fill 100..254 — next should wrap to 1.
		used := map[string]bool{}
		for o := 100; o <= 254; o++ {
			used[net.IPv4(172, 16, 0, byte(o)).String()] = true
		}
		got := pickUnusedIP(ipNet, used, 100)
		if got == nil || got.String() != "172.16.0.1" {
			t.Errorf("got %v, want 172.16.0.1", got)
		}
	})
	t.Run("full_returns_nil", func(t *testing.T) {
		used := map[string]bool{}
		for o := 1; o <= 254; o++ {
			used[net.IPv4(172, 16, 0, byte(o)).String()] = true
		}
		if got := pickUnusedIP(ipNet, used, 100); got != nil {
			t.Errorf("got %v, want nil", got)
		}
	})
	t.Run("start_below_1_clamped", func(t *testing.T) {
		got := pickUnusedIP(ipNet, nil, 0)
		if got == nil || got.String() != "172.16.0.1" {
			t.Errorf("got %v, want 172.16.0.1", got)
		}
	})
}

// TestPickUnusedIP_NarrowPrefix verifies that candidates outside a narrow
// subnet (e.g. /30) are skipped — the picker must not return an IP that is
// not a valid host in the subnet.
func TestPickUnusedIP_NarrowPrefix(t *testing.T) {
	_, ipNet, _ := parseIPNet("192.168.1.0/30") // only .1 and .2 are hosts
	got := pickUnusedIP(ipNet, nil, 100)
	if got == nil || got.String() != "192.168.1.1" {
		t.Errorf("got %v, want 192.168.1.1", got)
	}
	// .1 taken → .2
	got = pickUnusedIP(ipNet, map[string]bool{"192.168.1.1": true}, 100)
	if got == nil || got.String() != "192.168.1.2" {
		t.Errorf("got %v, want 192.168.1.2", got)
	}
	// both taken → nil
	got = pickUnusedIP(ipNet, map[string]bool{
		"192.168.1.1": true, "192.168.1.2": true,
	}, 100)
	if got != nil {
		t.Errorf("got %v, want nil", got)
	}
}

// TestFindNICForSubnet verifies that the NIC whose subnet contains the
// configured IP is selected.
func TestFindNICForSubnet(t *testing.T) {
	nics := []hostNIC{
		{Name: "docker0", IP: net.IPv4(172, 17, 0, 1), Mask: net.CIDRMask(16, 32)},
		{Name: "eno1", IP: net.IPv4(172, 16, 0, 5), Mask: net.CIDRMask(24, 32)},
		{Name: "eth0", IP: net.IPv4(10, 0, 0, 5), Mask: net.CIDRMask(24, 32)},
	}
	cases := []struct {
		ip      string
		wantNic string
		wantOK  bool
	}{
		{"172.16.0.0", "eno1", true}, // network addr, still in eno1's subnet
		{"172.16.0.50", "eno1", true},
		{"10.0.0.99", "eth0", true},
		{"192.168.1.1", "", false}, // no matching NIC
	}
	for _, c := range cases {
		ip := net.ParseIP(c.ip).To4()
		name, _, ok := findNICForSubnet(nics, ip)
		if ok != c.wantOK || name != c.wantNic {
			t.Errorf("findNICForSubnet(%s) = %q,%v; want %q,%v",
				c.ip, name, ok, c.wantNic, c.wantOK)
		}
	}
}

// TestIPv4OnNIC verifies lookup by interface name.
func TestIPv4OnNIC(t *testing.T) {
	nics := []hostNIC{
		{Name: "eno1", IP: net.IPv4(172, 16, 0, 5), Mask: net.CIDRMask(24, 32)},
		{Name: "eth0", IP: net.IPv4(10, 0, 0, 5), Mask: net.CIDRMask(24, 32)},
	}
	if ip, ok := ipv4OnNIC(nics, "eno1"); !ok || ip.String() != "172.16.0.5" {
		t.Errorf("ipv4OnNIC(eno1) = %v,%v", ip, ok)
	}
	if _, ok := ipv4OnNIC(nics, "missing"); ok {
		t.Error("expected ok=false for missing NIC")
	}
}

// TestParseIPAddrOutput parses a representative `ip -o -4 addr show` dump
// and checks that the loopback is skipped and the two real NICs are
// captured with the right IP and mask.
func TestParseIPAddrOutput(t *testing.T) {
	out := []byte("1: lo    inet 127.0.0.1/8 scope host lo\\       valid_lft forever preferred_lft forever\n" +
		"2: eno1    inet 172.16.0.5/24 brd 172.16.0.255 scope global eno1\\       valid_lft forever preferred_lft forever\n" +
		"3: eth0    inet 10.0.0.5/24 brd 10.0.0.255 scope global eth0\\       valid_lft forever preferred_lft forever\n" +
		"garbage line without inet\n")
	nics := parseIPAddrOutput(out)
	if len(nics) != 2 {
		t.Fatalf("got %d NICs, want 2: %+v", len(nics), nics)
	}
	if nics[0].Name != "eno1" || nics[0].IP.String() != "172.16.0.5" {
		t.Errorf("nics[0] = %+v", nics[0])
	}
	ones, _ := nics[0].Mask.Size()
	if ones != 24 {
		t.Errorf("nics[0] prefix = %d, want 24", ones)
	}
	if nics[1].Name != "eth0" || nics[1].IP.String() != "10.0.0.5" {
		t.Errorf("nics[1] = %+v", nics[1])
	}
}

// TestParseIPNeighOutput verifies that only entries with a resolved MAC are
// marked used; INCOMPLETE / FAILED entries (no lladdr) are skipped.
func TestParseIPNeighOutput(t *testing.T) {
	out := []byte("172.16.0.1 dev eno1 lladdr aa:bb:cc:dd:ee:ff REACHABLE\n" +
		"172.16.0.5 dev eno1 lladdr 11:22:33:44:55:66 STALE\n" +
		"172.16.0.99 dev eno1  FAILED\n" + // no lladdr → free
		"172.16.0.2 dev eno1 lladdr cc:dd:ee:ff:aa:bb PERMANENT\n")
	used := parseIPNeighOutput(out)
	want := map[string]bool{
		"172.16.0.1": true,
		"172.16.0.5": true,
		"172.16.0.2": true,
	}
	if !reflect.DeepEqual(used, want) {
		t.Errorf("used = %v, want %v", used, want)
	}
	if used["172.16.0.99"] {
		t.Error("172.16.0.99 (FAILED, no lladdr) should not be marked used")
	}
}
