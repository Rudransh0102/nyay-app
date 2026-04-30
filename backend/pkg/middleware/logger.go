package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestLogger logs each HTTP request with method, path, status, latency, and client IP.
func RequestLogger(log *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path  := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status  := c.Writer.Status()
		level   := slog.LevelInfo
		if status >= 500 {
			level = slog.LevelError
		} else if status >= 400 {
			level = slog.LevelWarn
		}

		if query != "" {
			path += "?" + query
		}

		log.LogAttrs(c.Request.Context(), level, "HTTP",
			slog.String("method",  c.Request.Method),
			slog.String("path",    path),
			slog.Int("status",     status),
			slog.Duration("latency", latency),
			slog.String("ip",      c.ClientIP()),
			slog.String("user_agent", c.Request.UserAgent()),
		)
	}
}
