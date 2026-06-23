package server

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rlinf/rlark/pkg/server/cert"
)

type SignRequest struct {
	Role     string `json:"role"`                // 证书角色，例如 "agent" 等
	ClientID string `json:"client_id,omitempty"` // 可选的客户端 ID
}

func (s *Server) parseSignRequest(req *SignRequest) (string, map[string]string, error) {
	switch req.Role {
	case "admin":
		return "x509", map[string]string{
			"permission.admin":         "true", // TODO
			"kubernetes-impersonation": "-",
		}, nil

	case "peer":
		return "x509", map[string]string{
			"peerID":    s.dialerFactory.GetPeerID(),
			"peerToken": s.dialerFactory.GetPeerToken(),
		}, nil

	case "agent":
		namespace := "rlarkns-" + req.ClientID
		impersonation := "system:serviceaccount:" + namespace + ":" + "rlark-agent"
		return "x509", map[string]string{
			"agentID":                  req.ClientID,
			"clientKey":                req.ClientID,
			"kubernetes-impersonation": impersonation,
		}, nil

	default:
		return "", nil, fmt.Errorf("unsupported role: %s", req.Role)
	}
}

func (s *Server) handleSignCertificate(ctx *gin.Context) {
	if len(s.ca) == 0 {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "no CA available"})
		return
	}

	var req SignRequest
	if err := ctx.BindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	signType, meta, err := s.parseSignRequest(&req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cert, err := cert.Sign(&s.ca[0], signType, meta)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "sign certificate failed"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"cert": string(cert.CertPEM),
		"key":  string(cert.KeyPEM),
	})
}
