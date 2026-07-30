package gateway

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	storagev1 "k8s.io/api/storage/v1"

	"github.com/gin-gonic/gin"
	"github.com/rlinf/rlark/pkg/apis"
	"github.com/sirupsen/logrus"
)

// StorageClassData 定义StorageClass的响应数据结构
type StorageClassData struct {
	Name        string   `json:"name"`
	Clusters    []string `json:"clusters"`
	Description string   `json:"description"`
	Bucket      string   `json:"bucket"`
}

// Provider 定义存储提供商信息
type Provider struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// listStorageClass 处理StorageClass列表请求
// 通过Server代理向指定集群的Agent请求StorageClass列表
func (g *Gateway) listStorageClass(c *gin.Context) {
	clustersParam := c.Query("clusters")
	if clustersParam == "" {
		c.JSON(http.StatusOK, gin.H{
			"data":    map[string]*StorageClassData{},
			"success": true,
		})
		return
	}

	var clusterIDs []string
	for _, cid := range strings.Split(clustersParam, ",") {
		cid = strings.TrimSpace(cid)
		if cid != "" {
			clusterIDs = append(clusterIDs, cid)
		}
	}

	if len(clusterIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"data":    map[string]*StorageClassData{},
			"success": true,
		})
		return
	}

	if g.config.ServerAddress == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "server-address is not configured, cannot proxy to cluster agents",
		})
		return
	}

	log := logrus.WithFields(logrus.Fields{"Method": "listStorageClass", "clusters": clusterIDs})

	ssData := make(map[string]*StorageClassData)
	for _, clusterID := range clusterIDs {
		agentID, ok := strings.CutPrefix(clusterID, apis.RLarkAgentNamespacePrefix)
		if !ok {
			log.Infof("Seems not a valid clusterID without prefix:%s", clusterID)
			continue
		}
		agentSSList, err := g.fetchStorageClassesFromAgent(c.Request.Context(), agentID)
		if err != nil {
			log.Warnf("failed to fetch storage classes from agent %s: %v", agentID, err)
			continue
		}

		for _, ss := range agentSSList {
			if ss.Name == "default" || ss.Name == "local-path" || ss.Name == "hostpath" {
				continue
			}

			description := ""
			if ss.Annotations != nil {
				description = ss.Annotations["rlark.io/description"]
				if description == "" {
					if ss.Annotations["storageclass.kubernetes.io/is-default-class"] == "true" {
						description = "Default StorageClass"
					}
				}
			}

			bucket := ""
			if ss.Parameters != nil {
				bucket = ss.Parameters["remotePath"]
				if bucket == "" {
					bucket = ss.Parameters["bucket"]
				}
			}

			if existing, ok := ssData[ss.Name]; ok {
				existing.Clusters = append(existing.Clusters, agentID)
			} else {
				ssData[ss.Name] = &StorageClassData{
					Name:        ss.Name,
					Clusters:    []string{agentID},
					Description: description,
					Bucket:      bucket,
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    ssData,
		"success": true,
	})
}

// fetchStorageClassesFromAgent 通过Server代理从指定Agent获取StorageClass列表
func (g *Gateway) fetchStorageClassesFromAgent(ctx context.Context, agentID string) ([]storagev1.StorageClass, error) {
	httpClient := &http.Client{Transport: g.serverTransport}
	url := fmt.Sprintf("%s/api/proxy/%s/api/kubernetes/apis/storage.k8s.io/v1/storageclasses",
		strings.TrimSuffix(g.config.ServerAddress, "/"),
		agentID,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call server proxy: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server proxy returned HTTP %d: %s", resp.StatusCode, string(body))
	}

	var listResp storagev1.StorageClassList
	if err := json.Unmarshal(body, &listResp); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	return listResp.Items, nil
}

// listProvider 列出支持的存储提供商
func (g *Gateway) listProvider(c *gin.Context) {
	providers := []Provider{
		{Name: "AWS S3", Value: "AWS"},
		{Name: "阿里云 OSS", Value: "Alibaba"},
		{Name: "腾讯云 COS", Value: "TencentCOS"},
		{Name: "华为云 OBS", Value: "HuaweiOBS"},
		{Name: "七牛云 Kodo", Value: "Qiniu"},
		{Name: "移动云 EOS", Value: "ChinaMobile"},
		{Name: "网易 NOS", Value: "Netease"},
		{Name: "UCloud US3", Value: "Ucloud"},
		{Name: "MinIO", Value: "Minio"},
		{Name: "Ceph RGW", Value: "Ceph"},
		{Name: "SeaweedFS", Value: "SeaweedFS"},
		{Name: "Cloudflare R2", Value: "Cloudflare"},
		{Name: "Google Cloud Storage", Value: "GCS"},
		{Name: "DigitalOcean Spaces", Value: "DigitalOcean"},
		{Name: "Wasabi", Value: "Wasabi"},
		{Name: "Backblaze B2 (S3)", Value: "Other"},
		{Name: "IBM COS", Value: "IBMCOS"},
		{Name: "Scaleway", Value: "Scaleway"},
		{Name: "OVHcloud", Value: "OVH"},
		{Name: "Linode / Akamai", Value: "Linode"},
		{Name: "IDrive e2", Value: "IDrive"},
		{Name: "Seagate Lyve Cloud", Value: "LyveCloud"},
		{Name: "Storj (S3 网关)", Value: "Storj"},
		{Name: "Synology C2", Value: "Synology"},
		{Name: "ArvanCloud", Value: "ArvanCloud"},
		{Name: "Hetzner", Value: "Hetzner"},
		{Name: "IONOS", Value: "IONOS"},
		{Name: "MEGA S4", Value: "Mega"},
		{Name: "RackCorp", Value: "RackCorp"},
		{Name: "Dreamhost", Value: "Dreamhost"},
		{Name: "其他 S3 兼容", Value: "Other"},
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    providers,
		"success": true,
	})
}

// createStorageClass 创建StorageClass
func (g *Gateway) createStorageClass(c *gin.Context) {
	// TODO: 实现StorageClass创建功能
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "StorageClass creation not implemented yet",
	})
}
