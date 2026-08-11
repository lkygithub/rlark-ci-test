package common

const (
	// SecretNamespace is the namespace where management cluster secrets live.
	SecretNamespace = "default"

	// SSHUserKeySecretName is the KCP Secret holding user SSH public keys.
	SSHUserKeySecretName = "rlark-ssh-keys"

	// UIAuthSecretName is the KCP Secret holding UI auth credentials.
	UIAuthSecretName = "rlark-ui-auth"

	// AdminCertSecretName is the KCP Secret holding the admin signing cert.
	AdminCertSecretName = "rlark-admin-cert"

	// TLSCASecretName is the KCP Secret holding the TLS CA.
	TLSCASecretName = "rlark-tls-ca"

	// TLSSecretName is the KCP Secret holding the TLS cert/key pair.
	TLSSecretName = "rlark-tls"

	// ClientCASecretName is the KCP Secret holding the client CA.
	ClientCASecretName = "rlark-client-ca"

	// AgentCertSecretPrefix is the prefix for per-cluster agent cert secrets.
	AgentCertSecretPrefix = "rlark-agent-cert-"
)

const (
	AgentCertLabelKey   = "rlark.io/agent-cert"
	AgentCertLabelValue = "true"
)
