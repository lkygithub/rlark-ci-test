package v1alpha1

import (
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type NodePhase string

const (
	NodeOnline  NodePhase = "Online"
	NodeOffline NodePhase = "Offline"
)

type AgentType string

// 目前支持三种 Agent
const (
	AgentTypeKubernetes AgentType = "Kubernetes"
	AgentTypeDocker     AgentType = "Docker"
	AgentTypeRaw        AgentType = "Raw"
)

type NodeSpec struct {
	AgentType     AgentType `json:"agentType,omitempty"` // 节点接入的形态
	Unschedulable bool      `json:"unschedulable,omitempty"`
}

type NodeStatus struct {
	Phase       NodePhase            `json:"phase,omitempty"`
	Reason      string               `json:"reason,omitempty"`
	NodeInfo    NodeInfo             `json:"nodeInfo,omitempty"`
	Addresses   []corev1.NodeAddress `json:"addresses,omitempty"`
	Allocatable corev1.ResourceList  `json:"allocatable,omitempty"` // 需要预留系统组件 agent
	Capacity    corev1.ResourceList  `json:"capacity,omitempty"`
	Used        corev1.ResourceList  `json:"used,omitempty"`
}

type NodeInfo struct {
	Architecture    string `json:"architecture,omitempty"`
	KernelVersion   string `json:"kernelVersion,omitempty"`
	AgentVersion    string `json:"agentVersion,omitempty"`
	OperatingSystem string `json:"operatingSystem,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:path=nodes,scope=Cluster,shortName=ienode
type Node struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   NodeSpec   `json:"spec,omitempty"`
	Status NodeStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
type NodeList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Node `json:"items"`
}
