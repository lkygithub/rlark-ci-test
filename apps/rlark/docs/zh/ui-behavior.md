# Web 控制台交互约定

RLark 控制台会明确区分真实后端数据和演示内容：

- 资源总量、健康状态、通知、集群、节点、任务和存储页面在网关可用时使用后端响应。
- 网关不可用时，页面会明确标记为 **Mock**，总览和节点页面共用同一份降级节点数据，避免统计口径互相矛盾。
- 中国资源地图始终标记为 **演示数据**。在后端提供节点城市元数据之前，地图位置和互联关系仅用于界面演示。

列表页和详情页使用稳定 URL。从详情返回列表时会替换当前详情历史记录；选择其他资源时则会正常增加浏览器历史。点击地图城市或资源类型后，节点列表会携带对应筛选条件。

语言、主题和侧栏状态会保存在浏览器本地。未提交数据时可按 Escape 关闭弹窗；工作流后续步骤只有在到达前置步骤后才能选择。

## 创建训练任务

### 启动 Web 控制台

```bash
cd apps/rlark-ui
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。

### 页面导航

| 页面 | 功能 |
|------|------|
| **Overview** | 平台健康状态、资源使用、活跃工作流和事件流 |
| **Nodes** | 节点列表、物理位置、GPU/具身设备型号与空闲量 |
| **Jobs** | 创建和管理训练任务，查看 Task 执行进度 |
| **Workflows** | DAG 工作流编排和执行视图 |
| **Storage** | 存储类管理 |

### 创建 Job

1. 进入 Jobs 页面，点击 "Create Job"
2. 填写 Job 名称、Domain、Cluster ID
3. 添加 Task：名称、角色、镜像、启动命令、资源限制
4. 提交后系统自动拆分 Job → Task → Deployment → Pod

### 查看节点信息

在 Nodes 页面查看所有注册节点的 GPU 型号/数量、具身设备、物理位置。

### 管理员补充元数据

```bash
kubectl annotate node <node> rlark.io/ip-location='{"province":"上海市","city":"上海市"}' --overwrite
kubectl label node <node> rlark.io/node-category=cloud rlark.io/model='NVIDIA H800' --overwrite
kubectl annotate jobs.rlinf.io <job> rlark.io/display-name='策略训练任务' --overwrite
```

