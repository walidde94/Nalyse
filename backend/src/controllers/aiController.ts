import { Request, Response } from 'express';
import { AiService } from '../services/aiService';

const aiService = new AiService();

export const handleNlqQuery = async (req: Request, res: Response) => {
    try {
        const { query, schema, sampleValues } = req.body;
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

        const systemPrompt = `You are an elite Data Scientist AI embedded in "Nalyse", a professional business intelligence platform.
Translate the user's natural language question about their dataset into:
1. A valid AlaSQL query
2. The optimal chart visualization type
3. A concise chart title
4. The X and Y axis column names
5. A 2-3 sentence interpretation
6. 3 smart follow-up questions

DATASET SCHEMA (columns, types, sample values):
${schemaLines}

Total rows in dataset: ${req.body.totalRows || 'unknown'}

ALASQL RULES:
- The dataset is ALWAYS referenced as "?" (e.g., SELECT col FROM ?)
- Use [brackets] for column names with spaces: SELECT [Customer Name] FROM ?
- Aggregation functions: SUM(), AVG(), COUNT(), MAX(), MIN()
- Always alias aggregated columns: SUM(Revenue) AS TotalRevenue
- For top-N: ORDER BY col DESC LIMIT N
- For proportions/distributions: use GROUP BY with COUNT(*)
- Date comparisons: WHERE [Date] >= '2024-01-01'
- For counting distinct: COUNT(DISTINCT col) is supported
- NEVER use backticks, only [brackets] for identifiers
- NEVER add semicolons at the end

CHART TYPE RULES (choose the BEST one):
- "bar": comparisons across categories (top-N, by-group, vs benchmarks)
- "line": time series, trends over ordered sequences
- "area": cumulative trends, growth trajectories
- "pie": proportions of a whole (max 8 slices, use for share/distribution)
- "scatter": correlations between two numeric variables
- "table": raw records, detailed lists, or when >5 columns are needed

RESPONSE FORMAT — return ONLY the JSON object below (no markdown, no explanation):
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

        const responseText = await aiService.generateText(query, systemPrompt);

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
                parsed.sql = parsed.sql.replace(/;$/, '').replace(/`/g, '').trim();
            }
            // Normalize suggestions field
            if (!parsed.suggestions && parsed.followUpQuestions) {
                parsed.suggestions = parsed.followUpQuestions;
            }
            res.json(parsed);
        } catch (parseErr) {
            // Attempt to extract SQL even from malformed response
            const sqlMatch = cleanJson.match(/"sql"\s*:\s*"([^"]+)"/);
            const titleMatch = cleanJson.match(/"chartTitle"\s*:\s*"([^"]+)"/);
            res.json({
                sql: sqlMatch ? sqlMatch[1].replace(/;$/, '') : 'SELECT * FROM ? LIMIT 20',
                chartType: 'table',
                chartTitle: titleMatch ? titleMatch[1] : 'Query Result',
                xAxis: 'name',
                yAxis: 'value',
                interpretation: 'The AI returned a partial response. Showing raw results.',
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
