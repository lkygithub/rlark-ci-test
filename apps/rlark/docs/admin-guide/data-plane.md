# Data Plane Onboarding

## Overview

Onboarding a data plane cluster makes its compute resources available to RLark for scheduling training jobs. The process involves creating a cluster registration in the admin console, generating agent credentials, and running the agent on the target cluster.

## Step-by-Step Onboarding

### Step 1: Create Cluster Registration

1. Sign in to the administrator console at `http://<host>:5173/admin`
2. Navigate to **Cluster Management** → **Create Cluster**

![Create Cluster](../images/ui/admin-create-cluster.jpg)

3. Enter a cluster name (e.g., `my-cluster-1`)
4. Select the cluster type and region
5. Click **Create**

### Step 2: Generate Installation Command

After creating the cluster registration, the console generates an installation command with embedded credentials.

!!! warning "Protect credentials"
    The generated command contains cluster-scoped credentials. Treat them as secrets and do not share them between clusters.

### Step 3: Run the Agent

Run the generated command on the target Kubernetes cluster. The command typically looks like:

```bash
rlark-agent \
  --mode=both \
  --server-address=https://<control-plane>:8443 \
  --client-cert=/etc/rlark/agent-cert.pem \
  --client-key=/etc/rlark/agent-key.pem \
  --ca-cert=/etc/rlark/ca-cert.pem \
  --image=rlark:latest
```

The agent requires the following Kubernetes RBAC permissions:

| Permission | Purpose |
|------------|---------|
| `pods` (create, get, list, watch, delete) | Task Pod lifecycle management |
| `nodes` (get, list, watch) | Node discovery |
| `configmaps` (create, get, update) | Configuration management |
| `secrets` (create, get) | Image pull secrets |

### Step 4: Verify Agent Connection

1. Return to the administrator console
2. Navigate to **Cluster Management** → **Clusters and Nodes**

![Verify Cluster Nodes](../images/ui/admin-clusters-nodes.jpg)

3. Verify that the cluster appears with status **Online**
4. Check that usable Worker nodes are listed

### Step 5: Add Scheduling Metadata

Add labels and annotations to nodes for scheduling:

```bash
# Label nodes for scheduling
kubectl label node <node-name> rlark.io/node-category=cloud
kubectl annotate node <node-name> rlark.io/gpu-model=A100

# Or use the admin console UI
```

### Step 6: Run a Smoke Test

Create a simple test Job to verify the data plane is fully functional:

```yaml
apiVersion: rlinf.io/v1alpha1
kind: Job
metadata:
  name: smoke-test
spec:
  tasks:
  - name: ping
    nodeSelector:
      rlark.io/cluster-id: <cluster-id>
    image: busybox
    command: ["echo", "Data plane is ready!"]
```

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Agent not connecting | Verify server address, TLS certificates, and network connectivity |
| Cluster shows offline | Check agent logs: `kubectl logs -n rlark-system deploy/rlark-agent` |
| Nodes not appearing | Verify node labels and agent `--mode` setting |
| Tasks not scheduling | Check node selectors match available nodes |

## Registration Management

- Create a **separate registration** for each data plane cluster
- Rotate certificates periodically using `rlarkctl sign`
- Remove unused registrations to keep the cluster list clean