.PHONY: lint fmt

lint:
	@echo "Running golangci-lint (sdks/embodied-runtime-go)..."
	@go mod download
	@golangci-lint run

fmt:
	@echo "Running gofmt (sdks/embodied-runtime-go)..."
	@go mod download
	@gofmt -l -w ./
