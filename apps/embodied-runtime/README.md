# embodied-runtime

English | [简体中文](./README.zh-CN.md)

A Kubernetes-native runtime for managing robot (ROS) and camera hardware on edge nodes. It exposes robots and cameras as **schedulable Kubernetes resources** via the [Device Plugin API][device-plugin], so workload pods can request and access node-local hardware through well-defined gRPC interfaces and CLIs.

embodied-runtime is built for robotic learning / teleoperation clusters where multiple nodes each host one or more robots (e.g. Franka arms) and cameras. The scheduler places pods onto nodes advertising `rlinf.io/device`; the pods then talk to the node-local controllers over Unix sockets to drive hardware.

[device-plugin]: https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/

---

## Highlights

- **Kubernetes Device Plugin** — advertises `rlinf.io/device` (or `rlinf.io/device-<model>`) resources and injects socket + CLI mounts into pods at allocation time.
- **ROS Controller** — per-robot `roscore` on a unique port, `roslaunch`-based node lifecycle, control-mode switching (impedance / joint / custom), MACVLAN networking, and an optional reverse proxy for robot web services.
- **Camera Controller** — V4L2 / RTSP / RealSense capture via `ffmpeg`, with JPEG / PNG / BMP / TIFF lossless-still and H.264 / H.265 encoding and on-the-fly transcoding, plus gRPC frame streaming.
- **Host device passthrough** — directly mounts host `/dev/*` nodes (serial ports, sound cards, raw character devices, …) into pods at Allocate time with no controller, configured from a simple `host_devices` list.
- **Flexible controller deployment** — each controller runs as a **local subprocess** or a **Kubernetes Pod**, configured independently.
- **Two CLIs** — `rosctr` and `camctr` for operator / in-pod access to the controllers, with `text`, `json`, and `yaml` output.
- **Statically linked Go binaries** — all five binaries ship in a single multi-arch `embodied-runtime` image and are injected into the right runtime image at deploy time via initContainer: `camera-controller` runs in the `camera-base` image (Alpine + `ffmpeg`), while `ros-controller` runs in a ROS workspace image providing ROS and the robot's control packages (e.g. libfranka + franka_ros).

---

## Architecture

![System Architecture](docs/images/architecture.svg)

The device plugin is the entry point. On startup it:

1. Registers with kubelet and advertises `rlinf.io/device[-<model>]` resources.
2. Detects hardware and generates the ros-controller / camera-controller YAML configs.
3. Starts the controllers — each either as a local subprocess or as a Kubernetes Pod (`manager_mode: local | pod | disabled`).
4. On `Allocate`, injects the socket directory (`/var/run/rlinf`) and CLI binary directory (`/opt/rlinf/bin`) into the requesting pod, plus `RLINF_EMBODIED_*` env vars flagging which runtimes are available and exposing their socket paths (`RLINF_EMBODIED_{ROS,CAMERA}_SOCKET_PATH`) so CLIs connect without a hard-coded path. Host `/dev/*` nodes declared under `host_devices` are passed through directly as `DeviceSpec` mounts (no controller involved).

User pods then use the mounted CLIs (or gRPC directly) to control hardware.

---

## Components

| Binary              | Package                              | Role                                                        |
|---------------------|--------------------------------------|-------------------------------------------------------------|
| `device-plugin`     | `cmd/device-plugin`                  | Kubelet device plugin; supervises the controllers.          |
| `ros-controller`    | `cmd/ros-controller`                 | Robot lifecycle: roscore, roslaunch, modes, web proxy.      |
| `camera-controller` | `cmd/camera-controller`              | Camera lifecycle: open/close, capture, stream, transcode.   |
| `rosctr`            | `cmd/rosctr`                         | CLI for the ros-controller gRPC API.                        |
| `camctr`            | `cmd/camctr`                         | CLI for the camera-controller gRPC API.                     |

### gRPC services

Defined in [`proto/embodied-runtime/`](../../proto/embodied-runtime):

- `ros.controller.v1.RobotController` — [`proto/embodied-runtime/roscontroller/v1/robot.proto`](../../proto/embodied-runtime/roscontroller/v1/robot.proto)
- `camera.controller.v1.CameraController` — [`proto/embodied-runtime/cameracontroller/v1/camera.proto`](../../proto/embodied-runtime/cameracontroller/v1/camera.proto)

Both services are served over **Unix sockets** (`/var/run/rlinf/*.sock`).

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
# embodied-runtime image — all 5 binaries (static, multi-arch)
make docker REGISTRY=ghcr.io/your-org IMAGE_TAG=v0.1.0

# camera-base image — Alpine + ffmpeg runtime deps (no binaries; injected
# at deploy time via initContainer)
make docker-camera REGISTRY=ghcr.io/your-org IMAGE_TAG=v0.1.0
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
```

**Manager modes** (`camera.manager_mode` / `ros.manager_mode`):

| Mode       | Behavior                                                                 |
|------------|--------------------------------------------------------------------------|
| `disabled` | No controller launched, no config generated (default).                   |
| `local`    | Controller runs as a subprocess of the device-plugin.                    |
| `pod`      | Controller runs as a dedicated Pod; the device-plugin creates & owns it.|

In `pod` mode the device-plugin auto-discovers its own pod (owner refs, tolerations, image, node) and reuses them to fill in blank controller-pod fields, so controller pods are garbage-collected with the device-plugin pod and scheduled onto the same tainted node.

### ROS controller networking

Each robot gets its own `roscore` on a unique port starting at `11311`, so multiple robots coexist in one container without topic/name conflicts. `ROS_MASTER_URI` and `ROS_IP` are injected into each `roslaunch` process. MACVLAN interfaces are created at startup for robot-network access, and `roslaunch` runs directly in the container (no `nsenter`).

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

### `rosctr` — robot control

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

Global flag: `--socket-path` (default `/var/run/rlinf/ros-ctrl.sock`, or `RLINF_EMBODIED_ROS_SOCKET_PATH` if set). Output format: `-o text|json|yaml`.

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
  camera-controller/
  rosctr/                  # CLI (cobra)
  camctr/                  # CLI (cobra)
pkg/
  deviceplugin/            # kubelet plugin, config, hardware detect, pod/local managers
  roscontroller/           # roscore, roslaunch process, modes, MACVLAN, web proxy, gRPC server
  cameracontroller/        # drivers (ffmpeg/remote/ros(todo)), transcoder, gRPC server
  cli/                     # shared output formatting (text/json/yaml)
examples/                  # sample ConfigMaps + Pod manifests
runtimes/                  # camera-base.dockerfile (ffmpeg runtime deps)
Dockerfile                 # multi-stage build → all binaries
Makefile                   # build / proto / docker / lint / test
```

---

## Development

```bash
make fmt-go        # gofmt cmd/ + pkg/
make test          # go test ./...
```
