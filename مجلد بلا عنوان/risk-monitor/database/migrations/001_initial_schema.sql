-- Migration: 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT UNIQUE NOT NULL,
    scan_interval_minutes INTEGER NOT NULL DEFAULT 1440, -- Daily by default
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE scan_status AS ENUM ('ok', 'warning', 'critical');

CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    overall_status scan_status,
    raw_summary JSONB -- To store quick aggregate stats if needed
);

CREATE TYPE error_type_enum AS ENUM ('none', 'not_found', 'server_error', 'timeout', 'other');

CREATE TABLE scan_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    http_status INTEGER,
    error_type error_type_enum DEFAULT 'none',
    crawl_depth INTEGER
);

CREATE TABLE scan_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    asset_url TEXT NOT NULL,
    asset_type TEXT, -- e.g., 'pdf', 'image'
    is_reachable BOOLEAN NOT NULL
);

CREATE TABLE legal_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    impressum_found BOOLEAN,
    privacy_found BOOLEAN,
    impressum_url TEXT,
    privacy_url TEXT
);

CREATE TABLE cookie_banner_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    banner_detected BOOLEAN,
    screenshot_path TEXT,
    error_message TEXT
);

CREATE TYPE issue_type_enum AS ENUM ('url_error', 'asset_missing', 'legal_page_missing', 'cookie_banner_missing');
CREATE TYPE issue_status_enum AS ENUM ('open', 'resolved');
CREATE TYPE severity_enum AS ENUM ('warning', 'critical');

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    issue_type issue_type_enum NOT NULL,
    entity_identifier TEXT NOT NULL, -- The URL or identifier causing the issue
    first_seen_scan_id UUID REFERENCES scans(id),
    last_seen_scan_id UUID REFERENCES scans(id),
    status issue_status_enum DEFAULT 'open',
    severity severity_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scans_website_id ON scans(website_id);
CREATE INDEX idx_issues_website_status ON issues(website_id, status);
