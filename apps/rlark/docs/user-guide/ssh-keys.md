# SSH Keys

Add public SSH keys to your account before using generated Worker SSH commands. Store public keys only; never upload private keys. Key availability and the final connection command also depend on administrator SSH gateway configuration.

## Using the UI

Platform Console → SSH Keys → Add Key. Enter a recognizable name and paste the public key; return to the Worker list to copy the generated SSH command.

## API equivalent

Use SSH Key endpoints to create, query, and delete public keys. API requests must never contain private keys; see the [API Reference](../api/reference.md).
