# Clusters and Nodes

## Browsing Clusters

- Clusters page lists all onboarded data planes
- Search and filter by: name, ID, type, region, location, status
- Columns: cluster name, type, node count, online/offline status, online rate
- Auto-refresh every 10 seconds

![Cluster list](../images/ui/first-login-cluster-list.png)

## Inspecting a Cluster

- Click a cluster to open its detail page
- Check cluster status: total nodes, online rate, offline nodes, running jobs
- Resource composition: cloud compute, edge compute, real robots
- Node resource area supports filtering and search

![Cluster detail](../images/ui/first-login-cluster-detail.png)

## Finding and Filtering Nodes

- Filter by node type using `rlark.io/node-category` label: cloud, edge, robot, other
- Filter by status and keyword search
- List auto-refreshes every 10 seconds
- Embodied task status labels on nodes

## Inspecting Node Resources

- Click a node to open its detail page
- Check scheduling status: schedulable / cordoned
- Node info: type, access mode, OS, architecture, agent version
- Resource usage: CPU, memory, GPU
- Associated jobs running on the node

![Node detail](../images/ui/first-login-node-detail.png)

## API Equivalent

Query Cluster and Node resources. See [API Reference](../api/reference.md) for fields and filters.