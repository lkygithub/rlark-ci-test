IMAGE_REGISTRY ?= docker.io/rlark
IMAGE_TAG ?= latest
IMAGE_PLATFORMS ?= linux/amd64
BASE_IMAGE_UI ?= nginx:1.29.1

.PHONY: install build fmt docker-build docker-push

install:
	npm install

build: install
	npm run build

fmt:
	npx prettier --write 'src/' 'index.html' 'package.json' 'vite.config.ts' 'tsconfig*.json'

docker-build: build
	docker buildx build --platform $(IMAGE_PLATFORMS) --build-arg BASE_IMAGE=$(BASE_IMAGE_UI) -t $(IMAGE_REGISTRY)/rlark-ui:$(IMAGE_TAG) -f Dockerfile . --load

docker-push: build
	docker buildx build --platform $(IMAGE_PLATFORMS) --build-arg BASE_IMAGE=$(BASE_IMAGE_UI) -t $(IMAGE_REGISTRY)/rlark-ui:$(IMAGE_TAG) -f Dockerfile . --push