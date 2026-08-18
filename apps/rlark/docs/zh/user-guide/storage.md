# 存储

RLark 在平台中统一展示集群 StorageClass，并提供对象存储相关操作。创建任务时应选择目标数据面集群实际存在的存储，并按需挂载到 Task 角色。接口细节参见 [Storage API](../storage-api.md)。

## 通过 UI

业务平台 → 存储。按集群查看 StorageClass 或对象存储内容；创建任务时在对应 Worker 角色中选择存储并配置挂载位置。

## API equivalent

使用 StorageClass、存储提供商和对象文件接口，详见 [Storage API](../storage-api.md)。
