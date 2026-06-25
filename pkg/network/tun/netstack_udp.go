package tun

import (
	"context"
	"sync"

	"github.com/sirupsen/logrus"
	"gvisor.dev/gvisor/pkg/tcpip"
	"gvisor.dev/gvisor/pkg/tcpip/adapters/gonet"
	"gvisor.dev/gvisor/pkg/tcpip/stack"
	"gvisor.dev/gvisor/pkg/tcpip/transport/udp"
	"gvisor.dev/gvisor/pkg/waiter"
)

// getUDPHandler 返回 UDP 数据包转发处理函数。
//
// 使用 gVisor 的 udp.NewForwarder 拦截所有 UDP 数据包。
// 对每个（虚拟 src:port → 目标 dst:port）的 UDP 流：
//  1. 在 gVisor 栈内创建 UDP endpoint
//  2. 通过 ns.udpDialer 创建 TCP 连接到 Proxy
//  3. 双向转发：UDP 数据包通过 SendPacket/RecvPacket 在 TCP 上做帧封装
func (ns *netstack) getUDPHandler(s *stack.Stack) func(id stack.TransportEndpointID, pkt *stack.PacketBuffer) bool {
	udpForwarder := udp.NewForwarder(s, func(r *udp.ForwarderRequest) {
		id := r.ID()
		srcIP := id.RemoteAddress
		srcPort := id.RemotePort
		dstIP := id.LocalAddress
		dstPort := id.LocalPort

		var wq waiter.Queue
		ep, err := r.CreateEndpoint(&wq)
		if err != nil {
			logrus.Warningf("Failed to create UDP endpoint for %s:%d: %v", dstIP, dstPort, err)
			return
		}
		go ns.handleUDPFlow(gonet.NewUDPConn(&wq, ep), srcIP, srcPort, dstIP, dstPort)
	})
	return udpForwarder.HandlePacket
}

// handleUDPFlow 通过 Proxy 转发单个 UDP 流。
//
// 在 gVisor UDP endpoint 和 Proxy 的 TCP 连接之间做双向帧转发。
//
// 防泄漏机制：当任意方向的 I/O 失败时，关闭底层连接以终止另一方向的阻塞 I/O，
// 确保 goroutine 不会泄漏。使用 sync.WaitGroup 等待双方 goroutine 结束。
func (ns *netstack) handleUDPFlow(gConn *gonet.UDPConn, srcIP tcpip.Address, srcPort uint16, dstIP tcpip.Address, dstPort uint16) {
	defer func() { _ = gConn.Close() }()

	logrus.Debugf("Forwarding UDP: %s:%d - %s:%d", srcIP, srcPort, dstIP, dstPort)
	realConn, err := ns.dial(context.Background(), "udp", srcIP, srcPort, dstIP, dstPort)
	if err != nil {
		logrus.Errorf("Failed to dial UDP for target %s:%d: %v", dstIP, dstPort, err)
		return
	}
	defer func() { _ = realConn.Close() }()

	var wg sync.WaitGroup
	wg.Add(2)

	// gVisor → Proxy：从 gVisor UDP 连接读数据报，帧封装后发往 Proxy
	go func() {
		defer wg.Done()
		defer func() { _ = realConn.Close() }() // 关闭 TCP 以终止另一侧的阻塞 RecvPacket
		buf := make([]byte, 65535)
		for {
			n, err := gConn.Read(buf)
			if err != nil {
				return
			}
			if err := SendPacket(realConn, buf[:n]); err != nil {
				return
			}
		}
	}()

	// Proxy → gVisor：从 Proxy 接收帧封装的数据报，写入 gVisor UDP 连接
	go func() {
		defer wg.Done()
		defer func() { _ = gConn.Close() }() // 关闭 gVisor 连接以终止另一侧的阻塞 Read
		for {
			data, err := RecvPacket(realConn)
			if err != nil {
				return
			}
			if data == nil {
				continue
			}
			if _, err := gConn.Write(data); err != nil {
				return
			}
		}
	}()

	wg.Wait()
}
