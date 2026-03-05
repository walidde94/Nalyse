# Nalyse ML Engine — Architecture Guide

> **Version:** 1.0  
> **Last Updated:** February 26, 2026

---

## Overview

The Nalyse ML Engine is a **pure TypeScript** statistical and machine learning analysis module that runs entirely within the Node.js backend — **no Python dependency or external ML service required**. It provides real-time statistical analysis, clustering, and outlier detection as part of the file analysis pipeline.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
│  AnalysisView → Chart Rendering → Data Grid     │
└──────────────┬──────────────────────────────────┘
               │ GET /api/files/:id/analyze
               ▼
┌─────────────────────────────────────────────────┐
│              files.ts controller                │
│  ┌──────────────────────────────────────┐       │
│  │ Analysis Cache (LRU, 30min TTL)      │       │
│  │ Key: MD5(content) + mimetype         │       │
│  └──────────────┬───────────────────────┘       │
│                 │ cache miss                    │
│                 ▼                               │
│  ┌──────────────────────────────────────┐       │
│  │         engine.ts (Pipeline)         │       │
│  │                                      │       │
│  │  1. File Read + Format Detection     │       │
│  │  2. CSV 3-Pass Parser                │       │
│  │  3. Data Cleaning (cleaner.ts)       │       │
│  │     ├─ Header normalization          │       │
│  │     ├─ Deduplication                 │       │
│  │     └─ Outlier Detection ────────┐   │       │
│  │  4. Type Inference               │   │       │
│  │  5. Statistical Analysis         │   │       │
│  │     ├─ Category insights         │   │       │
│  │     ├─ Time series analysis      │   │       │
│  │     ├─ Entity insights           │   │       │
│  │     ├─ Inventory insights        │   │       │
│  │     └─ Correlations (basic)      │   │       │
│  │  6. ML Engine ◄──────────────────┘   │       │
│  │     ├─ Correlation Matrix (P+S)      │       │
│  │     ├─ K-Means Clustering            │       │
│  │     └─ Advanced Outlier Detection    │       │
│  │  7. Reasoning Engine                 │       │
│  │     └─ Executive synthesis           │       │
│  └──────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

---

## Module Reference

### `mlEngine.ts`

The core ML module. All algorithms are implemented in pure TypeScript for zero-dependency portability.

#### 1. Correlation Matrix

```typescript
computeCorrelationMatrix(records: any[], numericColumns: string[]): CorrelationMatrix
```

**Algorithm:**
- Computes pairwise **Pearson** correlation coefficient (linear relationship)
- Computes pairwise **Spearman** rank correlation (monotonic/non-linear relationship)
- Estimates **p-values** using t-distribution approximation
- Classifies correlation strength: `none` | `weak` | `moderate` | `strong` | `very_strong`

**Performance Guard:** Limited to 10 columns max to prevent O(n²) explosion.

**Output:**
- Full n×n Pearson and Spearman matrices
- Sorted `CorrelationEntry[]` with per-pair metadata

#### 2. K-Means Clustering

```typescript
kMeansClustering(records: any[], numericColumns: string[], k?: number, maxIterations?: number): KMeansResult
```

**Algorithm:**
- **K-Means++ initialization** for better centroid placement (avoids poor random starts)
- **Min-max normalization** so all features contribute equally
- **Lloyd's algorithm** with convergence detection
- **Silhouette score** computation for cluster quality assessment
- **Automatic optimal k selection** (tries k=2..5, picks highest silhouette)

**Performance Guards:**
- Max 8 features
- Max 5,000 rows
- Silhouette computed on 500-point sample

**Output:**
- Per-record cluster assignment
- Centroid coordinates (original scale)
- Cluster profiles with auto-generated labels
- Silhouette quality score

#### 3. Distribution-Aware Outlier Detection

```typescript
detectOutliersAdvanced(records: any[], column: string): OutlierResult
```

**Algorithm:**

| Distribution | Detection Method | Description |
|-------------|-----------------|-------------|
| **Normal** | Standard IQR | Q1 − 1.5×IQR to Q3 + 1.5×IQR |
| **Log-normal** | Log-IQR | Apply IQR to log-transformed data, then exponentiate bounds |
| **Skewed** | Modified Z-Score (MAD) | Uses Median Absolute Deviation instead of mean/stddev |
| **Other** | Standard IQR (fallback) | Default method |

**Distribution Detection:**
1. Compute skewness and excess kurtosis
2. If all values positive and log-transform reduces skewness → `log-normal`
3. If |skewness| < 0.5 and |kurtosis| < 1 → `normal`
4. If |skewness| > 1 → `skewed`

This fixes the Sprint 2 bug where IQR was blindly applied to salary/revenue data with log-normal distributions, causing 20-40% false positive outliers.

#### 4. Pipeline Integration

```typescript
generateMLInsights(records: any[], numericColumns: string[]): MLInsightsResult
```

Orchestrates correlation matrix + K-Means and produces:
- `Insight[]` items for the AI Insights panel
- `AnalysisOption[]` chart configs for the visualization engine
- Correlation matrix data structure

**Guard Rails:**
- Minimum 2 numeric columns required
- Minimum 5 records required
- K-Means requires ≥10 records



### `analysisCache.ts`

In-memory LRU cache for analysis results.

| Parameter | Value |
|-----------|-------|
| **Max entries** | 100 |
| **TTL** | 30 minutes |
| **Memory budget** | 256 MB |
| **Key format** | `analysis:{md5_checksum}:{mimetype}` |
| **Eviction** | LRU (oldest access evicted first) |
| **Cleanup** | Automatic every 5 minutes |
| **Single entry cap** | 50 MB (skipped if larger) |

**Cache Key Design:** Uses file content MD5 checksum, not filename or file ID. This means:
- Re-uploading the same file content → cache hit
- Modifying file content → cache miss (new analysis)
- Different users uploading identical data → cache hit

**Redis Migration Path:** The `AnalysisCacheImpl` class can be replaced with a Redis-backed implementation that implements the same `get/set/invalidate` interface.

---

## Data Flow

1. **Upload:** File uploaded via `POST /api/files/upload` → stored in `uploads/` dir → MD5 checksum computed
2. **Request Analysis:** `GET /api/files/:id/analyze` → controller checks cache
3. **Cache Hit:** Returns cached `AnalysisResult` immediately
4. **Cache Miss:** Runs full pipeline:
   - File read → format detection → CSV/JSON/Excel parsing
   - Data cleaning → type inference → statistical analysis
   - ML Engine (correlation + clustering + outliers)
   - Reasoning engine synthesis
   - Result cached for 30 minutes
5. **Timeout:** 120-second hard limit → returns 504 with guidance

---

## Performance Characteristics

| Dataset Size | Expected Analysis Time | Notes |
|-------------|----------------------|-------|
| 100 rows | < 100ms | Instant |
| 1K rows | ~200ms | Full pipeline |
| 10K rows | ~1-3s | K-Means sampling kicks in |
| 50K rows | ~5-15s | Correlation matrix limited to 10 cols |
| 100K rows | ~15-60s | Near timeout boundary |
| 500K rows | 60-120s | May timeout |

---

## Adding New ML Algorithms

To add a new algorithm (e.g., PCA, DBSCAN, Random Forest):

1. Add the function to `mlEngine.ts`
2. Add appropriate types/interfaces
3. Call from `generateMLInsights()` with guard rails
4. Add unit tests in `tests/mlEngine.test.ts`
5. The result will automatically appear in the frontend's chart options

---

## Testing

```bash
cd backend
npx jest tests/mlEngine.test.ts --verbose
```

Tests cover:
- Correlation: perfect positive/negative, zero-variance, p-values, column limits
- K-Means: cluster count, assignment, silhouette, convergence, edge cases
- Outliers: IQR/log-IQR/Modified Z-Score selection, distribution detection
- Integration: generateMLInsights pipeline output
