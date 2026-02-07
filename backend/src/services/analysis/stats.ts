import { AnalysisOption, Insight, AdvancedColumnType } from './types';

// Helper: safe float parsing
const parseNum = (val: any) => parseFloat(String(val).replace(/[$€£,% ]/g, '')) || 0;

export const generateInventoryInsights = (records: any[], columns: string[], colTypes: Record<string, AdvancedColumnType>): { insights: Insight[], options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    const stockCol = columns.find(c => /stock|qty|inventory|v_bestand|menge/i.test(c));
    const nameCol = columns.find(c => /name|item|product|title|sku|bezeichnung/i.test(c)) || columns[0];

    if (stockCol) {
        insights.push({
            id: 'inv-context',
            type: 'pattern',
            description: '**Structural Asset Detection**: System identified inventory-related patterns in secondary heuristics.',
            confidence: 0.98,
            isVerified: true
        });

        const lowStock = records.filter(r => parseNum(r[stockCol]) < 10);
        if (lowStock.length > 0) {
            insights.push({
                id: 'low-stock',
                type: 'anomaly',
                description: `**Critical Depletion Alert**: Found ${lowStock.length} functional units with critically low availability levels (<10 units).`,
                confidence: 1.0,
                isVerified: true
            });
            options.push({
                id: 'low-stock-chart',
                title: 'Operational Availability Alert: Low Inventory',
                description: 'Assets requiring immediate replenishment based on predefined safety thresholds.',
                chartType: 'bar',
                data: lowStock.slice(0, 15).map(r => ({ name: r[nameCol], value: parseNum(r[stockCol]) }))
            });
        }
    }
    return { insights, options };
};

export const generateCategoryInsights = (records: any[], categories: string[], numbers: string[]): { insights: Insight[], options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    if (categories.length > 0 && numbers.length > 0) {
        categories.slice(0, 3).forEach(cat => {
            numbers.slice(0, 2).forEach(num => {
                const agg: Record<string, number> = {};
                records.forEach(r => {
                    const key = r[cat] || 'N/A';
                    agg[key] = (agg[key] || 0) + parseNum(r[num]);
                });

                const sortedData = Object.entries(agg)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value);

                const data = sortedData.slice(0, 10);

                if (data.length > 1) {
                    options.push({
                        id: `cat-segment-${cat}-${num}`,
                        title: `Strategic Breakdown: ${num} by ${cat}`,
                        description: `Relative contribution analysis of ${cat} segments to total ${num} performance.`,
                        chartType: data.length <= 5 ? 'pie' : 'bar',
                        data
                    });

                    // Pareto Analysis (80/20 Rule)
                    const total = sortedData.reduce((acc, curr) => acc + curr.value, 0);
                    let runningSum = 0;
                    let countFor80 = 0;
                    for (let item of sortedData) {
                        runningSum += item.value;
                        countFor80++;
                        if (runningSum >= total * 0.8) break;
                    }

                    const pct80 = Math.round((countFor80 / sortedData.length) * 100);
                    if (pct80 <= 30) {
                        insights.push({
                            id: `pareto-${cat}-${num}`,
                            type: 'pattern',
                            description: `**Pareto Core Detected**: Just **${pct80}%** of ${cat} segments generate **80%** of the total ${num}. High concentration risk observed.`,
                            confidence: 0.92,
                            isVerified: true
                        });
                    }

                    const top = data[0];
                    insights.push({
                        id: `segment-win-${cat}-${num}`,
                        type: 'trend',
                        description: `**Performance Driver**: **${top.name}** constitutes the primary segment, accounting for **${Math.round((top.value / total) * 100)}%** of detected ${num}.`,
                        confidence: 0.9,
                        isVerified: false
                    });
                }
            });
        });
    }

    // High-Fidelity Volume & Frequency Analysis (Always valuable for Data Centers)
    categories.slice(0, 2).forEach(cat => {
        const counts: Record<string, number> = {};
        records.forEach(r => {
            const key = r[cat] || 'N/A';
            counts[key] = (counts[key] || 0) + 1;
        });

        const sortedCounts = Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const data = sortedCounts.slice(0, 10);

        if (data.length > 1) {
            options.push({
                id: `volume-${cat}`,
                title: `Operational Density: Volume by ${cat}`,
                description: `Distribution of institutional record frequency across ${cat} segments.`,
                chartType: data.length <= 5 ? 'pie' : 'bar',
                data
            });

            const total = sortedCounts.reduce((acc, curr) => acc + curr.value, 0);
            const top = data[0];
            insights.push({
                id: `vol-dominance-${cat}`,
                type: 'pattern',
                description: `**Segment Saturation**: **${top.name}** represents the most dense segment with **${Math.round((top.value / total) * 100)}%** of the total institutional volume.`,
                confidence: 0.95,
                isVerified: true
            });
        }
    });

    return { insights, options };
};

export const generateTimeSeriesAnalysis = (records: any[], dates: string[], numbers: string[]): { insights: Insight[], options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    const dateCol = dates[0];
    const numCol = numbers[0];

    // Fallback: Use Volume (Count) if no numbers are provided for time-series
    const metricCol = numCol || 'Volume';
    const isVolume = !numCol;

    const timeSeries: Record<string, number> = {};
    records.forEach(r => {
        try {
            const dateVal = new Date(r[dateCol]);
            if (isNaN(dateVal.getTime())) return;
            const d = dateVal.toISOString().slice(0, 7);
            timeSeries[d] = (timeSeries[d] || 0) + (isVolume ? 1 : parseNum(r[numCol]));
        } catch (e) { }
    });

    const sortedSeries = Object.entries(timeSeries).sort((a, b) => a[0].localeCompare(b[0]));

    if (sortedSeries.length > 1) {
        options.push({
            id: 'time-trend',
            title: `Temporal Trajectory: ${metricCol} Analysis`,
            description: `Aggregated monthly ${isVolume ? 'capture frequency' : 'growth vector'} and acceleration analysis for ${metricCol} across the current fiscal cycle.`,
            chartType: 'area',
            data: sortedSeries.map(([name, value]) => ({ name, value }))
        });

        // Cumulative Growth Analysis (Very interesting for capture volume)
        let cumulative = 0;
        const cumulativeSeries = sortedSeries.map(([name, value]) => {
            cumulative += value;
            return { name, value: cumulative };
        });

        if (cumulativeSeries.length > 2) {
            options.push({
                id: 'cumulative-growth',
                title: `Institutional Scaling: Cumulative ${metricCol}`,
                description: `Aggregated growth roadmap showing the total lifecycle expansion of ${metricCol} metrics.`,
                chartType: 'line',
                data: cumulativeSeries
            });
        }

        const first = sortedSeries[0][1];
        const last = sortedSeries[sortedSeries.length - 1][1];
        if (first !== 0) {
            const growth = ((last - first) / first) * 100;
            const dir = growth > 0 ? 'Expansion' : 'Contraction';
            insights.push({
                id: 'historical-momentum',
                type: 'trend',
                description: `**Momentum Analysis**: Detected a **${Math.abs(growth).toFixed(1)}% ${dir}** in ${metricCol} velocity from ${sortedSeries[0][0]} to ${sortedSeries[sortedSeries.length - 1][0]}.`,
                confidence: 0.95,
                isVerified: true
            });
        }
    }
    return { insights, options };
};

export const generateEntityInsights = (records: any[], columns: string[]): { insights: Insight[], options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    // Email Domain Analysis
    const emailCol = columns.find(c => /email|mail/i.test(c));
    if (emailCol) {
        const domains: Record<string, number> = {};
        records.forEach(r => {
            const email = String(r[emailCol] || '');
            if (email.includes('@')) {
                const dom = email.split('@')[1].toLowerCase();
                domains[dom] = (domains[dom] || 0) + 1;
            }
        });

        const publicDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'];
        let publicCount = 0;
        let corporateCount = 0;

        Object.entries(domains).forEach(([dom, count]) => {
            if (publicDomains.includes(dom)) publicCount += count;
            else corporateCount += count;
        });

        const total = publicCount + corporateCount;
        if (total > 0) {
            const corpPct = Math.round((corporateCount / total) * 100);
            insights.push({
                id: 'email-segments',
                type: 'pattern',
                description: `**Institutional Composition**: **${corpPct}%** of records are identified as **Corporate Entities** based on domain heuristics, suggesting professional-grade engagement.`,
                confidence: 0.88,
                isVerified: true
            });
        }
    }

    // Geographic Market Reach
    const countryCol = columns.find(c => /country|nation|region/i.test(c));
    if (countryCol) {
        const countries: Record<string, number> = {};
        records.forEach(r => {
            const c = r[countryCol] || 'Unknown';
            countries[c] = (countries[c] || 0) + 1;
        });

        const sortedCountries = Object.entries(countries)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        if (sortedCountries.length > 1) {
            options.push({
                id: 'geographic-reach',
                title: 'Market Penetration: Geographic Presence',
                description: 'Distribution of active entities across international boundaries.',
                chartType: 'pie',
                data: sortedCountries.slice(0, 8)
            });

            insights.push({
                id: 'global-reach',
                type: 'pattern',
                description: `**International Footprint**: Found active institutional presence across **${sortedCountries.length} distinct nations**, indicating high geographic market resilience.`,
                confidence: 0.95,
                isVerified: true
            });
        }
    }

    // Institutional Concentration (Top Companies)
    const companyCol = columns.find(c => /company|organization|employer/i.test(c));
    if (companyCol) {
        const companies: Record<string, number> = {};
        records.forEach(r => {
            const co = String(r[companyCol] || '');
            if (co && co !== 'N/A') companies[co] = (companies[co] || 0) + 1;
        });

        const sortedCo = Object.entries(companies)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        if (sortedCo.length > 5) {
            options.push({
                id: 'top-entities',
                title: 'Enterprise Concentration: Top Organizations',
                description: 'Identification of high-density institutional data clusters.',
                chartType: 'bar',
                data: sortedCo
            });
        }
    }

    // Communication Resiliency (Data Quality of contacts)
    const phoneCols = columns.filter(c => /phone|mobile|tel/i.test(c));
    if (phoneCols.length > 0) {
        let hasBoth = 0;
        records.forEach(r => {
            if (r[phoneCols[0]] && r[phoneCols[1]]) hasBoth++;
        });

        const pct = Math.round((hasBoth / records.length) * 100);
        if (pct > 0) {
            insights.push({
                id: 'contact-health',
                type: 'quality',
                description: `**Communication Resiliency**: **${pct}%** of entity records possess **redundant contact channels** (primary + secondary), enhancing reachability index.`,
                confidence: 0.99,
                isVerified: true
            });
        }
    }

    // Digital Identity Footprint (TLD analysis)
    const webCol = columns.find(c => /website|site|url/i.test(c));
    if (webCol) {
        const tlds: Record<string, number> = {};
        records.forEach(r => {
            const url = String(r[webCol] || '');
            const match = url.match(/\.([a-z]{2,8})\/?$/i);
            if (match) {
                const tld = match[1].toLowerCase();
                tlds[tld] = (tlds[tld] || 0) + 1;
            }
        });

        const sortedTLD = Object.entries(tlds)
            .map(([name, value]) => ({ name: `.${name}`, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        if (sortedTLD.length > 1) {
            options.push({
                id: 'digital-id',
                title: 'Infrastructure Profile: Top Domain Extensions',
                description: 'Strategic TLD distribution of organizational web assets.',
                chartType: 'pie',
                data: sortedTLD
            });
        }
    }

    return { insights, options };
};

export const generateCorrelations = (records: any[], numbers: string[]): { insights: Insight[], options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    if (numbers.length >= 2) {
        const targetCols = numbers.slice(0, 5);
        for (let i = 0; i < targetCols.length; i++) {
            for (let j = i + 1; j < targetCols.length; j++) {
                const c1 = targetCols[i];
                const c2 = targetCols[j];
                const points = records.map(r => ({ x: parseNum(r[c1]), y: parseNum(r[c2]) })).filter(p => !isNaN(p.x) && !isNaN(p.y));

                if (points.length < 5) continue;

                const n = points.length;
                const sumX = points.reduce((a, b) => a + b.x, 0);
                const sumY = points.reduce((a, b) => a + b.y, 0);

                // Real Pearson Calc
                let sXY = 0, sX2 = 0, sY2 = 0;
                points.forEach(p => {
                    sXY += p.x * p.y;
                    sX2 += p.x * p.x;
                    sY2 += p.y * p.y;
                });

                const num = (n * sXY) - (sumX * sumY);
                const den = Math.sqrt((n * sX2 - sumX * sumX) * (n * sY2 - sumY * sumY));
                const r = den === 0 ? 0 : num / den;

                if (Math.abs(r) > 0.6) {
                    const strength = Math.abs(r) > 0.85 ? 'Systemic' : 'Significant';
                    const relation = r > 0 ? 'directly proportional' : 'inversely proportional';

                    // Simple p-value approximation for Pearson
                    const t = r * Math.sqrt((n - 2) / (1 - r * r));
                    const pValue = t > 3.29 ? '< 0.001' : t > 2.58 ? '< 0.01' : t > 1.96 ? '< 0.05' : '> 0.05';

                    insights.push({
                        id: `strategic-link-${c1}-${c2}`,
                        type: 'correlation',
                        description: `**${strength} Linkage**: ${c1} performance is ${relation} to ${c2} fluctuations. (Confidence Index: ${Math.abs(r).toFixed(2)}, p-value: ${pValue}).`,
                        confidence: Math.abs(r),
                        isVerified: true
                    });

                    options.push({
                        id: `correlation-map-${c1}-${c2}`,
                        title: `Regression Model: ${c1} vs ${c2}`,
                        description: `Visual mapping of the inter-dependency between ${c1} and ${c2} metrics.`,
                        chartType: 'scatter',
                        data: points.slice(0, 200).map((p, k) => ({ name: `Entry ${k}`, x: p.x, y: p.y }))
                    });
                }
            }
        }
    }
    return { insights, options };
};
