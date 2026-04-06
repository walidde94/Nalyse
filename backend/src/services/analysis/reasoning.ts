// ═══════════════════════════════════════════════════════════════════════════════
// Nalyse Reasoning Engine v3.0 — Executive Intelligence Synthesizer
// Context-aware strategic analysis that adapts to detected domain expertise
// ═══════════════════════════════════════════════════════════════════════════════

import { AnalysisResult, Insight } from './types';

// ─── Domain Detection Rules ─────────────────────────────────────────────────

interface DomainProfile {
    name: string;
    patterns: RegExp;
    advice: (ctx: ReasoningContext) => string[];
    kpis: string[];
}

interface ReasoningContext {
    rows: number;
    columns: number;
    anomalyCount: number;
    correlationCount: number;
    trendCount: number;
    riskCount: number;
    topInsights: Insight[];
    hasRevenue: boolean;
    hasTime: boolean;
    hasStatus: boolean;
    hasGeo: boolean;
    dataHealthScore: number;
}

const DOMAINS: DomainProfile[] = [
    {
        name: 'Healthcare & Life Sciences',
        patterns: /patient|medical|doctor|clinical|health|diagnosis|provider|hospital|prescription|treatment|ehr|icd|cpt|npi/i,
        kpis: ['Patient Outcomes', 'Readmission Rate', 'Treatment Efficacy', 'Compliance Score'],
        advice: (ctx) => [
            'Correlate treatment protocols with patient outcome trajectories to identify high-efficacy care pathways.',
            'Implement predictive readmission risk scoring based on the detected patient cohort patterns.',
            ctx.anomalyCount > 0 ? `Investigate ${ctx.anomalyCount} clinical data anomalies for potential reporting errors or exceptional cases.` : '',
            'Ensure PHI fields comply with HIPAA de-identification standards before downstream sharing.',
            ctx.hasTime ? 'Build temporal outcome dashboards to track treatment effectiveness over time.' : '',
        ].filter(Boolean)
    },
    {
        name: 'Retail & Supply Chain',
        patterns: /sku|product|inventory|stock|retail|order|shipment|warehouse|carrier|fulfillment|supplier|vendor|upc|asin/i,
        kpis: ['Inventory Turnover', 'Order Fulfillment Rate', 'Stock-Out Risk', 'Supply Chain Velocity'],
        advice: (ctx) => [
            'Deploy predictive replenishment for high-velocity SKUs identified in the Pareto analysis.',
            'Optimize safety stock levels using the detected demand variability patterns.',
            ctx.correlationCount > 0 ? `Leverage ${ctx.correlationCount} supply-demand correlations to improve forecast accuracy.` : '',
            ctx.anomalyCount > 0 ? `Review ${ctx.anomalyCount} inventory anomalies — potential shrinkage or data entry issues.` : '',
            'Implement ABC classification-based inventory policies to reduce carrying costs.',
        ].filter(Boolean)
    },
    {
        name: 'SaaS & Digital Products',
        patterns: /churn|mrr|arr|subscription|saas|user|login|session|cac|ltv|trial|onboard|activation|retention|nps|dau|mau|wau/i,
        kpis: ['Monthly Recurring Revenue', 'Churn Rate', 'LTV:CAC Ratio', 'Net Revenue Retention'],
        advice: (ctx) => [
            'Build a churn prediction model using the behavioral patterns detected in user engagement data.',
            'Focus expansion revenue efforts on the high-engagement cohorts identified in segment analysis.',
            ctx.hasRevenue ? 'Calculate and track LTV:CAC ratio across acquisition channels for efficient growth.' : '',
            ctx.trendCount > 0 ? 'Monitor the detected growth trajectories for early signs of saturation.' : '',
            'Implement automated health scoring for accounts showing pre-churn behavior patterns.',
        ].filter(Boolean)
    },
    {
        name: 'Corporate Finance',
        patterns: /revenue|cost|margin|profit|finance|ebitda|balance|asset|tax|invoice|ledger|debit|credit|gl|journal|amortization|depreciation/i,
        kpis: ['Revenue Growth', 'Operating Margin', 'Working Capital', 'ROI'],
        advice: (ctx) => [
            'Optimize capital allocation based on the detected high-margin business segments.',
            ctx.correlationCount > 0 ? `Monitor ${ctx.correlationCount} detected interdependencies between cost centers and revenue drivers.` : '',
            'Implement rolling forecast models that incorporate the identified seasonal patterns.',
            ctx.anomalyCount > 0 ? `Audit ${ctx.anomalyCount} financial anomalies for potential misclassification or fraud indicators.` : '',
            'Build variance analysis dashboards comparing actuals against detected baseline trends.',
        ].filter(Boolean)
    },
    {
        name: 'Marketing & Growth',
        patterns: /campaign|click|impression|lead|mql|sql|ad_spend|ctr|cpc|cpm|conversion|funnel|channel|attribution|roi|roas/i,
        kpis: ['Customer Acquisition Cost', 'Conversion Rate', 'ROAS', 'Channel Efficiency'],
        advice: (ctx) => [
            'Reallocate budget to the highest-performing channels and campaign archetypes identified in the analysis.',
            'Build multi-touch attribution models using the detected conversion funnel patterns.',
            ctx.hasRevenue ? 'Calculate true ROAS by connecting campaign spend to revenue attribution data.' : '',
            ctx.anomalyCount > 0 ? `Investigate ${ctx.anomalyCount} performance anomalies — potential bot traffic or tracking issues.` : '',
            'Implement A/B testing infrastructure around the top-performing creative segments.',
        ].filter(Boolean)
    },
    {
        name: 'Human Resources',
        patterns: /employee|salary|onboarding|talent|hiring|resignation|attrition|hire_date|department|job_title|performance|review|training|pto|leave/i,
        kpis: ['Attrition Rate', 'Time-to-Hire', 'Employee Satisfaction', 'Training ROI'],
        advice: (ctx) => [
            'Deploy early-warning models for high-value talent flight risk using the detected attrition patterns.',
            'Optimize compensation bands based on the market benchmarks identified in salary distribution analysis.',
            ctx.correlationCount > 0 ? `Investigate ${ctx.correlationCount} correlations between tenure, performance, and compensation.` : '',
            'Streamline onboarding processes by identifying bottlenecks in the training-to-productivity pipeline.',
            ctx.hasTime ? 'Track seasonal hiring patterns to optimize recruitment cadence and pipeline capacity.' : '',
        ].filter(Boolean)
    },
    {
        name: 'IoT & Manufacturing',
        patterns: /sensor|temperature|humidity|pressure|machine|device|telemetry|uptime|downtime|oee|defect|quality|batch|lot/i,
        kpis: ['Overall Equipment Effectiveness', 'Defect Rate', 'Mean Time Between Failures', 'Yield'],
        advice: (ctx) => [
            'Implement predictive maintenance scheduling based on the detected sensor anomaly patterns.',
            'Optimize process parameters using the correlation analysis between machine settings and output quality.',
            ctx.anomalyCount > 0 ? `${ctx.anomalyCount} sensor anomalies may indicate equipment degradation — schedule inspection.` : '',
            'Build real-time quality control dashboards with automated threshold alerting.',
            'Analyze batch-to-batch variation to identify root causes of yield fluctuation.',
        ].filter(Boolean)
    },
    {
        name: 'Education & Research',
        patterns: /student|grade|course|enrollment|gpa|exam|professor|semester|credit|thesis|research|publication|citation/i,
        kpis: ['Completion Rate', 'Average GPA', 'Enrollment Growth', 'Research Output'],
        advice: (ctx) => [
            'Identify at-risk students using the detected performance pattern clusters for early intervention.',
            'Optimize course scheduling based on enrollment density and demand patterns.',
            ctx.correlationCount > 0 ? `Leverage ${ctx.correlationCount} correlations between engagement metrics and academic outcomes.` : '',
            'Benchmark departmental performance using the comparative analysis results.',
            ctx.hasTime ? 'Track enrollment trends to forecast capacity requirements for upcoming semesters.' : '',
        ].filter(Boolean)
    },
];

const DEFAULT_DOMAIN: DomainProfile = {
    name: 'General Business Intelligence',
    patterns: /.*/,
    kpis: ['Data Quality', 'Trend Velocity', 'Anomaly Rate', 'Correlation Density'],
    advice: (ctx) => [
        'Establish automated monitoring for the high-confidence patterns identified in this analysis.',
        ctx.anomalyCount > 0 ? `Prioritize investigation of ${ctx.anomalyCount} detected anomalies for operational impact.` : '',
        ctx.correlationCount > 0 ? `Validate ${ctx.correlationCount} variable relationships through controlled experimentation.` : '',
        ctx.trendCount > 0 ? 'Build predictive models based on the sustained trends identified in the dataset.' : '',
        'Transition from periodic reporting to continuous intelligence with real-time data feeds.',
        ctx.dataHealthScore < 80 ? `Improve data quality (currently ${ctx.dataHealthScore}/100) — incomplete or dirty data reduces analysis reliability.` : '',
    ].filter(Boolean)
};

// ─── Main Reasoning Engine ──────────────────────────────────────────────────

export class ReasoningEngine {
    static synthesize(result: AnalysisResult): {
        executiveSummary: string;
        strategicAdvice: string[];
        priorityMatrix: Array<{ task: string; impact: string; effort: string }>;
    } {
        const insights = result.aiInsights || [];
        const columnNames = Object.keys(result.summary.columnTypes).join(' ');

        // 1. Detect Domain
        const domain = DOMAINS.find(d => d.patterns.test(columnNames)) || DEFAULT_DOMAIN;

        // 2. Build Context
        const ctx: ReasoningContext = {
            rows: result.summary.rows,
            columns: result.summary.columns,
            anomalyCount: insights.filter(i => i.type === 'anomaly').length,
            correlationCount: insights.filter(i => i.type === 'correlation').length,
            trendCount: insights.filter(i => i.type === 'trend').length,
            riskCount: insights.filter(i => i.type === 'risk').length,
            topInsights: insights.filter(i => i.confidence > 0.85).slice(0, 5),
            hasRevenue: Object.keys(result.summary.columnTypes).some(c => /revenue|sales|amount|price|total|value|cost|income/i.test(c)),
            hasTime: Object.values(result.summary.columnTypes).includes('date' as any),
            hasStatus: Object.keys(result.summary.columnTypes).some(c => /status|state|active|churn/i.test(c)),
            hasGeo: Object.keys(result.summary.columnTypes).some(c => /country|region|city|state/i.test(c)),
            dataHealthScore: result.dataHealth?.score || 0,
        };

        // 3. Generate Executive Summary
        const parts: string[] = [];

        parts.push(`[${domain.name} Analysis]`);
        parts.push(`Processed ${ctx.rows.toLocaleString()} records across ${ctx.columns} dimensions.`);

        // Data quality assessment
        if (ctx.dataHealthScore >= 90) {
            parts.push('Data quality is excellent — high confidence in all derived insights.');
        } else if (ctx.dataHealthScore >= 70) {
            parts.push(`Data quality is good (${ctx.dataHealthScore}/100) with minor gaps that don't materially impact findings.`);
        } else {
            parts.push(`Data quality concerns detected (${ctx.dataHealthScore}/100) — some findings may require validation.`);
        }

        // Key findings summary
        const findingCounts = [];
        if (ctx.anomalyCount > 0) findingCounts.push(`${ctx.anomalyCount} anomalies`);
        if (ctx.correlationCount > 0) findingCounts.push(`${ctx.correlationCount} correlations`);
        if (ctx.trendCount > 0) findingCounts.push(`${ctx.trendCount} trends`);
        if (ctx.riskCount > 0) findingCounts.push(`${ctx.riskCount} risk signals`);

        if (findingCounts.length > 0) {
            parts.push(`Analysis identified: ${findingCounts.join(', ')}.`);
        }

        // Top insight callout
        if (ctx.topInsights.length > 0) {
            const top = ctx.topInsights[0];
            const cleanDesc = top.description.replace(/\*\*/g, '').substring(0, 150);
            parts.push(`Highest-confidence finding: ${cleanDesc}`);
        }

        const summary = parts.join(' ');

        // 4. Strategic Advice (domain-specific + context-aware)
        const advice = domain.advice(ctx).slice(0, 5);

        // 5. Priority Matrix (dynamic based on findings)
        const matrix: Array<{ task: string; impact: string; effort: string }> = [];

        if (ctx.anomalyCount > 0) {
            matrix.push({
                task: `Investigate ${ctx.anomalyCount} detected anomalies`,
                impact: 'High',
                effort: 'Low'
            });
        }

        matrix.push({
            task: `Optimize ${domain.kpis[0] || 'Core KPIs'} based on findings`,
            impact: 'High',
            effort: 'Medium'
        });

        if (ctx.correlationCount > 0) {
            matrix.push({
                task: `Validate ${ctx.correlationCount} variable relationships`,
                impact: 'Medium',
                effort: 'Medium'
            });
        }

        if (ctx.trendCount > 0) {
            matrix.push({
                task: 'Build predictive models from sustained trends',
                impact: 'High',
                effort: 'High'
            });
        }

        if (ctx.dataHealthScore < 80) {
            matrix.push({
                task: `Improve data quality from ${ctx.dataHealthScore}% to 90%+`,
                impact: 'High',
                effort: 'Medium'
            });
        }

        matrix.push({
            task: `Scale ${domain.name} intelligence pipeline`,
            impact: 'Medium',
            effort: 'High'
        });

        return {
            executiveSummary: summary,
            strategicAdvice: advice,
            priorityMatrix: matrix.slice(0, 5)
        };
    }
}
