package store

import (
	"context"
	"risk-monitor/backend/internal/core"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IssueRepo struct {
	db *pgxpool.Pool
}

func NewIssueRepo(db *pgxpool.Pool) *IssueRepo {
	return &IssueRepo{db: db}
}

func (r *IssueRepo) UpsertIssue(ctx context.Context, issue core.Issue) error {
	// Check if an open issue exists for this entity
	queryCheck := `SELECT id FROM issues WHERE website_id=$1 AND issue_type=$2 AND entity_identifier=$3 AND status='open'`
	var existingID uuid.UUID
	err := r.db.QueryRow(ctx, queryCheck, issue.WebsiteID, issue.Type, issue.EntityIdentifier).Scan(&existingID)

	if err == pgx.ErrNoRows {
		// New Issue
		if issue.ID == uuid.Nil { issue.ID = uuid.New() }
		insert := `INSERT INTO issues (id, website_id, issue_type, entity_identifier, first_seen_scan_id, last_seen_scan_id, status, severity, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8)`
		_, err := r.db.Exec(ctx, insert, issue.ID, issue.WebsiteID, issue.Type, issue.EntityIdentifier, 
			issue.FirstSeenScanID, issue.LastSeenScanID, issue.Severity, time.Now())
		return err
	} else if err != nil {
		return err
	}

	// Update Existing Issue (Update LastSeen)
	update := `UPDATE issues SET last_seen_scan_id=$1 WHERE id=$2`
	_, err = r.db.Exec(ctx, update, issue.LastSeenScanID, existingID)
	return err
}

func (r *IssueRepo) ResolveIssue(ctx context.Context, websiteID uuid.UUID, identifier string, issueType core.IssueType) error {
	query := `UPDATE issues SET status='resolved', resolved_at=$1 WHERE website_id=$2 AND entity_identifier=$3 AND issue_type=$4 AND status='open'`
	_, err := r.db.Exec(ctx, query, time.Now(), websiteID, identifier, issueType)
	return err
}

func (r *IssueRepo) GetOpenIssues(ctx context.Context, websiteID uuid.UUID) ([]core.Issue, error) {
	query := `SELECT id, website_id, issue_type, entity_identifier, status, severity, created_at 
              FROM issues WHERE website_id=$1 AND status='open'`
	rows, err := r.db.Query(ctx, query, websiteID)
	if err != nil { return nil, err }
	defer rows.Close()

	var issues []core.Issue
	for rows.Next() {
		i := core.Issue{}
		if err := rows.Scan(&i.ID, &i.WebsiteID, &i.Type, &i.EntityIdentifier, &i.Status, &i.Severity, &i.CreatedAt); err != nil {
			return nil, err
		}
		issues = append(issues, i)
	}
	return issues, nil
}
