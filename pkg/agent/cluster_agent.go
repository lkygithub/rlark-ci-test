package agent

import "context"

// cluster agent
// 集群级别的 Agent，主要负责集群和控制面之间的通信和管理
type clusterAgent struct {
	a *Agent
}

func (c *clusterAgent) Run(ctx context.Context) error {
	// TODO: run controller manager.

	<-ctx.Done()
	return nil
}
