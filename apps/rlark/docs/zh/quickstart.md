# 快速开始

本文档指导你在本地环境搭建 rlark 并运行第一个训练任务。

## 前置条件

| 工具 | 版本 | 说明 |
|------|------|------|
| Docker | >= 24.0 | 运行 kcp、kind 集群和 Registry |
| kind | >= 0.20 | 运行本地 k8s 数据面集群 |
| kubectl | >= 1.28 | 与集群交互 |
| jq | >= 1.6 | 解析 JSON 响应 |

## 一键部署

```bash
# 使用 Docker Hub 镜像（推荐）
bash apps/rlark/docs/examples/quickstart.sh

# 或本地构建镜像
USE_LOCAL_REGISTRY=true bash apps/rlark/docs/examples/quickstart.sh
```

脚本会自动完成以下步骤，每步有日志输出：

| 步骤 | 说明 |
|------|------|
| 0 | 检查前置依赖（docker, kind, kubectl, jq, python3） |
| 1 | 创建运行时目录 `~/.rlark/certs` |
| 2 | 启动 kcp 和 PostgreSQL（Docker Compose） |
| 3 | 配置 kubeconfig 并安装 CRD 到 kcp |
| 4 | 创建 kind 集群 `rlark-data` |
| 5 | 将 kcp 和 PostgreSQL 接入 kind Docker 网络 |
| 6 | 准备镜像（Docker Hub 或本地构建） |
| 7 | 创建 ConfigMap（kubeconfig + DB 配置） |
| 8 | 部署控制面组件（Server、Controller-Manager、Gateway） |
| 9 | 生成 Agent 证书 |
| 10 | 部署 Agent（含 RBAC） |
| 11 | 验证部署状态 |

部署完成后，脚本输出 4 个 Running Pod 和注册的 Node。

## 快速体验：Web UI

本地调试时，启动 Web UI：

```bash
cd apps/rlark-ui && npm install && npm run dev
```

浏览器访问 `http://localhost:5173`。完整使用说明见 [https://rlark-docs.pages.dev/](https://rlark-docs.pages.dev/)。

## 创建第一个训练任务（curl）

> 进阶用户可以通过 REST API 直接操作。

### 创建 Domain

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

### 创建 Job

> **重要**：`nodeSelector` 中的 `rlark.io/cluster-id` 必须与 Agent 注册的 cluster-id 一致。
> 根据命名约定，`cluster_id=agent-my-cluster` 时，nodeSelector 为 `rlark-agent-my-cluster`。

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
          "nodeSelector": { "rlark.io/cluster-id": "rlark-agent-my-cluster" },
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
                      "imagePullPolicy": "IfNotPresent",
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

### 查看任务状态

```bash
# 查看 Job 状态
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/jobs/hello-world" | jq '.status'

# 查看 Task 状态
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/tasks?namespace=rlark-agent-my-cluster&labelSelector=rlinf.io/job=hello-world" | jq '.items[].status'

# 在 kind 集群中验证 Pod
kubectl --kubeconfig ~/.rlark/kind-kubeconfig get deployment -A | grep hello-world
kubectl --kubeconfig ~/.rlark/kind-kubeconfig get pods -A | grep hello-world
```

## 清理

```bash
# 停止 kcp 和 PostgreSQL
docker compose -f apps/rlark/docs/examples/docker-compose.yml down

# 删除 kind 集群
kind delete cluster --name rlark-data

# 清理运行时文件
rm -rf ~/.rlark
```

## 下一步

- 阅读 [Web UI 使用指南](ui-behavior.md) 通过图形界面管理任务
- 阅读 [核心概念](concepts.md) 了解资源模型和命名约定
- 阅读 [部署指南](deployment.md) 了解生产环境部署和真机设备纳管
- 阅读 [API 示例](api/examples.md) 了解完整 API 用法