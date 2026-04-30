package domain

import "time"

// ─── User ─────────────────────────────────────────────────────────────────────

type Role string

const (
	RoleCitizen Role = "citizen"
	RoleLawyer  Role = "lawyer"
	RoleAdmin   Role = "admin"
)

type User struct {
	ID           string    `json:"id"            db:"id"`
	Name         string    `json:"name"          db:"name"`
	Email        string    `json:"email"         db:"email"`
	PasswordHash string    `json:"-"             db:"password_hash"`
	Role         Role      `json:"role"          db:"role"`
	Phone        *string   `json:"phone,omitempty" db:"phone"`
	Avatar       *string   `json:"avatar,omitempty" db:"avatar"`
	CreatedAt    time.Time `json:"created_at"   db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"   db:"updated_at"`
}

// ─── Legal Document ───────────────────────────────────────────────────────────

type DocumentType string

const (
	DocTypeConstitution DocumentType = "constitution"
	DocTypeAct          DocumentType = "act"
	DocTypeAmendment    DocumentType = "amendment"
)

type LegalDocument struct {
	ID            string       `json:"id"                      db:"id"`
	Title         string       `json:"title"                   db:"title"`
	Type          DocumentType `json:"type"                    db:"type"`
	Part          *string      `json:"part,omitempty"          db:"part"`
	ArticleNumber *int         `json:"article_number,omitempty" db:"article_number"`
	ArticleTitle  *string      `json:"article_title,omitempty" db:"article_title"`
	Content       string       `json:"content"                 db:"content"`
	Language      string       `json:"language"                db:"language"`
	Tags          []string     `json:"tags"                    db:"tags"`
	CreatedAt     time.Time    `json:"created_at"              db:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"              db:"updated_at"`
}

// ─── Complaint ────────────────────────────────────────────────────────────────

type ComplaintStatus string

const (
	StatusPending  ComplaintStatus = "pending"
	StatusInReview ComplaintStatus = "in_review"
	StatusResolved ComplaintStatus = "resolved"
	StatusRejected ComplaintStatus = "rejected"
)

type Complaint struct {
	ID          string          `json:"id"           db:"id"`
	UserID      string          `json:"user_id"      db:"user_id"`
	Title       string          `json:"title"        db:"title"`
	Description string          `json:"description"  db:"description"`
	Category    string          `json:"category"     db:"category"`
	Status      ComplaintStatus `json:"status"       db:"status"`
	TrackingID  string          `json:"tracking_id"  db:"tracking_id"`
	Attachments []string        `json:"attachments"  db:"attachments"`
	CreatedAt   time.Time       `json:"created_at"   db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"   db:"updated_at"`
}

// ─── Bookmark ─────────────────────────────────────────────────────────────────

type Bookmark struct {
	ID        string    `json:"id"        db:"id"`
	UserID    string    `json:"user_id"   db:"user_id"`
	LegalID   string    `json:"legal_id"  db:"legal_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
