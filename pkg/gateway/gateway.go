package gateway

import (
	"context"
	"fmt"
	"net"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"

	"github.com/rlinf/rlark/pkg/clients/db"
	versioned "github.com/rlinf/rlark/pkg/clients/kubernetes/clientset/versioned"
)

// Gateway provides HTTP handlers for resource CRUD APIs.
type Gateway struct {
	config Config

	kubeClient versioned.Interface

	dbClient *db.DB // may be nil if DBConfigPath is not provided, should be checked before use

	queriers  map[string]*db.ResourceQuerier
	accessors map[string]*resourceAccessor
}

// NewGateway creates a Gateway with database-backed queriers for read operations
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
	// init DB
	if g.config.DBConfigPath != "" {
		var err error
		g.dbClient, err = db.OpenFromFileConfig(g.config.DBConfigPath)
		if err != nil {
			return fmt.Errorf("open database: %w", err)
		}
	} else {
		logrus.Warningf("RLark gateway is running without persistent storage.")
		return nil
	}

	// init Kubernetes client
	restConfig, err := g.config.KubeClientConfig.BuildRestConfig()
	if err != nil {
		return fmt.Errorf("build Kubernetes rest config: %w", err)
	}
	g.kubeClient, err = versioned.NewForConfig(restConfig)
	if err != nil {
		return fmt.Errorf("create Kubernetes client: %w", err)
	}

	// init queriers and accessors
	g.queriers = make(map[string]*db.ResourceQuerier)
	g.accessors = registerAccessors(g.kubeClient)
	if g.dbClient != nil {
		g.queriers["nodes"] = db.NewNodeQuerier(g.dbClient.DB)
		g.queriers["workflows"] = db.NewWorkflowQuerier(g.dbClient.DB)
		g.queriers["jobs"] = db.NewJobQuerier(g.dbClient.DB)
		g.queriers["tasks"] = db.NewTaskQuerier(g.dbClient.DB)
	}

	return nil
}

func (g *Gateway) runHTTPServer(ctx context.Context) error {
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
		logrus.Printf("Shutting down unsafe HTTP server on %s", g.config.Address)
		if err := server.Shutdown(context.Background()); err != nil {
			logrus.Printf("Unsafe HTTP server shutdown error: %v", err)
		}
	}()

	logrus.Printf("Starting unsafe HTTP server on %s", g.config.Address)
	return server.Serve(l)
}
