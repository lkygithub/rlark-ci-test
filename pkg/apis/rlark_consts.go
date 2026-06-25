package apis

const (
	RLarkAgentNamespacePrefix    = "rlark-"
	RLarkAgentServiceAccountName = "rlark-agent"
)

const (
	MetaPermissionPrefix     = "permission:"
	MetaPermissionAdmin      = MetaPermissionPrefix + "admin"       // value: "true"
	MetaPermissionAgentProxy = MetaPermissionPrefix + "agent-proxy" // value: agent1,agent2,agent3

	MetaKubernetesImpersonation            = "kubernetes-impersonation"
	MetaKubernetesImpersonationGroup       = "kubernetes-impersonation-group"
	MetaKubernetesImpersonationUID         = "kubernetes-impersonation-uid"
	MetaKubernetesImpersonationExtraPrefix = "kubernetes-impersonation-extra-"

	MetaRemoteDialerPeerID    = "remote-dialer-peer-id"
	MetaRemoteDialerPeerToken = "remote-dialer-peer-token"
	MetaRemoteDialerClientID  = "remote-dialer-client-id"

	MetaAgentID   = "agent-id"
	MetaNamespace = "namespace"
)

const (
	RemoteDialerRoleHeader = "X-Remote-Dialer-Role"
)
