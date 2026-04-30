package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimiterConfig holds configurable knobs for the fixed-window rate limiter.
type RateLimiterConfig struct {
	// MaxRequests is the number of requests allowed within the Window. Default: 100.
	MaxRequests int
	// Window is the duration of the fixed window. Default: 1 minute.
	Window time.Duration
	// KeyPrefix is prepended to the Redis key. Default: "rl:".
	KeyPrefix string
}

// RateLimiter returns a Gin middleware that limits requests per IP using a
// Redis fixed-window counter. When the limit is exceeded a 429 Too Many
// Requests response is returned with a Retry-After header.
// If Redis is nil, the middleware passes through without rate limiting.
func RateLimiter(rdb *redis.Client, cfg *RateLimiterConfig) gin.HandlerFunc {
	if cfg == nil {
		cfg = &RateLimiterConfig{}
	}
	if cfg.MaxRequests <= 0 {
		cfg.MaxRequests = 100
	}
	if cfg.Window <= 0 {
		cfg.Window = 1 * time.Minute
	}
	if cfg.KeyPrefix == "" {
		cfg.KeyPrefix = "rl:"
	}

	return func(c *gin.Context) {
		// If Redis is unavailable, fail open to avoid blocking traffic
		if rdb == nil {
			c.Next()
			return
		}

		ctx := c.Request.Context()
		ip := c.ClientIP()
		key := fmt.Sprintf("%s%s", cfg.KeyPrefix, ip)

		// INCR atomically; if this is the first hit in the window it creates
		// the key with value 1.
		count, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			// If Redis is unreachable, fail open to avoid blocking traffic.
			c.Next()
			return
		}

		// Set expiry on the first request of the window.
		if count == 1 {
			rdb.Expire(ctx, key, cfg.Window)
		}

		// Fetch remaining TTL for the Retry-After header.
		ttl, _ := rdb.TTL(ctx, key).Result()
		remaining := cfg.MaxRequests - int(count)
		if remaining < 0 {
			remaining = 0
		}

		// Expose rate-limit info via standard headers.
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", cfg.MaxRequests))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(ttl).Unix()))

		if int(count) > cfg.MaxRequests {
			retryAfter := int(ttl.Seconds())
			if retryAfter <= 0 {
				retryAfter = int(cfg.Window.Seconds())
			}
			c.Header("Retry-After", fmt.Sprintf("%d", retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "rate limit exceeded, try again later",
			})
			return
		}

		c.Next()
	}
}

// StrictRateLimiter is a convenience constructor for sensitive endpoints
// (e.g. login, register) with a tighter window.
func StrictRateLimiter(rdb *redis.Client) gin.HandlerFunc {
	return RateLimiter(rdb, &RateLimiterConfig{
		MaxRequests: 10,
		Window:      1 * time.Minute,
		KeyPrefix:   "rl:strict:",
	})
}
