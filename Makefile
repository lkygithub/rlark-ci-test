CONTROLLER_GEN ?= $(shell go env GOPATH)/bin/controller-gen
CRD_DIR ?= config/crd/bases
SAMPLES_DIR ?= config/samples
API_DOC ?= docs/api/reference.md

.PHONY: generate generate-manifests generate-clients generate-crd generate-api-docs samples clean-samples

generate: generate-crd generate-api-docs samples

generate-manifests: $(CONTROLLER_GEN)
	mkdir -p $(CRD_DIR)
	$(CONTROLLER_GEN) object paths=./pkg/apis/rlark.io/...
	$(CONTROLLER_GEN) crd paths=./pkg/apis/rlark.io/... output:crd:artifacts:config=$(CRD_DIR)

generate-clients:
	./hack/generate-clients.sh --with-watch

generate-crd: generate-manifests generate-clients

generate-api-docs: generate-crd
	go run ./cmd/crd-api-docgen $(CRD_DIR) $(API_DOC)

samples:
	@test -d $(SAMPLES_DIR)

clean-samples:
	rm -rf $(SAMPLES_DIR)

.PHONY: build

build: build-controller-manager

build-controller-manager:
	go build -o bin/controller-manager ./cmd/controller-manager/...

$(CONTROLLER_GEN):
	GOBIN=$(shell go env GOPATH)/bin go install sigs.k8s.io/controller-tools/cmd/controller-gen@v0.16.5
