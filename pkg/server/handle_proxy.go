package server

import (
	"cmp"
	"context"
	"fmt"
	"maps"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rancher/remotedialer"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/rlinf/rlark/pkg/apis"
	"github.com/rlinf/rlark/pkg/server/reverseproxy"
)

// GetDial returns a remotedialer.Dialer based on the provided dialType and address.
// It also returns the address to be used for dialing and any error encountered during the process.
func (s *Server) GetDial(ctx context.Context, dialType, address string, certMeta map[string]string) (remotedialer.Dialer, string, error) {
	host, port, err := net.SplitHostPort(address)
	if err != nil {
		return nil, "", fmt.Errorf("split host and port from address %s: %w", address, err)
	}

	switch dialType {
	case "default":
		// default 对应默认的代理，一般用于连接 agent 的 local server
		// 这种情况下，host 即为 agent ID，此时应该返回 agent 对应的 dialer 和 agent 的 local server 地址
		// 这种情况下不会将请求的 certMeta 传进来，因此需要在外层完成权限检查
		agentID := host
		dialer := s.dialerFactory.GetDialer(ctx, agentID) // TODO: 检测对应主 agent 是否连接，如果没有连接，用其他 agent 来转发请求
		return dialer, "0.0.0.0:1", nil                   // 约定 local server 地址为 0.0.0.0:1

	case "ssh":
		fields := strings.Split(host, ".")
		if len(fields) < 3 {
			return nil, "", fmt.Errorf("invalid address format: %s", host)
		}
		targetID := fields[len(fields)-2]
		targetType := fields[len(fields)-1]
		targetHost := strings.Join(fields[:len(fields)-2], ".")

		var dialer remotedialer.Dialer
		switch targetType {
		case "agent":
			hasPermission := apis.PermissionChecker.HasAgentProxyPermission(certMeta, targetID)
			if !hasPermission {
				if domainID, ok := apis.PermissionChecker.HasDomainProxyPermission(certMeta); ok {
					var domainCheckErr error
					hasPermission, domainCheckErr = s.checkHostInDomain(ctx, &targetHost, domainID, targetID)
					if domainCheckErr != nil {
						return nil, "", fmt.Errorf("failed to check domain proxy permission: %w", domainCheckErr)
					}
				}
			}
			if !hasPermission {
				return nil, "", fmt.Errorf("client certificate does not have proxy permission for %s on %s", targetHost, targetID)
			}
			dialer = s.dialerFactory.GetDialer(ctx, targetID) // TODO: 检测对应主 agent 是否连接，如果没有连接，用其他 agent 来转发请求

		default:
			return nil, "", fmt.Errorf("unsupported target type: %s", targetType)
		}
		return dialer, net.JoinHostPort(targetHost, port), nil
	}
	return nil, "", fmt.Errorf("unsupported dial type: %s", dialType)
}

func (s *Server) checkHostInDomain(ctx context.Context, host *string, domainID, agentID string) (bool, error) {
	namespace := apis.RLarkAgentNamespacePrefix + agentID
	dp, err := s.rlarkClient.RlinfV1alpha1().DomainPeers(namespace).Get(ctx, domainID, metav1.GetOptions{})
	if err != nil {
		return false, fmt.Errorf("get domain peer %s: %w", domainID, err)
	}
	for _, pod := range dp.Spec.Pods {
		if pod.IP == *host {
			if pod.LocalIP == "" {
				return false, fmt.Errorf("domain peer %s/%s pod %s/%s has no LocalIP", namespace, domainID, pod.Namespace, pod.Name)
			}
			*host = pod.LocalIP
			return true, nil
		}
	}
	return false, nil
}

// handleProxyConnect 处理反向代理隧道的连接请求。它会根据客户端证书中的元数据来确定是代理连接还是 Peer-to-Peer 连接，并设置相应的请求头。
func (s *Server) handleProxyConnect(ctx *gin.Context) {
	certMeta := GetCertMetaFromContext(ctx)
	clientID := certMeta[apis.MetaRemoteDialerClientID]
	if clientID != "" {
		clientKey := clientID
		if role := ctx.Request.Header.Get(apis.RemoteDialerRoleHeader); role != "" {
			clientKey = clientID + "-" + role
		}
		reverseproxy.SetClientHeader(ctx.Request, clientKey)
	} else {
		peerID := certMeta[apis.MetaRemoteDialerPeerID]
		peerToken := certMeta[apis.MetaRemoteDialerPeerToken]
		if peerID != "" && peerToken != "" {
			reverseproxy.SetPeerHeaders(ctx.Request, peerID, peerToken)
		} else {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "client certificate does not contain required permissions"})
			return
		}
	}

	if agentID := certMeta[apis.MetaAgentID]; agentID != "" {
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

// 由于 remotedialer 默认的 Peer-to-Peer 连接无法进行任何证书配置，所以这里在 http server 实现了一个代理
// 会将请求转发到目标 Peer 的 /api/connect 接口上，并且在请求中会携带专用于 Peer-to-Peer 连接的证书元数据
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

// handleProxy 处理通过服务器代理的 HTTP 请求。它会根据请求的目标和路径，使用默认的代理传输将请求转发到目标地址。
func (s *Server) handleProxy(ctx *gin.Context) {
	// 对应 GetDial 参数为
	// - dialType = "default"
	// - address = ctx.Param("target")
	target := ctx.Param("target")
	certMeta := GetCertMetaFromContext(ctx)
	if !apis.PermissionChecker.HasAgentProxyPermission(certMeta, target) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "client certificate does not have proxy permission for the target"})
		return
	}

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

// handleKubernetesProxy 处理通过服务器代理的 Kubernetes API 请求。它会根据客户端证书中的元数据，
// 设置相应的 impersonation 头，并将请求转发到 Kubernetes API 服务器。
func (s *Server) handleKubernetesProxy(ctx *gin.Context) {
	// 只有提供了 "kubernetes-impersonation" 元数据的证书才允许使用 Kubernetes 代理功能
	// 如果证书中 "kubernetes-impersonation" 的值为 "-"，则表示不进行任何 impersonation

	certMeta := GetCertMetaFromContext(ctx)
	isAdmin := apis.PermissionChecker.IsAdmin(certMeta)
	if certMeta[apis.MetaKubernetesImpersonation] == "" {
		if isAdmin {
			certMeta[apis.MetaKubernetesImpersonation] = "-"
		} else {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "client certificate does not allow Kubernetes proxying"})
			return
		}
	}

	header := make(http.Header)
	if impersonation := certMeta[apis.MetaKubernetesImpersonation]; impersonation != "-" {
		header.Set("Impersonate-User", impersonation)
	}
	if impersonationGroup := certMeta[apis.MetaKubernetesImpersonationGroup]; impersonationGroup != "" {
		groups := strings.Split(impersonationGroup, ",")
		for i := range groups {
			groups[i] = strings.TrimSpace(groups[i])
		}
		for _, impersonationGroup := range groups {
			header.Add("Impersonate-Group", impersonationGroup)
		}
	}
	if impersonationUid := certMeta[apis.MetaKubernetesImpersonationUID]; impersonationUid != "" {
		header.Set("Impersonate-Uid", impersonationUid)
	}
	for k, v := range certMeta {
		if after, ok := strings.CutPrefix(k, apis.MetaKubernetesImpersonationExtraPrefix); ok {
			header.Set("Impersonate-Extra-"+after, v)
		}
	}

	ctx.Request.URL.Path = ctx.Param("path")
	maps.Copy(ctx.Request.Header, header)
	s.kubeHandler.ServeHTTP(ctx.Writer, ctx.Request)
}
