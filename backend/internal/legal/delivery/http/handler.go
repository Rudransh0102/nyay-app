package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"nyay-api/internal/legal"
	"nyay-api/internal/legal/usecase"
	"nyay-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type LegalHandler struct {
	useCase usecase.LegalUseCase
	rdb     *redis.Client
}

func NewLegalHandler(useCase usecase.LegalUseCase, rdb *redis.Client) *LegalHandler {
	return &LegalHandler{useCase: useCase, rdb: rdb}
}

func (h *LegalHandler) GetActs(c *gin.Context) {
	page := clampInt(getIntQuery(c, "page", 1), 1, 10_000)
	limit := clampInt(getIntQuery(c, "limit", 20), 1, 100)
	query := strings.TrimSpace(c.Query("q"))
	category := strings.TrimSpace(c.Query("category"))
	if strings.EqualFold(category, "all") {
		category = ""
	}

	params := legal.ActListParams{Query: query, Category: category, Page: page, Limit: limit}
	cacheKey := fmt.Sprintf("legal:acts:v1:%d:%d:%s:%s", page, limit, query, category)
	if payload, ok := h.cacheGet(c, cacheKey); ok {
		c.Data(http.StatusOK, "application/json", payload)
		return
	}

	acts, total, err := h.useCase.GetActs(c.Request.Context(), params)
	if err != nil {
		response.Internal(c)
		return
	}

	payload, err := buildPaginatedPayload(acts, total, page, limit)
	if err != nil {
		response.Internal(c)
		return
	}
	if h.rdb != nil {
		h.cacheSet(c, cacheKey, payload, 3*time.Minute)
	}
	response.Raw(c, payload)
}

func (h *LegalHandler) GetActDetails(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid act id")
		return
	}

	page := clampInt(getIntQuery(c, "page", 1), 1, 10_000)
	limit := clampInt(getIntQuery(c, "limit", 100), 1, 500)

	cacheKey := fmt.Sprintf("legal:act:v1:%s:%d:%d", id.String(), page, limit)
	if payload, ok := h.cacheGet(c, cacheKey); ok {
		c.Data(http.StatusOK, "application/json", payload)
		return
	}

	act, sections, total, err := h.useCase.GetActDetails(c.Request.Context(), id, legal.SectionListParams{Page: page, Limit: limit})
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	result := gin.H{
		"success":  true,
		"act":      act,
		"sections": sections,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (int(total) + limit - 1) / limit,
		},
	}
	payload, err := json.Marshal(result)
	if err != nil {
		response.Internal(c)
		return
	}
	if h.rdb != nil {
		h.cacheSet(c, cacheKey, payload, 5*time.Minute)
	}
	response.Raw(c, payload)
}

func (h *LegalHandler) GetSection(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "invalid section id")
		return
	}

	cacheKey := fmt.Sprintf("legal:section:v1:%s", id.String())
	if payload, ok := h.cacheGet(c, cacheKey); ok {
		c.Data(http.StatusOK, "application/json", payload)
		return
	}

	section, err := h.useCase.GetSection(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	payload, err := json.Marshal(section)
	if err != nil {
		response.Internal(c)
		return
	}
	if h.rdb != nil {
		h.cacheSet(c, cacheKey, payload, 10*time.Minute)
	}
	response.Raw(c, payload)
}

func getIntQuery(c *gin.Context, key string, fallback int) int {
	value := strings.TrimSpace(c.Query(key))
	if value == "" {
		return fallback
	}
	var out int
	if _, err := fmt.Sscanf(value, "%d", &out); err != nil {
		return fallback
	}
	return out
}

func clampInt(value, min, max int) int {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

func buildPaginatedPayload(data interface{}, total int64, page, limit int) ([]byte, error) {
	result := gin.H{
		"success": true,
		"data":    data,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (int(total) + limit - 1) / limit,
		},
	}
	return json.Marshal(result)
}

func (h *LegalHandler) cacheGet(c *gin.Context, key string) ([]byte, bool) {
	if h.rdb == nil {
		return nil, false
	}
	ctx := c.Request.Context()
	val, err := h.rdb.Get(ctx, key).Bytes()
	if err != nil {
		return nil, false
	}
	return val, true
}

func (h *LegalHandler) cacheSet(c *gin.Context, key string, payload []byte, ttl time.Duration) {
	if h.rdb == nil {
		return
	}
	ctx := c.Request.Context()
	_ = h.rdb.Set(ctx, key, payload, ttl).Err()
}
