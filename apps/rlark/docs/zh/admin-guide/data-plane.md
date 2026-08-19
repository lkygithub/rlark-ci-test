# GPU 集群接入

## 概述

接入 GPU 集群使其计算资源可用于 RLark 调度训练任务。流程包括在管理控制台创建集群注册、生成 Agent 凭据，以及在目标集群上运行 Agent。

## 接入方式

RLark 支持两种 GPU 集群接入方式：

### 通过 UI（推荐）

使用管理后台进行引导式接入，详见下方逐步接入流程。

### 通过命令行

使用 `rlarkadm` 和 `rlarkctl` 进行脚本化或自动化接入：

```bash
# 1. 签发 Agent 证书
rlarkctl sign \
  --role=agent \
  --client-id=agent-my-cluster-1 \
  --output=/tmp/agent-certs

# 2. 创建并应用 Agent 部署
rlarkadm install -f deploy-data-plane.yaml
```

示例 `deploy-data-plane.yaml`：

```yaml
apiVersion: v1
kind: DeployConfig
plane: data
controlPlaneAddress: https://<control-plane>:8443
kubernetes:
  image: rlark:latest
cert:
  caCert: /tmp/agent-certs/ca-cert.pem
  agentCert: /tmp/agent-certs/cert.pem
  agentKey: /tmp/agent-certs/key.pem
```

!!! tip "UI vs CLI"
    UI 适用于初始设置和测试，CLI 适用于自动化、CI/CD 流水线和批量集群接入。

## 逐步接入

### 第一步：创建集群注册

1. 登录管理后台 `http://<host>:5173/admin`
2. 进入 **集群管理** → **创建集群**

![创建集群](../../images/ui/admin-create-cluster.jpg)

3. 输入集群名称（如 `my-cluster-1`）
4. 选择集群类型和区域
5. 点击 **创建**

### 第二步：生成安装命令

创建集群注册后，控制台会生成包含凭据的安装命令。

!!! warning "保护凭据"
    生成的命令包含集群范围的凭据，应视为机密信息，不要在不同集群间共享。

### 第三步：运行 Agent

在目标 Kubernetes 集群上运行生成的命令。典型命令如下：

```bash
rlark-agent \
  --mode=both \
  --server-address=https://<control-plane>:8443 \
  --client-cert=/etc/rlark/agent-cert.pem \
  --client-key=/etc/rlark/agent-key.pem \
  --ca-cert=/etc/rlark/ca-cert.pem \
  --image=rlark:latest
```

Agent 需要以下 Kubernetes RBAC 权限：

| 权限 | 用途 |
|------|------|
| `pods`（create, get, list, watch, delete） | Task Pod 生命周期管理 |
| `nodes`（get, list, watch） | 节点发现 |
| `configmaps`（create, get, update） | 配置管理 |
| `secrets`（create, get） | 镜像拉取密钥 |

### 第四步：验证 Agent 连接

1. 返回管理后台
2. 进入 **集群管理** → **集群与节点**

![验证集群节点](../../images/ui/admin-clusters-nodes.jpg)

3. 确认集群状态显示为 **在线**
4. 检查可用的 Worker 节点已列出

### 第五步：添加调度元数据

为节点添加标签和注解以支持调度：

```bash
# 为节点添加调度标签
kubectl label node <node-name> rlark.io/node-category=cloud
kubectl annotate node <node-name> rlark.io/gpu-model=A100

# 或通过管理后台 UI 操作
```

### 第六步：运行冒烟测试

创建简单的测试 Job 验证数据面完全可用：

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

## 故障排查

| 症状 | 排查方向 |
|------|---------|
| Agent 无法连接 | 验证 Server 地址、TLS 证书和网络连通性 |
| 集群显示离线 | 检查 Agent 日志：`kubectl logs -n rlark-system deploy/rlark-agent` |
| 节点未出现 | 验证节点标签和 Agent `--mode` 设置 |
| Task 无法调度 | 检查 nodeSelector 是否匹配可用节点 |

## 注册管理

- 为每个 GPU 集群创建**独立的注册**
- 使用 `rlarkctl sign` 定期轮换证书
- 移除未使用的注册以保持集群列表整洁