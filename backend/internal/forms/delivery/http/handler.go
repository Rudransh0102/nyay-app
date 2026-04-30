package formshttp

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"nyay-api/pkg/config"
	"nyay-api/pkg/response"
)

type Handler struct {
	db  *sql.DB
	rdb *redis.Client
	cfg *config.Config
}

func RegisterRoutes(rg *gin.RouterGroup, db *sql.DB, rdb *redis.Client, cfg *config.Config) {
	h := &Handler{db: db, rdb: rdb, cfg: cfg}
	forms := rg.Group("/forms")
	{
		forms.GET("", h.ListForms)
		forms.GET("/:id/download", h.DownloadForm)
	}
}

func (h *Handler) ListForms(c *gin.Context) {
	category := c.Query("category")
	
	// Mock list for now
	forms := []map[string]string{
		{"id": "1", "title": "PAN Card Application", "category": "Government", "type": "PDF"},
		{"id": "2", "title": "ITR-1 (Sahaj)", "category": "Taxation", "type": "PDF"},
	}
	
	filtered := []map[string]string{}
	for _, f := range forms {
		if category == "" || f["category"] == category {
			filtered = append(filtered, f)
		}
	}

	response.Success(c, filtered)
}

func (h *Handler) DownloadForm(c *gin.Context) {
	// In production: Redirect to Supabase Storage signed URL
	response.Success(c, gin.H{"url": "https://supabase-storage.url/mock-form.pdf"})
}
