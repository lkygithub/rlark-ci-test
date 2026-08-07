package nodeserver

import (
	"fmt"
	"net"
	"os"

	"github.com/spf13/pflag"
)

type Config struct {
	UnixSocketAddress string
}

func DefaultConfig() Config {
	return Config{
		UnixSocketAddress: "/run/rlark/nodeserver.sock",
	}
}

func (c *Config) SetupFlags(fs *pflag.FlagSet) {
	fs.StringVar(&c.UnixSocketAddress, "nodeserver-unix-socket", c.UnixSocketAddress, "Unix socket address for node server")
}

func (c *Config) Listen() (net.Listener, error) {
	s, err := os.Stat(c.UnixSocketAddress)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
	} else {
		if s.Mode()&os.ModeSocket == 0 {
			return nil, &os.PathError{
				Op:   "listen",
				Path: c.UnixSocketAddress,
				Err:  fmt.Errorf("not a socket"),
			}
		}
		_ = os.Remove(c.UnixSocketAddress)
	}
	return net.Listen("unix", c.UnixSocketAddress)
}
