# Quick Start

Deploy rlark locally and run your first training job.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | >= 24.0 | Run kcp, PostgreSQL and control plane containers |
| kind | >= 0.20 | Run local k8s data plane cluster |
| kubectl | >= 1.28 | Interact with clusters |
| jq | >= 1.6 | Parse JSON responses |
| python3 | >= 3.8 | Process kubeconfig |

## One-Click Deploy

```bash
# Use Docker Hub image (recommended)
bash apps/rlark/docs/examples/quickstart.sh

# Or build locally
USE_LOCAL_REGISTRY=true bash apps/rlark/docs/examples/quickstart.sh
```

The script automates these steps with log output:

| Step | Description |
|------|-------------|
| 0 | Check prerequisites (docker, kind, kubectl, jq, python3) |
| 1 | Create runtime directories (`~/.rlark/certs`, `/tmp/rlark`) |
| 2 | Build Docker image (all 5 binaries: server, gateway, controller-manager, agent, network-sidecar) |
| 3 | Start kcp and PostgreSQL (Docker Compose) |
| 4 | Configure kubeconfig (fix CA cert, generate DB config, install CRDs) |
| 5 | Start control plane: server, gateway, controller-manager (Docker Compose) |
| 6 | Create kind cluster `rlark-data` and connect to Docker network |
| 7 | Create ConfigMaps and Secrets in kind |
| 8 | Generate Agent certificate via gateway API |
| 9 | Deploy Agent (with RBAC, hostNetwork, hostPID, NodeServer socket) |
| 10 | Verify deployment |

## Architecture

```
Docker Compose (control plane + infrastructure):
  ├── kcp                     :6443 — control API server
  ├── postgresql              :5432 — business data (SSH keys, certs, users)
  ├── rlark-server            :8443 — Agent WebSocket tunnel, cert signing
  │                           :2222 — SSH server (cross-cluster network)
  ├── rlark-gateway           :8080 — User-facing REST API
  └── rlark-controller-manager      — Job→Task, Domain→DomainPeer, IP allocation

kind cluster (rlark-data):
  └── rlark-agent — Pull/Push controllers, NodeServer, network-sidecar injection
```

### Component Roles

| Type | Component | Role |
|------|-----------|------|
| Control Plane | kcp | Lightweight K8s API server, stores all CRDs |
| Control Plane | postgresql | Business data (SSH keys, users, certificates) |
| Control Plane | server | Agent WebSocket tunnel, TLS/SSH cert signing, K8s API proxy |
| Control Plane | controller-manager | Job→Task conversion, Domain→DomainPeer, IP allocation |
| Control Plane | gateway | User-facing REST API |
| Data Plane | agent (cluster) | Pull/Push controllers, sync Workload to local cluster |
| Data Plane | agent (node) | NodeServer, cross-cluster network routing |
| Data Plane | network-sidecar | Injected into Pod, TUN+gVisor intercepts egress traffic |

> **Note:** For production, control plane components should run in a separate management cluster. The quickstart deploys them in Docker Compose alongside kcp for simplicity.

## Quick Experience: Web UI

After deployment, launch the Web UI:

```bash
cd apps/rlark-ui && npm install && npm run dev
```

Open `http://localhost:5173`. See the [Web UI Guide](ui-behavior.md) for details.

## Create a Training Job (curl)

> For advanced users who prefer REST API.

### Create a Domain

```bash
curl -X POST "http://localhost:8080/api/v1/rlinf.io/v1alpha1/domains" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "rlinf.io/v1alpha1",
    "kind": "Domain",
    "metadata": { "name": "my-first-domain" },
    "spec": { "cidr": "10.0.1.0/24" }
  }'
```

### Create a Job

> **Important**: `nodeSelector.rlark.io/cluster-id` must match the Agent's registered cluster-id.
> Naming convention: `cluster_id=agent-my-cluster` → `nodeSelector` is `rlark-agent-my-cluster`.

```bash
curl -X POST "http://localhost:8080/api/v1/rlinf.io/v1alpha1/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "rlinf.io/v1alpha1",
    "kind": "Job",
    "metadata": { "name": "hello-world" },
    "spec": {
      "domain": "my-first-domain",
      "tasks": [{
        "name": "trainer",
        "head": true,
        "role": "Actor",
        "agentType": "Kubernetes",
        "nodeSelector": { "rlark.io/cluster-id": "rlark-agent-my-cluster" },
        "kubernetes": {
          "workload": {
            "kind": "Deployment",
            "replicas": 1,
            "template": {
              "spec": {
                "hostPID": true,
                "restartPolicy": "Always",
                "containers": [{
                  "name": "trainer",
                  "image": "busybox:latest",
                  "imagePullPolicy": "IfNotPresent",
                  "command": ["sh", "-c", "echo Hello from rlark! && sleep 3600"],
                  "resources": {
                    "limits": { "cpu": "100m", "memory": "128Mi" }
                  }
                }]
              }
            }
          }
        }
      }]
    }
  }'
```

### Check Status

```bash
# Job status
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/jobs/hello-world" | jq '.status'

# Verify in kind cluster
kubectl --kubeconfig ~/.rlark/kind-kubeconfig get pods -A | grep hello-world
```

## Cross-Cluster Networking

For cross-cluster network communication, the following configuration is required:

### Agent Configuration

```yaml
spec:
  hostNetwork: true       # Share host network namespace
  hostPID: true           # Share host PID namespace (required for SO_PEERCRED)
  dnsPolicy: ClusterFirstWithHostNet
  containers:
  - args:
    # Use Docker service name (kind node connected to compose network)
    - "--server-address=https://rlark-server:8443"
    # SSH user must match certificate ValidPrincipals ("client")
    - "--rlark-server-ssh-address=client@rlark-server:2222"
    # Enable network-sidecar injection
    - "--network-sidecar-image=<image>"
    volumeMounts:
    - name: nodeserver-socket
      mountPath: /var/run/rlark
  volumes:
  - name: nodeserver-socket
    hostPath:
      path: /var/run/rlark
      type: DirectoryOrCreate
```

### Task Pod Requirements

```yaml
spec:
  hostPID: true  # SO_PEERCRED requires same PID namespace as agent
```

### Data Flow

```
Client Pod (cluster-2)                    Server Pod (cluster-1)
  ├── wget → Domain IP (10.200.0.x)        ├── nc -l -p 8000
  ├── gVisor netstack intercepts           │
  ├── TUN device → NodeServer socket       │
  └── NodeServer → SSH tunnel → ──────────→ Proxy → localhost:8000
```

### Verification

```bash
# Get server Domain IP from sidecar logs
SERVER_DOMAIN_IP=$(kubectl --kubeconfig ~/.rlark/kind-kubeconfig-1 logs -n rlark-system \
  deploy/cross-cluster-ping-server -c rlark-network-sidecar \
  | grep "Retrieved pod IP" | grep -o '"ip":"[^"]*"' | cut -d'"' -f4)

# Cross-cluster test via pod name (no error output)
kubectl --kubeconfig ~/.rlark/kind-kubeconfig-2 exec -n rlark-system \
  deploy/cross-cluster-ping-client -- \
  sh -c "echo 'GET / HTTP/1.0\r\n\r\n' | timeout 5 nc \$SERVER_DOMAIN_IP 8000"

# Or use wget (requires Content-Length + Connection: close in server response)
kubectl --kubeconfig ~/.rlark/kind-kubeconfig-2 exec -n rlark-system \
  deploy/cross-cluster-ping-client -- \
  wget -q -O - -T 3 http://<pod-name>.rlark-domain:8000
```

## Cleanup

```bash
docker compose -f apps/rlark/docs/examples/docker-compose.yml down
kind delete cluster --name rlark-data
rm -rf ~/.rlark
```

## Next Steps

- Read the [Web UI Guide](web-ui-guide.md) for graphical task management
- Read [Core Concepts](concepts.md) for the resource model and naming conventions
- Read [Deployment Guide](deployment.md) for production deployment and real device onboarding
- Read [API Examples](api/examples.md) for complete API usage