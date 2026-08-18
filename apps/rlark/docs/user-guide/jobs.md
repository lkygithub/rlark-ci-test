# Jobs

A Job is the user-facing workload. Choose a template or define Task roles, images, commands, replicas, resource requests, storage, and scheduling requirements. After submission, use the Job detail page to follow state changes and inspect its Workers.

Before submitting, confirm that a compatible cluster and node resource are available. See [Core Concepts](../concepts.md) for the Job–Task–Worker relationship.

## Using the UI

Platform Console → Jobs → Create Job. Enter a name, configure Worker roles, images, commands, replicas, and resources, then submit. Open Job details to verify the running state and inspect Workers.

## API equivalent

`POST /api/v1/rlinf.io/v1alpha1/jobs`. See [API Examples](../api/examples.md) for complete requests and status queries.

## Workers, Logs, and Terminal Access

A Worker is the runtime instance for a Task replica. The Worker list on Job details shows role, IP, node placement, state, and requested GPU or embodied-device resources.

**Using the UI:** Job Details → Worker List. Expand a Worker for runtime information; use row actions to view logs, copy an SSH command, or open WebTerminal in a new tab. WebTerminal requires an authenticated user, a running Worker, and a reachable RLark SSH tunnel.

**Using the API:** Query Worker information through Job, Task status, and log endpoints in the [API Reference](../api/reference.md). Terminal access uses an authenticated WebSocket and is not intended to be assembled manually by ordinary users.
