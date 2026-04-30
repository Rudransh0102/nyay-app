package caseshttp

import (
	"database/sql"
	"strconv"

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
	cases := rg.Group("/cases")
	{
		cases.GET("/search", h.Search)
		cases.GET("/:id",    h.GetByID)
		cases.GET("/courts", h.GetCourts)
	}
}

func (h *Handler) Search(c *gin.Context) {
	q := c.Query("q")
	courtID := c.Query("court_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 { page = 1 }
	if limit > 50 { limit = 50 }
	offset := (page - 1) * limit

	query := `SELECT c.id, c.title, c.citation, c.judgment_date, c.summary, c.status, ct.name as court_name 
	          FROM cases c 
	          LEFT JOIN courts ct ON c.court_id = ct.id 
	          WHERE 1=1`
	args := []interface{}{}
	idx := 1

	if q != "" {
		query += ` AND (c.title ILIKE '%' || $` + strconv.Itoa(idx) + ` || '%' OR c.summary ILIKE '%' || $` + strconv.Itoa(idx) + ` || '%')`
		args = append(args, q)
		idx++
	}

	if courtID != "" {
		query += ` AND c.court_id = $` + strconv.Itoa(idx)
		args = append(args, courtID)
		idx++
	}

	query += ` ORDER BY c.judgment_date DESC LIMIT $` + strconv.Itoa(idx) + ` OFFSET $` + strconv.Itoa(idx+1)
	args = append(args, limit, offset)

	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		response.Internal(c)
		return
	}
	defer rows.Close()

	cases := []map[string]interface{}{}
	for rows.Next() {
		var id, title, citation, status, courtName string
		var summary sql.NullString
		var judgmentDate sql.NullTime
		if err := rows.Scan(&id, &title, &citation, &judgmentDate, &summary, &status, &courtName); err != nil {
			continue
		}
		cases = append(cases, map[string]interface{}{
			"id": id, "title": title, "citation": citation, 
			"judgment_date": judgmentDate.Time, "summary": summary.String, 
			"status": status, "court": courtName,
		})
	}

	response.Success(c, cases)
}

func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	query := `SELECT c.id, c.title, c.citation, c.judgment_date, c.summary, c.full_judgment, c.ai_summary, c.status, ct.name as court_name 
	          FROM cases c 
	          LEFT JOIN courts ct ON c.court_id = ct.id 
	          WHERE c.id = $1`
	
	var caseData struct {
		ID           string         `json:"id"`
		Title        string         `json:"title"`
		Citation     string         `json:"citation"`
		Date         sql.NullTime   `json:"judgment_date"`
		Summary      sql.NullString `json:"summary"`
		FullJudgment sql.NullString `json:"full_judgment"`
		AISummary    sql.NullString `json:"ai_summary"`
		Status       string         `json:"status"`
		Court        string         `json:"court"`
	}

	err := h.db.QueryRowContext(c.Request.Context(), query, id).Scan(
		&caseData.ID, &caseData.Title, &caseData.Citation, &caseData.Date, 
		&caseData.Summary, &caseData.FullJudgment, &caseData.AISummary, &caseData.Status, &caseData.Court,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			response.NotFound(c, "case not found")
			return
		}
		response.Internal(c)
		return
	}

	response.Success(c, caseData)
}

func (h *Handler) GetCourts(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(), `SELECT id, name, type FROM courts ORDER BY name ASC`)
	if err != nil {
		response.Internal(c)
		return
	}
	defer rows.Close()

	courts := []map[string]interface{}{}
	for rows.Next() {
		var id, name, courtType string
		if err := rows.Scan(&id, &name, &courtType); err != nil {
			continue
		}
		courts = append(courts, map[string]interface{}{"id": id, "name": name, "type": courtType})
	}
	response.Success(c, courts)
}
