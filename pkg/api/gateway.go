package api

import (
	"github.com/gin-gonic/gin"
	"github.com/rlinf/rlark/pkg/clients/db"
	versioned "github.com/rlinf/rlark/pkg/clients/kubernetes/clientset/versioned"
)

// Gateway provides HTTP handlers for resource CRUD APIs.
type Gateway struct {
	queriers  map[string]*db.ResourceQuerier
	accessors map[string]*resourceAccessor
	kubeClient versioned.Interface
	dbEnabled bool
}

// NewGateway creates a Gateway with database-backed queriers for read operations
// and a Kubernetes typed client for write operations. If database is nil, read operations
// fall back to the Kubernetes API server.
func NewGateway(database *db.DB, kubeClient versioned.Interface) *Gateway {
	g := &Gateway{
		queriers:   make(map[string]*db.ResourceQuerier),
		accessors:  registerAccessors(kubeClient),
		kubeClient: kubeClient,
		dbEnabled:  database != nil,
	}
	if database != nil {
		g.queriers["nodes"] = db.NewNodeQuerier(database.DB)
		g.queriers["workflows"] = db.NewWorkflowQuerier(database.DB)
		g.queriers["jobs"] = db.NewJobQuerier(database.DB)
		g.queriers["tasks"] = db.NewTaskQuerier(database.DB)
	}
	return g
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
		jobs.GET("", g.listJobs)
		jobs.POST("", g.createJob)
		jobs.GET("/:name", g.getJob)
		jobs.PUT("/:name", g.updateJob)
		jobs.PATCH("/:name", g.patchJob)
		jobs.DELETE("/:name", g.deleteJob)
		jobs.GET("/:name/logs", g.jobLogs)
		jobs.GET("/:name/metrics", g.jobMetrics)
	}

	tasks := v1.Group("/tasks")
	{
		tasks.GET("", g.listTasks)
		tasks.POST("", g.createTask)
		tasks.GET("/:name", g.getTask)
		tasks.PUT("/:name", g.updateTask)
		tasks.PATCH("/:name", g.patchTask)
		tasks.DELETE("/:name", g.deleteTask)
	}
}

// --- Node handlers ---

func (g *Gateway) listNodes(c *gin.Context)  { g.handleList("nodes")(c) }
func (g *Gateway) createNode(c *gin.Context) { g.handleKubeCreate("nodes")(c) }
func (g *Gateway) getNode(c *gin.Context)    { g.handleGet("nodes")(c) }
func (g *Gateway) updateNode(c *gin.Context) { g.handleKubeUpdate("nodes")(c) }
func (g *Gateway) patchNode(c *gin.Context)  { g.handleKubePatch("nodes")(c) }
func (g *Gateway) deleteNode(c *gin.Context) { g.handleKubeDelete("nodes")(c) }

// --- Workflow handlers ---

func (g *Gateway) listWorkflows(c *gin.Context)  { g.handleList("workflows")(c) }
func (g *Gateway) createWorkflow(c *gin.Context) { g.handleKubeCreate("workflows")(c) }
func (g *Gateway) getWorkflow(c *gin.Context)    { g.handleGet("workflows")(c) }
func (g *Gateway) updateWorkflow(c *gin.Context) { g.handleKubeUpdate("workflows")(c) }
func (g *Gateway) patchWorkflow(c *gin.Context)  { g.handleKubePatch("workflows")(c) }
func (g *Gateway) deleteWorkflow(c *gin.Context) { g.handleKubeDelete("workflows")(c) }

// --- Job handlers ---

func (g *Gateway) listJobs(c *gin.Context)  { g.handleList("jobs")(c) }
func (g *Gateway) createJob(c *gin.Context) { g.handleKubeCreate("jobs")(c) }
func (g *Gateway) getJob(c *gin.Context)    { g.handleGet("jobs")(c) }
func (g *Gateway) updateJob(c *gin.Context) { g.handleKubeUpdate("jobs")(c) }
func (g *Gateway) patchJob(c *gin.Context)  { g.handleKubePatch("jobs")(c) }
func (g *Gateway) deleteJob(c *gin.Context) { g.handleKubeDelete("jobs")(c) }

// --- Job sub-resource handlers ---

func (g *Gateway) jobMetrics(c *gin.Context) { c.JSON(501, gin.H{"message": "not implemented"}) }
func (g *Gateway) jobLogs(c *gin.Context)    { c.JSON(501, gin.H{"message": "not implemented"}) }

// --- Task handlers ---

func (g *Gateway) listTasks(c *gin.Context)  { g.handleList("tasks")(c) }
func (g *Gateway) createTask(c *gin.Context) { g.handleKubeCreate("tasks")(c) }
func (g *Gateway) getTask(c *gin.Context)    { g.handleGet("tasks")(c) }
func (g *Gateway) updateTask(c *gin.Context) { g.handleKubeUpdate("tasks")(c) }
func (g *Gateway) patchTask(c *gin.Context)  { g.handleKubePatch("tasks")(c) }
func (g *Gateway) deleteTask(c *gin.Context) { g.handleKubeDelete("tasks")(c) }
