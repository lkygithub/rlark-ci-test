package reverseproxy

import (
	"context"
	"fmt"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/rancher/remotedialer"
)

var (
	ClientKeyHeader = "X-API-Tunnel-Client-Key"
	PeerIDHeader    = remotedialer.ID
	PeerTokenHeader = remotedialer.Token
)

type client struct {
	key     string
	connCnt int
	errCnt  int
}

func (c *client) onConnect() error {
	if c.connCnt > 0 {
		// 当有相同 clientKey 的连接存在时，暂时不接受新的连接，让代理的连接尽可能均衡地分布在不同的 server 实例上
		// 如果连续出现多个连接，说明可能连接已经较为均衡了，因此允许多个连接存在
		if c.errCnt < 5 {
			c.errCnt++
			return fmt.Errorf("client %s already connected", c.key)
		}
	}
	c.connCnt++
	c.errCnt = 0
	return nil
}

func (c *client) onDisconnect() {
	if c.connCnt > 0 {
		c.connCnt--
		c.errCnt = 0
	}
}

type DialerFactory struct {
	dialerServer *remotedialer.Server

	clients map[string]*client
	mutex   sync.Mutex
}

func NewDialerFactory() *DialerFactory {
	f := &DialerFactory{
		clients: make(map[string]*client),
	}
	f.dialerServer = remotedialer.New(f.auth, remotedialer.DefaultErrorWriter)
	f.dialerServer.PeerID = uuid.NewString()
	f.dialerServer.PeerToken = uuid.NewString()
	return f
}

func (f *DialerFactory) auth(req *http.Request) (string, bool, error) {
	clientKey := req.Header.Get(ClientKeyHeader)
	if clientKey == "" {
		return "", false, fmt.Errorf("invalid client key")
	}
	return clientKey, true, nil
}

func (f *DialerFactory) addClient(clientKey string) error {
	f.mutex.Lock()
	defer f.mutex.Unlock()

	c, ok := f.clients[clientKey]
	if !ok {
		c = &client{
			key: clientKey,
		}
		f.clients[clientKey] = c
	}
	err := c.onConnect()
	if c.connCnt == 0 {
		delete(f.clients, clientKey)
	}
	return err
}

func (f *DialerFactory) removeClient(clientKey string) {
	f.mutex.Lock()
	defer f.mutex.Unlock()

	c, ok := f.clients[clientKey]
	if ok {
		c.onDisconnect()
		if c.connCnt == 0 {
			delete(f.clients, clientKey)
		}
	}
}

func (f *DialerFactory) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	if req.Header.Get(PeerIDHeader) != "" && req.Header.Get(PeerTokenHeader) != "" {
		f.dialerServer.ServeHTTP(rw, req)
		return
	}

	clientKey, _, err := f.auth(req)
	if err != nil {
		remotedialer.DefaultErrorWriter(rw, req, http.StatusBadRequest, err)
		return
	}

	if err := f.addClient(clientKey); err != nil {
		remotedialer.DefaultErrorWriter(rw, req, http.StatusInternalServerError, err)
		return
	}
	defer f.removeClient(clientKey)

	f.dialerServer.ServeHTTP(rw, req)
}

func (f *DialerFactory) GetDialer(ctx context.Context, clientKey string) remotedialer.Dialer {
	return f.dialerServer.Dialer(clientKey)
}

func (f *DialerFactory) GetPeerID() string {
	return f.dialerServer.PeerID
}

func (f *DialerFactory) GetPeerToken() string {
	return f.dialerServer.PeerToken
}

func (f *DialerFactory) AddPeer(server, peerID, peerToken string) {
	f.dialerServer.AddPeer(server, peerID, peerToken)
}

func (f *DialerFactory) RemovePeer(peerID string) {
	f.dialerServer.RemovePeer(peerID)
}

func SetPeerHeaders(req *http.Request, peerID, peerToken string) {
	if req.Header == nil {
		req.Header = make(http.Header)
	}
	req.Header.Del(ClientKeyHeader)
	req.Header.Del(PeerIDHeader)
	req.Header.Del(PeerTokenHeader)

	req.Header.Set(PeerIDHeader, peerID)
	req.Header.Set(PeerTokenHeader, peerToken)
}

func SetClientHeader(req *http.Request, clientKey string) {
	if req.Header == nil {
		req.Header = make(http.Header)
	}
	req.Header.Del(ClientKeyHeader)
	req.Header.Del(PeerIDHeader)
	req.Header.Del(PeerTokenHeader)

	req.Header.Set(ClientKeyHeader, clientKey)
}
