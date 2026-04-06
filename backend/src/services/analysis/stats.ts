// ═══════════════════════════════════════════════════════════════════════════════
// Nalyse Statistical Intelligence Engine v3.0
// Multi-dimensional analysis: categories, time-series, correlations, entities,
// inventory, distributions, and automated key metric extraction
// ═══════════════════════════════════════════════════════════════════════════════

import { AnalysisOption, Insight, AdvancedColumnType, KeyMetric, ColumnStatistics } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const parseNum = (val: any): number => {
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(/[$€£¥₹,% \s]/g, '')) || 0;
};

const pct = (part: number, total: number): string =>
    total > 0 ? `${Math.round((part / total) * 100)}%` : '0%';

const fmt = (n: number): string => {
    if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// ─── Inventory Analysis ─────────────────────────────────────────────────────

export const generateInventoryInsights = (
    records: any[],
    columns: string[],
    colTypes: Record<string, AdvancedColumnType>
): { insights: Insight[]; options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    const stockCol = columns.find(c => /stock|qty|inventory|quantity|v_bestand|menge|units_in_stock|on_hand/i.test(c));
    const nameCol = columns.find(c => /name|item|product|title|sku|bezeichnung|description/i.test(c)) || columns[0];
    const priceCol = columns.find(c => /price|cost|unit_price|value/i.test(c) && colTypes[c] !== 'id');

    if (!stockCol) return { insights, options };

    // Inventory health analysis
    const totalItems = records.length;
    const zeroStock = records.filter(r => parseNum(r[stockCol]) === 0);
    const lowStock = records.filter(r => { const v = parseNum(r[stockCol]); return v > 0 && v < 10; });
    const highStock = records.filter(r => parseNum(r[stockCol]) > 100);

    insights.push({
        id: 'inv-health',
        type: 'pattern',
        description: `**Inventory Composition**: ${zeroStock.length} items out of stock (${pct(zeroStock.length, totalItems)}), ${lowStock.length} critically low (<10 units), ${highStock.length} well-stocked (>100 units).`,
        confidence: 0.98,
        isVerified: true,
        severity: zeroStock.length > totalItems * 0.1 ? 'critical' : 'info'
    });

    if (lowStock.length > 0) {
        options.push({
            id: 'low-stock-chart',
            title: `Critical Inventory: Low Stock Items`,
            description: `${lowStock.length} items with dangerously low availability requiring immediate replenishment.`,
            chartType: 'bar',
            data: lowStock.sort((a, b) => parseNum(a[stockCol]) - parseNum(b[stockCol]))
                .slice(0, 15)
                .map(r => ({ name: String(r[nameCol] || 'Unknown').substring(0, 25), value: parseNum(r[stockCol]) })),
            priority: 9
        });
    }

    // Inventory value analysis (stock × price)
    if (priceCol) {
        const inventoryValues = records
            .map(r => ({
                name: String(r[nameCol] || 'Unknown').substring(0, 25),
                value: Math.round(parseNum(r[stockCol]) * parseNum(r[priceCol]))
            }))
            .filter(r => r.value > 0)
            .sort((a, b) => b.value - a.value);

        if (inventoryValues.length > 0) {
            const totalValue = inventoryValues.reduce((s, r) => s + r.value, 0);
            options.push({
                id: 'inv-value-dist',
                title: `Inventory Value Distribution`,
                description: `Total estimated inventory value: $${fmt(totalValue)}`,
                chartType: 'bar',
                data: inventoryValues.slice(0, 12),
                priority: 8
            });

            // ABC Analysis
            let cumulative = 0;
            let classA = 0, classB = 0;
            for (const item of inventoryValues) {
                cumulative += item.value;
                if (cumulative <= totalValue * 0.8) classA++;
                else if (cumulative <= totalValue * 0.95) classB++;
            }

            insights.push({
                id: 'abc-analysis',
                type: 'segment',
                description: `**ABC Classification**: Top ${classA} items (${pct(classA, inventoryValues.length)}) represent 80% of inventory value. Class B: ${classB} items (next 15%). Class C: ${inventoryValues.length - classA - classB} items (bottom 5%).`,
                confidence: 0.95,
                isVerified: true
            });
        }
    }

    return { insights, options };
};

// ─── Category Analysis ──────────────────────────────────────────────────────

export const generateCategoryInsights = (
    records: any[],
    categories: string[],
    numbers: string[]
): { insights: Insight[]; options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    // Category × Measure cross-analysis
    if (categories.length > 0 && numbers.length > 0) {
        const maxCats = Math.min(categories.length, 3);
        const maxNums = Math.min(numbers.length, 2);

        for (let ci = 0; ci < maxCats; ci++) {
            const cat = categories[ci];
            for (let ni = 0; ni < maxNums; ni++) {
                const num = numbers[ni];

                // Aggregate with Map (faster than object)
                const agg = new Map<string, { sum: number; count: number; min: number; max: number }>();
                for (const r of records) {
                    const key = String(r[cat] || 'N/A');
                    const val = parseNum(r[num]);
                    const existing = agg.get(key);
                    if (existing) {
                        existing.sum += val;
                        existing.count++;
                        if (val < existing.min) existing.min = val;
                        if (val > existing.max) existing.max = val;
                    } else {
                        agg.set(key, { sum: val, count: 1, min: val, max: val });
                    }
                }

                const sortedData = Array.from(agg.entries())
                    .map(([name, v]) => ({ name, value: Math.round(v.sum * 100) / 100, avg: Math.round(v.sum / v.count * 100) / 100, count: v.count }))
                    .sort((a, b) => b.value - a.value);

                if (sortedData.length < 2) continue;

                const data = sortedData.slice(0, 12);
                const total = sortedData.reduce((acc, curr) => acc + curr.value, 0);

                // Main chart
                options.push({
                    id: `cat-${cat}-${num}`,
                    title: `${num} by ${cat}`,
                    description: `Aggregated ${num} across ${agg.size} ${cat} segments. Total: ${fmt(total)}`,
                    chartType: data.length <= 6 ? 'pie' : 'bar',
                    data,
                    priority: 7
                });

                // Pareto (80/20) Analysis
                let runningSum = 0, countFor80 = 0;
                for (const item of sortedData) {
                    runningSum += item.value;
                    countFor80++;
                    if (runningSum >= total * 0.8) break;
                }
                const paretoRatio = Math.round((countFor80 / sortedData.length) * 100);

                if (paretoRatio <= 30) {
                    insights.push({
                        id: `pareto-${cat}-${num}`,
                        type: 'pattern',
                        description: `**Pareto Concentration**: Only **${paretoRatio}%** of ${cat} segments drive **80%** of total ${num}. Top performer: **${data[0].name}** (${pct(data[0].value, total)}).`,
                        confidence: 0.93,
                        isVerified: true
                    });
                }

                // Dominance insight
                if (data[0].value > total * 0.25) {
                    insights.push({
                        id: `dominance-${cat}-${num}`,
                        type: 'segment',
                        description: `**Segment Leader**: **${data[0].name}** drives ${pct(data[0].value, total)} of total ${num} (${fmt(data[0].value)}), ${data.length > 1 ? `${((data[0].value / data[1].value)).toFixed(1)}× the runner-up` : ''}.`,
                        confidence: 0.91,
                        isVerified: true
                    });
                }

                // Disparity analysis
                if (sortedData.length >= 3) {
                    const topAvg = sortedData.slice(0, 3).reduce((s, v) => s + v.avg, 0) / 3;
                    const bottomAvg = sortedData.slice(-3).reduce((s, v) => s + v.avg, 0) / 3;
                    if (bottomAvg > 0 && topAvg / bottomAvg > 5) {
                        insights.push({
                            id: `disparity-${cat}-${num}`,
                            type: 'anomaly',
                            description: `**Performance Gap**: Top ${cat} segments average **${topAvg / bottomAvg > 10 ? '10+' : (topAvg / bottomAvg).toFixed(1)}×** higher ${num} than bottom segments. Investigate potential market imbalances.`,
                            confidence: 0.87,
                            isVerified: true,
                            severity: 'warning'
                        });
                    }
                }
            }
        }
    }

    // Volume distribution (record frequency per category)
    for (const cat of categories.slice(0, 2)) {
        const counts = new Map<string, number>();
        for (const r of records) {
            const key = String(r[cat] || 'N/A');
            counts.set(key, (counts.get(key) || 0) + 1);
        }

        const data = Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        if (data.length > 1) {
            const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
            options.push({
                id: `volume-${cat}`,
                title: `Volume by ${cat}`,
                description: `Record frequency across ${counts.size} unique ${cat} values.`,
                chartType: data.length <= 6 ? 'pie' : 'bar',
                data,
                priority: 5
            });

            insights.push({
                id: `vol-dist-${cat}`,
                type: 'pattern',
                description: `**Distribution**: **${data[0].name}** is the most frequent ${cat} with ${data[0].value.toLocaleString()} records (${pct(data[0].value, total)}), across ${counts.size} distinct values.`,
                confidence: 0.95,
                isVerified: true
            });
        }
    }

    return { insights, options };
};

// ─── Time Series Analysis ───────────────────────────────────────────────────

export const generateTimeSeriesAnalysis = (
    records: any[],
    dates: string[],
    numbers: string[]
): { insights: Insight[]; options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    const dateCol = dates[0];
    if (!dateCol) return { insights, options };

    const numCol = numbers[0];
    const metricLabel = numCol || 'Volume';
    const isVolume = !numCol;

    // Aggregate by month
    const monthly = new Map<string, { sum: number; count: number }>();
    for (const r of records) {
        try {
            const d = new Date(r[dateCol]);
            if (isNaN(d.getTime())) continue;
            const key = d.toISOString().slice(0, 7); // YYYY-MM
            const val = isVolume ? 1 : parseNum(r[numCol]);
            const existing = monthly.get(key);
            if (existing) {
                existing.sum += val;
                existing.count++;
            } else {
                monthly.set(key, { sum: val, count: 1 });
            }
        } catch { /* skip invalid dates */ }
    }

    const sortedMonths = Array.from(monthly.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));

    if (sortedMonths.length < 2) return { insights, options };

    // Main time series
    const timeData = sortedMonths.map(([name, v]) => ({ name, value: Math.round(v.sum * 100) / 100 }));
    options.push({
        id: 'time-trend',
        title: `${metricLabel} Over Time`,
        description: `Monthly ${isVolume ? 'volume' : metricLabel} trend across ${sortedMonths.length} periods.`,
        chartType: 'area',
        data: timeData,
        priority: 8
    });

    // Cumulative growth curve
    let cumulative = 0;
    const cumulativeData = timeData.map(d => {
        cumulative += d.value;
        return { name: d.name, value: Math.round(cumulative * 100) / 100 };
    });

    if (cumulativeData.length > 2) {
        options.push({
            id: 'cumulative-growth',
            title: `Cumulative ${metricLabel}`,
            description: `Running total growth trajectory for ${metricLabel}.`,
            chartType: 'line',
            data: cumulativeData,
            priority: 6
        });
    }

    // Growth Analysis
    const firstVal = timeData[0].value;
    const lastVal = timeData[timeData.length - 1].value;
    if (firstVal !== 0) {
        const totalGrowth = ((lastVal - firstVal) / firstVal) * 100;
        const direction = totalGrowth > 0 ? 'expansion' : 'contraction';

        insights.push({
            id: 'growth-trajectory',
            type: 'trend',
            description: `**Overall Trajectory**: ${Math.abs(totalGrowth).toFixed(1)}% ${direction} in ${metricLabel} from ${timeData[0].name} to ${timeData[timeData.length - 1].name}.`,
            confidence: 0.95,
            isVerified: true,
            severity: Math.abs(totalGrowth) > 50 ? 'warning' : 'info'
        });
    }

    // Month-over-month volatility
    if (timeData.length >= 4) {
        const momChanges: number[] = [];
        for (let i = 1; i < timeData.length; i++) {
            if (timeData[i - 1].value > 0) {
                momChanges.push(((timeData[i].value - timeData[i - 1].value) / timeData[i - 1].value) * 100);
            }
        }

        if (momChanges.length >= 3) {
            const avgChange = momChanges.reduce((s, v) => s + v, 0) / momChanges.length;
            const maxSpike = Math.max(...momChanges);
            const maxDrop = Math.min(...momChanges);

            // Volatility (std dev of MoM changes)
            const variance = momChanges.reduce((s, v) => s + (v - avgChange) ** 2, 0) / momChanges.length;
            const volatility = Math.sqrt(variance);

            if (volatility > 30) {
                insights.push({
                    id: 'high-volatility',
                    type: 'risk',
                    description: `**High Volatility**: ${metricLabel} shows ${volatility.toFixed(1)}% month-over-month variance. Peak swing: +${maxSpike.toFixed(1)}% / ${maxDrop.toFixed(1)}%. Consider stabilization measures.`,
                    confidence: 0.88,
                    isVerified: true,
                    severity: 'warning'
                });
            }

            // Seasonality detection (simple: compare first-half vs second-half averages)
            const halfPoint = Math.floor(timeData.length / 2);
            const firstHalfAvg = timeData.slice(0, halfPoint).reduce((s, d) => s + d.value, 0) / halfPoint;
            const secondHalfAvg = timeData.slice(halfPoint).reduce((s, d) => s + d.value, 0) / (timeData.length - halfPoint);

            if (firstHalfAvg > 0 && Math.abs(secondHalfAvg / firstHalfAvg - 1) > 0.3) {
                const shift = secondHalfAvg > firstHalfAvg ? 'acceleration' : 'deceleration';
                insights.push({
                    id: 'period-shift',
                    type: 'trend',
                    description: `**Period Shift**: Detected ${shift} — second-half average (${fmt(secondHalfAvg)}) is ${((Math.abs(secondHalfAvg / firstHalfAvg - 1)) * 100).toFixed(0)}% ${secondHalfAvg > firstHalfAvg ? 'higher' : 'lower'} than first-half (${fmt(firstHalfAvg)}).`,
                    confidence: 0.86,
                    isVerified: true
                });
            }
        }
    }

    // Weekly pattern analysis (day-of-week)
    const dowCounts = new Array(7).fill(0);
    const dowNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let validDow = 0;
    for (const r of records) {
        const d = new Date(r[dateCol]);
        if (!isNaN(d.getTime())) {
            dowCounts[d.getDay()]++;
            validDow++;
        }
    }

    if (validDow > 100) {
        const dowData = dowCounts.map((count, i) => ({ name: dowNames[i], value: count }));
        const maxDay = dowData.reduce((max, d) => d.value > max.value ? d : max, dowData[0]);
        const minDay = dowData.reduce((min, d) => d.value < min.value ? d : min, dowData[0]);

        if (maxDay.value > minDay.value * 1.5) {
            options.push({
                id: 'day-pattern',
                title: `Activity by Day of Week`,
                description: `Weekly distribution pattern: ${maxDay.name} is the busiest day.`,
                chartType: 'bar',
                data: dowData,
                priority: 4
            });

            insights.push({
                id: 'weekly-pattern',
                type: 'pattern',
                description: `**Weekly Cycle**: Peak activity on **${maxDay.name}** (${maxDay.value.toLocaleString()} records), lowest on **${minDay.name}** (${minDay.value.toLocaleString()}). Ratio: ${(maxDay.value / minDay.value).toFixed(1)}×.`,
                confidence: 0.89,
                isVerified: true
            });
        }
    }

    return { insights, options };
};

// ─── Entity Analysis ────────────────────────────────────────────────────────

export const generateEntityInsights = (
    records: any[],
    columns: string[]
): { insights: Insight[]; options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    // Email domain segmentation
    const emailCol = columns.find(c => /email|e-?mail/i.test(c));
    if (emailCol) {
        const domains = new Map<string, number>();
        for (const r of records) {
            const email = String(r[emailCol] || '');
            const atIdx = email.indexOf('@');
            if (atIdx > 0) {
                const dom = email.substring(atIdx + 1).toLowerCase();
                domains.set(dom, (domains.get(dom) || 0) + 1);
            }
        }

        const publicDomains = new Set(['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'aol.com', 'live.com', 'protonmail.com', 'mail.com', 'gmx.com']);
        let publicCount = 0, corporateCount = 0;
        for (const [dom, count] of domains) {
            if (publicDomains.has(dom)) publicCount += count;
            else corporateCount += count;
        }

        const total = publicCount + corporateCount;
        if (total > 0) {
            const corpPct = Math.round((corporateCount / total) * 100);
            insights.push({
                id: 'email-mix',
                type: 'segment',
                description: `**Contact Composition**: **${corpPct}%** corporate emails, **${100 - corpPct}%** personal. ${corpPct > 60 ? 'B2B-dominant audience.' : 'Consumer-leaning base.'}`,
                confidence: 0.88,
                isVerified: true
            });

            // Top corporate domains
            const topCorpDomains = Array.from(domains.entries())
                .filter(([d]) => !publicDomains.has(d))
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([name, value]) => ({ name, value }));

            if (topCorpDomains.length > 3) {
                options.push({
                    id: 'top-corp-domains',
                    title: 'Top Corporate Email Domains',
                    description: 'Highest-frequency corporate domains in the dataset.',
                    chartType: 'bar',
                    data: topCorpDomains,
                    priority: 5
                });
            }
        }
    }

    // Geographic analysis
    const countryCol = columns.find(c => /country|nation|region|state|province/i.test(c));
    if (countryCol) {
        const geo = new Map<string, number>();
        for (const r of records) {
            const c = String(r[countryCol] || 'Unknown');
            geo.set(c, (geo.get(c) || 0) + 1);
        }

        const geoData = Array.from(geo.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        if (geoData.length > 1) {
            options.push({
                id: 'geo-reach',
                title: `Geographic Distribution`,
                description: `Presence across ${geo.size} regions.`,
                chartType: geoData.length <= 6 ? 'pie' : 'bar',
                data: geoData.slice(0, 10),
                priority: 6
            });

            const total = geoData.reduce((s, d) => s + d.value, 0);
            const topRegion = geoData[0];
            insights.push({
                id: 'geo-concentration',
                type: 'pattern',
                description: `**Geographic Presence**: ${geo.size} distinct regions. **${topRegion.name}** leads with ${pct(topRegion.value, total)} of records. ${geoData.length >= 10 ? 'Broad international reach.' : 'Moderate geographic diversity.'}`,
                confidence: 0.92,
                isVerified: true
            });
        }
    }

    // Organization concentration
    const companyCol = columns.find(c => /company|organization|employer|business|brand|vendor|supplier/i.test(c));
    if (companyCol) {
        const orgs = new Map<string, number>();
        for (const r of records) {
            const co = String(r[companyCol] || '').trim();
            if (co && co !== 'N/A' && co !== 'null') orgs.set(co, (orgs.get(co) || 0) + 1);
        }

        const orgData = Array.from(orgs.entries())
            .map(([name, value]) => ({ name: name.substring(0, 25), value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 12);

        if (orgData.length >= 3) {
            options.push({
                id: 'org-concentration',
                title: `Top Organizations`,
                description: `Most represented entities from ${orgs.size} total.`,
                chartType: 'bar',
                data: orgData,
                priority: 5
            });
        }
    }

    // URL/Website TLD analysis
    const webCol = columns.find(c => /website|site|url|link|homepage/i.test(c));
    if (webCol) {
        const tlds = new Map<string, number>();
        for (const r of records) {
            const url = String(r[webCol] || '');
            const match = url.match(/\.([a-z]{2,8})\/?$/i);
            if (match) {
                const tld = `.${match[1].toLowerCase()}`;
                tlds.set(tld, (tlds.get(tld) || 0) + 1);
            }
        }

        const tldData = Array.from(tlds.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        if (tldData.length > 1) {
            options.push({
                id: 'tld-dist',
                title: 'Domain Extension Distribution',
                description: 'Top-level domain distribution of web assets.',
                chartType: 'pie',
                data: tldData,
                priority: 3
            });
        }
    }

    return { insights, options };
};

// ─── Correlation Analysis ───────────────────────────────────────────────────

export const generateCorrelations = (
    records: any[],
    numbers: string[]
): { insights: Insight[]; options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    if (numbers.length < 2) return { insights, options };

    const targetCols = numbers.slice(0, 6);

    for (let i = 0; i < targetCols.length; i++) {
        for (let j = i + 1; j < targetCols.length; j++) {
            const c1 = targetCols[i];
            const c2 = targetCols[j];

            // Extract paired values (both must be valid numbers)
            const points: { x: number; y: number }[] = [];
            for (const r of records) {
                const x = parseNum(r[c1]);
                const y = parseNum(r[c2]);
                if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
                    points.push({ x, y });
                }
            }

            if (points.length < 10) continue;

            // Pearson correlation coefficient (optimized single-pass)
            const n = points.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
            for (let k = 0; k < n; k++) {
                const { x, y } = points[k];
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumX2 += x * x;
                sumY2 += y * y;
            }

            const numerator = (n * sumXY) - (sumX * sumY);
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            const r_val = denominator === 0 ? 0 : numerator / denominator;

            if (Math.abs(r_val) < 0.5) continue;  // Only report meaningful correlations

            const strength = Math.abs(r_val) > 0.85 ? 'Strong' : Math.abs(r_val) > 0.7 ? 'Moderate' : 'Weak';
            const direction = r_val > 0 ? 'positive' : 'negative';

            // T-statistic for significance
            const t = r_val * Math.sqrt((n - 2) / (1 - r_val * r_val));
            const pLabel = Math.abs(t) > 3.29 ? '<0.001' : Math.abs(t) > 2.58 ? '<0.01' : Math.abs(t) > 1.96 ? '<0.05' : '>0.05';

            insights.push({
                id: `corr-${c1}-${c2}`,
                type: 'correlation',
                description: `**${strength} ${direction} correlation** between **${c1}** and **${c2}**: r=${r_val.toFixed(3)} (p${pLabel}, n=${n.toLocaleString()}). ${r_val > 0 ? 'They tend to increase together.' : 'As one increases, the other decreases.'}`,
                confidence: Math.abs(r_val),
                isVerified: true,
                severity: Math.abs(r_val) > 0.85 ? 'warning' : 'info'
            });

            // Scatter plot (sample points for performance)
            const sampleSize = Math.min(300, points.length);
            const step = Math.max(1, Math.floor(points.length / sampleSize));
            const scatterData = [];
            for (let k = 0; k < points.length && scatterData.length < sampleSize; k += step) {
                scatterData.push({
                    name: `Point ${k}`,
                    x: Math.round(points[k].x * 100) / 100,
                    y: Math.round(points[k].y * 100) / 100
                });
            }

            options.push({
                id: `scatter-${c1}-${c2}`,
                title: `${c1} vs ${c2}`,
                description: `${strength} ${direction} correlation (r=${r_val.toFixed(2)}).`,
                chartType: 'scatter',
                data: scatterData,
                priority: Math.abs(r_val) > 0.8 ? 7 : 4
            });
        }
    }

    return { insights, options };
};

// ─── Distribution Analysis (NEW) ────────────────────────────────────────────

export const generateDistributionInsights = (
    records: any[],
    numbers: string[],
    colStats: Record<string, ColumnStatistics>
): { insights: Insight[]; options: AnalysisOption[] } => {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    for (const num of numbers.slice(0, 3)) {
        const stats = colStats[num];
        if (!stats || stats.min === undefined || stats.max === undefined || stats.mean === undefined) continue;

        const range = stats.max - stats.min;
        if (range === 0) continue;

        // Build histogram (10 bins)
        const bins = 10;
        const binWidth = range / bins;
        const histogram = new Array(bins).fill(0);

        for (const r of records) {
            const val = parseNum(r[num]);
            if (isNaN(val)) continue;
            const bin = Math.min(bins - 1, Math.floor((val - stats.min!) / binWidth));
            histogram[bin]++;
        }

        const histData = histogram.map((count, i) => ({
            name: `${(stats.min! + i * binWidth).toFixed(1)}`,
            value: count
        }));

        options.push({
            id: `dist-${num}`,
            title: `Distribution of ${num}`,
            description: `Histogram: min=${fmt(stats.min!)}, max=${fmt(stats.max!)}, mean=${fmt(stats.mean!)}, σ=${fmt(stats.stdDev!)}`,
            chartType: 'bar',
            data: histData,
            priority: 4
        });

        // Skewness check
        if (stats.stdDev && stats.stdDev > 0 && stats.median !== undefined) {
            const skew = 3 * (stats.mean - stats.median) / stats.stdDev;
            if (Math.abs(skew) > 1) {
                insights.push({
                    id: `skew-${num}`,
                    type: 'pattern',
                    description: `**Skewed Distribution**: **${num}** is ${skew > 0 ? 'right-skewed (long tail of high values)' : 'left-skewed (long tail of low values)'}. Median (${fmt(stats.median)}) differs significantly from mean (${fmt(stats.mean!)}). Consider median-based analysis.`,
                    confidence: 0.84,
                    isVerified: true
                });
            }
        }
    }

    return { insights, options };
};

// ─── Key Metrics Extraction ─────────────────────────────────────────────────

export const generateKeyMetrics = (
    records: any[],
    columns: string[],
    dataHealthScore: number,
    colStats?: Record<string, ColumnStatistics>
): KeyMetric[] => {
    const metrics: KeyMetric[] = [];
    const len = records.length;
    if (len === 0) return metrics;

    // Column identification
    const revenueCol = columns.find(c => /revenue|sales|amount|price|total|value|cost|income|profit/i.test(c));
    const dateCol = columns.find(c => /date|time|created|updated|timestamp/i.test(c));
    const custCol = columns.find(c => /customer|user|client|account|email/i.test(c));
    const statusCol = columns.find(c => /status|state|active|churn|stage|completed/i.test(c));
    const categoryCol = columns.find(c => /category|type|segment|department|region|country/i.test(c));

    // Use pre-computed stats if available
    const revStats = revenueCol && colStats ? colStats[revenueCol] : null;
    const activeStatuses = new Set(['active', 'true', '1', 'completed', 'paid', 'won', 'success', 'approved']);

    // Single-pass aggregation
    let totalRevenue = 0;
    let activeCount = 0;
    let minTime = Infinity, maxTime = -Infinity, validDates = 0;
    const catCounts = new Map<string, number>();

    for (const r of records) {
        if (revenueCol) totalRevenue += parseNum(r[revenueCol]);
        if (statusCol && activeStatuses.has(String(r[statusCol]).toLowerCase())) activeCount++;
        if (dateCol) {
            const t = new Date(r[dateCol]).getTime();
            if (!isNaN(t)) {
                if (t < minTime) minTime = t;
                if (t > maxTime) maxTime = t;
                validDates++;
            }
        }
        if (categoryCol) {
            const cat = String(r[categoryCol] || 'Unknown');
            catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
        }
    }

    // Trend calculation (current 30d vs previous 30d)
    const calcTrend = (curr: number, prev: number): string => {
        if (prev === 0) return 'N/A';
        const change = ((curr - prev) / prev) * 100;
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    let currentRevenue = 0, prevRevenue = 0;
    let currentCount = 0, prevCount = 0;
    let currentActive = 0, prevActive = 0;

    if (validDates > 0 && maxTime > minTime) {
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const cutoff = maxTime - thirtyDays;
        const prevCutoff = cutoff - thirtyDays;

        for (const r of records) {
            const t = new Date(r[dateCol!]).getTime();
            if (isNaN(t)) continue;
            const isCurrent = t >= cutoff;
            const isPrev = t >= prevCutoff && t < cutoff;

            if (isCurrent) {
                currentCount++;
                if (revenueCol) currentRevenue += parseNum(r[revenueCol]);
                if (statusCol && activeStatuses.has(String(r[statusCol]).toLowerCase())) currentActive++;
            } else if (isPrev) {
                prevCount++;
                if (revenueCol) prevRevenue += parseNum(r[revenueCol]);
                if (statusCol && activeStatuses.has(String(r[statusCol]).toLowerCase())) prevActive++;
            }
        }
    } else {
        currentRevenue = totalRevenue;
        currentCount = len;
    }

    // Build metrics
    if (revenueCol) {
        metrics.push({
            label: 'Total Volume',
            value: `$${fmt(totalRevenue)}`,
            trend: validDates > 0 ? calcTrend(currentRevenue, prevRevenue) : 'Total',
            color: 'var(--success)',
            icon: '$'
        });
        if (revStats?.mean !== undefined) {
            metrics.push({
                label: 'Avg. Value',
                value: `$${fmt(revStats.mean)}`,
                trend: revStats.median ? `Median: $${fmt(revStats.median)}` : 'Per Record',
                color: 'var(--info)',
                icon: 'AVG'
            });
        }
    }

    if (custCol) {
        const uniqueCount = new Set(records.map(r => r[custCol])).size;
        metrics.push({
            label: 'Distinct Entities',
            value: uniqueCount.toLocaleString(),
            trend: `of ${len.toLocaleString()} total`,
            color: 'var(--primary)',
            icon: '#'
        });
    }

    if (statusCol) {
        const rate = (activeCount / len) * 100;
        const currRate = currentCount > 0 ? (currentActive / currentCount) * 100 : 0;
        const prevRate = prevCount > 0 ? (prevActive / prevCount) * 100 : 0;
        metrics.push({
            label: 'Active Rate',
            value: `${rate.toFixed(1)}%`,
            trend: validDates > 0 ? calcTrend(currRate, prevRate) : 'Overall',
            color: rate > 80 ? 'var(--success)' : rate > 50 ? 'var(--warning)' : 'var(--error)',
            icon: '%'
        });
    }

    if (categoryCol && catCounts.size > 0) {
        let topCat = '', topCount = 0;
        for (const [cat, count] of catCounts) {
            if (count > topCount) { topCount = count; topCat = cat; }
        }
        if (topCat) {
            metrics.push({
                label: 'Top Segment',
                value: topCat.length > 12 ? topCat.substring(0, 10) + '…' : topCat,
                trend: `${((topCount / len) * 100).toFixed(1)}% share`,
                color: 'var(--accent)',
                icon: '★'
            });
        }
    }

    // Fallback if no domain-specific metrics
    if (metrics.length === 0) {
        metrics.push(
            { label: 'Dataset Size', value: len.toLocaleString(), trend: `${columns.length} columns`, color: 'var(--primary)', icon: 'D' },
            { label: 'Data Health', value: `${dataHealthScore}%`, trend: 'Quality Score', color: dataHealthScore > 90 ? 'var(--success)' : 'var(--warning)', icon: 'H' }
        );
        if (validDates > 0) {
            const days = Math.floor((maxTime - minTime) / (1000 * 60 * 60 * 24));
            metrics.push({ label: 'Time Span', value: `${days} days`, trend: `${sortedMonthCount(records, dateCol!)} months`, color: 'var(--info)', icon: 'T' });
        }
    }

    return metrics;
};

// helper
function sortedMonthCount(records: any[], dateCol: string): number {
    const months = new Set<string>();
    for (const r of records) {
        const d = new Date(r[dateCol]);
        if (!isNaN(d.getTime())) months.add(d.toISOString().slice(0, 7));
    }
    return months.size;
}
