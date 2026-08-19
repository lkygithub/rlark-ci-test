# 配置项参考

## 数据库配置 (db-config.yaml)

通过 `--db-config` 参数加载的 PostgreSQL 连接配置。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `host` | string | `localhost` | PostgreSQL 主机 |
| `port` | int | `5432` | PostgreSQL 端口 |
| `database` | string | `rlark` | 数据库名 |
| `user` | string | `rlark` | 数据库用户 |
| `password` | string | `rlark` | 数据库密码 |
| `maxOpenConns` | int | `25` | 最大打开连接数 |
| `maxIdleConns` | int | `5` | 最大空闲连接数 |
| `connMaxLifetime` | duration | `30m` | 连接最大生命周期 |
| `connMaxIdleTime` | duration | `5m` | 连接最大空闲时间 |
| `debug` | bool | `false` | 启用查询日志 |

!!! note "连接池调优"
    `maxOpenConns` 和 `maxIdleConns` 应根据实际负载调整。高并发场景建议增大这两个值。

!!! tip "调试模式"
    开发环境可设置 `debug: true` 查看 SQL 查询日志，生产环境务必关闭。

**示例：**
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

## rlarkadm 部署配置

`rlarkadm install -f` 使用的 YAML 配置文件。

### 顶层字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `apiVersion` | string | API 版本（必填） |
| `kind` | string | 必须为 `DeployConfig` |
| `plane` | string | 部署类型：`control`（控制面）或 `data`（数据面） |
| `controlPlaneAddress` | string | 控制面地址（数据面部署时必填） |
| `db` | DBConfig | 数据库配置 |
| `kubernetes` | KubernetesEnv | Kubernetes 部署环境 |
| `docker` | DockerEnv | Docker 部署环境 |
| `raw` | RawEnv | Raw 部署环境 |
| `cert` | CertConfig | 证书配置（数据面部署时必填） |
| `insecureSkipTLSVerify` | bool | 跳过 TLS 验证 |

!!! note "部署环境选择"
    `kubernetes`、`docker`、`raw` 三者选其一，分别对应不同的部署目标环境。

### DBConfig

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `host` | string | `postgresql` | PostgreSQL 主机 |
| `port` | int | `5432` | PostgreSQL 端口 |
| `database` | string | `rlark` | 数据库名 |
| `user` | string | `rlark` | 数据库用户 |
| `password` | string | `rlark` | 数据库密码 |

### KubernetesEnv

| 字段 | 类型 | 说明 |
|------|------|------|
| `kubeconfig` | string | kubeconfig 文件路径 |
| `gatewayImage` | string | Gateway 镜像 |
| `controllerManagerImage` | string | Controller Manager 镜像 |
| `serverImage` | string | Server 镜像 |
| `agentImage` | string | Agent 镜像 |
| `image` | string | 所有组件默认镜像 |
| `kcpImage` | string | kcp 镜像 |
| `etcdImage` | string | etcd 镜像 |
| `postgresqlImage` | string | PostgreSQL 镜像 |
| `uiImage` | string | UI 镜像 |
| `replicas` | int | 组件副本数 |
| `storage` | StorageConfig | 存储配置 |
| `kcp` | ComponentConfig | kcp 组件配置 |
| `etcd` | EtcdConfig | etcd 组件配置 |
| `postgresql` | ComponentConfig | PostgreSQL 组件配置 |
| `containerdSocket` | string | Containerd Socket 路径 |

!!! tip "镜像优先级"
    如果同时设置了 `image` 和特定组件镜像（如 `gatewayImage`），特定组件镜像优先生效。

### DockerEnv

| 字段 | 类型 | 说明 |
|------|------|------|
| `gatewayImage` | string | Gateway 镜像 |
| `controllerManagerImage` | string | Controller Manager 镜像 |
| `serverImage` | string | Server 镜像 |
| `agentImage` | string | Agent 镜像 |
| `image` | string | 所有组件默认镜像 |
| `kcpImage` | string | kcp 镜像 |
| `etcdImage` | string | etcd 镜像 |
| `postgresqlImage` | string | PostgreSQL 镜像 |
| `uiImage` | string | UI 镜像 |

### RawEnv

裸机/虚拟机部署环境，直接使用本地二进制文件。

| 字段 | 类型 | 说明 |
|------|------|------|
| `gatewayArtifact` | string | Gateway 二进制路径 |
| `controllerManagerArtifact` | string | Controller Manager 二进制路径 |
| `serverArtifact` | string | Server 二进制路径 |
| `agentArtifact` | string | Agent 二进制路径 |
| `networkSidecarArtifact` | string | Network Sidecar 二进制路径 |
| `kcpArtifact` | string | kcp 二进制路径 |
| `etcdArtifact` | string | etcd 二进制路径 |
| `postgresqlArtifact` | string | PostgreSQL 二进制路径 |

!!! warning "Raw 环境为实验性功能"
    Raw 部署模式目前处于实验阶段，建议优先使用 Kubernetes 或 Docker 部署。

### CertConfig

数据面部署时必须提供证书配置。

| 字段 | 类型 | 说明 |
|------|------|------|
| `caCert` | string | CA 证书路径 |
| `agentCert` | string | Agent 证书路径 |
| `agentKey` | string | Agent 私钥路径 |

### StorageConfig

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | | 存储类型：emptyDir、hostPath、pvc |
| `hostPath` | string | | hostPath 类型的主机路径 |
| `storageClass` | string | | PVC 类型的 StorageClass |
| `size` | string | | 存储大小 |
| `nodeSelector` | map | | PV 节点选择器 |

### ComponentConfig

| 字段 | 类型 | 说明 |
|------|------|------|
| `replicas` | int | 副本数 |
| `storage` | StorageConfig | 存储配置 |

### EtcdConfig

| 字段 | 类型 | 说明 |
|------|------|------|
| `address` | string | etcd 地址 |
| `replicas` | int | 副本数 |
| `storage` | StorageConfig | 存储配置 |

**示例（控制面）：**
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

## 存储 Provider 配置

Gateway 使用的对象存储后端配置。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `accessKeyId` | string | `""` | 访问密钥 ID |
| `secretAccessKey` | string | `""` | 访问密钥 Secret |
| `bucket` | string | `""` | Bucket 名称 |
| `endpoint` | string | `http://localhost:9000` | 存储端点 |
| `region` | string | `us-east-1` | 区域 |
| `usePathStyle` | bool | `false` | 使用路径风格寻址 |
| `provider` | string | `""` | 存储提供商名称 |

!!! tip "MinIO vs AWS S3"
    使用 MinIO 时建议设置 `usePathStyle: true`，使用 AWS S3 时无需设置。