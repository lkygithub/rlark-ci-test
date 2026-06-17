package persistencer

import (
	"fmt"

	"github.com/rlinf/rlark/pkg/clients/db"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// GenericSyncHandlerImpl provides a generic implementation of GenericSyncHandler.
// It can be embedded in specific resource handlers to provide common functionality.
type GenericSyncHandlerImpl[T runtime.Object, M db.ResourceModel] struct {
	resourceType string
	newModel     func() M
	extractIndex func(T) map[string]interface{}
	shouldSync   func(T) bool
}

// NewGenericSyncHandler creates a new generic sync handler.
func NewGenericSyncHandler[T runtime.Object, M db.ResourceModel](
	resourceType string,
	newModel func() M,
	extractIndex func(T) map[string]interface{},
	opts ...GenericHandlerOption[T, M],
) *GenericSyncHandlerImpl[T, M] {
	h := &GenericSyncHandlerImpl[T, M]{
		resourceType: resourceType,
		newModel:     newModel,
		extractIndex: extractIndex,
		shouldSync:   func(obj T) bool { return true },
	}

	for _, opt := range opts {
		opt(h)
	}

	return h
}

// GenericHandlerOption is an option for configuring GenericSyncHandlerImpl.
type GenericHandlerOption[T runtime.Object, M db.ResourceModel] func(*GenericSyncHandlerImpl[T, M])

// WithShouldSync sets the shouldSync function.
func WithShouldSync[T runtime.Object, M db.ResourceModel](fn func(T) bool) GenericHandlerOption[T, M] {
	return func(h *GenericSyncHandlerImpl[T, M]) {
		h.shouldSync = fn
	}
}

// ExtractIndexFields extracts index fields from the resource.
func (h *GenericSyncHandlerImpl[T, M]) ExtractIndexFields(obj T) map[string]interface{} {
	if h.extractIndex != nil {
		return h.extractIndex(obj)
	}
	return make(map[string]interface{})
}

// ToPersistedModel converts a Kubernetes resource to a persisted model.
func (h *GenericSyncHandlerImpl[T, M]) ToPersistedModel(obj T) (db.ResourceModel, error) {
	// Get object metadata
	meta, ok := any(obj).(metav1.Object)
	if !ok {
		return nil, fmt.Errorf("object does not implement metav1.Object")
	}

	// Convert object to map for raw storage
	runtimeObj := any(obj).(runtime.Object)
	raw, err := runtime.DefaultUnstructuredConverter.ToUnstructured(runtimeObj)
	if err != nil {
		return nil, fmt.Errorf("failed to convert object to unstructured: %w", err)
	}

	// Create model instance
	m := h.newModel()
	base := m.GetBase()

	base.ID = string(meta.GetUID())
	base.Namespace = meta.GetNamespace()
	base.Name = meta.GetName()
	base.UID = string(meta.GetUID())
	base.CreatedAt = meta.GetCreationTimestamp().Time
	base.Raw = raw

	// Handle deletion timestamp
	if meta.GetDeletionTimestamp() != nil {
		deletedAt := meta.GetDeletionTimestamp().Time
		base.DeletedAt = &deletedAt
	}

	return m, nil
}

// GetResourceType returns the resource type.
func (h *GenericSyncHandlerImpl[T, M]) GetResourceType() string {
	return h.resourceType
}

// ShouldSync returns true if the resource should be synced.
func (h *GenericSyncHandlerImpl[T, M]) ShouldSync(obj T) bool {
	if h.shouldSync != nil {
		return h.shouldSync(obj)
	}
	return true
}
