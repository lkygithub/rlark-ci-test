# Agent Installation and Upgrade

## Installation

The agent is installed on each data plane cluster to manage node registration, Task execution, and cross-cluster networking.

### Prerequisites

- Kubernetes cluster with kubectl access
- Network connectivity to the control plane (`--server-address`)
- Valid agent TLS certificate and key

### Installation Methods

#### Via rlarkadm (Recommended)

The admin console generates the full installation command:

```bash
rlarkagent install \
  --server-address=https://<control-plane>:8443 \
  --client-cert=/etc/rlark/agent-cert.pem \
  --client-key=/etc/rlark/agent-key.pem \
  --ca-cert=/etc/rlark/ca-cert.pem
```

#### Manual Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rlark-agent
  namespace: rlark-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: rlark-agent
  template:
    metadata:
      labels:
        app: rlark-agent
    spec:
      serviceAccountName: rlark-agent
      containers:
      - name: agent
        image: rlark:latest
        args:
        - --mode=both
        - --server-address=https://<control-plane>:8443
        - --client-cert=/etc/rlark/certs/cert.pem
        - --client-key=/etc/rlark/certs/key.pem
        - --ca-cert=/etc/rlark/certs/ca-cert.pem
        volumeMounts:
        - name: certs
          mountPath: /etc/rlark/certs
        - name: containerd-socket
          mountPath: /run/containerd/containerd.sock
        - name: rlark-socket
          mountPath: /var/run/rlark
      volumes:
      - name: certs
        secret:
          secretName: rlark-agent-certs
      - name: containerd-socket
        hostPath:
          path: /run/containerd/containerd.sock
      - name: rlark-socket
        hostPath:
          path: /var/run/rlark
```

### Verification

After installation, verify the agent is running and connected:

```bash
# Check agent pod status
kubectl get pods -n rlark-system -l app=rlark-agent

# Check agent logs
kubectl logs -n rlark-system deploy/rlark-agent

# Verify node registration (via admin console or API)
curl -k https://<control-plane>:8443/api/v1/rlinf.io/v1alpha1/nodes
```

### Verification Checklist

| Check | Expected Result |
|-------|----------------|
| Agent pod Running | All containers ready |
| Heartbeat | Regular heartbeat in logs |
| Cluster status | Online in admin console |
| Node registration | Worker nodes appear with correct labels |
| Resource sync | CPU, memory, GPU reported correctly |
| Task creation | Test Job deploys and runs |
| Log streaming | Worker logs accessible via console |
| WebTerminal | Terminal access works |

## Upgrade

### Pre-upgrade Steps

1. Review the [Release Notes](../reference/changelog.md) for breaking changes
2. Back up the current agent manifests and certificates
3. Test the upgrade on a non-critical cluster first

### Upgrade Process

```bash
# Update the agent image
kubectl set image deploy/rlark-agent \
  agent=<new-image> \
  -n rlark-system

# Or update via rlarkadm
rlarkagent upgrade --version=<new-version>
```

### Post-upgrade Verification

Run the same verification checklist as the initial installation. Pay special attention to:

- Heartbeat continuity (no gaps during upgrade)
- Existing Tasks continue running
- Cross-cluster network connectivity unchanged

## Configuration Reference

| Flag | Description | Common Values |
|------|-------------|---------------|
| `--mode` | Agent mode | `cluster` (cluster-level), `node` (per-node), `both` |
| `--agent-type` | Runtime type | `Kubernetes`, `Docker`, `Raw` |
| `--image` | Sidecar image | `rlark:latest` |
| `--leader-election` | HA mode | `true` for multi-replica deployments |
| `--enable-cross-cluster-direct` | Cross-cluster networking | `true` (default) |
| `--containerd-socket` | Containerd socket | `/run/containerd/containerd.sock` |

See [Configuration Reference](../reference/configuration.md#rlark-agent) for the complete list.