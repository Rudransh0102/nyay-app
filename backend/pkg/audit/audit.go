package audit

import (
	"context"
	"database/sql"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/google/uuid"
)

// Action represents the type of auditable event.
type Action string

const (
	ActionUserRegistered  Action = "USER_REGISTERED"
	ActionUserLogin       Action = "USER_LOGIN"
	ActionUserLogout      Action = "USER_LOGOUT"
	ActionComplaintFiled  Action = "COMPLAINT_FILED"
	ActionBookmarkAdded   Action = "BOOKMARK_ADDED"
	ActionBookmarkRemoved Action = "BOOKMARK_REMOVED"
	ActionTokenRefreshed  Action = "TOKEN_REFRESHED"
)

// Entry is a single audit log row.
type Entry struct {
	ID        string                 `json:"id"         db:"id"`
	UserID    *string                `json:"user_id"    db:"user_id"`
	Action    Action                 `json:"action"     db:"action"`
	IP        string                 `json:"ip"         db:"ip"`
	UserAgent string                 `json:"user_agent" db:"user_agent"`
	Metadata  map[string]interface{} `json:"metadata"   db:"metadata"`
	CreatedAt time.Time              `json:"created_at" db:"created_at"`
}

// Logger provides a simple interface for recording audit events.
type Logger struct {
	db  *sql.DB
	log *slog.Logger
}

// NewLogger creates an audit logger backed by PostgreSQL.
func NewLogger(db *sql.DB, log *slog.Logger) *Logger {
	return &Logger{db: db, log: log}
}

// Record writes an audit entry to the audit_logs table. It is intentionally
// fire-and-forget: a failure to audit should never block the request path.
func (l *Logger) Record(ctx context.Context, entry Entry) {
	go func() {
		if entry.ID == "" {
			entry.ID = uuid.New().String()
		}
		if entry.CreatedAt.IsZero() {
			entry.CreatedAt = time.Now()
		}

		metaJSON, err := json.Marshal(entry.Metadata)
		if err != nil {
			metaJSON = []byte("{}")
		}

		_, err = l.db.ExecContext(ctx,
			`INSERT INTO audit_logs (id, user_id, action, ip, user_agent, metadata, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			entry.ID, entry.UserID, string(entry.Action), entry.IP, entry.UserAgent, string(metaJSON), entry.CreatedAt,
		)
		if err != nil {
			l.log.Warn("audit: failed to record", "action", entry.Action, "error", err)
		}
	}()
}

// RecordSimple is a convenience method for the common case.
func (l *Logger) RecordSimple(ctx context.Context, action Action, userID, ip, ua string, meta map[string]interface{}) {
	var uid *string
	if userID != "" {
		uid = &userID
	}
	l.Record(ctx, Entry{
		UserID:    uid,
		Action:    action,
		IP:        ip,
		UserAgent: ua,
		Metadata:  meta,
	})
}
