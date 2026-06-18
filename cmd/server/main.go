package main

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/rlinf/rlark/pkg/server"
)

func main() {
	config := server.DefaultConfig()
	cmd := &cobra.Command{
		Use:   "rlark-server",
		Short: "Start the server application",
		RunE: func(cmd *cobra.Command, args []string) error {
			srv := server.NewServer(&config)
			return srv.Run(cmd.Context())
		},
	}
	config.SetupFlags(cmd.Flags())

	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
