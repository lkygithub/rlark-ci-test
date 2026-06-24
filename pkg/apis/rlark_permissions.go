package apis

import (
	"slices"
	"strings"
)

type permissionChecker struct{}

func (permissionChecker) IsAdmin(certMeta map[string]string) bool {
	return certMeta[MetaPermissionAdmin] == "true"
}

func (p permissionChecker) HasAgentProxyPermission(certMeta map[string]string, agentID string) bool {
	if p.IsAdmin(certMeta) {
		return true
	}
	proxyAgents := certMeta[MetaPermissionAgentProxy]
	splitAgents := strings.Split(proxyAgents, ",")
	return slices.Contains(splitAgents, "*") || slices.Contains(splitAgents, agentID)
}

var PermissionChecker = &permissionChecker{}
