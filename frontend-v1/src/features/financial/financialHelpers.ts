// ─── Financial Intelligence Engine ──────────────────────────
// Client-side financial forecasting, risk scoring, ratio analysis,
// stress testing, and explainability for Nalyse
// ─────────────────────────────────────────────────────────────

// ═══ Types ═══════════════════════════════════════════════════

export interface FinancialRow {
    [key: string]: any;
}

export interface FinancialMapping {
    period: string;
    revenue: string;
    fixedCosts: string;
    variableCosts: string;
    payroll?: string;
    debt?: string;
    accountsPayable?: string;
    accountsReceivable?: string;
    taxLiabilities?: string;
    inventory?: string;
    cashBalance?: string;
    totalAssets?: string;
    totalLiabilities?: string;
    equity?: string;
    interestExpense?: string;
    ebit?: string;
    currentAssets?: string;
    currentLiabilities?: string;
    retainedEarnings?: string;
    marketCap?: string;
    salesRevenue?: string;
}

export interface FinancialPeriod {
    period: string;
    index: number;
    revenue: number;
    fixedCosts: number;
    variableCosts: number;
    totalCosts: number;
    payroll: number;
    debt: number;
    accountsPayable: number;
    accountsReceivable: number;
    taxLiabilities: number;
    inventory: number;
    cashBalance: number;
    totalAssets: number;
    totalLiabilities: number;
    equity: number;
    interestExpense: number;
    ebit: number;
    currentAssets: number;
    currentLiabilities: number;
    retainedEarnings: number;
    netIncome: number;
    operatingCashflow: number;
    grossMargin: number;
    operatingMargin: number;
    burnRate: number;
}

export interface FinancialRatio {
    name: string;
    value: number;
    benchmark: number;
    status: 'healthy' | 'warning' | 'critical';
    description: string;
    category: 'liquidity' | 'solvency' | 'profitability' | 'efficiency';
}

export interface ForecastPoint {
    period: string;
    index: number;
    projected: number;
    upper: number;
    lower: number;
    worstCase: number;
    isHistorical: boolean;
    historicalValue?: number;
}

export interface RiskScore {
    overall: number;          // 0-100 (higher = riskier)
    riskClass: 'Low' | 'Medium' | 'High' | 'Critical';
    altmanZ: number;
    altmanZone: 'Safe' | 'Grey' | 'Distress';
    insolvencyProbability: number; // 0-1
    liquidityRunway: number;  // months
    cashExhaustionDate: string | null;
    confidenceLevel: number;
    components: RiskComponent[];
}

export interface RiskComponent {
    name: string;
    score: number;
    weight: number;
    contribution: number;
    direction: 'positive' | 'negative' | 'neutral';
}

export interface StressScenario {
    id: string;
    name: string;
    revenueChange: number;    // -0.20 = -20%
    costChange: number;       // +0.15 = +15%
    interestChange: number;
    receivableDelay: number;  // months delay factor
    color: string;
}

export interface StressResult {
    scenario: StressScenario;
    forecast: ForecastPoint[];
    riskScore: number;
    riskClass: string;
    liquidityRunway: number;
    survivalMonths: number;
    impactDelta: {
        riskScoreChange: number;
        runwayChange: number;
        cashPositionChange: number;
    };
}

export interface Recommendation {
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'liquidity' | 'cost' | 'revenue' | 'debt' | 'operational';
    actionType: 'immediate' | 'short-term' | 'strategic';
    impact: string;
}

export interface FinancialAnalysisResult {
    periods: FinancialPeriod[];
    ratios: FinancialRatio[];
    forecast: ForecastPoint[];
    riskScore: RiskScore;
    stressResults: StressResult[];
    recommendations: Recommendation[];
    kpis: FinancialKPI[];
    explanations: string[];
}

export interface FinancialKPI {
    label: string;
    value: number;
    formatted: string;
    trend: 'up' | 'down' | 'stable';
    trendPct: number;
    status: 'healthy' | 'warning' | 'critical';
    sparkline: number[];
    icon: string;
}

// ═══ Utilities ═══════════════════════════════════════════════

const mean = (a: number[]) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
const std = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const linearRegression = (vals: number[]) => {
    const n = vals.length; if (n < 2) return { slope: 0, intercept: vals[0] || 0 };
    const xm = (n - 1) / 2, ym = mean(vals);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (i - xm) * (vals[i] - ym); den += (i - xm) ** 2; }
    const slope = den ? num / den : 0;
    return { slope, intercept: ym - slope * xm };
};

export const fmt = (v: number, decimals = 1) =>
    Math.abs(v) >= 1e9 ? `${(v / 1e9).toFixed(decimals)}B` :
        Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(decimals)}M` :
            Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(decimals)}K` :
                v.toFixed(decimals);

export const fmtCurrency = (v: number) => `$${fmt(v)}`;
export const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
export const fmtRatio = (v: number) => v.toFixed(2);

export const RISK_COLORS: Record<string, string> = {
    Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444',
    healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444'
};

export const SCENARIO_COLORS = ['#818cf8', '#f472b6', '#fb923c', '#34d399', '#a78bfa'];

// ═══ Data Extraction ════════════════════════════════════════

function safeNum(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    const n = Number(String(val).replace(/[$,€£¥\s]/g, ''));
    return isNaN(n) ? 0 : n;
}

export function autoDetectMapping(data: FinancialRow[]): Partial<FinancialMapping> {
    if (!data.length) return {};
    const cols = Object.keys(data[0]);
    const mapping: Partial<FinancialMapping> = {};

    const patterns: [keyof FinancialMapping, RegExp][] = [
        ['period', /period|month|date|quarter|year|time/i],
        ['revenue', /revenue|sales|income|turnover|top.?line/i],
        ['fixedCosts', /fixed.?cost|overhead|rent|fixed.?expense/i],
        ['variableCosts', /variable.?cost|cogs|cost.?of.?good|material|variable.?expense/i],
        ['payroll', /payroll|salary|salaries|wages|compensation|personnel/i],
        ['debt', /debt|loan|borrowing|obligation|liability.*long/i],
        ['accountsPayable', /payable|ap\b|accounts.?payable/i],
        ['accountsReceivable', /receivable|ar\b|accounts.?receivable/i],
        ['taxLiabilities', /tax|taxes|tax.?liab/i],
        ['inventory', /inventory|stock|goods/i],
        ['cashBalance', /cash|cash.?balance|bank|liquid/i],
        ['totalAssets', /total.?asset|assets/i],
        ['totalLiabilities', /total.?liab|liabilities/i],
        ['equity', /equity|shareholder|net.?worth|book.?value/i],
        ['interestExpense', /interest|finance.?cost|debt.?service/i],
        ['ebit', /ebit|operating.?income|operating.?profit/i],
        ['currentAssets', /current.?asset/i],
        ['currentLiabilities', /current.?liab/i],
        ['retainedEarnings', /retained|accumulated/i],
    ];

    for (const [key, regex] of patterns) {
        const match = cols.find(c => regex.test(c));
        if (match) (mapping as any)[key] = match;
    }

    // Fallback: if no period column, use first non-numeric column or first column
    if (!mapping.period) {
        mapping.period = cols.find(c => data.slice(0, 5).some(r => isNaN(Number(r[c])))) || cols[0];
    }

    return mapping;
}

export function extractFinancialPeriods(data: FinancialRow[], mapping: Partial<FinancialMapping>): FinancialPeriod[] {
    return data.map((row, i) => {
        const g = (key: keyof FinancialMapping) => mapping[key] ? safeNum(row[mapping[key]!]) : 0;
        const revenue = g('revenue');
        const fixedCosts = g('fixedCosts');
        const variableCosts = g('variableCosts');
        const payroll = g('payroll');
        const totalCosts = fixedCosts + variableCosts + payroll;
        const debt = g('debt');
        const interestExpense = g('interestExpense');
        const ebit = g('ebit') || (revenue - totalCosts);
        const netIncome = ebit - interestExpense - g('taxLiabilities');
        const cashBalance = g('cashBalance');
        const operatingCashflow = netIncome; // Simplified
        const burnRate = totalCosts > revenue ? totalCosts - revenue : 0;
        const grossMargin = revenue ? (revenue - variableCosts) / revenue : 0;
        const operatingMargin = revenue ? ebit / revenue : 0;

        return {
            period: String(row[mapping.period || ''] || `Period ${i + 1}`),
            index: i,
            revenue, fixedCosts, variableCosts, totalCosts, payroll, debt,
            accountsPayable: g('accountsPayable'),
            accountsReceivable: g('accountsReceivable'),
            taxLiabilities: g('taxLiabilities'),
            inventory: g('inventory'),
            cashBalance,
            totalAssets: g('totalAssets') || (cashBalance + g('accountsReceivable') + g('inventory')),
            totalLiabilities: g('totalLiabilities') || (debt + g('accountsPayable') + g('taxLiabilities')),
            equity: g('equity') || (g('totalAssets') - g('totalLiabilities')),
            interestExpense,
            ebit,
            currentAssets: g('currentAssets') || (cashBalance + g('accountsReceivable') + g('inventory')),
            currentLiabilities: g('currentLiabilities') || (g('accountsPayable') + g('taxLiabilities')),
            retainedEarnings: g('retainedEarnings'),
            netIncome, operatingCashflow, grossMargin, operatingMargin, burnRate
        };
    });
}

// ═══ Ratio Analysis ═════════════════════════════════════════

export function computeRatios(periods: FinancialPeriod[]): FinancialRatio[] {
    if (!periods.length) return [];
    const latest = periods[periods.length - 1];
    const ratios: FinancialRatio[] = [];

    // Current Ratio
    const currentRatio = latest.currentLiabilities ? latest.currentAssets / latest.currentLiabilities : 999;
    ratios.push({
        name: 'Current Ratio', value: currentRatio, benchmark: 1.5,
        status: currentRatio >= 1.5 ? 'healthy' : currentRatio >= 1.0 ? 'warning' : 'critical',
        description: 'Measures ability to pay short-term obligations',
        category: 'liquidity'
    });

    // Quick Ratio (exclude inventory)
    const quickRatio = latest.currentLiabilities
        ? (latest.currentAssets - latest.inventory) / latest.currentLiabilities : 999;
    ratios.push({
        name: 'Quick Ratio', value: quickRatio, benchmark: 1.0,
        status: quickRatio >= 1.0 ? 'healthy' : quickRatio >= 0.5 ? 'warning' : 'critical',
        description: 'Liquidity without relying on inventory sales',
        category: 'liquidity'
    });

    // Debt-to-Equity
    const dte = latest.equity ? latest.totalLiabilities / latest.equity : 999;
    ratios.push({
        name: 'Debt-to-Equity', value: dte, benchmark: 2.0,
        status: dte <= 1.5 ? 'healthy' : dte <= 3.0 ? 'warning' : 'critical',
        description: 'Financial leverage — lower is safer',
        category: 'solvency'
    });

    // Operating Margin
    ratios.push({
        name: 'Operating Margin', value: latest.operatingMargin, benchmark: 0.15,
        status: latest.operatingMargin >= 0.15 ? 'healthy' : latest.operatingMargin >= 0.05 ? 'warning' : 'critical',
        description: 'Profitability from core operations',
        category: 'profitability'
    });

    // Gross Margin
    ratios.push({
        name: 'Gross Margin', value: latest.grossMargin, benchmark: 0.40,
        status: latest.grossMargin >= 0.35 ? 'healthy' : latest.grossMargin >= 0.20 ? 'warning' : 'critical',
        description: 'Revenue retained after direct costs',
        category: 'profitability'
    });

    // Interest Coverage
    const icr = latest.interestExpense ? latest.ebit / latest.interestExpense : 999;
    ratios.push({
        name: 'Interest Coverage', value: icr, benchmark: 3.0,
        status: icr >= 3.0 ? 'healthy' : icr >= 1.5 ? 'warning' : 'critical',
        description: 'Ability to service debt interest payments',
        category: 'solvency'
    });

    // Burn Rate (monthly cash consumption)
    const avgBurn = mean(periods.map(p => p.burnRate));
    ratios.push({
        name: 'Burn Rate', value: avgBurn, benchmark: 0,
        status: avgBurn <= 0 ? 'healthy' : avgBurn < latest.cashBalance * 0.1 ? 'warning' : 'critical',
        description: 'Net cash consumed per period when unprofitable',
        category: 'liquidity'
    });

    // Cash Ratio
    const cashRatio = latest.currentLiabilities ? latest.cashBalance / latest.currentLiabilities : 999;
    ratios.push({
        name: 'Cash Ratio', value: cashRatio, benchmark: 0.5,
        status: cashRatio >= 0.5 ? 'healthy' : cashRatio >= 0.2 ? 'warning' : 'critical',
        description: 'Immediate liquid cash vs. short-term debt',
        category: 'liquidity'
    });

    return ratios;
}

// ═══ Altman Z-Score ═════════════════════════════════════════

function computeAltmanZ(p: FinancialPeriod): { z: number; zone: 'Safe' | 'Grey' | 'Distress' } {
    const TA = p.totalAssets || 1;
    const X1 = (p.currentAssets - p.currentLiabilities) / TA; // Working Capital / TA
    const X2 = p.retainedEarnings / TA;
    const X3 = p.ebit / TA;
    const X4 = p.equity / (p.totalLiabilities || 1); // Market cap proxy
    const X5 = p.revenue / TA;
    const z = 1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * X4 + 1.0 * X5;
    const zone = z > 2.99 ? 'Safe' : z > 1.81 ? 'Grey' : 'Distress';
    return { z, zone };
}

// ═══ Cashflow Forecast ══════════════════════════════════════

export function forecastCashflow(
    periods: FinancialPeriod[],
    horizonMonths: number = 12,
    scenario?: Partial<StressScenario>
): ForecastPoint[] {
    if (periods.length < 3) return [];
    const cashflows = periods.map(p => p.operatingCashflow);
    const cashBalances = periods.map(p => p.cashBalance);
    const revenues = periods.map(p => p.revenue);
    const costs = periods.map(p => p.totalCosts);

    // Trend and seasonality via linear regression
    const revReg = linearRegression(revenues);
    const costReg = linearRegression(costs);
    const cfStd = std(cashflows) || 1;

    // Revenue & cost multipliers for stress scenarios
    const revMult = 1 + (scenario?.revenueChange || 0);
    const costMult = 1 + (scenario?.costChange || 0);

    const results: ForecastPoint[] = [];

    // Historical points
    periods.forEach((p, i) => {
        results.push({
            period: p.period, index: i, projected: p.cashBalance,
            upper: p.cashBalance, lower: p.cashBalance, worstCase: p.cashBalance,
            isHistorical: true, historicalValue: p.cashBalance
        });
    });

    // Forecast
    let cumulativeCash = cashBalances[cashBalances.length - 1] || 0;
    for (let m = 1; m <= horizonMonths; m++) {
        const futIdx = periods.length - 1 + m;
        const projRevenue = Math.max(0, (revReg.intercept + revReg.slope * futIdx) * revMult);
        const projCost = Math.max(0, (costReg.intercept + costReg.slope * futIdx) * costMult);
        const projCashflow = projRevenue - projCost;

        cumulativeCash += projCashflow;
        const uncertainty = cfStd * Math.sqrt(m) * 1.2;

        results.push({
            period: `M+${m}`,
            index: futIdx,
            projected: cumulativeCash,
            upper: cumulativeCash + uncertainty * 1.5,
            lower: cumulativeCash - uncertainty * 1.5,
            worstCase: cumulativeCash - uncertainty * 2.5,
            isHistorical: false
        });
    }

    return results;
}

// ═══ Risk Scoring ═══════════════════════════════════════════

export function computeRiskScore(periods: FinancialPeriod[], ratios: FinancialRatio[]): RiskScore {
    if (!periods.length) {
        return {
            overall: 0, riskClass: 'Low', altmanZ: 3, altmanZone: 'Safe',
            insolvencyProbability: 0, liquidityRunway: 999, cashExhaustionDate: null,
            confidenceLevel: 0, components: []
        };
    }

    const latest = periods[periods.length - 1];
    const { z: altmanZ, zone: altmanZone } = computeAltmanZ(latest);

    // Component scores (0-100, higher = riskier)
    const components: RiskComponent[] = [];

    // 1. Liquidity risk
    const avgBurn = mean(periods.map(p => p.burnRate));
    const liquidityRunway = avgBurn > 0 && latest.cashBalance > 0
        ? latest.cashBalance / avgBurn : (latest.cashBalance > 0 ? 999 : 0);
    const liqScore = clamp(liquidityRunway < 3 ? 90 : liquidityRunway < 6 ? 70 :
        liquidityRunway < 12 ? 40 : liquidityRunway < 24 ? 20 : 5, 0, 100);
    components.push({
        name: 'Liquidity Risk', score: liqScore, weight: 0.25,
        contribution: liqScore * 0.25, direction: liqScore > 50 ? 'negative' : 'positive'
    });

    // 2. Altman Z-Score risk
    const zScore = clamp(altmanZ < 1.1 ? 95 : altmanZ < 1.81 ? 70 :
        altmanZ < 2.99 ? 40 : 10, 0, 100);
    components.push({
        name: 'Altman Z-Score', score: zScore, weight: 0.20,
        contribution: zScore * 0.20, direction: zScore > 50 ? 'negative' : 'positive'
    });

    // 3. Profitability risk
    const profScore = clamp(latest.operatingMargin < 0 ? 85 : latest.operatingMargin < 0.05 ? 65 :
        latest.operatingMargin < 0.15 ? 30 : 10, 0, 100);
    components.push({
        name: 'Profitability', score: profScore, weight: 0.15,
        contribution: profScore * 0.15, direction: profScore > 50 ? 'negative' : 'positive'
    });

    // 4. Leverage risk
    const dte = latest.equity ? latest.totalLiabilities / latest.equity : 10;
    const levScore = clamp(dte > 5 ? 90 : dte > 3 ? 70 : dte > 1.5 ? 40 : 15, 0, 100);
    components.push({
        name: 'Leverage', score: levScore, weight: 0.15,
        contribution: levScore * 0.15, direction: levScore > 50 ? 'negative' : 'positive'
    });

    // 5. Trend risk (revenue trajectory)
    const revTrend = linearRegression(periods.map(p => p.revenue));
    const avgRev = mean(periods.map(p => p.revenue)) || 1;
    const trendPct = (revTrend.slope * periods.length / avgRev);
    const trendScore = clamp(trendPct < -0.2 ? 85 : trendPct < -0.05 ? 60 :
        trendPct < 0.05 ? 35 : 10, 0, 100);
    components.push({
        name: 'Revenue Trend', score: trendScore, weight: 0.15,
        contribution: trendScore * 0.15, direction: trendScore > 50 ? 'negative' : 'positive'
    });

    // 6. Volatility
    const revVol = std(periods.map(p => p.revenue)) / (avgRev || 1);
    const volScore = clamp(revVol > 0.4 ? 80 : revVol > 0.2 ? 55 : revVol > 0.1 ? 30 : 10, 0, 100);
    components.push({
        name: 'Volatility', score: volScore, weight: 0.10,
        contribution: volScore * 0.10, direction: volScore > 50 ? 'negative' : 'positive'
    });

    const overall = Math.round(components.reduce((s, c) => s + c.contribution, 0));
    const riskClass: RiskScore['riskClass'] = overall >= 75 ? 'Critical' : overall >= 50 ? 'High' :
        overall >= 30 ? 'Medium' : 'Low';

    // Insolvency probability (logistic)
    const insolvencyProbability = 1 / (1 + Math.exp(-(overall - 60) / 12));

    // Cash exhaustion estimate
    let cashExhaustionDate: string | null = null;
    if (liquidityRunway < 36 && avgBurn > 0) {
        const d = new Date();
        d.setMonth(d.getMonth() + Math.round(liquidityRunway));
        cashExhaustionDate = d.toISOString().slice(0, 7);
    }

    return {
        overall, riskClass, altmanZ, altmanZone, insolvencyProbability,
        liquidityRunway: Math.min(999, liquidityRunway),
        cashExhaustionDate,
        confidenceLevel: Math.min(95, 60 + periods.length * 2),
        components
    };
}

// ═══ Stress Testing ═════════════════════════════════════════

export const DEFAULT_SCENARIOS: StressScenario[] = [
    { id: 'base', name: 'Baseline', revenueChange: 0, costChange: 0, interestChange: 0, receivableDelay: 0, color: '#818cf8' },
    { id: 'mild', name: 'Mild Downturn', revenueChange: -0.10, costChange: 0.05, interestChange: 0, receivableDelay: 0.5, color: '#f59e0b' },
    { id: 'severe', name: 'Severe Recession', revenueChange: -0.25, costChange: 0.10, interestChange: 0.02, receivableDelay: 1, color: '#f97316' },
    { id: 'crisis', name: 'Liquidity Crisis', revenueChange: -0.40, costChange: 0.15, interestChange: 0.05, receivableDelay: 2, color: '#ef4444' },
];

export function runStressTests(periods: FinancialPeriod[], ratios: FinancialRatio[]): StressResult[] {
    const baseRisk = computeRiskScore(periods, ratios);
    const baseForecast = forecastCashflow(periods, 12);
    const baseRunway = baseRisk.liquidityRunway;

    return DEFAULT_SCENARIOS.map(scenario => {
        const forecast = forecastCashflow(periods, 12, scenario);
        const lastProjected = forecast.filter(f => !f.isHistorical);
        const survivalMonths = lastProjected.findIndex(f => f.projected <= 0);
        const finalCash = lastProjected.length ? lastProjected[lastProjected.length - 1].projected : 0;

        // Adjust risk score for scenario
        const scenarioRisk = clamp(
            baseRisk.overall + Math.abs(scenario.revenueChange) * 80 + scenario.costChange * 40,
            0, 100
        );
        const riskClass = scenarioRisk >= 75 ? 'Critical' : scenarioRisk >= 50 ? 'High' :
            scenarioRisk >= 30 ? 'Medium' : 'Low';

        const scenarioRunway = survivalMonths >= 0 ? survivalMonths : 12;

        return {
            scenario,
            forecast,
            riskScore: Math.round(scenarioRisk),
            riskClass,
            liquidityRunway: scenarioRunway,
            survivalMonths: survivalMonths >= 0 ? survivalMonths : 999,
            impactDelta: {
                riskScoreChange: Math.round(scenarioRisk - baseRisk.overall),
                runwayChange: scenarioRunway - Math.min(12, baseRunway),
                cashPositionChange: finalCash - (baseForecast.length ? baseForecast[baseForecast.length - 1].projected : 0)
            }
        };
    });
}

// ═══ Recommendations Engine ═════════════════════════════════

export function generateRecommendations(
    periods: FinancialPeriod[], ratios: FinancialRatio[], risk: RiskScore
): Recommendation[] {
    const recs: Recommendation[] = [];
    const latest = periods[periods.length - 1];
    if (!latest) return recs;

    // Critical liquidity
    if (risk.liquidityRunway < 6) {
        recs.push({
            title: `Cash reserves critical — ${risk.liquidityRunway.toFixed(1)} months runway`,
            description: `At current burn rate of ${fmtCurrency(latest.burnRate)}/period, cash reserves will be exhausted by ${risk.cashExhaustionDate || 'estimated date'}. Immediate action required to reduce costs or secure financing.`,
            severity: risk.liquidityRunway < 3 ? 'critical' : 'high',
            category: 'liquidity', actionType: 'immediate',
            impact: `Extend runway by ${(risk.liquidityRunway * 0.5).toFixed(1)} months with 30% cost reduction`
        });
    }

    // Revenue decline
    const revTrend = linearRegression(periods.map(p => p.revenue));
    const avgRev = mean(periods.map(p => p.revenue)) || 1;
    if (revTrend.slope < 0 && Math.abs(revTrend.slope * periods.length / avgRev) > 0.05) {
        recs.push({
            title: 'Revenue trend declining',
            description: `Revenue is decreasing at approximately ${fmtPct(revTrend.slope / avgRev)} per period. Investigate customer churn, market conditions, and competitive positioning.`,
            severity: 'high', category: 'revenue', actionType: 'short-term',
            impact: 'Stabilizing revenue growth could improve risk score by 10-15 points'
        });
    }

    // High leverage
    const dteRatio = ratios.find(r => r.name === 'Debt-to-Equity');
    if (dteRatio && dteRatio.value > 3) {
        recs.push({
            title: 'Excessive financial leverage',
            description: `Debt-to-equity ratio of ${fmtRatio(dteRatio.value)} significantly exceeds benchmark of ${fmtRatio(dteRatio.benchmark)}. Consider debt restructuring or equity injection.`,
            severity: dteRatio.value > 5 ? 'critical' : 'high',
            category: 'debt', actionType: 'short-term',
            impact: 'Reducing leverage to 2.0x would improve Altman Z-score significantly'
        });
    }

    // Low operating margin
    if (latest.operatingMargin < 0.05) {
        recs.push({
            title: latest.operatingMargin < 0 ? 'Operating at a loss' : 'Thin operating margins',
            description: `Operating margin of ${(latest.operatingMargin * 100).toFixed(1)}% is ${latest.operatingMargin < 0 ? 'negative' : 'below healthy threshold of 15%'}. Review cost structure and pricing strategy.`,
            severity: latest.operatingMargin < 0 ? 'critical' : 'medium',
            category: 'cost', actionType: latest.operatingMargin < 0 ? 'immediate' : 'short-term',
            impact: 'Each 5% margin improvement adds significant cash runway'
        });
    }

    // Cost growth exceeding revenue
    const costGrowth = periods.length > 1 ? (latest.totalCosts - periods[0].totalCosts) / (periods[0].totalCosts || 1) : 0;
    const revGrowth = periods.length > 1 ? (latest.revenue - periods[0].revenue) / (periods[0].revenue || 1) : 0;
    if (costGrowth > revGrowth + 0.05) {
        recs.push({
            title: 'Cost growth outpacing revenue',
            description: `Costs grew ${(costGrowth * 100).toFixed(1)}% vs revenue growth of ${(revGrowth * 100).toFixed(1)}%. This divergence will erode margins over time.`,
            severity: 'medium', category: 'operational', actionType: 'strategic',
            impact: 'Aligning cost growth with revenue prevents margin erosion'
        });
    }

    // Altman Z-score warning
    if (risk.altmanZone === 'Distress') {
        recs.push({
            title: `Altman Z-Score in distress zone (${risk.altmanZ.toFixed(2)})`,
            description: 'The Altman Z-Score indicates elevated bankruptcy risk. This composite metric reflects weak working capital, retained earnings, profitability, and asset efficiency ratios.',
            severity: 'critical', category: 'liquidity', actionType: 'immediate',
            impact: 'Improving working capital and profitability ratios can move score above 1.81 (grey zone)'
        });
    } else if (risk.altmanZone === 'Grey') {
        recs.push({
            title: `Altman Z-Score in grey zone (${risk.altmanZ.toFixed(2)})`,
            description: 'Financial health is in an uncertain range. Monitor closely and focus on improving core financial ratios.',
            severity: 'medium', category: 'liquidity', actionType: 'short-term',
            impact: 'Target Z-Score above 3.0 for safe zone classification'
        });
    }

    return recs.sort((a, b) => {
        const s: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return (s[b.severity] || 0) - (s[a.severity] || 0);
    });
}

// ═══ Explainability ═════════════════════════════════════════

export function generateExplanations(
    periods: FinancialPeriod[], risk: RiskScore, ratios: FinancialRatio[]
): string[] {
    const explanations: string[] = [];
    const latest = periods[periods.length - 1];
    if (!latest) return explanations;

    // Main risk explanation
    if (risk.overall >= 50) {
        const topDrivers = risk.components
            .filter(c => c.direction === 'negative')
            .sort((a, b) => b.contribution - a.contribution)
            .slice(0, 3);
        const driverNames = topDrivers.map(d => d.name.toLowerCase()).join(', ');
        explanations.push(
            `Overall risk score is ${risk.overall}/100 (${risk.riskClass}). ` +
            `Primary drivers: ${driverNames}. ` +
            (risk.liquidityRunway < 12
                ? `Cash reserves will likely be exhausted in ${risk.liquidityRunway.toFixed(1)} months at current burn rate.`
                : `Liquidity runway is approximately ${risk.liquidityRunway.toFixed(0)} months.`)
        );
    } else {
        explanations.push(
            `Financial health is ${risk.riskClass.toLowerCase()} with a risk score of ${risk.overall}/100. ` +
            `Altman Z-Score of ${risk.altmanZ.toFixed(2)} places the company in the ${risk.altmanZone.toLowerCase()} zone.`
        );
    }

    // Ratio explanations
    const criticalRatios = ratios.filter(r => r.status === 'critical');
    if (criticalRatios.length) {
        explanations.push(
            `${criticalRatios.length} financial ratio(s) in critical range: ` +
            criticalRatios.map(r => `${r.name} (${fmtRatio(r.value)} vs benchmark ${fmtRatio(r.benchmark)})`).join(', ') + '.'
        );
    }

    // Insolvency probability
    if (risk.insolvencyProbability > 0.1) {
        explanations.push(
            `Estimated probability of insolvency within 6-12 months: ${(risk.insolvencyProbability * 100).toFixed(1)}% ` +
            `(confidence level: ${risk.confidenceLevel}%).`
        );
    }

    return explanations;
}

// ═══ KPI Builder ════════════════════════════════════════════

export function buildKPIs(periods: FinancialPeriod[], risk: RiskScore): FinancialKPI[] {
    if (!periods.length) return [];
    const latest = periods[periods.length - 1];
    const prev = periods.length > 1 ? periods[periods.length - 2] : latest;
    const tPct = (curr: number, prev: number) => prev ? (curr - prev) / Math.abs(prev) : 0;

    const kpis: FinancialKPI[] = [
        {
            label: 'Revenue', value: latest.revenue, formatted: fmtCurrency(latest.revenue),
            trend: latest.revenue > prev.revenue ? 'up' : latest.revenue < prev.revenue ? 'down' : 'stable',
            trendPct: tPct(latest.revenue, prev.revenue),
            status: latest.revenue > prev.revenue ? 'healthy' : 'warning',
            sparkline: periods.map(p => p.revenue), icon: 'revenue'
        },
        {
            label: 'Net Income', value: latest.netIncome, formatted: fmtCurrency(latest.netIncome),
            trend: latest.netIncome > prev.netIncome ? 'up' : latest.netIncome < prev.netIncome ? 'down' : 'stable',
            trendPct: tPct(latest.netIncome, prev.netIncome),
            status: latest.netIncome >= 0 ? 'healthy' : 'critical',
            sparkline: periods.map(p => p.netIncome), icon: 'income'
        },
        {
            label: 'Cash Position', value: latest.cashBalance, formatted: fmtCurrency(latest.cashBalance),
            trend: latest.cashBalance > prev.cashBalance ? 'up' : 'down',
            trendPct: tPct(latest.cashBalance, prev.cashBalance),
            status: latest.cashBalance > 0 ? 'healthy' : 'critical',
            sparkline: periods.map(p => p.cashBalance), icon: 'cash'
        },
        {
            label: 'Operating Margin', value: latest.operatingMargin, formatted: `${(latest.operatingMargin * 100).toFixed(1)}%`,
            trend: latest.operatingMargin > prev.operatingMargin ? 'up' : 'down',
            trendPct: latest.operatingMargin - prev.operatingMargin,
            status: latest.operatingMargin >= 0.15 ? 'healthy' : latest.operatingMargin >= 0.05 ? 'warning' : 'critical',
            sparkline: periods.map(p => p.operatingMargin * 100), icon: 'margin'
        },
        {
            label: 'Risk Score', value: risk.overall, formatted: `${risk.overall}/100`,
            trend: risk.overall > 50 ? 'up' : 'down',
            trendPct: 0, status: risk.overall < 30 ? 'healthy' : risk.overall < 60 ? 'warning' : 'critical',
            sparkline: [], icon: 'risk'
        },
        {
            label: 'Runway', value: risk.liquidityRunway,
            formatted: risk.liquidityRunway >= 100 ? '∞' : `${risk.liquidityRunway.toFixed(1)} mo`,
            trend: 'stable', trendPct: 0,
            status: risk.liquidityRunway > 12 ? 'healthy' : risk.liquidityRunway > 6 ? 'warning' : 'critical',
            sparkline: [], icon: 'runway'
        }
    ];

    return kpis;
}

// ═══ Data Preprocessing — Aggregation & Sampling ════════════

const MAX_PERIODS = 120; // Cap to last N periods for performance

/**
 * For large datasets (multi-company, high-frequency), aggregate rows by period.
 * Numeric columns are summed (revenue, costs) or averaged (margins, ratios)
 * depending on column semantics. Caps to last MAX_PERIODS periods.
 */
function preprocessData(data: FinancialRow[], mapping: Partial<FinancialMapping>): FinancialRow[] {
    if (data.length <= MAX_PERIODS) return data;

    const periodKey = mapping.period || Object.keys(data[0] || {})[0];
    if (!periodKey) return data.slice(-MAX_PERIODS);

    // Group rows by period value
    const grouped = new Map<string, FinancialRow[]>();
    for (const row of data) {
        const key = String(row[periodKey] ?? '');
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(row);
    }

    // Aggregate each group — sum additive fields, average ratio fields
    const numericKeys = Object.keys(data[0] || {}).filter(k => k !== periodKey);
    const aggregated: FinancialRow[] = [];

    for (const [period, rows] of grouped) {
        const agg: FinancialRow = { [periodKey]: period };
        for (const col of numericKeys) {
            const vals = rows.map(r => {
                const v = r[col];
                if (v === null || v === undefined || v === '') return NaN;
                const n = Number(String(v).replace(/[$,€£¥\s]/g, ''));
                return isNaN(n) ? NaN : n;
            }).filter(v => !isNaN(v));

            if (vals.length === 0) {
                agg[col] = rows[0][col]; // Keep original non-numeric value
            } else {
                // Use mean for all numeric fields (covers both sum-then-average and direct average)
                agg[col] = vals.reduce((a, b) => a + b, 0) / vals.length;
            }
        }
        aggregated.push(agg);
    }

    // Sort by period (lexicographic works for YYYY-MM format)
    aggregated.sort((a, b) => String(a[periodKey]).localeCompare(String(b[periodKey])));

    // Cap to last MAX_PERIODS
    return aggregated.length > MAX_PERIODS
        ? aggregated.slice(aggregated.length - MAX_PERIODS)
        : aggregated;
}

// ═══ Main Entry Point ═══════════════════════════════════════

export function runFinancialAnalysis(
    data: FinancialRow[],
    mappingOverrides?: Partial<FinancialMapping>
): FinancialAnalysisResult {
    const autoMapping = autoDetectMapping(data);
    const mapping = { ...autoMapping, ...(mappingOverrides || {}) };

    // Preprocess: aggregate by period and cap for performance
    const processedData = preprocessData(data, mapping);

    const periods = extractFinancialPeriods(processedData, mapping);
    const ratios = computeRatios(periods);
    const forecast = forecastCashflow(periods, 12);
    const riskScore = computeRiskScore(periods, ratios);
    const stressResults = runStressTests(periods, ratios);
    const recommendations = generateRecommendations(periods, ratios, riskScore);
    const kpis = buildKPIs(periods, riskScore);
    const explanations = generateExplanations(periods, riskScore, ratios);

    return { periods, ratios, forecast, riskScore, stressResults, recommendations, kpis, explanations };
}
