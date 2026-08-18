# Workflows

## Overview

A Workflow connects reusable Job templates as a DAG. Define dependencies between stages and submit a run. Each stage generates an independent Job.

## Creating a Workflow

### Step 1: Design the DAG
- Add nodes representing Job templates
- Drag to create dependencies between nodes
- Self-loops and cycles are rejected
- Predecessor templates appear before dependents in YAML

### Step 2: Configure Each Job
- For each node, configure: type, roles, Header, cluster, node selectors, GPU, storage, Domain, run script
- Same configuration options as a standalone Job

### Step 3: Review YAML
- Verify template names are unique
- Verify no dependency cycles
- Record image tags with corresponding digests
- Verify storage configuration

### Step 4: Submit and Verify
- Submit the workflow
- Confirm child Jobs transition to Succeeded or Failed
- Record the root node's generated child Job name for monitoring

## Monitoring Workflow Execution

- Open Workflow details to see the DAG visualization
- Each node shows its child Job status
- Click a node to navigate to the child Job details
- Inspect child Jobs independently

## Important Notes

- Default example templates are not directly runnable
- If a predecessor Job script ends but the Job stays in Running state, check for background processes

## API Equivalent

Create or update a Workflow CR and query its generated Jobs. See [CRD Reference](../reference/crd.md).