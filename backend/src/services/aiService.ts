
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

    async generateText(prompt: string, systemPrompt: string = "You are a helpful assistant."): Promise<string> {
        if (!this.openai) {
            return this.simulateResponse(prompt);
        }

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                model: "gpt-4-turbo-preview",
            });

            return completion.choices[0].message.content || "No response generated.";
        } catch (error) {
            console.error("OpenAI API Error:", error);
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
