# 集群与节点

## 浏览集群

- 集群页面列出所有已纳管的数据面
- 按名称、ID、类型、区域、位置、状态搜索和筛选
- 列表字段：集群名称、类型、节点数、在线/离线、在线率
- 每 10 秒自动刷新

![集群列表](../../images/ui/first-login-cluster-list.png)

## 查看集群详情

- 点击集群打开详情页
- 检查集群状态：节点总数、在线率、离线节点、运行中任务
- 资源构成：云算力、端算力、真机
- 节点资源区域支持筛选和搜索

![集群详情](../../images/ui/first-login-cluster-detail.png)

## 查找并筛选节点

- 按节点类型筛选：使用 `rlark.io/node-category` 标签（cloud/edge/robot/其他）
- 按状态和关键词筛选
- 列表每 10 秒自动刷新

## 查看节点资源

- 点击节点打开详情页
- 检查调度标记：可调度 / 已停止调度
- 节点信息：类型、接入形态、OS、架构、Agent 版本
- 资源用量：CPU、内存、GPU
- 节点上运行中的关联任务

![节点详情](../../images/ui/first-login-node-detail.png)

## API 等效操作

查询 Cluster 与 Node 资源。字段和过滤参数参见 [API 参考](../api/reference.md)。