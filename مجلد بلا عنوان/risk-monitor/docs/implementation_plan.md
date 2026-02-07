# MVP Implementation Plan - Website Legal & Risk Monitor

## Phase 1: Foundation & Architecture (Days 1-2)
- [ ] **Project Scaffolding**: logic organization for Backend (Go), Workers, and Desktop (Tauri).
- [ ] **Database Design**: Implement PostgreSQL schema and migrations.
- [ ] **Backend Core**: Initialize Go module, set up Chi router, and DB connection pool (pgx).
- [ ] **Configuration Management**: centralized config for DB, SMTP, and Worker paths.

## Phase 2: Scanning Engine (Days 3-5)
- [ ] **Go Crawler Worker**: Implement internal URL crawling, status tracking, and asset detection.
- [ ] **Playwright Worker (Node.js)**: Build the RPC interface or queue consumer for cookie banner checks.
- [ ] **Scheduler**: Implement a basic ticker/cron in Go to trigger scans based on intervals.

## Phase 3: Diff Engine & Persistence (Days 6-8)
- [ ] **Persistence Layer**: Implement repositories for Websites, Scans, URLs, Assets, and Issues.
- [ ] **Diff Logic**: Implement the core state comparison engine (Current vs Last Completed).
- [ ] **Issue Management**: Logic to open, update, and resolve issues based on diffs.

## Phase 4: Notifications & Reporting (Day 9)
- [ ] **Email Service**: SMTP integration.
- [ ] **Notification Rules**: Logic to prevent spam (only notify on regression).

## Phase 5: Desktop Integration (Days 10-12)
- [ ] **Tauri Setup**: Initialize Tauri project wrapping the frontend.
- [ ] **Sidecar Management**: Configure Tauri to manage the Go backend process.
- [ ] **Frontend**: Simple dashboard to view status (Websites list, Add Website, Issue Log).
- [ ] **IPC**: Communication between Tauri frontend and Go backend (via HTTP or defined Commands, user chose HTTP/Rest).

## Phase 6: Testing & Polish (Days 13-14)
- [ ] **End-to-End Testing**: Run full scan cycles.
- [ ] **Edge Case Handling**: Network timeouts, invalid URLs, worker crashes.
- [ ] **Packaging**: Build distributable binaries (DMG).
