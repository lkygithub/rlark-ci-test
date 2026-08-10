CONTROLLER_GEN ?= $(shell go env GOPATH)/bin/controller-gen
CRD_DIR ?= config/crd/bases
SAMPLES_DIR ?= config/samples

.PHONY: lint fmt vet test generate-manifests generate-clients generate-crd samples clean-samples

lint:
	@echo "Running golangci-lint (api)..."
	@go mod download
	@golangci-lint run

fmt:
	@echo "Running gofmt (api)..."
	@go mod download
	@gofmt -l -w ./

vet:
	go vet ./...

test:
	go test -v -count=1 ./...

generate-manifests: $(CONTROLLER_GEN)
	mkdir -p $(CRD_DIR)
	$(CONTROLLER_GEN) object paths=./rlark.io/...
	$(CONTROLLER_GEN) crd paths=./rlark.io/... output:crd:artifacts:config=$(CRD_DIR)

generate-clients:
	./hack/generate-clients.sh --with-watch

generate-crd: generate-manifests generate-clients

samples:
	@test -d $(SAMPLES_DIR)

clean-samples:
	rm -rf $(SAMPLES_DIR)

$(CONTROLLER_GEN):
	GOBIN=$(shell go env GOPATH)/bin go install sigs.k8s.io/controller-tools/cmd/controller-gen@v0.16.5