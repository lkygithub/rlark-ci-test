package main

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/rlinf/rlark/pkg/network/sidecar"
)

func main() {
	config := sidecar.DefaultConfig()
	cmd := &cobra.Command{
		Use:   "rlark-network-sidecar",
		Short: "Start the sidecar proxy for pod traffic interception",
		RunE: func(cmd *cobra.Command, args []string) error {
			srv := sidecar.NewSidecar(config)
			return srv.Run(cmd.Context())
		},
	}
	config.SetupFlags(cmd.Flags())

	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
