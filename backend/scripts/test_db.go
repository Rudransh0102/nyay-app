package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"nyay-api/infrastructure/postgres"
)

func main() {
	projectRoot, err := findProjectRoot()
	if err != nil {
		fmt.Printf("Could not locate project root: %v\n", err)
		return
	}

	_ = godotenv.Load(filepath.Join(projectRoot, ".env"))

	dbURL := postgres.NormalizeDSN(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		fmt.Println("Missing DATABASE_URL in .env")
		return
	}

	fmt.Println("Testing Supabase Postgres connection from DATABASE_URL")

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		fmt.Printf("Open failed: %v\n", err)
		return
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		fmt.Printf("Ping failed: %v\n", err)
		return
	}

	fmt.Println("Successfully connected to Supabase Postgres via Go!")
}

func findProjectRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		if fileExists(filepath.Join(dir, "go.mod")) && fileExists(filepath.Join(dir, "cmd", "api", "main.go")) {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("backend root not found")
		}
		dir = parent
	}
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}
