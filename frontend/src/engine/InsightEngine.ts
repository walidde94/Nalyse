/**
 * InsightEngine — AI-Driven Data Preprocessing Layer
 * 
 * Analyzes raw datasets to extract patterns, trends, anomalies,
 * and generates intelligent chart titles & optimal visualization recommendations.
 * 
 * Runs entirely client-side for zero-latency preprocessing.
 * Results are cached per dataset fingerprint.
 */

// ─── Types ─────────────────────────────────────────────────────

export interface DataInsight {
  /** AI-generated contextual title summarizing the key finding */
  title: string;
  /** Short explanation of what was detected */
  description: string;
  /** The severity/importance: high = must-see, medium = notable, low = informational */
  significance: 'high' | 'medium' | 'low';
  /** What type of pattern was found */
  type: 'trend' | 'anomaly' | 'correlation' | 'distribution' | 'concentration' | 'comparison';
}

export interface ChartRecommendation {
  /** Recommended chart type */
  chartType: 'area' | 'bar' | 'line' | 'pie' | 'scatter' | 'composed';
  /** Why this chart type was chosen */
  reason: string;
  /** Recommended X axis key */
  xKey: string;
  /** Recommended Y axis key(s) */
  yKeys: string[];
  /** Recommended accent color */
  color: string;
  /** AI-generated insight title for the chart */
  insightTitle: string;
  /** Preprocessed/aggregated data ready for rendering */
  data: any[];
  /** Priority score (higher = more important to display first) */
  priority: number;
}

export interface InsightReport {
  /** Overall dataset summary */
  summary: string;
  /** Individual insights discovered */
  insights: DataInsight[];
  /** Chart recommendations sorted by priority */
  charts: ChartRecommendation[];
  /** Computed KPIs with contextual trends */
  kpis: KpiInsight[];
  /** Processing timestamp */
  generatedAt: number;
}

export interface KpiInsight {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  /** AI-generated context for the KPI */
  context?: string;
}

// ─── Helpers ───────────────────────────────────────────────────

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

/** Safely extract a numeric value from a row */
const safeNum = (val: any): number => {
  if (val === null || val === undefined || val === '') return NaN;
  const n = Number(String(val).replace(/[^0-9.\-]+/g, ''));
  return n;
};

/** Detect if a column is predominantly numeric */
const isNumericColumn = (data: any[], key: string): boolean => {
  const sample = data.slice(0, Math.min(50, data.length));
  const numCount = sample.filter(r => !isNaN(safeNum(r[key]))).length;
  return numCount / sample.length > 0.7;
};

/** Detect if a column looks like a date/time */
const isDateColumn = (data: any[], key: string): boolean => {
  const sample = data.slice(0, Math.min(20, data.length));
  const datePatterns = /^\d{4}[-/]\d{1,2}|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|^q[1-4]|^\d{4}$/i;
  const dateCount = sample.filter(r => datePatterns.test(String(r[key] || '').trim())).length;
  return dateCount / sample.length > 0.5;
};

/** Detect if a column is categorical (few unique values relative to dataset) */
const isCategorical = (data: any[], key: string): boolean => {
  const uniqueValues = new Set(data.map(r => String(r[key])));
  return uniqueValues.size <= Math.max(20, data.length * 0.3);
};

/** Compute basic statistics for a numeric column */
const computeStats = (values: number[]) => {
  const clean = values.filter(v => !isNaN(v));
  if (clean.length === 0) return { mean: 0, median: 0, std: 0, min: 0, max: 0, sum: 0, count: 0 };
  
  const sorted = [...clean].sort((a, b) => a - b);
  const sum = clean.reduce((s, v) => s + v, 0);
  const mean = sum / clean.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = clean.reduce((s, v) => s + (v - mean) ** 2, 0) / clean.length;
  const std = Math.sqrt(variance);
  
  return { mean, median, std, min: sorted[0], max: sorted[sorted.length - 1], sum, count: clean.length };
};

/** Detect trend direction in a time-ordered numeric series */
const detectTrend = (values: number[]): { direction: 'up' | 'down' | 'flat'; magnitude: number; acceleration: boolean } => {
  const clean = values.filter(v => !isNaN(v));
  if (clean.length < 3) return { direction: 'flat', magnitude: 0, acceleration: false };
  
  // Simple linear regression slope
  const n = clean.length;
  const xMean = (n - 1) / 2;
  const yMean = clean.reduce((s, v) => s + v, 0) / n;
  
  let numerator = 0, denominator = 0;
  clean.forEach((y, x) => {
    numerator += (x - xMean) * (y - yMean);
    denominator += (x - xMean) ** 2;
  });
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const relativeMagnitude = yMean !== 0 ? Math.abs(slope / yMean) * 100 : 0;
  
  // Detect acceleration (second derivative)
  const firstHalf = clean.slice(0, Math.floor(n / 2));
  const secondHalf = clean.slice(Math.floor(n / 2));
  const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
  const acceleration = Math.abs(secondAvg - firstAvg) > Math.abs(firstAvg) * 0.1;
  
  return {
    direction: relativeMagnitude < 1 ? 'flat' : slope > 0 ? 'up' : 'down',
    magnitude: relativeMagnitude,
    acceleration
  };
};

/** Format large numbers to human-readable */
const formatNumber = (n: number): string => {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(Number.isInteger(n) ? 0 : 2);
};

/** Detect outliers using IQR method */
const detectOutliers = (values: number[]): { outliers: number[]; threshold: { lower: number; upper: number } } => {
  const sorted = [...values].filter(v => !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length < 4) return { outliers: [], threshold: { lower: 0, upper: 0 } };
  
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  
  return {
    outliers: sorted.filter(v => v < lower || v > upper),
    threshold: { lower, upper }
  };
};

// ─── Cache ─────────────────────────────────────────────────────

const insightCache = new Map<string, InsightReport>();

const getFingerprint = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  const keys = Object.keys(data[0] || {}).join(',');
  return `${keys}_${data.length}_${JSON.stringify(data[0])}_${JSON.stringify(data[Math.min(data.length - 1, 10)])}`;
};

// ─── Main Engine ───────────────────────────────────────────────

export function analyzeDataset(data: any[], context?: string): InsightReport {
  if (!data || data.length === 0) {
    return { summary: 'No data available for analysis.', insights: [], charts: [], kpis: [], generatedAt: Date.now() };
  }

  // Check cache
  const fingerprint = getFingerprint(data);
  if (insightCache.has(fingerprint)) {
    return insightCache.get(fingerprint)!;
  }

  const keys = Object.keys(data[0] || {});
  const numericKeys = keys.filter(k => isNumericColumn(data, k));
  const dateKeys = keys.filter(k => isDateColumn(data, k));
  const categoricalKeys = keys.filter(k => !isNumericColumn(data, k) && !isDateColumn(data, k) && isCategorical(data, k));

  const insights: DataInsight[] = [];
  const charts: ChartRecommendation[] = [];
  const kpis: KpiInsight[] = [];
  let colorIdx = 0;

  // ── KPI Extraction ──────────────────────────────────────────

  // For each numeric column, compute stats and generate a KPI
  const topNumericKeys = numericKeys.slice(0, 4); // Max 4 KPIs
  topNumericKeys.forEach(key => {
    const values = data.map(r => safeNum(r[key]));
    const stats = computeStats(values);
    const trend = detectTrend(values);
    const outlierInfo = detectOutliers(values);
    
    const trendStr = trend.direction === 'up' 
      ? `+${trend.magnitude.toFixed(1)}%` 
      : trend.direction === 'down' 
        ? `-${trend.magnitude.toFixed(1)}%` 
        : 'Stable';

    kpis.push({
      label: key.replace(/[_]/g, ' '),
      value: stats.sum > 1000 ? formatNumber(stats.sum) : stats.mean > 0 ? formatNumber(stats.mean) : '0',
      trend: trendStr,
      trendUp: trend.direction === 'up' || trend.direction === 'flat',
      context: trend.acceleration 
        ? `${trend.direction === 'up' ? 'Accelerating' : 'Decelerating'} growth detected` 
        : undefined
    });

    // Generate insight for significant trends
    if (trend.magnitude > 5) {
      insights.push({
        title: trend.direction === 'up' 
          ? `${key} Shows ${trend.acceleration ? 'Accelerating' : 'Steady'} Growth of ${trend.magnitude.toFixed(1)}%`
          : `${key} Declining by ${trend.magnitude.toFixed(1)}% — Investigate Root Cause`,
        description: `The ${key} metric ${trend.direction === 'up' ? 'increased' : 'decreased'} from ${formatNumber(stats.min)} to ${formatNumber(stats.max)}.`,
        significance: trend.magnitude > 15 ? 'high' : 'medium',
        type: 'trend'
      });
    }

    // Generate insight for outliers
    if (outlierInfo.outliers.length > 0) {
      insights.push({
        title: `${outlierInfo.outliers.length} Anomalous Values Detected in ${key}`,
        description: `Values outside expected range [${formatNumber(outlierInfo.threshold.lower)} — ${formatNumber(outlierInfo.threshold.upper)}].`,
        significance: outlierInfo.outliers.length > data.length * 0.05 ? 'high' : 'medium',
        type: 'anomaly'
      });
    }
  });

  // ── Chart Recommendations ───────────────────────────────────

  const timeKey = dateKeys[0] || null;
  const primaryNumKey = numericKeys[0] || null;

  // 1. Time-series chart if we have a date column + numeric
  if (timeKey && primaryNumKey) {
    const aggregated = new Map<string, number>();
    data.forEach(r => {
      const t = String(r[timeKey]);
      aggregated.set(t, (aggregated.get(t) || 0) + safeNum(r[primaryNumKey]));
    });
    
    const timeData = Array.from(aggregated.entries())
      .map(([period, value]) => ({ period, value }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const values = timeData.map(d => d.value);
    const trend = detectTrend(values);
    
    const insightTitle = trend.direction === 'up'
      ? `${primaryNumKey} ${trend.acceleration ? 'Accelerating' : 'Rising'} — Up ${trend.magnitude.toFixed(0)}% Over Period`
      : trend.direction === 'down'
        ? `${primaryNumKey} Declining ${trend.magnitude.toFixed(0)}% — Needs Attention`
        : `${primaryNumKey} Holding Steady Across Time Range`;

    charts.push({
      chartType: 'area',
      reason: 'Time-series data with continuous numeric values — area chart highlights trajectory and volume.',
      xKey: 'period',
      yKeys: ['value'],
      color: CHART_COLORS[colorIdx++ % CHART_COLORS.length],
      insightTitle,
      data: timeData,
      priority: 100
    });
  }

  // 2. Categorical breakdown chart
  if (categoricalKeys.length > 0 && primaryNumKey) {
    const catKey = categoricalKeys[0];
    const catAgg = new Map<string, number>();
    data.forEach(r => {
      const cat = String(r[catKey]);
      catAgg.set(cat, (catAgg.get(cat) || 0) + safeNum(r[primaryNumKey]));
    });

    const catData = Array.from(catAgg.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Determine concentration
    const total = catData.reduce((s, d) => s + d.value, 0);
    const topShare = catData.length > 0 ? (catData[0].value / total) * 100 : 0;

    if (topShare > 40) {
      insights.push({
        title: `${catData[0].name} Dominates ${catKey} with ${topShare.toFixed(0)}% of Total ${primaryNumKey}`,
        description: `Top category accounts for nearly half of all ${primaryNumKey}. Consider diversification.`,
        significance: 'high',
        type: 'concentration'
      });
    }

    const usesPie = catData.length <= 6;
    charts.push({
      chartType: usesPie ? 'pie' : 'bar',
      reason: usesPie 
        ? 'Few categories — pie chart effectively shows proportional distribution.' 
        : 'Many categories — bar chart provides clear comparative ranking.',
      xKey: 'name',
      yKeys: ['value'],
      color: CHART_COLORS[colorIdx++ % CHART_COLORS.length],
      insightTitle: topShare > 30
        ? `${catData[0].name} Leads ${catKey} at ${topShare.toFixed(0)}% Share`
        : `${primaryNumKey} Distribution Across ${catKey}`,
      data: catData.slice(0, 12), // Trim noise — max 12 categories
      priority: 80
    });
  }

  // 3. If 2+ numeric columns exist, show a comparison
  if (numericKeys.length >= 2) {
    const [keyA, keyB] = numericKeys.slice(0, 2);
    
    // Compute Pearson correlation
    const valsA = data.map(r => safeNum(r[keyA]));
    const valsB = data.map(r => safeNum(r[keyB]));
    const statsA = computeStats(valsA);
    const statsB = computeStats(valsB);
    
    let corr = 0;
    if (statsA.std > 0 && statsB.std > 0) {
      const n = Math.min(valsA.length, valsB.length);
      let sum = 0;
      for (let i = 0; i < n; i++) {
        if (!isNaN(valsA[i]) && !isNaN(valsB[i])) {
          sum += ((valsA[i] - statsA.mean) / statsA.std) * ((valsB[i] - statsB.mean) / statsB.std);
        }
      }
      corr = sum / n;
    }

    if (Math.abs(corr) > 0.3) {
      insights.push({
        title: corr > 0.7 
          ? `Strong Positive Correlation Between ${keyA} and ${keyB} (r=${corr.toFixed(2)})`
          : corr < -0.7
            ? `Strong Inverse Relationship: ${keyA} vs ${keyB} (r=${corr.toFixed(2)})`
            : `Moderate ${corr > 0 ? 'Positive' : 'Negative'} Link Between ${keyA} and ${keyB}`,
        description: `Pearson r = ${corr.toFixed(2)} — ${Math.abs(corr) > 0.7 ? 'statistically significant' : 'worth monitoring'}.`,
        significance: Math.abs(corr) > 0.7 ? 'high' : 'medium',
        type: 'correlation'
      });
    }

    // Dual-metric comparison chart (only if we have a time/category axis)
    if (timeKey || categoricalKeys.length > 0) {
      const groupKey = timeKey || categoricalKeys[0];
      const grouped = new Map<string, { a: number; b: number }>();
      data.forEach(r => {
        const g = String(r[groupKey]);
        const existing = grouped.get(g) || { a: 0, b: 0 };
        existing.a += safeNum(r[keyA]);
        existing.b += safeNum(r[keyB]);
        grouped.set(g, existing);
      });

      const compData = Array.from(grouped.entries())
        .map(([label, vals]) => ({ label, [keyA]: vals.a, [keyB]: vals.b }));

      charts.push({
        chartType: 'composed',
        reason: 'Dual-metric comparison shows relationship between two key numeric dimensions.',
        xKey: 'label',
        yKeys: [keyA, keyB],
        color: CHART_COLORS[colorIdx++ % CHART_COLORS.length],
        insightTitle: Math.abs(corr) > 0.5 
          ? `${keyA} and ${keyB} Move ${corr > 0 ? 'Together' : 'Inversely'} (r=${corr.toFixed(2)})`
          : `Comparing ${keyA} vs ${keyB} Across ${groupKey}`,
        data: compData.slice(0, 20),
        priority: 60
      });
    }
  }

  // Sort charts by priority (highest first)
  charts.sort((a, b) => b.priority - a.priority);

  // Sort insights by significance
  const sigOrder = { high: 3, medium: 2, low: 1 };
  insights.sort((a, b) => sigOrder[b.significance] - sigOrder[a.significance]);

  // ── Generate Summary ────────────────────────────────────────

  const highInsights = insights.filter(i => i.significance === 'high');
  const summary = highInsights.length > 0
    ? `Analyzed ${data.length.toLocaleString()} records across ${keys.length} dimensions. ${highInsights.length} critical pattern${highInsights.length > 1 ? 's' : ''} detected: ${highInsights.map(i => i.title).join('; ')}.`
    : `Analyzed ${data.length.toLocaleString()} records across ${keys.length} dimensions. Data appears ${insights.length > 0 ? 'stable with minor patterns noted' : 'clean and well-distributed'}.`;

  const report: InsightReport = {
    summary,
    insights: insights.slice(0, 8), // Cap at 8 insights
    charts: charts.slice(0, 4), // Cap at 4 chart recommendations
    kpis: kpis.slice(0, 4),
    generatedAt: Date.now()
  };

  // Cache result
  insightCache.set(fingerprint, report);

  // Debug logging
  console.log('[InsightEngine] Report generated:', {
    records: data.length,
    numericCols: numericKeys.length,
    dateCols: dateKeys.length,
    categoricalCols: categoricalKeys.length,
    insightsFound: insights.length,
    chartsRecommended: charts.length,
    topInsight: insights[0]?.title || 'None'
  });

  return report;
}

/** Clear the insight cache (e.g., when data changes) */
export function clearInsightCache(): void {
  insightCache.clear();
}
