# 快速开始

本文档指导你在本地环境搭建 rlark 并运行第一个训练任务。

## 前置条件

| 工具 | 版本 | 说明 |
|------|------|------|
| Go | >= 1.22 | 编译 Go 代码 |
| Docker | >= 24.0 | 运行 kcp 和 kind 集群 |
| kind | >= 0.20 | 运行本地 k8s 数据面集群 |
| kubectl | >= 1.28 | 与集群交互 |

## 1. 编译

```bash
git clone https://github.com/RLinf/RLark
cd rlark
make build
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

### 2.1 启动控制面

```bash
# 使用 Docker Compose 启动所有控制面组件
docker compose -f tmp/test/docker-compose.yml up -d

# 等待服务就绪（约 30 秒）
# 检查状态
docker compose -f tmp/test/docker-compose.yml ps
```

组件包括：
- **kcp**：API Server（控制面集群）
- **kcp-data**：kcp 数据存储
- **postgresql**：rlark 运行数据库

### 2.2 创建数据面 Kind 集群

```bash
# 创建 kind 集群（如果尚未创建）
kind create cluster --name rlark-data

# 导出 kubeconfig
kind get kubeconfig --name rlark-data > tmp/test/kind-kubeconfig
```

### 2.3 启动控制面组件

打开三个终端，分别启动 Server、Controller-Manager 和 Gateway：

```bash
# 终端 1：启动 Server
./bin/server \
  --kubeconfig tmp/test/admin.kubeconfig \
  --https-port 8443 \
  --ssh-port 2222 \
  --db-config tmp/test/db-config.yaml

# 终端 2：启动 Controller-Manager
./bin/controller-manager \
  --kubeconfig tmp/test/admin.kubeconfig \
  --server-address https://localhost:8443 \
  --leader-elect=false

# 终端 3：启动 Gateway
./bin/gateway \
  --kubeconfig tmp/test/admin.kubeconfig \
  --port 8080 \
  --db-config tmp/test/db-config.yaml
```

### 2.4 启动数据面 Agent

```bash
./bin/agent \
  --kubeconfig tmp/test/kind-kubeconfig \
  --control-plane https://localhost:8443 \
  --agent-cert tmp/test/certs/cert.pem \
  --agent-key tmp/test/certs/key.pem \
  --ca-cert tmp/test/certs/ca-cert.pem \
  --mode both \
  --rlark-server-ssh-address localhost:2222
```

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
kubectl --kubeconfig tmp/test/kind-kubeconfig get deployment -A

# 查看 Pod
kubectl --kubeconfig tmp/test/kind-kubeconfig get pods -A
```

## 5. 使用 Web UI

```bash
# 启动前端开发服务器
cd web && npm install && npm run dev
```

浏览器访问 `http://localhost:5173`，可以看到：
- Dashboard：系统概览
- Nodes：节点列表和资源使用
- Jobs：创建和管理训练任务
- Workflows：DAG 工作流编排

## 6. 清理

```bash
# 停止所有组件
docker compose -f tmp/test/docker-compose.yml down

# 删除 kind 集群
kind delete cluster --name rlark-data

# 清理 kcp 数据
docker compose -f tmp/test/docker-compose.yml down -v
```

## 7. 下一步

- 阅读 [核心概念](concepts.md) 了解资源模型
- 阅读 [架构设计](architecture.md) 了解实现原理
- 阅读 [API 示例](api/examples.md) 了解完整 API 用法
- 阅读 [部署指南](deployment.md) 了解生产环境部署