# 快速开始

本文档指导你在本地环境搭建 rlark 并运行第一个训练任务。

## 前置条件

| 工具 | 版本 | 说明 |
|------|------|------|
| Go | >= 1.26.5 | 编译 Go 代码 |
| Docker | >= 24.0 | 运行 kcp 和 kind 集群 |
| kind | >= 0.20 | 运行本地 k8s 数据面集群 |
| kubectl | >= 1.28 | 与集群交互 |
| jq | 任意 | 解析 JSON API 响应 |

## 1. 编译

```bash
git clone https://github.com/RLinf/RLark
cd RLark
# Linux
make build
# macOS (Intel)
GOOS=darwin GOARCH=amd64 make build
# macOS (Apple Silicon)
GOOS=darwin GOARCH=arm64 make build
```

编译完成后，`bin/` 目录下会生成以下二进制：

```
bin/
├── server                # 控制面 Server
├── gateway               # API Gateway
├── controller-manager    # 控制面控制器
├── agent                 # 数据面 Agent
├── network-sidecar       # Pod 网络 Sidecar
└── rlarkadm              # 部署 CLI
```

## 2. 本地开发环境搭建

rlark 支持通过 Docker Compose 快速搭建本地开发环境，包含 kcp 集群、数据库和必要的运行时组件。

### 2.1 创建运行时目录

```bash
mkdir -p ~/.rlark/certs
```

### 2.2 启动控制面

```bash
# 使用 Docker Compose 启动 kcp 和 PostgreSQL
docker compose -f apps/rlark/docs/examples/docker-compose.yml up -d

# 等待服务就绪（约 30 秒）
# 检查状态
docker compose -f apps/rlark/docs/examples/docker-compose.yml ps

# 从 kcp 容器中提取 admin kubeconfig
docker cp kcp:/.kcp/admin.kubeconfig ~/.rlark/admin.kubeconfig

# 修复 kubeconfig 中的 server 地址（Docker 内部 IP → localhost）
# macOS/BSD:
sed -i '' 's|https://[0-9.]*:6443|https://localhost:6443|g' ~/.rlark/admin.kubeconfig
# Linux:
# sed -i 's|https://[0-9.]*:6443|https://localhost:6443|g' ~/.rlark/admin.kubeconfig
```

组件包括：
- **kcp**：API Server（控制面集群）
- **postgresql**：rlark 运行数据库

### 2.3 创建数据面 Kind 集群

```bash
# 创建 kind 集群（如果尚未创建）
kind create cluster --name rlark-data

# 导出 kubeconfig
kind get kubeconfig --name rlark-data > ~/.rlark/kind-kubeconfig
```

### 2.4 安装 CRD

```bash
# 向 kcp 安装 RLark CRD
# 使用 'create --validate=false' 避免 kcp 对大体积 CRD 的 256KB annotation 限制
for f in api/config/crd/bases/rlinf.io_*.yaml; do
  kubectl --kubeconfig ~/.rlark/admin.kubeconfig create -f "$f" --validate=false
done
```

### 2.5 启动控制面组件

打开三个终端，分别启动 Server、Controller-Manager 和 Gateway：

```bash
# 终端 1：启动 Server
./apps/rlark/bin/server \
  --kubeconfig ~/.rlark/admin.kubeconfig \
  --https-port 8443 \
  --ssh-port 2222 \
  --db-config apps/rlark/docs/examples/db-config.yaml \
  --auto-sign-tls-ca-cert

# 终端 2：启动 Controller-Manager
./apps/rlark/bin/controller-manager \
  --kubeconfig ~/.rlark/admin.kubeconfig \
  --server-address https://localhost:8443 \
  --leader-elect=false \
  --metrics-bind-address :9090

# 终端 3：启动 Gateway
./apps/rlark/bin/gateway \
  --kubeconfig ~/.rlark/admin.kubeconfig \
  --addr :8080 \
  --server-address https://localhost:8443 \
  --db-config apps/rlark/docs/examples/db-config.yaml
```

### 2.6 启动数据面 Agent

首先，生成 Agent 证书并配置 RBAC：

```bash
# 通过 Gateway API 生成 Agent 证书
curl -X POST "http://localhost:8080/api/v1/certificates/agent" \
  -H "Content-Type: application/json" \
  -d '{"agentID": "agent-rlark-data", "cluster_id": "rlark-data"}' \
  | python3 -c "
import json,sys
data = json.load(sys.stdin)
with open('$HOME/.rlark/certs/cert.pem','w') as f: f.write(data['agent_cert'])
with open('$HOME/.rlark/certs/key.pem','w') as f: f.write(data['agent_key'])
with open('$HOME/.rlark/certs/ca-cert.pem','w') as f: f.write(data['ca_cert'])
print('证书已保存到 ~/.rlark/certs/')
"

# 在 kcp 中为 Agent 授予 RBAC 权限
kubectl --kubeconfig ~/.rlark/admin.kubeconfig create clusterrole rlark-agent \
  --verb='*' --resource='*'
kubectl --kubeconfig ~/.rlark/admin.kubeconfig create clusterrolebinding rlark-agent \
  --clusterrole=rlark-agent \
  --user="system:serviceaccount:rlark-rlark-data:rlark-agent"
```

然后启动 Agent：

```bash
./apps/rlark/bin/agent \
  --kubeconfig ~/.rlark/kind-kubeconfig \
  --server-address https://localhost:8443 \
  --client-cert ~/.rlark/certs/cert.pem \
  --client-key ~/.rlark/certs/key.pem \
  --ca-cert ~/.rlark/certs/ca-cert.pem \
  --mode both \
  --rlark-server-ssh-address localhost:2222
```

> **注意**：证书请求中的 `cluster_id` 必须与 Agent kubeconfig 中的集群名一致。生产环境请使用强密码的集群 ID 并限制 RBAC 权限。

## 3. 验证环境

### 3.1 检查 Agent 注册

Agent 启动后，会在控制面自动注册节点：

```bash
# 查看注册的 Node
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/nodes?namespace=default" | jq .
```

### 3.2 检查控制面

```bash
# 查看可用的 CRD
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1" | jq .
```

## 4. 创建第一个训练任务

### 4.1 创建 Domain

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

### 4.2 创建 Job

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

### 4.3 查看任务状态

```bash
# 查看 Job 状态
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/jobs/hello-world" | jq '.status'

# 查看 Task 状态
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/tasks?namespace=default&labelSelector=rlinf.io/job=hello-world" | jq '.items[].status'

# 查看 Pod 日志
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/jobs/hello-world/logs" | jq .
```

### 4.4 在 kind 集群中验证

```bash
# 数据面应该能看到 Deployment
kubectl --kubeconfig ~/.rlark/kind-kubeconfig get deployment -A

# 查看 Pod
kubectl --kubeconfig ~/.rlark/kind-kubeconfig get pods -A
```

## 5. 使用 Web UI

```bash
# 启动前端开发服务器
cd apps/rlark-ui && npm install && npm run dev
```

浏览器访问 `http://localhost:5173`，可以看到：
- Dashboard：系统概览
- Nodes：节点列表和资源使用
- Jobs：创建和管理训练任务
- Workflows：DAG 工作流编排

## 6. 清理

```bash
# 停止所有组件
docker compose -f apps/rlark/docs/examples/docker-compose.yml down

# 删除 kind 集群
kind delete cluster --name rlark-data

# 清理 kcp 数据
docker compose -f apps/rlark/docs/examples/docker-compose.yml down -v

# 删除运行时文件
rm -rf ~/.rlark
```

## 7. 下一步

- 阅读 [核心概念](concepts.md) 了解资源模型
- 阅读 [架构设计](architecture.md) 了解实现原理
- 阅读 [API 示例](api/examples.md) 了解完整 API 用法
- 阅读 [部署指南](deployment.md) 了解生产环境部署