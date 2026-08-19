# Configuration Reference

## Database Configuration (`db-config.yaml`)

PostgreSQL connection configuration loaded via `--db-config` flag.

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
    The `maxOpenConns` and `maxIdleConns` values control the database connection pool size. Adjust these based on your expected workload concurrency. Setting `maxOpenConns` too low can cause bottlenecks under high load, while setting it too high can overwhelm the database server.

!!! tip "Debug mode"
    Enable `debug: true` during development to log all SQL queries. This is useful for troubleshooting performance issues or verifying query behavior, but should be disabled in production to avoid excessive logging.

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

## rlarkadm Deploy Configuration

The YAML file passed to `rlarkadm install -f`.

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
    Exactly one of `kubernetes`, `docker`, or `raw` must be specified, depending on your target deployment environment. The control plane will use the selected environment to determine how to provision and configure its components.

!!! tip "Data plane certificate"
    When deploying a data plane (`plane: data`), you must provide `cert` with valid CA, agent certificate, and agent key paths. These certificates are used to establish mutual TLS with the control plane. Without them, the agent cannot authenticate.

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
| `kcp` | ComponentConfig | kcp component configuration |
| `etcd` | EtcdConfig | etcd component configuration |
| `postgresql` | ComponentConfig | PostgreSQL component configuration |
| `containerdSocket` | string | Containerd socket path |

!!! tip "Image override precedence"
    Component-specific image fields (e.g., `gatewayImage`) take precedence over the global `image` field. If `image` is set to `rlark:latest` but `gatewayImage` is set to `rlark-gateway:custom`, the gateway will use `rlark-gateway:custom` while other components fall back to `rlark:latest`.

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

!!! note "Raw environment"
    The `raw` environment is intended for running RLark components directly on the host without containerization. Each artifact path should point to the compiled binary for that component. This is typically used for development and debugging purposes.

### CertConfig

| Field | Type | Description |
|-------|------|-------------|
| `caCert` | string | CA certificate path |
| `agentCert` | string | Agent certificate path |
| `agentKey` | string | Agent private key path |

### StorageConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | | Storage type: `emptyDir`, `hostPath`, `pvc` |
| `hostPath` | string | | Host path for `hostPath` type |
| `storageClass` | string | | StorageClass for `pvc` type |
| `size` | string | | Storage size |
| `nodeSelector` | map | | Node selector for PV |

!!! tip "Storage type selection"
    - **`emptyDir`**: Ephemeral storage tied to the Pod lifecycle. Use for development or stateless workloads.
    - **`hostPath`**: Mounts a directory from the host node. Suitable for single-node deployments or when data locality is required.
    - **`pvc`**: Persistent volume claim. Use in production with a StorageClass that supports your cluster's storage backend.

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

## Storage Provider Configuration

Configuration for the object storage backend used by the gateway.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `accessKeyId` | string | `""` | Access key ID |
| `secretAccessKey` | string | `""` | Secret access key |
| `bucket` | string | `""` | Bucket name |
| `endpoint` | string | `http://localhost:9000` | Storage endpoint |
| `region` | string | `us-east-1` | Region |
| `usePathStyle` | bool | `false` | Use path-style addressing |
| `provider` | string | `""` | Storage provider name |

!!! tip "Path-style addressing"
    Enable `usePathStyle: true` when connecting to S3-compatible storage services that use path-style URLs (e.g., MinIO). For AWS S3, leave this as `false` to use virtual-hosted-style addressing.