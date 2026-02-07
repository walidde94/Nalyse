package core

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Website struct {
	ID                  uuid.UUID `json:"id"`
	URL                 string    `json:"url"`
	ScanIntervalMinutes int       `json:"scan_interval_minutes"`
	IsActive            bool      `json:"is_active"`
	CreatedAt           time.Time `json:"created_at"`
}

type WebsiteRepository interface {
	Create(ctx context.Context, website *Website) error
	GetByID(ctx context.Context, id uuid.UUID) (*Website, error)
	GetAll(ctx context.Context) ([]*Website, error)
	Update(ctx context.Context, website *Website) error
	Delete(ctx context.Context, id uuid.UUID) error
}
