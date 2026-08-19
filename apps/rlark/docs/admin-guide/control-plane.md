# Production Control Plane

## Architecture

The production control plane consists of the following components:

| Component | Role |
|-----------|------|
| kcp | Multi-cluster control plane (Kubernetes API server) |
| PostgreSQL | Database for persistent state |
| rlark-server | Certificate management, Agent registration, SSH |
| rlark-gateway | REST API gateway for console and CLI |
| rlark-controller-manager | Job/Workflow/Domain reconciliation |
| rlark-ui | Web management console |

## Deployment Methods

### Docker Compose (Development/Testing)

```bash
docker compose -f apps/rlark/docs/examples/docker-compose.yml up -d
```

### Kubernetes (Production)

Use `rlarkadm` to deploy to a Kubernetes cluster:

```bash
rlarkadm install -f deploy-control-plane.yaml
```

Example `deploy-control-plane.yaml`:

```yaml
apiVersion: v1
kind: DeployConfig
plane: control
kubernetes:
  image: rlark:latest
  kcpImage: ghcr.io/kcp-dev/kcp:latest
  postgresqlImage: postgres:15
  uiImage: rlark-ui:latest
  replicas: 1
db:
  host: postgresql
  port: 5432
  database: rlark
  user: rlark
  password: CHANGE_ME
```

## Key Configuration

| Setting | Description | Recommendation |
|---------|-------------|----------------|
| `--db-config` | Database connection | Use persistent storage, enable backups |
| `--auto-sign-tls-ca-cert` | Auto-generate CA | Enable for initial setup, replace with trusted CA in production |
| `--tls-domains` | TLS certificate domains | Include all access points |
| `--https-port` | Server HTTPS port | 8443 (default) |
| `--ssh-port` | SSH port | 2222 (default) |

## Security

- Replace example credentials (`CHANGE_ME`) in database and deployment configs
- Terminate TLS with trusted certificates (not auto-signed) in production
- Restrict Gateway access to trusted networks
- Configure persistent database storage with backups
- Establish backup and upgrade procedures before onboarding production clusters

## Post-Deployment Verification

```bash
# Check component health
kubectl get pods -n rlark-system

# Verify Gateway API
curl -k https://localhost:8443/healthz

# Check database connectivity
kubectl exec -n rlark-system deploy/rlark-server -- \
  rlarkctl proxy-curl https://localhost:8080/api/health
```