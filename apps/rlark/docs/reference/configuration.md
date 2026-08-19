# Configuration Reference

## Database Configuration

PostgreSQL connection configuration loaded via `--db-config` flag. Used by rlark-server, rlark-gateway, and rlark-controller-manager.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `host` | string | `localhost` | PostgreSQL host |
| `port` | int | `5432` | PostgreSQL port |
| `database` | string | `rlark` | Database name |
| `user` | string | `rlark` | Database user |
| `password` | string | `rlark` | Database password |
| `maxOpenConns` | int | `25` | Maximum open connections |
| `maxIdleConns` | int | `5` | Maximum idle connections |
| `connMaxLifetime` | duration | `30m` | Connection maximum lifetime |
| `connMaxIdleTime` | duration | `5m` | Connection maximum idle time |
| `debug` | bool | `false` | Enable query logging |

!!! note "Connection pooling"
    Adjust `maxOpenConns` and `maxIdleConns` based on actual load. Increase for high-concurrency scenarios.

**Example:**
```yaml
host: postgresql
port: 5432
database: rlark
user: rlark
password: CHANGE_ME
maxOpenConns: 25
maxIdleConns: 5
connMaxLifetime: 30m
connMaxIdleTime: 5m
debug: false
```

## rlark-server

Control plane server. Manages TLS/SSH certificates, agent registration, and the Gateway API.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--https-port` | int | `8443` | HTTPS listen port |
| `--ssh-port` | int | `2222` | SSH listen port |
| `--unsafe-http-port` | int | `8888` | Unsafe HTTP port for certificate signing API |
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

!!! tip "`--unsafe-http-port`"
    Agents use this port for certificate signing. In production, only expose to internal networks.

**Example:**
```bash
rlark-server \
  --https-port=8443 \
  --ssh-port=2222 \
  --auto-sign-tls-ca-cert \
  --tls-domains=localhost,rlark.example.com \
  --db-config=/etc/rlark/db-config.yaml
```

## rlark-gateway

API gateway. Handles all REST API requests including cluster management, job management, and storage operations.

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

**Example:**
```bash
rlark-gateway \
  --addr=:8080 \
  --db-config=/etc/rlark/db-config.yaml \
  --server-address=https://rlark-server:8443
```

## rlark-controller-manager

Controller manager. Reconciles Jobs, Workflows, and Domain resources.

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

!!! note "Single-instance deployment"
    Set `--leader-elect=false` for single-instance deployments to avoid unnecessary election overhead.

**Example:**
```bash
rlark-controller-manager \
  --server-address=https://rlark-server:8443 \
  --db-config=/etc/rlark/db-config.yaml \
  --leader-elect=false \
  --metrics-bind-address=:8080 \
  --health-probe-bind-address=:8081
```

## rlark-agent

Data plane agent. Deployed on each cluster or node. Manages node registration, Task execution, and cross-cluster networking.

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

!!! tip "`--mode` values"
    - `cluster`: Cluster-level agent only, manages cluster-wide resources
    - `node`: Node-level agent only, manages Tasks on a single node
    - `both`: Runs both cluster and node-level agents

**Example:**
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

## rlark-network-sidecar

Network sidecar. Runs alongside each Task Pod to provide cross-cluster Pod-to-Pod networking via TUN device and gVisor netstack.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--sidecar-unix-socket` | string | `/var/run/rlark/nodeserver.sock` | NodeServer Unix socket path |
| `--sidecar-tun-name` | string | `gnet0` | TUN device name |
| `--sidecar-tun-mtu` | int | `1500` | TUN device MTU |
| `--sidecar-proxy-listen` | string | `:5700` | Proxy TCP listen address |
| `--sidecar-hosts-sync-enabled` | bool | `true` | Enable periodic hosts file sync |
| `--sidecar-hosts-sync-interval` | duration | `30s` | Hosts sync interval |
| `--sidecar-hosts-file` | string | `/etc/hosts` | Hosts file path |

**Example:**
```bash
rlark-network-sidecar \
  --sidecar-unix-socket=/var/run/rlark/nodeserver.sock \
  --sidecar-tun-name=gnet0 \
  --sidecar-tun-mtu=1500
```

## sshd

SSH daemon. Provides SSH access to running Task Pods. Integrated into rlark-server via `--ssh-port`.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--port` | string | `22` | SSH listen port |
| `--shell` | string | `""` | Shell binary path (default: /bin/bash) |

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `RLARK_SSH_PUBLIC_KEY` | SSH public key for authorized_keys |
| `RLARK_SSH_AUTHORIZED_KEYS_FILE` | Path to authorized_keys file |

## Storage Provider Configuration

Object storage backend configuration used by the gateway.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `accessKeyId` | string | `""` | Access key ID |
| `secretAccessKey` | string | `""` | Secret access key |
| `bucket` | string | `""` | Bucket name |
| `endpoint` | string | `http://localhost:9000` | Storage endpoint |
| `region` | string | `us-east-1` | Region |
| `usePathStyle` | bool | `false` | Use path-style addressing |
| `provider` | string | `""` | Storage provider name |

!!! tip "MinIO vs AWS S3"
    Set `usePathStyle: true` for MinIO. Leave `false` for AWS S3.

## rlarkadm Deploy Configuration

The YAML file passed to `rlarkadm install -f`. See [CLI Reference](cli.md#rlarkadm) for usage.

### Top-level Fields

| Field | Type | Description |
|-------|------|-------------|
| `apiVersion` | string | API version (required) |
| `kind` | string | Must be `DeployConfig` |
| `plane` | string | `control` or `data` |
| `controlPlaneAddress` | string | Control plane address (required for data plane) |
| `db` | DBConfig | Database configuration |
| `kubernetes` | KubernetesEnv | Kubernetes deployment environment |
| `docker` | DockerEnv | Docker deployment environment |
| `raw` | RawEnv | Raw deployment environment |
| `cert` | CertConfig | Certificate configuration (required for data plane) |
| `insecureSkipTLSVerify` | bool | Skip TLS verification |

!!! note "Environment selection"
    Choose exactly one of `kubernetes`, `docker`, or `raw`.

### DBConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `host` | string | `postgresql` | PostgreSQL host |
| `port` | int | `5432` | PostgreSQL port |
| `database` | string | `rlark` | Database name |
| `user` | string | `rlark` | Database user |
| `password` | string | `rlark` | Database password |

### KubernetesEnv

| Field | Type | Description |
|-------|------|-------------|
| `kubeconfig` | string | kubeconfig file path |
| `gatewayImage` | string | Gateway image |
| `controllerManagerImage` | string | Controller manager image |
| `serverImage` | string | Server image |
| `agentImage` | string | Agent image |
| `image` | string | Default image for all components |
| `kcpImage` | string | kcp image |
| `etcdImage` | string | etcd image |
| `postgresqlImage` | string | PostgreSQL image |
| `uiImage` | string | UI image |
| `replicas` | int | Component replicas |
| `storage` | StorageConfig | Storage configuration |
| `kcp` | ComponentConfig | kcp component config |
| `etcd` | EtcdConfig | etcd component config |
| `postgresql` | ComponentConfig | PostgreSQL component config |
| `containerdSocket` | string | Containerd socket path |

!!! tip "Image priority"
    If both `image` and a specific component image (e.g., `gatewayImage`) are set, the specific image takes priority.

### DockerEnv

| Field | Type | Description |
|-------|------|-------------|
| `gatewayImage` | string | Gateway image |
| `controllerManagerImage` | string | Controller manager image |
| `serverImage` | string | Server image |
| `agentImage` | string | Agent image |
| `image` | string | Default image for all components |
| `kcpImage` | string | kcp image |
| `etcdImage` | string | etcd image |
| `postgresqlImage` | string | PostgreSQL image |
| `uiImage` | string | UI image |

### RawEnv

!!! warning "Experimental"
    Raw deployment is experimental. Prefer Kubernetes or Docker.

| Field | Type | Description |
|-------|------|-------------|
| `gatewayArtifact` | string | Gateway binary path |
| `controllerManagerArtifact` | string | Controller manager binary path |
| `serverArtifact` | string | Server binary path |
| `agentArtifact` | string | Agent binary path |
| `networkSidecarArtifact` | string | Network sidecar binary path |
| `kcpArtifact` | string | kcp binary path |
| `etcdArtifact` | string | etcd binary path |
| `postgresqlArtifact` | string | PostgreSQL binary path |

### CertConfig

Required for data plane deployment.

| Field | Type | Description |
|-------|------|-------------|
| `caCert` | string | CA certificate path |
| `agentCert` | string | Agent certificate path |
| `agentKey` | string | Agent private key path |

### StorageConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | | Storage type: emptyDir, hostPath, pvc |
| `hostPath` | string | | Host path for hostPath type |
| `storageClass` | string | | StorageClass for PVC type |
| `size` | string | | Storage size |
| `nodeSelector` | map | | Node selector for PV |

### ComponentConfig

| Field | Type | Description |
|-------|------|-------------|
| `replicas` | int | Number of replicas |
| `storage` | StorageConfig | Storage configuration |

### EtcdConfig

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | etcd address |
| `replicas` | int | Number of replicas |
| `storage` | StorageConfig | Storage configuration |

**Example (control plane):**
```yaml
apiVersion: v1
kind: DeployConfig
plane: control
kubernetes:
  image: rlark:latest
  kcpImage: ghcr.io/kcp-dev/kcp:latest
  etcdImage: quay.io/coreos/etcd:v3.5
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