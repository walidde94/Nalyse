# Chart Customization Cookbook

> A practical guide for configuring chart types, colors, aggregations, and drill-downs in Nalyse.

---

## Chart Types

Nalyse auto-selects chart types based on your data. You can override by clicking the chart type selector.

### Bar Chart
**Best for**: Comparing discrete categories (products, regions, time periods)

| Setting | Options | Default |
|---------|---------|---------|
| Orientation | Vertical, Horizontal | Vertical |
| Bar Radius | 0–8px corner rounding | `[4, 4, 0, 0]` |
| Fill | Solid color, Gradient | Gradient |
| Bar Size | 8–64px width | 32px |

```
When to use:
✅ Comparing 3-20 categories
✅ Showing totals or aggregations
❌ Time-series data (use Line/Area instead)
❌ >30 categories (becomes unreadable)
```

### Line Chart
**Best for**: Trends over time, continuous data

| Setting | Options | Default |
|---------|---------|---------|
| Type | `monotone`, `linear`, `basis`, `step` | `monotone` |
| Stroke Width | 1–4px | 2px |
| Dot Radius | 0–6px | 2px |

### Area Chart
**Best for**: Showing volume/magnitude over time with visual weight

| Setting | Options | Default |
|---------|---------|---------|
| Fill | Gradient (5%→0% opacity) | Gradient |
| Stack | Stacked areas, Overlay | Overlay |

### Pie / Donut Chart
**Best for**: Part-to-whole relationships (market share, distribution)

| Setting | Options | Default |
|---------|---------|---------|
| Inner Radius | 0% (solid pie) – 70% (donut) | 60% |
| Outer Radius | 50%–90% | 80% |
| Padding Angle | 0–10px gap between slices | 5px |

```
When to use:
✅ 2-8 categories
✅ Showing proportions
❌ >8 categories (use Bar instead)
❌ Values don't sum to 100%
```

### Scatter Plot
**Best for**: Correlation between two numeric variables

| Setting | Options | Default |
|---------|---------|---------|
| X Axis | Any numeric column | Auto-detected |
| Y Axis | Any numeric column | Auto-detected |
| Point Size | 3–12px | 6px |

### Radar Chart
**Best for**: Multi-dimensional comparison (performance profiles)

---

## Color Palette

Nalyse uses a curated 6-color palette designed for dark backgrounds:

| Color Name | Hex Code | Usage |
|-----------|----------|-------|
| Emerald | `#34d399` | Primary / first series |
| Sky | `#38bdf8` | Secondary series |
| Indigo | `#818cf8` | Tertiary series |
| Pink | `#f472b6` | Highlight / alerts |
| Amber | `#fbbf24` | Warnings / flags |
| Violet | `#a78bfa` | Additional series |

### Custom Colors

In the Custom Dashboard builder, each widget has a `color` property. Change it by editing the widget settings:

```javascript
widget.color = '#22d3ee'; // Cyan 400
```

---

## Aggregation Methods

When your data has multiple values per category, Nalyse applies aggregation:

| Method | Formula | Best For |
|--------|---------|----------|
| **Sum** | Σ values | Revenue, counts, totals |
| **Mean** | Σ / n | Averages, rates |
| **Median** | Middle value | Skewed distributions |
| **Min/Max** | Extreme values | Range analysis |
| **Count** | n | Frequency analysis |

### Configuring Aggregation

1. Go to **Analysis Settings** → **Advanced**
2. Change **Aggregation Method** dropdown
3. Rerun analysis to apply

---

## Drill-Down Navigation

Click on any data point to "drill down" into its sub-categories:

```
Country (top-level)
  └── Region
        └── City
              └── Store
```

### How It Works

1. **Click** a bar/slice/point to filter by that category
2. The **breadcrumb trail** shows your drill path
3. Click **"Back"** or any breadcrumb to navigate up
4. **Clear All** resets to the top level

### Filter Stack

You can filter by multiple dimensions simultaneously:
- Click a bar to filter by category
- Use the KQL search bar for complex queries
- The active filter count shows in the toolbar

---

## Chart Annotations

Add comments, flags, and insights directly on charts:

1. **Enable** annotation mode via the chart toolbar
2. **Click** anywhere on the chart to place an annotation
3. Choose type:
   - 💬 **Comment** — General observations
   - 🚩 **Flag** — Mark anomalies or issues
   - 💡 **Insight** — Key findings
4. **Pin** important annotations to keep them visible
5. Annotations persist in localStorage

---

## Custom Dashboard

Build personalized dashboards with the Dashboard Builder:

### Widget Grid
- **12-column** CSS grid layout
- **Drag** — Grab the header to reposition
- **Resize** — Drag the bottom-right corner
- **Expand** — Click maximize for full-width view

### Saving Layouts
1. Enter a layout name in the toolbar
2. Click **Save** — stored in localStorage
3. Load saved layouts from the dropdown
4. **Reset** clears all widgets

### Widget Types
| Type | Best Use |
|------|----------|
| Bar | Category comparison |
| Line | Trends |
| Area | Volume over time |
| Pie | Proportions |
| Scatter | Correlations |
| KPI | Single-value metrics |

---

## Export Options

### PDF Report
- Click **Export PDF** in the analysis toolbar
- Includes executive summary, findings, and all visible charts
- Generation runs in a Web Worker (non-blocking)

### Noise Report
- Click **Download** in the Data Noise Widget
- JSON format with per-column analysis and recommendations

### Chart Screenshot
- Click the **camera icon** on any chart
- Saves as PNG via html2canvas

---

## Performance Tips

| Dataset Size | Recommendation |
|-------------|----------------|
| < 1K rows | All chart types work well |
| 1K–10K rows | Disable animations for faster rendering |
| 10K–100K rows | Use Virtual Data Grid + simplified charts |
| > 100K rows | Sample data or use aggregation pipelines |

### Virtual Scrolling
For datasets >10K rows, the data grid uses virtualized rendering:
- Only visible rows are in the DOM
- Configurable overscan buffer (default: 10 rows)
- Search filters before virtualization
