# SSH Keys

## Overview

SSH keys serve two purposes in RLark:

1. Server authentication for SSH bastion access
2. Injecting public keys into Job Pod `~/.ssh/authorized_keys`

![SSH Key Management](../images/ui/ssh-key-ui.png)

## Adding a Public Key

- Platform Console → SSH Keys → Add Key
- Generate a dedicated key pair for RLark (do not reuse keys from other systems)
- Paste the OpenSSH public key
- RLark parses and normalizes the key
- Duplicate keys are rejected
- Enter a recognizable name

## Using SSH Keys in a Job

- In the Job creation wizard, Shared Configuration step, select SSH keys
- Selected keys are written to `JobSpec` and propagated to all Tasks
- Keys are appended to `~/.ssh/authorized_keys` in each container

## Connecting to a Worker via SSH

RLark Server acts as an SSH bastion host for connecting to running Job Pods.

### Prerequisites
- Pod is in Running state
- Public key is registered in RLark
- Verify the host key fingerprint
- Private key has correct permissions (`chmod 600`)

### Connecting
```bash
ssh -p <port> <user>@<host>
```
- After login, select the target Pod from the interactive menu
- Opens a terminal directly in the Pod

### Direct Connection (ssh -J)
```bash
ssh -J <user>@<bastion>:<port> <user>@<pod-name>
```
- Requires the container to provide an SSH service
- Public key must be injected and active

## Deleting and Rotating Keys

- Deleting a key from the list does NOT revoke it from existing Pods
- For key rotation, handle Server authentication and injected Pod keys separately

## Security Notes

!!! warning "Security Limitation"
    SSH keys use a **shared user key list**, not isolated per console login user. This means:
    - Anyone with a private key corresponding to a registered public key can access pods where that key is injected
    - In multi-tenant environments, this feature should be limited to trusted users
    - Key revocation does **not** affect already-running pods (injected keys remain active)
    - Audit logging must be performed at the entry point (before the bastion)

- Never upload private keys
- Verify the bastion host key fingerprint before first connection
- Rotate keys regularly and recreate affected pods to remove old public keys

## API Equivalent

Use SSH Key endpoints to create, query, and delete public keys. See [API Reference](../api/reference.md).