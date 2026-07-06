package gateway

import (
	"context"
	"fmt"
	"net"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/sync/errgroup"

	"github.com/rlinf/rlark/pkg/clients/db"
	versioned "github.com/rlinf/rlark/pkg/clients/kubernetes/clientset/versioned"
	"github.com/rlinf/rlark/pkg/log"
)

// Gateway provides HTTP handlers for resource CRUD APIs.
type Gateway struct {
	config Config

	kubeClient versioned.Interface

	dbClient *db.DB // may be nil if DBConfigPath is not provided, should be checked before use

	stores    map[string]*db.ResourceStore
	accessors map[string]*resourceAccessor
}

// NewGateway creates a Gateway with database-backed stores for read operations
// and a Kubernetes typed client for write operations. If database is nil, read operations
// fall back to the Kubernetes API server.
func NewGateway(config Config) *Gateway {
	return &Gateway{
		config: config,
	}
}

func (g *Gateway) Run(ctx context.Context) error {
	if err := g.init(ctx); err != nil {
		return err
	}

	var eg errgroup.Group

	eg.Go(func() error {
		return g.runHTTPServer(ctx)
	})

	if err := eg.Wait(); err != nil {
		return fmt.Errorf("gateway run error: %w", err)
	}
	return nil
}

func (g *Gateway) init(ctx context.Context) error {
	logger := log.FromContext(ctx)
	// init Kubernetes client
	restConfig, err := g.config.KubeClientConfig.BuildRestConfig()
	if err != nil {
		return fmt.Errorf("build Kubernetes rest config: %w", err)
	}
	g.kubeClient, err = versioned.NewForConfig(restConfig)
	if err != nil {
		return fmt.Errorf("create Kubernetes client: %w", err)
	}

	// init accessors
	g.accessors = registerAccessors(g.kubeClient)

	// init DB (optional)
	if g.config.DBConfigPath != "" {
		g.dbClient, err = db.OpenFromFileConfig(g.config.DBConfigPath)
		if err != nil {
			return fmt.Errorf("open database: %w", err)
		}
		g.stores = make(map[string]*db.ResourceStore)
		g.stores["nodes"] = db.NewNodeStore(g.dbClient.DB)
		g.stores["workflows"] = db.NewWorkflowStore(g.dbClient.DB)
		g.stores["jobs"] = db.NewJobStore(g.dbClient.DB)
		g.stores["tasks"] = db.NewTaskStore(g.dbClient.DB)
	} else {
		logger.Error(nil, "RLark gateway is running without persistent storage.")
	}

	return nil
}

func (g *Gateway) runHTTPServer(ctx context.Context) error {
	logger := log.FromContext(ctx)
	r := gin.Default()
	g.RegisterRoutes(r)

	server := http.Server{
		Addr:    g.config.Address,
		Handler: r,
	}

	l, err := net.Listen("tcp", server.Addr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", server.Addr, err)
	}

	go func() {
		<-ctx.Done()
		logger.Info("Shutting down unsafe HTTP server", "address", g.config.Address)
		if err := server.Shutdown(context.Background()); err != nil {
			logger.Error(nil, "Unsafe HTTP server shutdown error", "err", err)
		}
	}()

	logger.Info("Starting unsafe HTTP server", "address", g.config.Address)
	return server.Serve(l)
}
