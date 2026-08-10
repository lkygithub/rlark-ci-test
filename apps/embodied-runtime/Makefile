# embodied-runtime — Makefile
#
# Quick start:
#   make                          # build everything
#   make docker-build             # build embodied-runtime image and load into local docker

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

# Go build args.
GOOS    ?= linux
GOARCH  ?= amd64

# Optional Alpine APK mirror override (e.g. https://mirrors.tuna.tsinghua.edu.cn).
APK_MIRROR ?=
# Optional Ubuntu APT mirror host override (e.g. https://mirrors.tuna.tsinghua.edu.cn).
APT_MIRROR ?=

# Ldflags for version injection.
LDFLAGS := -s -w

# Binary names.
DEVPLUGIN_BIN   := device-plugin
ROS_CTRL_BIN    := ros-controller
ROSCTR_BIN      := rosctr
CAM_CTRL_BIN    := camera-controller
CAMCTR_BIN      := camctr

# Image names.
RUNTIME_OUTPUT_IMAGE       := $(REGISTRY)/embodied-runtime
CAMERA_BASE_OUTPUT_IMAGE   := $(REGISTRY)/camera-base
ROS_BASE_OUTPUT_IMAGE      := $(REGISTRY)/ros-base

# ---------------------------------------------------------------------------
# Code style targets
# ---------------------------------------------------------------------------

.PHONY: lint fmt

lint:
	@echo "Running golangci-lint (apps/embodied-runtime)..."
	@go mod download
	@golangci-lint run

fmt:
	@echo "Running gofmt (apps/embodied-runtime)..."
	@go mod download
	@gofmt -l -w ./

# ---------------------------------------------------------------------------
# Go targets
# ---------------------------------------------------------------------------

.PHONY: all
all: build vet

.PHONY: build
build: $(DEVPLUGIN_BIN) $(ROS_CTRL_BIN) $(ROSCTR_BIN) $(CAM_CTRL_BIN) $(CAMCTR_BIN)

.PHONY: $(DEVPLUGIN_BIN)
$(DEVPLUGIN_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

.PHONY: $(ROS_CTRL_BIN)
$(ROS_CTRL_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

.PHONY: $(ROSCTR_BIN)
$(ROSCTR_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

.PHONY: $(CAM_CTRL_BIN)
$(CAM_CTRL_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

.PHONY: $(CAMCTR_BIN)
$(CAMCTR_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@

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

.PHONY: docker-build docker-push

docker-build:
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--load \
		--build-arg GO_BASE_IMAGE=$(GO_BASE_IMAGE) \
		--build-arg RUNTIME_BASE_IMAGE=$(RUNTIME_BASE_IMAGE) \
		-t $(RUNTIME_OUTPUT_IMAGE):$(IMAGE_TAG) \
		-f Dockerfile \
		../..

docker-push:
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--push \
		--build-arg GO_BASE_IMAGE=$(GO_BASE_IMAGE) \
		--build-arg RUNTIME_BASE_IMAGE=$(RUNTIME_BASE_IMAGE) \
		-t $(RUNTIME_OUTPUT_IMAGE):$(IMAGE_TAG) \
		-f Dockerfile \
		../..

# camera-runtime base image — runtime dependencies only (ffmpeg, CA certs,
# tzdata). No Go binaries; they are injected at deploy time via initContainer.
.PHONY: docker-camera-build docker-camera-push

docker-camera-build:
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--load \
		--build-arg RUNTIME_BASE_IMAGE=$(RUNTIME_BASE_IMAGE) \
		--build-arg APK_MIRROR=$(APK_MIRROR) \
		-t $(CAMERA_BASE_OUTPUT_IMAGE):$(IMAGE_TAG) \
		-f runtimes/camera-base.dockerfile \
		.

docker-camera-push:
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
.PHONY: docker-ros-build docker-ros-push

docker-ros-build:
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--load \
		--build-arg RUNTIME_BASE_IMAGE=$(RUNTIME_BASE_IMAGE) \
		--build-arg APT_MIRROR=$(APT_MIRROR) \
		-t $(ROS_BASE_OUTPUT_IMAGE):$(IMAGE_TAG) \
		-f runtimes/ros-base.dockerfile \
		.

docker-ros-push:
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
	@echo "  lint                         Lint Go (golangci-lint)"
	@echo "  fmt                          Format Go (gofmt)"
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
	@echo "  docker-build                 Build embodied-runtime image (load into local docker)"
	@echo "  docker-push                  Build embodied-runtime image and push to registry"
	@echo "  docker-camera-build          Build camera-runtime base image (load into local docker)"
	@echo "  docker-camera-push           Build camera-runtime base image and push to registry"
	@echo "  docker-ros-build             Build ros-runtime base image (load into local docker)"
	@echo "  docker-ros-push              Build ros-runtime base image and push to registry"
	@echo ""
	@echo "Variables:"
	@echo "  REGISTRY=ghcr.io/org         Container registry (default: rlinf)"
	@echo "  IMAGE_TAG=v0.1.0            Image tag (default: latest; also: VERSION)"
	@echo "  BUILDX_PLATFORMS             Multi-arch targets (default: linux/amd64)"
	@echo "  GO_BASE_IMAGE=golang:1.26   Go builder image (default: golang:1.26-alpine)"
	@echo "  RUNTIME_BASE_IMAGE           Runtime base image (default: alpine:3.21)"
