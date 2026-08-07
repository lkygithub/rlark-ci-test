FROM harbor.infini-ai.com/share/mizar-ci:1.26.5-bookworm AS builder
WORKDIR /src
COPY api/go.mod api/go.sum ./api/
COPY apps/rlark/go.mod apps/rlark/go.sum ./apps/rlark/
RUN cd apps/rlark && go mod download
COPY api/ ./api/
COPY apps/rlark/ ./apps/rlark/
RUN cd apps/rlark && CGO_ENABLED=0 GOOS=linux go build -o /out/server ./cmd/server/... && \
    CGO_ENABLED=0 GOOS=linux go build -o /out/controller-manager ./cmd/controller-manager/... && \
    CGO_ENABLED=0 GOOS=linux go build -o /out/gateway ./cmd/gateway/... && \
    CGO_ENABLED=0 GOOS=linux go build -o /out/agent ./cmd/agent/... && \
    CGO_ENABLED=0 GOOS=linux go build -o /out/network-sidecar ./cmd/network-sidecar/... && \
    CGO_ENABLED=0 GOOS=linux go build -o /out/rlarkadm ./cmd/rlarkadm

FROM harbor.infini-ai.com/share/ubuntu:22.04
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /out/* /usr/local/bin/