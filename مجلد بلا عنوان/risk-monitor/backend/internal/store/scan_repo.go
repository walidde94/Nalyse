package store

import (
	"context"
	"risk-monitor/backend/internal/core"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ScanRepo struct {
	db *pgxpool.Pool
}

func NewScanRepo(db *pgxpool.Pool) *ScanRepo {
	return &ScanRepo{db: db}
}

func (r *ScanRepo) CreateScan(ctx context.Context, scan *core.Scan) error {
	query := `INSERT INTO scans (id, website_id, started_at, overall_status) VALUES ($1, $2, $3, $4)`
	if scan.ID == uuid.Nil {
		scan.ID = uuid.New()
	}
	_, err := r.db.Exec(ctx, query, scan.ID, scan.WebsiteID, scan.StartedAt, scan.OverallStatus)
	return err
}

func (r *ScanRepo) UpdateScan(ctx context.Context, scan *core.Scan) error {
	query := `UPDATE scans SET finished_at=$1, overall_status=$2 WHERE id=$3`
	_, err := r.db.Exec(ctx, query, scan.FinishedAt, scan.OverallStatus, scan.ID)
	return err
}

func (r *ScanRepo) GetLastCompletedScan(ctx context.Context, websiteID uuid.UUID) (*core.Scan, error) {
	// 1. Fetch the scan metadata
	query := `SELECT id, website_id, started_at, finished_at, overall_status FROM scans 
              WHERE website_id=$1 AND finished_at IS NOT NULL 
              ORDER BY finished_at DESC LIMIT 1`
	
	row := r.db.QueryRow(ctx, query, websiteID)
	scan := &core.Scan{}
	if err := row.Scan(&scan.ID, &scan.WebsiteID, &scan.StartedAt, &scan.FinishedAt, &scan.OverallStatus); err != nil {
		return nil, err
	}

	// 2. Fetch URLs
	urlQuery := `SELECT id, scan_id, url, http_status, error_type FROM scan_urls WHERE scan_id=$1`
	rows, err := r.db.Query(ctx, urlQuery, scan.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			sUrl := core.ScanURL{}
			rows.Scan(&sUrl.ID, &sUrl.ScanID, &sUrl.URL, &sUrl.HTTPStatus, &sUrl.ErrorType)
			scan.URLs = append(scan.URLs, sUrl)
		}
	}

	// 3. Fetch Legal Checks
	legalQuery := `SELECT id, scan_id, impressum_found, privacy_found FROM legal_checks WHERE scan_id=$1`
	lRow := r.db.QueryRow(ctx, legalQuery, scan.ID)
	legal := &core.LegalCheck{}
	if err := lRow.Scan(&legal.ID, &legal.ScanID, &legal.ImpressumFound, &legal.PrivacyFound); err == nil {
		scan.Legal = legal
	}

	// 4. Fetch Cookie Checks
	cookieQuery := `SELECT id, scan_id, banner_detected, screenshot_path FROM cookie_banner_checks WHERE scan_id=$1`
	cRow := r.db.QueryRow(ctx, cookieQuery, scan.ID)
	cookie := &core.CookieCheck{}
	if err := cRow.Scan(&cookie.ID, &cookie.ScanID, &cookie.BannerDetected, &cookie.ScreenshotPath); err == nil {
		scan.Cookie = cookie
	}

	return scan, nil
}

func (r *ScanRepo) SaveScanResults(ctx context.Context, scan *core.Scan) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Update Scan Status + FinishedAt
	_, err = tx.Exec(ctx, `UPDATE scans SET finished_at=$1, overall_status=$2 WHERE id=$3`, 
		scan.FinishedAt, scan.OverallStatus, scan.ID)
	if err != nil {
		return err
	}

	// 2. Insert URLs
	for _, u := range scan.URLs {
		if u.ID == uuid.Nil { u.ID = uuid.New() }
		_, err := tx.Exec(ctx, `INSERT INTO scan_urls (id, scan_id, url, http_status, error_type) VALUES ($1, $2, $3, $4, $5)`,
			u.ID, scan.ID, u.URL, u.HTTPStatus, u.ErrorType)
		if err != nil { return err }
	}

	// 3. Insert Legal
	if scan.Legal != nil {
		if scan.Legal.ID == uuid.Nil { scan.Legal.ID = uuid.New() }
		_, err := tx.Exec(ctx, `INSERT INTO legal_checks (id, scan_id, impressum_found, privacy_found) VALUES ($1, $2, $3, $4)`,
			scan.Legal.ID, scan.ID, scan.Legal.ImpressumFound, scan.Legal.PrivacyFound)
		if err != nil { return err }
	}

	// 4. Insert Cookie Stats
	if scan.Cookie != nil {
		if scan.Cookie.ID == uuid.Nil { scan.Cookie.ID = uuid.New() }
		_, err := tx.Exec(ctx, `INSERT INTO cookie_banner_checks (id, scan_id, banner_detected, screenshot_path) VALUES ($1, $2, $3, $4)`,
			scan.Cookie.ID, scan.ID, scan.Cookie.BannerDetected, scan.Cookie.ScreenshotPath)
		if err != nil { return err }
	}

	return tx.Commit(ctx)
}
