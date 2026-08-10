.PHONY: lint-go lint-web fmt-go fmt-web generate generate-api-docs proto build tidy
.PHONY: docker-build docker-push docker-build-ui docker-push-ui nerd-build nerd-push

lint-go:
	$(MAKE) -C api lint
	$(MAKE) -C apps/rlark lint
	$(MAKE) -C apps/embodied-runtime lint
	$(MAKE) -C sdks/embodied-runtime-go lint

lint-web:
	$(MAKE) -C apps/rlark-ui lint

fmt-go:
	$(MAKE) -C api fmt
	$(MAKE) -C apps/rlark fmt
	$(MAKE) -C apps/embodied-runtime fmt
	$(MAKE) -C sdks/embodied-runtime-go fmt

fmt-web:
	$(MAKE) -C apps/rlark-ui fmt

generate: generate-crd generate-api-docs

generate-crd:
	$(MAKE) -C api generate-crd

generate-api-docs: generate-crd
	go run ./apps/rlark/cmd/crd-api-docgen api/config/crd/bases docs/api/reference.md

proto:
	$(MAKE) -C proto/embodied-runtime proto

tidy:
	@for dir in $$(grep '^\t\./' go.work | sed 's/^\t//'); do \
		(cd $$dir && go mod tidy); \
	done

build:
	$(MAKE) -C apps/rlark build

docker-build:
	$(MAKE) -C apps/rlark docker-build

docker-push:
	$(MAKE) -C apps/rlark docker-push

docker-build-ui:
	$(MAKE) -C apps/rlark-ui docker-build

docker-push-ui:
	$(MAKE) -C apps/rlark-ui docker-push

nerd-build:
	$(MAKE) -C apps/rlark nerd-build

nerd-push:
	$(MAKE) -C apps/rlark nerd-push