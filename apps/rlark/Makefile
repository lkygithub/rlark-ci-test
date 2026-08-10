# rlark — Makefile
#
# Quick start:
#   make                          # build everything
#   make docker-build             # build rlark image and load into local docker

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
RUNTIME_BASE_IMAGE ?= ubuntu:22.04

# Go build args.
GOOS    ?= linux
GOARCH  ?= amd64

# Ldflags for version injection.
LDFLAGS := -s -w

# Binary names.
SERVER_BIN            := server
CONTROLLER_MANAGER_BIN := controller-manager
GATEWAY_BIN           := gateway
AGENT_BIN             := agent
NETWORK_SIDECAR_BIN   := network-sidecar
RLARKADM_BIN          := rlarkadm

# ---------------------------------------------------------------------------
# Code style targets
# ---------------------------------------------------------------------------

.PHONY: lint fmt

lint:
	@echo "Running golangci-lint (apps/rlark)..."
	@go mod download
	@golangci-lint run

fmt:
	@echo "Running gofmt (apps/rlark)..."
	@go mod download
	@gofmt -l -w ./cmd ./pkg

# ---------------------------------------------------------------------------
# Go targets
# ---------------------------------------------------------------------------

.PHONY: all
all: build

.PHONY: build
build: $(SERVER_BIN) $(CONTROLLER_MANAGER_BIN) $(GATEWAY_BIN) $(AGENT_BIN) $(NETWORK_SIDECAR_BIN) $(RLARKADM_BIN)

.PHONY: $(SERVER_BIN)
$(SERVER_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@/...

.PHONY: $(CONTROLLER_MANAGER_BIN)
$(CONTROLLER_MANAGER_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@/...

.PHONY: $(GATEWAY_BIN)
$(GATEWAY_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@/...

.PHONY: $(AGENT_BIN)
$(AGENT_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@/...

.PHONY: $(NETWORK_SIDECAR_BIN)
$(NETWORK_SIDECAR_BIN):
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o bin/$@ ./cmd/$@/...

.PHONY: $(RLARKADM_BIN)
$(RLARKADM_BIN):
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

.PHONY: docker-build
docker-build:
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--load \
		--build-arg GO_BASE_IMAGE=$(GO_BASE_IMAGE) \
		--build-arg RUNTIME_BASE_IMAGE=$(RUNTIME_BASE_IMAGE) \
		-t $(REGISTRY)/rlark:$(IMAGE_TAG) \
		-f Dockerfile \
		../..

.PHONY: docker-push
docker-push:
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--push \
		--build-arg GO_BASE_IMAGE=$(GO_BASE_IMAGE) \
		--build-arg RUNTIME_BASE_IMAGE=$(RUNTIME_BASE_IMAGE) \
		-t $(REGISTRY)/rlark:$(IMAGE_TAG) \
		-f Dockerfile \
		../..

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
	@echo "  $(SERVER_BIN)                Build server binary"
	@echo "  $(CONTROLLER_MANAGER_BIN)    Build controller-manager binary"
	@echo "  $(GATEWAY_BIN)               Build gateway binary"
	@echo "  $(AGENT_BIN)                 Build agent binary"
	@echo "  $(NETWORK_SIDECAR_BIN)       Build network-sidecar binary"
	@echo "  $(RLARKADM_BIN)              Build rlarkadm binary"
	@echo "  vet                          Run go vet"
	@echo "  test                         Run tests"
	@echo "  clean                        Clean Go cache and bin/"
	@echo ""
	@echo "Docker targets (buildx):"
	@echo "  docker-build                 Build rlark image (load into local docker)"
	@echo "  docker-push                  Build rlark image and push to registry"
	@echo ""
	@echo "Variables:"
	@echo "  REGISTRY=ghcr.io/org         Container registry (default: rlinf)"
	@echo "  IMAGE_TAG=v0.1.0            Image tag (default: latest; also: VERSION)"
	@echo "  BUILDX_PLATFORMS             Multi-arch targets (default: linux/amd64)"
	@echo "  GO_BASE_IMAGE=golang:1.26   Go builder image (default: golang:1.26-alpine)"
	@echo "  RUNTIME_BASE_IMAGE           Runtime base image (default: ubuntu:22.04)"
