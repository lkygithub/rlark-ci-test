# rlark-ui — Makefile
#
# Quick start:
#   make                          # build everything
#   make docker-build             # build rlark-ui image and load into local docker

# ---------------------------------------------------------------------------
# Variables
# ---------------------------------------------------------------------------

# Registry and version.
REGISTRY        ?= rlinf
VERSION         ?= latest
IMAGE_TAG       ?= $(VERSION)

# Docker buildx.
BUILDX_PLATFORMS ?= linux/amd64

# Nginx base image.
BASE_IMAGE ?= nginx:1.29.1

# ---------------------------------------------------------------------------
# Build targets
# ---------------------------------------------------------------------------

.PHONY: install build lint fmt

install:
	npm install

build: install
	npm run build

lint: install
	npx eslint src/

fmt:
	npx prettier@3.9.6 --write 'src/' 'index.html' 'package.json' 'vite.config.ts' 'tsconfig*.json'

# ---------------------------------------------------------------------------
# Docker targets (buildx)
# ---------------------------------------------------------------------------

.PHONY: docker-build docker-push

docker-build: build
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--load \
		--build-arg BASE_IMAGE=$(BASE_IMAGE) \
		-t $(REGISTRY)/rlark-ui:$(IMAGE_TAG) \
		-f Dockerfile \
		../..

docker-push: build
	docker buildx build \
		--platform $(BUILDX_PLATFORMS) \
		--push \
		--build-arg BASE_IMAGE=$(BASE_IMAGE) \
		-t $(REGISTRY)/rlark-ui:$(IMAGE_TAG) \
		-f Dockerfile \
		../..

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

.PHONY: help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Build targets:"
	@echo "  install                      Install npm dependencies"
	@echo "  build                        Build frontend static files"
	@echo "  lint                         Lint TypeScript/React (eslint)"
	@echo "  fmt                          Format code (prettier)"
	@echo ""
	@echo "Docker targets (buildx):"
	@echo "  docker-build                 Build rlark-ui image (load into local docker)"
	@echo "  docker-push                  Build rlark-ui image and push to registry"
	@echo ""
	@echo "Variables:"
	@echo "  REGISTRY=ghcr.io/org         Container registry (default: rlinf)"
	@echo "  IMAGE_TAG=v0.1.0            Image tag (default: latest; also: VERSION)"
	@echo "  BUILDX_PLATFORMS             Multi-arch targets (default: linux/amd64)"
	@echo "  BASE_IMAGE=nginx:1.29       Nginx base image (default: nginx:1.29.1)"
