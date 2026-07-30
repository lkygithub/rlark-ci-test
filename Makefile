CONTROLLER_GEN ?= $(shell go env GOPATH)/bin/controller-gen
CRD_DIR ?= config/crd/bases
SAMPLES_DIR ?= config/samples
API_DOC ?= docs/api/reference.md

IMAGE_REGISTRY ?= harbor.infini-ai.com/share
IMAGE_TAG ?= latest
IMAGE_PLATFORMS ?= linux/amd64

COMPONENTS = server controller-manager gateway agent ui network-sidecar

lint: lint-go

lint-go:
	@echo "Running golangci-lint..."
	@golangci-lint run

fmt-go:
	@echo "Running gofmt..."
	@go fmt ./cmd
	@go fmt ./pkg

fmt-web:
	@echo "Running prettier..."
	@cd web && npm install && npx prettier --write .

.PHONY: generate generate-manifests generate-clients generate-crd generate-api-docs samples clean-samples

generate: generate-crd generate-api-docs samples

generate-manifests: $(CONTROLLER_GEN)
	mkdir -p $(CRD_DIR)
	$(CONTROLLER_GEN) object paths=./api/rlark.io/...
	$(CONTROLLER_GEN) crd paths=./api/rlark.io/... output:crd:artifacts:config=$(CRD_DIR)

generate-clients:
	./hack/generate-clients.sh --with-watch

generate-crd: generate-manifests generate-clients

generate-api-docs: generate-crd
	go run ./cmd/crd-api-docgen $(CRD_DIR) $(API_DOC)

samples:
	@test -d $(SAMPLES_DIR)

clean-samples:
	rm -rf $(SAMPLES_DIR)

GOOS ?= linux
GOARCH ?= amd64

.PHONY: build build-controller-manager build-gateway build-server build-agent build-ui build-rlarkadm build-network-sidecar

build: build-server build-controller-manager build-gateway build-agent build-ui build-rlarkadm build-network-sidecar

build-server:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/server ./cmd/server/...

build-controller-manager:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/controller-manager ./cmd/controller-manager/...

build-gateway:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/gateway ./cmd/gateway/...

build-agent:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/agent ./cmd/agent/...

build-ui:
	cd web && npm install && npm run build

build-network-sidecar:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/network-sidecar ./cmd/network-sidecar/...

build-rlarkadm:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o bin/rlarkadm ./cmd/rlarkadm

.PHONY: docker-build docker-push docker-build-% docker-push-%

docker-build: $(addprefix docker-build-,$(COMPONENTS))

docker-push: $(addprefix docker-push-,$(COMPONENTS))

docker-build-%: build-% build/%/Dockerfile
	docker buildx build --platform $(IMAGE_PLATFORMS) -t $(IMAGE_REGISTRY)/rlark-$*:$(IMAGE_TAG) -f build/$*/Dockerfile . --load

docker-push-%: build-% build/%/Dockerfile
	docker buildx build --platform $(IMAGE_PLATFORMS) -t $(IMAGE_REGISTRY)/rlark-$*:$(IMAGE_TAG) -f build/$*/Dockerfile . --push

nerd-build: $(addprefix nerd-build-,$(COMPONENTS))

nerd-push: $(addprefix nerd-push-,$(COMPONENTS))

nerd-build-%: build-% build/%/Dockerfile
	nerdctl build --platform $(IMAGE_PLATFORMS) -t $(IMAGE_REGISTRY)/rlark-$*:$(IMAGE_TAG) -f build/$*/Dockerfile .

nerd-push-%: build-% build/%/Dockerfile
	nerdctl build --platform $(IMAGE_PLATFORMS) -t $(IMAGE_REGISTRY)/rlark-$*:$(IMAGE_TAG) -f build/$*/Dockerfile . 
	nerdctl push $(IMAGE_REGISTRY)/rlark-$*:$(IMAGE_TAG)

$(CONTROLLER_GEN):
	GOBIN=$(shell go env GOPATH)/bin go install sigs.k8s.io/controller-tools/cmd/controller-gen@v0.16.5
