package core

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type ScanStatus string

const (
	ScanStatusOk       ScanStatus = "ok"
	ScanStatusWarning  ScanStatus = "warning"
	ScanStatusCritical ScanStatus = "critical"
)

type Scan struct {
	ID            uuid.UUID     `json:"id"`
	WebsiteID     uuid.UUID     `json:"website_id"`
	StartedAt     time.Time     `json:"started_at"`
	FinishedAt    *time.Time    `json:"finished_at"`
	OverallStatus ScanStatus    `json:"overall_status"`
	URLs          []ScanURL     `json:"scan_urls,omitempty"`
	Assets        []ScanAsset   `json:"scan_assets,omitempty"`
	Legal         *LegalCheck   `json:"legal_check,omitempty"`
	Cookie        *CookieCheck  `json:"cookie_check,omitempty"`
}

type ScanURL struct {
	ID         uuid.UUID `json:"id"`
	ScanID     uuid.UUID `json:"scan_id"`
	URL        string    `json:"url"`
	HTTPStatus int       `json:"http_status"`
	ErrorType  string    `json:"error_type"` // "none", "404", "5xx", "timeout"
}

// IsHealthy returns true if the URL check passed (status 200-299)
func (s ScanURL) IsHealthy() bool {
	return s.HTTPStatus >= 200 && s.HTTPStatus < 300
}

type ScanAsset struct {
	ID          uuid.UUID `json:"id"`
	ScanID      uuid.UUID `json:"scan_id"`
	AssetURL    string    `json:"asset_url"`
	IsReachable bool      `json:"is_reachable"`
}

type LegalCheck struct {
	ID             uuid.UUID `json:"id"`
	ScanID         uuid.UUID `json:"scan_id"`
	ImpressumFound bool      `json:"impressum_found"`
	PrivacyFound   bool      `json:"privacy_found"`
}

type CookieCheck struct {
	ID             uuid.UUID `json:"id"`
	ScanID         uuid.UUID `json:"scan_id"`
	BannerDetected bool      `json:"banner_detected"`
	ScreenshotPath string    `json:"screenshot_path"`
}

type ScanRepository interface {
	CreateScan(ctx context.Context, scan *Scan) error
	UpdateScan(ctx context.Context, scan *Scan) error
	GetLastCompletedScan(ctx context.Context, websiteID uuid.UUID) (*Scan, error)
	SaveScanResults(ctx context.Context, scan *Scan) error
}
