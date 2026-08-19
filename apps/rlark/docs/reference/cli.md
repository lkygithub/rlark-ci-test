# CLI Reference

## rlark-server

The control plane server. Manages TLS/SSH certificates, agent registration, and the Gateway API.

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--https-port` | int | `8443` | HTTPS listen port |
| `--ssh-port` | int | `2222` | SSH listen port |
| `--unsafe-http-port` | int | `8888` | Unsafe HTTP listen port (for certificate signing API) |
| `--auto-sign-tls-ca-cert` | bool | `false` | Auto-sign TLS CA certificate if not present |
| `--tls-domains` | strings | `["localhost"]` | TLS certificate domain list |
| `--db-config` | string | `""` | Database configuration file path |
| `--peer-service` | string | `""` | Cluster peer service DNS name |
| `--peers` | strings | `[]` | Cluster peer server addresses |
| `--kubeconfig` | string | `$KUBECONFIG` | kubeconfig file path |
| `--master` | string | `""` | Kubernetes API server address |
| `--in-cluster` | bool | `false` | Use in-cluster Kubernetes config |
| `--kube-namespace` | string | `""` | Kubernetes namespace |
| `--kube-qps` | float32 | `5000` | Kubernetes client QPS |
| `--kube-burst` | int | `8000` | Kubernetes client burst |
| `--kube-timeout` | duration | `0` | Kubernetes client request timeout |

### Example

```bash
rlark-server \
  --https-port=8443 \
  --ssh-port=2222 \
  --auto-sign-tls-ca-cert \
  --tls-domains=localhost,rlark.example.com \
  --db-config=/etc/rlark/db-config.yaml
```

!!! note
    The `--unsafe-http-port` exposes an unauthenticated HTTP endpoint used for certificate signing. This should only be accessible within the cluster.

---

## rlark-gateway

The API gateway. Handles all REST API requests including cluster management, job management, and storage operations.

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--addr` | string | `:8080` | API gateway bind address |
| `--db-config` | string | `""` | Database configuration file path |
| `--server-address` | string | `https://rlark-server.rlark-system.svc:8443` | RLark server address for certificate signing |
| `--kubeconfig` | string | `$KUBECONFIG` | kubeconfig file path |
| `--master` | string | `""` | Kubernetes API server address |
| `--in-cluster` | bool | `false` | Use in-cluster Kubernetes config |
| `--kube-namespace` | string | `""` | Kubernetes namespace |
| `--kube-qps` | float32 | `5000` | Kubernetes client QPS |
| `--kube-burst` | int | `8000` | Kubernetes client burst |
| `--kube-timeout` | duration | `0` | Kubernetes client request timeout |

### Example

```bash
rlark-gateway \
  --addr=:8080 \
  --db-config=/etc/rlark/db-config.yaml \
  --server-address=https://rlark-server:8443
```

---

## rlark-controller-manager

The controller manager. Reconciles Jobs, Workflows, and Domain resources. Creates Tasks based on Job definitions and monitors their lifecycle.

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--server-address` | string | `https://rlark-server.rlark-system.svc:8443` | RLark server address |
| `--db-config` | string | `""` | Database configuration file path |
| `--leader-elect` | bool | `true` | Enable leader election for HA |
| `--leader-election-id` | string | `rlark-controller-manager` | Leader election identity |
| `--metrics-bind-address` | string | `:8080` | Metrics endpoint bind address |
| `--health-probe-bind-address` | string | `:8081` | Health probe endpoint bind address |
| `--sync-workers` | int | `5` | Number of concurrent sync workers |
| `--kubeconfig` | string | `$KUBECONFIG` | kubeconfig file path |
| `--master` | string | `""` | Kubernetes API server address |
| `--in-cluster` | bool | `false` | Use in-cluster Kubernetes config |
| `--kube-namespace` | string | `""` | Kubernetes namespace |
| `--kube-qps` | float32 | `5000` | Kubernetes client QPS |
| `--kube-burst` | int | `8000` | Kubernetes client burst |
| `--kube-timeout` | duration | `0` | Kubernetes client request timeout |

### Example

```bash
rlark-controller-manager \
  --server-address=https://rlark-server:8443 \
  --db-config=/etc/rlark/db-config.yaml \
  --leader-elect=false \
  --metrics-bind-address=:8080 \
  --health-probe-bind-address=:8081
```

!!! tip
    Set `--leader-elect=false` when running a single instance for development or testing. For production HA deployments, keep it enabled (default).

---

## rlark-agent

The data plane agent. Deployed on each cluster (cluster-agent mode) or each node (node-agent mode). Manages node registration, Task execution, and cross-cluster networking.

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--server-address` | string | `https://localhost:8443` | RLark server address |
| `--server-hostname` | string | `""` | Expected server TLS hostname |
| `--client-cert` | string | `""` | Client TLS certificate path |
| `--client-key` | string | `""` | Client TLS private key path |
| `--ca-cert` | string | `""` | CA certificate path |
| `--insecure-skip-tls-verify` | bool | `false` | Skip TLS certificate verification |
| `--agent-type` | string | `Kubernetes` | Agent type: Kubernetes, Docker, Raw |
| `--mode` | string | `cluster` | Agent mode: cluster, node, both |
| `--leader-election` | bool | `false` | Enable agent leader election |
| `--leader-election-key` | string | `default/rlark-agent` | Leader election key (namespace/name) |
| `--leader-election-id` | string | `hostname-pid` | Leader election identity |
| `--metrics-bind-address` | string | `:8081` | Metrics endpoint bind address |
| `--rlark-server-ssh-address` | string | `""` | RLark server SSH address (user@host:port) |
| `--rlark-server-ssh-host-key` | string | `""` | RLark server SSH host key |
| `--image` | string | `""` | RLark network sidecar image |
| `--enable-same-cluster-direct` | bool | `true` | Enable same-cluster direct Pod access |
| `--enable-cross-cluster-direct` | bool | `true` | Enable cross-cluster direct Pod access |
| `--kubelet-dir` | string | `""` | Kubelet directory for pod UID discovery |
| `--image-pull-enabled` | bool | `true` | Enable image pre-pull |
| `--containerd-socket` | string | `/run/containerd/containerd.sock` | Containerd socket path |
| `--containerd-namespace` | string | `k8s.io` | Containerd namespace |
| `--node-name` | string | `$NODE_NAME` | Local node name |
| `--nodeserver-unix-socket` | string | `/var/run/rlark/nodeserver.sock` | NodeServer Unix socket path |
| `--kubeconfig` | string | `$KUBECONFIG` | kubeconfig file path |
| `--master` | string | `""` | Kubernetes API server address |
| `--in-cluster` | bool | `false` | Use in-cluster Kubernetes config |
| `--kube-namespace` | string | `""` | Kubernetes namespace |
| `--kube-qps` | float32 | `5000` | Kubernetes client QPS |
| `--kube-burst` | int | `8000` | Kubernetes client burst |
| `--kube-timeout` | duration | `0` | Kubernetes client request timeout |

### Example

```bash
rlark-agent \
  --mode=both \
  --server-address=https://rlark-server:8443 \
  --client-cert=/etc/rlark/agent-cert.pem \
  --client-key=/etc/rlark/agent-key.pem \
  --ca-cert=/etc/rlark/ca-cert.pem \
  --image=rlark:latest \
  --node-name=worker-01
```

!!! note
    The `--mode` flag accepts three values: `cluster` (cluster-agent only), `node` (node-agent only), or `both` (combined mode). In typical deployments, the cluster-agent runs as a Deployment and the node-agent runs as a DaemonSet.

---

## rlark-network-sidecar

The network sidecar. Runs alongside each Task Pod to provide cross-cluster Pod-to-Pod networking via TUN device and gVisor netstack.

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--sidecar-unix-socket` | string | `/var/run/rlark/nodeserver.sock` | NodeServer Unix socket path |
| `--sidecar-tun-name` | string | `gnet0` | TUN device name |
| `--sidecar-tun-mtu` | int | `1500` | TUN device MTU |
| `--sidecar-proxy-listen` | string | `:5700` | Proxy TCP listen address |
| `--sidecar-hosts-sync-enabled` | bool | `true` | Enable periodic hosts file sync |
| `--sidecar-hosts-sync-interval` | duration | `30s` | Hosts sync interval |
| `--sidecar-hosts-file` | string | `/etc/hosts` | Hosts file path |

### Example

```bash
rlark-network-sidecar \
  --sidecar-unix-socket=/var/run/rlark/nodeserver.sock \
  --sidecar-tun-name=gnet0 \
  --sidecar-tun-mtu=1500
```

---

## rlarkadm

The deployment tool. Installs and uninstalls RLark control plane and data plane components.

### Global Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--log-level` | string | `info` | Log level: debug, info, warn, error |

### rlarkadm install

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--install-conf` | `-f` | string | `""` | Install configuration file path (required) |

**Example:**

```bash
rlarkadm install -f deploy-control-plane.yaml
```

### rlarkadm uninstall

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--uninstall-conf` | `-f` | string | `""` | Uninstall configuration file path (required) |
| `--purge` | | bool | `false` | Also delete namespace and data directories |
| `--yes` | `-y` | bool | `false` | Skip confirmation prompt |

**Example:**

```bash
rlarkadm uninstall -f deploy-control-plane.yaml --purge -y
```

!!! tip
    Use `--purge` to remove all cluster resources, including namespace and persistent data. This is useful for a clean teardown during testing.

---

## rlark-server-cli (rlarkctl)

The server CLI tool. Used for certificate management and proxy access.

### Global Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--server-address` | string | `https://localhost:8443` | Server address |
| `--server-hostname` | string | `""` | Expected server TLS hostname |
| `--client-cert` | string | `""` | Client TLS certificate path |
| `--client-key` | string | `""` | Client TLS private key path |
| `--ca-cert` | string | `""` | CA certificate path |
| `--insecure-skip-tls-verify` | bool | `false` | Skip TLS certificate verification |

### rlark-server-cli sign

Sign an agent certificate.

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--role` | `-r` | string | `agent` | Certificate role: admin, peer, agent |
| `--client-id` | `-c` | string | `example-client-id` | Client ID for agent role |
| `--output` | `-o` | string | `""` | Output directory for cert and key |

**Example:**

```bash
rlark-server-cli sign \
  --role=agent \
  --client-id=agent-my-cluster-1 \
  --output=/tmp/agent-certs
```

### rlark-server-cli revoke

Revoke a certificate.

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--cert-type` | `-t` | string | `""` | Certificate type: x509, ssh (required) |
| `--serial-number` | `-s` | string | `""` | Certificate serial number (required) |
| `--subject-key-id` | `-k` | string | `""` | Certificate Subject Key ID (required) |
| `--reason` | `-r` | string | `""` | Revocation reason (optional) |

### rlark-server-cli proxy-curl

Send HTTP requests through the server proxy endpoint.

**Example:**

```bash
rlark-server-cli proxy-curl https://internal-service:8080/api/status
```

---

## sshd

The SSH daemon. Provides SSH access to running Task Pods.

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--port` | string | `22` | SSH listen port |
| `--shell` | string | `""` | Shell binary path (default: /bin/bash) |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `RLARK_SSH_PUBLIC_KEY` | SSH public key for authorized_keys |
| `RLARK_SSH_AUTHORIZED_KEYS_FILE` | Path to authorized_keys file |

!!! note
    The SSH daemon is typically injected into Task Pods as a sidecar or entrypoint. Use `RLARK_SSH_PUBLIC_KEY` to pass a single key, or `RLARK_SSH_AUTHORIZED_KEYS_FILE` to specify a file containing multiple authorized keys.