# Nalyse — Supported Data Formats

> **Version:** 1.0  
> **Last Updated:** February 25, 2026

---

## Overview

Nalyse supports multiple data formats for upload and analysis. This document specifies the supported formats, size limits, encoding requirements, and best practices for optimal analysis results.

---

## Supported Formats

| Format | MIME Type | Extensions | Max Rows* | Status |
|--------|-----------|------------|-----------|--------|
| **CSV** | `text/csv` | `.csv` | ~500K | ✅ Full support |
| **JSON** | `application/json` | `.json` | ~500K | ✅ Full support |
| **Excel** | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `.xlsx` | ~100K | ✅ Full support |
| **Legacy Excel** | `application/vnd.ms-excel` | `.xls` | ~100K | ✅ Full support |
| **PDF** | `application/pdf` | `.pdf` | — | ⚡ Text extraction |
| **HTML** | `text/html` | `.html` | — | ⚡ Table extraction |
| **Images** | `image/png`, `image/jpeg`, `image/gif`, `image/webp` | `.png`, `.jpg`, `.gif`, `.webp` | — | 📎 Storage only |

*\*Recommended maximum for interactive analysis. Larger datasets will work but may hit the 120s analysis timeout.*

---

## File Size Limits

| Plan | Per-File Limit | Total Storage | Dataset Limit |
|------|---------------|---------------|---------------|
| **Free** | 500 MB | 100 MB | 5 datasets |
| **Pro** | 500 MB | 10 GB | Unlimited |
| **Enterprise** | 500 MB | Custom | Custom |

---

## CSV Specification

### Requirements
- **Encoding:** UTF-8 (recommended). UTF-8 with BOM is also supported.
- **Delimiter:** Comma (`,`). Other delimiters are not currently supported.
- **Header row:** Required. First row must contain column names.
- **Quoting:** Standard CSV quoting with double quotes (`""`). See fallback handling below.

### Best Practices
```csv
name,sales,region,date
"Widget A",1500,"US","2026-01-15"
"Widget B",2300,"EU","2026-01-16"
```

### Error Handling (Three-Pass Parser)

Nalyse uses a resilient three-pass CSV parser:

1. **Pass 1 (Standard):** Strict parsing with relaxed quotes and column count flexibility
2. **Pass 2 (Lenient):** Disables all quoting, uses left/right trimming
3. **Pass 3 (Manual):** Line-by-line comma split as last resort

This means files with unescaped quotes, inconsistent column counts, or mixed delimiters will still be parsed successfully.

### Known Limitations
- Tab-separated files (`.tsv`) are not auto-detected. Rename to `.csv` with comma delimiters.
- Multi-line values within quotes may be truncated in Pass 3 fallback.
- Files larger than 500K rows may timeout (120s limit). Consider splitting the file.

---

## JSON Specification

### Supported Structures

**Array of Objects (recommended):**
```json
[
  { "name": "Widget A", "sales": 1500, "region": "US" },
  { "name": "Widget B", "sales": 2300, "region": "EU" }
]
```

**Single Object (treated as 1-row dataset):**
```json
{ "name": "Widget A", "sales": 1500, "region": "US" }
```

### Requirements
- Must be valid JSON (parseable by `JSON.parse`)
- UTF-8 encoding
- Top-level must be an Array or Object

### Unsupported
- Nested objects (will be stored as `[object Object]` in the column)
- JSON Lines (`.jsonl`) — each line must not be a separate JSON object
- Streaming JSON

---

## Excel Specification

### Requirements
- `.xlsx` format (Open XML) is preferred
- `.xls` format (Binary) is supported but slower to parse
- First row must be headers
- Single-sheet files recommended (first sheet is used)
- No merged cells in header row

### Limitations
- Formulas are evaluated as their last-cached value
- Conditional formatting and pivot tables are ignored
- Max ~100K rows before analysis timeout

---

## Column Type Detection

Nalyse automatically infers column types from data content:

| Detected Type | Examples | Used For |
|---------------|----------|----------|
| `number` | `1500`, `3.14`, `-42` | Aggregations, charts, statistics |
| `currency` | `$1,500.00`, `€200` | Financial analysis |
| `percent` | `45%`, `0.75` | Percentage displays |
| `date` | `2026-01-15`, `Jan 15, 2026`, `01/15/2026` | Time series, trends |
| `category` | `US`, `Active`, `Type A` | Grouping, distributions |
| `country` | `United States`, `US`, `FR` | Geo mapping |
| `city` | `New York`, `London` | Geo mapping |
| `text` | Long strings, descriptions | Text analysis |

### Type Detection Rules
1. If ≥80% of non-null values parse as numbers → `number`
2. If column name contains `price`, `cost`, `revenue` → `currency`
3. If values contain `%` or column name contains `rate`, `ratio` → `percent`
4. If values parse as dates (multiple formats supported) → `date`
5. If ≤50 unique values relative to row count → `category`
6. Otherwise → `text`

---

## Duplicate Detection

Nalyse prevents duplicate uploads using two checks:

1. **Name match:** Same `originalName` within the organization
2. **Content match:** MD5 checksum of file content

If either matches an existing file, the upload is rejected with a `409 Conflict` response.

---

## Analysis Timeout

| Metric | Value |
|--------|-------|
| **Analysis timeout** | 120 seconds |
| **Upload timeout** | 5 minutes (client-side) |
| **Max file read** | 500 MB (memory limit) |
| **Sample data cap** | 50,000 rows (returned to frontend) |

If analysis exceeds 120 seconds, a `504 Gateway Timeout` response is returned with guidance to use a smaller dataset.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/files/upload` | Upload a single file |
| `POST` | `/api/files/upload-multiple` | Upload multiple files (Pro) |
| `GET` | `/api/files/:id/analyze` | Analyze an uploaded file |
| `GET` | `/api/files/:id/preview` | Preview file data |
| `DELETE` | `/api/files/:id` | Soft-delete a file |

All endpoints require `Authorization: Bearer <token>` header.
