package container

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"strings"

	"golang.org/x/crypto/ssh"

	"github.com/rlinf/rlark/pkg/apis"
	"github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
	listerv1alpha1 "github.com/rlinf/rlark/pkg/clients/kubernetes/listers/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/utils"
)

type containerNetworkCred struct {
	containerID        string
	podID              string
	domainID           string
	domainIP           string
	domainPrefixLength int
}

func (c containerNetworkCred) IP() string {
	return c.domainIP
}

func (c containerNetworkCred) IPPrefixLength() int {
	return c.domainPrefixLength
}

type containerNetworkAdapter struct {
	globalNamespace     string
	domainPeerLister    listerv1alpha1.DomainPeerLister
	managementPodLister listerv1alpha1.PodLister
	sshAddr             string
	sshDialer           *SSHDialer
}

func NewContainerNetworkAdapter(
	globalNamespace string,
	domainPeerLister listerv1alpha1.DomainPeerLister,
	managementPodLister listerv1alpha1.PodLister,
	sshAddr string,
	sshHostKey string,
) *containerNetworkAdapter {
	hostKeyCallback := makeHostKeyCallback(sshHostKey)
	return &containerNetworkAdapter{
		globalNamespace:     globalNamespace,
		domainPeerLister:    domainPeerLister,
		managementPodLister: managementPodLister,
		sshAddr:             sshAddr,
		sshDialer: NewSSHDialer(SSHDialerConfig{
			HostKeyCallback: hostKeyCallback,
		}),
	}
}

// makeHostKeyCallback 解析 SSH 主机公钥字符串，返回对应的 HostKeyCallback。
// 空字符串时使用 InsecureIgnoreHostKey（仅开发环境）。
func makeHostKeyCallback(sshHostKey string) ssh.HostKeyCallback {
	if sshHostKey == "" {
		return ssh.InsecureIgnoreHostKey()
	}
	pk, _, _, _, err := ssh.ParseAuthorizedKey([]byte(sshHostKey))
	if err != nil {
		// 解析失败时 fallback 到 insecure，避免服务完全无法启动
		return ssh.InsecureIgnoreHostKey()
	}
	return ssh.FixedHostKey(pk)
}

func (a *containerNetworkAdapter) GetContainerNetworkCred(ctx context.Context, pid int32) (*containerNetworkCred, error) {
	// 根据 pid 获取进程所属容器/pod 的信息，获取其所属的 domain，以及 domain 的网络信息
	sourceType, source, err := a.getProcessNetworkInfo(ctx, pid)
	if err != nil {
		return nil, fmt.Errorf("get process network info: %w", err)
	}

	switch sourceType {
	case "pod":
		domain, err := a.getPodDomainByPodUID(ctx, source)
		if err != nil {
			return nil, fmt.Errorf("get pod domain by pod UID: %w", err)
		}
		dpeer, err := a.domainPeerLister.DomainPeers(a.globalNamespace).Get(domain)
		if err != nil {
			return nil, fmt.Errorf("get domain peer: %w", err)
		}
		ret := containerNetworkCred{
			podID:              source,
			domainID:           dpeer.Name,
			domainPrefixLength: dpeer.Spec.PrefixLen,
		}
		for _, pod := range dpeer.Spec.Pods {
			if pod.UID == source {
				ret.domainIP = pod.IP
				break
			}
		}
		if ret.domainIP == "" {
			return nil, fmt.Errorf("pod %s not found in domain peer %s", source, dpeer.Name)
		}
		return &ret, nil

	default:
		return nil, fmt.Errorf("unsupported source type: %s", sourceType)
	}
}

func (a *containerNetworkAdapter) getPodDomainByPodUID(ctx context.Context, podUID string) (string, error) {
	pod, err := a.managementPodLister.Pods(a.globalNamespace).Get(podUID) // pod UID 即为 pod 在控制面的名称
	if err != nil {
		return "", err
	}
	return pod.Spec.Domain, nil
}

func (a *containerNetworkAdapter) GetContainerNetworkDial(ctx context.Context, cred *containerNetworkCred, host string, query url.Values) (utils.Dial, error) {
	dpeer, err := a.domainPeerLister.DomainPeers(a.globalNamespace).Get(cred.domainID)
	if err != nil {
		return nil, fmt.Errorf("get domain peer: %w", err)
	}
	var targetPod v1alpha1.DomainPodInfo
	for _, pod := range dpeer.Spec.Pods {
		if pod.Name == host || pod.IP == host {
			targetPod = pod
			break
		}
	}
	if targetPod.Node == "" || targetPod.IP == "" {
		return func(ctx context.Context) (net.Conn, error) {
			return nil, fmt.Errorf("server not found")
		}, nil
	}
	// 1. 如果在同一个集群内，可以直接通过节点访问
	if targetPod.GlobalNamespace == a.globalNamespace {
		return func(ctx context.Context) (net.Conn, error) {
			var dialer net.Dialer
			// 直接通过目标 Pod 的 LocalIP 访问其 57 端口（proxy 端口）
			return dialer.DialContext(ctx, "tcp", net.JoinHostPort(targetPod.LocalIP, "57"))
		}, nil
	}

	// 2. 如果不在同一个集群内，但是可以直接访问到目标节点，也可以直接通过节点访问
	// TODO

	// 3. 不在同一个集群内，且无法直接访问到目标节点，则通过控制面代理进行访问
	if agentID, ok := strings.CutPrefix(targetPod.GlobalNamespace, apis.RLarkAgentNamespacePrefix); ok {
		target := fmt.Sprintf("%s.%s.agent:57", host, agentID)
		return func(ctx context.Context) (net.Conn, error) {
			return a.sshDialer.DialContext(ctx, cred.domainID, a.sshAddr, dpeer.Spec.Cert, dpeer.Spec.Key, target)
		}, nil
	}

	return nil, fmt.Errorf("container network dialer for domain %s not implemented", cred.domainID)
}
