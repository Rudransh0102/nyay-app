package http

import (
	"database/sql"

	meilisearchclient "nyay-api/infrastructure/meilisearch"
	"nyay-api/internal/legal/repository"
	"nyay-api/internal/legal/usecase"
	"nyay-api/pkg/config"

	"github.com/gin-gonic/gin"
	"github.com/meilisearch/meilisearch-go"
	"github.com/redis/go-redis/v9"
)

func RegisterRoutes(r *gin.RouterGroup, db *sql.DB, rdb *redis.Client, cfg *config.Config) {
	var meiliClient *meilisearch.Client
	if cfg.MeiliURL != "" {
		meiliClient = meilisearchclient.Connect(cfg.MeiliURL, cfg.MeiliAPIKey)
	}
	repo := repository.NewPostgresLegalRepository(db, meiliClient)
	uc := usecase.NewLegalUseCase(repo)
	h := NewLegalHandler(uc, rdb)

	// Compatibility routes: /api/v1/acts and /api/v1/sections/:id
	r.GET("/acts", h.GetActs)
	r.GET("/acts/:id", h.GetActDetails)
	r.GET("/sections/:id", h.GetSection)

	legalGroup := r.Group("/legal")
	{
		// Public routes for exploring
		legalGroup.GET("/acts", h.GetActs)
		legalGroup.GET("/acts/:id", h.GetActDetails)
		legalGroup.GET("/sections/:id", h.GetSection)

		// Protected routes (example, if we had POST/PUT)
		// legalGroup.POST("/acts", middleware.JWTAuth(cfg.JWTSecret, cfg.JWKSURL), h.CreateAct)
	}
}
