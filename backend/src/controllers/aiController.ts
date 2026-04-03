import { Request, Response } from 'express';
import { AiService } from '../services/aiService';
import { clickhouse } from '../config/database';

const aiService = new AiService();

export const handleNlqQuery = async (req: Request, res: Response) => {
    try {
        const { query, schema, sampleValues, datasetId } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Build rich schema description
        const schemaLines = schema
            ? Object.entries(schema).map(([col, type]) => {
                const samples = sampleValues?.[col];
                const sampleStr = samples?.length ? ` — examples: ${(samples as any[]).slice(0, 5).join(', ')}` : '';
                return `  - ${col} (${type})${sampleStr}`;
            }).join('\n')
            : 'Unknown schema';

        let isClickHouse = false;
        let clickhouseTable = '';

        if (datasetId) {
            clickhouseTable = `dataset_${datasetId.replace(/-/g, '_')}`;
            isClickHouse = true;
        }

        const sqlRules = isClickHouse ? `CLICKHOUSE SQL RULES:
- The dataset is ALWAYS referenced as "nalyse_gen2.${clickhouseTable}"
- Use backticks for column names with spaces: SELECT \`Customer Name\` FROM nalyse_gen2.${clickhouseTable}
- Aggregation functions: sum(), avg(), count(), max(), min()
- Always alias aggregated columns: sum(Revenue) AS TotalRevenue
- For top-N: ORDER BY col DESC LIMIT N
- Date comparisons: WHERE toDate(\`Date\`) >= '2024-01-01'
- NO [brackets], ONLY \`backticks\` for column names
- DO NOT add semicolons at the end` : `ALASQL RULES:
- The dataset is ALWAYS referenced as "?" (e.g., SELECT col FROM ?)
- Use [brackets] for column names with spaces: SELECT [Customer Name] FROM ?
- Aggregation functions: SUM(), AVG(), COUNT(), MAX(), MIN()
- Always alias aggregated columns: SUM(Revenue) AS TotalRevenue
- For top-N: ORDER BY col DESC LIMIT N
- For proportions/distributions: use GROUP BY with COUNT(*) or SUM()
- Date comparisons: WHERE [Date] >= '2024-01-01'
- NO backticks, ONLY [brackets] for identifiers
- DO NOT add semicolons at the end`;

        const systemPrompt = `You are an elite Data Scientist AI embedded in "Nalyse", a professional business intelligence platform.
Translate the user's natural language question about their dataset into:
1. A valid SQL query
2. The optimal chart visualization type
3. A concise chart title
4. The X and Y axis column names (from the SQL result, not original data)
5. A 2-3 sentence interpretation
6. 3 smart follow-up questions

DATASET SCHEMA (columns, types, sample values):
${schemaLines}

Total rows in dataset: ${req.body.totalRows || 'unknown'}

${sqlRules}

CRITICAL CHART RULES:
- If the user asks for a "pie chart", "bar chart", "line chart", "world map", etc., you MUST set chartType accordingly.
- For pie/bar/line/area charts: the SQL MUST use GROUP BY and aggregation (SUM, COUNT, AVG, etc.). NEVER return raw SELECT * for charts.
- For "map" or "geography" queries: use GROUP BY on the country/city/region column with SUM() or COUNT() and set chartType to "worldmap".
- For "distribution" or "breakdown" queries: use GROUP BY with COUNT(*) or SUM() and set chartType to "pie" or "bar".
- For "trend" or "over time" queries: use GROUP BY on the date column and set chartType to "line" or "area".
- For "top N" queries: use ORDER BY ... DESC LIMIT N and set chartType to "bar".
- xAxis must be the categorical/grouped column name (as aliased in SQL).
- yAxis must be the aggregated value column alias (e.g., "TotalRevenue", "Count").
- Only use chartType "table" when the user explicitly asks for raw records or a detailed list.

CHART TYPE OPTIONS (choose the BEST one):
- "bar": comparisons across categories (top-N, by-group, vs benchmarks)
- "line": time series, trends over ordered sequences
- "area": cumulative trends, growth trajectories
- "pie": proportions of a whole (max 8 slices, use for share/distribution)
- "scatter": correlations between two numeric variables
- "worldmap": geographical data (countries, cities, continents) natively plotted on a map
- "table": raw records, detailed lists, or when >5 columns are needed

You MUST respond with ONLY a valid JSON object, nothing else:
{
  "sql": "SELECT ... FROM ? ...",
  "chartType": "bar",
  "chartTitle": "Descriptive Chart Title",
  "xAxis": "column_for_x_axis",
  "yAxis": "column_or_alias_for_y_axis",
  "interpretation": "2-3 sentence explanation of what this reveals and why it matters for the business.",
  "suggestions": [
    "Natural language follow-up question 1?",
    "Natural language follow-up question 2?",
    "Natural language follow-up question 3?"
  ]
}`;

        const responseText = await aiService.generateText(query, systemPrompt, true);
        console.log('[NLQ] Raw AI response:', responseText.substring(0, 500));

        // Clean response
        const cleanJson = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^\s*\n/gm, '')
            .trim();

        try {
            const parsed = JSON.parse(cleanJson);
            // Sanitize SQL
            if (parsed.sql) {
                parsed.sql = parsed.sql.replace(/;$/, '').trim();
                // Only strip backticks for AlaSQL mode
                if (!isClickHouse) {
                    parsed.sql = parsed.sql.replace(/`/g, '');
                }
            }
            // Normalize suggestions field
            if (!parsed.suggestions && parsed.followUpQuestions) {
                parsed.suggestions = parsed.followUpQuestions;
            }

            // If ClickHouse, execute the query securely on the backend!
            if (isClickHouse && parsed.sql) {
                try {
                    console.log("[ClickHouse NLQ] Executing native SQL:", parsed.sql);
                    const rs = await clickhouse.query({ query: parsed.sql });
                    const resultData = await rs.json();
                    parsed.data = (resultData as any).data || [];
                } catch (chError: any) {
                    const isConnError = chError.message?.includes('ECONNREFUSED') || chError.code === 'ECONNREFUSED' || (chError.errors && chError.errors.some((e: any) => e.code === 'ECONNREFUSED'));
                    if (isConnError) {
                        console.warn("[ClickHouse NLQ] ClickHouse connection refused. Falling back to frontend execution.");
                    } else {
                        console.error("[ClickHouse NLQ] Execution error:", chError.message || chError);
                    }
                    // Convert ClickHouse syntax back to basic SQL so AlaSQL can handle it on the frontend
                    parsed.sql = parsed.sql.replace(/nalyse_gen2\.dataset_[a-zA-Z0-9_\-]+/gi, '?');
                    parsed.sql = parsed.sql.replace(/`([^`]+)`/g, '[$1]'); // Convert backticks to brackets
                    delete parsed.data;
                    delete parsed.sqlError;
                }
            }

            console.log('[NLQ] Parsed successfully — chartType:', parsed.chartType, '| SQL:', parsed.sql?.substring(0, 100));
            res.json(parsed);
        } catch (parseErr) {
            console.error('[NLQ] JSON parse failed. Raw response:', cleanJson.substring(0, 500));
            // Attempt to extract SQL even from malformed response
            const sqlMatch = cleanJson.match(/"sql"\s*:\s*"([^"]+)"/);
            const titleMatch = cleanJson.match(/"chartTitle"\s*:\s*"([^"]+)"/);
            const chartMatch = cleanJson.match(/"chartType"\s*:\s*"([^"]+)"/);
            const interpMatch = cleanJson.match(/"interpretation"\s*:\s*"([^"]+)"/);
            res.json({
                sql: sqlMatch ? sqlMatch[1].replace(/;$/, '') : 'SELECT * FROM ? LIMIT 20',
                chartType: chartMatch ? chartMatch[1] : 'table',
                chartTitle: titleMatch ? titleMatch[1] : 'Query Result',
                xAxis: 'name',
                yAxis: 'value',
                interpretation: interpMatch ? interpMatch[1] : 'The AI returned a partial response. Showing raw results.',
                suggestions: []
            });
        }
    } catch (error: any) {
        console.error('NLQ Error:', error);
        res.status(500).json({ error: 'Failed to process natural language query. Please try again.' });
    }
};

export const generateSynthesis = async (req: Request, res: Response) => {
    try {
        const { datasetName, rows, columns, anomalies, trends, metrics } = req.body;

        const systemPrompt = `You are an expert Chief Executive Data Scientist for a top-tier management consultancy.
You are tasked with generating a high-level strategic reasoning synthesis for a dataset analysis.
You MUST write EXACTLY 3 paragraphs:
Paragraph 1: Executive Summary - What dataset we are looking at, its size, global context, and the high-level operational picture.
Paragraph 2: The Meaning Behind the Numbers - Dive into what the identified anomalies, trends, or metrics actually indicate for the organization's systemic health or friction points.
Paragraph 3: Strategic Prescriptions - Direct, actionable recommendations that leverage the findings to improve operations, mitigate risks, or capitalize on growth vectors.

You must output in a structured JSON format with this exact schema:
{
  "executiveSummary": "string (all 3 paragraphs combined or separated by \\n\\n)",
  "strategicAdvice": ["string", "string", "string", "string"],
  "priorityMatrix": [
    { "task": "string", "impact": "High|Medium|Low", "effort": "High|Medium|Low" }
  ]
}

Return ONLY valid JSON.
`;

        const userPrompt = `Dataset Name: ${datasetName}
Rows: ${rows}
Columns: ${columns}
Metrics: ${JSON.stringify(metrics)}
Anomalies: ${JSON.stringify(anomalies)}
Trends: ${JSON.stringify(trends)}`;

        const responseText = await aiService.generateText(userPrompt, systemPrompt);
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanJson);
            res.json(parsed);
        } catch (e) {
            // Graceful fallback
            res.json({
                executiveSummary: responseText,
                strategicAdvice: ['Review the analysis findings and implement recommended changes.'],
                priorityMatrix: [{ task: 'Review Analysis', impact: 'High', effort: 'Low' }]
            });
        }
    } catch (error: any) {
        console.error('Synthesis Error:', error);
        res.status(500).json({ error: 'Failed to generate synthesis' });
    }
};

// ─── Root Cause Analysis Engine ────────────────────────────────
export const handleRootCauseAnalysis = async (req: Request, res: Response) => {
    try {
        const {
            anomaly,       // { metric, value, expected, deviation, severity, type, timestamp, zScore, explanation }
            kpiSummary,    // { metric, mean, std, min, max, trend, anomalyCount, healthScore }
            surroundingData, // array of ~20 rows around the anomaly
            allKpis,       // all KPI summaries for cross-correlation context
            datasetName,
        } = req.body;

        if (!anomaly) {
            return res.status(400).json({ error: 'Anomaly details are required' });
        }

        const systemPrompt = `You are an elite Root Cause Analysis (RCA) specialist embedded in "Nalyse", a professional business intelligence platform.

Given an anomaly detected in a dataset, your job is to reason through the data to identify the most likely ROOT CAUSES — not just describe the anomaly, but explain WHY it happened.

ANOMALY DETAILS:
- Metric: ${anomaly.metric}
- Observed Value: ${anomaly.value}
- Expected Value: ${anomaly.expected}
- Deviation: ${anomaly.deviation}% from expected
- Z-Score: ${anomaly.zScore}
- Severity: ${anomaly.severity}
- Type: ${anomaly.type}
- Timestamp: ${anomaly.timestamp}
- Initial Explanation: ${anomaly.explanation}

KPI CONTEXT FOR THIS METRIC:
- Mean: ${kpiSummary?.mean}, Std Dev: ${kpiSummary?.std}
- Min: ${kpiSummary?.min}, Max: ${kpiSummary?.max}
- Trend: ${kpiSummary?.trend} (${kpiSummary?.trendPct}%)
- Health Score: ${kpiSummary?.healthScore}%
- Total Anomalies in this KPI: ${kpiSummary?.anomalyCount}

ALL KPIS IN DATASET (for cross-correlation analysis):
${(allKpis || []).map((k: any) => `  - ${k.metric}: mean=${k.mean}, std=${k.std}, trend=${k.trend}, health=${k.healthScore}%, anomalies=${k.anomalyCount}`).join('\n')}

SURROUNDING DATA POINTS (rows around the anomaly):
${JSON.stringify((surroundingData || []).slice(0, 20), null, 1)}

Dataset: ${datasetName || 'Unknown'}

INSTRUCTIONS:
1. Analyze cross-metric correlations — did other metrics also spike/drop at the same time?
2. Look for patterns in the surrounding data that could explain the anomaly
3. Consider systemic factors (trend shifts, seasonal patterns, data quality issues)
4. Provide actionable root cause hypotheses ranked by confidence
5. Suggest specific investigative actions

Return ONLY a JSON object with this exact structure:
{
  "rootCauses": [
    {
      "cause": "string - concise root cause hypothesis",
      "confidence": number (0-100),
      "evidence": "string - specific data evidence supporting this hypothesis",
      "category": "string - one of: data_quality | process_change | external_event | system_error | seasonal | correlation | trend_shift | capacity"
    }
  ],
  "crossCorrelations": [
    {
      "metric": "string - related metric name",
      "relationship": "string - how it correlates (positive, negative, lagged)",
      "insight": "string - what this correlation reveals"
    }
  ],
  "timeline": "string - narrative of what likely happened in chronological order",
  "impactAssessment": "string - business impact if this anomaly is not addressed",
  "recommendedActions": [
    {
      "action": "string - specific action to take",
      "priority": "immediate | short_term | long_term",
      "effort": "low | medium | high"
    }
  ],
  "summary": "string - 2-3 sentence executive summary of the root cause analysis"
}`;

        const userPrompt = `Perform a thorough root cause analysis for the ${anomaly.severity} ${anomaly.type} anomaly detected in "${anomaly.metric}". The value was ${anomaly.value} when ${anomaly.expected} was expected (${anomaly.deviation}% deviation, z-score: ${anomaly.zScore}).`;

        const responseText = await aiService.generateText(userPrompt, systemPrompt);
        const cleanJson = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^\s*\n/gm, '')
            .trim();

        try {
            const parsed = JSON.parse(cleanJson);
            res.json(parsed);
        } catch (parseErr) {
            // Graceful fallback
            res.json({
                rootCauses: [
                    {
                        cause: `${anomaly.type} detected in ${anomaly.metric} with ${Math.abs(anomaly.deviation)}% deviation`,
                        confidence: 60,
                        evidence: anomaly.explanation || 'Statistical deviation detected',
                        category: 'trend_shift'
                    }
                ],
                crossCorrelations: [],
                timeline: `A ${anomaly.severity} ${anomaly.type} was detected at ${anomaly.timestamp}. The value of ${anomaly.value} deviated ${anomaly.deviation}% from the expected ${anomaly.expected}.`,
                impactAssessment: 'Further investigation is recommended to assess the full business impact.',
                recommendedActions: [
                    { action: 'Investigate the data source for potential issues', priority: 'immediate', effort: 'low' },
                    { action: 'Review related metrics for cascading effects', priority: 'short_term', effort: 'medium' }
                ],
                summary: `Root cause analysis completed for ${anomaly.metric}. The AI returned a partial response. The primary hypothesis is a ${anomaly.type} event.`
            });
        }
    } catch (error: any) {
        console.error('RCA Error:', error);
        res.status(500).json({ error: 'Failed to perform root cause analysis' });
    }
};

// ─── Predictive Forecasting Engine ─────────────────────────────
export const handleForecast = async (req: Request, res: Response) => {
    try {
        const { metric, historicalValues, historicalLabels, periods, stats, allMetrics } = req.body;

        if (!metric || !historicalValues?.length) {
            return res.status(400).json({ error: 'Metric and historical values are required' });
        }

        const systemPrompt = `You are an elite Predictive Analytics Engineer embedded in "Nalyse", a professional BI platform.

Given historical time series data, generate a realistic forecast with confidence intervals.

METRIC: ${metric}
HISTORICAL DATA POINTS: ${historicalValues.length}
STATISTICS:
- Mean: ${stats?.mean?.toFixed(2)}
- Min: ${stats?.min}
- Max: ${stats?.max}
- Std Dev: ${stats?.std?.toFixed(2)}
- Recent trend (last 20): ${JSON.stringify(stats?.recentTrend?.slice(-10))}
- Last label: ${stats?.lastLabel}

ALL METRICS IN DATASET: ${(allMetrics || []).join(', ')}

FULL HISTORICAL VALUES (last ${historicalValues.length}):
${JSON.stringify(historicalValues.slice(-50))}

LABELS (last 20):
${JSON.stringify((historicalLabels || []).slice(-20))}

FORECAST ${periods} periods into the future.

RULES:
1. Predictions must be REALISTIC — extrapolate from actual data patterns, not random
2. Each period should have a value, upper bound (95% CI), and lower bound (95% CI)
3. The confidence interval should WIDEN as you go further into the future
4. Detect if there's seasonality, linear trend, or mean-reversion
5. Label periods logically (continue the pattern from historicalLabels)
6. Trend direction must match the actual recent data trajectory
7. Values must stay within a reasonable range of historical min/max

Return ONLY this JSON:
{
  "predictions": [
    { "period": "string", "value": number, "upper": number, "lower": number }
  ],
  "trend": "up" | "down" | "stable",
  "trendPct": number,
  "seasonality": "none" | "weekly" | "monthly" | "quarterly" | "yearly" | "detected",
  "accuracy": number (0-100, estimated model confidence),
  "summary": "2-3 sentence forecast summary explaining what to expect and why",
  "risks": ["risk 1", "risk 2", "risk 3"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "methodology": "Technical description of the forecasting approach used"
}`;

        const userPrompt = `Generate a ${periods}-period forecast for "${metric}" based on ${historicalValues.length} historical data points. Mean=${stats?.mean?.toFixed(2)}, StdDev=${stats?.std?.toFixed(2)}, recent values: ${JSON.stringify(stats?.recentTrend?.slice(-5))}.`;

        const responseText = await aiService.generateText(userPrompt, systemPrompt);
        const cleanJson = responseText
            .replace(/```json\n?/g, '').replace(/```\n?/g, '')
            .replace(/^\s*\n/gm, '').trim();

        try {
            const parsed = JSON.parse(cleanJson);
            res.json(parsed);
        } catch (parseErr) {
            // Fallback: simple linear extrapolation
            const mean = stats?.mean || 0;
            const std = stats?.std || 1;
            const lastVal = historicalValues[historicalValues.length - 1] || mean;
            const trend = (lastVal - (historicalValues[historicalValues.length - 10] || mean)) / 10;

            const predictions = Array.from({ length: periods }, (_, i) => {
                const val = lastVal + trend * (i + 1);
                const spread = std * 0.5 * (i + 1);
                return {
                    period: `Period ${i + 1}`,
                    value: Math.round(val * 100) / 100,
                    upper: Math.round((val + spread) * 100) / 100,
                    lower: Math.round(Math.max(0, val - spread) * 100) / 100,
                };
            });

            res.json({
                predictions,
                trend: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
                trendPct: mean ? (trend / mean * 100) : 0,
                seasonality: 'none',
                accuracy: 55,
                summary: `Linear extrapolation forecast for ${metric}. AI response was partial, showing basic trend continuation.`,
                risks: ['Forecast based on limited pattern analysis', 'External factors not considered'],
                opportunities: ['Trend continuation suggests growth potential'],
                methodology: 'Simple linear extrapolation from recent data trend.'
            });
        }
    } catch (error: any) {
        console.error('Forecast Error:', error);
        res.status(500).json({ error: 'Failed to generate forecast' });
    }
};
