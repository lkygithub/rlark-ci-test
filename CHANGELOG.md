# Changelog

## [Unreleased]

### Added
- Cross-cluster Pod networking via TUN + gVisor + SSH tunnels
- Web Terminal for interactive Pod access
- TensorBoard proxy for training metric visualization
- RClone CSI driver addon for remote storage (S3, GCS, Azure Blob)
- Pod HTTP proxy with Task name resolution
- Embodied runtime device plugin for robot/camera hardware management
- Python SDK and Go SDK for embodied-runtime gRPC services
- Multi-language documentation (EN + CN)

### Changed
- Project restructured to monorepo layout (`apps/rlark/`, `apps/rlark-ui/`, `apps/embodied-runtime/`)
- Control plane migrated to kcp

## [0.1.0-alpha] - 2026-07

### Added
- Initial open-source release
- Control plane: Server, Gateway, Controller-Manager
- Data plane: Cluster Agent, Node Agent
- CRDs: Domain, Node, Job, Task, Workflow, DomainPeer
- Kubernetes runtime support (production-ready)
- Docker and Raw runtime support (experimental)
- Web management UI (React + TypeScript)
- X.509 + SSH certificate system
- Prometheus metrics