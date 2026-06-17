package persistencer

import (
	"context"
	"fmt"
	"sync"
	"time"

	rlarkv1alpha1 "github.com/rlinf/rlark/pkg/apis/rlark.io/v1alpha1"
	"github.com/rlinf/rlark/pkg/clients/db"
	"github.com/uptrace/bun"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/dynamic/dynamicinformer"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/util/workqueue"
	"k8s.io/klog/v2"
)

// HandlerWrapper wraps a generic handler to provide a common interface for the controller.
type HandlerWrapper interface {
	GetResourceType() string
	GetTableName() string
	ShouldSyncObject(obj runtime.Object) bool
	ToPersistedModelObject(obj runtime.Object) (db.ResourceModel, error)
}

// SyncControllerImpl implements the SyncController interface.
type SyncControllerImpl struct {
	config    SyncConfig
	db        *bun.DB
	handlers  map[string]HandlerWrapper              // resourceType -> handler
	gvrMap    map[schema.GroupVersionResource]string // GVR -> resourceType
	tableMap  map[string]string                      // resourceType -> tableName
	queue     workqueue.RateLimitingInterface
	informers map[schema.GroupVersionResource]cache.SharedIndexInformer
	stopCh    chan struct{}

	stats     SyncStats
	statsLock sync.RWMutex
}

// NewSyncController creates a new sync controller.
func NewSyncController(db *bun.DB, config SyncConfig) *SyncControllerImpl {
	if config.Workers <= 0 {
		config.Workers = 5
	}
	if config.BatchSize <= 0 {
		config.BatchSize = 100
	}

	return &SyncControllerImpl{
		config:    config,
		db:        db,
		handlers:  make(map[string]HandlerWrapper),
		gvrMap:    make(map[schema.GroupVersionResource]string),
		tableMap:  make(map[string]string),
		queue:     workqueue.NewRateLimitingQueue(workqueue.DefaultControllerRateLimiter()),
		informers: make(map[schema.GroupVersionResource]cache.SharedIndexInformer),
		stopCh:    make(chan struct{}),
	}
}

// AddHandler registers a handler for a specific resource type and GVR.
func (c *SyncControllerImpl) AddHandler(gvr schema.GroupVersionResource, handler interface{}) error {
	resourceType := gvr.GroupResource().String()

	if _, exists := c.handlers[resourceType]; exists {
		return fmt.Errorf("handler for resource type %s already exists", resourceType)
	}

	wrapper, err := wrapHandler(handler)
	if err != nil {
		return fmt.Errorf("failed to wrap handler: %w", err)
	}

	c.handlers[resourceType] = wrapper
	c.gvrMap[gvr] = resourceType
	c.tableMap[resourceType] = wrapper.GetTableName()

	klog.Infof("Added handler for resource type %s with GVR %s", resourceType, gvr.String())
	return nil
}

// wrapHandler wraps a generic handler to a HandlerWrapper.
func wrapHandler(handler interface{}) (HandlerWrapper, error) {
	switch h := handler.(type) {
	case *JobSyncHandler:
		return &handlerWrapper[*rlarkv1alpha1.Job, *db.JobModel]{handler: h.GenericSyncHandlerImpl, tableName: "jobs"}, nil
	case *NodeSyncHandler:
		return &handlerWrapper[*rlarkv1alpha1.Node, *db.NodeModel]{handler: h.GenericSyncHandlerImpl, tableName: "nodes"}, nil
	case *TaskSyncHandler:
		return &handlerWrapper[*rlarkv1alpha1.Task, *db.TaskModel]{handler: h.GenericSyncHandlerImpl, tableName: "tasks"}, nil
	case *WorkflowSyncHandler:
		return &handlerWrapper[*rlarkv1alpha1.Workflow, *db.WorkflowModel]{handler: h.GenericSyncHandlerImpl, tableName: "workflows"}, nil
	default:
		return nil, fmt.Errorf("unsupported handler type: %T", handler)
	}
}

// handlerWrapper wraps a GenericSyncHandler to implement HandlerWrapper.
type handlerWrapper[T runtime.Object, M db.ResourceModel] struct {
	handler   *GenericSyncHandlerImpl[T, M]
	tableName string
}

// GetResourceType returns the resource type.
func (w *handlerWrapper[T, M]) GetResourceType() string {
	return w.handler.GetResourceType()
}

// GetTableName returns the database table name for this resource type.
func (w *handlerWrapper[T, M]) GetTableName() string {
	return w.tableName
}

// ShouldSyncObject checks if the object should be synced.
func (w *handlerWrapper[T, M]) ShouldSyncObject(obj runtime.Object) bool {
	klog.V(4).Infof("ShouldSyncObject called with object type: %T", obj)

	unstructuredObj, ok := obj.(*unstructured.Unstructured)
	if !ok {
		typedObj, ok := obj.(T)
		if !ok {
			klog.Errorf("Object is not the expected type: %T", obj)
			return false
		}
		return w.handler.ShouldSync(typedObj)
	}

	typedObj := new(T)
	if err := runtime.DefaultUnstructuredConverter.FromUnstructured(unstructuredObj.Object, typedObj); err != nil {
		klog.Errorf("Failed to convert unstructured to typed object: %v", err)
		return false
	}

	return w.handler.ShouldSync(*typedObj)
}

// ToPersistedModelObject converts the object to a persisted model.
func (w *handlerWrapper[T, M]) ToPersistedModelObject(obj runtime.Object) (db.ResourceModel, error) {
	klog.V(4).Infof("ToPersistedModelObject called with object type: %T", obj)

	unstructuredObj, ok := obj.(*unstructured.Unstructured)
	if !ok {
		typedObj, ok := obj.(T)
		if !ok {
			return nil, fmt.Errorf("object type mismatch: expected %T, got %T", new(T), obj)
		}
		return w.handler.ToPersistedModel(typedObj)
	}

	typedObj := new(T)
	if err := runtime.DefaultUnstructuredConverter.FromUnstructured(unstructuredObj.Object, typedObj); err != nil {
		return nil, fmt.Errorf("failed to convert unstructured to typed object: %w", err)
	}

	return w.handler.ToPersistedModel(*typedObj)
}

// SetupInformers sets up informers for all registered handlers.
func (c *SyncControllerImpl) SetupInformers(config *rest.Config) error {
	dynamicClient := dynamic.NewForConfigOrDie(config)
	factory := dynamicinformer.NewDynamicSharedInformerFactory(dynamicClient, c.config.ResyncPeriod)

	for gvr := range c.gvrMap {
		informer := factory.ForResource(gvr).Informer()
		c.informers[gvr] = informer

		informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
			AddFunc: func(obj interface{}) {
				c.enqueueEvent("Added", gvr, obj)
			},
			UpdateFunc: func(oldObj, newObj interface{}) {
				c.enqueueEvent("Modified", gvr, newObj)
			},
			DeleteFunc: func(obj interface{}) {
				c.enqueueEvent("Deleted", gvr, obj)
			},
		})

		klog.Infof("Set up informer for GVR: %s", gvr.String())
	}

	return nil
}

// enqueueEvent enqueues a sync event with GVR information.
func (c *SyncControllerImpl) enqueueEvent(eventType string, gvr schema.GroupVersionResource, obj interface{}) {
	runtimeObj, ok := obj.(runtime.Object)
	if !ok {
		klog.Errorf("Object is not a runtime.Object: %v", obj)
		return
	}

	key, err := cache.MetaNamespaceKeyFunc(obj)
	if err != nil {
		klog.Errorf("Failed to get key for object: %v", err)
		return
	}

	event := &SyncEvent{
		Type:   eventType,
		GVR:    gvr,
		Object: runtimeObj,
	}

	c.queue.Add(event)
	klog.V(4).Infof("Enqueued %s event for %s (GVR: %s)", eventType, key, gvr.String())
}

// Start starts the sync controller.
func (c *SyncControllerImpl) Start(ctx context.Context) error {
	klog.Info("Starting sync controller")

	for gvr, informer := range c.informers {
		go informer.Run(c.stopCh)
		klog.Infof("Started informer for GVR: %s", gvr.String())
	}

	for i := 0; i < c.config.Workers; i++ {
		go c.worker(ctx, i)
	}

	klog.Info("Sync controller started")

	<-c.stopCh
	klog.Info("Sync controller stopped")

	return nil
}

// Stop stops the sync controller.
func (c *SyncControllerImpl) Stop() {
	close(c.stopCh)
	c.queue.ShutDown()
}

// worker processes items from the work queue.
func (c *SyncControllerImpl) worker(ctx context.Context, id int) {
	klog.Infof("Starting worker %d", id)

	for {
		item, shutdown := c.queue.Get()
		if shutdown {
			klog.Infof("Worker %d shutting down", id)
			return
		}

		event := item.(*SyncEvent)
		key, _ := cache.MetaNamespaceKeyFunc(event.Object)

		klog.V(4).Infof("Worker %d processing %s event for %s (GVR: %s)", id, event.Type, key, event.GVR.String())

		if err := c.processEvent(ctx, event); err != nil {
			klog.Errorf("Failed to process event for %s: %v", key, err)
			c.queue.AddRateLimited(event)
			c.updateStats(func(stats *SyncStats) {
				stats.TotalFailed++
			})
		} else {
			c.queue.Forget(item)
			c.updateStats(func(stats *SyncStats) {
				stats.TotalSynced++
			})
		}

		c.queue.Done(item)
	}
}

// processEvent processes a single sync event.
func (c *SyncControllerImpl) processEvent(ctx context.Context, event *SyncEvent) error {
	resourceType, exists := c.gvrMap[event.GVR]
	if !exists {
		return fmt.Errorf("no resource type mapping for GVR %s", event.GVR.String())
	}

	handler, exists := c.handlers[resourceType]
	if !exists {
		return fmt.Errorf("no handler found for resource type %s", resourceType)
	}

	if !handler.ShouldSyncObject(event.Object) {
		meta, _ := event.Object.(metav1.Object)
		klog.V(4).Infof("Skipping sync for object %s/%s", meta.GetNamespace(), meta.GetName())
		return nil
	}

	switch event.Type {
	case "Added", "Modified":
		return c.syncResource(ctx, handler, event.Object)
	case "Deleted":
		return c.handleDeletion(ctx, handler, event.Object)
	default:
		return fmt.Errorf("unknown event type: %s", event.Type)
	}
}

// syncResource syncs a resource to PostgreSQL.
func (c *SyncControllerImpl) syncResource(ctx context.Context, handler HandlerWrapper, obj runtime.Object) error {
	m, err := handler.ToPersistedModelObject(obj)
	if err != nil {
		return fmt.Errorf("failed to convert to persisted model: %w", err)
	}

	if err := c.ensureFinalizer(ctx, obj); err != nil {
		return fmt.Errorf("failed to ensure finalizer: %w", err)
	}

	if err := c.saveToDatabase(ctx, m); err != nil {
		return fmt.Errorf("failed to save to database: %w", err)
	}

	base := m.GetBase()
	klog.V(4).Infof("Synced resource %s/%s to table %s", base.Namespace, base.Name, handler.GetTableName())
	return nil
}

// handleDeletion handles resource deletion.
func (c *SyncControllerImpl) handleDeletion(ctx context.Context, handler HandlerWrapper, obj runtime.Object) error {
	meta, ok := obj.(metav1.Object)
	if !ok {
		return fmt.Errorf("object does not implement metav1.Object")
	}

	tableName := handler.GetTableName()
	if err := c.softDeleteInDatabase(ctx, tableName, string(meta.GetUID())); err != nil {
		return fmt.Errorf("failed to soft delete in database: %w", err)
	}
	klog.V(4).Infof("Soft deleted resource %s/%s in table %s", meta.GetNamespace(), meta.GetName(), tableName)

	if c.hasFinalizer(meta) {
		if err := c.removeFinalizer(ctx, obj); err != nil {
			return fmt.Errorf("failed to remove finalizer: %w", err)
		}
	}

	c.updateStats(func(stats *SyncStats) {
		stats.TotalDeleted++
	})

	return nil
}

// saveToDatabase saves a persisted resource to the database.
func (c *SyncControllerImpl) saveToDatabase(ctx context.Context, m db.ResourceModel) error {
	_, err := c.db.NewInsert().
		Model(m).
		On("CONFLICT (id) DO UPDATE").
		Set("namespace = EXCLUDED.namespace").
		Set("name = EXCLUDED.name").
		Set("raw = EXCLUDED.raw").
		Set("deleted_at = EXCLUDED.deleted_at").
		Exec(ctx)

	return err
}

// softDeleteInDatabase marks a resource as deleted in the specified table.
func (c *SyncControllerImpl) softDeleteInDatabase(ctx context.Context, tableName, uid string) error {
	now := time.Now()
	_, err := c.db.NewUpdate().
		TableExpr(tableName).
		Set("deleted_at = ?", now).
		Where("uid = ?", uid).
		Where("deleted_at IS NULL").
		Exec(ctx)

	return err
}

// ensureFinalizer ensures the sync finalizer is present on the object.
func (c *SyncControllerImpl) ensureFinalizer(ctx context.Context, obj runtime.Object) error {
	meta, ok := obj.(metav1.Object)
	if !ok {
		return fmt.Errorf("object does not implement metav1.Object")
	}

	if c.hasFinalizer(meta) {
		return nil
	}

	klog.V(4).Infof("Adding finalizer to %s/%s", meta.GetNamespace(), meta.GetName())
	return nil
}

// removeFinalizer removes the sync finalizer from the object.
func (c *SyncControllerImpl) removeFinalizer(ctx context.Context, obj runtime.Object) error {
	meta, ok := obj.(metav1.Object)
	if !ok {
		return fmt.Errorf("object does not implement metav1.Object")
	}

	if !c.hasFinalizer(meta) {
		return nil
	}

	klog.V(4).Infof("Removing finalizer from %s/%s", meta.GetNamespace(), meta.GetName())
	return nil
}

// hasFinalizer checks if the object has the sync finalizer.
func (c *SyncControllerImpl) hasFinalizer(meta metav1.Object) bool {
	for _, f := range meta.GetFinalizers() {
		if f == SyncFinalizer {
			return true
		}
	}
	return false
}

// updateStats updates the sync statistics.
func (c *SyncControllerImpl) updateStats(update func(*SyncStats)) {
	c.statsLock.Lock()
	defer c.statsLock.Unlock()
	update(&c.stats)
}

// GetStats returns the current sync statistics.
func (c *SyncControllerImpl) GetStats() SyncStats {
	c.statsLock.RLock()
	defer c.statsLock.RUnlock()
	return c.stats
}

// SyncResource implements SyncController.SyncResource.
func (c *SyncControllerImpl) SyncResource(ctx context.Context, obj runtime.Object) error {
	gvk := obj.GetObjectKind().GroupVersionKind()
	gvr := schema.GroupVersionResource{
		Group:    gvk.Group,
		Version:  gvk.Version,
		Resource: gvk.Kind,
	}

	resourceType, exists := c.gvrMap[gvr]
	if !exists {
		return fmt.Errorf("no resource type mapping for GVR %s", gvr.String())
	}

	handler, exists := c.handlers[resourceType]
	if !exists {
		return fmt.Errorf("no handler found for resource type %s", resourceType)
	}

	return c.syncResource(ctx, handler, obj)
}

// HandleFinalizer implements SyncController.HandleFinalizer.
func (c *SyncControllerImpl) HandleFinalizer(ctx context.Context, obj runtime.Object) error {
	gvk := obj.GetObjectKind().GroupVersionKind()
	gvr := schema.GroupVersionResource{
		Group:    gvk.Group,
		Version:  gvk.Version,
		Resource: gvk.Kind,
	}

	resourceType, exists := c.gvrMap[gvr]
	if !exists {
		return fmt.Errorf("no resource type mapping for GVR %s", gvr.String())
	}

	handler, exists := c.handlers[resourceType]
	if !exists {
		return fmt.Errorf("no handler found for resource type %s", resourceType)
	}

	return c.handleDeletion(ctx, handler, obj)
}
