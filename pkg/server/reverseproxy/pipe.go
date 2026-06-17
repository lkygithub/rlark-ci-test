package reverseproxy

import (
	"io"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/xjasonlyu/tun2socks/v2/buffer"
)

const (
	// tcpWaitTimeout implements a TCP half-close timeout.
	tcpWaitTimeout = 60 * time.Second
)

// PipeConnections pipes bidirectional data between origin and remote connections.
func PipeConnections(origin, remote io.ReadWriteCloser) {
	wg := sync.WaitGroup{}
	wg.Add(2)

	go unidirectionalStream(remote, origin, "origin->remote", &wg)
	go unidirectionalStream(origin, remote, "remote->origin", &wg)

	wg.Wait()
}

func unidirectionalStream(dst, src io.ReadWriteCloser, dir string, wg *sync.WaitGroup) {
	defer wg.Done()
	buf := buffer.Get(buffer.RelayBufferSize)
	if _, err := io.CopyBuffer(dst, src, buf); err != nil {
		logrus.Debugf("[TCP] copy data for %s: %v", dir, err)
	}
	if err := buffer.Put(buf); err != nil {
		logrus.Debugf("[TCP] put buffer for %s: %v", dir, err)
	}
	// Do the upload/download side TCP half-close.
	if cr, ok := src.(interface{ CloseRead() error }); ok {
		if err := cr.CloseRead(); err != nil {
			logrus.Debugf("[TCP] close read for %s: %v", dir, err)
		}
	}
	if cw, ok := dst.(interface{ CloseWrite() error }); ok {
		if err := cw.CloseWrite(); err != nil {
			logrus.Debugf("[TCP] close write for %s: %v", dir, err)
		}
	}
	// Set TCP half-close timeout.
	if srd, ok := dst.(interface{ SetReadDeadline(time.Time) error }); ok {
		if err := srd.SetReadDeadline(time.Now().Add(tcpWaitTimeout)); err != nil {
			logrus.Debugf("[TCP] set read deadline for %s: %v", dir, err)
		}
	}
}
