# embodied-runtime — Makefile
#
# Quick start:
#   make                          # build everything
#   make docker                   # build ros-runtime image and push to registry (multi-arch)

# ---------------------------------------------------------------------------
# Variables
# ---------------------------------------------------------------------------

# Registry and version.
REGISTRY        ?= rlinf
VERSION         ?= latest
IMAGE_TAG       ?= $(VERSION)

# Docker buildx.
BUILDX_PLATFORMS ?= linux/amd64

# Go builder image (must support multi-arch for the target platforms).
GO_BASE_IMAGE   ?= golang:1.26-alpine

# Runtime base image (minimal: no extra packages, just the binaries).
# Override for distroless, busybox, or custom base as needed.
RUNTIME_BASE_IMAGE ?= alpine:3.21

# Optional Alpine APK mirror override (e.g. https://mirrors.tuna.tsinghua.edu.cn).
APK_MIRROR ?=
# Optional Ubuntu APT mirror host override (e.g. https://mirrors.tuna.tsinghua.edu.cn).
APT_MIRROR ?=

# embodied-runtime image (all binaries, statically linked).
RUNTIME_OUTPUT_IMAGE  := $(REGISTRY)/embodied-runtime
# camera-runtime base image (ffmpeg + runtime deps only, no binaries).
CAMERA_BASE_OUTPUT_IMAGE := $(REGISTRY)/camera-base
# ros-runtime base image (ROS / control deps only, no binaries).
ROS_BASE_OUTPUT_IMAGE := $(REGISTRY)/ros-base

# Binary names.
DEVPLUGIN_BIN   := device-plugin
ROS_CTRL_BIN    := ros-controller
ROSCTR_BIN      := rosctr
CAM_CTRL_BIN    := camera-controller
CAMCTR_BIN      := camctr

# Ldflags for version injection.
LDFLAGS := -s -w

# ---------------------------------------------------------------------------
# Code style targets
# ---------------------------------------------------------------------------

.PHONY: lint lint-go lint-py fmt-go fmt-py

lint: lint-go lint-py

lint-go:
	@echo "Running golangci-lint..."
	@golangci-lint run

lint-py:
	@echo "Running ruff check (Python)..."
	@cd sdk/python && ruff check embodied_runtime scripts examples

fmt-go:
	@echo "Running gofmt..."
	@go fmt ./cmd
	@go fmt ./pkg

fmt-py:
	@echo "Running ruff format (Python)..."
	@cd sdk/python && ruff format embodied_runtime scripts examples

# ---------------------------------------------------------------------------
# Go targets
# ---------------------------------------------------------------------------

.PHONY: all
all: proto build vet

.PHONY: build
build: $(DEVPLUGIN_BIN) $(ROS_CTRL_BIN) $(ROSCTR_BIN) $(CAM_CTRL_BIN) $(CAMCTR_BIN)

.PHONY: $(DEVPLUGIN_BIN)
$(DEVPLUGIN_BIN):
	CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

# --- ros binaries ---
.PHONY: $(ROS_CTRL_BIN)
$(ROS_CTRL_BIN):
	CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

.PHONY: $(ROSCTR_BIN)
$(ROSCTR_BIN):
	CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

# --- camera binaries ---
.PHONY: $(CAM_CTRL_BIN)
$(CAM_CTRL_BIN):
	CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

.PHONY: $(CAMCTR_BIN)
$(CAMCTR_BIN):
	CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

.PHONY: vet
vet:
	go vet ./...

.PHONY: test
test:
	go test -v -count=1 ./...

.PHONY: clean
clean:
	go clean -cache
	rm -rf $(GEN_DIR) bin/

# ---------------------------------------------------------------------------
# Proto targets
# ---------------------------------------------------------------------------

.PHONY: proto
proto: proto-ros-controller proto-camera-controller proto-python

PROTO_DIR := proto
GEN_DIR   := gen
SDK_PY_GEN_DIR := sdk/python/embodied_runtime/gen
PYTHON    ?= python3

# ros-controller
ROSCTRL_PROTO := $(PROTO_DIR)/roscontroller/v1/robot.proto
ROSCTRL_OUT   := $(GEN_DIR)/roscontroller/v1

.PHONY: proto-ros-controller
proto-ros-controller:
	@mkdir -p $(ROSCTRL_OUT)
	protoc \
		--proto_path=$(PROTO_DIR) \
		--go_out=$(GEN_DIR) \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(GEN_DIR) \
		--go-grpc_opt=paths=source_relative \
		$(ROSCTRL_PROTO)
	@echo "Generated: $(ROSCTRL_OUT)/"

# camera-controller
CAMCTRL_PROTO := $(PROTO_DIR)/cameracontroller/v1/camera.proto
CAMCTRL_OUT   := $(GEN_DIR)/cameracontroller/v1

.PHONY: proto-camera-controller
proto-camera-controller:
	@mkdir -p $(CAMCTRL_OUT)
	protoc \
		--proto_path=$(PROTO_DIR) \
		--go_out=$(GEN_DIR) \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(GEN_DIR) \
		--go-grpc_opt=paths=source_relative \
		$(CAMCTRL_PROTO)
	@echo "Generated: $(CAMCTRL_OUT)/"

# python SDK
.PHONY: proto-python
proto-python:
	@$(PYTHON) sdk/python/scripts/gen_proto.py

.PHONY: proto-python-clean
proto-python-clean:
	rm -rf $(SDK_PY_GEN_DIR)

.PHONY: proto-clean
proto-clean: proto-python-clean
	rm -rf $(GEN_DIR)

# ---------------------------------------------------------------------------
# Docker targets (buildx)
# ---------------------------------------------------------------------------

.PHONY: docker
docker:
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--push \
		--build-arg GO_BASE_IMAGE=$(GO_BASE_IMAGE) \
		--build-arg RUNTIME_BASE_IMAGE=$(RUNTIME_BASE_IMAGE) \
		-t $(RUNTIME_OUTPUT_IMAGE):$(IMAGE_TAG) \
		-f Dockerfile \
		.

# camera-runtime base image — runtime dependencies only (ffmpeg, CA certs,
# tzdata). No Go binaries; they are injected at deploy time via initContainer.
.PHONY: docker-camera
docker-camera:
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--push \
		--build-arg RUNTIME_BASE_IMAGE=$(RUNTIME_BASE_IMAGE) \
		--build-arg APK_MIRROR=$(APK_MIRROR) \
		-t $(CAMERA_BASE_OUTPUT_IMAGE):$(IMAGE_TAG) \
		-f runtimes/camera-base.dockerfile \
		.

# ros-runtime base image — runtime dependencies only (ROS / control /
# kinematics / gazebo stack). No Go binaries; they are injected at deploy
# time via initContainer.
.PHONY: docker-ros
docker-ros:
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--push \
		--build-arg RUNTIME_BASE_IMAGE=$(RUNTIME_BASE_IMAGE) \
		--build-arg APT_MIRROR=$(APT_MIRROR) \
		-t $(ROS_BASE_OUTPUT_IMAGE):$(IMAGE_TAG) \
		-f runtimes/ros-base.dockerfile \
		.

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

.PHONY: help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Lint & format:"
	@echo "  lint                        Lint Go + Python"
	@echo "  lint-go                     Lint Go (golangci-lint)"
	@echo "  lint-py                     Lint Python SDK (ruff check)"
	@echo "  fmt-go                      Format Go (go fmt)"
	@echo "  fmt-py                      Format Python SDK (ruff format)"
	@echo ""
	@echo "Go targets:"
	@echo "  all                          Build proto + Go + vet (default)"
	@echo "  build                        Build all binaries into bin/"
	@echo "  $(DEVPLUGIN_BIN)             Build device-plugin binary"
	@echo "  $(ROS_CTRL_BIN)              Build ros-controller binary"
	@echo "  $(ROSCTR_BIN)                Build rosctr binary"
	@echo "  $(CAM_CTRL_BIN)              Build camera-controller binary"
	@echo "  $(CAMCTR_BIN)                Build camctr binary"
	@echo "  vet                          Run go vet"
	@echo "  test                         Run tests"
	@echo "  clean                        Clean Go cache, generated code, and bin/"
	@echo ""
	@echo "Proto targets:"
	@echo "  proto                        Generate all proto code (Go + Python)"
	@echo "  proto-ros-controller         Generate RobotController proto (Go)"
	@echo "  proto-camera-controller      Generate CameraController proto (Go)"
	@echo "  proto-python                 Generate Python SDK gRPC stubs"
	@echo "  proto-clean                  Remove generated proto code"
	@echo ""
	@echo "Docker targets (buildx):"
	@echo "  docker                       Build embodied-runtime image (all binaries)"
	@echo "  docker-camera                Build camera-runtime base image (deps only, no binaries)"
	@echo "  docker-ros                   Build ros-runtime base image (deps only, no binaries)"
	@echo ""
	@echo "Variables:"
	@echo "  REGISTRY=ghcr.io/org         Container registry (default: rlinf)"
	@echo "  IMAGE_TAG=v0.1.0            Image tag (default: latest; also: VERSION)"
	@echo "  BUILDX_PLATFORMS             Multi-arch targets (default: linux/amd64)"
	@echo "  GO_BASE_IMAGE=golang:1.26   Go builder image (default: golang:1.26-alpine)"
	@echo "  RUNTIME_BASE_IMAGE           Runtime base image (default: alpine:3.21)"
