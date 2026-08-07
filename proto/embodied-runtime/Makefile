GO_SDK_DIR ?= ../../sdks/embodied-runtime-go
PY_SDK_DIR ?= ../../sdks/embodied-runtime-python

PROTO_SPECS = \
	roscontroller/v1/robot.proto \
	cameracontroller/v1/camera.proto

.PHONY: proto proto-go proto-python

proto: proto-go proto-python

proto-go:
	protoc \
		--proto_path=. \
		--go_out=$(GO_SDK_DIR)/gen \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(GO_SDK_DIR)/gen \
		--go-grpc_opt=paths=source_relative \
		$(PROTO_SPECS)

proto-python:
	cd $(PY_SDK_DIR) && python3 scripts/gen_proto.py