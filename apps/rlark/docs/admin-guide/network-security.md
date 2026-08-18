# Networking and Security

RLark uses two control-plane channels:

| Channel | Default port | Direction | Purpose |
|---|---:|---|---|
| HTTPS / mTLS | `8443` | Agent → Server | Control API, certificate identity, and resource synchronization |
| SSH | `2222` | Data-plane Agent → Server | Cross-cluster Pod networking, SSH jump access, and WebTerminal forwarding |

## Why the SSH Channel Exists

Data planes commonly run behind private networks, NAT, or firewalls, so the control plane cannot connect directly to Pods. A node Agent initiates an outbound SSH connection to Server, allowing RLark to forward cross-cluster Pod and terminal traffic without opening inbound data-plane ports.

```text
Source Pod → network-sidecar → NodeServer → Agent SSH client
           → RLark Server:2222 → target data-plane Agent → target Pod
```

SSH does not replace the mTLS control connection on `8443`. Production networks should allow data-plane nodes to reach control-plane `8443/TCP` and `2222/TCP`; they do not need to expose node or Pod ingress to the control plane.

## Server Configuration

Server listens on `2222` by default and accepts `--ssh-port`:

```bash
server \
  --https-port=8443 \
  --ssh-port=2222 \
  --ca-cert=/etc/rlark/certs/ca.crt \
  --ca-key=/etc/rlark/certs/ca.key
```

Expose both `8443` and `2222` from Kubernetes and make the configured control-plane hostname resolvable from every data plane. A LoadBalancer, NodePort, or L4 proxy for `2222` must forward raw TCP, not HTTP.

## Agent Configuration

The SSH address uses `user@host:port`; the host must not include `http://` or `https://`:

```yaml
args:
  - --server-address=https://rlark.example.com:8443
  - --rlark-server-ssh-address=client@rlark.example.com:2222
  - --rlark-server-ssh-host-key=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...
```

- `--server-address`: HTTPS control connection.
- `--rlark-server-ssh-address`: SSH tunnel endpoint; the principal is normally `client`.
- `--rlark-server-ssh-host-key`: Server SSH public host key used to prevent man-in-the-middle attacks.

Collect and verify the key over a trusted network before installation:

```bash
ssh-keyscan -p 2222 rlark.example.com > rlark-server.known_hosts
ssh-keygen -lf rlark-server.known_hosts
awk '{print $2 " " $3}' rlark-server.known_hosts
```

Set the final output as `--rlark-server-ssh-host-key`. The current Agent falls back to no host-key verification when the value is empty or invalid. That behavior is only acceptable for local development; production must pin the key and update it through a controlled rotation.

`rlarkadm` derives Agent arguments from `control-plane-address`. That value is the HTTPS endpoint. If a generated SSH argument contains a URL scheme or is not resolvable from the data plane, edit the generated Agent manifest so the SSH argument uses the reachable `host:2222` endpoint.

## Certificates and Keys

- Use a distinct Agent certificate for every data-plane cluster; never reuse private keys.
- Mount Agent certificates and keys from a read-only Secret with restricted namespace access.
- User SSH public keys and Agent identity credentials serve different purposes; never upload user private keys.
- Test CA, Server Host Key, and Agent certificate rotation on a non-production cluster and coordinate Server and Agent rollout order.

## Verification and Troubleshooting

Test connectivity from a data-plane node:

```bash
nc -vz rlark.example.com 8443
nc -vz rlark.example.com 2222
ssh-keyscan -p 2222 rlark.example.com
```

Then inspect Agent logs for TLS, SSH handshake, Host Key, and certificate failures. Verify that DNS resolves, outbound firewall rules permit both ports, the SSH address has no URL scheme, the pinned Host Key matches Server, Agent credentials are valid, and the `/var/run/rlark` NodeServer socket is mounted.

See [System Architecture](../architecture.md) for data flow and trust boundaries and [Configuration](../reference/configuration.md) for Agent parameters.
