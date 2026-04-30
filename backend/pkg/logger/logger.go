package logger

import (
	"log/slog"
	"os"
)

// New creates a structured logger. JSON format in production, text otherwise.
func New(env string) *slog.Logger {
	var handler slog.Handler
	opts := &slog.HandlerOptions{
		Level:     slog.LevelDebug,
		AddSource: env == "production",
	}
	if env == "production" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}
	return slog.New(handler)
}
