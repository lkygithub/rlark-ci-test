package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/rlinf/rlark/apps/embodied-runtime/pkg/deviceplugin"
	"github.com/spf13/cobra"
)

func main() {
	var configPath string

	cmd := &cobra.Command{
		Use:   "device-plugin",
		Short: "Kubernetes Device Plugin for robot and camera devices",
		Long: `device-plugin is a Kubernetes Device Plugin that exposes robot and
camera devices as a schedulable resource (rlinf.io/device). It runs as part
of a DaemonSet and coordinates with the ROS Core, Robot Node Controller,
and Camera Controller to provide secure, isolated access to task pods.

Architecture:
  - Registers with kubelet as a device plugin
  - Detects robot hardware on the host (NICs, ROS installation)
  - Generates ros-controller, ros2-controller, and camera-controller configuration
  - Starts and manages the ros-controller, ros2-controller, and camera-controller
    (as local subprocesses or Kubernetes Pods, per manager_mode)
  - Injects ROS environment variables and Unix socket mounts into pods

Configuration is loaded from a YAML file (--config). When omitted, built-in
defaults are used. See examples/device-plugin-config.yaml for a template.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			var cfg deviceplugin.PluginConfig
			if configPath != "" {
				c, err := deviceplugin.LoadConfig(configPath)
				if err != nil {
					return err
				}
				cfg = c
			} else {
				cfg = deviceplugin.DefaultPluginConfig()
			}
			return run(cfg)
		},
	}

	cmd.Flags().StringVar(&configPath, "config", "",
		"Path to the plugin configuration YAML file (omit to use built-in defaults)")

	if err := cmd.Execute(); err != nil {
		log.Fatalf("[device-plugin] fatal: %v", err)
	}
}

func run(cfg deviceplugin.PluginConfig) error {
	log.Println("[device-plugin] starting...")
	log.Printf("[device-plugin] camera_manager_mode=%s ros_manager_mode=%s ros2_manager_mode=%s",
		cfg.Camera.ManagerMode, cfg.ROS.ManagerMode, cfg.ROS2.ManagerMode)
	log.Printf("[device-plugin] resource=%s socket=%s",
		cfg.EffectiveResourceName(), cfg.EffectiveSocketPath())

	// Ensure the socket directory exists.
	if err := deviceplugin.EnsureSocketDir(); err != nil {
		return err
	}

	// Create the plugin. This also detects devices, generates the
	// ros-controller, ros2-controller, and camera-controller configs, and
	// starts the controllers (local subprocesses or pods, per *_manager_mode).
	plugin := deviceplugin.NewPlugin(cfg)

	// Create the gRPC server.
	server := deviceplugin.NewServer(plugin, cfg.EffectiveSocketPath())

	// Register with kubelet in the background.
	if !cfg.SkipRegister {
		go func() {
			if err := server.RegisterWithKubelet(); err != nil {
				log.Printf("[device-plugin] WARNING: kubelet registration failed: %v", err)
				log.Printf("[device-plugin] kubelet may not be running — plugin will retry on restart")
			}
		}()
	} else {
		log.Println("[device-plugin] kubelet registration skipped")
	}

	// Start the gRPC server (blocks until signal).
	go func() {
		if err := server.Start(); err != nil {
			log.Fatalf("[device-plugin] gRPC server error: %v", err)
		}
	}()

	// Wait for shutdown signal.
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	sig := <-sigCh

	log.Printf("[device-plugin] received %v, shutting down...", sig)
	server.Stop()
	log.Println("[device-plugin] stopped")

	return nil
}
