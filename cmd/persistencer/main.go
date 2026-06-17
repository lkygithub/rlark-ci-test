package main

import (
	"context"
	"flag"
	"os"
	"os/signal"
	"syscall"

	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/klog/v2"

	"github.com/rlinf/rlark/pkg/clients/db"
	"github.com/rlinf/rlark/pkg/controllers/persistencer"
)

func main() {
	// Use default config as base
	config := persistencer.DefaultConfig()

	// Database flags (using db.Config fields)
	flag.StringVar(&config.Database.Host, "db-host", config.Database.Host, "Database host")
	flag.IntVar(&config.Database.Port, "db-port", config.Database.Port, "Database port")
	flag.StringVar(&config.Database.Database, "db-name", config.Database.Database, "Database name")
	flag.StringVar(&config.Database.User, "db-user", config.Database.User, "Database user")
	flag.StringVar(&config.Database.Password, "db-password", config.Database.Password, "Database password")
	flag.IntVar(&config.Database.MaxOpenConns, "db-max-open-conns", config.Database.MaxOpenConns, "Maximum open database connections")
	flag.IntVar(&config.Database.MaxIdleConns, "db-max-idle-conns", config.Database.MaxIdleConns, "Maximum idle database connections")

	// Sync flags
	flag.IntVar(&config.Sync.Workers, "workers", config.Sync.Workers, "Number of sync workers")

	// Kcp flags
	flag.StringVar(&config.Kcp.KubeconfigPath, "kubeconfig", config.Kcp.KubeconfigPath, "Path to kcp kubeconfig")
	flag.StringVar(&config.Kcp.Context, "context", config.Kcp.Context, "Kubeconfig context")
	flag.StringVar(&config.Kcp.Namespace, "namespace", config.Kcp.Namespace, "Namespace to watch (empty for all)")

	klog.InitFlags(nil)
	flag.Parse()

	// Validate configuration
	if err := config.Validate(); err != nil {
		klog.Errorf("Invalid configuration: %v", err)
		os.Exit(1)
	}

	// Setup signal handling
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigCh
		klog.Infof("Received signal %v, shutting down...", sig)
		cancel()
	}()

	// Open database connection using db package
	klog.Info("Connecting to database")
	dbConn, err := db.Open(config.Database)
	if err != nil {
		klog.Errorf("Failed to connect to database: %v", err)
		os.Exit(1)
	}
	defer dbConn.Close()

	// Run database migrations
	klog.Info("Running database migrations")
	if err := dbConn.Migrate(ctx); err != nil {
		klog.Errorf("Failed to run database migrations: %v", err)
		os.Exit(1)
	}

	// Create sync controller
	controller := persistencer.NewSyncController(dbConn.DB, config.Sync)

	// Register handlers with GVR
	jobGVR := schema.GroupVersionResource{Group: "rlinf.io", Version: "v1alpha1", Resource: "jobs"}
	jobHandler := persistencer.NewJobSyncHandler()
	if err := controller.AddHandler(jobGVR, jobHandler); err != nil {
		klog.Errorf("Failed to add job handler: %v", err)
		os.Exit(1)
	}

	nodeGVR := schema.GroupVersionResource{Group: "rlinf.io", Version: "v1alpha1", Resource: "nodes"}
	nodeHandler := persistencer.NewNodeSyncHandler()
	if err := controller.AddHandler(nodeGVR, nodeHandler); err != nil {
		klog.Errorf("Failed to add node handler: %v", err)
		os.Exit(1)
	}

	taskGVR := schema.GroupVersionResource{Group: "rlinf.io", Version: "v1alpha1", Resource: "tasks"}
	taskHandler := persistencer.NewTaskSyncHandler()
	if err := controller.AddHandler(taskGVR, taskHandler); err != nil {
		klog.Errorf("Failed to add task handler: %v", err)
		os.Exit(1)
	}

	workflowGVR := schema.GroupVersionResource{Group: "rlinf.io", Version: "v1alpha1", Resource: "workflows"}
	workflowHandler := persistencer.NewWorkflowSyncHandler()
	if err := controller.AddHandler(workflowGVR, workflowHandler); err != nil {
		klog.Errorf("Failed to add workflow handler: %v", err)
		os.Exit(1)
	}

	// Load kubeconfig
	kubeconfig, err := clientcmd.BuildConfigFromFlags("", config.Kcp.KubeconfigPath)
	if err != nil {
		klog.Errorf("Failed to load kubeconfig: %v", err)
		os.Exit(1)
	}

	// Setup informers for all resource types
	if err := controller.SetupInformers(kubeconfig); err != nil {
		klog.Errorf("Failed to setup informers: %v", err)
		os.Exit(1)
	}

	// Start sync controller
	klog.Info("Starting sync controller")
	go func() {
		if err := controller.Start(ctx); err != nil {
			klog.Errorf("Sync controller failed: %v", err)
			cancel()
		}
	}()

	klog.Info("Syncer started successfully")

	// Wait for shutdown
	<-ctx.Done()

	// Stop sync controller
	klog.Info("Stopping sync controller")
	controller.Stop()

	klog.Info("Syncer stopped")
}
