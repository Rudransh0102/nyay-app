package draftinghttp

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"nyay-api/pkg/config"
	"nyay-api/pkg/middleware"
	"nyay-api/pkg/response"
)

// Domain types (should be in internal/domain.go)
type DraftTemplate struct {
	ID          string `json:"id" db:"id"`
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`
	Category    string `json:"category" db:"category"`
	Content     string `json:"content" db:"content"`
}

type Draft struct {
	ID         string     `json:"id" db:"id"`
	UserID     string     `json:"user_id" db:"user_id"`
	TemplateID *string    `json:"template_id,omitempty" db:"template_id"`
	Title      string     `json:"title" db:"title"`
	Content    string     `json:"content" db:"content"`
	Status     string     `json:"status" db:"status"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at,omitempty" db:"updated_at"`
}

type Handler struct {
	db  *sql.DB
	rdb *redis.Client
	cfg *config.Config
}

func RegisterRoutes(rg *gin.RouterGroup, db *sql.DB, rdb *redis.Client, cfg *config.Config) {
	h := &Handler{db: db, rdb: rdb, cfg: cfg}
	drafting := rg.Group("/drafting")
	{
		drafting.GET("/templates", h.GetTemplates)
		drafting.GET("/templates/:id", h.GetTemplateByID)

		protected := drafting.Group("", middleware.JWTAuth(cfg.JWTSecret, cfg.JWKSURL))
		{
			protected.POST("/drafts", h.CreateDraft)
			protected.GET("/drafts", h.GetUserDrafts)
			protected.GET("/drafts/:id", h.GetDraftByID)
			protected.PATCH("/drafts/:id", h.UpdateDraft)
			protected.DELETE("/drafts/:id", h.DeleteDraft)
		}
	}
}

func (h *Handler) GetTemplates(c *gin.Context) {
	category := c.Query("category")

	var rows *sql.Rows
	var err error

	if category != "" {
		rows, err = h.db.QueryContext(c.Request.Context(),
			`SELECT id, name, description, category, content FROM draft_templates WHERE category = $1 ORDER BY name ASC`,
			category)
	} else {
		rows, err = h.db.QueryContext(c.Request.Context(),
			`SELECT id, name, description, category, content FROM draft_templates ORDER BY name ASC`)
	}

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to fetch templates")
		return
	}
	defer rows.Close()

	templates := make([]DraftTemplate, 0)
	for rows.Next() {
		var t DraftTemplate
		if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.Category, &t.Content); err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to parse template")
			return
		}
		templates = append(templates, t)
	}

	if err = rows.Err(); err != nil {
		response.Error(c, http.StatusInternalServerError, "Database error while scanning templates")
		return
	}

	response.Success(c, templates)
}

func (h *Handler) GetTemplateByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, http.StatusBadRequest, "Template ID is required")
		return
	}

	var template DraftTemplate
	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT id, name, description, category, content FROM draft_templates WHERE id = $1`,
		id).Scan(&template.ID, &template.Name, &template.Description, &template.Category, &template.Content)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			response.Error(c, http.StatusNotFound, "Template not found")
			return
		}
		response.Error(c, http.StatusInternalServerError, "Failed to fetch template")
		return
	}

	response.Success(c, template)
}

func (h *Handler) CreateDraft(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Error(c, http.StatusUnauthorized, "User ID not found in context")
		return
	}

	var input struct {
		TemplateID *string `json:"template_id"`
		Title      string  `json:"title" binding:"required,min=1"`
		Content    string  `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid input: title and content are required")
		return
	}

	var draftID string
	err := h.db.QueryRowContext(c.Request.Context(),
		`INSERT INTO user_drafts (user_id, template_id, title, content, status, created_at) 
		 VALUES ($1, $2, $3, $4, 'draft', NOW()) RETURNING id`,
		userID, input.TemplateID, input.Title, input.Content).Scan(&draftID)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to create draft")
		return
	}

	response.Created(c, gin.H{"id": draftID})
}

func (h *Handler) GetUserDrafts(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Error(c, http.StatusUnauthorized, "User ID not found in context")
		return
	}

	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT id, user_id, template_id, title, content, status, created_at, updated_at 
		 FROM user_drafts WHERE user_id = $1 ORDER BY created_at DESC`,
		userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to fetch drafts")
		return
	}
	defer rows.Close()

	drafts := make([]Draft, 0)
	for rows.Next() {
		var d Draft
		if err := rows.Scan(&d.ID, &d.UserID, &d.TemplateID, &d.Title, &d.Content, &d.Status, &d.CreatedAt, &d.UpdatedAt); err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to parse draft")
			return
		}
		drafts = append(drafts, d)
	}

	if err = rows.Err(); err != nil {
		response.Error(c, http.StatusInternalServerError, "Database error while scanning drafts")
		return
	}

	response.Success(c, drafts)
}

func (h *Handler) GetDraftByID(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	if id == "" || userID == "" {
		response.Error(c, http.StatusBadRequest, "Draft ID and User ID are required")
		return
	}

	var draft Draft
	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT id, user_id, template_id, title, content, status, created_at, updated_at 
		 FROM user_drafts WHERE id = $1 AND user_id = $2`,
		id, userID).Scan(&draft.ID, &draft.UserID, &draft.TemplateID, &draft.Title, &draft.Content, &draft.Status, &draft.CreatedAt, &draft.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			response.Error(c, http.StatusNotFound, "Draft not found")
			return
		}
		response.Error(c, http.StatusInternalServerError, "Failed to fetch draft")
		return
	}

	response.Success(c, draft)
}

func (h *Handler) UpdateDraft(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	if id == "" || userID == "" {
		response.Error(c, http.StatusBadRequest, "Draft ID and User ID are required")
		return
	}

	var input struct {
		Title   *string `json:"title"`
		Content *string `json:"content"`
		Status  *string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid input")
		return
	}

	// Validate at least one field is provided
	if input.Title == nil && input.Content == nil && input.Status == nil {
		response.Error(c, http.StatusBadRequest, "At least one field must be provided")
		return
	}

	result, err := h.db.ExecContext(c.Request.Context(),
		`UPDATE user_drafts 
		 SET title = COALESCE($1, title), 
		     content = COALESCE($2, content), 
		     status = COALESCE($3, status), 
		     updated_at = NOW() 
		 WHERE id = $4 AND user_id = $5`,
		input.Title, input.Content, input.Status, id, userID)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to update draft")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to verify update")
		return
	}

	if rowsAffected == 0 {
		response.Error(c, http.StatusNotFound, "Draft not found")
		return
	}

	response.Success(c, gin.H{"message": "Draft updated successfully"})
}

func (h *Handler) DeleteDraft(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	if id == "" || userID == "" {
		response.Error(c, http.StatusBadRequest, "Draft ID and User ID are required")
		return
	}

	result, err := h.db.ExecContext(c.Request.Context(),
		`DELETE FROM user_drafts WHERE id = $1 AND user_id = $2`,
		id, userID)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to delete draft")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to verify deletion")
		return
	}

	if rowsAffected == 0 {
		response.Error(c, http.StatusNotFound, "Draft not found")
		return
	}

	response.Success(c, gin.H{"message": "Draft deleted successfully"})
}
