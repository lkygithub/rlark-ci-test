package auth

import (
	"slices"
	"strings"

	"github.com/rlinf/rlark/apps/rlark/pkg/apis"
)

type permissionChecker struct{}

func (permissionChecker) IsAdmin(certMeta map[string]string) bool {
	if certMeta == nil {
		return false
	}
	return certMeta[apis.MetaPermissionAdmin] == "true"
}

func (p permissionChecker) HasAgentProxyPermission(certMeta map[string]string, agentID string) bool {
	if certMeta == nil {
		return false
	}
	if p.IsAdmin(certMeta) {
		return true
	}
	proxyAgents := certMeta[apis.MetaPermissionAgentProxy]
	splitAgents := strings.Split(proxyAgents, ",")
	return slices.Contains(splitAgents, "*") || slices.Contains(splitAgents, agentID)
}

func (p permissionChecker) HasDomainProxyPermission(certMeta map[string]string) (string, bool) {
	if certMeta == nil {
		return "", false
	}
	domainID := certMeta[apis.MetaDomainID]
	if domainID == "" {
		return "", false
	}
	return domainID, true
}

var PermissionChecker = &permissionChecker{}
