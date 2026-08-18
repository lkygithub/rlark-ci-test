# 生产级控制面部署

生产控制面由 kcp、Server、Gateway、Controller Manager、数据库和 Web UI 等服务组成。请按照[部署指南](../deployment.md)中的 Kubernetes 安装流程与生产配置部署。纳管生产集群前，必须替换示例凭据、配置可信 TLS 证书、限制 Gateway 访问、为数据库配置持久化存储，并建立备份与升级流程。
