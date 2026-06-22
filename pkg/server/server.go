package server

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/leaderelection"
	"k8s.io/client-go/tools/leaderelection/resourcelock"

	"github.com/rlinf/rlark/pkg/clients/db"
	"github.com/rlinf/rlark/pkg/clients/kubernetes/clientset/versioned"
	"github.com/rlinf/rlark/pkg/server/cert"
	"github.com/rlinf/rlark/pkg/server/reverseproxy"
)

// Server is the main struct for the server application, encapsulating all components and dependencies.
type Server struct {
	// config holds the server configuration parameters.
	config *Config

	restConfig  *rest.Config
	kubeClient  kubernetes.Interface
	rlarkClient versioned.Interface
	kubeHandler http.Handler

	dbClient *db.DB // may be nil if DBConfigPath is not provided, should be checked before use

	tlsCA *cert.Data
	tls   cert.Data
	ca    []cert.Data

	dialerFactory         *reverseproxy.DialerFactory
	defaultProxyTransport http.RoundTripper
	defaultPeerTransport  http.RoundTripper
}

// NewServer creates a new Server instance with the provided configuration.
func NewServer(config *Config) *Server {
	s := &Server{
		config: config,

		ca: make([]cert.Data, 0),

		dialerFactory: reverseproxy.NewDialerFactory(),
	}
	s.defaultProxyTransport = &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			dial, address, err := s.GetDial(ctx, "default", addr, nil)
			if err != nil {
				return nil, fmt.Errorf("get dial for address %s: %w", addr, err)
			}
			return dial(ctx, network, address)
		},
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true,
		},
	}
	return s
}

func (s *Server) Run(ctx context.Context) error {
	if err := s.init(ctx); err != nil {
		return err
	}

	var eg errgroup.Group
	eg.Go(func() error {
		return s.runBroadcaster(ctx)
	})
	eg.Go(func() error {
		return s.runPeerTunnel(ctx)
	})
	eg.Go(func() error {
		return s.runHTTPSServer(ctx)
	})
	eg.Go(func() error {
		return s.runSSHServer(ctx)
	})
	eg.Go(func() error {
		return s.runUnsafeHTTPServer(ctx)
	})

	if err := eg.Wait(); err != nil {
		return fmt.Errorf("server run error: %w", err)
	}
	return nil
}

func (s *Server) init(ctx context.Context) error {
	// 初始化服务器

	// 1. 连接 Kubernetes API
	if err := s.initKubeClient(ctx); err != nil {
		return err
	}

	// 2. 连接数据库
	if err := s.initDatabase(ctx); err != nil {
		return err
	}

	// 3. 通过 Kubernetes Lease 获取操作权，进行数据初始化
	id := fmt.Sprintf("%s-%d", os.Getenv("HOSTNAME"), os.Getpid())
	rl, err := resourcelock.New(
		resourcelock.LeasesResourceLock,
		s.config.Namespace(),
		"rlark-server-init-lock",
		s.kubeClient.CoreV1(),
		s.kubeClient.CoordinationV1(),
		resourcelock.ResourceLockConfig{
			Identity: id,
		},
	)
	if err != nil {
		return fmt.Errorf("create resource lock: %w", err)
	}
	initServerDataErrorCh := make(chan error)
	defer close(initServerDataErrorCh)
	le, err := leaderelection.NewLeaderElector(leaderelection.LeaderElectionConfig{
		Lock:          rl,
		LeaseDuration: time.Second * 5,
		RenewDeadline: time.Second * 2,
		RetryPeriod:   time.Second * 1,
		Callbacks: leaderelection.LeaderCallbacks{
			OnStartedLeading: func(ctx context.Context) {
				initServerDataErrorCh <- s.initServerData(ctx)
				<-ctx.Done()
			},
			OnStoppedLeading: func() {},
			OnNewLeader:      func(identity string) {},
		},
	})
	if err != nil {
		return fmt.Errorf("create leader elector: %w", err)
	}

	leCtx, leCancel := context.WithCancel(ctx)
	go le.Run(leCtx)

	err = <-initServerDataErrorCh
	leCancel()
	return err
}

func (s *Server) initKubeClient(ctx context.Context) error {
	var err error
	s.restConfig, err = s.config.KubeClientConfig.BuildRestConfig()
	if err != nil {
		return fmt.Errorf("build Kubernetes client config: %w", err)
	}
	s.kubeClient, err = kubernetes.NewForConfig(s.restConfig)
	if err != nil {
		return fmt.Errorf("create Kubernetes client: %w", err)
	}
	s.rlarkClient, err = versioned.NewForConfig(s.restConfig)
	if err != nil {
		return fmt.Errorf("create RLark client: %w", err)
	}
	kubeProxy, err := NewKubeProxy(s.restConfig)
	if err != nil {
		return fmt.Errorf("create Kubernetes proxy: %w", err)
	}
	s.kubeHandler = kubeProxy.GetHandler()
	return nil
}

func (s *Server) initDatabase(ctx context.Context) error {
	if s.config.DBConfigPath == "" {
		logrus.Warningf("RLark server is running without persistent storage.")
		return nil
	}

	dbConfig := db.DefaultConfig()
	data, err := os.ReadFile(s.config.DBConfigPath)
	if err != nil {
		return fmt.Errorf("read database config file: %w", err)
	}
	if err := db.UnmarshalConfig(data, &dbConfig); err != nil {
		return fmt.Errorf("unmarshal database config: %w", err)
	}

	s.dbClient, err = db.Open(dbConfig)
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}
	return nil
}

func (s *Server) initServerData(ctx context.Context) error {
	// 假设已经获取了操作权，开始进行数据初始化

	// 1. 检查 Kubernetes 是否安装了必要的 CRD，以及 CRD 的版本是否正确。
	// TODO

	// 2. 检查 Kubernetes 中保存的各个配置，如果没有则初始化。
	// TODO
	if err := s.loadTLSCA(ctx); err != nil {
		return fmt.Errorf("load TLS CA: %w", err)
	}
	if err := s.loadTLSConfig(ctx); err != nil {
		return fmt.Errorf("load TLS config: %w", err)
	}
	if err := s.initCAConfigs(ctx); err != nil {
		return fmt.Errorf("initialize CA configs: %w", err)
	}
	if err := s.signAdminCert(ctx); err != nil {
		return fmt.Errorf("sign admin certificate: %w", err)
	}
	if err := s.initPeerTransport(ctx); err != nil {
		return fmt.Errorf("initialize peer transport: %w", err)
	}

	// 3. 检查数据库中的表结构和索引，如果不正确则进行迁移。
	if s.dbClient != nil {
		// TODO: perform database migration if necessary
	}

	return nil
}
