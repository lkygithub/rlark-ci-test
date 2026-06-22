package main

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"

	"github.com/rlinf/rlark/pkg/api"
	"github.com/rlinf/rlark/pkg/clients/db"
	versioned "github.com/rlinf/rlark/pkg/clients/kubernetes/clientset/versioned"
)

func main() {
	config := api.DefaultConfig()
	cmd := &cobra.Command{
		Use:   "rlark-api-gateway",
		Short: "Start the rlark API gateway",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := cmd.Context()

			// Connect to database (unless disabled)
			var database *db.DB
			if config.DBEnabled {
				var err error
				database, err = db.Open(config.DBConfig)
				if err != nil {
					return fmt.Errorf("failed to open database: %w", err)
				}
				defer database.Close()

				if err := database.Migrate(ctx); err != nil {
					return fmt.Errorf("failed to run migrations: %w", err)
				}
				fmt.Println("database connected and migrated")
			} else {
				fmt.Println("database disabled, read operations will use Kubernetes API server")
			}

			// Build Kubernetes client
			restConfig, err := config.KubeClientConfig.BuildRestConfig()
			if err != nil {
				return fmt.Errorf("failed to build Kubernetes rest config: %w", err)
			}

			kubeClient, err := versioned.NewForConfig(restConfig)
			if err != nil {
				return fmt.Errorf("failed to create Kubernetes client: %w", err)
			}

			gin.SetMode(gin.ReleaseMode)
			r := gin.Default()

			gw := api.NewGateway(database, kubeClient)
			gw.RegisterRoutes(r)

			fmt.Printf("api-gateway listening on %s\n", config.Addr)
			if err := r.Run(config.Addr); err != nil {
				return fmt.Errorf("api-gateway exited: %w", err)
			}
			return nil
		},
	}
	config.SetupFlags(cmd.Flags())

	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
