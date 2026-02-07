package store

import (
	"context"
	"risk-monitor/backend/internal/core"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WebsiteRepo struct {
	db *pgxpool.Pool
}

func NewWebsiteRepo(db *pgxpool.Pool) *WebsiteRepo {
	return &WebsiteRepo{db: db}
}

func (r *WebsiteRepo) Create(ctx context.Context, w *core.Website) error {
	query := `INSERT INTO websites (id, url, scan_interval_minutes, is_active, created_at) 
              VALUES ($1, $2, $3, $4, $5)`
	
	// Create UUID if not provided
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	if w.CreatedAt.IsZero() {
		w.CreatedAt = time.Now()
	}

	_, err := r.db.Exec(ctx, query, w.ID, w.URL, w.ScanIntervalMinutes, w.IsActive, w.CreatedAt)
	return err
}

func (r *WebsiteRepo) GetAll(ctx context.Context) ([]*core.Website, error) {
	query := `SELECT id, url, scan_interval_minutes, is_active, created_at FROM websites ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var websites []*core.Website
	for rows.Next() {
		w := &core.Website{}
		if err := rows.Scan(&w.ID, &w.URL, &w.ScanIntervalMinutes, &w.IsActive, &w.CreatedAt); err != nil {
			return nil, err
		}
		websites = append(websites, w)
	}
	return websites, nil
}

func (r *WebsiteRepo) GetByID(ctx context.Context, id uuid.UUID) (*core.Website, error) {
	query := `SELECT id, url, scan_interval_minutes, is_active, created_at FROM websites WHERE id = $1`
	row := r.db.QueryRow(ctx, query, id)
	w := &core.Website{}
	err := row.Scan(&w.ID, &w.URL, &w.ScanIntervalMinutes, &w.IsActive, &w.CreatedAt)
	if err != nil {
		return nil, err
	}
	return w, nil
}

func (r *WebsiteRepo) Update(ctx context.Context, w *core.Website) error {
	query := `UPDATE websites SET url=$1, scan_interval_minutes=$2, is_active=$3 WHERE id=$4`
	_, err := r.db.Exec(ctx, query, w.URL, w.ScanIntervalMinutes, w.IsActive, w.ID)
	return err
}

func (r *WebsiteRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM websites WHERE id=$1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
