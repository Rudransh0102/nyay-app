package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"nyay-api/infrastructure/postgres"
	redisclient "nyay-api/infrastructure/redis"
	aihttp "nyay-api/internal/ai/delivery/http"
	caseshttp "nyay-api/internal/cases/delivery/http"
	complainthttp "nyay-api/internal/complaint/delivery/http"
	draftinghttp "nyay-api/internal/drafting/delivery/http"
	formshttp "nyay-api/internal/forms/delivery/http"
	legalhttp "nyay-api/internal/legal/delivery/http"
	processorhttp "nyay-api/internal/processor/delivery/http"
	userhttp "nyay-api/internal/user/delivery/http"
	"nyay-api/pkg/config"
	"nyay-api/pkg/logger"
	"nyay-api/pkg/middleware"
)

func main() {
	projectRoot, envPath, err := loadEnv()
	if err != nil {
		slog.Error("Failed to load environment", "error", err)
		os.Exit(1)
	}

	// ─── Config ────────────────────────────────────────────────────────────
	cfg, err := config.Load(projectRoot)
	if err != nil {
		slog.Error("Invalid configuration", "error", err)
		os.Exit(1)
	}

	// ─── Logger ────────────────────────────────────────────────────────────
	log := logger.New(cfg.Environment)
	slog.SetDefault(log)

	dbInfo := postgres.DescribeDSN(postgres.NormalizeDSN(cfg.DatabaseURL))
	log.Info(
		"Configuration loaded",
		"project_root", cfg.ProjectRoot,
		"env_file", envPath,
		"db_host", dbInfo.Host,
		"db_port", dbInfo.Port,
		"db_name", dbInfo.Database,
		"db_user", dbInfo.User,
		"db_sslmode", dbInfo.SSLMode,
		"db_is_supabase", dbInfo.IsSupabase,
		"db_is_pooler", dbInfo.IsPooler,
		"db_url", dbInfo.MaskedDSN,
	)

	// ─── Database ──────────────────────────────────────────────────────────

	db, err := postgres.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Error("Failed to connect to postgres", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// ─── Redis ─────────────────────────────────────────────────────────────
	rdb := redisclient.Connect(cfg.RedisURL)
	if rdb != nil {
		defer rdb.Close()
	}

	// ─── Gin ───────────────────────────────────────────────────────────────
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestLogger(log))
	r.Use(middleware.RateLimiter(rdb, nil)) // 100 req/min per IP
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ─── Health ────────────────────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "version": "1.0.0"})
	})

	// ─── API v1 ────────────────────────────────────────────────────────────
	v1 := r.Group("/api/v1")
	{
		legalhttp.RegisterRoutes(v1, db, rdb, cfg)
		complainthttp.RegisterRoutes(v1, db, rdb, cfg)
		userhttp.RegisterRoutes(v1, db, rdb, cfg)
		caseshttp.RegisterRoutes(v1, db, rdb, cfg)
		draftinghttp.RegisterRoutes(v1, db, rdb, cfg)
		aihttp.RegisterRoutes(v1, rdb, cfg)
		formshttp.RegisterRoutes(v1, db, rdb, cfg)
		processorhttp.RegisterRoutes(v1, rdb, cfg)
	}

	// ─── Server ────────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info("Server starting", "addr", srv.Addr, "env", cfg.Environment)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("Server error", "error", err)
			os.Exit(1)
		}
	}()

	// ─── Graceful Shutdown ─────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("Shutting down server…")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Error("Server forced to shutdown", "error", err)
	}
	log.Info("Server exited")
}

func loadEnv() (projectRoot string, envPath string, err error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", "", err
	}

	projectRoot, err = findProjectRoot(cwd)
	if err != nil {
		return "", "", err
	}

	candidates := []string{
		filepath.Join(cwd, ".env"),
		filepath.Join(projectRoot, ".env"),
	}

	exePath, exeErr := os.Executable()
	if exeErr == nil {
		exeDir := filepath.Dir(exePath)
		candidates = append(candidates, filepath.Join(exeDir, ".env"))
		if exeRoot, rootErr := findProjectRoot(exeDir); rootErr == nil {
			candidates = append(candidates, filepath.Join(exeRoot, ".env"))
		}
	}

	var loadErrs []error
	seen := make(map[string]struct{}, len(candidates))
	for _, candidate := range candidates {
		candidate = filepath.Clean(candidate)
		if _, ok := seen[candidate]; ok {
			continue
		}
		seen[candidate] = struct{}{}

		if err := godotenv.Load(candidate); err == nil {
			return projectRoot, candidate, nil
		} else if !errors.Is(err, os.ErrNotExist) {
			loadErrs = append(loadErrs, err)
		}
	}

	if len(loadErrs) > 0 {
		return "", "", errors.Join(loadErrs...)
	}

	return projectRoot, "", nil
}

func findProjectRoot(start string) (string, error) {
	dir, err := filepath.Abs(start)
	if err != nil {
		return "", err
	}

	for {
		goModPath := filepath.Join(dir, "go.mod")
		cmdAPIPath := filepath.Join(dir, "cmd", "api", "main.go")
		rootMainPath := filepath.Join(dir, "main.go")
		if fileExists(goModPath) && (fileExists(cmdAPIPath) || fileExists(rootMainPath)) {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return "", errors.New("could not locate backend project root")
		}
		dir = parent
	}
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}
