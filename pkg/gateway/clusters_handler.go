package gateway

import (
	"net/http"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	rlarkv1alpha1 "github.com/rlinf/rlark/api/rlark.io/v1alpha1"
)

// ClusterInfo 定义集群信息的响应结构
type ClusterInfo struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Type          string   `json:"type"`
	Region        string   `json:"region"`
	Location      string   `json:"location"`
	Phase         string   `json:"phase"`
	CloudNodes    int      `json:"cloudNodes"`
	EmbodiedNodes int      `json:"embodiedNodes"`
	Robots        int      `json:"robots"`
	GPUModels     []string `json:"gpuModels"`
	RobotModels   []string `json:"robotModels"`
	CPUUsage      int      `json:"cpuUsage"`
	GPUUsage      int      `json:"gpuUsage"`
	RobotUsage    int      `json:"robotUsage"`
	RunningJobs   int      `json:"runningJobs"`
	Description   string   `json:"description"`
}

// listClusters 处理集群列表请求
func (g *Gateway) listClusters(c *gin.Context) {
	clusters := []ClusterInfo{}

	if g.kubeClient != nil {
		// 获取所有节点
		nodes, err := g.kubeClient.RlinfV1alpha1().Nodes(metav1.NamespaceAll).List(c.Request.Context(), metav1.ListOptions{})
		if err == nil && len(nodes.Items) > 0 {
			// 按 cluster-id 聚合节点
			clusterMap := make(map[string]*ClusterInfo)

			for _, node := range nodes.Items {
				clusterID := node.Labels[rlarkv1alpha1.LabelClusterID]
				if clusterID == "" {
					continue
				}

				if _, exists := clusterMap[clusterID]; !exists {
					phase := "Online"
					if node.Status.Phase == rlarkv1alpha1.NodeOffline {
						phase = "Offline"
					}
					clusterMap[clusterID] = &ClusterInfo{
						ID:          clusterID,
						Name:        clusterID,
						Type:        "Cloud",
						Phase:       phase,
						GPUModels:   []string{},
						RobotModels: []string{},
					}
				}

				// 根据节点类别统计
				category := node.Labels[rlarkv1alpha1.LabelNodeCategory]
				switch category {
				case string(rlarkv1alpha1.NodeCategoryCloud):
					clusterMap[clusterID].CloudNodes++
				case string(rlarkv1alpha1.NodeCategoryEdge):
					clusterMap[clusterID].EmbodiedNodes++
				case string(rlarkv1alpha1.NodeCategoryRobot):
					clusterMap[clusterID].Robots++
				}
			}

			// 转换为列表
			for _, cluster := range clusterMap {
				// 根据节点数量计算使用率（简化逻辑）
				if cluster.CloudNodes > 0 {
					cluster.Type = "Cloud"
					cluster.GPUUsage = 0
					cluster.CPUUsage = 0
				}
				if cluster.EmbodiedNodes > 0 || cluster.Robots > 0 {
					cluster.Type = "Embodied"
					cluster.RobotUsage = 0
				}
				clusters = append(clusters, *cluster)
			}
		}
	}

	if clusters == nil {
		clusters = []ClusterInfo{}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    clusters,
		"success": true,
	})
}
