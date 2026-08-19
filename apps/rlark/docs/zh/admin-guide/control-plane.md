# 生产级控制面部署

## 架构

生产控制面由以下组件组成：

| 组件 | 角色 |
|------|------|
| kcp | 多集群控制面（Kubernetes API Server） |
| PostgreSQL | 持久化状态数据库 |
| rlark-server | 证书管理、Agent 注册、SSH |
| rlark-gateway | 控制台和 CLI 的 REST API 网关 |
| rlark-controller-manager | Job/Workflow/Domain 调和 |
| rlark-ui | Web 管理控制台 |

## 部署方式

### Docker Compose（开发/测试）

```bash
docker compose -f apps/rlark/docs/examples/docker-compose.yml up -d
```

### Kubernetes（生产环境）

使用 `rlarkadm` 部署到 Kubernetes 集群：

```bash
rlarkadm install -f deploy-control-plane.yaml
```

示例 `deploy-control-plane.yaml`：

```yaml
apiVersion: v1
kind: DeployConfig
plane: control
kubernetes:
  image: rlark:latest
  kcpImage: ghcr.io/kcp-dev/kcp:latest
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

## 关键配置

| 配置项 | 说明 | 建议 |
|--------|------|------|
| `--db-config` | 数据库连接 | 使用持久化存储，启用备份 |
| `--auto-sign-tls-ca-cert` | 自动生成 CA | 初始设置时启用，生产环境替换为可信 CA |
| `--tls-domains` | TLS 证书域名 | 包含所有访问入口 |
| `--https-port` | Server HTTPS 端口 | 8443（默认） |
| `--ssh-port` | SSH 端口 | 2222（默认） |

## 安全加固

- 替换示例凭据（`CHANGE_ME`）为强密码
- 使用可信 TLS 证书（非自动签发）
- 限制 Gateway 访问范围
- 配置持久化数据库存储和备份
- 在接入生产集群前建立备份和升级流程

## 部署后验证

```bash
# 检查组件健康状态
kubectl get pods -n rlark-system

# 验证 Gateway API
curl -k https://localhost:8443/healthz

# 检查数据库连接
kubectl exec -n rlark-system deploy/rlark-server -- \
  rlarkctl proxy-curl https://localhost:8080/api/health
```