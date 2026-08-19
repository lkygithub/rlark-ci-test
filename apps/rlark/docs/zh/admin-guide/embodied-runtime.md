# Embodied Runtime 部署

## 概述

Embodied Runtime（`apps/embodied-runtime`）使机器人和摄像头能够作为可调度设备参与 RLark 训练任务。它由 Kubernetes Device Plugin、基于 gRPC 的 ROS 1/ROS 2/摄像头控制器以及 CLI 工具组成。

## 架构

Embodied Runtime 有三层结构：

| 层次 | 组件 | 说明 |
|------|------|------|
| Device Plugin | `device-plugin` | 向 Kubernetes 注册设备资源（`rlinf.io/device-*`） |
| 控制器 | `ros-controller`, `ros2-controller`, `camera-controller` | 管理设备生命周期的 gRPC 服务 |
| Webhook | Mutating Webhook | 自动注入 `devinit` sidecar，用于 macvlan 网络 |

## 前置条件

- 具有兼容边缘节点的 Kubernetes 集群
- Go 1.26+（从源码构建时需要）
- Docker（用于容器镜像）
- 目标节点上可访问的宿主设备
- 机器人控制器需要 `hostPID: true` 和 `privileged: true`（ROS 1 需要 PID 命名空间访问）

## 部署

### Helm（推荐）

```bash
helm install embodied-runtime ./charts/embodied-runtime \
  --namespace rlark-system \
  --set config.ros.enabled=true \
  --set config.camera.enabled=true
```

### Device Plugin 配置

配置设备插件，声明节点上可用的设备：

```yaml
# device-plugin-config.yaml
host_devices:
  - name: rlinf.io/device-webcam
    count: 2
    devices:
      - /dev/video0
      - /dev/video1

host_macvlans:
  - name: rlinf.io/device-franka
    count: 1
    parent_interface: eth0
    robot_ip: 192.168.1.100

camera:
  enabled: true
  socket: /var/run/rlark/camera-ctrl.sock

ros:
  enabled: true
  socket: /var/run/rlark/ros-ctrl.sock

ros2:
  enabled: false
  socket: /var/run/rlark/ros2-ctrl.sock
```

### 宿主设备透传

对于 USB 摄像头等简单设备，使用 `host_devices` 直接透传设备文件：

```yaml
host_devices:
  - name: rlinf.io/device-webcam
    count: 1
    devices:
      - /dev/video0
```

### Macvlan 网络机器人

对于具有固定 IP 的网络机器人，使用 `host_macvlans`：

```yaml
host_macvlans:
  - name: rlinf.io/device-franka
    count: 1
    parent_interface: eth0
    robot_ip: 192.168.1.100
```

Mutating Webhook 会自动注入 `devinit` sidecar，在 Worker 容器中创建 macvlan 接口。

### ROS 1 控制器

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ros-controller
  namespace: rlark-system
spec:
  hostPID: true
  containers:
  - name: ros-controller
    image: rlark-embodied-runtime:latest
    command: ["/ros-controller"]
    args: ["--socket=/var/run/rlark/ros-ctrl.sock"]
    securityContext:
      privileged: true
    volumeMounts:
    - name: rlark-socket
      mountPath: /var/run/rlark
  volumes:
  - name: rlark-socket
    hostPath:
      path: /var/run/rlark
```

### ROS 2 控制器

与 ROS 1 类似，使用不同的 socket：

```yaml
args: ["--socket=/var/run/rlark/ros2-ctrl.sock"]
```

### 摄像头控制器

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: camera-controller
  namespace: rlark-system
spec:
  containers:
  - name: camera-controller
    image: rlark-embodied-runtime:latest
    command: ["/camera-controller"]
    args: ["--socket=/var/run/rlark/camera-ctrl.sock"]
    volumeMounts:
    - name: rlark-socket
      mountPath: /var/run/rlark
  volumes:
  - name: rlark-socket
    hostPath:
      path: /var/run/rlark
```

## CLI 工具

### rosctr

机器人控制器 CLI：

```bash
rosctr list              # 列出可用机器人
rosctr status <id>       # 检查机器人状态
rosctr modes <id>        # 列出可用模式
rosctr mode <id> <mode>  # 切换机器人模式
rosctr start <id>        # 启动机器人
rosctr stop <id>         # 停止机器人
rosctr reset <id>        # 重置机器人
rosctr logs <id>         # 获取机器人日志
```

### camctr

摄像头控制器 CLI：

```bash
camctr list              # 列出可用摄像头
camctr info <id>         # 获取摄像头信息
camctr open <id>         # 打开摄像头
camctr close <id>        # 关闭摄像头
camctr capture <id>      # 捕获单帧
camctr watch <id>        # 流式传输视频帧
```

## 验证

部署后验证 Embodied Runtime 是否正常工作：

```bash
# 1. 检查 Device Plugin 运行状态
kubectl get pods -n rlark-system -l app=device-plugin

# 2. 验证设备资源已注册
kubectl describe node <node-name> | grep rlinf.io/device

# 3. 测试机器人发现（在 Worker 内）
rosctr list

# 4. 测试摄像头发现（在 Worker 内）
camctr list
```

## gRPC API

控制器暴露 gRPC 服务供程序化访问：

| 服务 | RPC | 说明 |
|------|-----|------|
| RobotController | StartRobot, StopRobot, GetRobotStatus, SwitchMode, ResetRobot, ListRobots, ListModes, GetRobotLogs | 机器人生命周期管理 |
| CameraController | ListCameras, OpenCamera, CloseCamera, CaptureFrame, CaptureFrames, WatchFrames | 摄像头管理和帧捕获 |

完整 API 定义参见 `proto/embodied-runtime/`。

## 安全

部署真实机器人时：

- 仅在兼容的边缘集群部署控制器
- 先用非生产设备验证发现与分配流程
- 确认宿主机运行时依赖和设备访问权限
- 操作真实硬件前遵循 [安全清单](../developer-guide/device-integration.md#真实设备安全要求)

## 参考

| 资源 | 路径 |
|------|------|
| Embodied Runtime README | `apps/embodied-runtime/README.zh-CN.md` |
| 部署示例 | `apps/embodied-runtime/docs/examples.zh-CN.md` |
| gRPC API 参考 | `apps/embodied-runtime/docs/proto-api.zh-CN.md` |
| Helm Chart | `apps/embodied-runtime/charts/embodied-runtime/` |
| 设备集成指南 | [新设备适配](../developer-guide/device-integration.md) |