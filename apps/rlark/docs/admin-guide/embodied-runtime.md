# Embodied Runtime Deployment

## Overview

The Embodied Runtime (`apps/embodied-runtime`) enables robots and cameras to participate in RLark training jobs as schedulable devices. It consists of a Kubernetes Device Plugin, gRPC-based controllers for ROS 1, ROS 2, and cameras, and CLI tools for device interaction.

## Architecture

The Embodied Runtime has three layers:

| Layer | Component | Description |
|-------|-----------|-------------|
| Device Plugin | `device-plugin` | Registers device resources (`rlinf.io/device-*`) with Kubernetes |
| Controllers | `ros-controller`, `ros2-controller`, `camera-controller` | gRPC services that manage device lifecycle |
| Webhook | Mutating Webhook | Automatically injects `devinit` sidecar for macvlan networking |

## Prerequisites

- Kubernetes cluster with compatible edge nodes
- Go 1.26+ (for building from source)
- Docker (for container images)
- Host devices accessible on the target nodes
- `hostPID: true` and `privileged: true` for robot controllers (ROS 1 requires PID namespace access)

## Deployment

### Helm (Recommended)

```bash
helm install embodied-runtime ./charts/embodied-runtime \
  --namespace rlark-system \
  --set config.ros.enabled=true \
  --set config.camera.enabled=true
```

### Device Plugin Configuration

Configure the device plugin with the devices available on your nodes:

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

### Host Device Passthrough

For simple devices like USB cameras, use `host_devices` to pass through device files directly:

```yaml
host_devices:
  - name: rlinf.io/device-webcam
    count: 1
    devices:
      - /dev/video0
```

### Macvlan for Network Robots

For robots with fixed IP addresses on the network, use `host_macvlans`:

```yaml
host_macvlans:
  - name: rlinf.io/device-franka
    count: 1
    parent_interface: eth0
    robot_ip: 192.168.1.100
```

The mutating webhook automatically injects a `devinit` sidecar that creates the macvlan interface in the Worker container.

### ROS 1 Controller

For ROS 1 robots, deploy the controller as a pod alongside the agent:

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

### ROS 2 Controller

Similar to ROS 1, but uses a different socket:

```yaml
args: ["--socket=/var/run/rlark/ros2-ctrl.sock"]
```

### Camera Controller

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

## CLI Tools

### rosctr

Robot controller CLI:

```bash
rosctr list              # List available robots
rosctr status <id>       # Check robot status
rosctr modes <id>        # List available modes
rosctr mode <id> <mode>  # Switch robot mode
rosctr start <id>        # Start robot
rosctr stop <id>         # Stop robot
rosctr reset <id>        # Reset robot
rosctr logs <id>         # Get robot logs
```

### camctr

Camera controller CLI:

```bash
camctr list              # List available cameras
camctr info <id>         # Get camera information
camctr open <id>         # Open camera
camctr close <id>        # Close camera
camctr capture <id>      # Capture a single frame
camctr watch <id>        # Stream video frames
```

## Verification

After deployment, verify the Embodied Runtime is working:

```bash
# 1. Check device plugin is running
kubectl get pods -n rlark-system -l app=device-plugin

# 2. Verify device resources are registered
kubectl describe node <node-name> | grep rlinf.io/device

# 3. Test robot discovery (inside a Worker)
rosctr list

# 4. Test camera discovery (inside a Worker)
camctr list
```

## gRPC API

The controllers expose gRPC services for programmatic access:

| Service | RPCs | Description |
|---------|------|-------------|
| RobotController | StartRobot, StopRobot, GetRobotStatus, SwitchMode, ResetRobot, ListRobots, ListModes, GetRobotLogs | Robot lifecycle management |
| CameraController | ListCameras, OpenCamera, CloseCamera, CaptureFrame, CaptureFrames, WatchFrames | Camera management and frame capture |

See `proto/embodied-runtime/` for the full API definition.

## Safety

When deploying with real robots:

- Deploy controllers only on compatible edge clusters
- Validate discovery and allocation with a non-production device first
- Confirm host runtime dependencies and device access permissions
- Use the [safety checklist](../developer-guide/device-integration.md#safety-requirements-for-real-devices) before operating real hardware

## Reference

| Resource | Path |
|----------|------|
| Embodied Runtime README | `apps/embodied-runtime/README.md` |
| Deployment Examples | `apps/embodied-runtime/docs/examples.md` |
| gRPC API Reference | `apps/embodied-runtime/docs/proto-api.md` |
| Helm Chart | `apps/embodied-runtime/charts/embodied-runtime/` |
| Device Integration Guide | [New Device Integration](../developer-guide/device-integration.md) |