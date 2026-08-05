FROM ubuntu:22.04
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY bin/controller-manager /app/controller-manager
EXPOSE 8080 8081
ENTRYPOINT ["/app/controller-manager"]