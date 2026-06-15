CONTROLLER_GEN ?= $(shell go env GOPATH)/bin/controller-gen
CRD_DIR ?= config/crd/bases
SAMPLES_DIR ?= config/samples
API_DOC ?= docs/api/reference.md

.PHONY: generate manifests crd api-docs samples clean-samples

generate: crd samples api-docs

manifests: $(CONTROLLER_GEN)
	mkdir -p $(CRD_DIR)
	$(CONTROLLER_GEN) object paths=./api/...
	$(CONTROLLER_GEN) crd paths=./api/... output:crd:artifacts:config=$(CRD_DIR)

crd: manifests

api-docs: crd
	go run ./cmd/crd-api-docgen $(CRD_DIR) $(API_DOC)

samples:
	@test -d $(SAMPLES_DIR)

clean-samples:
	rm -rf $(SAMPLES_DIR)

$(CONTROLLER_GEN):
	GOBIN=$(shell go env GOPATH)/bin go install sigs.k8s.io/controller-tools/cmd/controller-gen@v0.16.5