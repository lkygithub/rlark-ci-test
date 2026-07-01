package commands

import (
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"

	"github.com/rlinf/rlark/pkg/rlarkadm"
)

func DeployCommand() *cobra.Command {
	var deployConf string

	cmd := &cobra.Command{
		Use:   "deploy",
		Short: "Deploy a control or data plane from a deploy config file",
		RunE: func(cmd *cobra.Command, args []string) error {
			if deployConf == "" {
				return fmt.Errorf("--deploy-conf is required")
			}

			cfg, err := rlarkadm.LoadDeployConfig(deployConf)
			if err != nil {
				return err
			}

			if level, _ := cmd.Flags().GetString("log-level"); level != "" {
				if lvl, err := logrus.ParseLevel(level); err == nil {
					logrus.SetLevel(lvl)
				}
			}

			return rlarkadm.Deploy(cfg)
		},
	}

	cmd.Flags().StringVarP(&deployConf, "deploy-conf", "f", "", "Path to the deploy config file")

	return cmd
}
