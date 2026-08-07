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

## 当前页面

- Overview：平台健康、资源使用、活跃工作流和事件流
- Workflows：Workflow 列表、详情和 DAG 执行视图
- Jobs：Job 列表与 Task 执行进度
- Tasks：任务类型、角色、节点和状态
- Nodes：节点资源、连接拓扑和健康状态
- API Reference：后端资源 API 演示

数据集中维护在 `src/data.ts`，后续可替换为真实 API Client。
