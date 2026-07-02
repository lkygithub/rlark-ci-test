FROM harbor.infini-ai.com/share/ubuntu:22.04
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY bin/gateway /app/gateway
EXPOSE 8090
ENTRYPOINT ["/app/gateway"]