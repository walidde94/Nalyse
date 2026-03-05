import { Request, Response } from 'express';
import { AiService } from '../services/aiService';

const aiService = new AiService();

export const handleNlqQuery = async (req: Request, res: Response) => {
    try {
        const { query, schema } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const systemPrompt = `You are a data analyst AI specialized in translating natural language dataset queries into AlaSQL queries.
Given the dataset schema, return ONLY a valid AlaSQL query that filters or aggregates the data.
Dataset is available as "?".
Example 1: "Show me sales in Berlin last Q3" -> SELECT * FROM ? WHERE City = 'Berlin' AND Date >= '2023-07-01' AND Date <= '2023-09-30'
Example 2: "Total revenue by country" -> SELECT Country, SUM(Revenue) as TotalRevenue FROM ? GROUP BY Country
Example 3: "Top 5 products by sales" -> SELECT Product, SUM(Sales) as TotalSales FROM ? GROUP BY Product ORDER BY TotalSales DESC LIMIT 5

Schema (Columns and types):
${JSON.stringify(schema)}

Return ONLY the raw SQL string without markdown blocks or explanations. Do not wrap in \`\`\`sql ... \`\`\`.
`;

        const sqlQuery = await aiService.generateText(query, systemPrompt);

        // Strip out trailing semicolons and backticks just in case
        const cleanSqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').replace(/;$/, '').trim();

        res.json({ sql: cleanSqlQuery });
    } catch (error: any) {
        console.error('NLQ Error:', error);
        res.status(500).json({ error: 'Failed to process NLQ' });
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
        const parsed = JSON.parse(cleanJson);

        res.json(parsed);
    } catch (error: any) {
        console.error('Synthesis Error:', error);
        res.status(500).json({ error: 'Failed to generate synthesis' });
    }
};
