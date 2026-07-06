package agent

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rlinf/rlark/pkg/log"
)

func (a *Agent) runLocalHTTPServer(ctx context.Context) error {
	logger := log.FromContext(ctx)
	r := gin.Default()
	r.Any("/api/kubernetes/*path", a.handleKubernetesProxy)

	server := http.Server{
		Handler: r,
	}

	go func() {
		<-ctx.Done()
		logger.Info("Shutting down local HTTP server")
		if err := server.Shutdown(context.Background()); err != nil {
			logger.Error(nil, "Local HTTP server shutdown error", "err", err)
		}
	}()

	logger.Info("Starting local HTTP server")
	return server.Serve(a.localListener)
}

func (a *Agent) handleKubernetesProxy(ctx *gin.Context) {
	if a.localKubeHandler == nil {
		ctx.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}
	ctx.Request.URL.Path = ctx.Param("path")
	a.localKubeHandler.ServeHTTP(ctx.Writer, ctx.Request)
}
