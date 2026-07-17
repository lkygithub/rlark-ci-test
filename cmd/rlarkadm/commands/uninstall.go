package commands

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/rlinf/rlark/pkg/log"
	"github.com/rlinf/rlark/pkg/rlarkadm"
)

func UninstallCommand() *cobra.Command {
	var uninstallConf string
	var purge bool

	cmd := &cobra.Command{
		Use:   "uninstall",
		Short: "Uninstall a control or data plane from a deploy config file",
		RunE: func(cmd *cobra.Command, args []string) error {
			if uninstallConf == "" {
				return fmt.Errorf("--uninstall-conf/-f is required")
			}

			cfg, err := rlarkadm.LoadDeployConfig(uninstallConf)
			if err != nil {
				return err
			}

			if level, _ := cmd.Flags().GetString("log-level"); level != "" {
				log.InitLogger(level)
			}

			return rlarkadm.Uninstall(cfg, purge)
		},
	}

	cmd.Flags().StringVarP(&uninstallConf, "uninstall-conf", "f", "", "Path to the uninstall config file (same format as install)")
	cmd.Flags().BoolVar(&purge, "purge", false, "Also remove namespace/data directories")

	return cmd
}
