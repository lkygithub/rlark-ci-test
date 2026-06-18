package server

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
	"k8s.io/client-go/kubernetes"
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

	kubeClient  kubernetes.Interface
	rlarkClient versioned.Interface
	dbClient    *db.DB // may be nil if DBConfigPath is not provided, should be checked before use

	tls cert.Data
	ca  []cert.Data

	dialerFactory *reverseproxy.DialerFactory
}

// NewServer creates a new Server instance with the provided configuration.
func NewServer(config *Config) *Server {
	return &Server{
		config: config,

		ca: make([]cert.Data, 0),

		dialerFactory: reverseproxy.NewDialerFactory(),
	}
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
		return s.runHTTPServer(ctx)
	})
	eg.Go(func() error {
		return s.runSSHServer(ctx)
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
	restConfig, err := s.config.KubeClientConfig.BuildRestConfig()
	if err != nil {
		return fmt.Errorf("build Kubernetes client config: %w", err)
	}
	s.kubeClient, err = kubernetes.NewForConfig(restConfig)
	if err != nil {
		return fmt.Errorf("create Kubernetes client: %w", err)
	}
	s.rlarkClient, err = versioned.NewForConfig(restConfig)
	if err != nil {
		return fmt.Errorf("create RLark client: %w", err)
	}
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
	if err := s.initTLSConfig(ctx); err != nil {
		return fmt.Errorf("failed to initialize TLS config: %w", err)
	}
	if err := s.initCAConfigs(ctx); err != nil {
		return fmt.Errorf("failed to initialize CA configs: %w", err)
	}

	// 3. 检查数据库中的表结构和索引，如果不正确则进行迁移。
	// TODO

	return nil
}

func (s *Server) runBroadcaster(ctx context.Context) error {
	// 向 Kubernetes 集群通过 Lease 广播服务器的存在，并且检查其他服务器的信息
	// 用于构建 Peer-to-Peer 的服务器集群，确保高可用和负载均衡。

	id := fmt.Sprintf("%s-%d", os.Getenv("HOSTNAME"), os.Getpid())
	ip := os.Getenv("POD_IP")
	rl, err := resourcelock.New(
		resourcelock.LeasesResourceLock,
		s.config.Namespace(),
		"rlark-server-"+id,
		s.kubeClient.CoreV1(),
		s.kubeClient.CoordinationV1(),
		resourcelock.ResourceLockConfig{
			Identity: ip,
		},
	)
	if err != nil {
		return fmt.Errorf("create resource lock: %w", err)
	}

	le, err := leaderelection.NewLeaderElector(leaderelection.LeaderElectionConfig{
		Lock:          rl,
		LeaseDuration: time.Second * 30,
		RenewDeadline: time.Second * 10,
		RetryPeriod:   time.Second * 5,
		Callbacks: leaderelection.LeaderCallbacks{
			OnStartedLeading: func(ctx context.Context) {},
			OnStoppedLeading: func() {},
			OnNewLeader:      func(identity string) {},
		},
	})
	if err != nil {
		return fmt.Errorf("create leader elector: %w", err)
	}

	le.Run(ctx)
	return nil
}
