package sync

import (
	"fmt"

	"sigs.k8s.io/controller-runtime/pkg/controller"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

// Config holds configuration for the persistencer.
type Config struct {
	// Workers is the number of concurrent workers for syncing.
	Workers int
}

// DefaultConfig returns the default persistencer configuration.
func DefaultConfig() Config {
	return Config{
		Workers: 5,
	}
}

// Validate validates the configuration.
func (c Config) Validate() error {
	if c.Workers <= 0 {
		return fmt.Errorf("sync workers must be positive")
	}
	return nil
}

func (c Config) ToControllerOptions() controller.TypedOptions[reconcile.Request] {
	return controller.TypedOptions[reconcile.Request]{
		MaxConcurrentReconciles: c.Workers,
	}
}
