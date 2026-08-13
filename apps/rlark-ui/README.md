# RLark Console Demo

基于 React、TypeScript 和 Vite 的纯 Mock 前端演示。

## 本地运行

```bash
cd web
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 数据模式

前端只使用一种数据模式，避免页面之间混用 Mock 与真实数据：

```bash
# 所有 /api 请求使用统一 Mock 数据（开发环境默认值）
VITE_DATA_MODE=mock npm run dev

# 所有 /api 请求发送给真实后端（生产构建默认值）
VITE_DATA_MODE=backend npm run dev
```

Mock 数据由同一份拓扑生成，集群、节点、任务、工作流、网络域和存储类之间的名称与引用保持一致。真实模式下请求失败会显示错误或空状态，不会自动回退到 Mock 数据。修改模式后需要重启 Vite。

## Data mode

The frontend uses exactly one data mode so pages never mix mock and backend data. Set `VITE_DATA_MODE=mock` to serve every `/api` request from the shared in-browser mock topology, or `VITE_DATA_MODE=backend` to use the real backend exclusively. Development defaults to `mock`; production builds default to `backend`. Restart Vite after changing the mode.

## 当前页面

- Overview：平台健康、资源使用、活跃工作流和事件流
- Workflows：Workflow 列表、详情和 DAG 执行视图
- Jobs：Job 列表与 Task 执行进度
- Tasks：任务类型、角色、节点和状态
- Nodes：节点资源、连接拓扑和健康状态
- API Reference：后端资源 API 演示

数据集中维护在 `src/data.ts`，后续可替换为真实 API Client。
