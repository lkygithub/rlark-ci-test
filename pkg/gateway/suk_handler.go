package gateway

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (g *Gateway) handleListSSHUserKeys(c *gin.Context) {
	if g.dbClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SSH user keys not supported: database not configured"})
		return
	}
	// TODO: Implement logic to list SSH user keys
}

func (g *Gateway) handleCreateSSHUserKey(c *gin.Context) {
	if g.dbClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SSH user keys not supported: database not configured"})
		return
	}
	// TODO: Implement logic to create a new SSH user key
}

func (g *Gateway) handleDeleteSSHUserKey(c *gin.Context) {
	if g.dbClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SSH user keys not supported: database not configured"})
		return
	}
	// TODO: Implement logic to delete an SSH user key
}
