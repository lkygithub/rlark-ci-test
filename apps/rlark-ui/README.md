# RLark Console

基于 React、TypeScript 和 Vite 的 Web 控制台。

## 本地运行

```bash
cd apps/rlark-ui
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 数据模式

```bash
# 使用 Mock 数据（开发环境默认）
VITE_DATA_MODE=mock npm run dev

# 连接真实后端
VITE_DATA_MODE=backend npm run dev
```

Mock 数据由同一份拓扑生成，集群、节点、任务、工作流之间的引用保持一致。修改模式后需重启 Vite。

## 页面

| 页面 | 功能 |
|------|------|
| Overview | 平台健康、资源使用、活跃工作流和事件流 |
| Workflows | Workflow 列表、详情和 DAG 执行视图 |
| Jobs | Job 列表与 Task 执行进度 |
| Tasks | 任务类型、角色、节点和状态 |
| Nodes | 节点列表，按集群和节点名称排序，展示位置、GPU/具身设备型号与空闲量 |
| Storage | 存储类管理 |
| API Reference | 后端资源 API 演示 |

## 节点元数据

管理员可以在数据面 Kubernetes 集群中补充业务元数据：

```bash
kubectl annotate node <node> rlark.io/ip-location='{"province":"上海市","city":"上海市"}' --overwrite
kubectl label node <node> rlark.io/node-category=cloud rlark.io/model='NVIDIA H800' --overwrite
kubectl annotate jobs.rlinf.io <job> rlark.io/display-name='策略训练任务' --overwrite
```

> GPU 容量由 NVIDIA Device Plugin 注册，具身设备容量由 embodied-runtime Device Plugin 上报，不应手工标注。

---

# RLark Console

Web console built with React, TypeScript, and Vite.

## Running Locally

```bash
cd apps/rlark-ui
npm install
npm run dev
```

## Data Mode

```bash
# Mock data (development default)
VITE_DATA_MODE=mock npm run dev

# Real backend
VITE_DATA_MODE=backend npm run dev
```

## Pages

| Page | Function |
|------|----------|
| Overview | Platform health, resource usage, active workflows and events |
| Workflows | Workflow list, details and DAG execution view |
| Jobs | Job list and Task execution progress |
| Tasks | Task types, roles, nodes and status |
| Nodes | Node list sorted by cluster and name, showing location, GPU/embodied device models and availability |
| Storage | Storage class management |
| API Reference | Backend resource API demo |

## Node Metadata

Administrators can add business metadata on the data-plane cluster:

```bash
kubectl annotate node <node> rlark.io/ip-location='{"province":"Shanghai","city":"Shanghai"}' --overwrite
kubectl label node <node> rlark.io/node-category=cloud rlark.io/model='NVIDIA H800' --overwrite
kubectl annotate jobs.rlinf.io <job> rlark.io/display-name='Policy Training Job' --overwrite
```

> GPU capacity is reported by NVIDIA Device Plugin. Embodied device capacity is reported by embodied-runtime Device Plugin. Do not label manually.