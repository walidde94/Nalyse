# Database Schema: Nalyse SaaS Platform

This schema is designed for PostgreSQL and follows 3NF normalization. It supports multi-tenancy via `organization_id`.

## Core Tables

### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Unique user identifier |
| `organization_id` | UUID | FK -> organizations.id | Tenant association |
| `email` | VARCHAR(255) | ULTRA UNIQUE | User email address |
| `password_hash` | VARCHAR | NOT NULL | Bcrypt hash |
| `role` | ENUM | 'admin', 'editor', 'viewer' | RBAC role |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `organizations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Tenant ID |
| `name` | VARCHAR | NOT NULL | Company name |
| `plan_tier` | ENUM | 'free', 'pro', 'enterprise' | Subscription level |
| `subscription_status` | VARCHAR | | Stripe status |
| `settings` | JSONB | | Custom configurations (alert thresholds) |

### `files`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | File identifier |
| `organization_id` | UUID | FK -> organizations.id | Owner |
| `filename` | VARCHAR | NOT NULL | Original filename |
| `s3_key` | VARCHAR | UNIQUE | Path in Object Storage |
| `mime_type` | VARCHAR | | 'text/csv', 'application/json' |
| `size_bytes` | BIGINT | | For quota calculation |
| `row_count` | INTEGER | | Analyzed row count |
| `created_at` | TIMESTAMPTZ | | Upload timestamp |

## ML & Analysis Tables

### `jobs`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Job identifier |
| `file_id` | UUID | FK -> files.id | Target file |
| `type` | ENUM | 'anomaly_detection', 'forecasting' | Job type |
| `status` | ENUM | 'pending', 'processing', 'completed', 'failed' | |
| `worker_id` | VARCHAR | | ID of ML worker processing the job |
| `started_at` | TIMESTAMPTZ | | |
| `completed_at` | TIMESTAMPTZ | | |

### `anomalies`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Anomaly record ID |
| `job_id` | UUID | FK -> jobs.id | Source analysis |
| `row_index` | INTEGER | NOT NULL | 0-based index in source file |
| `confidence_score` | FLOAT | | 0.0 to 1.0 (Method dependent) |
| `severity` | ENUM | 'low', 'medium', 'high', 'critical' | Calculated severity |
| `detected_features` | JSONB | | e.g. `{"revenue": "low", "region": "west"}` |
| `explanation` | TEXT | | AI-generated explanation "Revenue dropped by X..." |

### `alerts`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Alert ID |
| `anomaly_id` | UUID | FK -> anomalies.id | Triggering event |
| `channel` | ENUM | 'email', 'slack', 'webhook' | Delivery method |
| `status` | ENUM | 'sent', 'failed', 'acknowledged' | |
| `sent_at` | TIMESTAMPTZ | | |

## Indexes
- `idx_anomalies_job` ON `anomalies(job_id)`
- `idx_jobs_status` ON `jobs(status)` where status = 'pending'
- `idx_files_org` ON `files(organization_id)` (Multi-tenancy optimization)
