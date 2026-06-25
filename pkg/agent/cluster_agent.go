package agent

import (
	"cmp"
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/rlinf/rlark/pkg/agent/controllers"
	"github.com/rlinf/rlark/pkg/agent/controllers/base"
	"github.com/rlinf/rlark/pkg/agent/controllers/node"
	"github.com/rlinf/rlark/pkg/agent/controllers/task"
	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
)

// clusterAgent manages cluster-level operations (controller manager)
type clusterAgent struct {
	a *Agent
}

func (c *clusterAgent) Run(ctx context.Context) error {
	agentType := c.a.config.AgentType
	clusterID := cmp.Or(c.a.config.ClientConfig.ServerNamespace, "default")

	mm, err := ctrl.NewManager(c.a.managementConfig, ctrl.Options{
		Scheme: controllers.MgmtScheme,
	})
	if err != nil {
		return fmt.Errorf("create management manager: %w", err)
	}
	mclient, err := client.New(c.a.managementConfig, client.Options{Scheme: controllers.MgmtScheme})
	if err != nil {
		return fmt.Errorf("create management direct client: %w", err)
	}

	bc := base.BaseController{
		ManagementClient:    mclient,
		ManagementNamespace: clusterID,
		AgentType:           agentType,
	}

	var lm interface {
		Start(ctx context.Context) error
	}

	switch rlarkv1alpha1.AgentType(agentType) {
	case rlarkv1alpha1.AgentTypeKubernetes:
		if c.a.localKubeConfig == nil {
			return fmt.Errorf("local kube config is required for kubernetes agent")
		}
		m, err := ctrl.NewManager(c.a.localKubeConfig, ctrl.Options{
			Scheme: controllers.MgmtScheme,
		})
		if err != nil {
			return fmt.Errorf("create local manager: %w", err)
		}
		lclient, err := client.New(c.a.localKubeConfig, client.Options{Scheme: controllers.MgmtScheme})
		if err != nil {
			return fmt.Errorf("create local direct client: %w", err)
		}
		bc.LocalKubeClient = lclient
		lm = m

	case rlarkv1alpha1.AgentTypeDocker:
		// TODO: initialize Docker controller manager
		return fmt.Errorf("docker agent is not implemented yet")

	case rlarkv1alpha1.AgentTypeRaw:
		// TODO: initialize Raw controller manager
		return fmt.Errorf("raw agent is not implemented yet")

	default:
		return fmt.Errorf("unknown AgentType: %s", agentType)
	}

	// Setup Task controllers
	tc := task.NewTaskController(bc)
	if err := tc.SetupPullController(mm); err != nil {
		return fmt.Errorf("setup task pull controller: %w", err)
	}
	if err := tc.SetupPushController(lm); err != nil {
		return fmt.Errorf("setup task push controller: %w", err)
	}

	// Setup Node controllers
	nc := node.NewNodeController(bc)
	if err := nc.SetupPullController(mm); err != nil {
		return fmt.Errorf("setup node pull controller: %w", err)
	}
	if err := nc.SetupPushController(lm); err != nil {
		return fmt.Errorf("setup node push controller: %w", err)
	}

	var eg errgroup.Group
	eg.Go(func() error { return mm.Start(ctx) })
	eg.Go(func() error { return lm.Start(ctx) })
	return eg.Wait()
}
