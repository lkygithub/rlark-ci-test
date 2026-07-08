package main

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/rlinf/rlark/pkg/servercli"
)

func main() {
	cmd := &cobra.Command{
		Use:   "rlark-server-cli",
		Short: "A CLI tool for managing the rlark server",
	}

	cmd.AddCommand(servercli.SignCommand())
	cmd.AddCommand(servercli.RevokeCommand())
	cmd.AddCommand(servercli.ProxyCurlCommand())
	servercli.SetupPersistentFlags(cmd.PersistentFlags())

	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
