# Go API Contracts

Base URL: `http://localhost:8080/api/v1`

## Websites

### `GET /websites`
Returns a list of all monitored websites.
- **Response**: `200 OK` `[]Website`

### `POST /websites`
Registers a new website for monitoring.
- **Request**: `{ "url": "https://example.com", "scan_interval_minutes": 60 }`
- **Response**: `201 Created` `Website`

### `GET /websites/{id}`
- **Response**: `200 OK` `Website`

### `DELETE /websites/{id}`
- **Response**: `204 No Content`

## Scans

### `POST /websites/{id}/scan`
Triggers an immediate manual scan.
- **Response**: `202 Accepted` `{ "scan_id": "uuid" }`

### `GET /websites/{id}/scans`
History of scans for a website.
- **Response**: `200 OK` `[]ScanSummary`

### `GET /scans/{id}`
Detailed results of a specific scan.
- **Response**: `200 OK` `ScanDetail`

## Issues

### `GET /websites/{id}/issues`
Returns current open issues.
- **Query Params**: `status=open|resolved`
- **Response**: `200 OK` `[]Issue`

---

# Playwright Worker Interface

The Playwright worker runs as a separate process or a sidecar service.
Communication is strictly via JSON over Stdin/Stdout or a local HTTP Control Port (determined by environment).

## Input (Job)
```json
{
  "job_id": "uuid",
  "url": "https://target-site.com",
  "check_type": "cookie_banner",
  "output_path": "/tmp/scans/uuid/screenshot.png"
}
```

## Output (Result)
```json
{
  "job_id": "uuid",
  "success": true,
  "data": {
    "banner_detected": true,
    "screenshot_saved": true
  },
  "error": null
}
```

## Failure
```json
{
  "job_id": "uuid",
  "success": false,
  "error": "Timeout waiting for network idle"
}
```
