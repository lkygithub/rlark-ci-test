package server

import (
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rancher/remotedialer"

	"github.com/rlinf/rlark/pkg/server/cert"
	"github.com/rlinf/rlark/pkg/server/reverseproxy"
)

func (s *Server) GetDial(ctx context.Context, address string, userMeta map[string]string) (remotedialer.Dialer, string, error) {
	// TODO
	return nil, "", fmt.Errorf("GetDial not implemented")
}

func (s *Server) handleProxyConnect(ctx *gin.Context) {
	if len(ctx.Request.TLS.PeerCertificates) == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "client certificate required"})
		return
	}

	clientCert := ctx.Request.TLS.PeerCertificates[0]
	userMeta, ok := cert.GetX509CertMeta(clientCert)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid client certificate"})
		return
	}

	clientKey := userMeta["clientKey"]
	if clientKey != "" {
		reverseproxy.SetClientHeader(ctx.Request, clientKey)
	} else {
		peerID := userMeta["peerID"]
		peerToken := userMeta["peerToken"]
		if peerID != "" && peerToken != "" {
			reverseproxy.SetPeerHeaders(ctx.Request, peerID, peerToken)
		} else {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "client certificate missing required metadata"})
			return
		}
	}

	s.dialerFactory.ServeHTTP(ctx.Writer, ctx.Request)
}
