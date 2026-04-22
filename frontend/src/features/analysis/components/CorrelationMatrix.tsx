// ─── Correlation Matrix — Interactive Heatmap ───────────────────────────────
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, Info } from 'lucide-react';

interface Props {
    data: any[];
    measures: string[];
}

const pearsonCorr = (xs: number[], ys: number[]): number => {
    const n = xs.length;
    if (n < 3) return 0;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);
    const sumY2 = ys.reduce((a, y) => a + y * y, 0);
    const denom = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
    return denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
};

const getCorrelationColor = (r: number): string => {
    const abs = Math.abs(r);
    if (r > 0) {
        if (abs > 0.7) return `rgba(52,211,153,${0.3 + abs * 0.5})`;
        if (abs > 0.3) return `rgba(52,211,153,${0.1 + abs * 0.3})`;
        return `rgba(52,211,153,${abs * 0.2})`;
    } else {
        if (abs > 0.7) return `rgba(248,113,113,${0.3 + abs * 0.5})`;
        if (abs > 0.3) return `rgba(248,113,113,${0.1 + abs * 0.3})`;
        return `rgba(248,113,113,${abs * 0.2})`;
    }
};

const getTextColor = (r: number): string => {
    const abs = Math.abs(r);
    if (abs > 0.5) return '#fff';
    if (abs > 0.3) return 'rgba(255,255,255,0.8)';
    return 'var(--text-muted)';
};

export const CorrelationMatrix = ({ data, measures }: Props) => {
    const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);

    const { matrix, labels } = useMemo(() => {
        const cols = measures.slice(0, 8); // Limit to 8 for readability
        const numericData: Record<string, number[]> = {};

        cols.forEach(col => {
            numericData[col] = data.map(r => parseFloat(r[col])).filter(n => !isNaN(n));
        });

        const mat: number[][] = [];
        for (let i = 0; i < cols.length; i++) {
            mat[i] = [];
            for (let j = 0; j < cols.length; j++) {
                if (i === j) {
                    mat[i][j] = 1;
                } else {
                    const xs = numericData[cols[i]];
                    const ys = numericData[cols[j]];
                    // Align lengths
                    const minLen = Math.min(xs.length, ys.length);
                    mat[i][j] = pearsonCorr(xs.slice(0, minLen), ys.slice(0, minLen));
                }
            }
        }
        return { matrix: mat, labels: cols };
    }, [data, measures]);

    if (labels.length < 2) return null;

    const strongCorrelations = useMemo(() => {
        const results: { from: string; to: string; r: number }[] = [];
        for (let i = 0; i < labels.length; i++) {
            for (let j = i + 1; j < labels.length; j++) {
                const r = matrix[i][j];
                if (Math.abs(r) > 0.5) {
                    results.push({ from: labels[i], to: labels[j], r });
                }
            }
        }
        return results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    }, [matrix, labels]);

    const truncateLabel = (s: string, max = 12) => s.length > max ? s.slice(0, max) + '…' : s;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, rgba(18,18,24,0.9) 0%, rgba(8,8,12,0.95) 100%)',
                border: '1px solid var(--border-default)',
                borderRadius: '20px', overflow: 'hidden', position: 'relative'
            }}
        >
            <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #34d39960, #818cf8, #34d39960, transparent)' }} />

            <div style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(129,140,248,0.08))',
                        border: '1px solid rgba(52,211,153,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Grid3X3 size={22} color="#34d399" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
                            Correlation Matrix
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            Pearson correlation coefficients · {labels.length} measures
                        </p>
                    </div>
                </div>

                {/* Matrix Grid */}
                <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                    <div style={{ display: 'inline-grid', gridTemplateColumns: `100px repeat(${labels.length}, minmax(60px, 80px))`, gap: '2px' }}>
                        {/* Header row */}
                        <div />
                        {labels.map((label, i) => (
                            <div key={i} style={{
                                fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.05em', color: 'var(--text-muted)',
                                textAlign: 'center', padding: '8px 4px',
                                transform: 'rotate(-35deg)', transformOrigin: 'bottom left',
                                whiteSpace: 'nowrap', height: '60px',
                                display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                            }}>
                                {truncateLabel(label)}
                            </div>
                        ))}

                        {/* Data rows */}
                        {labels.map((rowLabel, i) => (
                            <>
                                <div key={`label-${i}`} style={{
                                    fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', paddingRight: '8px',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                    {truncateLabel(rowLabel)}
                                </div>
                                {labels.map((_, j) => {
                                    const r = matrix[i][j];
                                    const isHovered = hoverCell?.row === i && hoverCell?.col === j;
                                    const isHighlightRow = hoverCell?.row === i || hoverCell?.col === i;
                                    const isHighlightCol = hoverCell?.col === j || hoverCell?.row === j;
                                    const isDiag = i === j;

                                    return (
                                        <motion.div
                                            key={`${i}-${j}`}
                                            onMouseEnter={() => setHoverCell({ row: i, col: j })}
                                            onMouseLeave={() => setHoverCell(null)}
                                            whileHover={{ scale: 1.1, zIndex: 10 }}
                                            style={{
                                                background: isDiag
                                                    ? 'var(--border-default)'
                                                    : isHovered
                                                        ? `${getCorrelationColor(r)}`
                                                        : getCorrelationColor(r),
                                                borderRadius: '6px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: '10px 4px', cursor: 'pointer',
                                                border: isHovered
                                                    ? '2px solid rgba(255,255,255,0.3)'
                                                    : (isHighlightRow || isHighlightCol)
                                                        ? '1px solid rgba(255,255,255,0.08)'
                                                        : '1px solid transparent',
                                                transition: 'all 0.15s ease',
                                                position: 'relative'
                                            }}
                                        >
                                            <span style={{
                                                fontSize: isDiag ? '10px' : '11px',
                                                fontFamily: 'monospace', fontWeight: 800,
                                                color: isDiag ? 'var(--text-disabled)' : getTextColor(r)
                                            }}>
                                                {r.toFixed(2)}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    marginTop: '16px', padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '16px', height: '8px', borderRadius: '2px', background: 'rgba(248,113,113,0.6)' }} />
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Negative</span>
                    </div>
                    <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'linear-gradient(90deg, rgba(248,113,113,0.5), rgba(255,255,255,0.05), rgba(52,211,153,0.5))' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '16px', height: '8px', borderRadius: '2px', background: 'rgba(52,211,153,0.6)' }} />
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Positive</span>
                    </div>
                </div>

                {/* Strongest Correlations */}
                {strongCorrelations.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                        <h4 style={{
                            fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '10px',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <Info size={12} />
                            Notable Correlations
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {strongCorrelations.slice(0, 5).map((c, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 12px', borderRadius: '10px',
                                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)'
                                    }}
                                >
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: c.r > 0 ? '#34d399' : '#f87171',
                                        boxShadow: `0 0 8px ${c.r > 0 ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`
                                    }} />
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1 }}>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{c.from}</span>
                                        {' ↔ '}
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{c.to}</span>
                                    </span>
                                    <span style={{
                                        fontSize: '11px', fontFamily: 'monospace', fontWeight: 900,
                                        color: c.r > 0 ? '#34d399' : '#f87171'
                                    }}>
                                        {c.r > 0 ? '+' : ''}{c.r.toFixed(3)}
                                    </span>
                                    <span style={{
                                        fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
                                        letterSpacing: '0.05em', padding: '2px 6px', borderRadius: '4px',
                                        background: Math.abs(c.r) > 0.7 ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                                        color: Math.abs(c.r) > 0.7 ? '#34d399' : '#fbbf24'
                                    }}>
                                        {Math.abs(c.r) > 0.7 ? 'Strong' : 'Moderate'}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hover tooltip */}
                {hoverCell && (
                    <div style={{
                        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                        padding: '8px 16px', borderRadius: '10px',
                        background: 'rgba(0,0,0,0.9)', border: '1px solid var(--border-default)',
                        backdropFilter: 'blur(10px)', zIndex: 100,
                        display: 'flex', alignItems: 'center', gap: '12px',
                        fontSize: '11px', color: 'var(--text-secondary)'
                    }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{labels[hoverCell.row]}</span>
                        <span>↔</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{labels[hoverCell.col]}</span>
                        <span style={{
                            fontFamily: 'monospace', fontWeight: 900, fontSize: '13px',
                            color: matrix[hoverCell.row][hoverCell.col] > 0 ? '#34d399' : '#f87171'
                        }}>
                            r = {matrix[hoverCell.row][hoverCell.col].toFixed(4)}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
