# Web console behavior

The RLark console separates live backend data from demonstration content:

- Resource totals, health, notifications, cluster lists, node lists, jobs, and storage views use backend responses when the gateway is available.
- When the gateway is unavailable, the console labels the session as **Mock** and uses the same fallback node dataset across overview and node pages.
- The China resource map is explicitly marked as **Demo data**. Its locations and links are illustrative until node city metadata is available from the backend.

Navigation uses stable list and detail URLs. Returning from a detail view replaces that detail history entry, while selecting another resource creates a normal browser-history entry. Map city and resource-type controls open the node list with the corresponding filter.

Language, theme, and sidebar preferences are stored locally in the browser. Dialogs can be dismissed with Escape when no submission is in progress, and future workflow steps remain locked until the preceding step has been reached.

## Creating Training Jobs

### Launch the Web Console

```bash
cd apps/rlark-ui
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Navigation

| Page | Function |
|------|----------|
| **Overview** | Platform health, resource usage, active workflows and events |
| **Nodes** | Node list with location, GPU/embodied device models and availability |
| **Jobs** | Create and manage training jobs, view Task progress |
| **Workflows** | DAG workflow orchestration and execution view |
| **Storage** | Storage class management |

### Creating a Job

1. Go to the Jobs page, click "Create Job"
2. Fill in Job name, Domain, Cluster ID
3. Add a Task: name, role, image, command, resource limits
4. Submit — the system auto-splits Job → Task → Deployment → Pod

### Viewing Node Information

The Nodes page shows all registered nodes with GPU models/counts, embodied devices, and physical location.

### Adding Metadata

```bash
kubectl annotate node <node> rlark.io/ip-location='{"province":"Shanghai","city":"Shanghai"}' --overwrite
kubectl label node <node> rlark.io/node-category=cloud rlark.io/model='NVIDIA H800' --overwrite
kubectl annotate jobs.rlinf.io <job> rlark.io/display-name='Policy Training Job' --overwrite
```

