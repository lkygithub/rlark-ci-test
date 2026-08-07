package main

import (
	"cmp"
	"log"
	"os"

	"github.com/spf13/cobra"
)

var defaultSocketPath = cmp.Or(os.Getenv("RLINF_EMBODIED_ROS_SOCKET_PATH"), "/var/run/rlinf/ros-ctrl.sock")

func main() {
	var socketPath string

	root := &cobra.Command{
		Use:   "rosctr",
		Short: "ROS Controller CLI — control robot nodes via ros-ctrl.sock",
	}

	root.PersistentFlags().StringVar(&socketPath, "socket-path", defaultSocketPath,
		"Unix socket path of the ros-controller gRPC server")

	root.AddCommand(
		listCmd(socketPath),
		statusCmd(socketPath),
		startCmd(socketPath),
		stopCmd(socketPath),
		switchCmd(socketPath),
		resetCmd(socketPath),
		modesCmd(socketPath),
		logsCmd(socketPath),
		envCmd(socketPath),
		packagesCmd(socketPath),
		pkgCmd(socketPath),
	)

	if err := root.Execute(); err != nil {
		log.Fatalf("error: %v", err)
	}
}
