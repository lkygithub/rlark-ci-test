package apis

import (
	"slices"
	"strings"
)

type permissionChecker struct{}

func (permissionChecker) IsAdmin(certMeta map[string]string) bool {
	if certMeta == nil {
		return false
	}
	return certMeta[MetaPermissionAdmin] == "true"
}

func (p permissionChecker) HasAgentProxyPermission(certMeta map[string]string, agentID string) bool {
	if certMeta == nil {
		return false
	}
	if p.IsAdmin(certMeta) {
		return true
	}
	proxyAgents := certMeta[MetaPermissionAgentProxy]
	splitAgents := strings.Split(proxyAgents, ",")
	return slices.Contains(splitAgents, "*") || slices.Contains(splitAgents, agentID)
}

func (p permissionChecker) HasDomainProxyPermission(certMeta map[string]string) (string, bool) {
	if certMeta == nil {
		return "", false
	}
	domainID := certMeta[MetaDomainID]
	if domainID == "" {
		return "", false
	}
	return domainID, true
}

var PermissionChecker = &permissionChecker{}
