package agent

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func (a *Agent) runLocalHTTPServer(ctx context.Context) error {
	r := gin.Default()
	r.Any("/api/kubernetes/*path", a.handleKubernetesProxy)

	server := http.Server{
		Handler: r,
	}

	go func() {
		<-ctx.Done()
		logrus.Print("Shutting down local HTTP server")
		if err := server.Shutdown(context.Background()); err != nil {
			logrus.Printf("Local HTTP server shutdown error: %v", err)
		}
	}()

	logrus.Print("Starting local HTTP server")
	return server.Serve(a.localListener)
}

func (a *Agent) handleKubernetesProxy(ctx *gin.Context) {
	ctx.Request.URL.Path = ctx.Param("path")
	a.kubeHandler.ServeHTTP(ctx.Writer, ctx.Request)
}
