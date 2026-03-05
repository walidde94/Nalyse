# Nalyse — User Onboarding Guide

> Get started with Nalyse in under 5 minutes.

---

## Quick Start

### 1. Create Your Account

1. Navigate to [Nalyse](http://localhost:5173) and click **Sign Up**
2. Enter your email, create a password, and choose a display name
3. An organization workspace is automatically created for you
4. Your plan starts on **Free** tier (5 datasets, 100MB storage)

### 2. Upload Your Data

1. Click **Upload** in the sidebar or drag-and-drop files into the dashboard
2. Supported formats: **CSV**, **JSON**, **Excel (.xlsx)**
3. The system automatically detects:
   - Column types (numeric, date, category, currency, percentage)
   - Data health (missing values, duplicates, outliers)
   - File checksums (prevents duplicate uploads)

> **Tip**: For best results, ensure your CSV has a header row with descriptive column names.

### 3. Analyze Your Data

1. Click **Analyze** next to any uploaded file
2. The Intelligence Engine automatically runs:
   - **Data Cleaning** — Deduplication, header normalization, value sanitization
   - **Statistical Analysis** — Distributions, correlations, key metrics
   - **ML Engine** — K-Means clustering, correlation matrix, outlier detection
   - **AI Insights** — Auto-generated findings and actionable recommendations
3. Results are cached for 30 minutes (instant on re-analysis)

### 4. Explore Insights

The analysis view has several sections:

| Section | Description |
|---------|-------------|
| **Executive Findings** | AI-synthesized key takeaways and strategic recommendations |
| **Multi-Dimensional Charts** | Interactive visualizations (bar, line, scatter, area, radar) |
| **Data Noise Widget** | Per-column signal quality, sparklines, and noise recommendations |
| **Anomaly Detection** | Neural anomaly detection dashboard with real-time monitoring |
| **Correlation Matrix** | Pearson/Spearman correlation heatmap for numeric columns |
| **Cluster Analysis** | K-Means segmentation with silhouette scoring |

### 5. Share Your Insights

1. Click **Save Report** to save your analysis
2. Click **Share** to generate a share link
3. Optional: Set a **password** and **expiration time**
4. Share with teammates via email — they'll receive a branded notification
5. Recipients can view the report without needing a Nalyse account

### 6. Export Reports

- Click the **Export PDF** button to generate a professional branded report
- PDFs include executive summary, key findings, and chart visualizations
- Generation is non-blocking (runs in a Web Worker)

---

## Team Collaboration

### Invite Team Members

1. Go to **Settings** → **Team**
2. Click **Invite Member**
3. Enter their email and assign a role:
   - **Admin** — Full workspace access, can manage members and billing
   - **Member** — Can upload, analyze, and share data
   - **Viewer** — Read-only access to shared reports and analyses
4. Invitations expire after **7 days**

### Shared Workspace

- All team members share the same organization workspace
- Files uploaded by any member are visible to the team
- Storage and dataset limits are shared across the organization

---

## Data Privacy & Security

| Feature | Details |
|---------|---------|
| **Encryption** | All data encrypted in transit (TLS) |
| **Authentication** | JWT-based with bcrypt password hashing |
| **Rate Limiting** | 100 requests/15min per IP |
| **File Isolation** | Users can only access their own organization's files |
| **Share Links** | Optional password protection + configurable expiration |
| **Checksums** | MD5 integrity verification on all uploads |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + U` | Upload file |
| `Ctrl/Cmd + E` | Export PDF |
| `Esc` | Close modal/overlay |

---

## API Access

For programmatic access, generate an API key in **Settings** → **API Keys**.

```bash
# List your files
curl -H "X-API-Key: your_api_key" http://localhost:3000/api/v1/files

# Analyze a file
curl -H "X-API-Key: your_api_key" http://localhost:3000/api/v1/files/{id}/analyze
```

---

## Plans & Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|-----------|
| Datasets | 5 | 50 | Unlimited |
| Storage | 100 MB | 5 GB | 100 GB |
| Team Members | 1 | 10 | Unlimited |
| AI Insights | Basic | Advanced | Custom models |
| Share Links | ✓ | ✓ + Password | ✓ + SSO |
| API Access | ✓ | ✓ | ✓ + Webhooks |

---

## Troubleshooting

### "Failed to load dataset"
- Ensure the file isn't empty and has valid CSV/JSON formatting
- Check that file size is within your plan's storage limit

### "Analysis timed out"
- Datasets over 100K rows may exceed the 120-second limit
- Try uploading a subset of the data or contact us for batch processing

### "Storage quota exceeded"
- Check your usage in **Settings** → **Billing**
- Delete unused datasets to free up space
- Upgrade your plan for more storage

---

## Getting Help

- **Documentation**: Check the `docs/` folder for architecture guides
- **Issues**: Report bugs through the application's feedback button
- **Email**: support@nalyse.io
