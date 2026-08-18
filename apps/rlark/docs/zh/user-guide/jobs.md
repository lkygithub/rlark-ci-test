# 任务

Job 是面向用户的工作负载。创建任务时选择模板或配置 Task 角色、镜像、命令、副本数、资源申请、存储与调度要求；提交后可在任务详情中跟踪状态并查看所有 Worker。

提交前应确认平台中存在满足条件的集群和节点资源。Job、Task 与 Worker 的关系参见[核心概念](../concepts.md)。

## 通过 UI

业务平台 → 任务 → 创建任务。填写名称，配置 Worker 角色、镜像、命令、副本与资源要求，然后提交。在任务详情页确认状态进入运行中并查看 Worker。

## API equivalent

`POST /api/v1/rlinf.io/v1alpha1/jobs`。完整请求与状态查询参见 [API 示例](../api/examples.md)。

## 查看 Worker、日志与终端

Worker 是 Task 副本对应的运行实例。任务详情的 Worker 列表展示角色、IP、所在节点、状态，以及 GPU 或具身设备申请。

**通过 UI：** 任务详情 → Worker 列表。展开 Worker 查看运行信息；使用操作列查看日志、复制 SSH 命令，或在新标签页打开 WebTerminal。WebTerminal 需要用户已登录、Worker 正在运行且 RLark SSH 隧道可达。

**通过 API：** 通过 Job、Task 状态和日志接口查询 Worker 信息，详见 [API 参考](../api/reference.md)。终端使用经过鉴权的 WebSocket 连接，不建议普通用户直接构造。
