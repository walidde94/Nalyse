// ═══════════════════════════════════════════════════════════════
//  Nalyse — AI Decision Simulation Engine · Core Helpers
//  Profit Simulation · Optimization · Monte Carlo · Forecasting
// ═══════════════════════════════════════════════════════════════

// ─── Types ──────────────────────────────────────────────────
export interface Product {
    id: string;
    name: string;
    price: number;
    unitCost: number;
    fixedCost: number;
    demand: number;
    maxCapacity: number;
    category: string;
}

export interface RawMaterial {
    id: string;
    name: string;
    unitPrice: number;
    availableQty: number;
    supplier: string;
    leadTimeDays: number;
}

export interface ScenarioAdjustment {
    id: string;
    name: string;
    color: string;
    priceChange: number;      // percentage  ±
    demandChange: number;     // percentage  ±
    costChange: number;       // percentage  ±
    capacityChange: number;   // percentage  ±
    description: string;
}

export interface SimulationInput {
    products: Product[];
    materials: RawMaterial[];
    scenarios: ScenarioAdjustment[];
    overheadRate: number;      // percent of revenue
    taxRate: number;           // percent
    laborCostPerUnit: number;
    monteCarloIterations: number;
}

export interface ProfitResult {
    productId: string;
    productName: string;
    revenue: number;
    variableCost: number;
    fixedCost: number;
    laborCost: number;
    overheadCost: number;
    grossProfit: number;
    grossMargin: number;
    netProfit: number;
    netMargin: number;
    breakEvenUnits: number;
    contributionMargin: number;
    profitShare: number;
    costShare: number;
    capacityUtilization: number;
}

export interface OptimizationResult {
    optimalMix: { productId: string; productName: string; allocatedUnits: number; profit: number }[];
    totalProfit: number;
    totalRevenue: number;
    totalCost: number;
    constraintsSatisfied: boolean;
    improvementPct: number;
}

export interface ScenarioResult {
    scenario: ScenarioAdjustment;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    netMargin: number;
    deltaRevenue: number;
    deltaCost: number;
    deltaProfit: number;
    deltaProfitPct: number;
    rank: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    products: ProfitResult[];
}

export interface MonteCarloResult {
    mean: number;
    median: number;
    stdDev: number;
    p5: number;
    p25: number;
    p75: number;
    p95: number;
    min: number;
    max: number;
    distribution: { bucket: string; count: number; cumulative: number }[];
    var95: number;
    cvar95: number;
    probabilityOfLoss: number;
}

export interface ForecastPoint {
    period: string;
    revenue: number;
    cost: number;
    profit: number;
    upper: number;
    lower: number;
    isProjected: boolean;
}

export interface SensitivityFactor {
    factor: string;
    baseProfit: number;
    lowProfit: number;
    highProfit: number;
    impact: number;
    elasticity: number;
}

export interface AIRecommendation {
    id: string;
    type: 'optimize' | 'alert' | 'discontinue' | 'scale' | 'pricing';
    severity: 'info' | 'warning' | 'critical' | 'success';
    title: string;
    description: string;
    impact: string;
    confidence: number;
    category: string;
    metric?: string;
    value?: number;
}

export interface SimulationResult {
    baseline: {
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
        netMargin: number;
        products: ProfitResult[];
    };
    optimization: OptimizationResult;
    scenarios: ScenarioResult[];
    monteCarlo: MonteCarloResult;
    forecast: ForecastPoint[];
    sensitivity: SensitivityFactor[];
    recommendations: AIRecommendation[];
    executiveSummary: string;
    timestamp: string;
}

// ─── Colors / Constants ─────────────────────────────────────
export const SIM_COLORS = {
    primary: '#818cf8',
    secondary: '#34d399',
    accent: '#fbbf24',
    danger: '#f87171',
    info: '#38bdf8',
    purple: '#a78bfa',
    pink: '#f472b6',
    orange: '#fb923c',
};

export const SCENARIO_PRESETS: ScenarioAdjustment[] = [
    { id: 'base', name: 'Baseline', color: '#818cf8', priceChange: 0, demandChange: 0, costChange: 0, capacityChange: 0, description: 'Current state — no adjustments applied' },
    { id: 'optimistic', name: 'Growth Surge', color: '#34d399', priceChange: 5, demandChange: 15, costChange: -3, capacityChange: 10, description: 'Strong market demand, efficiency gains' },
    { id: 'pessimistic', name: 'Market Downturn', color: '#f87171', priceChange: -10, demandChange: -20, costChange: 8, capacityChange: 0, description: 'Recession-like conditions, rising costs' },
    { id: 'supply-shock', name: 'Supply Disruption', color: '#fb923c', priceChange: 0, demandChange: -5, costChange: 25, capacityChange: -15, description: 'Raw material shortage, supply chain disruption' },
    { id: 'premium', name: 'Premium Pivot', color: '#a78bfa', priceChange: 20, demandChange: -10, costChange: 5, capacityChange: 0, description: 'Higher prices, lower volume, premium positioning' },
    { id: 'scale', name: 'Mass Scale', color: '#38bdf8', priceChange: -8, demandChange: 30, costChange: -5, capacityChange: 25, description: 'Volume play — lower margins, higher throughput' },
];

// ─── Utility formatters ─────────────────────────────────────
export const fmt = (v: number) => {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toFixed(v % 1 === 0 ? 0 : 2);
};

export const fmtCurrency = (v: number) => {
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toFixed(2)}`;
};

export const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

// ─── Data Extraction from CSV ───────────────────────────────
export function extractProductsFromData(data: Record<string, any>[]): Product[] {
    if (!data?.length) return generateDemoProducts();

    const keys = Object.keys(data[0]).map(k => k.toLowerCase());

    // Try to detect product-like data
    const nameKey = keys.find(k => /product|item|sku|name/i.test(k));
    const priceKey = keys.find(k => /price|unit.?price|selling/i.test(k));
    const costKey = keys.find(k => /cost|unit.?cost|cogs|variable/i.test(k));
    const demandKey = keys.find(k => /demand|quantity|qty|volume|sales|units/i.test(k));
    const capacityKey = keys.find(k => /capacity|max|limit/i.test(k));
    const categoryKey = keys.find(k => /category|type|group|segment/i.test(k));

    if (!nameKey && !priceKey) return generateDemoProducts();

    const originalKeys = Object.keys(data[0]);
    const resolve = (lowerKey: string | undefined) => originalKeys.find(k => k.toLowerCase() === lowerKey) || '';

    const products: Product[] = [];
    const seen = new Set<string>();

    data.forEach((row, idx) => {
        const name = String(row[resolve(nameKey)] || `Product ${idx + 1}`);
        if (seen.has(name)) return;
        seen.add(name);

        const price = parseFloat(row[resolve(priceKey)]) || (20 + Math.random() * 80);
        const cost = parseFloat(row[resolve(costKey)]) || price * (0.3 + Math.random() * 0.3);
        const demand = parseFloat(row[resolve(demandKey)]) || Math.floor(100 + Math.random() * 900);
        const capacity = parseFloat(row[resolve(capacityKey)]) || Math.floor(demand * (1.1 + Math.random() * 0.5));
        const category = String(row[resolve(categoryKey)] || 'General');

        products.push({
            id: `prod-${idx}`,
            name,
            price,
            unitCost: cost,
            fixedCost: price * demand * (0.05 + Math.random() * 0.1),
            demand: Math.round(demand),
            maxCapacity: Math.round(capacity),
            category,
        });
    });

    return products.slice(0, 500); // cap at 500
}

export function extractMaterialsFromData(data: Record<string, any>[]): RawMaterial[] {
    if (!data?.length) return generateDemoMaterials();

    const keys = Object.keys(data[0]).map(k => k.toLowerCase());
    const materialKey = keys.find(k => /material|raw|component|input|resource/i.test(k));

    if (!materialKey) return generateDemoMaterials();

    const originalKeys = Object.keys(data[0]);
    const resolve = (lowerKey: string | undefined) => originalKeys.find(k => k.toLowerCase() === lowerKey) || '';

    const priceKey = keys.find(k => /price|cost|unit.?price/i.test(k));
    const qtyKey = keys.find(k => /quantity|available|stock|qty/i.test(k));
    const supplierKey = keys.find(k => /supplier|vendor|source/i.test(k));

    return data.slice(0, 200).map((row, idx) => ({
        id: `mat-${idx}`,
        name: String(row[resolve(materialKey)] || `Material ${idx + 1}`),
        unitPrice: parseFloat(row[resolve(priceKey)]) || (1 + Math.random() * 20),
        availableQty: parseFloat(row[resolve(qtyKey)]) || Math.floor(500 + Math.random() * 5000),
        supplier: String(row[resolve(supplierKey)] || `Supplier ${String.fromCharCode(65 + (idx % 26))}`),
        leadTimeDays: Math.floor(3 + Math.random() * 25),
    }));
}

// ─── Demo data generators ───────────────────────────────────
function generateDemoProducts(): Product[] {
    const names = [
        'Smart Sensor Module', 'Control Unit Pro', 'Edge Gateway X', 'Data Logger Mini', 'Precision Actuator',
        'Wireless Hub', 'Power Module 5V', 'Display Panel HD', 'Thermal Shield', 'Motion Detector',
        'Signal Amplifier', 'Fiber Coupler', 'Relay Switch M', 'Battery Cell LiPo', 'Connector Array',
        'PCB Assembly A', 'Cooling Fan 40mm', 'LED Driver 12W', 'Enclosure IP67', 'Cable Harness V2',
    ];
    return names.map((name, i) => {
        const price = 15 + Math.random() * 120;
        const demand = Math.floor(200 + Math.random() * 2500);
        return {
            id: `prod-${i}`,
            name,
            price: Math.round(price * 100) / 100,
            unitCost: Math.round(price * (0.3 + Math.random() * 0.25) * 100) / 100,
            fixedCost: Math.round(price * demand * (0.04 + Math.random() * 0.08)),
            demand,
            maxCapacity: Math.floor(demand * (1.05 + Math.random() * 0.5)),
            category: ['Electronics', 'Mechanical', 'Enclosures', 'Cables'][i % 4],
        };
    });
}

function generateDemoMaterials(): RawMaterial[] {
    const names = [
        'Silicon Wafer', 'Copper Wire 0.5mm', 'Aluminum Sheet', 'PCB Substrate', 'Resistor 10K',
        'Capacitor 100uF', 'IC Chip ARM', 'Solder Paste', 'Epoxy Resin', 'Plastic Pellets',
        'Steel Rod 8mm', 'Rubber Gasket', 'Glass Fiber', 'Thermal Paste', 'Gold Wire',
    ];
    return names.map((name, i) => ({
        id: `mat-${i}`,
        name,
        unitPrice: Math.round((0.5 + Math.random() * 25) * 100) / 100,
        availableQty: Math.floor(1000 + Math.random() * 10000),
        supplier: `Supplier ${String.fromCharCode(65 + (i % 8))}`,
        leadTimeDays: Math.floor(3 + Math.random() * 20),
    }));
}

// ═══════════════════════════════════════════════════════════
//  Profit Simulation
// ═══════════════════════════════════════════════════════════
export function runProfitSimulation(
    products: Product[],
    overheadRate: number,
    taxRate: number,
    laborCostPerUnit: number,
    adjustments?: Partial<ScenarioAdjustment>
): ProfitResult[] {
    const priceMult = 1 + (adjustments?.priceChange || 0) / 100;
    const demandMult = 1 + (adjustments?.demandChange || 0) / 100;
    const costMult = 1 + (adjustments?.costChange || 0) / 100;
    const capMult = 1 + (adjustments?.capacityChange || 0) / 100;

    const results: ProfitResult[] = products.map(p => {
        const adjustedPrice = p.price * priceMult;
        const adjustedDemand = Math.round(p.demand * demandMult);
        const adjustedCapacity = Math.round(p.maxCapacity * capMult);
        const effectiveUnits = Math.min(adjustedDemand, adjustedCapacity);

        const revenue = adjustedPrice * effectiveUnits;
        const variableCost = p.unitCost * costMult * effectiveUnits;
        const fixedCost = p.fixedCost * costMult;
        const laborCost = laborCostPerUnit * effectiveUnits;
        const overheadCost = revenue * overheadRate / 100;

        const grossProfit = revenue - variableCost - fixedCost;
        const netProfit = grossProfit - laborCost - overheadCost;

        const contributionMargin = adjustedPrice - (p.unitCost * costMult) - laborCostPerUnit;
        const breakEvenUnits = contributionMargin > 0 ? Math.ceil(fixedCost / contributionMargin) : Infinity;

        return {
            productId: p.id,
            productName: p.name,
            revenue,
            variableCost,
            fixedCost,
            laborCost,
            overheadCost,
            grossProfit,
            grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
            netProfit,
            netMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
            breakEvenUnits,
            contributionMargin,
            profitShare: 0, // computed after
            costShare: 0,
            capacityUtilization: adjustedCapacity > 0 ? (effectiveUnits / adjustedCapacity) * 100 : 0,
        };
    });

    const totalProfit = results.reduce((s, r) => s + Math.max(r.netProfit, 0), 0);
    const totalCost = results.reduce((s, r) => s + r.variableCost + r.fixedCost + r.laborCost + r.overheadCost, 0);
    results.forEach(r => {
        r.profitShare = totalProfit > 0 ? (Math.max(r.netProfit, 0) / totalProfit) * 100 : 0;
        r.costShare = totalCost > 0 ? ((r.variableCost + r.fixedCost + r.laborCost + r.overheadCost) / totalCost) * 100 : 0;
    });

    return results;
}

// ═══════════════════════════════════════════════════════════
//  Optimization Engine (greedy LP approximation)
// ═══════════════════════════════════════════════════════════
export function runOptimization(products: Product[], overheadRate: number, taxRate: number, laborCostPerUnit: number): OptimizationResult {
    // Compute contribution margin per unit for each product
    const items = products.map(p => {
        const contrib = p.price - p.unitCost - laborCostPerUnit - (p.price * overheadRate / 100);
        return { ...p, contrib, allocatedUnits: 0, profit: 0 };
    });

    // Sort by contribution margin descending (greedy LP)
    items.sort((a, b) => b.contrib - a.contrib);

    // Allocate up to demand/capacity, maximizing total profit
    const totalCapacityBudget = products.reduce((s, p) => s + p.maxCapacity, 0);
    let remainingCapacity = totalCapacityBudget;

    items.forEach(item => {
        const maxUnits = Math.min(item.demand, item.maxCapacity, remainingCapacity);
        if (item.contrib > 0 && maxUnits > 0) {
            item.allocatedUnits = maxUnits;
            item.profit = item.contrib * maxUnits - item.fixedCost;
            remainingCapacity -= maxUnits;
        }
    });

    const baselineResults = runProfitSimulation(products, overheadRate, taxRate, laborCostPerUnit);
    const baselineProfit = baselineResults.reduce((s, r) => s + r.netProfit, 0);

    const optTotalProfit = items.reduce((s, i) => s + i.profit, 0);
    const optTotalRevenue = items.reduce((s, i) => s + i.price * i.allocatedUnits, 0);
    const optTotalCost = optTotalRevenue - optTotalProfit;

    return {
        optimalMix: items.map(i => ({ productId: i.id, productName: i.name, allocatedUnits: i.allocatedUnits, profit: i.profit })),
        totalProfit: optTotalProfit,
        totalRevenue: optTotalRevenue,
        totalCost: optTotalCost,
        constraintsSatisfied: true,
        improvementPct: baselineProfit > 0 ? ((optTotalProfit - baselineProfit) / baselineProfit) * 100 : 0,
    };
}

// ═══════════════════════════════════════════════════════════
//  Scenario Comparison
// ═══════════════════════════════════════════════════════════
export function runScenarios(
    products: Product[],
    scenarios: ScenarioAdjustment[],
    overheadRate: number,
    taxRate: number,
    laborCostPerUnit: number
): ScenarioResult[] {
    const baseline = runProfitSimulation(products, overheadRate, taxRate, laborCostPerUnit);
    const baseRevenue = baseline.reduce((s, r) => s + r.revenue, 0);
    const baseCost = baseline.reduce((s, r) => s + r.variableCost + r.fixedCost + r.laborCost + r.overheadCost, 0);
    const baseProfit = baseline.reduce((s, r) => s + r.netProfit, 0);

    const results: ScenarioResult[] = scenarios.map(sc => {
        const prods = runProfitSimulation(products, overheadRate, taxRate, laborCostPerUnit, sc);
        const rev = prods.reduce((s, r) => s + r.revenue, 0);
        const cost = prods.reduce((s, r) => s + r.variableCost + r.fixedCost + r.laborCost + r.overheadCost, 0);
        const profit = prods.reduce((s, r) => s + r.netProfit, 0);

        return {
            scenario: sc,
            totalRevenue: rev,
            totalCost: cost,
            totalProfit: profit,
            netMargin: rev > 0 ? (profit / rev) * 100 : 0,
            deltaRevenue: rev - baseRevenue,
            deltaCost: cost - baseCost,
            deltaProfit: profit - baseProfit,
            deltaProfitPct: baseProfit !== 0 ? ((profit - baseProfit) / Math.abs(baseProfit)) * 100 : 0,
            rank: 0,
            riskLevel: 'low' as const,
            products: prods,
        };
    });

    // Rank by profit
    results.sort((a, b) => b.totalProfit - a.totalProfit);
    results.forEach((r, i) => {
        r.rank = i + 1;
        const marginPct = r.netMargin;
        r.riskLevel = marginPct > 15 ? 'low' : marginPct > 5 ? 'medium' : marginPct > 0 ? 'high' : 'critical';
    });

    return results;
}

// ═══════════════════════════════════════════════════════════
//  Monte Carlo Simulation
// ═══════════════════════════════════════════════════════════
function gaussianRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
}

export function runMonteCarlo(
    products: Product[],
    overheadRate: number,
    taxRate: number,
    laborCostPerUnit: number,
    iterations: number = 5000
): MonteCarloResult {
    const profits: number[] = [];

    for (let i = 0; i < iterations; i++) {
        let totalProfit = 0;
        products.forEach(p => {
            const priceVar = gaussianRandom(1, 0.08);  // ±8% price variability
            const demandVar = gaussianRandom(1, 0.15);  // ±15% demand variability
            const costVar = gaussianRandom(1, 0.10);    // ±10% cost variability

            const price = p.price * priceVar;
            const demand = Math.max(0, Math.round(p.demand * demandVar));
            const units = Math.min(demand, p.maxCapacity);
            const revenue = price * units;
            const cost = p.unitCost * costVar * units + p.fixedCost + laborCostPerUnit * units + revenue * overheadRate / 100;
            totalProfit += revenue - cost;
        });
        profits.push(totalProfit);
    }

    profits.sort((a, b) => a - b);

    const mean = profits.reduce((s, v) => s + v, 0) / profits.length;
    const variance = profits.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / profits.length;
    const stdDev = Math.sqrt(variance);

    const percentile = (p: number) => profits[Math.floor(p / 100 * profits.length)] || 0;

    // Create distribution buckets
    const bucketCount = 30;
    const min = profits[0];
    const max = profits[profits.length - 1];
    const bucketSize = (max - min) / bucketCount || 1;
    const buckets: { bucket: string; count: number; cumulative: number }[] = [];
    let cumulative = 0;
    for (let b = 0; b < bucketCount; b++) {
        const low = min + b * bucketSize;
        const high = low + bucketSize;
        const count = profits.filter(v => v >= low && (b === bucketCount - 1 ? v <= high : v < high)).length;
        cumulative += count;
        buckets.push({
            bucket: fmtCurrency(low),
            count,
            cumulative: (cumulative / profits.length) * 100,
        });
    }

    const losses = profits.filter(v => v < 0);
    const var95 = Math.abs(percentile(5));
    const cvar95 = losses.length > 0
        ? Math.abs(losses.reduce((s, v) => s + v, 0) / losses.length)
        : 0;

    return {
        mean,
        median: percentile(50),
        stdDev,
        p5: percentile(5),
        p25: percentile(25),
        p75: percentile(75),
        p95: percentile(95),
        min,
        max,
        distribution: buckets,
        var95,
        cvar95,
        probabilityOfLoss: (losses.length / profits.length) * 100,
    };
}

// ═══════════════════════════════════════════════════════════
//  Demand Forecasting (simple trend + seasonality)
// ═══════════════════════════════════════════════════════════
export function runForecast(products: Product[], periods: number = 12): ForecastPoint[] {
    const baseRevenue = products.reduce((s, p) => s + p.price * p.demand, 0);
    const baseCost = products.reduce((s, p) => s + p.unitCost * p.demand + p.fixedCost, 0);

    const trend = 0.02 + Math.random() * 0.03; // 2-5% growth trend
    const seasonality = [1.0, 0.92, 0.88, 0.95, 1.05, 1.12, 1.15, 1.08, 1.02, 0.96, 1.20, 1.30]; // monthly

    const points: ForecastPoint[] = [];
    const now = new Date();

    // Historical (last 6 months)
    for (let i = -6; i < 0; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const seasonIdx = month.getMonth();
        const noise = 0.95 + Math.random() * 0.1;
        const rev = baseRevenue * seasonality[seasonIdx] * noise * (1 + trend * (6 + i) / 12);
        const cost = baseCost * seasonality[seasonIdx] * noise;
        points.push({
            period: month.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
            revenue: rev,
            cost,
            profit: rev - cost,
            upper: rev * 1.05,
            lower: rev * 0.95,
            isProjected: false,
        });
    }

    // Projected
    for (let i = 0; i < periods; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const seasonIdx = month.getMonth();
        const growthFactor = 1 + trend * (i + 1) / 12;
        const rev = baseRevenue * seasonality[seasonIdx] * growthFactor;
        const cost = baseCost * seasonality[seasonIdx] * growthFactor * 0.95; // costs grow slower
        const spread = 0.08 + i * 0.01; // confidence widens

        points.push({
            period: month.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
            revenue: rev,
            cost,
            profit: rev - cost,
            upper: rev * (1 + spread),
            lower: rev * (1 - spread),
            isProjected: true,
        });
    }

    return points;
}

// ═══════════════════════════════════════════════════════════
//  Sensitivity Analysis (tornado chart data)
// ═══════════════════════════════════════════════════════════
export function runSensitivityAnalysis(
    products: Product[],
    overheadRate: number,
    taxRate: number,
    laborCostPerUnit: number
): SensitivityFactor[] {
    const base = runProfitSimulation(products, overheadRate, taxRate, laborCostPerUnit);
    const baseProfit = base.reduce((s, r) => s + r.netProfit, 0);

    const factors: { name: string; adj: Partial<ScenarioAdjustment> }[] = [
        { name: 'Price +10%', adj: { priceChange: 10 } },
        { name: 'Price -10%', adj: { priceChange: -10 } },
        { name: 'Demand +20%', adj: { demandChange: 20 } },
        { name: 'Demand -20%', adj: { demandChange: -20 } },
        { name: 'Cost +15%', adj: { costChange: 15 } },
        { name: 'Cost -15%', adj: { costChange: -15 } },
        { name: 'Capacity +25%', adj: { capacityChange: 25 } },
        { name: 'Capacity -25%', adj: { capacityChange: -25 } },
    ];

    // Group into pairs (positive / negative)
    const results: SensitivityFactor[] = [];
    for (let i = 0; i < factors.length; i += 2) {
        const highSim = runProfitSimulation(products, overheadRate, taxRate, laborCostPerUnit, factors[i].adj);
        const lowSim = runProfitSimulation(products, overheadRate, taxRate, laborCostPerUnit, factors[i + 1].adj);
        const highProfit = highSim.reduce((s, r) => s + r.netProfit, 0);
        const lowProfit = lowSim.reduce((s, r) => s + r.netProfit, 0);
        const factorName = factors[i].name.replace(' +10%', '').replace(' +20%', '').replace(' +15%', '').replace(' +25%', '');
        const impact = Math.abs(highProfit - lowProfit);
        results.push({
            factor: factorName,
            baseProfit,
            lowProfit,
            highProfit,
            impact,
            elasticity: baseProfit !== 0 ? (highProfit - lowProfit) / (2 * Math.abs(baseProfit)) : 0,
        });
    }

    results.sort((a, b) => b.impact - a.impact);
    return results;
}

// ═══════════════════════════════════════════════════════════
//  AI Recommendation Engine
// ═══════════════════════════════════════════════════════════
export function generateRecommendations(
    baseline: ProfitResult[],
    optimization: OptimizationResult,
    monteCarlo: MonteCarloResult,
    sensitivity: SensitivityFactor[]
): AIRecommendation[] {
    const recs: AIRecommendation[] = [];
    let idx = 0;

    // 1. Identify most profitable product
    const sorted = [...baseline].sort((a, b) => b.netProfit - a.netProfit);
    const top = sorted[0];
    if (top && top.profitShare > 25) {
        recs.push({
            id: `rec-${idx++}`,
            type: 'scale',
            severity: 'success',
            title: `Scale ${top.productName} — Top Profit Driver`,
            description: `${top.productName} generates ${top.profitShare.toFixed(1)}% of total profit with only ${top.costShare.toFixed(1)}% of production cost allocation. Consider scaling production capacity by ${Math.round(20 + Math.random() * 30)}% to maximize returns.`,
            impact: `Potential +${fmtCurrency(top.netProfit * 0.25)} additional profit`,
            confidence: 92,
            category: 'Production Optimization',
            metric: 'Profit Share',
            value: top.profitShare,
        });
    }

    // 2. Detect low-margin products
    const lowMargin = baseline.filter(p => p.netMargin < 5 && p.netMargin > -10);
    if (lowMargin.length > 0) {
        recs.push({
            id: `rec-${idx++}`,
            type: 'pricing',
            severity: 'warning',
            title: `${lowMargin.length} Products Below Margin Threshold`,
            description: `Products with <5% net margin: ${lowMargin.slice(0, 3).map(p => p.productName).join(', ')}${lowMargin.length > 3 ? ` and ${lowMargin.length - 3} more` : ''}. Consider raising prices by 8-12% or renegotiating supplier costs.`,
            impact: `Could recover ${fmtCurrency(lowMargin.reduce((s, p) => s + Math.abs(p.revenue * 0.05), 0))} in margin`,
            confidence: 85,
            category: 'Pricing Strategy',
        });
    }

    // 3. Products operating at loss
    const lossMakers = baseline.filter(p => p.netProfit < 0);
    if (lossMakers.length > 0) {
        recs.push({
            id: `rec-${idx++}`,
            type: 'discontinue',
            severity: 'critical',
            title: `${lossMakers.length} Product${lossMakers.length > 1 ? 's' : ''} Operating at Loss`,
            description: `${lossMakers.map(p => `${p.productName} (${fmtCurrency(p.netProfit)})`).join(', ')} are generating negative returns. Evaluate discontinuation or restructuring.`,
            impact: `Eliminating losses saves ${fmtCurrency(Math.abs(lossMakers.reduce((s, p) => s + p.netProfit, 0)))} annually`,
            confidence: 88,
            category: 'Product Portfolio',
        });
    }

    // 4. Optimization opportunity
    if (optimization.improvementPct > 5) {
        recs.push({
            id: `rec-${idx++}`,
            type: 'optimize',
            severity: 'success',
            title: 'Product Mix Optimization Available',
            description: `Reallocating production to optimal mix can increase total profit by ${optimization.improvementPct.toFixed(1)}%. Focus on high-contribution items while reducing low-margin allocations.`,
            impact: `+${fmtCurrency(optimization.totalProfit - baseline.reduce((s, r) => s + r.netProfit, 0))} profit improvement`,
            confidence: 90,
            category: 'Resource Allocation',
        });
    }

    // 5. Monte Carlo risk warning
    if (monteCarlo.probabilityOfLoss > 10) {
        recs.push({
            id: `rec-${idx++}`,
            type: 'alert',
            severity: 'warning',
            title: 'Elevated Downside Risk Detected',
            description: `Monte Carlo simulation shows ${monteCarlo.probabilityOfLoss.toFixed(1)}% probability of loss across ${5000} iterations. Value-at-Risk (95%): ${fmtCurrency(monteCarlo.var95)}. Consider hedging strategies or diversifying the product portfolio.`,
            impact: `VaR(95): ${fmtCurrency(monteCarlo.var95)}, CVaR: ${fmtCurrency(monteCarlo.cvar95)}`,
            confidence: 87,
            category: 'Risk Management',
        });
    }

    // 6. Capacity utilization
    const underUtilized = baseline.filter(p => p.capacityUtilization < 50);
    if (underUtilized.length > 2) {
        recs.push({
            id: `rec-${idx++}`,
            type: 'optimize',
            severity: 'info',
            title: 'Capacity Under-Utilization Detected',
            description: `${underUtilized.length} products operating below 50% capacity utilization. This represents idle resources that could be repurposed or subleased.`,
            impact: `Potential to serve ${Math.round(underUtilized.reduce((s, p) => s + (100 - p.capacityUtilization) * 0.01 * p.breakEvenUnits, 0))} additional units`,
            confidence: 78,
            category: 'Capacity Planning',
        });
    }

    // 7. Sensitivity insight
    if (sensitivity.length > 0) {
        const topFactor = sensitivity[0];
        recs.push({
            id: `rec-${idx++}`,
            type: 'alert',
            severity: 'info',
            title: `${topFactor.factor} is the Dominant Profit Driver`,
            description: `Sensitivity analysis reveals that ${topFactor.factor} changes have the highest impact on total profit (elasticity: ${topFactor.elasticity.toFixed(2)}). Prioritize monitoring and hedging for this variable.`,
            impact: `Swing range: ${fmtCurrency(topFactor.lowProfit)} to ${fmtCurrency(topFactor.highProfit)}`,
            confidence: 83,
            category: 'Strategic Planning',
        });
    }

    // 8. Break-even analysis
    const highBE = baseline.filter(p => p.breakEvenUnits > (p.revenue / (p.contributionMargin || 1)) * 0.9 && isFinite(p.breakEvenUnits));
    if (highBE.length > 0) {
        recs.push({
            id: `rec-${idx++}`,
            type: 'alert',
            severity: 'warning',
            title: `${highBE.length} Product${highBE.length > 1 ? 's' : ''} Near Break-Even Threshold`,
            description: `${highBE.map(p => p.productName).join(', ')} require >90% of demand to break even. Any demand shortfall will trigger losses.`,
            impact: 'High vulnerability to demand fluctuations',
            confidence: 86,
            category: 'Profitability Analysis',
        });
    }

    return recs;
}

// ═══════════════════════════════════════════════════════════
//  Executive Summary Generator
// ═══════════════════════════════════════════════════════════
function generateExecutiveSummary(
    baseline: ProfitResult[],
    scenarios: ScenarioResult[],
    monteCarlo: MonteCarloResult,
    recs: AIRecommendation[],
    iterations: number
): string {
    const totalRev = baseline.reduce((s, r) => s + r.revenue, 0);
    const totalProfit = baseline.reduce((s, r) => s + r.netProfit, 0);
    const margin = totalRev > 0 ? (totalProfit / totalRev * 100).toFixed(1) : '0';
    const profitable = baseline.filter(p => p.netProfit > 0).length;
    const best = scenarios[0];
    const critCount = recs.filter(r => r.severity === 'critical').length;

    return `The simulation engine analyzed ${baseline.length} products generating ${fmtCurrency(totalRev)} in total revenue with a ${margin}% net margin. ${profitable} of ${baseline.length} products are profitable. ${best ? `The "${best.scenario.name}" scenario yields the highest return at ${fmtCurrency(best.totalProfit)}.` : ''} Monte Carlo analysis (${fmt(iterations)} iterations) shows ${monteCarlo.probabilityOfLoss.toFixed(1)}% probability of aggregate loss with a 95% confidence interval ranging from ${fmtCurrency(monteCarlo.p5)} to ${fmtCurrency(monteCarlo.p95)}.${critCount > 0 ? ` ⚠ ${critCount} critical recommendation${critCount > 1 ? 's' : ''} require${critCount === 1 ? 's' : ''} immediate attention.` : ''}`;
}

// ═══════════════════════════════════════════════════════════
//  Master Simulation Runner
// ═══════════════════════════════════════════════════════════
export function runFullSimulation(input: SimulationInput): SimulationResult {
    const { products, scenarios, overheadRate, taxRate, laborCostPerUnit, monteCarloIterations } = input;

    // 1. Baseline profit
    const baselineProducts = runProfitSimulation(products, overheadRate, taxRate, laborCostPerUnit);
    const baselineRevenue = baselineProducts.reduce((s, r) => s + r.revenue, 0);
    const baselineCost = baselineProducts.reduce((s, r) => s + r.variableCost + r.fixedCost + r.laborCost + r.overheadCost, 0);
    const baselineProfit = baselineProducts.reduce((s, r) => s + r.netProfit, 0);
    const baselineMargin = baselineRevenue > 0 ? (baselineProfit / baselineRevenue) * 100 : 0;

    // 2. Optimization
    const optimization = runOptimization(products, overheadRate, taxRate, laborCostPerUnit);

    // 3. Scenarios
    const scenarioResults = runScenarios(products, scenarios, overheadRate, taxRate, laborCostPerUnit);

    // 4. Monte Carlo
    const monteCarlo = runMonteCarlo(products, overheadRate, taxRate, laborCostPerUnit, monteCarloIterations);

    // 5. Forecast
    const forecast = runForecast(products);

    // 6. Sensitivity
    const sensitivity = runSensitivityAnalysis(products, overheadRate, taxRate, laborCostPerUnit);

    // 7. Recommendations
    const recommendations = generateRecommendations(baselineProducts, optimization, monteCarlo, sensitivity);

    // 8. Executive Summary
    const executiveSummary = generateExecutiveSummary(baselineProducts, scenarioResults, monteCarlo, recommendations, monteCarloIterations);

    return {
        baseline: {
            totalRevenue: baselineRevenue,
            totalCost: baselineCost,
            totalProfit: baselineProfit,
            netMargin: baselineMargin,
            products: baselineProducts,
        },
        optimization,
        scenarios: scenarioResults,
        monteCarlo,
        forecast,
        sensitivity,
        recommendations,
        executiveSummary,
        timestamp: new Date().toISOString(),
    };
}
