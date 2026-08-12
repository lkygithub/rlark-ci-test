# embodied-runtime

English | [简体中文](./README.zh-CN.md)

A Kubernetes-native runtime for managing robot (ROS) and camera hardware on edge nodes. It exposes robots and cameras as **schedulable Kubernetes resources** via the [Device Plugin API][device-plugin], so workload pods can request and access node-local hardware through well-defined gRPC interfaces and CLIs.

embodied-runtime is built for robotic learning / teleoperation clusters where multiple nodes each host one or more robots (e.g. Franka arms) and cameras. The scheduler places pods onto nodes advertising `rlinf.io/device`; the pods then talk to the node-local controllers over Unix sockets to drive hardware.

[device-plugin]: https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/

---

## Highlights

- **Kubernetes Device Plugin** — advertises `rlinf.io/device` (or `rlinf.io/device-<model>`) resources and injects socket + CLI mounts into pods at allocation time.
- **ROS 1 Controller** — per-robot `roscore` on a unique port, `roslaunch`-based node lifecycle, control-mode switching (impedance / joint / custom), MACVLAN networking, and an optional reverse proxy for robot web services.
- **ROS 2 Controller** — per-robot `ROS_DOMAIN_ID` for DDS isolation (no master), `ros2 launch`-based lifecycle, `ros2 pkg` / `ros2 launch --show-args` introspection, shared MACVLAN networking and reverse proxy. Runs on Humble.
- **Camera Controller** — V4L2 / RTSP / RealSense capture via `ffmpeg`, with JPEG / PNG / BMP / TIFF lossless-still and H.264 / H.265 encoding and on-the-fly transcoding, plus gRPC frame streaming.
- **Host device passthrough** — directly mounts host `/dev/*` nodes (serial ports, sound cards, raw character devices, …) into pods at Allocate time with no controller, configured from a simple `host_devices` list.
- **Flexible controller deployment** — each controller runs as a **local subprocess** or a **Kubernetes Pod**, configured independently.
- **CLIs** — `rosctr` (shared ROS 1 + ROS 2) and `camctr` for operator / in-pod access to the controllers, with `text`, `json`, and `yaml` output.
- **Statically linked Go binaries** — all six binaries ship in a single multi-arch `embodied-runtime` image and are injected into the right runtime image at deploy time via initContainer: `camera-controller` runs in the `camera-base` image (Alpine + `ffmpeg`), `ros-controller` runs in a ROS 1 workspace image, and `ros2-controller` runs in a ROS 2 Humble workspace image.

---

## Architecture

![System Architecture](docs/images/architecture.svg)

The device plugin is the entry point. On startup it:

1. Registers with kubelet and advertises `rlinf.io/device[-<model>]` resources.
2. Detects hardware and generates the ros-controller / ros2-controller / camera-controller YAML configs.
3. Starts the controllers — each either as a local subprocess or as a Kubernetes Pod (`manager_mode: local | pod | disabled`).
4. On `Allocate`, injects the socket directory (`/var/run/rlinf`) and CLI binary directory (`/opt/rlinf/bin`) into the requesting pod, plus `RLINF_EMBODIED_*` env vars flagging which runtimes are available and exposing their socket paths (`RLINF_EMBODIED_{ROS,ROS2,CAMERA}_SOCKET_PATH`) so CLIs connect without a hard-coded path. Host `/dev/*` nodes declared under `host_devices` are passed through directly as `DeviceSpec` mounts (no controller involved).

User pods then use the mounted CLIs (or gRPC directly) to control hardware.

---

## Components

| Binary              | Package                              | Role                                                        |
|---------------------|--------------------------------------|-------------------------------------------------------------|
| `device-plugin`     | `cmd/device-plugin`                  | Kubelet device plugin; supervises the controllers.          |
| `ros-controller`    | `cmd/ros-controller`                 | ROS 1 robot lifecycle: roscore, roslaunch, modes, web proxy.|
| `ros2-controller`   | `cmd/ros2-controller`                | ROS 2 robot lifecycle: ros2 launch, DOMAIN_ID, modes, proxy.|
| `camera-controller` | `cmd/camera-controller`              | Camera lifecycle: open/close, capture, stream, transcode. |
| `rosctr`            | `cmd/rosctr`                         | CLI for the RobotController gRPC API (ROS 1 **and** ROS 2).|
| `camctr`            | `cmd/camctr`                         | CLI for the camera-controller gRPC API.                     |

### gRPC services

Defined in [`proto/embodied-runtime/`](../../proto/embodied-runtime):

- `ros.controller.v1.RobotController` — [`proto/embodied-runtime/roscontroller/v1/robot.proto`](../../proto/embodied-runtime/roscontroller/v1/robot.proto)
- `camera.controller.v1.CameraController` — [`proto/embodied-runtime/cameracontroller/v1/camera.proto`](../../proto/embodied-runtime/cameracontroller/v1/camera.proto)

Both services are served over **Unix sockets** (`/var/run/rlinf/*.sock`). The `RobotController` service is implemented by two independent controllers that register on separate sockets: `ros-controller` on `ros-ctrl.sock` (ROS 1) and `ros2-controller` on `ros2-ctrl.sock` (ROS 2). Both honour the same RPC contract and proto, so a single `rosctr` CLI and SDK client can target either by pointing at the right socket.

Full API reference (RPCs, messages, enums): [`docs/proto-api.md`](./docs/proto-api.md).

---

## Build

Requires Go 1.26+.

```bash
make build        # just the binaries → bin/
make test         # unit tests
make vet          # go vet
```

Binaries are built with `CGO_ENABLED=0` (statically linked).

### Docker images

```bash
# embodied-runtime image — all 6 binaries (static, multi-arch)
make docker REGISTRY=ghcr.io/your-org IMAGE_TAG=v0.1.0

# camera-base image — Alpine + ffmpeg runtime deps (no binaries; injected
# at deploy time via initContainer)
make docker-camera REGISTRY=ghcr.io/your-org IMAGE_TAG=v0.1.0

# ros-base image — ROS Noetic + control packages (for ROS 1 controllers)
make docker-ros REGISTRY=ghcr.io/your-org IMAGE_TAG=v0.1.0

# ros2-base image — ROS 2 Humble + control packages (for ROS 2 controllers)
make docker-ros2 REGISTRY=ghcr.io/your-org IMAGE_TAG=v0.1.0
```

Overridable variables: `REGISTRY`, `IMAGE_TAG` / `VERSION`, `BUILDX_PLATFORMS`, `GO_BASE_IMAGE`, `RUNTIME_BASE_IMAGE`, `APK_MIRROR`.

---

## Configuration

### device-plugin

Loaded from `--config <path>`; all fields optional (see [`examples/device-plugin-config.yaml`](./examples/device-plugin-config.yaml)).

```yaml
# model: franka          # → resource rlinf.io/device-franka,
                          #   socket rlinf-device-franka.sock
device_count: 1
skip_register: false

# Directly mount host /dev/* nodes into pods at Allocate time. No
# controller is launched — devices are passed through based on the list
# below. Omit the section (or leave empty) to disable passthrough.
host_devices:
  - host_path: /dev/video0
    # container_path: /dev/video0  # defaults to host_path
    # permissions: rwm             # r|w|m; defaults to rwm
  - host_path: /dev/ttyUSB0
    permissions: rw

camera:
  manager_mode: local     # disabled | local | pod
  ctrl_config_path: /etc/rlinf/camera-controller.yaml
  ctrl_bin: /usr/local/bin/camera-controller
  ctr_cli: /opt/rlinf/bin/camctr
  auto_detect_v4l2: true  # auto-detect /dev/video* cameras
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

ros2:
  manager_mode: local     # disabled | local | pod
  ctrl_config_path: /etc/rlinf/ros2-controller.yaml
  ctrl_bin: /usr/local/bin/ros2-controller
  ctr_cli: /opt/rlinf/bin/rosctr    # shared with ROS 1
  macvlans:
    - host_nic: eno1
      name: macvlan0
      ip: 172.16.0.101/24
  types:
    - type: franka
      modes:
        impedance:
          package: moveit_servo
          launch_file: servo.launch.py
          passthrough_robot_args: true
  robots:
    - id: franka-robot-1
      type: franka
      params:
        robot_ip: 172.16.0.2
      domain_id: 5            # explicit ROS_DOMAIN_ID override (auto-assigned if 0)
  allowed_launch_packages:
    - moveit_servo
```

**Manager modes** (`camera.manager_mode` / `ros.manager_mode` / `ros2.manager_mode`):

| Mode       | Behavior                                                                 |
|------------|--------------------------------------------------------------------------|
| `disabled` | No controller launched, no config generated (default).                   |
| `local`    | Controller runs as a subprocess of the device-plugin.                    |
| `pod`      | Controller runs as a dedicated Pod; the device-plugin creates & owns it.|

In `pod` mode the device-plugin auto-discovers its own pod (owner refs, tolerations, image, node) and reuses them to fill in blank controller-pod fields, so controller pods are garbage-collected with the device-plugin pod and scheduled onto the same tainted node.

### ROS controller networking

Each robot gets its own `roscore` on a unique port starting at `11311`, so multiple robots coexist in one container without topic/name conflicts. `ROS_MASTER_URI` and `ROS_IP` are injected into each `roslaunch` process. MACVLAN interfaces are created at startup for robot-network access, and `roslaunch` runs directly in the container (no `nsenter`).

### ROS 2 controller networking

Unlike ROS 1, there is no central master. Each robot gets its own `ROS_DOMAIN_ID` (auto-assigned starting at 0, or explicitly set via `domain_id` in the robot config) for DDS-level isolation, so multiple robots in the same container do not discover each other's topics/services. `ROS_DOMAIN_ID` (and optionally `RMW_IMPLEMENTATION`, `CYCLONEDDS_URI`) is injected into each `ros2 launch` process. MACVLAN interfaces are shared with the ROS 1 controller for robot-network access. The base image defaults to Cyclone DDS (`rmw_cyclonedds_cpp`) for better multi-robot and cross-subnet discovery behavior.

> **Multicast requirement.** ROS 2 DDS uses IP multicast for node discovery by default. The cluster's network layer (CNI plugin, node / underlay switches) **must support multicast routing** for ROS 2 nodes across different pods / nodes to find each other. If the cluster does not support multicast (e.g. many cloud-provider CNIs block it), configure unicast discovery instead — set `CYCLONEDDS_URI` (or the Fast DDS equivalent) to a peer-list XML profile in each robot's mode-level `env`, or deploy a DDS Discovery Server. The MACVLAN L2 interface gives direct access to the robot's physical subnet, where multicast typically works, but inter-pod / inter-node discovery still depends on the cluster network.

### Camera controller

Cameras are configured statically or auto-detected from `/sys/class/video4linux`. Capture is done by spawning `ffmpeg` subprocesses; the driver captures in whatever format the device provides and transcodes to the requested output — frame-mode still-image encodings (`jpeg` / `png` / `bmp` / `tiff`, one complete decodable frame per message) or bitstream encodings (`h264` / `h265`, Annex B elementary-stream chunks).

### Host device passthrough

In addition to the camera and ROS controllers, the device plugin can mount host `/dev/*` nodes (e.g. `/dev/video0`, `/dev/ttyUSB0`, `/dev/snd/controlC0`) directly into pods at Allocate time. This path bypasses any controller — the entries listed under `host_devices` in the config are simply passed through as `DeviceSpec` mounts, so it is suited to devices that need no lifecycle management (raw character devices, serial ports, sound cards, …).

```yaml
host_devices:
  - host_path: /dev/video0       # required
    container_path: /dev/video0  # optional, defaults to host_path
    permissions: rwm             # optional, any of r|w|m; defaults to rwm
```

When the list is non-empty the plugin also sets `RLINF_EMBODIED_HOST_DEVICES_ENABLED=1` so pods can detect that host devices were injected.

---

## Deploy

Example manifests live in [`examples/`](./examples):

- [`device-plugin-config.yaml`](./examples/device-plugin-config.yaml) — plugin config ConfigMap.
- [`ros-controller-pod.yaml`](./examples/ros-controller-pod.yaml) — ros-controller Pod (hostPID, privileged, ROS workspace image + initContainer that copies binaries from the embodied-runtime image).
- [`ros2-controller-pod.yaml`](./examples/ros2-controller-pod.yaml) — ros2-controller Pod (hostPID, privileged, ROS 2 Humble workspace image).
- [`camera-controller-pod.yaml`](./examples/camera-controller-pod.yaml) — camera-controller Pod on the `camera-base` image.

The typical pattern: an `initContainer` copies `ros-controller` / `rosctr` (or `camera-controller` / `camctr`) out of the `embodied-runtime` image into a shared `emptyDir`; the main container runs the controller binary from there. Liveness / readiness probes use the CLIs (`rosctr list`, `camctr list`) against the Unix sockets.

Pods that need hardware request the resource and are automatically wired with the socket + CLI mounts:

```yaml
spec:
  containers:
    - name: task
      image: my-task-image
      resources:
        requests:
          rlinf.io/device: 1        # → mounts + env injected
```

---

## CLI usage

### `rosctr` — robot control (ROS 1 and ROS 2)

The same `rosctr` binary works with both the ROS 1 controller (`ros-ctrl.sock`) and the ROS 2 controller (`ros2-ctrl.sock`). Point it at the appropriate socket via `--socket-path` or the `RLINF_EMBODIED_ROS_SOCKET_PATH` / `RLINF_EMBODIED_ROS2_SOCKET_PATH` env vars. The `env`, `status`, and `list` commands auto-detect the ROS version from the response fields.

```bash
rosctr list                                      # robots + status
rosctr status <robot-id>
rosctr modes <robot-id>                          # available control modes
rosctr start <robot-id> [mode]                   # preset mode
rosctr start <robot-id> --package pkg --launch-file f.launch   # custom mode
rosctr switch <robot-id> <mode>                  # switch running robot's mode
rosctr stop <robot-id>
rosctr reset <robot-id>                          # restart roscore + state
rosctr logs <robot-id> [--tail N]
rosctr packages                                  # whitelisted ROS packages
rosctr pkg info <package>
rosctr pkg launch-files <package>
rosctr pkg launch-args <package> <launch-file>
rosctr env <robot-id>                            # injected ROS env vars
```

Global flag: `--socket-path` (default `/var/run/rlinf/ros-ctrl.sock`, or `RLINF_EMBODIED_ROS_SOCKET_PATH` if set, falling back to `RLINF_EMBODIED_ROS2_SOCKET_PATH`). The same `rosctr` binary targets either the ROS 1 or ROS 2 controller — point it at the appropriate socket. Output format: `-o text|json|yaml`.

### `camctr` — camera control

```bash
camctr list                                      # cameras + state
camctr info <camera-id>
camctr open <camera-id> [--width W --height H --fps F --encoding jpeg|png|bmp|tiff|h264|h265]
camctr close <camera-id>
camctr frame <camera-id>                         # single capture
camctr watch <camera-id>                         # streaming frames
camctr watch <camera-id> --save-dir /tmp/frames  # save chunks to files
camctr watch <camera-id> > stream.h264           # raw bitstream to stdout
camctr watch <camera-id> | ffplay -i -           # pipe to ffplay
```

Global flag: `--socket-path` (default `/var/run/rlinf/camera-ctrl.sock`, or `RLINF_EMBODIED_CAMERA_SOCKET_PATH` if set).

`watch` delivers frames in the encoding the camera was opened with: `jpeg` / `png` / `bmp` / `tiff` = one complete, independently decodable still-image frame per message; `h264` / `h265` = Annex B elementary-stream chunks that the client concatenates in order.

---

## Project structure

```
cmd/                       # one package per binary
  device-plugin/
  ros-controller/
  ros2-controller/
  camera-controller/
  rosctr/                  # CLI (cobra) — shared ROS 1 + ROS 2
  camctr/                  # CLI (cobra)
pkg/
  deviceplugin/            # kubelet plugin, config, hardware detect, pod/local managers
  roscontroller/           # roscore, roslaunch process, modes, MACVLAN, web proxy, gRPC server
  ros2controller/          # ros2 launch, DOMAIN_ID, modes, gRPC server (ROS 2)
  cameracontroller/        # drivers (ffmpeg/remote/ros(todo)), transcoder, gRPC server
  netmac/                  # shared MACVLAN interface management
  httputil/                # shared HTTP/JSON gateway helpers (protojson, gRPC→HTTP)
  cli/                     # shared output formatting (text/json/yaml)
examples/                  # sample ConfigMaps + Pod manifests
runtimes/                  # camera-base, ros-base, ros2-base dockerfiles
Dockerfile                 # multi-stage build → all binaries
Makefile                   # build / proto / docker / lint / test
```

---

## Development

```bash
make fmt-go        # gofmt cmd/ + pkg/
make test          # go test ./...
```
