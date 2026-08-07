# -- Base image arguments --------------------------------------------------
ARG GO_BASE_IMAGE=golang:1.26-alpine
ARG RUNTIME_BASE_IMAGE=alpine:3.21

# -- Build stage -----------------------------------------------------------
# All Go binaries, statically linked — no glibc dependency.
FROM ${GO_BASE_IMAGE} AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 go build -o /device-plugin     ./cmd/device-plugin && \
    CGO_ENABLED=0 go build -o /ros-controller    ./cmd/ros-controller && \
    CGO_ENABLED=0 go build -o /rosctr            ./cmd/rosctr && \
    CGO_ENABLED=0 go build -o /camera-controller ./cmd/camera-controller && \
    CGO_ENABLED=0 go build -o /camctr            ./cmd/camctr

# -- Runtime stage ---------------------------------------------------------
FROM ${RUNTIME_BASE_IMAGE}

COPY --from=builder /device-plugin      /usr/local/bin/device-plugin
COPY --from=builder /ros-controller     /usr/local/bin/ros-controller
COPY --from=builder /rosctr            /usr/local/bin/rosctr
COPY --from=builder /camera-controller /usr/local/bin/camera-controller
COPY --from=builder /camctr            /usr/local/bin/camctr

ENTRYPOINT ["/usr/local/bin/device-plugin"]
