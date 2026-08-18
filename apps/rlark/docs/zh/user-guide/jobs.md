# 任务

## 创建训练任务

### 第一步：选择任务类型和角色
- 可选类型：强化学习、数据采集、评测、自定义任务
- 每种类型预配置默认角色（Actor、Rollout、Environment 等）
- 可添加、删除或自定义角色

### 第二步：Worker 配置
- 为每个 Worker 角色选择集群和节点
- 节点选择器：按节点类型（cloud/edge/robot）、GPU 型号、位置筛选
- 配置镜像：使用 tag 或 digest（推荐 digest 以确保可复现）
- 设置资源申请：CPU、内存、GPU 数量
- 配置初始化脚本（在主命令之前运行的准备命令）
- 添加存储挂载（hostPath 或 PVC）

![Worker 配置](../../images/ui/create-job-worker-configuration.png)

### 第三步：公共配置
- 选择 Header 角色（协调分布式训练的角色）
- 跨集群网络域（用于跨多个集群的任务）
- SSH 公钥（注入到所有 Worker 容器中）
- 运行命令（主训练脚本）
- TensorBoard 配置

### 第四步：YAML 预览并提交
- 检查生成的 YAML
- 提交并监控任务状态

## 查看 Worker 与 Pod

- 从任务列表打开任务详情
- 任务概览：名称、类型、状态、Worker 数量、创建时间、Header 角色
- Worker 列表：实例名称、角色、节点、IP、状态
- 点击 Worker 查看运行时详情
- 检查各角色配置

![任务详情 - Worker 与 Pod](../../images/ui/job-details-worker-and-pod.png)

## 查看与导出日志

- 日志标签汇总所有 Worker 的 main 容器日志
- 每个 Pod 最多显示 1000 行
- 按角色和 Worker 筛选
- 日志内搜索
- 每 5 秒自动刷新
- 时间范围选项：15 分钟、1 小时、6 小时、24 小时
- 导出日志为 CSV（worker、role、message 列）

![任务日志](../../images/ui/first-login-job-logs.png)

## WebTerminal 终端访问

- 在任意 Worker 的主容器中打开终端
- 在容器中运行 `/bin/sh`
- 运行诊断命令：`pwd`、`id`、`ls`、`df`、`cat /proc/mounts`
- 检查挂载路径和输出目录
- 上传/下载文件（文件名限制：`[A-Za-z0-9._-]+`）
- 上传写入容器默认工作目录
- 传输使用 WebSocket 连接

## 管理任务

- 停止运行中的任务（保留 PVC 和日志数据）
- 恢复已停止的任务
- 删除任务（清理 PVC，保留 hostPath 数据）
- 编辑或克隆任务配置

## 提交前检查清单

提交前请确认：
- 存在满足条件的集群和节点资源
- 所需 GPU 或具身设备型号可用
- 容器镜像可从目标集群访问
- 存储路径存在且权限正确
- 跨集群时网络域已配置

## API 等效操作

`POST /api/v1/rlinf.io/v1alpha1/jobs`。完整请求与状态查询参见 [API 示例](../api/examples.md)。