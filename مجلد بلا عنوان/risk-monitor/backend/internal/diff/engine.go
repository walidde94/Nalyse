package diff

import (
	"context"
	"fmt"
	"risk-monitor/backend/internal/core"
	"risk-monitor/backend/internal/store"

	"github.com/google/uuid"
)

type Engine struct {
	repo      core.ScanRepository
	issueRepo core.IssueRepository
}

func NewEngine(repo core.ScanRepository, issueRepo core.IssueRepository) *Engine {
	return &Engine{
		repo:      repo,
		issueRepo: issueRepo,
	}
}

// Process compares the current scan against the last completed scan and produces issues
func (e *Engine) Process(ctx context.Context, currentScan *core.Scan) error {
	// 1. Get Last Completed Scan
	lastScan, err := e.repo.GetLastCompletedScan(ctx, currentScan.WebsiteID)
	if err != nil {
		// First run or no previous persistence found.
		// We treat everything as "New" but since it's the first run, we only flag Critical immediate failures
		// or maybe we don't flag regressions yet?
		// Decision: On first run, we only report explicit failures (like 500s), but we don't have "history".
		// For MVP, lets just log active failures as new issues.
		return e.analyzeSingleScan(ctx, currentScan)
	}

	// 2. Perform Diff
	return e.diffScans(ctx, lastScan, currentScan)
}

func (e *Engine) analyzeSingleScan(ctx context.Context, scan *core.Scan) error {
	// Just create issues for current failures
	for _, u := range scan.URLs {
		if !u.IsHealthy() {
			e.issueRepo.UpsertIssue(ctx, core.Issue{
				WebsiteID:        scan.WebsiteID,
				Type:             core.IssueTypeUrlError,
				EntityIdentifier: u.URL,
				FirstSeenScanID:  &scan.ID,
				LastSeenScanID:   &scan.ID,
				Severity:         core.SeverityCritical,
			})
		}
	}
	return nil
}

func (e *Engine) diffScans(ctx context.Context, old *core.Scan, curr *core.Scan) error {
	// 1. Diff URLs
	oldMap := make(map[string]core.ScanURL)
	for _, u := range old.URLs {
		oldMap[u.URL] = u
	}

	for _, u := range curr.URLs {
		prev, exists := oldMap[u.URL]
		
		isHealthy := u.IsHealthy()
		wasHealthy := true
		if exists {
			wasHealthy = prev.IsHealthy()
		}

		// Regression: Was Good -> Now Bad
		if wasHealthy && !isHealthy {
			e.issueRepo.UpsertIssue(ctx, core.Issue{
				WebsiteID:        curr.WebsiteID,
				Type:             core.IssueTypeUrlError,
				EntityIdentifier: u.URL,
				FirstSeenScanID:  &curr.ID,
				LastSeenScanID:   &curr.ID,
				Severity:         core.SeverityCritical,
			})
		} else if !wasHealthy && isHealthy {
			// Resolved: Was Bad -> Now Good
			e.issueRepo.ResolveIssue(ctx, curr.WebsiteID, u.URL, core.IssueTypeUrlError)
		} else if !isHealthy {
			// Persistent Error: Update LastSeen
			// Upsert will handle updating LastSeenScanID if issue is already open
			e.issueRepo.UpsertIssue(ctx, core.Issue{
				WebsiteID:        curr.WebsiteID,
				Type:             core.IssueTypeUrlError,
				EntityIdentifier: u.URL,
				FirstSeenScanID:  &curr.ID, // logic in Upsert needs care to not overwrite FirstSeen
				LastSeenScanID:   &curr.ID,
				Severity:         core.SeverityCritical,
			})
		}
	}

	// 2. Diff Cookie Banner
	if old.Cookie != nil && curr.Cookie != nil {
		if old.Cookie.BannerDetected && !curr.Cookie.BannerDetected {
			e.issueRepo.UpsertIssue(ctx, core.Issue{
				WebsiteID:        curr.WebsiteID,
				Type:             core.IssueTypeCookieBannerMissing,
				EntityIdentifier: "cookie_banner",
				FirstSeenScanID:  &curr.ID,
				LastSeenScanID:   &curr.ID,
				Severity:         core.SeverityCritical,
			})
		} else if !old.Cookie.BannerDetected && curr.Cookie.BannerDetected {
			e.issueRepo.ResolveIssue(ctx, curr.WebsiteID, "cookie_banner", core.IssueTypeCookieBannerMissing)
		}
	}

	return nil
}
