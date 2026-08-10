.PHONY: lint fmt vet test

lint:
	@echo "Running golangci-lint (sdks/embodied-runtime-go)..."
	@go mod download
	@golangci-lint run

fmt:
	@echo "Running gofmt (sdks/embodied-runtime-go)..."
	@go mod download
	@gofmt -l -w ./

vet:
	go vet ./...

test:
	go test -v -count=1 ./...
