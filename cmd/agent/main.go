package main

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/rlinf/rlark/pkg/agent"
)

func main() {
	config := agent.DefaultConfig()
	cmd := &cobra.Command{
		Use:   "rlark-agent",
		Short: "Start the agent application",
		RunE: func(cmd *cobra.Command, args []string) error {
			srv := agent.NewAgent(config)
			return srv.Run(cmd.Context())
		},
	}
	config.SetupFlags(cmd.Flags())

	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
