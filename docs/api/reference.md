# API Reference

Kubernetes-style API surface generated from the current CRDs.

## Domain

- Group: `rlinf.io`
- Version: `v1alpha1`
- Scope: `Cluster`
- Resource: `domains`

### Operations

#### `GET /api/v1/rlinf.io/v1alpha1/domains`

List domains resources.

Parameters:
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `DomainList`
- `401` Unauthorized

#### `POST /api/v1/rlinf.io/v1alpha1/domains`

Create a Domain resource.

Parameters:
- `pretty` (query, optional)
- `dryRun` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Domain`

Responses:
- `201` Created → `Domain`
- `202` Accepted → `Domain`
- `401` Unauthorized

#### `DELETE /api/v1/rlinf.io/v1alpha1/domains`

Delete a collection of domains resources.

Parameters:
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `Status`
- `401` Unauthorized

#### `GET /api/v1/rlinf.io/v1alpha1/domains/{name}`

Get a Domain resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Domain`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/domains/{name}`

Replace a Domain resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Domain`

Responses:
- `200` OK → `Domain`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/domains/{name}`

Patch a Domain resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Domain`

Responses:
- `200` OK → `Domain`
- `401` Unauthorized
- `404` Not Found

#### `DELETE /api/v1/rlinf.io/v1alpha1/domains/{name}`

Delete a Domain resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Status`
- `202` Accepted → `Status`
- `401` Unauthorized
- `404` Not Found

#### `GET /api/v1/rlinf.io/v1alpha1/domains/{name}/status`

Get the status subresource for Domain.

Parameters:
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Domain`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/domains/{name}/status`

Replace the status subresource for Domain.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Domain`

Responses:
- `200` OK → `Domain`
- `202` Accepted → `Domain`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/domains/{name}/status`

Patch the status subresource for Domain.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Domain`

Responses:
- `200` OK → `Domain`
- `202` Accepted → `Domain`
- `401` Unauthorized
- `404` Not Found

### Request Schema

- `apiVersion`: `string`, optional - APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schema...
- `kind`: `string`, optional - Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoin...
- `metadata`: `object`, optional
- `spec`: `object`, optional
  - `cidr`: `string`, optional
- `status`: `object`, optional
  - `ipAllocations`: `array`, optional
    - `items`: `object`, optional
      - `ip`: `string`, optional
      - `job`: `string`, optional
      - `pod`: `string`, optional
      - `task`: `string`, optional

## DomainPeer

- Group: `rlinf.io`
- Version: `v1alpha1`
- Scope: `Namespaced`
- Resource: `domainpeers`

### Operations

#### `GET /api/v1/rlinf.io/v1alpha1/domainpeers`

List domainpeers resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `DomainPeerList`
- `401` Unauthorized

#### `POST /api/v1/rlinf.io/v1alpha1/domainpeers`

Create a DomainPeer resource.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `dryRun` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `DomainPeer`

Responses:
- `201` Created → `DomainPeer`
- `202` Accepted → `DomainPeer`
- `401` Unauthorized

#### `DELETE /api/v1/rlinf.io/v1alpha1/domainpeers`

Delete a collection of domainpeers resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `Status`
- `401` Unauthorized

#### `GET /api/v1/rlinf.io/v1alpha1/domainpeers/{name}`

Get a DomainPeer resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `DomainPeer`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/domainpeers/{name}`

Replace a DomainPeer resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `DomainPeer`

Responses:
- `200` OK → `DomainPeer`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/domainpeers/{name}`

Patch a DomainPeer resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `DomainPeer`

Responses:
- `200` OK → `DomainPeer`
- `401` Unauthorized
- `404` Not Found

#### `DELETE /api/v1/rlinf.io/v1alpha1/domainpeers/{name}`

Delete a DomainPeer resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Status`
- `202` Accepted → `Status`
- `401` Unauthorized
- `404` Not Found

#### `GET /api/v1/rlinf.io/v1alpha1/domainpeers/{name}/status`

Get the status subresource for DomainPeer.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `DomainPeer`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/domainpeers/{name}/status`

Replace the status subresource for DomainPeer.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `DomainPeer`

Responses:
- `200` OK → `DomainPeer`
- `202` Accepted → `DomainPeer`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/domainpeers/{name}/status`

Patch the status subresource for DomainPeer.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `DomainPeer`

Responses:
- `200` OK → `DomainPeer`
- `202` Accepted → `DomainPeer`
- `401` Unauthorized
- `404` Not Found

### Request Schema

- `apiVersion`: `string`, optional - APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schema...
- `kind`: `string`, optional - Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoin...
- `metadata`: `object`, optional
- `spec`: `object`, optional
  - `cert`: `string`, optional
  - `key`: `string`, optional
  - `pods`: `array`, optional
    - `items`: `object`, optional
      - `globalNamespace`: `string`, optional
      - `ip`: `string`, optional
      - `localIP`: `string`, optional
      - `name`: `string`, optional
      - `namespace`: `string`, optional
      - `node`: `string`, optional
      - `uid`: `string`, optional
  - `prefixLen`: `integer`, optional
- `status`: `object`, optional

## Job

- Group: `rlinf.io`
- Version: `v1alpha1`
- Scope: `Cluster`
- Resource: `jobs`

### Operations

#### `GET /api/v1/rlinf.io/v1alpha1/jobs`

List jobs resources.

Parameters:
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `JobList`
- `401` Unauthorized

#### `POST /api/v1/rlinf.io/v1alpha1/jobs`

Create a Job resource.

Parameters:
- `pretty` (query, optional)
- `dryRun` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Job`

Responses:
- `201` Created → `Job`
- `202` Accepted → `Job`
- `401` Unauthorized

#### `DELETE /api/v1/rlinf.io/v1alpha1/jobs`

Delete a collection of jobs resources.

Parameters:
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `Status`
- `401` Unauthorized

#### `GET /api/v1/rlinf.io/v1alpha1/jobs/{name}`

Get a Job resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Job`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/jobs/{name}`

Replace a Job resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Job`

Responses:
- `200` OK → `Job`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/jobs/{name}`

Patch a Job resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Job`

Responses:
- `200` OK → `Job`
- `401` Unauthorized
- `404` Not Found

#### `DELETE /api/v1/rlinf.io/v1alpha1/jobs/{name}`

Delete a Job resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Status`
- `202` Accepted → `Status`
- `401` Unauthorized
- `404` Not Found

#### `GET /api/v1/rlinf.io/v1alpha1/jobs/{name}/status`

Get the status subresource for Job.

Parameters:
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Job`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/jobs/{name}/status`

Replace the status subresource for Job.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Job`

Responses:
- `200` OK → `Job`
- `202` Accepted → `Job`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/jobs/{name}/status`

Patch the status subresource for Job.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Job`

Responses:
- `200` OK → `Job`
- `202` Accepted → `Job`
- `401` Unauthorized
- `404` Not Found

### Request Schema

- `apiVersion`: `string`, optional - APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schema...
- `kind`: `string`, optional - Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoin...
- `metadata`: `object`, optional
- `spec`: `object`, optional
  - `domain`: `string`, optional
  - `tasks`: `array`, optional
    - `items`: `object`, optional
      - `agentType`: `string`, optional
      - `docker`: `object`, optional
      - `domain`: `string`, optional
      - `downstreamName`: `string`, optional
      - `head`: `boolean`, optional
      - `kubernetes`: `object`, optional
      - `name`: `string`, optional
      - `nodeSelector`: `object`, optional
      - `prepareScript`: `string`, optional
      - `raw`: `object`, optional
      - `role`: `string`, required
      - `runScript`: `string`, optional
      - `tensorBoardDir`: `string`, optional
- `status`: `object`, optional
  - `conditions`: `array`, optional
    - `items`: `object`, optional - Condition contains details for one aspect of the current state of this API Resource.
      - `lastTransitionTime`: `string`, required - lastTransitionTime is the last time the condition transitioned from one status to another. This should be when the un...
      - `message`: `string`, required - message is a human readable message indicating details about the transition. This may be an empty string.
      - `observedGeneration`: `integer`, optional - observedGeneration represents the .metadata.generation that the condition was set based upon. For instance, if .metad...
      - `reason`: `string`, required - reason contains a programmatic identifier indicating the reason for the condition's last transition. Producers of spe...
      - `status`: `string`, required, enum=True,False,Unknown - status of the condition, one of True, False, Unknown.
      - `type`: `string`, required - type of condition in CamelCase or in foo.example.com/CamelCase.
  - `endTime`: `string`, optional
  - `phase`: `string`, optional
  - `startTime`: `string`, optional
  - `tasks`: `array`, optional
    - `items`: `object`, optional
      - `message`: `string`, optional
      - `name`: `string`, optional
      - `phase`: `string`, optional

## Node

- Group: `rlinf.io`
- Version: `v1alpha1`
- Scope: `Namespaced`
- Resource: `nodes`

### Operations

#### `GET /api/v1/rlinf.io/v1alpha1/nodes`

List nodes resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `NodeList`
- `401` Unauthorized

#### `POST /api/v1/rlinf.io/v1alpha1/nodes`

Create a Node resource.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `dryRun` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Node`

Responses:
- `201` Created → `Node`
- `202` Accepted → `Node`
- `401` Unauthorized

#### `DELETE /api/v1/rlinf.io/v1alpha1/nodes`

Delete a collection of nodes resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `Status`
- `401` Unauthorized

#### `GET /api/v1/rlinf.io/v1alpha1/nodes/{name}`

Get a Node resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Node`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/nodes/{name}`

Replace a Node resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Node`

Responses:
- `200` OK → `Node`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/nodes/{name}`

Patch a Node resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Node`

Responses:
- `200` OK → `Node`
- `401` Unauthorized
- `404` Not Found

#### `DELETE /api/v1/rlinf.io/v1alpha1/nodes/{name}`

Delete a Node resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Status`
- `202` Accepted → `Status`
- `401` Unauthorized
- `404` Not Found

#### `GET /api/v1/rlinf.io/v1alpha1/nodes/{name}/status`

Get the status subresource for Node.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Node`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/nodes/{name}/status`

Replace the status subresource for Node.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Node`

Responses:
- `200` OK → `Node`
- `202` Accepted → `Node`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/nodes/{name}/status`

Patch the status subresource for Node.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Node`

Responses:
- `200` OK → `Node`
- `202` Accepted → `Node`
- `401` Unauthorized
- `404` Not Found

### Request Schema

- `apiVersion`: `string`, optional - APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schema...
- `kind`: `string`, optional - Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoin...
- `metadata`: `object`, optional
- `spec`: `object`, optional
  - `agentType`: `string`, optional
  - `unschedulable`: `boolean`, optional
- `status`: `object`, optional
  - `addresses`: `array`, optional
    - `items`: `object`, optional - NodeAddress contains information for the node's address.
      - `address`: `string`, required - The node address.
      - `type`: `string`, required - Node address type, one of Hostname, ExternalIP or InternalIP.
  - `allocatable`: `object`, optional - ResourceList is a set of (resource name, quantity) pairs.
  - `capacity`: `object`, optional - ResourceList is a set of (resource name, quantity) pairs.
  - `nodeInfo`: `object`, optional
    - `agentVersion`: `string`, optional
    - `architecture`: `string`, optional
    - `kernelVersion`: `string`, optional
    - `operatingSystem`: `string`, optional
  - `phase`: `string`, optional
  - `reason`: `string`, optional
  - `used`: `object`, optional - ResourceList is a set of (resource name, quantity) pairs.

## Pod

- Group: `rlinf.io`
- Version: `v1alpha1`
- Scope: `Namespaced`
- Resource: `pods`

### Operations

#### `GET /api/v1/rlinf.io/v1alpha1/pods`

List pods resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `PodList`
- `401` Unauthorized

#### `POST /api/v1/rlinf.io/v1alpha1/pods`

Create a Pod resource.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `dryRun` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Pod`

Responses:
- `201` Created → `Pod`
- `202` Accepted → `Pod`
- `401` Unauthorized

#### `DELETE /api/v1/rlinf.io/v1alpha1/pods`

Delete a collection of pods resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `Status`
- `401` Unauthorized

#### `GET /api/v1/rlinf.io/v1alpha1/pods/{name}`

Get a Pod resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Pod`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/pods/{name}`

Replace a Pod resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Pod`

Responses:
- `200` OK → `Pod`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/pods/{name}`

Patch a Pod resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Pod`

Responses:
- `200` OK → `Pod`
- `401` Unauthorized
- `404` Not Found

#### `DELETE /api/v1/rlinf.io/v1alpha1/pods/{name}`

Delete a Pod resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Status`
- `202` Accepted → `Status`
- `401` Unauthorized
- `404` Not Found

#### `GET /api/v1/rlinf.io/v1alpha1/pods/{name}/status`

Get the status subresource for Pod.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Pod`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/pods/{name}/status`

Replace the status subresource for Pod.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Pod`

Responses:
- `200` OK → `Pod`
- `202` Accepted → `Pod`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/pods/{name}/status`

Patch the status subresource for Pod.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Pod`

Responses:
- `200` OK → `Pod`
- `202` Accepted → `Pod`
- `401` Unauthorized
- `404` Not Found

### Request Schema

- `apiVersion`: `string`, optional - APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schema...
- `kind`: `string`, optional - Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoin...
- `metadata`: `object`, optional
- `spec`: `object`, optional - PodSpec 包含 Pod 的标识和引用信息，由数据面上报时设置。
  - `domain`: `string`, optional
  - `podName`: `string`, optional
  - `podNamespace`: `string`, optional
  - `taskName`: `string`, optional
  - `taskNamespace`: `string`, optional
- `status`: `object`, optional - PodStatus 包含 Pod 的运行状态信息（节点、IP、阶段等）， 对应 k8s 中由调度器和 kubelet 设�...
  - `ip`: `string`, optional
  - `message`: `string`, optional
  - `node`: `string`, optional
  - `phase`: `string`, optional

## Task

- Group: `rlinf.io`
- Version: `v1alpha1`
- Scope: `Namespaced`
- Resource: `tasks`

### Operations

#### `GET /api/v1/rlinf.io/v1alpha1/tasks`

List tasks resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `TaskList`
- `401` Unauthorized

#### `POST /api/v1/rlinf.io/v1alpha1/tasks`

Create a Task resource.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `dryRun` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Task`

Responses:
- `201` Created → `Task`
- `202` Accepted → `Task`
- `401` Unauthorized

#### `DELETE /api/v1/rlinf.io/v1alpha1/tasks`

Delete a collection of tasks resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `Status`
- `401` Unauthorized

#### `GET /api/v1/rlinf.io/v1alpha1/tasks/{name}`

Get a Task resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Task`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/tasks/{name}`

Replace a Task resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Task`

Responses:
- `200` OK → `Task`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/tasks/{name}`

Patch a Task resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Task`

Responses:
- `200` OK → `Task`
- `401` Unauthorized
- `404` Not Found

#### `DELETE /api/v1/rlinf.io/v1alpha1/tasks/{name}`

Delete a Task resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Status`
- `202` Accepted → `Status`
- `401` Unauthorized
- `404` Not Found

#### `GET /api/v1/rlinf.io/v1alpha1/tasks/{name}/status`

Get the status subresource for Task.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Task`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/tasks/{name}/status`

Replace the status subresource for Task.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Task`

Responses:
- `200` OK → `Task`
- `202` Accepted → `Task`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/tasks/{name}/status`

Patch the status subresource for Task.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Task`

Responses:
- `200` OK → `Task`
- `202` Accepted → `Task`
- `401` Unauthorized
- `404` Not Found

### Request Schema

- `apiVersion`: `string`, optional - APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schema...
- `kind`: `string`, optional - Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoin...
- `metadata`: `object`, optional
- `spec`: `object`, optional
  - `agentType`: `string`, optional
  - `docker`: `object`, optional
    - `containers`: `array`, optional
      - `items`: `object`, optional
  - `domain`: `string`, optional
  - `downstreamName`: `string`, optional
  - `kubernetes`: `object`, optional
    - `workload`: `object`, optional
      - `kind`: `string`, optional
      - `pvcStorageMap`: `object`, optional
      - `replicas`: `integer`, optional
      - `template`: `object`, optional - PodTemplateSpec describes the data a pod should have when created from a template
  - `nodeSelector`: `object`, optional
  - `prepareScript`: `string`, optional
  - `raw`: `object`, optional
    - `artifact`: `string`, optional
    - `entrypoint`: `array`, optional
    - `environment`: `array`, optional
      - `items`: `object`, optional
  - `role`: `string`, required
  - `runScript`: `string`, optional
  - `tensorBoardDir`: `string`, optional
- `status`: `object`, optional
  - `completionTime`: `string`, optional
  - `conditions`: `array`, optional
    - `items`: `object`, optional - Condition contains details for one aspect of the current state of this API Resource.
      - `lastTransitionTime`: `string`, required - lastTransitionTime is the last time the condition transitioned from one status to another. This should be when the un...
      - `message`: `string`, required - message is a human readable message indicating details about the transition. This may be an empty string.
      - `observedGeneration`: `integer`, optional - observedGeneration represents the .metadata.generation that the condition was set based upon. For instance, if .metad...
      - `reason`: `string`, required - reason contains a programmatic identifier indicating the reason for the condition's last transition. Producers of spe...
      - `status`: `string`, required, enum=True,False,Unknown - status of the condition, one of True, False, Unknown.
      - `type`: `string`, required - type of condition in CamelCase or in foo.example.com/CamelCase.
  - `message`: `string`, optional
  - `observedNodes`: `array`, optional
  - `phase`: `string`, optional
  - `retryCount`: `integer`, optional
  - `startTime`: `string`, optional

## Workflow

- Group: `rlinf.io`
- Version: `v1alpha1`
- Scope: `Cluster`
- Resource: `workflows`

### Operations

#### `GET /api/v1/rlinf.io/v1alpha1/workflows`

List workflows resources.

Parameters:
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `WorkflowList`
- `401` Unauthorized

#### `POST /api/v1/rlinf.io/v1alpha1/workflows`

Create a Workflow resource.

Parameters:
- `pretty` (query, optional)
- `dryRun` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Workflow`

Responses:
- `201` Created → `Workflow`
- `202` Accepted → `Workflow`
- `401` Unauthorized

#### `DELETE /api/v1/rlinf.io/v1alpha1/workflows`

Delete a collection of workflows resources.

Parameters:
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `Status`
- `401` Unauthorized

#### `GET /api/v1/rlinf.io/v1alpha1/workflows/{name}`

Get a Workflow resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Workflow`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/workflows/{name}`

Replace a Workflow resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Workflow`

Responses:
- `200` OK → `Workflow`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/workflows/{name}`

Patch a Workflow resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Workflow`

Responses:
- `200` OK → `Workflow`
- `401` Unauthorized
- `404` Not Found

#### `DELETE /api/v1/rlinf.io/v1alpha1/workflows/{name}`

Delete a Workflow resource.

Parameters:
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Status`
- `202` Accepted → `Status`
- `401` Unauthorized
- `404` Not Found

#### `GET /api/v1/rlinf.io/v1alpha1/workflows/{name}/status`

Get the status subresource for Workflow.

Parameters:
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Workflow`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/workflows/{name}/status`

Replace the status subresource for Workflow.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Workflow`

Responses:
- `200` OK → `Workflow`
- `202` Accepted → `Workflow`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/workflows/{name}/status`

Patch the status subresource for Workflow.

Parameters:
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Workflow`

Responses:
- `200` OK → `Workflow`
- `202` Accepted → `Workflow`
- `401` Unauthorized
- `404` Not Found

### Request Schema

- `apiVersion`: `string`, optional - APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schema...
- `kind`: `string`, optional - Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoin...
- `metadata`: `object`, optional
- `spec`: `object`, optional
  - `jobTemplates`: `array`, optional
    - `items`: `object`, optional
      - `dependencies`: `array`, optional
      - `name`: `string`, optional
      - `spec`: `object`, optional
- `status`: `object`, optional
  - `conditions`: `array`, optional
    - `items`: `object`, optional - Condition contains details for one aspect of the current state of this API Resource.
      - `lastTransitionTime`: `string`, required - lastTransitionTime is the last time the condition transitioned from one status to another. This should be when the un...
      - `message`: `string`, required - message is a human readable message indicating details about the transition. This may be an empty string.
      - `observedGeneration`: `integer`, optional - observedGeneration represents the .metadata.generation that the condition was set based upon. For instance, if .metad...
      - `reason`: `string`, required - reason contains a programmatic identifier indicating the reason for the condition's last transition. Producers of spe...
      - `status`: `string`, required, enum=True,False,Unknown - status of the condition, one of True, False, Unknown.
      - `type`: `string`, required - type of condition in CamelCase or in foo.example.com/CamelCase.
  - `endTime`: `string`, optional
  - `jobs`: `array`, optional
    - `items`: `object`, optional
      - `message`: `string`, optional
      - `name`: `string`, optional
      - `phase`: `string`, optional
  - `phase`: `string`, optional
  - `startTime`: `string`, optional

---

## Addon

- Group: `rlinf.io`
- Version: `v1alpha1`
- Scope: `Namespaced`
- Resource: `addons`

### Operations

#### `GET /api/v1/rlinf.io/v1alpha1/addons`

List addons resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `AddonList`
- `401` Unauthorized

#### `POST /api/v1/rlinf.io/v1alpha1/addons`

Create an Addon resource.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `dryRun` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Addon`

Responses:
- `201` Created → `Addon`
- `202` Accepted → `Addon`
- `401` Unauthorized

#### `DELETE /api/v1/rlinf.io/v1alpha1/addons`

Delete a collection of addons resources.

Parameters:
- `namespace` (query)
- `pretty` (query, optional)
- `continue` (query, optional)
- `limit` (query, optional)
- `fieldSelector` (query, optional)
- `labelSelector` (query, optional)

Responses:
- `200` OK → `Status`
- `401` Unauthorized

#### `GET /api/v1/rlinf.io/v1alpha1/addons/{name}`

Get an Addon resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Addon`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/addons/{name}`

Replace an Addon resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Addon`

Responses:
- `200` OK → `Addon`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/addons/{name}`

Patch an Addon resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Addon`

Responses:
- `200` OK → `Addon`
- `401` Unauthorized
- `404` Not Found

#### `DELETE /api/v1/rlinf.io/v1alpha1/addons/{name}`

Delete an Addon resource.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Status`
- `202` Accepted → `Status`
- `401` Unauthorized
- `404` Not Found

#### `GET /api/v1/rlinf.io/v1alpha1/addons/{name}/status`

Get the status subresource for Addon.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)

Responses:
- `200` OK → `Addon`
- `401` Unauthorized
- `404` Not Found

#### `PUT /api/v1/rlinf.io/v1alpha1/addons/{name}/status`

Replace the status subresource for Addon.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)

Request body: `Addon`

Responses:
- `200` OK → `Addon`
- `202` Accepted → `Addon`
- `401` Unauthorized
- `404` Not Found

#### `PATCH /api/v1/rlinf.io/v1alpha1/addons/{name}/status`

Patch the status subresource for Addon.

Parameters:
- `namespace` (query)
- `name` (path)
- `pretty` (query, optional)
- `fieldManager` (query, optional)
- `fieldValidation` (query, optional)
- `force` (query, optional)

Request body: `Addon`

Responses:
- `200` OK → `Addon`
- `202` Accepted → `Addon`
- `401` Unauthorized
- `404` Not Found

### Request Schema

- `apiVersion`: `string`, optional
- `kind`: `string`, optional
- `metadata`: `object`, optional
- `spec`: `object`, optional
  - `addonName`: `string`, optional - Name of the addon from the catalog
  - `version`: `string`, optional - Addon version to install
  - `values`: `object`, optional - Key-value configuration overrides for the addon
- `status`: `object`, optional
  - `phase`: `string`, optional - `Pending` / `Installing` / `Ready` / `Failed` / `Upgrading`
  - `version`: `string`, optional - Installed addon version
  - `message`: `string`, optional - Human-readable status message
  - `conditions`: `array`, optional - Status conditions

---

## Pod Terminal

### `GET /api/v1/rlinf.io/v1alpha1/pods/{name}/terminal`

Establish a WebSocket connection to a Pod's terminal for interactive remote access.

Parameters:
- `namespace` (query, optional): Pod namespace
- `name` (path): Pod name

The connection upgrades to the WebSocket protocol. The Server proxies the connection through the Agent to the target Pod's terminal.

---

## Pod HTTP Proxy

### `ANY /api/podproxy/{target}/*path`

Forward an HTTP request directly to a Pod through the Server → Agent proxy chain.

Parameters:
- `target` (path): Target in the format `<podName>:<port>` (e.g., `actor-head-0:8080`)
- `path` (path wildcard): The path to forward to the Pod's HTTP server

The Server resolves the Pod's real IP and Agent location via the pod cache, then proxies the request through the Agent's local HTTP server to the target Pod. The Agent acts as a reverse proxy, forwarding to `http://<podIP>:<port>/<path>`.

Example:

```bash
curl -X GET "http://localhost:8080/api/podproxy/actor-head-0:8080/health"
```

Responses:
- `200` OK → response from the target Pod
- `404` Not Found → Pod not found
- `503` Service Unavailable → Pod not ready

### `ANY /api/taskproxy/{target}/*path`

Forward an HTTP request directly to a Pod by Task name through the Server → Agent proxy chain. Same as Pod Proxy, but resolves the target Pod via Task name instead of Pod name.

Parameters:
- `target` (path): Target in the format `<taskName>:<port>` (e.g., `actor-head:8080`)
- `path` (path wildcard): The path to forward to the Pod's HTTP server

The Server resolves the Pod's real IP and Agent location via the pod cache, then proxies the request through the Agent's local HTTP server to the target Pod.

Example:

```bash
curl -X GET "http://localhost:8080/api/taskproxy/actor-head:8080/health"
```

Responses:
- `200` OK → response from the target Pod
- `404` Not Found → Task not found
- `503` Service Unavailable → Pod not ready

---

## TensorBoard Proxy

### `ANY /api/v1/rlinf.io/v1alpha1/tasks/{name}/tensorboard/*path`

Proxy TensorBoard UI and API requests to the TensorBoard instance running inside a Task's Pod (port 6006).

Parameters:
- `name` (path): Task name
- `path` (path wildcard): TensorBoard path to forward

The Gateway resolves the Task's Pod via the KCP API, constructs a proxy URL to the Server's Pod Proxy endpoint, and forwards the request. HTML/CSS responses are rewritten to ensure all asset paths work through the proxy prefix.

Example:

```bash
curl "http://localhost:8080/api/v1/rlinf.io/v1alpha1/tasks/actor-head/tensorboard/"
```

Responses:
- `200` OK → TensorBoard page or API response
- `404` Not Found → Task not found
- `503` Service Unavailable → Pod not ready or server address not configured

When listing Tasks, the response includes a `tensorBoardProxy` field with the relative proxy URL (e.g., `/api/v1/rlinf.io/v1alpha1/tasks/actor-head/tensorboard/`).

---

## Authentication

### `POST /api/v1/auth/login`

Authenticate a user via KCP secret and return the role.

Request body:

```json
{
  "username": "admin",
  "password": "your-password"
}
```

Responses:
- `200` OK → `{"ok": true, "role": "admin"}`
- `401` Unauthorized → `{"ok": false}`

---

## Storage

### `GET /api/v1/storage/storageclass`

List StorageClasses across multiple clusters. Proxies requests to agents via Server.

Parameters:
- `clusters` (query, optional): Comma-separated cluster IDs

Responses:

```json
{
  "data": {
    "ceph-rbd": {
      "name": "ceph-rbd",
      "clusters": ["agent-beijing", "agent-shanghai"],
      "description": "Ceph RBD StorageClass",
      "bucket": "",
      "provider": "s3",
      "endpoint": "https://s3.amazonaws.com",
      "region": "us-east-1",
      "pathStyle": false
    }
  },
  "success": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | StorageClass name |
| `clusters` | `[]string` | Cluster IDs where this StorageClass is available |
| `description` | `string` | Human-readable description |
| `bucket` | `string` | Storage bucket name |
| `provider` | `string` | Storage provider type (s3, gcs, azureblob, etc.) |
| `endpoint` | `string` | Storage service endpoint URL |
| `region` | `string` | Storage region |
| `pathStyle` | `bool` | Whether to use path-style addressing |

### `POST /api/v1/storage/storageclass`

Create a StorageClass. Currently returns `501 Not Implemented`.

### `GET /api/v1/storage/storageclass/provider`

List supported storage providers (AWS S3, Alibaba OSS, MinIO, Ceph, etc.).

Responses:

```json
{
  "data": [
    {"name": "AWS S3", "value": "AWS"},
    {"name": "Alibaba Cloud OSS", "value": "Alibaba"}
  ],
  "success": true
}
```

### `GET /api/v1/storage/storageclass/{cluster}/{name}/list`

List files in a StorageClass bucket.

Parameters:
- `cluster` (path): Cluster ID
- `name` (path): StorageClass name

Responses:

```json
{
  "data": [
    {"name": "model-checkpoint.pt", "size": 1048576, "modified": "2026-07-30T10:00:00Z"}
  ],
  "success": true
}
```

### `POST /api/v1/storage/storageclass/{cluster}/{name}/upload`

Upload a file to a StorageClass bucket. Uses multipart form data.

Parameters:
- `cluster` (path): Cluster ID
- `name` (path): StorageClass name

Request body: multipart/form-data with `file` field.

Responses:

```json
{
  "data": {"key": "model-checkpoint.pt", "size": 1048576},
  "success": true
}
```

### `GET /api/v1/storage/storageclass/{cluster}/{name}/object/*key`

Download an object from a StorageClass bucket. Returns the raw file content.

Parameters:
- `cluster` (path): Cluster ID
- `name` (path): StorageClass name
- `key` (path wildcard): Object key/path in the bucket

Responses:
- `200` OK → file content (binary)
- `404` Not Found

### `DELETE /api/v1/storage/storageclass/{cluster}/{name}/object/*key`

Delete an object from a StorageClass bucket.

Parameters:
- `cluster` (path): Cluster ID
- `name` (path): StorageClass name
- `key` (path wildcard): Object key/path in the bucket

Responses:

```json
{
  "data": {"deleted": true},
  "success": true
}
```

---

## Addon Catalog

### `GET /api/v1/addons`

List available addons from the addon catalog.

Responses:

```json
{
  "data": [
    {
      "name": "embodied-runtime-device-plugin",
      "version": "0.1.0",
      "description": "Device plugin for embodied AI runtime",
      "category": "device-plugin"
    }
  ],
  "success": true
}
```

### `GET /api/v1/addons/{name}`

Get details of a specific addon from the catalog.

Parameters:
- `name` (path): Addon name

Responses:

```json
{
  "data": {
    "name": "embodied-runtime-device-plugin",
    "version": "0.1.0",
    "description": "Device plugin for embodied AI runtime",
    "category": "device-plugin",
    "manifests": {
      "daemonset": "...",
      "configmap": "...",
      "rbac": "..."
    }
  },
  "success": true
}
```

---

## Installed Addons

### `GET /api/v1/installed-addons`

List installed addons across all clusters. Optionally filter by cluster.

Parameters:
- `cluster` (query, optional): Cluster ID to filter addons

Responses:

```json
{
  "data": [
    {
      "name": "embodied-runtime-device-plugin",
      "version": "0.1.0",
      "cluster": "agent-beijing",
      "phase": "Ready",
      "message": "Addon installed successfully"
    }
  ],
  "success": true
}
```

---

## Cluster Addons

### `GET /api/v1/clusters/{cluster_id}/addons`

List addons installed in a specific cluster.

Parameters:
- `cluster_id` (path): Cluster ID

### `POST /api/v1/clusters/{cluster_id}/addons`

Install an addon to a cluster.

Parameters:
- `cluster_id` (path): Cluster ID

Request body:

```json
{
  "addonName": "embodied-runtime-device-plugin",
  "version": "0.1.0",
  "values": {
    "image": "my-registry/device-plugin:latest"
  }
}
```

### `GET /api/v1/clusters/{cluster_id}/addons/{name}`

Get details of an installed addon in a cluster.

Parameters:
- `cluster_id` (path): Cluster ID
- `name` (path): Addon name

### `PUT /api/v1/clusters/{cluster_id}/addons/{name}`

Update an installed addon configuration.

Parameters:
- `cluster_id` (path): Cluster ID
- `name` (path): Addon name

### `DELETE /api/v1/clusters/{cluster_id}/addons/{name}`

Uninstall an addon from a cluster.

Parameters:
- `cluster_id` (path): Cluster ID
- `name` (path): Addon name

---

## Clusters

### `GET /api/v1/clusters`

List aggregated cluster information from all data plane nodes.

Responses:

```json
{
  "data": [
    {
      "id": "agent-beijing",
      "name": "Beijing GPU Cluster",
      "type": "cloud",
      "phase": "Online",
      "cloudNodes": 4,
      "embodiedNodes": 0,
      "robots": 0,
      "gpuModels": ["A100"],
      "cpuUsage": 0.45,
      "gpuUsage": 0.72,
      "runningJobs": 3,
      "description": "Beijing GPU training cluster"
    }
  ],
  "success": true
}
```

---

## Job Logs

### `GET /api/v1/rlinf.io/v1alpha1/jobs/{name}/logs`

Retrieve logs for all pods belonging to a job. Proxies to agents via Server.

Parameters:
- `name` (path): Job name

Responses:

```json
{
  "pods": [
    {
      "taskName": "actor-head",
      "podName": "actor-head-0",
      "phase": "Running",
      "node": "gpu-node-01",
      "logs": "Training started...\nEpoch 1/100..."
    }
  ]
}
```

