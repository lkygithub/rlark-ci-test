# Quick Start

This guide walks you through setting up rlark locally and running your first training job.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Go | >= 1.22 | Compile Go code |
| Docker | >= 24.0 | Run kcp and kind clusters |
| kind | >= 0.20 | Run local k8s data plane cluster |
| kubectl | >= 1.28 | Interact with clusters |

## 1. Build

```bash
git clone https://github.com/RLinf/RLark
cd rlark
make build
```

After building, the `bin/` directory contains:

```
bin/
├── server                # Control plane Server
├── gateway               # API Gateway
├── controller-manager    # Control plane controllers
├── agent                 # Data plane Agent
├── network-sidecar       # Pod network Sidecar
└── rlarkadm              # Deployment CLI
```

## 2. Local Development Environment

rlark supports quick local development environment setup via Docker Compose, including kcp cluster, database, and necessary runtime components.

### 2.1 Start Control Plane

```bash
# Start all control plane components via Docker Compose
docker compose -f tmp/test/docker-compose.yml up -d

# Wait for services to be ready (~30 seconds)
# Check status
docker compose -f tmp/test/docker-compose.yml ps
```

Components include:
- **kcp**: API Server (control plane cluster)
- **kcp-data**: kcp data storage
- **postgresql**: rlark operational database

### 2.2 Create Data Plane Kind Cluster

```bash
# Create kind cluster (if not already created)
kind create cluster --name rlark-data

# Export kubeconfig
kind get kubeconfig --name rlark-data > tmp/test/kind-kubeconfig
```

### 2.3 Start Control Plane Components

Open three terminals and start Server, Controller-Manager, and Gateway:

```bash
# Terminal 1: Start Server
./bin/server \
  --kubeconfig tmp/test/admin.kubeconfig \
  --https-port 8443 \
  --ssh-port 2222 \
  --db-config tmp/test/db-config.yaml

# Terminal 2: Start Controller-Manager
./bin/controller-manager \
  --kubeconfig tmp/test/admin.kubeconfig \
  --server-address https://localhost:8443 \
  --leader-elect=false

# Terminal 3: Start Gateway
./bin/gateway \
  --kubeconfig tmp/test/admin.kubeconfig \
  --port 8080 \
  --db-config tmp/test/db-config.yaml
```

### 2.4 Start Data Plane Agent

```bash
./bin/agent \
  --kubeconfig tmp/test/kind-kubeconfig \
  --control-plane https://localhost:8443 \
  --agent-cert tmp/test/certs/cert.pem \
  --agent-key tmp/test/certs/key.pem \
  --ca-cert tmp/test/certs/ca-cert.pem \
  --mode both \
  --rlark-server-ssh-address localhost:2222
```

## 3. Verify Environment

### 3.1 Check Agent Registration

After Agent starts, it will automatically register nodes in the control plane:

```bash
# View registered Nodes
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/nodes?namespace=default" | jq .
```

### 3.2 Check Control Plane

```bash
# View available CRDs
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1" | jq .
```

## 4. Create Your First Training Job

### 4.1 Create a Domain

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

### 4.2 Create a Job

```bash
curl -X POST "http://localhost:8080/api/v1/rlinf.io/v1alpha1/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "rlinf.io/v1alpha1",
    "kind": "Job",
    "metadata": { "name": "hello-world" },
    "spec": {
      "domain": "my-first-domain",
      "tasks": [
        {
          "name": "trainer",
          "head": true,
          "role": "Actor",
          "agentType": "Kubernetes",
          "kubernetes": {
            "workload": {
              "kind": "Deployment",
              "replicas": 1,
              "template": {
                "spec": {
                  "restartPolicy": "Always",
                  "containers": [
                    {
                      "name": "trainer",
                      "image": "busybox:latest",
                      "command": ["sh", "-c", "echo Hello from rlark! && sleep 3600"],
                      "resources": {
                        "limits": { "cpu": "100m", "memory": "128Mi" }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      ]
    }
  }'
```

### 4.3 Check Job Status

```bash
# Check Job status
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/jobs/hello-world" | jq '.status'

# Check Task status
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/tasks?namespace=default&labelSelector=rlinf.io/job=hello-world" | jq '.items[].status'

# Check Pod logs
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/jobs/hello-world/logs" | jq .
```

### 4.4 Verify in Kind Cluster

```bash
# Data plane should show the Deployment
kubectl --kubeconfig tmp/test/kind-kubeconfig get deployment -A

# View Pods
kubectl --kubeconfig tmp/test/kind-kubeconfig get pods -A
```

## 5. Use Web UI

```bash
# Start frontend dev server
cd apps/rlark-ui && npm install && npm run dev
```

Open `http://localhost:5173` in your browser to see:
- Dashboard: System overview
- Nodes: Node list and resource usage
- Jobs: Create and manage training jobs
- Workflows: DAG workflow orchestration

## 6. Cleanup

```bash
# Stop all components
docker compose -f tmp/test/docker-compose.yml down

# Delete kind cluster
kind delete cluster --name rlark-data

# Clean up kcp data
docker compose -f tmp/test/docker-compose.yml down -v
```

## 7. Next Steps

- Read [Core Concepts](concepts.md) to understand the resource model
- Read [Architecture](architecture.md) to understand implementation principles
- Read [API Examples](../api/examples.md) for complete API usage
- Read [Deployment Guide](deployment.md) for production deployment