# RLark 项目运行指南

## 项目概述

RLark 是一个基于 Kubernetes 的分布式强化学习平台，包含以下核心组件：

1. **server** - 主服务器组件
2. **controller-manager** - 控制器管理器
3. **gateway** - API 网关
4. **agent** - 代理组件
5. **network-sidecar** - 网络边车
6. **rlarkadm** - 管理工具
7. **ui** - 前端界面

## 构建状态

✅ **Go 组件已成功构建：**
- `bin/server` - 主服务器
- `bin/controller-manager` - 控制器管理器  
- `bin/gateway` - API 网关
- `bin/agent` - 代理
- `bin/network-sidecar` - 网络边车
- `bin/rlarkadm` - 管理工具

❌ **前端构建失败：**
- Node.js 版本要求 20.19+ 或 22.12+，当前版本为 20.15.0
- 需要升级 Node.js 或使用兼容的版本

## 系统要求

### 必需环境
1. **Kubernetes 集群** - 所有组件都需要 Kubernetes 环境
2. **kubectl** - Kubernetes 命令行工具
3. **kubeconfig** - Kubernetes 配置文件

### 可选环境
1. **Docker** - 用于构建容器镜像
2. **PostgreSQL** - 数据库（如果使用外部数据库）

## 运行方式

### 1. 使用 rlarkadm 部署（推荐）

RLark 提供了 `rlarkadm` 工具来部署控制平面和数据平面：

```bash
# 查看帮助
./bin/rlarkadm --help

# 安装控制平面
./bin/rlarkadm install --deploy-conf docs/examples/deploy-control-plane.yaml

# 安装数据平面
./bin/rlarkadm install --deploy-conf docs/examples/deploy-data-plane.yaml

# 卸载
./bin/rlarkadm uninstall --deploy-conf <config-file>
```

### 2. 手动运行组件

#### 设置 Kubernetes 配置
```bash
# 设置 kubeconfig 环境变量
export KUBECONFIG=~/.kube/config

# 或使用 --kubeconfig 参数
./bin/server --kubeconfig ~/.kube/config
```

#### 运行 Server
```bash
./bin/server \
  --kubeconfig ~/.kube/config \
  --unsafe-http-port 8888 \
  --https-port 8443 \
  --ssh-port 2222
```

#### 运行 Controller Manager
```bash
./bin/controller-manager \
  --kubeconfig ~/.kube/config \
  --metrics-bind-address :8080 \
  --health-probe-bind-address :8081
```

#### 运行 Gateway
```bash
./bin/gateway \
  --kubeconfig ~/.kube/config \
  --addr :8080 \
  --server-address https://localhost:8443
```

#### 运行 Agent
```bash
./bin/agent \
  --kubeconfig ~/.kube/config \
  --mode both \
  --server-address https://localhost:8443
```

### 3. 使用 Docker 运行

构建 Docker 镜像：
```bash
# 构建所有组件
make docker-build

# 构建特定组件
make docker-build-server
make docker-build-controller-manager
make docker-build-gateway
make docker-build-agent
make docker-build-ui
make docker-build-network-sidecar
```

## 配置说明

### Kubernetes 配置
所有组件都需要访问 Kubernetes API，可以通过以下方式配置：
- `--kubeconfig` - 指定 kubeconfig 文件路径
- `--in-cluster` - 使用集群内配置（在 Pod 中运行时）
- `--master` - 直接指定 Kubernetes API 地址

### 数据库配置
- `--db-config` - 数据库配置文件路径（YAML 或 JSON）

### 网络配置
- `--unsafe-http-port` - HTTP 端口（默认 8888）
- `--https-port` - HTTPS 端口（默认 8443）
- `--ssh-port` - SSH 端口（默认 2222）

## 开发环境设置

### 1. 升级 Node.js（用于前端构建）
```bash
# 使用 nvm 升级 Node.js
nvm install 20.19.0
nvm use 20.19.0

# 或使用 Node.js 官方仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 构建前端
```bash
cd web
npm install
npm run build  # 生产构建
npm run dev    # 开发服务器
```

### 3. 本地测试
对于本地开发，可以使用 [kind](https://kind.sigs.k8s.io/) 或 [minikube](https://minikube.sigs.k8s.io/) 创建本地 Kubernetes 集群：

```bash
# 使用 kind 创建集群
kind create cluster --name rlark

# 设置 kubeconfig
export KUBECONFIG="$(kind get kubeconfig-path --name="rlark")"

# 部署 RLark
./bin/rlarkadm install --deploy-conf docs/examples/deploy-control-plane.yaml
```

## 故障排除

### 1. Kubernetes 连接问题
```
Error: build Kubernetes rest config: invalid configuration: no configuration has been provided
```
解决方案：设置 `--kubeconfig` 参数或配置 `KUBECONFIG` 环境变量。

### 2. 前端构建失败
```
Error: Cannot find native binding. npm has a bug related to optional dependencies
```
解决方案：升级 Node.js 到 20.19+ 或 22.12+。

### 3. 证书问题
```
TLS certificate verification failed
```
解决方案：使用 `--insecure-skip-tls-verify` 参数（仅用于测试）或配置正确的 TLS 证书。

## 项目结构

```
rlark/
├── api/                    # API 定义
├── cmd/                    # 命令行入口
│   ├── server/            # 主服务器
│   ├── controller-manager/ # 控制器管理器
│   ├── gateway/           # API 网关
│   ├── agent/             # 代理
│   ├── network-sidecar/   # 网络边车
│   └── rlarkadm/          # 管理工具
├── pkg/                   # 核心库
├── web/                   # 前端界面
├── config/               # 配置和 CRD
├── build/                # Docker 构建文件
└── docs/                 # 文档
```

## 更多信息

- 查看 `docs/api/examples.md` 获取 API 使用示例
- 查看 `docs/examples/` 获取部署配置文件示例
- 使用 `./bin/<component> --help` 查看各组件帮助信息