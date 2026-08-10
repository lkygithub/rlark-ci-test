GOOS ?= linux
GOARCH ?= amd64
IMAGE_REGISTRY ?= docker.io/rlark
IMAGE_TAG ?= latest
IMAGE_PLATFORMS ?= linux/amd64

.PHONY: lint fmt build build-server build-controller-manager build-gateway build-agent build-network-sidecar build-rlarkadm build-ui
.PHONY: docker-build docker-push nerd-build nerd-push

lint:
	@echo "Running golangci-lint (apps/rlark)..."
	@go mod download
	@golangci-lint run

fmt:
	@echo "Running gofmt (apps/rlark)..."
	@go mod download
	@gofmt -l -w ./cmd ./pkg

build: build-server build-controller-manager build-gateway build-agent build-network-sidecar build-rlarkadm build-ui

build-server:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/server ./cmd/server/...

build-controller-manager:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/controller-manager ./cmd/controller-manager/...

build-gateway:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/gateway ./cmd/gateway/...

build-agent:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/agent ./cmd/agent/...

build-network-sidecar:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/network-sidecar ./cmd/network-sidecar/...

build-rlarkadm:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/rlarkadm ./cmd/rlarkadm

build-ui:
	$(MAKE) -C ../rlark-ui build

# Single image containing all rlark components
docker-build:
	docker buildx build --platform $(IMAGE_PLATFORMS) -t $(IMAGE_REGISTRY)/rlark:$(IMAGE_TAG) -f Dockerfile ../.. --load

docker-push:
	docker buildx build --platform $(IMAGE_PLATFORMS) -t $(IMAGE_REGISTRY)/rlark:$(IMAGE_TAG) -f Dockerfile ../.. --push

nerd-build:
	nerdctl build --platform $(IMAGE_PLATFORMS) -t $(IMAGE_REGISTRY)/rlark:$(IMAGE_TAG) -f Dockerfile ../..

nerd-push:
	nerdctl build --platform $(IMAGE_PLATFORMS) -t $(IMAGE_REGISTRY)/rlark:$(IMAGE_TAG) -f Dockerfile ../..
	nerdctl push $(IMAGE_REGISTRY)/rlark:$(IMAGE_TAG)

# UI image (separate, built in apps/rlark-ui)
docker-build-ui:
	$(MAKE) -C ../rlark-ui docker-build

docker-push-ui:
	$(MAKE) -C ../rlark-ui docker-push

nerd-build-ui:
	$(MAKE) -C ../rlark-ui docker-build

nerd-push-ui:
	$(MAKE) -C ../rlark-ui docker-build
	nerdctl push $(IMAGE_REGISTRY)/rlark-ui:$(IMAGE_TAG)