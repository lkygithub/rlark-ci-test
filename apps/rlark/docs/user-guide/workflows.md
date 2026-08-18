# Workflows

A Workflow connects reusable Job templates as a DAG. Define dependencies between stages, submit a run, and inspect each generated Job independently. Use Workflows for repeatable training, evaluation, and data-processing pipelines.

## Using the UI

Platform Console → Workflows → Create Workflow. Add Job templates and dependencies, save and run, then open generated Jobs from Workflow details.

## API equivalent

Create or update a Workflow CR and query its generated Jobs. See the [CRD Reference](../reference/crd.md).
