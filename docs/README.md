# Documentation

RLark is a monorepo containing multiple subprojects. Each subproject maintains its own documentation.

## Project Index

| Project | Documentation | Description |
|---------|---------------|-------------|
| **rlark core** (control plane + data plane) | [README](../apps/rlark/README.md) · [Docs](../apps/rlark/docs/README.md) | kcp-based control plane, multi-runtime data plane agents, cross-cluster Pod networking |
| **embodied-runtime** (edge runtime) | [README](../apps/embodied-runtime/README.md) · [Proto API](../apps/embodied-runtime/docs/proto-api.md) | Robot (ROS) and camera hardware management via Kubernetes Device Plugin |
| **rlark-ui** (web console) | [README](../apps/rlark-ui/README.md) | React + TypeScript management UI, Nginx + Vite |
| **Python SDK** | [README](../sdks/embodied-runtime-python/README.md) | RobotClient / CameraClient for embodied-runtime gRPC services |
| **Go SDK** | [README](../sdks/embodied-runtime-go/README.md) | Go gRPC stubs for embodied-runtime |
| **Proto definitions** | [README](../proto/embodied-runtime/README.md) | gRPC service definitions for embodied-runtime |

## Quick Links

- [RLark Architecture](../apps/rlark/docs/architecture.md)
- [Core Concepts (Domain, Job, Task, Workflow)](../apps/rlark/docs/concepts.md)
- [Quick Start Guide](../apps/rlark/docs/quickstart.md)
- [Deployment Guide](../apps/rlark/docs/deployment.md)
- [API Reference](../apps/rlark/docs/api/reference.md)

> [中文文档](../apps/rlark/docs/cn/README.md)
