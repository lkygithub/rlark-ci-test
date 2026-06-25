//go:build !linux && !darwin

package nodeserver

import (
	"fmt"
	"net"
)

func GetPeerProcess(conn net.Conn) (int32, error) {
	return 0, fmt.Errorf("GetPeerProcess is not implemented for this platform")
}
