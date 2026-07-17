package constants

const (
	Namespace = "rlark-system"

	ComponentGateway           = "rlark-gateway"
	ComponentControllerManager = "rlark-controller-manager"
	ComponentServer            = "rlark-server"
	ComponentAgent             = "rlark-agent"
	ComponentAgentNode         = "rlark-agent-node"
	ComponentPrometheus        = "prometheus"
	ComponentPostgresql        = "postgresql"
	ComponentKCP               = "kcp"
	ComponentUI                = "rlark-ui"
)

const (
	DBConfigPath      = "/etc/rlark/db.yaml"
	CertDir           = "/etc/rlark/certs"
	KCPDataDir        = "/.kcp"
	KCPKubeconfigPath = "/etc/kcp/admin.kubeconfig"
	PostgresqlDataDir = "/var/lib/postgresql/data"
	PostgresqlInitDir = "/docker-entrypoint-initdb.d"
)

const InitDBSQL = `-- scripts/init-db.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL PRIVILEGES ON DATABASE rlark TO postgres;
`
