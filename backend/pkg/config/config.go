package config

import (
	"fmt"
	"os"
	"strings"
	"time"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	ProjectRoot string

	Port        string
	Environment string

	DatabaseURL string
	RedisURL    string
	MeiliURL    string
	MeiliAPIKey string

	// JWTSecret must match the Supabase project's JWT secret (Legacy HS256)
	JWTSecret string
	// JWKSURL is the Supabase JWKS endpoint (Advanced ES256)
	JWKSURL              string
	JWTAccessExpiration  time.Duration
	JWTRefreshExpiration time.Duration

	AllowedOrigins []string
}

func Load(projectRoot string) (*Config, error) {
	databaseURL := strings.TrimSpace(getEnv("DATABASE_URL", ""))
	// Common misconfiguration: pasting the whole `.env` line as the value.
	// Example: DATABASE_URL="DATABASE_URL=postgres://..."
	databaseURL = strings.TrimPrefix(databaseURL, "DATABASE_URL=")

	cfg := &Config{
		ProjectRoot: projectRoot,

		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("APP_ENV", "development"),

		DatabaseURL: databaseURL,
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
		MeiliURL:    getEnv("MEILI_URL", ""),
		MeiliAPIKey: getEnv("MEILI_API_KEY", ""),

		JWTSecret:            getEnv("JWT_SECRET", ""),
		JWKSURL:              getEnv("JWKS_URL", ""),
		JWTAccessExpiration:  parseDuration(getEnv("JWT_ACCESS_EXP", "15m")),
		JWTRefreshExpiration: parseDuration(getEnv("JWT_REFRESH_EXP", "168h")),

		AllowedOrigins: sanitizeAllowedOrigins(getEnv("ALLOWED_ORIGINS", "http://localhost:8081")),
	}

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) Validate() error {
	var missing []string
	if strings.TrimSpace(c.DatabaseURL) == "" {
		missing = append(missing, "DATABASE_URL")
	}
	// If the URL still looks like a key/value env assignment, reject it.
	isPostgresURL := strings.HasPrefix(c.DatabaseURL, "postgres://") || strings.HasPrefix(c.DatabaseURL, "postgresql://")
	if strings.Contains(c.DatabaseURL, "=") && !isPostgresURL {
		return fmt.Errorf("invalid DATABASE_URL (looks like an env assignment, not a URL): %q", c.DatabaseURL)
	}
	if strings.TrimSpace(c.JWTSecret) == "" {
		missing = append(missing, "JWT_SECRET")
	}
	if len(missing) > 0 {
		return fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}
	return nil
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 15 * time.Minute
	}
	return d
}

func sanitizeAllowedOrigins(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if p == "*" || strings.HasPrefix(p, "http://") || strings.HasPrefix(p, "https://") {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return []string{"http://localhost:8081"}
	}
	return out
}
