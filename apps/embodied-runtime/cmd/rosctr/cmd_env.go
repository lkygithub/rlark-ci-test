package main

import (
	"context"
	"fmt"
	"time"

	"github.com/rlinf/rlark/apps/embodied-runtime/pkg/cli"
	pb "github.com/rlinf/rlark/sdks/embodied-runtime-go/gen/roscontroller/v1"
	"github.com/spf13/cobra"
)

// envVars is the structured output for --format json/yaml.
type envVars struct {
	ROSMASTERURI string `json:"ROS_MASTER_URI" yaml:"ROS_MASTER_URI"`
}

func envCmd(socketPath string) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "env <robot-id>",
		Short: "Print ROS_MASTER_URI for a robot, for sourcing into the shell",
		Long: `Print ROS_MASTER_URI for the specified robot, for sourcing into the shell.

Usage:
  . <(rosctr env franka-0)

This sets ROS_MASTER_URI so ROS tools (rostopic, rosrun, etc.)
connect to the correct ROS master.

If you also need ROS_IP (for bidirectional communication), set it to
your local machine's IP before sourcing:
  export ROS_IP=$(hostname -I | awk '{print $1}')
  . <(rosctr env franka-0)`,
		Args: cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			client, conn := newClient(socketPath)
			defer func() { _ = conn.Close() }()

			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			resp, err := client.GetRobotStatus(ctx, &pb.GetRobotStatusRequest{RobotId: args[0]})
			if err != nil {
				return fmt.Errorf("get robot status: %w", err)
			}

			format := cli.FormatFromCmd(cmd)
			cli.Print(format, envVars{
				ROSMASTERURI: resp.RosMasterUri,
			}, func() {
				if resp.RosMasterUri != "" {
					fmt.Printf("export ROS_MASTER_URI=%s\n", resp.RosMasterUri)
				}
			})
			return nil
		},
	}

	cli.AddFormatFlag(cmd)
	return cmd
}
