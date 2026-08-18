# SSH Key

使用 Worker SSH 命令前，需要在账户中添加 SSH 公钥。平台只应保存公钥，禁止上传私钥。最终连接命令是否可用还取决于管理员配置的 SSH 网关。

## 通过 UI

业务平台 → SSH 公钥 → 添加公钥。填写便于识别的名称并粘贴公钥内容；保存后回到 Worker 列表复制对应 SSH 命令。

## API equivalent

使用 SSH Key 管理接口创建、查询和删除公钥。接口调用不得包含私钥，详见 [API 参考](../api/reference.md)。
