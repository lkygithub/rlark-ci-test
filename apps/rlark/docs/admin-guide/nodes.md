# Node and Resource Management

## Managing Node Scheduling

Administrators can control whether a node accepts new workload by toggling its scheduling status.

### Cordon a Node (Stop Scheduling)
- PATCH the Node resource: set `spec.unschedulable: true`
- Existing running Workers on the node are NOT affected
- New jobs will not be scheduled to this node
- Use this before maintenance, upgrades, or when the node is misbehaving

### Uncordon a Node (Resume Scheduling)
- PATCH the Node resource: set `spec.unschedulable: false`
- The node resumes accepting new workload
- Verify the node is healthy before uncordoning

### Node Labels
- Administrators can add custom labels to nodes for organization
- Labels are used by users for nodeSelector in job configuration
- Common labels: `rlark.io/node-category` (cloud/edge/robot), GPU model, location

### Using the UI
Administrator Console → Nodes → Select a node → Toggle scheduling or edit labels.

### Using the API
```bash
# Cordon
kubectl patch node <name> --type merge -p '{"spec":{"unschedulable":true}}'

# Uncordon
kubectl patch node <name> --type merge -p '{"spec":{"unschedulable":false}}'
```