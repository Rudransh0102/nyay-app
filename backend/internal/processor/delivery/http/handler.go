package processorhttp

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"nyay-api/pkg/config"
	"nyay-api/pkg/middleware"
	"nyay-api/pkg/response"
)

type Handler struct {
	rdb *redis.Client
	cfg *config.Config
}

func RegisterRoutes(rg *gin.RouterGroup, rdb *redis.Client, cfg *config.Config) {
	h := &Handler{rdb: rdb, cfg: cfg}
	processor := rg.Group("/processor")
	{
		protected := processor.Group("", middleware.JWTAuth(cfg.JWTSecret, cfg.JWKSURL))
		{
			protected.POST("/upload", h.Upload)
			protected.GET("/status/:id", h.Status)
		}
	}
}

func (h *Handler) Upload(c *gin.Context) {
	// Mock upload process
	// 1. Receive file
	// 2. Save to Supabase Storage
	// 3. Queue background job for OCR/NER
	response.Success(c, gin.H{
		"job_id": "job_98765",
		"status": "queued",
		"features": []string{"ocr", "ner", "pii_redaction"},
	})
}

func (h *Handler) Status(c *gin.Context) {
	id := c.Param("id")
	// Mock status check
	response.Success(c, gin.H{
		"job_id": id,
		"status": "processing",
		"progress": 45,
		"current_task": "performing_ocr",
	})
}
