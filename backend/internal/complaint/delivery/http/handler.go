package complainthttp

import (
	"database/sql"
	"fmt"
	"log/slog"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"nyay-api/pkg/audit"
	"nyay-api/pkg/config"
	"nyay-api/pkg/middleware"
	"nyay-api/pkg/response"
)

type Handler struct {
	db    *sql.DB
	rdb   *redis.Client
	cfg   *config.Config
	audit *audit.Logger
}

func RegisterRoutes(rg *gin.RouterGroup, db *sql.DB, rdb *redis.Client, cfg *config.Config) {
	log := slog.Default()
	h := &Handler{db: db, rdb: rdb, cfg: cfg, audit: audit.NewLogger(db, log)}
	auth := middleware.JWTAuth(cfg.JWTSecret, cfg.JWKSURL)

	complaints := rg.Group("/complaints", auth)
	{
		complaints.POST("",           h.Create)
		complaints.GET("",            h.List)
		complaints.GET("/:id",        h.GetByID)
		complaints.GET("/track/:tid", h.Track)
	}
}

type createRequest struct {
	Title       string   `json:"title"       binding:"required,min=5"`
	Description string   `json:"description" binding:"required,min=20"`
	Category    string   `json:"category"    binding:"required"`
	Attachments []string `json:"attachments"`
}

func (h *Handler) Create(c *gin.Context) {
	var req createRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	userID, _ := c.Get("user_id")
	id         := uuid.New().String()
	trackingID := fmt.Sprintf("NYY-%d-%s", time.Now().Year(), strings.ToUpper(randomAlpha(6)))
	now         := time.Now()

	_, err := h.db.ExecContext(c.Request.Context(),
		`INSERT INTO complaints (id, user_id, title, description, category, status, tracking_id, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$7)`,
		id, userID, req.Title, req.Description, req.Category, trackingID, now,
	)
	if err != nil {
		response.Internal(c)
		return
	}

	// Audit
	h.audit.RecordSimple(c.Request.Context(), audit.ActionComplaintFiled, userID.(string), c.ClientIP(), c.Request.UserAgent(), map[string]interface{}{
		"tracking_id": trackingID, "category": req.Category,
	})

	response.Created(c, gin.H{
		"id": id, "user_id": userID, "title": req.Title, "description": req.Description,
		"category": req.Category, "status": "pending", "tracking_id": trackingID,
		"created_at": now, "updated_at": now,
	})
}

func (h *Handler) List(c *gin.Context) {
	userID, _ := c.Get("user_id")
	page, _    := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit       := 20
	offset      := (page - 1) * limit

	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT id, title, category, status, tracking_id, created_at, updated_at FROM complaints WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		response.Internal(c)
		return
	}
	defer rows.Close()

	list := []map[string]interface{}{}
	for rows.Next() {
		var id, title, category, status, trackingID string
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&id, &title, &category, &status, &trackingID, &createdAt, &updatedAt); err != nil { continue }
		list = append(list, map[string]interface{}{
			"id": id, "title": title, "category": category, "status": status,
			"tracking_id": trackingID, "created_at": createdAt, "updated_at": updatedAt,
		})
	}

	var total int64
	_ = h.db.QueryRowContext(c.Request.Context(), `SELECT COUNT(*) FROM complaints WHERE user_id=$1`, userID).Scan(&total)
	response.Paginated(c, list, total, page, limit)
}

func (h *Handler) GetByID(c *gin.Context) {
	id     := c.Param("id")
	userID, _ := c.Get("user_id")
	var title, category, status, trackingID string
	var createdAt, updatedAt time.Time

	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT title, category, status, tracking_id, created_at, updated_at FROM complaints WHERE id=$1 AND user_id=$2`,
		id, userID,
	).Scan(&title, &category, &status, &trackingID, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		response.NotFound(c, "complaint not found")
		return
	}
	if err != nil {
		response.Internal(c)
		return
	}
	response.Success(c, gin.H{
		"id": id, "title": title, "category": category, "status": status,
		"tracking_id": trackingID, "created_at": createdAt, "updated_at": updatedAt,
	})
}

func (h *Handler) Track(c *gin.Context) {
	tid := c.Param("tid")
	var id, title, status string
	var createdAt, updatedAt time.Time

	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT id, title, status, created_at, updated_at FROM complaints WHERE tracking_id=$1`, tid,
	).Scan(&id, &title, &status, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		response.NotFound(c, "tracking ID not found")
		return
	}
	if err != nil {
		response.Internal(c)
		return
	}
	response.Success(c, gin.H{"id": id, "title": title, "status": status, "tracking_id": tid, "created_at": createdAt, "updated_at": updatedAt})
}

func randomAlpha(n int) string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, n)
	for i := range b { b[i] = chars[r.Intn(len(chars))] }
	return string(b)
}
