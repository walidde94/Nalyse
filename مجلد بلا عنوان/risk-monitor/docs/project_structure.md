# Project User Guide & Structure

## Folder Structure

```text
risk-monitor/
├── backend/                # Go Backend (Orchestration, API, Core Logic)
│   ├── cmd/server/         # Main entry point
│   ├── internal/
│   │   ├── api/            # Chi Handlers
│   │   ├── config/         # App configuration
│   │   ├── core/           # Domain entities
│   │   ├── diff/           # The Scan Diff Engine
│   │   ├── store/          # PostgreSQL repositories
│   │   └── worker/         # Worker management
│   ├── go.mod
│   └── go.sum
├── database/
│   └── migrations/         # SQL Migration files (up/down)
├── desktop/                # Tauri Application
│   ├── src-tauri/          # Rust shell
│   └── src/                # Frontend (HTML/JS/React/etc)
├── workers/
│   ├── crawler/            # Go-based crawler (part of backend binary or separate)
│   └── playwright/         # Node.js Playwright worker
│       ├── src/
│       ├── package.json
│       └── index.js
├── docs/                   # Architecture and Design documents
└── Makefile                # Build automation
```

## Technology Stack

- **Desktop Shell**: Tauri (Rust)
- **Backend**: Go 1.22+ (Chi Router)
- **Database**: PostgreSQL 16+
- **Browser Automation**: Node.js + Playwright
- **Frontend**: React (via Vite)
