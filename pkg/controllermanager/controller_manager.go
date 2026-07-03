package controllermanager

import (
	"context"
	"fmt"
	"os"

	"github.com/sirupsen/logrus"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/healthz"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	metricsserver "sigs.k8s.io/controller-runtime/pkg/metrics/server"

	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/clients/db"
	"github.com/rlinf/rlark/pkg/controllermanager/domain"
	"github.com/rlinf/rlark/pkg/controllermanager/job"
	"github.com/rlinf/rlark/pkg/controllermanager/node"
	"github.com/rlinf/rlark/pkg/controllermanager/sync"
	"github.com/rlinf/rlark/pkg/controllermanager/task"
	"github.com/rlinf/rlark/pkg/controllermanager/workflow"
)

type Reconciler interface {
	SetupWithManager(ctrl.Manager) error
}

var (
	scheme = runtime.NewScheme()
)

func init() {
	utilruntime.Must(clientgoscheme.AddToScheme(scheme))
	utilruntime.Must(rlarkv1alpha1.AddToScheme(scheme))
}

func New(config Config) (manager.Manager, error) {
	restConfig, err := config.KubeClientConfig.BuildRestConfig()
	if err != nil {
		return nil, fmt.Errorf("build Kubernetes client config: %w", err)
	}
	mgr, err := ctrl.NewManager(restConfig, ctrl.Options{
		Scheme:                 scheme,
		Metrics:                metricsserver.Options{BindAddress: config.MetricsBindAddress},
		HealthProbeBindAddress: config.ProbeBindAddress,
		LeaderElection:         config.LeaderElection,
		LeaderElectionID:       config.LeaderElectionID,
	})
	if err != nil {
		return nil, fmt.Errorf("create manager: %w", err)
	}

	reconcilers := []Reconciler{
		&job.JobReconciler{
			Client: mgr.GetClient(),
			Scheme: scheme,
		},
		&task.TaskReconciler{
			Client: mgr.GetClient(),
			Scheme: scheme,
		},
		&workflow.WorkflowReconciler{
			Client: mgr.GetClient(),
			Scheme: scheme,
		},
		&node.NodeReconciler{
			Client: mgr.GetClient(),
			Scheme: scheme,
		},
		&domain.DomainReconciler{
			Client: mgr.GetClient(),
			Scheme: scheme,

			KubeClientConfig: config.KubeClientConfig,
			ServerAddress:    config.ServerAddress,
		},
	}

	if config.DBConfigPath != "" {
		dbConfig := db.DefaultConfig()
		data, err := os.ReadFile(config.DBConfigPath)
		if err != nil {
			return nil, fmt.Errorf("read database config file: %w", err)
		}
		if err := db.UnmarshalConfig(data, &dbConfig); err != nil {
			return nil, fmt.Errorf("unmarshal database config: %w", err)
		}
		database, err := db.Open(dbConfig)
		if err != nil {
			return nil, fmt.Errorf("open database: %w", err)
		}
		ctx := context.Background()
		if err := database.Migrate(ctx); err != nil {
			return nil, fmt.Errorf("run database migrations: %w", err)
		}
		logrus.Infof("database connected and migrated")
		reconcilers = append(reconcilers,
			sync.NewJobReconciler(config.SyncConfig, mgr.GetClient(), database.DB),
			sync.NewTaskReconciler(config.SyncConfig, mgr.GetClient(), database.DB),
			sync.NewWorkflowReconciler(config.SyncConfig, mgr.GetClient(), database.DB),
			sync.NewNodeReconciler(config.SyncConfig, mgr.GetClient(), database.DB),
		)
	} else {
		logrus.Warningf("RLark controller manager is running without persistent storage.")
	}

	for _, r := range reconcilers {
		if err := r.SetupWithManager(mgr); err != nil {
			return nil, fmt.Errorf("setup controller: %w", err)
		}
	}

	if err := mgr.AddHealthzCheck("healthz", healthz.Ping); err != nil {
		return nil, fmt.Errorf("setup health check: %w", err)
	}
	if err := mgr.AddReadyzCheck("readyz", healthz.Ping); err != nil {
		return nil, fmt.Errorf("setup ready check: %w", err)
	}

	return mgr, nil
}
