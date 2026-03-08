import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import alasql from 'alasql';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, AreaChart, Area,
    PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { API_URL } from '../../../config';
import {
    Sparkles, Search, X, Loader2, BarChart3, TrendingUp,
    Table2, ArrowRight, Lightbulb, ChevronRight, Zap,
    BrainCircuit, RefreshCw
} from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#34d399', '#f472b6', '#fbbf24', '#38bdf8', '#a78bfa', '#fb923c'];

interface NLQueryBarProps {
    data: any[];
    schema: Record<string, string>;
    isOpen: boolean;
    onClose: () => void;
}

interface NLQResult {
    sql: string;
    chartType: string;
    chartTitle: string;
    xAxis: string;
    yAxis: string;
    interpretation: string;
    suggestions: string[];
}

const EXAMPLE_QUERIES = [
    'Show me the top 10 records by value',
    'Count records by category',
    'What is the total of all numeric columns?',
    'Show distribution of data by type',
    'Find the average value grouped by name',
];

export const NLQueryBar = ({ data, schema, isOpen, onClose }: NLQueryBarProps) => {
    const { token } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [nlqResult, setNlqResult] = useState<NLQResult | null>(null);
    const [queryData, setQueryData] = useState<any[]>([]);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showExamples, setShowExamples] = useState(true);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setShowExamples(true);
        } else {
            setQuery('');
            setNlqResult(null);
            setQueryData([]);
            setQueryError(null);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowUp' && history.length > 0) {
                e.preventDefault();
                const newIdx = Math.min(historyIndex + 1, history.length - 1);
                setHistoryIndex(newIdx);
                setQuery(history[newIdx]);
            }
            if (e.key === 'ArrowDown' && historyIndex > -1) {
                e.preventDefault();
                const newIdx = historyIndex - 1;
                setHistoryIndex(newIdx);
                setQuery(newIdx >= 0 ? history[newIdx] : '');
            }
        };
        if (isOpen) window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [isOpen, history, historyIndex, onClose]);

    const runQuery = useCallback(async (q: string) => {
        if (!q.trim() || !data.length) return;

        setIsLoading(true);
        setNlqResult(null);
        setQueryError(null);
        setQueryData([]);
        setShowExamples(false);

        // Build schema + sample values for context
        const sampleValues: Record<string, any[]> = {};
        Object.keys(schema).forEach(col => {
            sampleValues[col] = [...new Set(data.slice(0, 50).map(r => r[col]).filter(v => v != null))].slice(0, 5);
        });

        try {
            const response = await fetch(`${API_URL}/api/ai/nlq`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: q, schema, sampleValues })
            });

            if (!response.ok) throw new Error('AI service unavailable');
            const result: NLQResult = await response.json();

            setNlqResult(result);
            setHistory(prev => [q, ...prev.filter(h => h !== q)].slice(0, 20));
            setHistoryIndex(-1);

            // Execute the SQL on local data
            try {
                const sqlResult = alasql(result.sql, [data]) as any[];
                setQueryData(Array.isArray(sqlResult) ? sqlResult : []);
            } catch (sqlErr: any) {
                setQueryError(`SQL execution error: ${sqlErr.message}`);
            }
        } catch (err: any) {
            setQueryError(err.message || 'Failed to process query');
        } finally {
            setIsLoading(false);
        }
    }, [data, schema, token]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (query.trim()) runQuery(query.trim());
    };

    const renderChart = () => {
        if (!nlqResult || !queryData.length) return null;

        const { chartType, xAxis, yAxis } = nlqResult;
        const keys = Object.keys(queryData[0] || {});
        const xKey = xAxis || keys[0] || 'name';
        const yKey = yAxis || keys[1] || keys[0] || 'value';

        const commonProps = {
            data: queryData.slice(0, 50),
        };

        if (chartType === 'table') return null; // handled separately

        return (
            <ResponsiveContainer width="100%" height={280}>
                {chartType === 'bar' ? (
                    <BarChart {...commonProps} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} angle={-35} textAnchor="end" height={55} />
                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12 }} />
                        <Bar dataKey={yKey} fill="#6366f1" radius={[6, 6, 0, 0]}>
                            {queryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                ) : chartType === 'line' || chartType === 'area' ? (
                    <AreaChart {...commonProps} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                        <defs>
                            <linearGradient id="nlqGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12 }} />
                        <Area type="monotone" dataKey={yKey} stroke="#6366f1" strokeWidth={3} fill={chartType === 'area' ? 'url(#nlqGrad)' : 'none'} dot={{ fill: '#6366f1', r: 4 }} />
                    </AreaChart>
                ) : chartType === 'pie' ? (
                    <PieChart>
                        <Pie data={queryData.slice(0, 8)} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={3}>
                            {queryData.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12 }} />
                    </PieChart>
                ) : (
                    <BarChart {...commonProps} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} angle={-35} textAnchor="end" height={55} />
                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12 }} />
                        <Bar dataKey={yKey} radius={[6, 6, 0, 0]}>
                            {queryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                )}
            </ResponsiveContainer>
        );
    };

    const chartIcon = (type: string) => {
        if (type === 'table') return <Table2 size={14} />;
        if (type === 'line' || type === 'area') return <TrendingUp size={14} />;
        return <BarChart3 size={14} />;
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[9999] flex items-start justify-center pt-[8vh]"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -24, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        width: '100%',
                        maxWidth: '780px',
                        margin: '0 16px',
                        borderRadius: '24px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.2), 0 0 60px rgba(99,102,241,0.1)',
                        overflow: 'hidden',
                        maxHeight: '82vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* ── Header / Input ── */}
                    <div style={{
                        padding: '0 20px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
                    }}>
                        {/* Top label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 0 10px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '4px 10px', borderRadius: 99,
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.25)',
                                color: '#818cf8', fontSize: 10, fontWeight: 900,
                                textTransform: 'uppercase', letterSpacing: '0.15em'
                            }}>
                                <BrainCircuit size={12} />
                                NL Query Engine
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                                {data.length.toLocaleString()} rows · {Object.keys(schema).length} columns
                            </span>
                            <button onClick={onClose} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 28, height: 28, borderRadius: 8,
                                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                cursor: 'pointer', color: 'var(--text-secondary)'
                            }}>
                                <X size={14} />
                            </button>
                        </div>

                        {/* Input form */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                flex: 1, padding: '12px 16px',
                                borderRadius: 16,
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-default)',
                            }}>
                                {isLoading
                                    ? <Loader2 size={18} style={{ color: '#6366f1', flexShrink: 0 }} className="animate-spin" />
                                    : <Sparkles size={18} style={{ color: '#6366f1', flexShrink: 0 }} />
                                }
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder='Ask anything about your data… e.g. "Show me top 10 products by revenue"'
                                    style={{
                                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                        color: 'var(--text-primary)', fontSize: 15, fontWeight: 500,
                                    }}
                                    disabled={isLoading}
                                />
                                {query && (
                                    <button type="button" onClick={() => { setQuery(''); setNlqResult(null); setShowExamples(true); }} style={{ color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={!query.trim() || isLoading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '12px 20px', borderRadius: 14,
                                    background: query.trim() && !isLoading ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'var(--bg-surface)',
                                    color: query.trim() && !isLoading ? '#fff' : 'var(--text-tertiary)',
                                    border: '1px solid ' + (query.trim() && !isLoading ? 'transparent' : 'var(--border-subtle)'),
                                    cursor: query.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                    fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    boxShadow: query.trim() && !isLoading ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
                                }}
                            >
                                <Zap size={15} />
                                Analyse
                            </button>
                        </form>
                    </div>

                    {/* ── Content Area ── */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

                        {/* Example queries */}
                        {showExamples && !isLoading && !nlqResult && (
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 12 }}>Example Queries</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {EXAMPLE_QUERIES.map((eq, i) => (
                                        <button key={i} onClick={() => { setQuery(eq); runQuery(eq); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '10px 14px', borderRadius: 12, textAlign: 'left',
                                                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                                cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                                                transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'); (e.currentTarget.style.color = 'var(--text-primary)'); }}
                                            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border-subtle)'); (e.currentTarget.style.color = 'var(--text-secondary)'); }}
                                        >
                                            <Search size={13} style={{ color: '#6366f1', flexShrink: 0 }} />
                                            {eq}
                                            <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                                        </button>
                                    ))}
                                </div>
                                {/* Schema preview */}
                                <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 10 }}>Dataset Columns Available</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {Object.entries(schema).map(([col, type]) => (
                                            <span key={col} onClick={() => { setQuery(prev => prev + (prev ? ' ' : '') + col); inputRef.current?.focus(); }}
                                                style={{
                                                    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                                    background: type === 'number' ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.1)',
                                                    color: type === 'number' ? '#34d399' : '#818cf8',
                                                    border: `1px solid ${type === 'number' ? 'rgba(52,211,153,0.2)' : 'rgba(99,102,241,0.2)'}`,
                                                    cursor: 'pointer'
                                                }}>
                                                {col} <span style={{ opacity: 0.5 }}>{type}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading state */}
                        {isLoading && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: 60, height: 60, borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        <BrainCircuit size={28} style={{ color: '#6366f1' }} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Intelligence Engine Processing</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Translating your query into SQL & selecting the best visualization…</p>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {queryError && !isLoading && (
                            <div style={{
                                padding: 16, borderRadius: 14, marginBottom: 16,
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                color: '#ef4444', fontSize: 13
                            }}>
                                <strong>Error:</strong> {queryError}
                            </div>
                        )}

                        {/* Results */}
                        {nlqResult && !isLoading && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Result header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '5px 12px', borderRadius: 99,
                                        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                                        color: '#34d399', fontSize: 11, fontWeight: 700
                                    }}>
                                        {chartIcon(nlqResult.chartType)}
                                        {nlqResult.chartType.toUpperCase()} · {queryData.length} rows
                                    </div>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{nlqResult.chartTitle}</h3>
                                </div>

                                {/* Chart */}
                                {queryData.length > 0 && nlqResult.chartType !== 'table' && (
                                    <div style={{
                                        padding: '20px 16px 8px',
                                        borderRadius: 16, background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-subtle)'
                                    }}>
                                        {renderChart()}
                                    </div>
                                )}

                                {/* Table */}
                                {queryData.length > 0 && (nlqResult.chartType === 'table' || true) && (
                                    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                        <div style={{ overflowX: 'auto', maxHeight: 300 }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-surface)', position: 'sticky', top: 0 }}>
                                                        {Object.keys(queryData[0] || {}).map(k => (
                                                            <th key={k} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                {k}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {queryData.slice(0, 50).map((row, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                                            {Object.values(row).map((v: any, j) => (
                                                                <td key={j} style={{ padding: '9px 14px', color: 'var(--text-primary)', fontFamily: typeof v === 'number' ? 'var(--font-mono)' : 'inherit', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {typeof v === 'number' ? v.toLocaleString() : String(v ?? '')}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {queryData.length > 50 && (
                                            <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                                                Showing 50 of {queryData.length} results
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* SQL + Interpretation */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {/* Interpretation */}
                                    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#818cf8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            <Lightbulb size={12} /> Interpretation
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                            {nlqResult.interpretation}
                                        </p>
                                    </div>
                                    {/* Generated SQL */}
                                    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#34d399', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            <RefreshCw size={12} /> Generated SQL
                                        </div>
                                        <code style={{ fontSize: 11, color: '#34d399', fontFamily: 'var(--font-mono)', lineHeight: 1.6, wordBreak: 'break-all' }}>
                                            {nlqResult.sql}
                                        </code>
                                    </div>
                                </div>

                                {/* Follow-up suggestions */}
                                {nlqResult.suggestions && nlqResult.suggestions.length > 0 && (
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 10 }}>Follow-up Questions</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {nlqResult.suggestions.map((s, i) => (
                                                <button key={i} onClick={() => { setQuery(s); runQuery(s); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10,
                                                        padding: '9px 14px', borderRadius: 10, textAlign: 'left',
                                                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                                        cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'); (e.currentTarget.style.color = 'var(--text-primary)'); }}
                                                    onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border-subtle)'); (e.currentTarget.style.color = 'var(--text-secondary)'); }}
                                                >
                                                    <Sparkles size={12} style={{ color: '#6366f1', flexShrink: 0 }} />
                                                    {s}
                                                    <ArrowRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div style={{
                        padding: '10px 20px',
                        borderTop: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                        display: 'flex', alignItems: 'center', gap: 12,
                        fontSize: 11, color: 'var(--text-tertiary)'
                    }}>
                        <kbd style={{ padding: '2px 6px', borderRadius: 5, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>↑↓</kbd>
                        <span>History</span>
                        <kbd style={{ padding: '2px 6px', borderRadius: 5, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>Enter</kbd>
                        <span>Run</span>
                        <kbd style={{ padding: '2px 6px', borderRadius: 5, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>Esc</kbd>
                        <span>Close</span>
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={10} style={{ color: '#6366f1' }} />
                            Powered by Nexus AI
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default NLQueryBar;
