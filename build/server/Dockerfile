FROM ubuntu:22.04
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY bin/server /app/server
EXPOSE 8443 8888 2222
ENTRYPOINT ["/app/server"]