# Nalyse Architecture Wiki
## The Intelligence Platform Data Flow

This document provides a comprehensive overview of the Nalyse platform architecture, focusing on the core data flow from ingestion to visualization. It serves as the single source of truth for developers joining the journey.

---

## 1. High-Level Architecture

Nalyse is built on a modern, distributed architecture:

- **Frontend (Presentation & Interaction):** React 18, Vite, Framer Motion, Tailwind CSS + Glassmorphism, Zustand (State), Recharts/D3 (Data Visualization), Socket.IO (Real-time).
- **Backend (API & Coordination):** Node.js, Express, TypeScript, TypeORM, Socket.IO, JWT Authentication.
- **Data Persistence (Storage):** PostgreSQL (Relational Data), Local FS / S3 (Blob Storage).
- **Analysis Engine (Intelligence):** Python/Pandas integration via Node child processes (or standalone microservice).
- **Caching & Performance:** In-memory LRU Cache (Interim for Redis).

---

## 2. Core Data Flow

The heartbeat of Nalyse is its ability to ingest raw data, analyze it efficiently, and present strategic insights.

### Phase 1: Ingestion & Storage (CSV Upload)
1. **User Action:** The user uploads a CSV file via the React frontend (`Dashboard` or `Files` view).
2. **Transfer:** The file is streamed via multipart form data (`multer`) to the backend `/api/files/upload`.
3. **Middleware Validation:** 
    - The backend checks for supported file types and size limits.
    - Quota checks are performed (Storage limits & File count limits based on the user's Organization plan).
4. **Duplicate Detection:** The server hashes the file payload and name. If it exists identically, the API returns `409 Conflict`.
5. **Persistence:** The file contents are saved to the server's blob storage (`uploads/` directory).
6. **Metadata:** A `File` entity is created using TypeORM and saved to PostgreSQL, containing the filename, size, URL, and organization mapping.
7. **Broadcast:** A WebSocket event (`file_uploaded`) is emitted so the dashboard updates in real-time.

### Phase 2: Orchestration & Analysis Engine
1. **Trigger:** An analysis is requested (either automatically on upload or manually via `/api/files/:id/analyze`).
2. **Caching:** The backend checks the `analysisCache` (LRU/Redis). If exactly the same parameters exist, the cached analysis is instantly returned.
3. **Engine Invocation (`analyzeFile`):**
    - The Node server streams the file from storage.
    - **Memory Safety:** It utilizes `papaparse` or similar progressive streaming logic with `MAX_ROWS_MEMORY` fallback limits to prevent V8 memory heap limits from crashing on massive CSV files.
    - **Python/Engine Interop:** Complex computational tasks (e.g., Anomaly Detection) are handed off to the analysis engine or Python scripts.
4. **Structuring Insights:** The engine analyzes numerical relationships, identifies chronological trends, flags anomalies (spikes/dips), and constructs correlation vectors.
5. **Storage of Insights:** The computed metrics and detected anomalies are saved to the database.
6. **Notification:** The `analysis_complete` WebSocket event is dispatched down to the client.

### Phase 3: Presentation & React UI
1. **Live State Updates:** The `DashboardView` or `AnalysisView` listens to the WebSocket via Socket.IO and updates the Zustand global state.
2. **Data Transformation:** The raw numerical ranges are adapted using local utility functions into format-friendly numbers (e.g., `1000` to `$1K`).
3. **Render Pipeline:**
    - Chart boundaries are defined (Recharts) and mapped to themes (Apple Glass, dark mode scales).
    - Detected anomalies generate explicit highlight markers and pulsing CSS states across the UI.
4. **AI Generation (Nexus Intelligence):**
    - High-level aggregations are piped through LLM instances (Nexus AI caching layer) to generate the "Executive Brief."
    - This turns raw tables into readable natural language summaries matching the specific business topology.

---

## 3. Database Schema Overview (TypeORM)

Nalyse runs a highly normalized schema:

- `User`: Standard user data.
- `Organization`: The multi-tenant barrier. Contains the `plan` ("free", "pro", "enterprise") overriding quotas.
- `File`: Belongs to Organization. Points to the actual binary data.
- `Pulse / Intelligence Events`: Cached system logs mapped out by the `pulseEngine`.

---

## 4. WebSocket Conventions

We utilize WebSockets strictly for unidirectional *server-to-client* updates to reduce HTTP polling.
- Connections use exponential backoff (`socket.io-client`).
- Heartbeats keep connections alive or instantly purge zombie connections on the backend.
