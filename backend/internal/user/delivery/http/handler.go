package userhttp

import (
	"database/sql"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"nyay-api/pkg/config"
	"nyay-api/pkg/middleware"
	"nyay-api/pkg/response"
)

type Handler struct {
	db  *sql.DB
	rdb *redis.Client
	cfg *config.Config
}

func RegisterRoutes(rg *gin.RouterGroup, db *sql.DB, rdb *redis.Client, cfg *config.Config) {
	h := &Handler{db: db, rdb: rdb, cfg: cfg}
	auth := middleware.JWTAuth(cfg.JWTSecret, cfg.JWKSURL)

	bookmarks := rg.Group("/bookmarks", auth)
	{
		bookmarks.GET("", h.ListBookmarks)
		bookmarks.POST("/:id", h.AddBookmark)
		bookmarks.DELETE("/:id", h.RemoveBookmark)
	}

	profile := rg.Group("/profile", auth)
	{
		profile.GET("", h.GetProfile)
	}
}

func (h *Handler) ListBookmarks(c *gin.Context) {
	userID, _ := c.Get("user_id")
	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT ld.id, ld.title, ld.type, ld.part, ld.article_number, ld.article_title, ld.content, ld.language
		 FROM bookmarks b
		 JOIN legal_documents ld ON ld.id = b.legal_id
		 WHERE b.user_id = $1
		 ORDER BY b.created_at DESC`, userID,
	)
	if err != nil {
		response.Internal(c)
		return
	}
	defer rows.Close()

	docs := []map[string]interface{}{}
	for rows.Next() {
		var id, title, docType, content, language string
		var part, articleTitle *string
		var articleNumber *int
		if err := rows.Scan(&id, &title, &docType, &part, &articleNumber, &articleTitle, &content, &language); err != nil {
			continue
		}
		docs = append(docs, map[string]interface{}{
			"id": id, "title": title, "type": docType, "part": part,
			"article_number": articleNumber, "article_title": articleTitle,
			"content": content, "language": language, "bookmarked": true, "tags": []string{},
		})
	}
	response.Success(c, docs)
}

func (h *Handler) AddBookmark(c *gin.Context) {
	userID, _ := c.Get("user_id")
	legalID := c.Param("id")

	_, err := h.db.ExecContext(c.Request.Context(),
		`INSERT INTO bookmarks (user_id, legal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, legalID,
	)
	if err != nil {
		response.Internal(c)
		return
	}
	response.Success(c, gin.H{"bookmarked": true})
}

func (h *Handler) RemoveBookmark(c *gin.Context) {
	userID, _ := c.Get("user_id")
	legalID := c.Param("id")

	_, err := h.db.ExecContext(c.Request.Context(),
		`DELETE FROM bookmarks WHERE user_id=$1 AND legal_id=$2`, userID, legalID,
	)
	if err != nil {
		response.Internal(c)
		return
	}
	response.Success(c, gin.H{"bookmarked": false})
}
func (h *Handler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	email, _ := c.Get("email")
	role, _ := c.Get("role")
	var profile struct {
		ID        string  `json:"id"`
		Name      string  `json:"name"`
		Email     string  `json:"email"`
		Phone     *string `json:"phone"`
		Avatar    *string `json:"avatar"`
		CreatedAt string  `json:"created_at"`
	}
	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT id, COALESCE(name, ''), COALESCE(email, ''), created_at::text FROM profiles WHERE id = $1`, userID).
		Scan(&profile.ID, &profile.Name, &profile.Email, &profile.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			name := profileNameFromEmail(email)
			err = h.db.QueryRowContext(c.Request.Context(),
				`INSERT INTO profiles (id, email, name)
				 VALUES ($1, $2, $3)
				 ON CONFLICT (id) DO UPDATE
				 SET email = COALESCE(NULLIF(profiles.email, ''), EXCLUDED.email),
					 name = COALESCE(NULLIF(profiles.name, ''), EXCLUDED.name)
				 RETURNING id, COALESCE(name, ''), COALESCE(email, ''), created_at::text`,
				userID, email, name).
				Scan(&profile.ID, &profile.Name, &profile.Email, &profile.CreatedAt)
			if err != nil {
				response.Internal(c)
				return
			}
		} else {
			response.Internal(c)
			return
		}
	}

	h.ensureUserRole(c, userID, role)

	// Fetch roles
	rows, _ := h.db.QueryContext(c.Request.Context(),
		`SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1`, userID)
	roles := []string{}
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var r string
			rows.Scan(&r)
			roles = append(roles, r)
		}
	}

	response.Success(c, gin.H{
		"profile": profile,
		"roles":   roles,
	})
}

func profileNameFromEmail(emailValue interface{}) string {
	email, _ := emailValue.(string)
	email = strings.TrimSpace(email)
	if email == "" {
		return "User"
	}
	name, _, ok := strings.Cut(email, "@")
	if !ok || strings.TrimSpace(name) == "" {
		return email
	}
	return name
}

func (h *Handler) ensureUserRole(c *gin.Context, userIDValue interface{}, roleValue interface{}) {
	roleName, _ := roleValue.(string)
	if strings.TrimSpace(roleName) == "" {
		roleName = "citizen"
	}

	_, _ = h.db.ExecContext(c.Request.Context(),
		`INSERT INTO user_roles (user_id, role_id)
		 SELECT $1, r.id
		 FROM roles r
		 WHERE r.name = $2
		 ON CONFLICT DO NOTHING`,
		userIDValue, roleName)
}
