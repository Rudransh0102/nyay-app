package aihttp

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"nyay-api/pkg/config"
	"nyay-api/pkg/middleware"
	"nyay-api/pkg/response"
)

// Citation represents a legal document reference
type Citation struct {
	Title   string `json:"title"`
	Article string `json:"article,omitempty"`
	Section string `json:"section,omitempty"`
	URL     string `json:"url,omitempty"`
}

// AIResponse is the standard response for AI queries
type AIResponse struct {
	Answer     string     `json:"answer"`
	Citations  []Citation `json:"citations"`
	Confidence float64    `json:"confidence"`
}

// SummarizeResponse is the response for summarization
type SummarizeResponse struct {
	Summary string `json:"summary"`
	Length  int    `json:"length"`
}

type Handler struct {
	rdb *redis.Client
	cfg *config.Config
	// TODO: Inject Meilisearch client for context search
	// TODO: Inject LLM client (OpenAI/local model)
}

func RegisterRoutes(rg *gin.RouterGroup, rdb *redis.Client, cfg *config.Config) {
	h := &Handler{rdb: rdb, cfg: cfg}
	ai := rg.Group("/ai")
	{
		protected := ai.Group("", middleware.JWTAuth(cfg.JWTSecret, cfg.JWKSURL))
		{
			protected.POST("/ask", h.AskAI)
			protected.POST("/summarize", h.Summarize)
		}
	}
}

func (h *Handler) AskAI(c *gin.Context) {
	var input struct {
		Query string `json:"query" binding:"required,min=5"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "Query is required and must be at least 5 characters")
		return
	}

	// TODO: IMPLEMENTATION REQUIRED
	// 1. Search Meilisearch with query to get relevant legal documents
	// 2. Pass query + context to LLM (OpenAI API or local model)
	// 3. Parse LLM response to extract citations
	// 4. Return formatted response with confidence score

	resp := AIResponse{
		Answer:     "This endpoint is not yet implemented. Please check back later.",
		Citations:  []Citation{},
		Confidence: 0,
	}

	response.Success(c, resp)
}

func (h *Handler) Summarize(c *gin.Context) {
	var input struct {
		Text string `json:"text" binding:"required,min=50"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, http.StatusBadRequest, "Text is required and must be at least 50 characters")
		return
	}

	// TODO: IMPLEMENTATION REQUIRED
	// 1. Validate input text length and format
	// 2. Pass text to summarization LLM endpoint
	// 3. Validate summary length (should be 30-40% of original)
	// 4. Return formatted response

	resp := SummarizeResponse{
		Summary: "This endpoint is not yet implemented. Please check back later.",
		Length:  0,
	}

	response.Success(c, resp)
}
