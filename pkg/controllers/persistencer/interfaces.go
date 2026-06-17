package persistencer

import (
	"context"

	"github.com/rlinf/rlark/pkg/clients/db"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/rest"
)

const (
	// SyncFinalizer is the finalizer added to resources to ensure
	// they are synced to PostgreSQL before deletion.
	SyncFinalizer = "sync.rlinf.io/persist"

	// SyncAnnotation is the annotation that marks a resource as synced.
	SyncAnnotation = "sync.rlinf.io/synced"

	// SyncTimestampAnnotation records the last sync timestamp.
	SyncTimestampAnnotation = "sync.rlinf.io/synced-at"
)

// GenericSyncHandler defines the generic interface for syncing resources.
type GenericSyncHandler[T runtime.Object] interface {
	// ExtractIndexFields extracts index fields from the resource.
	ExtractIndexFields(obj T) map[string]interface{}

	// ToPersistedModel converts a Kubernetes resource to a persisted model.
	ToPersistedModel(obj T) (db.ResourceModel, error)

	// GetResourceType returns the resource type (e.g., "jobs.rlinf.io").
	GetResourceType() string

	// ShouldSync returns true if the resource should be synced.
	ShouldSync(obj T) bool
}

// SyncController defines the interface for the sync controller.
type SyncController interface {
	// Start starts the sync controller.
	Start(ctx context.Context) error

	// SyncResource syncs a single resource to PostgreSQL.
	SyncResource(ctx context.Context, obj runtime.Object) error

	// HandleFinalizer handles the finalizer logic for a resource.
	HandleFinalizer(ctx context.Context, obj runtime.Object) error

	// AddHandler registers a handler for a specific resource type and GVR.
	AddHandler(gvr schema.GroupVersionResource, handler interface{}) error

	// SetupInformers sets up informers for all registered handlers.
	SetupInformers(config *rest.Config) error
}

// SyncEvent represents a sync event.
type SyncEvent struct {
	// Type is the event type (Added, Modified, Deleted).
	Type string

	// GVR is the GroupVersionResource of the object.
	GVR schema.GroupVersionResource

	// Object is the resource that triggered the event.
	Object runtime.Object

	// OldObject is the previous state of the resource (for Modified events).
	OldObject runtime.Object

	// Error is any error that occurred during syncing.
	Error error
}

// SyncStats holds statistics about sync operations.
type SyncStats struct {
	// TotalSynced is the total number of resources synced.
	TotalSynced int64

	// TotalFailed is the total number of failed syncs.
	TotalFailed int64

	// TotalDeleted is the total number of resources deleted.
	TotalDeleted int64
}
