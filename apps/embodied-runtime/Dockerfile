# -- Base image arguments --------------------------------------------------
ARG GO_BASE_IMAGE=golang:1.26-alpine
ARG RUNTIME_BASE_IMAGE=alpine:3.21

# -- Build stage -----------------------------------------------------------
# All Go binaries, statically linked — no glibc dependency.
FROM ${GO_BASE_IMAGE} AS builder

WORKDIR /src
COPY sdks/embodied-runtime-go/go.mod sdks/embodied-runtime-go/go.sum ./sdks/embodied-runtime-go/
COPY apps/embodied-runtime/go.mod apps/embodied-runtime/go.sum ./apps/embodied-runtime/
RUN cd apps/embodied-runtime && go mod download

COPY sdks/embodied-runtime-go/ ./sdks/embodied-runtime-go/
COPY apps/embodied-runtime/ ./apps/embodied-runtime/

RUN cd apps/embodied-runtime && \
    CGO_ENABLED=0 go build -o /device-plugin     ./cmd/device-plugin && \
    CGO_ENABLED=0 go build -o /ros-controller    ./cmd/ros-controller && \
    CGO_ENABLED=0 go build -o /ros2-controller   ./cmd/ros2-controller && \
    CGO_ENABLED=0 go build -o /rosctr            ./cmd/rosctr && \
    CGO_ENABLED=0 go build -o /camera-controller ./cmd/camera-controller && \
    CGO_ENABLED=0 go build -o /camctr            ./cmd/camctr && \
    CGO_ENABLED=0 go build -o /devinit           ./cmd/devinit

# -- Runtime stage ---------------------------------------------------------
FROM ${RUNTIME_BASE_IMAGE}

# Optional: override the Alpine APK mirror (e.g. https://mirrors.tuna.tsinghua.edu.cn).
# When empty, the default CDN (dl-cdn.alpinelinux.org) is used.
ARG APK_MIRROR=""

RUN if [ -n "$APK_MIRROR" ]; then \
      sed -i "s#http://dl-cdn.alpinelinux.org#${APK_MIRROR}#g" /etc/apk/repositories; \
      sed -i "s#https://dl-cdn.alpinelinux.org#${APK_MIRROR}#g" /etc/apk/repositories; \
    fi

# iproute2  — provides `ip`, required by pkg/netmac to create macvlan links
#             (`ip link add ... type macvlan`, `ip link set ... netns`,
#             `ip addr/route/neigh`). Busybox's `ip` applet lacks macvlan &
#             netns support, so the full iproute2 package is needed.
# util-linux — provides `nsenter`, required to run `ip` in the host's and the
#             target pod's network namespaces (`nsenter --target 1 --net ...`
#             and `nsenter --target <pid> --net ...`). Not present in busybox.
# Both are exercised by the device plugin's on-demand macvlan setup
# (DeviceServer / pkg/netmac) whenever host_macvlans is configured — i.e. the
# exact flow the mutating webhook drives via the injected devinit init container.
RUN apk add --no-cache iproute2 util-linux

COPY --from=builder /device-plugin      /usr/local/bin/device-plugin
COPY --from=builder /ros-controller     /usr/local/bin/ros-controller
COPY --from=builder /ros2-controller    /usr/local/bin/ros2-controller
COPY --from=builder /rosctr             /usr/local/bin/rosctr
COPY --from=builder /camera-controller  /usr/local/bin/camera-controller
COPY --from=builder /camctr             /usr/local/bin/camctr
COPY --from=builder /devinit            /usr/local/bin/devinit

ENTRYPOINT ["/usr/local/bin/device-plugin"]
