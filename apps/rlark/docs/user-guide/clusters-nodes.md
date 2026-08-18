# Clusters and Nodes

The **Clusters** page summarizes onboarded data planes and their usable Worker nodes. The **Nodes** page provides resource type, schedulability, health, location, GPU or embodied-device model, running Workers, and capacity information.

Control-plane-only and other non-Worker nodes are not schedulable workload capacity. Contact an administrator when a cluster is offline, a node is cordoned, or required metadata is missing.

## Using the UI

Platform Console → Clusters or Nodes. Filter by type, state, and location; open a resource to inspect capacity, health, and running Workers.

## API equivalent

Query Cluster and Node resources. See the [API Reference](../api/reference.md) for fields and filters.
