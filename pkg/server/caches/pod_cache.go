package caches

import (
	"sync"

	"k8s.io/client-go/tools/cache"

	"github.com/rlinf/rlark/api/rlark.io/v1alpha1"
)

type PodCache struct {
	mutex       sync.RWMutex
	podInformer cache.SharedIndexInformer
	pods        map[string]*v1alpha1.Pod
}

func NewPodCache(podInformer cache.SharedIndexInformer) *PodCache {
	c := &PodCache{
		podInformer: podInformer,
		pods:        make(map[string]*v1alpha1.Pod),
	}
	_, _ = podInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    c.onAdd,
		UpdateFunc: c.onUpdate,
		DeleteFunc: c.onDelete,
	})
	return c
}

func (c *PodCache) onAdd(obj interface{}) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	pod, ok := obj.(*v1alpha1.Pod)
	if !ok {
		return
	}
	c.pods[pod.Spec.PodName] = pod
}

func (c *PodCache) onUpdate(oldObj, newObj interface{}) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	pod, ok := newObj.(*v1alpha1.Pod)
	if !ok {
		return
	}
	c.pods[pod.Spec.PodName] = pod
}

func (c *PodCache) onDelete(obj interface{}) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	pod, ok := obj.(*v1alpha1.Pod)
	if !ok {
		return
	}
	delete(c.pods, pod.Spec.PodName)
}

func (c *PodCache) GetPodByName(podName string) (*v1alpha1.Pod, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	pod, exists := c.pods[podName]
	return pod, exists
}
