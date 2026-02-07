# Tauri Integration Strategy

## Architecture
The application uses the "Sidecar" pattern.
- **Frontend**: A React SPA that communicates with the `go-backend` via HTTP.
- **Backend**: A compiled Go binary packaged inside the Tauri app.
- **Database**: PostgreSQL (User must have it installed, or we bundle a lighter DB. *Plan constraint: Request says Postgres. We assume the user installs Postgres or we use a Docker container managed by the app. For MVP, we assume running local Postgres instance*).

## Startup Flow
1. User launches Tauri App.
2. Tauri `main.rs` starts the `go-backend` sidecar command.
3. Backend starts, connects to DB, runs migrations, and starts HTTP server on a random free port.
4. Backend writes the port to a lockfile or stdout.
5. Tauri reads the port and injects it into the Frontend window context.
6. Frontend makes API calls to `http://localhost:{port}/api/v1`.

## Filesystem Access
- The Go backend handles all file I/O (logs, screenshots).
- Screenshots are stored in `AppLocalData` directory.
- Frontend fetches screenshots via the separate static file server or base64 API endpoints from the backend.

## Playwright Worker
- The Go backend spawns the Node.js Playwright worker as a subprocess when needed, or keeps a pool warm.
- `node` implementation must be bundled. *Constraint: Bundling Node inside Tauri is heavy. Alternative: Use a precompiled binary for the worker using `pkg` or scan using Go-Rod (Go native) instead of Playwright to save size.*
- **Decision for this Plan**: Stick to User Request (Node/Playwright). The Go backend will assume `node` is available in PATH or bundled in the resources.

## Build Process
1. `cd backend && go build -o ../desktop/src-tauri/bin/backend-aarch64-apple-darwin`
2. `cd workers/playwright && npm install`
3. `cd desktop && npm run tauri build`
