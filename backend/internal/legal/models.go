package legal

import (
	"time"

	"github.com/google/uuid"
)

type Act struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Year        int       `json:"year"`
	IconURL     string    `json:"icon_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Section struct {
	ID            uuid.UUID `json:"id"`
	ActID         uuid.UUID `json:"act_id"`
	SectionNumber string    `json:"section_number"`
	Title         string    `json:"title"`
	Content       string    `json:"content"`
	Chapter       string    `json:"chapter,omitempty"`
	ChapterTitle  string    `json:"chapter_title,omitempty"`
	PlainSummary  string    `json:"plain_summary,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ActListParams struct {
	Query    string
	Category string
	Page     int
	Limit    int
}

type SectionListParams struct {
	Page  int
	Limit int
}
