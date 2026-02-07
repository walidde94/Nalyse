package core

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type IssueType string

const (
	IssueTypeUrlError           IssueType = "url_error"
	IssueTypeAssetMissing       IssueType = "asset_missing"
	IssueTypeLegalPageMissing   IssueType = "legal_page_missing"
	IssueTypeCookieBannerMissing IssueType = "cookie_banner_missing"
)

type IssueStatus string

const (
	IssueStatusOpen     IssueStatus = "open"
	IssueStatusResolved IssueStatus = "resolved"
)

type Severity string

const (
	SeverityWarning  Severity = "warning"
	SeverityCritical Severity = "critical"
)

type Issue struct {
	ID               uuid.UUID   `json:"id"`
	WebsiteID        uuid.UUID   `json:"website_id"`
	Type             IssueType   `json:"issue_type"`
	EntityIdentifier string      `json:"entity_identifier"`
	FirstSeenScanID  *uuid.UUID  `json:"first_seen_scan_id"`
	LastSeenScanID   *uuid.UUID  `json:"last_seen_scan_id"`
	Status           IssueStatus `json:"status"`
	Severity         Severity    `json:"severity"`
	CreatedAt        time.Time   `json:"created_at"`
	ResolvedAt       *time.Time  `json:"resolved_at"`
}

type IssueRepository interface {
	UpsertIssue(ctx context.Context, issue Issue) error
	GetOpenIssues(ctx context.Context, websiteID uuid.UUID) ([]Issue, error)
	ResolveIssue(ctx context.Context, websiteID uuid.UUID, identifier string, issueType IssueType) error
}
