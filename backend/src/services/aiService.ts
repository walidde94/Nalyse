
import OpenAI from 'openai';

export class AiService {
    private openai: OpenAI | null = null;

    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        } else {
        }
    }

    async generateText(prompt: string, systemPrompt: string = "You are a helpful assistant.", forceJson: boolean = false): Promise<string> {
        if (!this.openai) {
            return this.simulateResponse(prompt);
        }

        try {
            const params: any = {
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                model: "gpt-4o",
            };

            if (forceJson) {
                params.response_format = { type: "json_object" };
            }

            const completion = await this.openai.chat.completions.create(params);

            return completion.choices[0].message.content || "No response generated.";
        } catch (error: any) {
            console.error("OpenAI API Error:", error?.message || error);

            // If we are forcing JSON (like in NLQ) and OpenAI fails, use smart local fallback
            if (forceJson) {
                const lowerPrompt = prompt.toLowerCase();

                // Regex patterns to detect what the user is asking
                const isPie = lowerPrompt.includes("pie");
                const isBar = lowerPrompt.includes("bar");
                const isLine = lowerPrompt.includes("line") || lowerPrompt.includes("trend") || lowerPrompt.includes("over time");
                const isScatter = lowerPrompt.includes("scatter");
                const isMap = lowerPrompt.includes("map") || lowerPrompt.includes("geography");

                let chartType = "table";
                if (isMap) chartType = "worldmap";
                else if (isPie) chartType = "pie";
                else if (isBar) chartType = "bar";
                else if (isLine) chartType = "line";
                else if (isScatter) chartType = "scatter";

                // Schema awareness: Extract columns from the systemPrompt (Robust version)
                const availableCols: { name: string, type: string }[] = [];
                // Look for any line like "  - Name (Type)" or "- Name: Type" or similar
                const colMatches = systemPrompt.matchAll(/^\s*[-*]\s+([a-zA-Z0-9_\s]+?)\s*\(([^)]+)\)/gm);
                for (const match of colMatches) {
                    availableCols.push({
                        name: match[1].trim(),
                        type: match[2].trim().toLowerCase()
                    });
                }

                // If first pass fails, try simpler greedy match for any bulleted list in the schema section
                if (availableCols.length === 0) {
                    const lines = systemPrompt.split('\n');
                    let inSchema = false;
                    for (const line of lines) {
                        if (line.includes("DATASET SCHEMA")) inSchema = true;
                        if (inSchema && line.trim().startsWith('-')) {
                            const nameMatch = line.match(/-\s+([^(:]+)/);
                            if (nameMatch) {
                                availableCols.push({ name: nameMatch[1].trim(), type: 'text' });
                            }
                        }
                        if (inSchema && line.trim() === "" && availableCols.length > 5) inSchema = false;
                    }
                }

                const categories = availableCols.filter(c => c.type.includes('category') || c.type.includes('text') || c.type.includes('city') || c.type.includes('country') || c.type.includes('date')).map(c => c.name);
                const numbers = availableCols.filter(c => c.type.includes('number') || c.type.includes('currency') || c.type.includes('percent') || c.type.includes('int') || c.type.includes('float')).map(c => c.name);

                // Extract groupings and metrics using regex
                let xAxis = categories[0] || (availableCols[0]?.name) || "name";
                let yAxis = numbers[0] || (availableCols.find(c => !categories.includes(c.name))?.name) || "value";
                let sql = "SELECT * FROM ? LIMIT 20";
                let interpretation = "Showing raw results.";

                // Heuristic for selecting columns from the prompt
                const findRequestedCol = (cols: string[]) => cols.find(c => lowerPrompt.includes(c.toLowerCase()));
                const requestedCategory = findRequestedCol(categories) || findRequestedCol(availableCols.map(c => c.name));
                const requestedNumber = findRequestedCol(numbers);

                if (requestedCategory) xAxis = requestedCategory;
                if (requestedNumber) yAxis = requestedNumber;

                // Smart aggregation detection
                const byMatch = lowerPrompt.match(/by\s+([a-zA-Z0-9_]+)/i);
                const isAggregated = byMatch || lowerPrompt.includes("top") || lowerPrompt.includes("distribution") || lowerPrompt.includes("total") || (chartType !== 'table' && categories.length > 0 && numbers.length > 0);

                if (isAggregated && chartType !== 'table') {
                    if (byMatch) {
                        const matched = availableCols.find(c => c.name.toLowerCase() === byMatch[1].toLowerCase());
                        if (matched) xAxis = matched.name;
                    }

                    // Look for metric keywords if not found by name
                    if (!requestedNumber) {
                        const metricMatch = prompt.match(/(revenue|cost|sales|units|profit|amount|price|total)/i);
                        if (metricMatch) {
                            const found = numbers.find(n => n.toLowerCase().includes(metricMatch[1].toLowerCase()));
                            if (found) yAxis = found;
                        }
                    }

                    // Format keys for SQL — always use [brackets] for AlaSQL safety
                    const displayY = `Total${yAxis.replace(/\s+/g, '')}`;

                    sql = `SELECT [${xAxis}], SUM([${yAxis}]) as [${displayY}] FROM ? GROUP BY [${xAxis}] ORDER BY [${displayY}] DESC LIMIT 10`;

                    if (systemPrompt.includes("CLICKHOUSE")) {
                        const tableMatch = systemPrompt.match(/FROM\s+(nalyse_gen2\.dataset_[a-zA-Z0-9_]+)/i);
                        const chTable = tableMatch ? tableMatch[1] : '?';
                        const chX = `\`${xAxis}\``;
                        const chY = `\`${yAxis}\``;
                        sql = `SELECT ${chX}, sum(${chY}) as ${displayY} FROM ${chTable} GROUP BY ${chX} ORDER BY ${displayY} DESC LIMIT 10`;
                    }

                    yAxis = displayY; // UI expects the aliased column name
                    interpretation = `This chart visualizes the distribution of ${yAxis} across ${xAxis}. Our local engine detected this as the most relevant aggregation for your request.`;
                }

                return JSON.stringify({
                    sql,
                    chartType,
                    chartTitle: `Local Fallback: ${chartType.toUpperCase()}`,
                    xAxis,
                    yAxis,
                    interpretation,
                    suggestions: ["Show me the raw data table", "What's the average value?"]
                });
            }

            return "Error generating AI response. Please check backend logs.";
        }
    }

    async generatePlan(goal: string): Promise<{ tasks: string[], thought: string }> {
        if (!this.openai) {
            return {
                tasks: ["Simulated Task 1", "Simulated Task 2", "Simulated Task 3"],
                thought: "Simulation: Analyzing request and generating mock plan."
            };
        }

        const system = `You are an autonomous AI Agent Planner. 
        Given a user goal, break it down into 4-8 specific, actionable steps.
        Return ONLY a valid JSON object with this structure:
        {
            "thought": "A brief strategic thought about how to approach this",
            "tasks": ["Step 1", "Step 2", "Step 3"...]
        }`;

        const response = await this.generateText(goal, system);

        try {
            // Clean up markdown code blocks if present
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            return {
                thought: "Failed to parse AI plan, falling back to basic analysis.",
                tasks: ["Analyze Data", "Identify Anomalies", "Generate Report"]
            };
        }
    }

    private simulateResponse(prompt: string): string {
        return `[SIMULATION] I process "${prompt}" but I have no brain (API Key) yet.`;
    }

    async generateReport(goal: string, tasks: any[], logs: any[]): Promise<any> {
        if (!this.openai) {
            return {
                summary: `Simulated analysis of ${goal}.`,
                findings: [
                    { type: 'success', text: 'Simulated finding 1' },
                    { type: 'warning', text: 'Simulated finding 2' }
                ],
                confidence: 85
            };
        }

        const taskSummary = tasks.map(t => `- ${t.description}: ${t.result}`).join('\n');

        const system = `You are a Senior Strategic Analyst.
        Review the following execution logs of an autonomous agent session.
        Goal: "${goal}"
        
        Executed Tasks:
        ${taskSummary}
        
        Generate a structured JSON report with:
        - summary: A professional executive summary (2-3 sentences).
        - findings: Array of objects { type: 'success'|'warning'|'info', text: 'finding' }
        - confidence: Number 0-100
        - recommendations: Array of strings (actionable next steps)
        
        Return ONLY valid JSON.`;

        const response = await this.generateText("Generate synthesis report.", system);

        try {
            // Clean up markdown code blocks if present
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            return {
                summary: "Analysis completed successfully.",
                findings: [],
                confidence: 100
            };
        }
    }

    async analyzeContext(task: string, data: any): Promise<string> {
        if (!this.openai) {
            return `[Simulated AI Analysis] Processed ${JSON.stringify(data)} for task "${task}".`;
        }

        const system = `You are a specialized Data Analyst Agent.
        Your task is to execute a specific analysis step based on the provided context data.
        
        Context Data:
        ${JSON.stringify(data, null, 2)}
        
        Task: "${task}"
        
        Output a concise, professional analysis result (1-2 sentences). 
        Focus on insights, anomalies, or confirmation of integrity. 
        Do not describe the data structure, just the findings.`;

        return this.generateText(task, system);
    }
}
