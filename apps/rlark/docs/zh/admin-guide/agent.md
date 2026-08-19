# Agent 安装与升级

## 安装

Agent 部署在每个数据面集群上，负责管理节点注册、Task 执行和跨集群网络。

### 前置条件

- 具有 kubectl 访问权限的 Kubernetes 集群
- 到控制面的网络连接（`--server-address`）
- 有效的 Agent TLS 证书和密钥

### 安装方式

#### 通过 rlarkadm（推荐）

管理控制台生成完整的安装命令：

```bash
rlarkagent install \
  --server-address=https://<control-plane>:8443 \
  --client-cert=/etc/rlark/agent-cert.pem \
  --client-key=/etc/rlark/agent-key.pem \
  --ca-cert=/etc/rlark/ca-cert.pem
```

#### 手动部署

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

### 验证

安装后验证 Agent 正在运行并已连接：

```bash
# 检查 Agent Pod 状态
kubectl get pods -n rlark-system -l app=rlark-agent

# 检查 Agent 日志
kubectl logs -n rlark-system deploy/rlark-agent

# 验证节点注册（通过管理后台或 API）
curl -k https://<control-plane>:8443/api/v1/rlinf.io/v1alpha1/nodes
```

### 验证清单

| 检查项 | 预期结果 |
|--------|---------|
| Agent Pod 运行中 | 所有容器就绪 |
| 心跳 | 日志中有规律的心跳 |
| 集群状态 | 管理后台显示在线 |
| 节点注册 | Worker 节点显示正确的标签 |
| 资源同步 | CPU、内存、GPU 报告正确 |
| Task 创建 | 测试 Job 可部署运行 |
| 日志流 | Worker 日志可通过控制台访问 |
| WebTerminal | 终端访问正常 |

## 升级

### 升级前步骤

1. 查看 [Release Notes](../reference/changelog.md) 了解破坏性变更
2. 备份当前 Agent 清单和证书
3. 先在非关键集群上测试升级

### 升级流程

```bash
# 更新 Agent 镜像
kubectl set image deploy/rlark-agent \
  agent=<new-image> \
  -n rlark-system

# 或通过 rlarkadm 升级
rlarkagent upgrade --version=<new-version>
```

### 升级后验证

执行与初始安装相同的验证清单。特别关注：

- 心跳连续性（升级过程中无中断）
- 现有 Task 继续运行
- 跨集群网络连接不变

## 配置参考

| 参数 | 说明 | 常用值 |
|------|------|--------|
| `--mode` | Agent 模式 | `cluster`（集群级）、`node`（节点级）、`both` |
| `--agent-type` | 运行时类型 | `Kubernetes`、`Docker`、`Raw` |
| `--image` | Sidecar 镜像 | `rlark:latest` |
| `--leader-election` | 高可用模式 | 多副本部署时设为 `true` |
| `--enable-cross-cluster-direct` | 跨集群网络 | `true`（默认） |
| `--containerd-socket` | Containerd Socket | `/run/containerd/containerd.sock` |

完整参数列表参见 [配置项参考](../reference/configuration.md#rlark-agent)。