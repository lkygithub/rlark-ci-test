# embodied-runtime

[English](./README.md) | 简体中文

一个面向边缘节点的 Kubernetes 原生运行时，用于管理机器人（ROS）与摄像头硬件。它通过 [Device Plugin API][device-plugin] 将机器人和摄像头暴露为**可调度的 Kubernetes 资源**，业务 Pod 在申请该资源后，即可通过定义良好的 gRPC 接口与 CLI 访问节点本地硬件。

embodied-runtime 面向机器人学习 / 遥操作集群：每个节点挂载一台或多台机器人（例如 Franka 机械臂）与摄像头。调度器把 Pod 调度到声明了 `rlinf.io/device` 资源的节点上，Pod 再通过 Unix socket 与节点本地控制器通信来驱动硬件。

[device-plugin]: https://kubernetes.io/zh-cn/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/

---

## 核心特性

- **Kubernetes Device Plugin** —— 申报 `rlinf.io/device`（或 `rlinf.io/device-<model>`）资源，在分配时把 socket 目录与 CLI 目录挂载到 Pod。
- **ROS Controller** —— 每个机器人独占一个 `roscore`（端口从 11311 起递增），基于 `roslaunch` 管理节点生命周期，支持控制模式切换（impedance / joint / 自定义）、MACVLAN 组网，以及可选的机器人 Web 服务反向代理。
- **Camera Controller** —— 通过 `ffmpeg` 采集 V4L2 / RTSP / RealSense 摄像头，支持 JPEG / PNG / BMP / TIFF 无损静图与 H.264 / H.265 编码及实时转码，提供基于 gRPC 的视频帧流。
- **宿主设备透传** —— 在 Allocate 时把宿主 `/dev/*` 节点（串口、声卡、裸字符设备等）直接挂载进 Pod，无需控制器，仅需在 `host_devices` 下列出即可。
- **灵活的控制器部署** —— 每个控制器可独立配置为**本地子进程**或 **Kubernetes Pod**。
- **两个 CLI** —— `rosctr` 与 `camctr`，供运维或在 Pod 内调用控制器，支持 `text` / `json` / `yaml` 输出。
- **静态链接的 Go 二进制** —— 全部五个二进制以单一多架构 `embodied-runtime` 镜像交付，部署时由 initContainer 注入到对应运行时镜像：`camera-controller` 运行于 `camera-base` 镜像（Alpine + `ffmpeg`），`ros-controller` 运行于提供 ROS 与机器人控制包（如 libfranka + franka_ros）的 ROS workspace 镜像。

---

## 架构

![系统架构](../docs/images/architecture.svg)

device-plugin 是入口。启动时它依次：

1. 向 kubelet 注册并申报 `rlinf.io/device[-<model>]` 资源。
2. 探测硬件，生成 ros-controller 与 camera-controller 的 YAML 配置。
3. 启动控制器 —— 每个可独立选择本地子进程或 Pod 模式（`manager_mode: local | pod | disabled`）。
4. 收到 `Allocate` 请求时，把 socket 目录（`/var/run/rlinf`）与 CLI 目录（`/opt/rlinf/bin`）注入业务 Pod，并通过 `RLINF_EMBODIED_*` 环境变量告知哪些运行时可用，同时暴露其 socket 路径（`RLINF_EMBODIED_{ROS,CAMERA}_SOCKET_PATH`），使 CLI 与 Python SDK 无需硬编码即可连接。配置 `host_devices` 下列出的宿主 `/dev/*` 节点会作为 `DeviceSpec` 直接透传挂载（不经过控制器）。

业务 Pod 随后用挂载进来的 CLI（或直接走 gRPC）驱动硬件。

---

## 组件

| 二进制              | 包                                   | 职责                                                |
|---------------------|--------------------------------------|-----------------------------------------------------|
| `device-plugin`     | `cmd/device-plugin`                  | kubelet 设备插件，托管两个控制器。                  |
| `ros-controller`    | `cmd/ros-controller`                 | 机器人生命周期：roscore、roslaunch、模式切换、Web 代理。|
| `camera-controller` | `cmd/camera-controller`              | 摄像头生命周期：打开/关闭、采集、流化、转码。        |
| `rosctr`            | `cmd/rosctr`                         | ros-controller 的 gRPC CLI。                         |
| `camctr`            | `cmd/camctr`                         | camera-controller 的 gRPC CLI。                      |

### gRPC 服务

定义在 [`proto/`](../proto)，生成的 Go 代码在 [`gen/`](../gen)：

- `ros.controller.v1.RobotController` —— [`proto/roscontroller/v1/robot.proto`](../proto/roscontroller/v1/robot.proto)
- `camera.controller.v1.CameraController` —— [`proto/cameracontroller/v1/camera.proto`](../proto/cameracontroller/v1/camera.proto)

两个服务均通过 **Unix socket** 提供（`/var/run/rlinf/*.sock`）。

完整 API 参考（RPC、消息、枚举）：[`proto-api.zh-CN.md`](./proto-api.zh-CN.md)。

---

## 构建

需要 Go 1.26+；若要重新生成 proto 代码，还需安装 `protoc`。

```bash
make              # proto + 全部二进制 + go vet
make build        # 仅编译二进制 → bin/
make proto        # 重新生成 gRPC 代码到 gen/
make test         # 单元测试
make vet          # go vet
```

二进制以 `CGO_ENABLED=0` 静态编译。

### Docker 镜像

```bash
# embodied-runtime 镜像 —— 包含全部 5 个二进制（静态，多架构）
make docker REGISTRY=ghcr.io/your-org IMAGE_TAG=v0.1.0

# camera-base 镜像 —— Alpine + ffmpeg 运行时依赖（不含二进制；
# 部署时由 initContainer 注入）
make docker-camera REGISTRY=ghcr.io/your-org IMAGE_TAG=v0.1.0
```

可覆盖变量：`REGISTRY`、`IMAGE_TAG` / `VERSION`、`BUILDX_PLATFORMS`、`GO_BASE_IMAGE`、`RUNTIME_BASE_IMAGE`、`APK_MIRROR`。

---

## 配置

### device-plugin

通过 `--config <path>` 加载；所有字段均可省略（见 [`examples/device-plugin-config.yaml`](../examples/device-plugin-config.yaml)）。

```yaml
# model: franka          # → 资源 rlinf.io/device-franka，
                          #   socket rlinf-device-franka.sock
device_count: 1
skip_register: false

# 直接把宿主 /dev/* 设备节点挂载进 Pod（在 Allocate 时注入）。不启动
# 任何控制器，仅按以下列表做透传。省略本段（或留空）即关闭透传。
host_devices:
  - host_path: /dev/video0
    # container_path: /dev/video0  # 默认与 host_path 相同
    # permissions: rwm             # r|w|m 任意组合；默认 rwm
  - host_path: /dev/ttyUSB0
    permissions: rw

camera:
  manager_mode: local     # disabled | local | pod
  ctrl_config_path: /etc/rlinf/camera-controller.yaml
  ctrl_bin: /usr/local/bin/camera-controller
  ctr_cli: /opt/rlinf/bin/camctr
  auto_detect_v4l2: true  # 自动探测 /dev/video* 摄像头
  cameras: []

ros:
  manager_mode: local     # disabled | local | pod
  ctrl_config_path: /etc/rlinf/ros-controller.yaml
  ctrl_bin: /usr/local/bin/ros-controller
  ctr_cli: /opt/rlinf/bin/rosctr
  macvlans:
    - host_nic: eno1
      name: macvlan0
      ip: 172.16.0.101/24
  types:
    - type: franka
      modes:
        impedance:
          package: serl_franka_controllers
          launch_file: impedance.launch
          passthrough_robot_args: true
        joint:
          package: serl_franka_controllers
          launch_file: joint.launch
          passthrough_robot_args: true
  robots:
    - id: franka-robot-1
      type: franka
      params:
        robot_ip: 172.16.0.2
      web_service: https://172.16.0.2/
  allowed_launch_packages:
    - serl_franka_controllers
```

**Manager 模式**（`camera.manager_mode` / `ros.manager_mode`）：

| 模式       | 行为                                                     |
|------------|----------------------------------------------------------|
| `disabled` | 不启动控制器、不生成配置（默认）。                       |
| `local`    | 控制器作为 device-plugin 的子进程运行。                  |
| `pod`      | 控制器在独立 Pod 中运行，由 device-plugin 创建并托管。   |

在 `pod` 模式下，device-plugin 会自动发现自身 Pod 的属性（owner refs、tolerations、镜像、节点名）并复用填充控制器 Pod 的空字段，使控制器 Pod 随 device-plugin Pod 一起被垃圾回收，并被调度到同一个带污点的节点上。

### ROS controller 组网

每个机器人拥有独立的 `roscore`（端口从 `11311` 起递增），多机器人可在同一容器内共存而不冲突 topic / 节点名。`ROS_MASTER_URI` 与 `ROS_IP` 会被注入每个 `roslaunch` 进程。启动时按配置创建 MACVLAN 接口以接入机器人网络；`roslaunch` 直接在容器内运行（不使用 `nsenter`）。

### Camera controller

摄像头可静态配置，或从 `/sys/class/video4linux` 自动探测。采集通过拉起 `ffmpeg` 子进程完成；驱动按设备原生格式采集，并按需转码为目标输出 —— 帧模式静图编码（`jpeg` / `png` / `bmp` / `tiff`，每条消息一帧完整可解码图像）或码流编码（`h264` / `h265`，Annex B 基础码流分片）。

### 宿主设备透传

除 camera 与 ROS 控制器外，device plugin 还可在 Allocate 时把宿主 `/dev/*` 节点（如 `/dev/video0`、`/dev/ttyUSB0`、`/dev/snd/controlC0`）直接挂载进 Pod。该路径不经过任何控制器 —— 配置中 `host_devices` 下列出的条目会作为 `DeviceSpec` 透传挂载，因此适合无需生命周期管理的设备（裸字符设备、串口、声卡等）。

```yaml
host_devices:
  - host_path: /dev/video0       # 必填
    container_path: /dev/video0  # 可选，默认与 host_path 相同
    permissions: rwm             # 可选，r|w|m 任意组合；默认 rwm
```

列表非空时，插件还会注入 `RLINF_EMBODIED_HOST_DEVICES_ENABLED=1` 环境变量，便于 Pod 检测宿主设备已挂载。

---

## 部署

示例清单见 [`examples/`](../examples)：

- [`device-plugin-config.yaml`](../examples/device-plugin-config.yaml) —— device-plugin 配置 ConfigMap。
- [`ros-controller-pod.yaml`](../examples/ros-controller-pod.yaml) —— ros-controller Pod（hostPID、privileged，使用 ROS workspace 镜像，initContainer 从 embodied-runtime 镜像拷贝二进制）。
- [`camera-controller-pod.yaml`](../examples/camera-controller-pod.yaml) —— 基于 `camera-base` 镜像的 camera-controller Pod。

典型模式：`initContainer` 把 `ros-controller` / `rosctr`（或 `camera-controller` / `camctr`）从 `embodied-runtime` 镜像拷贝到共享的 `emptyDir`；主容器从该目录运行控制器二进制。存活 / 就绪探针通过 CLI（`rosctr list`、`camctr list`）访问 Unix socket 来实现。

需要硬件的 Pod 只要申请资源，即会自动被注入 socket + CLI 挂载：

```yaml
spec:
  containers:
    - name: task
      image: my-task-image
      resources:
        requests:
          rlinf.io/device: 1        # → 自动注入挂载与环境变量
```

---

## CLI 用法

### `rosctr` —— 机器人控制

```bash
rosctr list                                      # 机器人列表 + 状态
rosctr status <robot-id>
rosctr modes <robot-id>                          # 可用控制模式
rosctr start <robot-id> [mode]                   # 预置模式
rosctr start <robot-id> --package pkg --launch-file f.launch   # 自定义模式
rosctr switch <robot-id> <mode>                  # 切换运行中机器人的模式
rosctr stop <robot-id>
rosctr reset <robot-id>                          # 重启 roscore 并重置状态
rosctr logs <robot-id> [--tail N]
rosctr packages                                  # 白名单内的 ROS 包
rosctr pkg info <package>
rosctr pkg launch-files <package>
rosctr pkg launch-args <package> <launch-file>
rosctr env <robot-id>                            # 注入的 ROS 环境变量
```

全局参数：`--socket-path`（默认 `/var/run/rlinf/ros-ctrl.sock`，或读取环境变量 `RLINF_EMBODIED_ROS_SOCKET_PATH`）。输出格式：`-o text|json|yaml`。

### `camctr` —— 摄像头控制

```bash
camctr list                                      # 摄像头列表 + 状态
camctr info <camera-id>
camctr open <camera-id> [--width W --height H --fps F --encoding jpeg|png|bmp|tiff|h264|h265]
camctr close <camera-id>
camctr frame <camera-id>                         # 单帧采集
camctr watch <camera-id>                         # 持续推流
camctr watch <camera-id> --save-dir /tmp/frames  # 把帧/分片存为文件
camctr watch <camera-id> > stream.h264           # 原始码流写 stdout
camctr watch <camera-id> | ffplay -i -           # 管道喂给 ffplay
```

全局参数：`--socket-path`（默认 `/var/run/rlinf/camera-ctrl.sock`，或读取环境变量 `RLINF_EMBODIED_CAMERA_SOCKET_PATH`）。

`watch` 按 open 时的编码推送：`jpeg` / `png` / `bmp` / `tiff` = 每条消息一帧完整、可独立解码的静图；`h264` / `h265` = Annex B 基础码流分片，客户端按顺序拼接即得完整码流。

---

## Python SDK

仓库内 [`sdk/python/`](../sdk/python) 提供与 CLI 对应的 Python 客户端，封装同样的 gRPC stub 并处理 Unix socket 连接，业务 Pod 可直接用 Python 驱动硬件：

```python
from embodied_runtime import RobotClient, CameraClient, ModeConfig

with RobotClient() as robot:                       # /var/run/rlinf/ros-ctrl.sock
    robot.start_robot("franka-0", mode="impedance", args={"robot_ip": "172.16.0.2"})
    robot.start_robot("franka-0", mode_config=ModeConfig(
        package="serl_franka_controllers", launch_file="impedance.launch",
        passthrough_robot_args=True,
    ))
    print([(r.robot_id, r.mode) for r in robot.list_robots().robots])

with CameraClient() as cam:                        # /var/run/rlinf/camera-ctrl.sock
    cam.open_camera("camera-0", encoding="h264")
    for frame in cam.watch_frames("camera-0"):    # 持续推送 VideoFrame 消息
        print(frame.sequence, frame.encoding, len(frame.data))
```

安装：`pip install -e sdk/python`（发布后可用 `pip install embodied-runtime`）。
重新生成 stub：`make proto-python`。详见 [`sdk/python/README.zh-CN.md`](../sdk/python/README.zh-CN.md)。

---

## 目录结构

```
cmd/                       # 每个二进制一个包
  device-plugin/
  ros-controller/
  camera-controller/
  rosctr/                  # CLI（cobra）
  camctr/                  # CLI（cobra）
pkg/
  deviceplugin/            # kubelet 插件、配置、硬件探测、pod/local 管理器
  roscontroller/           # roscore、roslaunch 进程、模式、MACVLAN、Web 代理、gRPC server
  cameracontroller/        # 驱动（ffmpeg/remote/ros）、转码器、gRPC server
  cli/                     # 共享输出格式化（text/json/yaml）
proto/                     # .proto 定义（按 v1 版本化）
gen/                       # 生成的 Go 代码（make proto）
sdk/python/                # Python SDK：RobotClient / CameraClient + 生成 stub（make proto-python）
examples/                  # 示例 ConfigMap + Pod 清单
runtimes/                  # camera-base.dockerfile（ffmpeg 运行时依赖）
Dockerfile                 # 多阶段构建 → 全部二进制
Makefile                   # 构建 / proto / docker / lint / test
```

---

## 开发

```bash
make fmt-go        # gofmt cmd/ 与 pkg/
make fmt-py        # 格式化 Python SDK（ruff）
make lint          # 检查 Go（golangci-lint）+ Python（ruff）
make lint-py       # 仅检查 Python SDK（ruff）
make test          # go test ./...
make proto         # 重新生成 gen/ 与 sdk/python stub（需要 protoc 及插件 / grpcio-tools）
make proto-python  # 仅重新生成 Python SDK stub（需要 grpcio-tools）
```

`gen/` 与 `sdk/python/embodied_runtime/gen/` 下的生成代码已入库，仅当 proto 变更时才需重新生成。
