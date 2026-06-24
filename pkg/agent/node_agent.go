package agent

import "context"

// node agent
// 节点级别的 Agent，主要负责节点和控制面之间的通信和管理
type nodeAgent struct {
	a *Agent
}

func (n *nodeAgent) Run(ctx context.Context) error {
	<-ctx.Done()
	return nil
}
