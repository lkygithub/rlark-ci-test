# Storage API 文档

基于参考 `/home/ethan/workspace/mizar-edge/pkg/cloud/volume.go` 中的API实现，已将storageclass列举API迁移到RLark项目中。

## 新增API端点

### 1. 获取StorageClass列表
**GET** `/api/v1/storage/storageclass`

列出所有带有 `controller: rlark` 标签的StorageClass资源。

#### 查询参数
- `cluster` (可选): 集群名称（当前版本仅支持单个集群，保留此参数用于未来多集群支持）

#### 响应示例
```json
{
  "data": {
    "test-storageclass": {
      "name": "test-storageclass",
      "clusters": ["default"],
      "description": "Test StorageClass",
      "bucket": "test-bucket"
    }
  },
  "success": true
}
```

### 2. 获取存储提供商列表
**GET** `/api/v1/storage/storageclass/provider`

列出支持的存储提供商列表。

#### 响应示例
```json
{
  "data": [
    {
      "name": "AWS S3",
      "value": "AWS"
    },
    {
      "name": "阿里云 OSS",
      "value": "Alibaba"
    },
    {
      "name": "腾讯云 COS",
      "value": "TencentCOS"
    },
    // ... 更多提供商
  ],
  "success": true
}
```

### 3. 创建StorageClass（待实现）
**POST** `/api/v1/storage/storageclass`

创建新的StorageClass资源（当前返回501 Not Implemented）。

## 实现说明

### 文件结构
1. **`pkg/gateway/storage_handler.go`** - 存储相关的API处理函数
   - `listStorageClass()` - 处理StorageClass列表请求
   - `listProvider()` - 处理存储提供商列表请求
   - `createStorageClass()` - 创建StorageClass（待实现）

2. **`pkg/gateway/router.go`** - 注册新的API路由
   - 添加了 `/api/v1/storage` 路由组
   - 注册了3个新的API端点

### 数据结构
```go
// StorageClassData 定义StorageClass的响应数据结构
type StorageClassData struct {
    Name        string   `json:"name"`
    Clusters    []string `json:"clusters"`
    Description string   `json:"description"`
    Bucket      string   `json:"bucket"`
}

// Provider 定义存储提供商信息
type Provider struct {
    Name  string `json:"name"`
    Value string `json:"value"`
}
```

### 与参考实现的差异
1. **多集群支持**: 当前实现仅支持单个Kubernetes集群，而参考实现支持多集群。未来可以根据需要扩展多集群支持。
2. **标签选择器**: 使用 `controller: rlark` 标签选择器，而不是参考实现中的 `controller: mizar-edge`。
3. **API路径**: API路径为 `/api/v1/storage/*`，与参考实现保持一致。
4. **响应格式**: 使用统一的 `{"data": ..., "success": true}` 格式。

## 使用示例

### 获取StorageClass列表
```bash
curl -X GET "http://localhost:8080/api/v1/storage/storageclass"
```

### 获取存储提供商列表
```bash
curl -X GET "http://localhost:8080/api/v1/storage/storageclass/provider"
```

## 未来扩展

1. **多集群支持**: 可以扩展Gateway结构体以支持多集群客户端
2. **完整实现**: 实现createStorageClass功能
3. **权限控制**: 添加适当的权限验证
4. **错误处理**: 增强错误处理和日志记录
