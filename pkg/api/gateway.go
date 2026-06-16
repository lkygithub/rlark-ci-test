package api

import "github.com/gin-gonic/gin"

type Gateway struct{}

func NewGateway() *Gateway {
	return &Gateway{}
}

func (g *Gateway) RegisterRoutes(r *gin.Engine) {
	v1 := r.Group("/apis/rlinf.io/v1alpha1")

	nodes := v1.Group("/nodes")
	{
		nodes.GET("", g.listNodes)
		nodes.POST("", g.createNode)
		nodes.GET("/:name", g.getNode)
		nodes.PUT("/:name", g.updateNode)
		nodes.PATCH("/:name", g.patchNode)
		nodes.DELETE("/:name", g.deleteNode)
	}

	workflows := v1.Group("/workflows")
	{
		workflows.GET("", g.listWorkflows)
		workflows.POST("", g.createWorkflow)
		workflows.GET("/:name", g.getWorkflow)
		workflows.PUT("/:name", g.updateWorkflow)
		workflows.PATCH("/:name", g.patchWorkflow)
		workflows.DELETE("/:name", g.deleteWorkflow)
	}

	jobs := v1.Group("/jobs")
	{
		jobs.GET("/:name/logs", g.jobLogs)
		jobs.GET("/:name/metrics", g.jobMetrics)
	}
}

// --- Node handlers ---
func (g *Gateway) listNodes(c *gin.Context)  { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) createNode(c *gin.Context) { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) getNode(c *gin.Context)    { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) updateNode(c *gin.Context) { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) patchNode(c *gin.Context)  { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) deleteNode(c *gin.Context) { c.JSON(501, gin.H{"message": "not implemented"}) }

// --- Workflow handlers ---
func (g *Gateway) listWorkflows(c *gin.Context)  { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) createWorkflow(c *gin.Context) { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) getWorkflow(c *gin.Context)    { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) updateWorkflow(c *gin.Context) { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) patchWorkflow(c *gin.Context)  { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) deleteWorkflow(c *gin.Context) { c.JSON(501, gin.H{"message": "not implemented"}) }

// --- Job handlers ---
func (g *Gateway) jobMetrics(c *gin.Context) { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) jobLogs(c *gin.Context)    { c.JSON(501, gin.H{"message": "not implemented"}) }
