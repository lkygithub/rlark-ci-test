# CLI 参考

RLark 提供以下命令行工具。

## rlark-server

控制面服务器。管理 TLS/SSH 证书、Agent 注册和 Gateway API。

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--https-port` | int | `8443` | HTTPS 监听端口 |
| `--ssh-port` | int | `2222` | SSH 监听端口 |
| `--unsafe-http-port` | int | `8888` | 不安全 HTTP 监听端口（用于证书签名 API） |
| `--auto-sign-tls-ca-cert` | bool | `false` | 若 TLS CA 证书不存在则自动签发 |
| `--tls-domains` | strings | `["localhost"]` | TLS 证书域名列表 |
| `--db-config` | string | `""` | 数据库配置文件路径 |
| `--peer-service` | string | `""` | 集群对等服务 DNS 名称 |
| `--peers` | strings | `[]` | 集群对等服务器地址列表 |
| `--kubeconfig` | string | `$KUBECONFIG` | kubeconfig 文件路径 |
| `--master` | string | `""` | Kubernetes API Server 地址 |
| `--in-cluster` | bool | `false` | 使用 in-cluster 配置 |
| `--kube-namespace` | string | `""` | Kubernetes 命名空间 |
| `--kube-qps` | float32 | `5000` | Kubernetes 客户端 QPS |
| `--kube-burst` | int | `8000` | Kubernetes 客户端 Burst |
| `--kube-timeout` | duration | `0` | Kubernetes 客户端请求超时 |

!!! tip "`--unsafe-http-port` 用于证书签名"
    Agent 通过此端口请求证书签名。生产环境应仅对内网开放。

**示例：**
```bash
rlark-server \
  --https-port=8443 \
  --ssh-port=2222 \
  --auto-sign-tls-ca-cert \
  --tls-domains=localhost,rlark.example.com \
  --db-config=/etc/rlark/db-config.yaml
```

## rlark-gateway

API 网关。处理所有 REST API 请求，包括集群管理、任务管理和存储操作。

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--addr` | string | `:8080` | API 网关绑定地址 |
| `--db-config` | string | `""` | 数据库配置文件路径 |
| `--server-address` | string | `https://rlark-server.rlark-system.svc:8443` | 证书签名的 RLark Server 地址 |
| `--kubeconfig` | string | `$KUBECONFIG` | kubeconfig 文件路径 |
| `--master` | string | `""` | Kubernetes API Server 地址 |
| `--in-cluster` | bool | `false` | 使用 in-cluster 配置 |
| `--kube-namespace` | string | `""` | Kubernetes 命名空间 |
| `--kube-qps` | float32 | `5000` | Kubernetes 客户端 QPS |
| `--kube-burst` | int | `8000` | Kubernetes 客户端 Burst |
| `--kube-timeout` | duration | `0` | Kubernetes 客户端请求超时 |

**示例：**
```bash
rlark-gateway \
  --addr=:8080 \
  --db-config=/etc/rlark/db-config.yaml \
  --server-address=https://rlark-server:8443
```

## rlark-controller-manager

控制器管理器。调和 Job、Workflow 和 Domain 资源，根据 Job 定义创建 Task 并监控其生命周期。

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--server-address` | string | `https://rlark-server.rlark-system.svc:8443` | RLark Server 地址 |
| `--db-config` | string | `""` | 数据库配置文件路径 |
| `--leader-elect` | bool | `true` | 启用 Leader Election（高可用） |
| `--leader-election-id` | string | `rlark-controller-manager` | Leader Election 标识 |
| `--metrics-bind-address` | string | `:8080` | Metrics 端点绑定地址 |
| `--health-probe-bind-address` | string | `:8081` | 健康检查端点绑定地址 |
| `--sync-workers` | int | `5` | 并发同步 Worker 数 |
| `--kubeconfig` | string | `$KUBECONFIG` | kubeconfig 文件路径 |
| `--master` | string | `""` | Kubernetes API Server 地址 |
| `--in-cluster` | bool | `false` | 使用 in-cluster 配置 |
| `--kube-namespace` | string | `""` | Kubernetes 命名空间 |
| `--kube-qps` | float32 | `5000` | Kubernetes 客户端 QPS |
| `--kube-burst` | int | `8000` | Kubernetes 客户端 Burst |
| `--kube-timeout` | duration | `0` | Kubernetes 客户端请求超时 |

!!! note "`--leader-elect` 单实例部署"
    单实例部署时建议设置 `--leader-elect=false` 以避免不必要的选举开销。

**示例：**
```bash
rlark-controller-manager \
  --server-address=https://rlark-server:8443 \
  --db-config=/etc/rlark/db-config.yaml \
  --leader-elect=false \
  --metrics-bind-address=:8080 \
  --health-probe-bind-address=:8081
```

## rlark-agent

数据面 Agent。部署在每个集群（cluster-agent 模式）或每个节点（node-agent 模式）。管理节点注册、Task 执行和跨集群网络。

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--server-address` | string | `https://localhost:8443` | RLark Server 地址 |
| `--server-hostname` | string | `""` | 服务器 TLS 预期主机名 |
| `--client-cert` | string | `""` | 客户端 TLS 证书路径 |
| `--client-key` | string | `""` | 客户端 TLS 私钥路径 |
| `--ca-cert` | string | `""` | CA 证书路径 |
| `--insecure-skip-tls-verify` | bool | `false` | 跳过 TLS 证书验证 |
| `--agent-type` | string | `Kubernetes` | Agent 类型：Kubernetes、Docker、Raw |
| `--mode` | string | `cluster` | Agent 模式：cluster、node、both |
| `--leader-election` | bool | `false` | 启用 Leader Election |
| `--leader-election-key` | string | `default/rlark-agent` | Leader Election Key（namespace/name） |
| `--leader-election-id` | string | `hostname-pid` | Leader Election 标识 |
| `--metrics-bind-address` | string | `:8081` | Metrics 端点绑定地址 |
| `--rlark-server-ssh-address` | string | `""` | RLark Server SSH 地址（user@host:port） |
| `--rlark-server-ssh-host-key` | string | `""` | RLark Server SSH Host Key |
| `--image` | string | `""` | RLark 网络 Sidecar 镜像 |
| `--enable-same-cluster-direct` | bool | `true` | 启用同集群 Pod 直接访问 |
| `--enable-cross-cluster-direct` | bool | `true` | 启用跨集群 Pod 直接访问 |
| `--kubelet-dir` | string | `""` | Kubelet 目录（用于查找 Pod UID） |
| `--image-pull-enabled` | bool | `true` | 启用镜像预拉取 |
| `--containerd-socket` | string | `/run/containerd/containerd.sock` | Containerd Socket 地址 |
| `--containerd-namespace` | string | `k8s.io` | Containerd 命名空间 |
| `--node-name` | string | `$NODE_NAME` | 本地节点名称 |
| `--nodeserver-unix-socket` | string | `/var/run/rlark/nodeserver.sock` | NodeServer Unix Socket 地址 |
| `--kubeconfig` | string | `$KUBECONFIG` | kubeconfig 文件路径 |
| `--master` | string | `""` | Kubernetes API Server 地址 |
| `--in-cluster` | bool | `false` | 使用 in-cluster 配置 |
| `--kube-namespace` | string | `""` | Kubernetes 命名空间 |
| `--kube-qps` | float32 | `5000` | Kubernetes 客户端 QPS |
| `--kube-burst` | int | `8000` | Kubernetes 客户端 Burst |
| `--kube-timeout` | duration | `0` | Kubernetes 客户端请求超时 |

!!! tip "`--mode` 参数说明"
    - `cluster`：仅运行集群级 Agent，管理集群范围内的资源
    - `node`：仅运行节点级 Agent，管理单个节点的 Task
    - `both`：同时运行集群和节点级 Agent

**示例：**
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

网络 Sidecar。与每个 Task Pod 一起运行，通过 TUN 设备和 gVisor netstack 实现跨集群 Pod 到 Pod 网络通信。

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--sidecar-unix-socket` | string | `/var/run/rlark/nodeserver.sock` | NodeServer Unix Socket 路径 |
| `--sidecar-tun-name` | string | `gnet0` | TUN 设备名称 |
| `--sidecar-tun-mtu` | int | `1500` | TUN 设备 MTU |
| `--sidecar-proxy-listen` | string | `:5700` | Proxy TCP 监听地址 |
| `--sidecar-hosts-sync-enabled` | bool | `true` | 启用 hosts 文件定期同步 |
| `--sidecar-hosts-sync-interval` | duration | `30s` | hosts 同步间隔 |
| `--sidecar-hosts-file` | string | `/etc/hosts` | hosts 文件路径 |

**示例：**
```bash
rlark-network-sidecar \
  --sidecar-unix-socket=/var/run/rlark/nodeserver.sock \
  --sidecar-tun-name=gnet0 \
  --sidecar-tun-mtu=1500
```

## rlarkadm

部署工具。安装和卸载 RLark 控制面和数据面组件。

### rlarkadm install

| 参数 | 缩写 | 类型 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--install-conf` | `-f` | string | `""` | 安装配置文件路径（必填） |

**示例：**
```bash
rlarkadm install -f deploy-control-plane.yaml
```

### rlarkadm uninstall

| 参数 | 缩写 | 类型 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--uninstall-conf` | `-f` | string | `""` | 卸载配置文件路径（必填） |
| `--purge` | | bool | `false` | 同时删除 namespace 和数据目录 |
| `--yes` | `-y` | bool | `false` | 跳过确认提示 |

!!! warning "`--purge` 操作不可逆"
    使用 `--purge` 将永久删除 namespace 和所有相关数据。

**示例：**
```bash
rlarkadm uninstall -f deploy-control-plane.yaml --purge -y
```

**全局参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--log-level` | string | `info` | 日志级别：debug、info、warn、error |

## rlark-server-cli (rlarkctl)

Server 命令行工具。用于证书管理和代理访问。

**全局参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--server-address` | string | `https://localhost:8443` | Server 地址 |
| `--server-hostname` | string | `""` | 服务器 TLS 预期主机名 |
| `--client-cert` | string | `""` | 客户端 TLS 证书路径 |
| `--client-key` | string | `""` | 客户端 TLS 私钥路径 |
| `--ca-cert` | string | `""` | CA 证书路径 |
| `--insecure-skip-tls-verify` | bool | `false` | 跳过 TLS 证书验证 |

### rlark-server-cli sign

签发 Agent 证书。

| 参数 | 缩写 | 类型 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--role` | `-r` | string | `agent` | 证书角色：admin、peer、agent |
| `--client-id` | `-c` | string | `example-client-id` | Agent 角色的 Client ID |
| `--output` | `-o` | string | `""` | 证书和私钥输出目录 |

**示例：**
```bash
rlark-server-cli sign \
  --role=agent \
  --client-id=agent-my-cluster-1 \
  --output=/tmp/agent-certs
```

### rlark-server-cli revoke

吊销证书。

| 参数 | 缩写 | 类型 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--cert-type` | `-t` | string | `""` | 证书类型：x509、ssh（必填） |
| `--serial-number` | `-s` | string | `""` | 证书序列号（必填） |
| `--subject-key-id` | `-k` | string | `""` | 证书 Subject Key ID（必填） |
| `--reason` | `-r` | string | `""` | 吊销原因（可选） |

### rlark-server-cli proxy-curl

通过 Server 代理端点发送 HTTP 请求。

**示例：**
```bash
rlark-server-cli proxy-curl https://internal-service:8080/api/status
```

## sshd

SSH 守护进程。提供对运行中 Task Pod 的 SSH 访问。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--port` | string | `22` | SSH 监听端口 |
| `--shell` | string | `""` | Shell 二进制路径（默认 /bin/bash） |

**环境变量：**

| 变量 | 说明 |
|------|------|
| `RLARK_SSH_PUBLIC_KEY` | 用于 authorized_keys 的 SSH 公钥 |
| `RLARK_SSH_AUTHORIZED_KEYS_FILE` | authorized_keys 文件路径 |

!!! note "sshd 部署方式"
    sshd 集成在 rlark-server 中（通过 `--ssh-port` 参数），不需要单独部署。