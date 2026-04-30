package usecase

import (
	"context"

	"nyay-api/internal/legal"
	"nyay-api/internal/legal/repository"

	"github.com/google/uuid"
)

type LegalUseCase interface {
	GetActs(ctx context.Context, params legal.ActListParams) ([]legal.Act, int64, error)
	GetActDetails(ctx context.Context, id uuid.UUID, params legal.SectionListParams) (*legal.Act, []legal.Section, int64, error)
	GetSection(ctx context.Context, id uuid.UUID) (*legal.Section, error)
}

type legalUseCase struct {
	repo repository.LegalRepository
}

func NewLegalUseCase(repo repository.LegalRepository) LegalUseCase {
	return &legalUseCase{repo: repo}
}

func (u *legalUseCase) GetActs(ctx context.Context, params legal.ActListParams) ([]legal.Act, int64, error) {
	return u.repo.GetActs(ctx, params)
}

func (u *legalUseCase) GetActDetails(ctx context.Context, id uuid.UUID, params legal.SectionListParams) (*legal.Act, []legal.Section, int64, error) {
	act, err := u.repo.GetActByID(ctx, id)
	if err != nil {
		return nil, nil, 0, err
	}

	sections, total, err := u.repo.GetSectionsByActID(ctx, id, params)
	if err != nil {
		return nil, nil, 0, err
	}

	return act, sections, total, nil
}

func (u *legalUseCase) GetSection(ctx context.Context, id uuid.UUID) (*legal.Section, error) {
	return u.repo.GetSectionByID(ctx, id)
}
