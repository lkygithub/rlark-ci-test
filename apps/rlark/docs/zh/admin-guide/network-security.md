# 网络与安全

RLark 同时使用两个控制面通道：

| 通道 | 默认端口 | 方向 | 用途 |
|---|---:|---|---|
| HTTPS / mTLS | `8443` | Agent → Server | 控制面 API、证书身份与资源同步 |
| SSH | `2222` | 数据面 Agent → Server | 跨集群 Pod 网络、SSH 跳转和 WebTerminal 数据转发 |

## 为什么需要 SSH 通道

数据面通常位于内网、NAT 或防火墙之后，控制面不能直接连接 Pod。节点 Agent 主动向 Server 建立出站 SSH 连接后，RLark 可以在不开放数据面入站端口的情况下，将跨集群 Pod 流量和终端流量安全地转发到目标集群。

流量路径为：

```text
源 Pod → network-sidecar → NodeServer → Agent SSH client
       → RLark Server:2222 → 目标数据面 Agent → 目标 Pod
```

SSH 通道不是 Kubernetes API 通道，也不能替代 `8443` 的 mTLS 控制连接。生产网络应允许数据面节点出站访问控制面的 `8443/TCP` 和 `2222/TCP`，但不需要向控制面开放数据面节点或 Pod 的入站端口。

## Server 端配置

Server 默认监听 `2222`，可通过 `--ssh-port` 修改：

```bash
server \
  --https-port=8443 \
  --ssh-port=2222 \
  --ca-cert=/etc/rlark/certs/ca.crt \
  --ca-key=/etc/rlark/certs/ca.key
```

在 Kubernetes 中，需要为 `8443` 和 `2222` 创建 Service，并确保数据面能够解析和访问配置中的控制面域名。若使用 LoadBalancer、NodePort 或四层代理，必须转发原始 TCP，不能把 `2222` 配置为 HTTP 代理。

## Agent 端配置

Agent 的 SSH 地址必须使用 `user@host:port`，其中 host 不带 `http://` 或 `https://`：

```yaml
args:
  - --server-address=https://rlark.example.com:8443
  - --rlark-server-ssh-address=client@rlark.example.com:2222
  - --rlark-server-ssh-host-key=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...
```

- `--server-address`：HTTPS 控制连接地址。
- `--rlark-server-ssh-address`：SSH 隧道地址，登录主体通常为 `client`。
- `--rlark-server-ssh-host-key`：Server SSH 主机公钥，用于阻止中间人攻击。

安装前可在可信网络中获取主机公钥并核对指纹：

```bash
ssh-keyscan -p 2222 rlark.example.com > rlark-server.known_hosts
ssh-keygen -lf rlark-server.known_hosts
awk '{print $2 " " $3}' rlark-server.known_hosts
```

将最后一条命令输出的公钥写入 `--rlark-server-ssh-host-key`。当前 Agent 在未配置或无法解析该值时会退回不校验 Host Key；这只适用于本地开发，生产环境必须显式配置并在 Server 密钥变化后受控更新。

`rlarkadm` 会根据 `control-plane-address` 生成 Agent 参数。配置文件中的控制面地址用于 HTTPS；若自动生成的 SSH 地址包含 URL scheme 或无法从数据面解析，应修改生成的 Agent 清单，使 SSH 参数使用实际可达的 `host:2222`。

## 证书与密钥

- 每个数据面集群使用独立 Agent 证书，不得在集群间复用私钥。
- Agent 证书与私钥以只读 Secret 挂载，并限制命名空间读取权限。
- 用户 SSH 公钥与 Agent 身份是两套用途不同的凭据；禁止把用户私钥上传到平台。
- 轮换 CA、Server Host Key 或 Agent 证书前先在非生产集群验证，并安排 Server 与 Agent 的更新顺序。

## 验证与排障

从数据面节点验证基础连通性：

```bash
nc -vz rlark.example.com 8443
nc -vz rlark.example.com 2222
ssh-keyscan -p 2222 rlark.example.com
```

再检查 Agent 日志中的 TLS、SSH handshake、Host Key 和证书错误，并确认：

1. 控制面域名在数据面可解析；
2. 防火墙和安全组允许出站 `8443/TCP`、`2222/TCP`；
3. SSH 地址未包含 `https://`；
4. Host Key 与 Server 当前公钥一致；
5. Agent 证书未过期，且证书与私钥匹配；
6. `/var/run/rlark` NodeServer Socket 已正确挂载。

跨集群数据流和信任边界参见[系统架构](../architecture.md)，完整 Agent 参数参见[配置项参考](../reference/configuration.md)。
