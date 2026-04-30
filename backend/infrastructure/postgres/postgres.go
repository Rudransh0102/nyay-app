package postgres

import (
	"database/sql"
	"fmt"
	"net"
	"net/url"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

type ConnectionInfo struct {
	Host       string
	Port       string
	Database   string
	User       string
	SSLMode    string
	MaskedDSN  string
	IsSupabase bool
	IsPooler   bool
}

// Connect opens and verifies a PostgreSQL connection with sensible pool settings.
func Connect(dsn string) (*sql.DB, error) {
	if strings.TrimSpace(dsn) == "" {
		return nil, fmt.Errorf("postgres: DATABASE_URL is empty")
	}

	normalizedDSN := NormalizeDSN(dsn)
	db, err := sql.Open("postgres", normalizedDSN)
	if err != nil {
		return nil, fmt.Errorf("postgres: open: %w", err)
	}

	info := DescribeDSN(normalizedDSN)
	if info.IsPooler {
		db.SetMaxOpenConns(10)
		db.SetMaxIdleConns(2)
		db.SetConnMaxLifetime(2 * time.Minute)
		db.SetConnMaxIdleTime(30 * time.Second)
	} else {
		db.SetMaxOpenConns(25)
		db.SetMaxIdleConns(10)
		db.SetConnMaxLifetime(5 * time.Minute)
		db.SetConnMaxIdleTime(2 * time.Minute)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("postgres: ping: %w", err)
	}

	return db, nil
}

func NormalizeDSN(dsn string) string {
	dsn = strings.TrimSpace(dsn)
	dsn = strings.TrimPrefix(dsn, "DATABASE_URL=")

	u, err := url.Parse(dsn)
	if err != nil || u.Host == "" {
		return dsn
	}

	host := u.Hostname()
	if !isSupabaseHost(host) && u.Port() != "6543" {
		return dsn
	}

	q := u.Query()
	if q.Get("sslmode") == "" {
		q.Set("sslmode", "require")
		u.RawQuery = q.Encode()
	}

	return u.String()
}

func DescribeDSN(dsn string) ConnectionInfo {
	u, err := url.Parse(dsn)
	if err != nil || u.Host == "" {
		return ConnectionInfo{MaskedDSN: maskDSNFallback(dsn)}
	}

	host := u.Hostname()
	port := u.Port()
	if port == "" {
		port = "5432"
	}

	q := u.Query()
	masked := *u
	username := ""
	if u.User != nil {
		username = u.User.Username()
		if _, ok := u.User.Password(); ok {
			masked.User = url.UserPassword(username, "xxxxx")
		} else {
			masked.User = url.User(username)
		}
	}

	return ConnectionInfo{
		Host:       host,
		Port:       port,
		Database:   strings.TrimPrefix(u.Path, "/"),
		User:       username,
		SSLMode:    q.Get("sslmode"),
		MaskedDSN:  masked.String(),
		IsSupabase: isSupabaseHost(host),
		IsPooler:   isPoolerHost(host) || port == "6543",
	}
}

func isSupabaseHost(host string) bool {
	host = strings.ToLower(host)
	return strings.HasSuffix(host, ".supabase.co") || strings.HasSuffix(host, ".pooler.supabase.com")
}

func isPoolerHost(host string) bool {
	return strings.Contains(strings.ToLower(host), ".pooler.supabase.com")
}

func maskDSNFallback(dsn string) string {
	if before, after, ok := strings.Cut(dsn, "@"); ok {
		if scheme, credentials, ok := strings.Cut(before, "://"); ok {
			if username, _, ok := strings.Cut(credentials, ":"); ok {
				return scheme + "://" + username + ":xxxxx@" + after
			}
		}
	}
	return net.JoinHostPort("unparseable-database-url", "unknown")
}
