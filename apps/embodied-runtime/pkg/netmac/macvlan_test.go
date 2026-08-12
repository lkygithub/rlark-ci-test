package netmac

import "testing"

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
