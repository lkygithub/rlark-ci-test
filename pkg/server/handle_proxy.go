package server

import (
	"cmp"
	"context"
	"fmt"
	"maps"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rancher/remotedialer"

	"github.com/rlinf/rlark/pkg/apis"
	"github.com/rlinf/rlark/pkg/server/cert"
	"github.com/rlinf/rlark/pkg/server/reverseproxy"
)

func (s *Server) GetDial(ctx context.Context, dialType, address string, userMeta map[string]string) (remotedialer.Dialer, string, error) {
	switch dialType {
	case "default":
		// TODO

	case "ssh":
		// TODO
	}
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

	clientID := userMeta[apis.MetaRemoteDialerClientID]
	if clientID != "" {
		clientKey := clientID
		if role := ctx.Request.Header.Get(apis.RemoteDialerRoleHeader); role != "" {
			clientKey = clientID + "-" + role
		}
		reverseproxy.SetClientHeader(ctx.Request, clientKey)
	} else {
		peerID := userMeta[apis.MetaRemoteDialerPeerID]
		peerToken := userMeta[apis.MetaRemoteDialerPeerToken]
		if peerID != "" && peerToken != "" {
			reverseproxy.SetPeerHeaders(ctx.Request, peerID, peerToken)
		} else {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "client certificate missing required metadata"})
			return
		}
	}

	if agentID := userMeta[apis.MetaAgentID]; agentID != "" {
		// 如果是 Agent 接入，需要检查是否完成该 Agent 的注册流程
		if err := s.registerAgent(ctx.Request.Context(), agentID); err != nil {
			ctx.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("agent registration failed: %v", err)})
			return
		}
		// 在接入期间，启动 Broadcast 机制，向集群广播该 Agent 的存在信息
		role := ctx.Request.Header.Get(apis.RemoteDialerRoleHeader)
		if err := s.startAgentBroadcaster(ctx.Request.Context(), agentID, role, uuid.NewString()); err != nil {
			ctx.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("start agent broadcaster failed: %v", err)})
			return
		}
	}

	s.dialerFactory.ServeHTTP(ctx.Writer, ctx.Request)
}

func (s *Server) handlePeerConnectProxy(ctx *gin.Context) {
	target := ctx.Param("target")
	url := &url.URL{
		Scheme: "https",
		Host:   fmt.Sprintf("%s:%d", target, s.config.HTTPSPort),
		Path:   "/api/connect",
	}
	proxy := httputil.ReverseProxy{
		Director: func(req *http.Request) {
			req.URL = url
			req.Host = url.Host
		},
		Transport: s.defaultPeerTransport,
	}
	proxy.ServeHTTP(ctx.Writer, ctx.Request)
}

func (s *Server) handleProxy(ctx *gin.Context) {
	target := ctx.Param("target")
	path := ctx.Param("path")

	ctx.Request.URL.Path = path
	url := &url.URL{
		Scheme: cmp.Or(ctx.Request.Header.Get("Proxy-Scheme"), "http"),
		Host:   target,
	}
	proxy := httputil.NewSingleHostReverseProxy(url)
	proxy.Transport = s.defaultProxyTransport
	proxy.ServeHTTP(ctx.Writer, ctx.Request)
}

func (s *Server) handleKubernetesProxy(ctx *gin.Context) {
	if len(ctx.Request.TLS.PeerCertificates) == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "client certificate required"})
		return
	}

	// 只有提供了 "kubernetes-impersonation" 元数据的证书才允许使用 Kubernetes 代理功能
	// 如果证书中 "kubernetes-impersonation" 的值为 "-"，则表示不进行任何 impersonation

	userCert := ctx.Request.TLS.PeerCertificates[0]
	userMeta, _ := cert.GetX509CertMeta(userCert)
	if userMeta == nil || userMeta[apis.MetaKubernetesImpersonation] == "" {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "client certificate does not allow Kubernetes proxying"})
		return
	}

	header := make(http.Header)
	if impersonation := userMeta[apis.MetaKubernetesImpersonation]; impersonation != "-" {
		header.Set("Impersonate-User", impersonation)
	}
	if impersonationGroup := userMeta[apis.MetaKubernetesImpersonationGroup]; impersonationGroup != "" {
		groups := strings.Split(impersonationGroup, ",")
		for i := range groups {
			groups[i] = strings.TrimSpace(groups[i])
		}
		for _, impersonationGroup := range groups {
			header.Add("Impersonate-Group", impersonationGroup)
		}
	}
	if impersonationUid := userMeta[apis.MetaKubernetesImpersonationUID]; impersonationUid != "" {
		header.Set("Impersonate-Uid", impersonationUid)
	}
	for k, v := range userMeta {
		if after, ok := strings.CutPrefix(k, apis.MetaKubernetesImpersonationExtraPrefix); ok {
			header.Set("Impersonate-Extra-"+after, v)
		}
	}

	ctx.Request.URL.Path = ctx.Param("path")
	maps.Copy(ctx.Request.Header, header)
	s.kubeHandler.ServeHTTP(ctx.Writer, ctx.Request)
}
