# Quickstart Guide

Since the environment lacks Go and Rust, the system has been implemented using **Node.js** and **Electron**.

## Prerequisites
1. **Node.js**: Installed (v11+ detected).
2. **PostgreSQL**: Must be running locally.
   - Database Name: `riskmonitor`
   - Default Connection: `postgres://postgres:postgres@localhost:5432/riskmonitor`
   - If your credentials differ, set `DATABASE_URL` environment variable.

## Installation

1. **Install Dependencies**
   Run these commands to install libraries for the Backend, Desktop, and Workers:
   
   ```bash
   # 1. Backend
   cd risk-monitor/backend-node
   npm install

   # 2. Worker
   cd ../workers/playwright
   npm install
   npx playwright install chromium

   # 3. Desktop
   cd ../../desktop
   npm install
   ```

2. **Initialize Database**
   Apply the migration schema to your Postgres database:
   
   ```bash
   psql -d riskmonitor -f risk-monitor/database/migrations/001_initial_schema.sql
   ```
   *(Or use your preferred SQL client to run the minimal SQL inside that file)*

## Running the Application

To start the desktop application (which automatically starts the backend):

```bash
cd risk-monitor/desktop
npm start
```

## Architecture Notes
- **Desktop**: Electron App (Main Process) spawns the Backend.
- **Backend**: Node.js/Express (Port 8080).
- **Workers**: Playwright (Headless Browser) is managed by the Backend.
- **Data**: All scan results are stored in PostgreSQL.
