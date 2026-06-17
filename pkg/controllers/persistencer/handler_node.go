package persistencer

import (
	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/clients/db"
)

// NodeSyncHandler handles syncing Node resources.
type NodeSyncHandler struct {
	*GenericSyncHandlerImpl[*rlarkv1alpha1.Node, *db.NodeModel]
}

// NewNodeSyncHandler creates a new sync handler for Node resources.
func NewNodeSyncHandler() *NodeSyncHandler {
	return &NodeSyncHandler{
		GenericSyncHandlerImpl: NewGenericSyncHandler[*rlarkv1alpha1.Node, *db.NodeModel](
			"nodes.rlinf.io",
			func() *db.NodeModel { return &db.NodeModel{} },
			extractNodeIndexFields,
			WithShouldSync[*rlarkv1alpha1.Node, *db.NodeModel](shouldSyncNode),
		),
	}
}

func shouldSyncNode(node *rlarkv1alpha1.Node) bool {
	if _, ok := node.Annotations["skip-sync"]; ok {
		return false
	}
	return true
}

func extractNodeIndexFields(node *rlarkv1alpha1.Node) map[string]interface{} {
	fields := make(map[string]interface{})
	if node.Status.Phase != "" {
		fields["status.phase"] = string(node.Status.Phase)
	}
	if node.Spec.AgentType != "" {
		fields["spec.agentType"] = string(node.Spec.AgentType)
	}
	return fields
}
