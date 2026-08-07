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

.PHONY: lint lint-go fmt-go

lint: lint-go

lint-go:
	@echo "Running golangci-lint..."
	@golangci-lint run

fmt-go:
	@echo "Running gofmt..."
	@go fmt ./cmd
	@go fmt ./pkg

# ---------------------------------------------------------------------------
# Go targets
# ---------------------------------------------------------------------------

.PHONY: all
all: build vet

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
	rm -rf bin/

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
	@echo "  lint-go                     Lint Go (golangci-lint)"
	@echo "  fmt-go                      Format Go (go fmt)"
	@echo ""
	@echo "Go targets:"
	@echo "  build                        Build all binaries into bin/"
	@echo "  $(DEVPLUGIN_BIN)             Build device-plugin binary"
	@echo "  $(ROS_CTRL_BIN)              Build ros-controller binary"
	@echo "  $(ROSCTR_BIN)                Build rosctr binary"
	@echo "  $(CAM_CTRL_BIN)              Build camera-controller binary"
	@echo "  $(CAMCTR_BIN)                Build camctr binary"
	@echo "  vet                          Run go vet"
	@echo "  test                         Run tests"
	@echo "  clean                        Clean Go cache and bin/"
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
