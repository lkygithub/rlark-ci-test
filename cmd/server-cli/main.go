package main

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/rlinf/rlark/pkg/server/clicommands"
)

func main() {
	cmd := &cobra.Command{
		Use:   "rlark-server-cli",
		Short: "A CLI tool for managing the rlark server",
	}

	cmd.AddCommand(clicommands.SignCommand())
	cmd.AddCommand(clicommands.RevokeCommand())
	cmd.AddCommand(clicommands.ProxyCurlCommand())
	clicommands.SetupPersistentFlags(cmd.PersistentFlags())

	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
