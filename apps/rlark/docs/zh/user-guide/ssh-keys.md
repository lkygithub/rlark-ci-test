# SSH 密钥

## 概述

SSH 密钥在 RLark 中有两种用途：
1. Server 认证堡垒机用户
2. 注入 Job Pod 的 `~/.ssh/authorized_keys`

## 添加公钥

- 业务平台 → SSH 密钥 → 添加密钥
- 为 RLark 生成专用密钥对（不要复用其他系统的密钥）
- 粘贴 OpenSSH 公钥
- RLark 解析并规范化密钥
- 重复公钥将被拒绝
- 输入可识别的名称

## 在任务中使用 SSH 密钥

- 创建任务时，在公共配置步骤中选择 SSH 密钥
- 选中的密钥写入 JobSpec 并传递给所有 Task
- 密钥追加到每个容器的 `~/.ssh/authorized_keys`

## 通过 SSH 连接 Worker

RLark Server 作为 SSH 堡垒机，连接运行中的任务 Pod。

### 前置条件
- Pod 处于 Running 状态
- 公钥已在 RLark 中登记
- 核对主机密钥指纹
- 私钥权限正确（`chmod 600`）

### 连接方式
```bash
ssh -p <port> <user>@<host>
```
- 登录后从交互菜单选择目标 Pod
- 直接在 Pod 中打开终端

## 删除和轮换密钥

- 从列表中删除密钥不会撤销现有 Pod 中的公钥
- 轮换密钥时需分别处理 Server 认证和已注入 Pod 的公钥

## 安全注意事项

- SSH 密钥使用共享用户密钥列表，不按控制台登录用户隔离
- 需在入口外完成身份认证和审计
- 切勿上传私钥

## API 等效操作

使用 SSH Key 接口创建、查询和删除公钥。详见 [API 参考](../api/reference.md)。