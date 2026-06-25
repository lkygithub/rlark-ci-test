package agent

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"time"

	"github.com/rlinf/rlark/pkg/clients/kubernetes/informers/externalversions"
	listerv1alpha1 "github.com/rlinf/rlark/pkg/clients/kubernetes/listers/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/network/nodeserver"
	"github.com/rlinf/rlark/pkg/utils"
)

// node agent
// 节点级别的 Agent，主要负责节点和控制面之间的通信和管理
type nodeAgent struct {
	a *Agent

	domainPeerLister listerv1alpha1.DomainPeerLister
}

func (n *nodeAgent) Run(ctx context.Context) error {
	factory := externalversions.NewSharedInformerFactory(n.a.managementClient, 30*time.Minute)
	n.domainPeerLister = factory.Rlinf().V1alpha1().DomainPeers().Lister()
	factory.Start(ctx.Done())

	nodeserver := nodeserver.NewNodeServer(
		n.a.config.NodeServerConfig,
		n.getContainerNetworkCred,
		n.getContainerNetworkDial,
	)

	return nodeserver.Run(ctx)
}

type containerNetworkCred struct{}

func (n *nodeAgent) getContainerNetworkCred(ctx context.Context, pid int32) (*containerNetworkCred, error) {
	// TODO: 根据 pid 获取容器网络的凭证信息
	// 暂时返回一个空的凭证
	return &containerNetworkCred{}, nil
}

func (n *nodeAgent) getContainerNetworkDial(ctx context.Context, cred *containerNetworkCred, host string, query url.Values) (utils.Dial, error) {
	// 根据凭证确定容器所属网络，暂时从 query 中获取
	domain := query.Get("domain")
	if domain == "" {
		return nil, fmt.Errorf("container do not have domain information")
	}

	// TODO: 根据 domain 获取容器网络的 dialer
	dpeer, err := n.domainPeerLister.DomainPeers(n.a.config.ClientConfig.ServerNamespace).Get(domain)
	if err != nil {
		return nil, fmt.Errorf("get domain peer: %w", err)
	}
	var globalNamespace string
	var node string
	for _, pod := range dpeer.Spec.Pods {
		if pod.Name == host || pod.IP == host {
			globalNamespace = pod.GlobalNamespace
			node = pod.Node
			break
		}
	}
	if globalNamespace == "" || node == "" {
		return func(ctx context.Context) (net.Conn, error) {
			return nil, fmt.Errorf("server not found")
		}, nil
	}
	// 1. 如果在同一个集群内，可以直接通过节点访问
	if globalNamespace == n.a.config.ClientConfig.ServerNamespace {
		// TODO
		_ = node
	}

	// 2. 如果不在同一个集群内，但是可以直接访问到目标节点，也可以直接通过节点访问
	// TODO

	// 3. 不在同一个集群内，且无法直接访问到目标节点，则通过控制面代理进行访问
	// TODO

	return nil, fmt.Errorf("container network dialer for domain %s not implemented", domain)
}
