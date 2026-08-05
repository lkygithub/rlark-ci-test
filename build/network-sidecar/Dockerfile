FROM ubuntu:22.04
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY bin/network-sidecar /app/network-sidecar
ENTRYPOINT ["/app/network-sidecar"]