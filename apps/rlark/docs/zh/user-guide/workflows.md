# 工作流

Workflow 通过 DAG 将可复用的 Job 模板连接起来。用户可以定义阶段依赖、提交一次运行，并分别查看每个生成的 Job。工作流适合重复执行训练、评测和数据处理流水线。

## 通过 UI

业务平台 → 工作流 → 创建工作流。添加 Job 模板与依赖关系，保存并运行；从工作流详情进入各个 Job 查看执行状态。

## API equivalent

创建或更新 Workflow CR，并查询其生成的 Job。资源结构参见 [CRD 参考](../reference/crd.md)。
