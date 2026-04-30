package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"nyay-api/internal/legal"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/meilisearch/meilisearch-go"
)

type LegalRepository interface {
	GetActs(ctx context.Context, params legal.ActListParams) ([]legal.Act, int64, error)
	GetActByID(ctx context.Context, id uuid.UUID) (*legal.Act, error)
	GetSectionsByActID(ctx context.Context, actID uuid.UUID, params legal.SectionListParams) ([]legal.Section, int64, error)
	GetSectionByID(ctx context.Context, id uuid.UUID) (*legal.Section, error)
}

type postgresLegalRepository struct {
	db    *sql.DB
	meili *meilisearch.Client
}

func NewPostgresLegalRepository(db *sql.DB, meili *meilisearch.Client) LegalRepository {
	return &postgresLegalRepository{db: db, meili: meili}
}

func (r *postgresLegalRepository) GetActs(ctx context.Context, params legal.ActListParams) ([]legal.Act, int64, error) {
	params = normalizeActParams(params)
	if params.Query != "" && r.meili != nil {
		acts, total, err := r.searchActsMeili(ctx, params)
		if err == nil {
			return acts, total, nil
		}
	}
	return r.searchActsPostgres(ctx, params)
}

func (r *postgresLegalRepository) GetActByID(ctx context.Context, id uuid.UUID) (*legal.Act, error) {
	query := `SELECT id, title, slug, description, category, year, created_at, updated_at FROM legal_acts WHERE id = $1`
	var a legal.Act
	var desc, cat sql.NullString
	var yr sql.NullInt32
	err := r.db.QueryRowContext(ctx, query, id).Scan(&a.ID, &a.Title, &a.Slug, &desc, &cat, &yr, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("act not found")
		}
		return nil, err
	}
	a.Description = desc.String
	a.Category = cat.String
	a.Year = int(yr.Int32)
	return &a, nil
}

func (r *postgresLegalRepository) GetSectionsByActID(ctx context.Context, actID uuid.UUID, params legal.SectionListParams) ([]legal.Section, int64, error) {
	params = normalizeSectionParams(params)
	offset := (params.Page - 1) * params.Limit

	var total int64
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM legal_sections WHERE act_id = $1`, actID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, act_id, section_number, title, content, plain_summary, created_at, updated_at
			  FROM legal_sections WHERE act_id = $1
			  ORDER BY
			    NULLIF(regexp_replace(section_number, '\D.*$', ''), '')::int NULLS LAST,
			    section_number ASC
			  LIMIT $2 OFFSET $3`
	rows, err := r.db.QueryContext(ctx, query, actID, params.Limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var sections []legal.Section
	for rows.Next() {
		var s legal.Section
		var summary sql.NullString
		err := rows.Scan(&s.ID, &s.ActID, &s.SectionNumber, &s.Title, &s.Content, &summary, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		s.PlainSummary = summary.String
		sections = append(sections, s)
	}
	return sections, total, nil
}

func (r *postgresLegalRepository) GetSectionByID(ctx context.Context, id uuid.UUID) (*legal.Section, error) {
	query := `SELECT id, act_id, section_number, title, content, plain_summary, created_at, updated_at
			  FROM legal_sections WHERE id = $1`
	var s legal.Section
	var summary sql.NullString
	err := r.db.QueryRowContext(ctx, query, id).Scan(&s.ID, &s.ActID, &s.SectionNumber, &s.Title, &s.Content, &summary, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("section not found")
		}
		return nil, err
	}
	s.PlainSummary = summary.String
	return &s, nil
}

func normalizeActParams(params legal.ActListParams) legal.ActListParams {
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 20
	}
	if params.Limit > 100 {
		params.Limit = 100
	}
	params.Query = strings.TrimSpace(params.Query)
	params.Category = strings.TrimSpace(params.Category)
	return params
}

func normalizeSectionParams(params legal.SectionListParams) legal.SectionListParams {
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 100
	}
	if params.Limit > 500 {
		params.Limit = 500
	}
	return params
}

func (r *postgresLegalRepository) searchActsPostgres(ctx context.Context, params legal.ActListParams) ([]legal.Act, int64, error) {
	offset := (params.Page - 1) * params.Limit

	where := "WHERE 1=1"
	args := []interface{}{}
	idx := 1
	if params.Query != "" {
		where += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", idx, idx+1)
		args = append(args, "%"+params.Query+"%", "%"+params.Query+"%")
		idx += 2
	}
	if params.Category != "" {
		where += fmt.Sprintf(" AND category = $%d", idx)
		args = append(args, params.Category)
		idx++
	}

	var total int64
	countQuery := "SELECT COUNT(*) FROM legal_acts " + where
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT id, title, slug, description, category, year, created_at, updated_at
		FROM legal_acts %s ORDER BY year DESC, title ASC LIMIT $%d OFFSET $%d`, where, idx, idx+1)
	args = append(args, params.Limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var acts []legal.Act
	for rows.Next() {
		var a legal.Act
		var desc, cat sql.NullString
		var yr sql.NullInt32
		err := rows.Scan(&a.ID, &a.Title, &a.Slug, &desc, &cat, &yr, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		a.Description = desc.String
		a.Category = cat.String
		a.Year = int(yr.Int32)
		acts = append(acts, a)
	}
	return acts, total, nil
}

func (r *postgresLegalRepository) searchActsMeili(ctx context.Context, params legal.ActListParams) ([]legal.Act, int64, error) {
	index := r.meili.Index("legal_acts")

	searchReq := &meilisearch.SearchRequest{
		Limit:  int64(params.Limit),
		Offset: int64((params.Page - 1) * params.Limit),
	}
	if params.Category != "" {
		searchReq.Filter = fmt.Sprintf("category = \"%s\"", strings.ReplaceAll(params.Category, "\"", "\\\""))
	}

	res, err := index.Search(params.Query, searchReq)
	if err != nil {
		return nil, 0, err
	}

	ids := make([]uuid.UUID, 0, len(res.Hits))
	for _, hit := range res.Hits {
		hitMap, ok := hit.(map[string]interface{})
		if !ok {
			continue
		}
		idStr, _ := hitMap["id"].(string)
		id, err := uuid.Parse(idStr)
		if err != nil {
			continue
		}
		ids = append(ids, id)
	}
	if len(ids) == 0 {
		return []legal.Act{}, int64(res.EstimatedTotalHits), nil
	}

	query := `SELECT id, title, slug, description, category, year, icon_url, created_at, updated_at
		FROM legal_acts WHERE id = ANY($1) ORDER BY array_position($1, id)`
	rows, err := r.db.QueryContext(ctx, query, pq.Array(ids))
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var acts []legal.Act
	for rows.Next() {
		var a legal.Act
		var desc, cat, icon sql.NullString
		var yr sql.NullInt32
		err := rows.Scan(&a.ID, &a.Title, &a.Slug, &desc, &cat, &yr, &icon, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		a.Description = desc.String
		a.Category = cat.String
		a.IconURL = icon.String
		a.Year = int(yr.Int32)
		acts = append(acts, a)
	}

	return acts, int64(res.EstimatedTotalHits), nil
}
