# Jobs

A Job is the user-facing workload. Choose a template or define Task roles, images, commands, replicas, resource requests, storage, and scheduling requirements. After submission, use the Job detail page to follow state changes and inspect its Workers.

Before submitting, confirm that a compatible cluster and node resource are available. See [Core Concepts](../concepts.md) for the Job–Task–Worker relationship.

## Using the UI

Platform Console → Jobs → Create Job. Enter a name and define the Worker roles. For each role:

1. Select the target cluster. Each option shows the cluster name, type label, and current status in one line.
2. Choose one GPU or embodied-device specification from the list, which shows available/total devices and nodes, then set the shared per-Worker resource request. Set the request to `0` for debugging workloads that should keep the placement constraint without requesting the selected device.
3. Choose one scheduling mode:
   - **Automatic selection**: enter the desired Worker count. The console validates the total request against schedulable capacity and selects eligible nodes.
   - **Select nodes**: click eligible nodes or drag across node cards. Each selected node creates one Worker; click or drag across selected nodes again to remove them.
4. Review the shared placement summary, then configure the image, prepare script, environment variables, and storage mounts.

Submit the Job, then open Job details to verify the running state and inspect Workers. The detail-page action bar also supports the full Job lifecycle:

After selecting a role, its resource summary shows the GPU or embodied-device model configured on the assigned node and its requested quantity, such as `NVIDIA RTX 4090 · 1 GPU`. If the Worker has not reported its assigned node yet, the console resolves the model from the role's selected hostname candidates.

When a Worker is Pending, hover or focus the information icon beside that Worker's status. RLark reads events for that exact data-plane Pod, so kubelet `Pulling`/`Pulled` events and image-pull failures appear without mixing in events from other Workers on the same node. Byte or percentage progress is shown only when the runtime reports it; the console never fabricates a progress percentage.

- **Stop** pauses a running Job and preserves its configuration.
- **Start** resumes a stopped Job.
- **Restart** opens a choice: restart immediately with the current configuration, or edit the Job and restart after the updated configuration is saved.
- **Delete** opens a danger confirmation that identifies the target Job and warns that the operation cannot be undone before permanently removing it.

Lifecycle actions require confirmation. While an action is in progress, the other action buttons are disabled; failures are shown in the same action area. A Job is removed from the page only after the delete request succeeds.

The Jobs table provides a Start/Stop shortcut in each row. Open the adjacent actions menu to clone, restart, or delete the Job; Restart uses the same immediate-restart or edit-and-restart choice as the detail page.

## API equivalent

`POST /api/v1/rlinf.io/v1alpha1/jobs`. See [API Examples](../api/examples.md) for complete requests and status queries.

## Workers, Logs, and Terminal Access

A Worker is the runtime instance for a Task replica. The Worker list on Job details shows role, IP, node placement, state, and requested GPU or embodied-device resources.

**Using the UI:** Job Details → Worker List. Use **Refresh** in the list header to update Task, Pod, placement, IP, and status information without reloading the page. Expand a Worker for runtime information; use row actions to view logs, copy an SSH command, or open WebTerminal in a new tab. WebTerminal requires an authenticated user, a running Worker, and a reachable RLark SSH tunnel.

**Using the API:** Query Worker information through Job, Task status, and log endpoints in the [API Reference](../api/reference.md). Terminal access uses an authenticated WebSocket and is not intended to be assembled manually by ordinary users.
