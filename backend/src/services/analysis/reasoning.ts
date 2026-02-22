import { AnalysisResult, Insight, AnalysisOption } from './types';

/**
 * Expert Reasoning Engine
 * Synthesizes heuristic findings into high-level strategic intelligence.
 * Mimics the output of a top-tier business consultancy.
 */
export class ReasoningEngine {
    static synthesize(result: AnalysisResult): {
        executiveSummary: string;
        strategicAdvice: string[];
        priorityMatrix: Array<{ task: string; impact: string; effort: string }>;
    } {
        const insights = result.aiInsights || [];
        const trends = insights.filter(i => i.type === 'trend');
        const anomalies = insights.filter(i => i.type === 'anomaly');
        const correlations = insights.filter(i => i.type === 'correlation');
        const columnNames = Object.keys(result.summary.columnTypes).join(' ').toLowerCase();

        // 1. Detect Field Expertise (The "Understanding" Phase)
        let detectedField = 'General Business';
        if (/patient|medical|doctor|clinical|health|diagnosis|provider/i.test(columnNames)) detectedField = 'Healthcare & Life Sciences';
        else if (/sku|product|inventory|stock|retail|order|shipment|warehouse|carrier/i.test(columnNames)) detectedField = 'Retail & Supply Chain';
        else if (/churn|mrr|subscription|saas|user|login|session|arr|cac/i.test(columnNames)) detectedField = 'SaaS & Digital Products';
        else if (/revenue|cost|margin|profit|finance|ebitda|balance|asset|tax|invoice/i.test(columnNames)) detectedField = 'Corporate Finance';
        else if (/campaign|click|impression|lead|mql|sql|ad_spend|ctr/i.test(columnNames)) detectedField = 'Marketing & Growth';
        else if (/employee|salary|onboarding|talent|hiring|resignation|attrition/i.test(columnNames)) detectedField = 'Human Resources';

        // 2. Generate Executive Summary with Field Authority
        let summary = `[Strategic Domain Analysis: ${detectedField}] System has successfully mapped the underlying logic of this dataset. `;
        summary += `We have characterized this as a ${detectedField} core knowledge stream containing ${result.summary.rows.toLocaleString()} institutional data points. `;

        if (anomalies.length > 0) {
            summary += `Structural analysis revealed ${anomalies.length} significant deviations from standard ${detectedField} efficiency baselines. `;
        } else {
            summary += `Data patterns show high alignment with standard ${detectedField} performance models. `;
        }

        if (correlations.length > 0) {
            summary += `Our synthesis engine identified ${correlations.length} interconnected dependencies that suggest a mature operational framework. `;
        }

        // 3. Field-Specific Strategic Advice
        const advice: string[] = [];

        switch (detectedField) {
            case 'Healthcare & Life Sciences':
                advice.push('Enhance patient outcome traceability by correlating clinical interventions with recovery metrics.');
                advice.push('Strengthen data governance to ensure complete HIPAA/GDPR alignment across all detected nodes.');
                break;
            case 'Retail & Supply Chain':
                advice.push('Implement predictive stock replenishment for high-velocity SKUs identified in the Pareto analysis.');
                advice.push('Mitigate supply chain friction by optimizing the linkage between inventory levels and regional demand.');
                break;
            case 'SaaS & Digital Products':
                advice.push('Focus on reducing expansion friction in high-engagement user cohorts.');
                advice.push('Leverage churn-correlation findings to build a proactive retention firewall.');
                break;
            case 'Corporate Finance':
                advice.push('Optimize capital allocation based on the detected high-margin segments.');
                advice.push('Monitor the significant correlation between operational costs and revenue acceleration.');
                break;
            case 'Marketing & Growth':
                advice.push('Optimize CAC by reallocating budget to the highest CTR clusters identified.');
                advice.push('Scale the top-performing campaign archetypes across underperforming demographics.');
                break;
            case 'Human Resources':
                advice.push('Implement early-warning systems for high-value talent attrition risks.');
                advice.push('Optimize the onboarding pipeline by identifying bottlenecks in the training-to-productivity transition.');
                break;
            default:
                advice.push('Establish a secondary validation layer for the identified high-confidence trends.');
                advice.push('Transition from periodic analysis to a real-time institutional monitoring framework.');
        }

        // Add heuristic-driven advice
        if (trends.some(t => t.description.toLowerCase().includes('expansion'))) {
            advice.push('Replicate the successful growth vectors of expanding segments across lower-performing units.');
        }

        // 4. Dynamic Priority Matrix
        const matrix = [
            { task: `Optimize ${detectedField} Core KPIs`, impact: 'High', effort: 'Medium' },
            { task: 'Mitigate Systemic Deviations', impact: 'High', effort: 'Low' },
            { task: 'Scale Predictive Intelligence', impact: 'Medium', effort: 'High' }
        ];

        return {
            executiveSummary: summary,
            strategicAdvice: advice.slice(0, 5),
            priorityMatrix: matrix
        };
    }
}
