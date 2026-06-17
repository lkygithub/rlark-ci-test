package persistencer

import (
	"fmt"
	"time"

	"github.com/rlinf/rlark/pkg/clients/db"
)

// Config holds configuration for the persistencer.
type Config struct {
	// Database configuration
	Database db.Config
	// Sync configuration
	Sync SyncConfig
	// Kcp configuration
	Kcp KcpConfig
}

// SyncConfig holds sync-specific configuration.
type SyncConfig struct {
	// Workers is the number of concurrent workers for syncing.
	Workers int
	// ResyncPeriod is the period for full resync.
	ResyncPeriod time.Duration
	// BatchSize is the number of resources to sync in a batch.
	BatchSize int
}

// KcpConfig holds kcp connection configuration.
type KcpConfig struct {
	// KubeconfigPath is the path to the kubeconfig file for kcp.
	KubeconfigPath string
	// Context is the context name in the kubeconfig.
	Context string
	// Namespace is the namespace to watch (empty for all namespaces).
	Namespace string
}

// DefaultConfig returns the default persistencer configuration.
func DefaultConfig() Config {
	return Config{
		Database: db.DefaultConfig(),
		Sync: SyncConfig{
			Workers:      5,
			ResyncPeriod: 0, // 0 means no resync
			BatchSize:    100,
		},
		Kcp: KcpConfig{
			KubeconfigPath: ".kcp/admin.kubeconfig",
			Context:        "",
			Namespace:      "",
		},
	}
}

// Validate validates the configuration.
func (c Config) Validate() error {
	if c.Sync.Workers <= 0 {
		return fmt.Errorf("sync workers must be positive")
	}
	if c.Sync.BatchSize <= 0 {
		return fmt.Errorf("sync batch size must be positive")
	}
	return nil
}
