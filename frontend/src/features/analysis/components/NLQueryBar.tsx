import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import alasql from 'alasql';
import { useAuth } from '../../../contexts/AuthContext';
import { API_URL } from '../../../config';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area,
    PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
    Sparkles, Search, X, Loader2, BarChart3, TrendingUp,
    Table2, ArrowRight, Lightbulb, ChevronRight, Zap,
    BrainCircuit, RefreshCw, Clock, Copy, Check,
    ChevronDown, ChevronUp, Play, MessageSquare, Send,
    Download, Maximize2, Filter, Hash, Type, ArrowUp
} from 'lucide-react';
import { WorldMapChart } from './WorldMapChart';

// ─── Constants ───────────────────────────────────────────────────
const CHART_PALETTE = [
    '#6366f1', '#34d399', '#f472b6', '#fbbf24', '#38bdf8',
    '#a78bfa', '#fb923c', '#22d3ee', '#e879f9', '#4ade80'
];

const GRADIENT_PAIRS: Record<string, [string, string]> = {
    bar: ['#6366f1', '#818cf8'],
    line: ['#34d399', '#6ee7b7'],
    area: ['#8b5cf6', '#a78bfa'],
    pie: ['#ec4899', '#f472b6'],
    scatter: ['#f59e0b', '#fbbf24'],
    table: ['#06b6d4', '#22d3ee'],
    worldmap: ['#3b82f6', '#8b5cf6'],
};

// ─── Types ───────────────────────────────────────────────────────
interface NLQResult {
    sql: string;
    chartType: string;
    chartTitle: string;
    xAxis?: string;
    yAxis?: string;
    interpretation: string;
    suggestions?: string[];
    followUpQuestions?: string[];
    data?: any[];
    sqlError?: string;
}

interface ConversationEntry {
    id: string;
    query: string;
    result: NLQResult | null;
    data: any[];
    error: string | null;
    timestamp: Date;
    isLoading?: boolean;
}

interface NLQueryBarProps {
    data?: any[];
    datasetId?: string;
    schema: Record<string, string>;
    isOpen?: boolean;
    onClose?: () => void;
    inline?: boolean;
}

// ─── Custom Tooltip ──────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-default)', borderRadius: 14,
            padding: '12px 16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{p.name || p.dataKey}:</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Skeleton Loader ─────────────────────────────────────────────
const ResultSkeleton = () => (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, animation: 'pulse 1.5s infinite' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)' }} />
            <div style={{ flex: 1 }}>
                <div style={{ width: '40%', height: 14, borderRadius: 6, background: 'var(--border-default)', marginBottom: 6 }} />
                <div style={{ width: '25%', height: 10, borderRadius: 6, background: 'var(--bg-surface-hover)' }} />
            </div>
        </div>
        <div style={{ width: '100%', height: 220, borderRadius: 16, background: 'var(--bg-surface)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ height: 80, borderRadius: 12, background: 'var(--bg-surface)' }} />
            <div style={{ height: 80, borderRadius: 12, background: 'var(--bg-surface)' }} />
        </div>
    </div>
);

// ─── Main Component ──────────────────────────────────────────────
export const NLQueryBar = ({ data = [], datasetId, schema, isOpen, onClose, inline = false }: NLQueryBarProps) => {
    const { token } = useAuth();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState('');
    const [conversation, setConversation] = useState<ConversationEntry[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    // Smart example queries based on actual schema
    const smartExamples = useMemo(() => {
        const cols = Object.entries(schema);
        const numCols = cols.filter(([, t]) => t === 'number').map(([n]) => n);
        const strCols = cols.filter(([, t]) => t !== 'number').map(([n]) => n);
        const examples: string[] = [];

        if (numCols.length > 0 && strCols.length > 0) {
            examples.push(`Show me the total ${numCols[0]} by ${strCols[0]}`);
            examples.push(`What are the top 10 ${strCols[0]} by ${numCols[0]}?`);
        }
        if (numCols.length >= 2) {
            examples.push(`What's the average ${numCols[1] || numCols[0]} across all records?`);
            examples.push(`Compare ${numCols[0]} and ${numCols[1] || numCols[0]} over time`);
        }
        if (strCols.length > 0) {
            examples.push(`How many records are there per ${strCols[0]}?`);
        }
        examples.push(`Show me all records where ${numCols[0] || strCols[0]} is above average`);
        examples.push(`Give me a summary of the entire dataset`);
        return examples.slice(0, 6);
    }, [schema]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [conversation]);

    // Focus on mount (inline mode)
    useEffect(() => {
        if (inline) setTimeout(() => inputRef.current?.focus(), 200);
    }, [inline]);

    const runQuery = useCallback(async (q: string) => {
        if (!q.trim()) return;
        if (!datasetId && (!data || data.length === 0)) return;

        const entryId = `q-${Date.now()}`;
        const entry: ConversationEntry = {
            id: entryId, query: q, result: null, data: [],
            error: null, timestamp: new Date(), isLoading: true
        };

        setConversation(prev => [...prev, entry]);
        setQuery('');

        // Build sample values for AI context
        const sampleValues: Record<string, any[]> = {};
        if (data && data.length > 0) {
            Object.keys(schema).forEach(col => {
                sampleValues[col] = [...new Set(data.slice(0, 100).map(r => r[col]).filter(v => v != null))].slice(0, 8);
            });
        }

        try {
            const response = await fetch(`${API_URL}/api/ai/nlq`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ query: q, schema, sampleValues, datasetId })
            });

            if (!response.ok) throw new Error('AI service unavailable — check your API key');
            const result = await response.json();
            if (result.error) throw new Error(result.error);

            // Normalize suggestions/followUpQuestions
            const nlqResult: NLQResult = {
                ...result,
                suggestions: result.suggestions || result.followUpQuestions || [],
            };

            // Execute SQL
            let queryData: any[] = [];
            let sqlError: string | null = null;

            if (nlqResult.data && nlqResult.data.length > 0) {
                // Backend ClickHouse execution returned real data
                queryData = nlqResult.data;
                sqlError = nlqResult.sqlError || null;
            } else {
                // Local fallback execution for in-memory uploads
                try {
                    // Critical: Coerce numeric-looking string values to real JS numbers.
                    // CSV parsers often return everything as strings ("774.12" not 774.12).
                    // AlaSQL's SUM/AVG/COUNT silently return null on string values.
                    const typedData = (data || []).map((row: any) => {
                        const typed: any = {};
                        for (const [key, val] of Object.entries(row)) {
                            if (val === null || val === undefined || val === '') {
                                typed[key] = val;
                            } else if (typeof val === 'string') {
                                const stripped = val.replace(/[$€£,\s%]/g, '');
                                if (stripped !== '' && !isNaN(Number(stripped)) && isFinite(Number(stripped))) {
                                    typed[key] = Number(stripped);
                                } else {
                                    typed[key] = val;
                                }
                            } else {
                                typed[key] = val;
                            }
                        }
                        return typed;
                    });

                    const sqlResult = alasql(nlqResult.sql, [typedData]);
                    queryData = Array.isArray(sqlResult) ? sqlResult : [];
                } catch (e: any) {
                    sqlError = `SQL Error: ${e.message}`;
                }
            }

            setConversation(prev => prev.map(e =>
                e.id === entryId ? { ...e, result: nlqResult, data: queryData, error: sqlError, isLoading: false } : e
            ));
        } catch (err: any) {
            setConversation(prev => prev.map(e =>
                e.id === entryId ? { ...e, error: err.message || 'Failed to process', isLoading: false } : e
            ));
        }
    }, [data, datasetId, schema, token]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (query.trim()) runQuery(query.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const copySQL = (sql: string, id: string) => {
        navigator.clipboard.writeText(sql);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleCard = (id: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ─── Chart Renderer ──────────────────────────────────────────
    const renderChart = (entry: ConversationEntry) => {
        if (!entry.result || !entry.data.length) return null;
        const { chartType, xAxis, yAxis } = entry.result;
        const keys = Object.keys(entry.data[0] || {});

        // Robust key matching (ignores case/underscores from AI mapping)
        const findKey = (suggested?: string, defaultIdx: number = 0) => {
            if (!suggested) return keys[defaultIdx] || 'value';
            const match = keys.find(k => k.toLowerCase() === suggested.toLowerCase() || k.replace(/_/g, '').toLowerCase() === suggested.replace(/_/g, '').toLowerCase());
            return match || suggested; // Fallback to suggested if match fails (AlaSQL often creates aliased cols matching suggested exactly)
        };

        const xKey = findKey(xAxis, 0);
        const yKey = findKey(yAxis, 1);
        const displayData = entry.data.slice(0, 60);
        const [g1, g2] = GRADIENT_PAIRS[chartType] || GRADIENT_PAIRS.bar;
        const gradId = `grad-${entry.id}`;

        if (chartType === 'table') return null;

        // World Map chart — render directly without ResponsiveContainer
        if (chartType === 'worldmap') {
            const mapData = displayData.map((d: any) => ({
                name: d[xKey] || d.name || d.country || d.city || d.region || '',
                value: parseFloat(d[yKey] || d.value || d.count || 0) || 0
            }));
            return (
                <div style={{
                    borderRadius: 18, overflow: 'hidden',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    width: '100%',
                    height: '400px',
                    minHeight: '400px'
                }}>
                    <WorldMapChart data={mapData} title={entry.result?.chartTitle || 'Geospatial Intelligence'} />
                </div>
            );
        }

        return (
            <div style={{
                borderRadius: 18, overflow: 'hidden',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                padding: '16px 12px 4px',
                width: '100%',
                height: '280px',
                minHeight: '280px'
            }}>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'pie' ? (
                        <PieChart>
                            <Pie
                                data={displayData.slice(0, 10)}
                                dataKey={yKey} nameKey={xKey}
                                cx="50%" cy="50%"
                                outerRadius="85%" innerRadius="55%"
                                paddingAngle={3} stroke="rgba(0,0,0,0.3)" strokeWidth={2}
                            >
                                {displayData.slice(0, 10).map((_, i) => (
                                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                    ) : chartType === 'scatter' ? (
                        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface-hover)' />
                            <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.12)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis dataKey={yKey} stroke="rgba(255,255,255,0.12)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <ZAxis range={[40, 200]} />
                            <Tooltip content={<ChartTooltip />} />
                            <Scatter data={displayData} fill="#6366f1" fillOpacity={0.7} />
                        </ScatterChart>
                    ) : chartType === 'line' || chartType === 'area' ? (
                        <AreaChart data={displayData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={g1} stopOpacity={chartType === 'area' ? 0.35 : 0} />
                                    <stop offset="95%" stopColor={g1} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface-hover)' vertical={false} />
                            <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.12)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis stroke="rgba(255,255,255,0.12)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : v} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey={yKey} stroke={g1} strokeWidth={3} fill={`url(#${gradId})`} dot={{ fill: g1, r: 3, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                    ) : (
                        <BarChart data={displayData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                            <defs>
                                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={g1} stopOpacity={1} />
                                    <stop offset="100%" stopColor={g2} stopOpacity={0.5} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke='var(--bg-surface-hover)' vertical={false} />
                            <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.12)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-35} textAnchor="end" height={50} interval={0} />
                            <YAxis stroke="rgba(255,255,255,0.12)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : v} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-surface)' }} />
                            <Bar dataKey={yKey} fill={`url(#${gradId})`} radius={[6, 6, 0, 0]} barSize={displayData.length > 20 ? 14 : 28} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        );
    };

    // ─── Table Renderer ──────────────────────────────────────────
    const renderTable = (entry: ConversationEntry) => {
        if (!entry.data.length) return null;
        const cols = Object.keys(entry.data[0]);
        const isExpanded = expandedCards.has(`table-${entry.id}`);
        const showRows = isExpanded ? entry.data.slice(0, 100) : entry.data.slice(0, 8);

        return (
            <div style={{
                borderRadius: 14, overflow: 'hidden',
                border: '1px solid var(--border-default)',
            }}>
                <div style={{ overflowX: 'auto', maxHeight: isExpanded ? 500 : 280 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr>
                                {cols.map(c => (
                                    <th key={c} style={{
                                        padding: '10px 14px', textAlign: 'left',
                                        fontWeight: 800, fontSize: 10, textTransform: 'uppercase',
                                        letterSpacing: '0.08em', color: 'var(--text-tertiary)',
                                        borderBottom: '1px solid var(--border-default)',
                                        background: 'var(--bg-surface)',
                                        position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap',
                                    }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            {typeof entry.data[0]?.[c] === 'number'
                                                ? <Hash size={10} style={{ opacity: 0.4 }} />
                                                : <Type size={10} style={{ opacity: 0.4 }} />
                                            }
                                            {c}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {showRows.map((row, i) => (
                                <tr key={i} style={{ transition: 'background 0.1s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    {cols.map(c => (
                                        <td key={c} style={{
                                            padding: '8px 14px',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            color: 'var(--text-primary)',
                                            fontFamily: typeof row[c] === 'number' ? 'var(--font-mono)' : 'inherit',
                                            fontWeight: typeof row[c] === 'number' ? 600 : 400,
                                            whiteSpace: 'nowrap', maxWidth: 200,
                                            overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {typeof row[c] === 'number'
                                                ? row[c].toLocaleString(undefined, { maximumFractionDigits: 2 })
                                                : String(row[c] ?? '—')
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {entry.data.length > 8 && (
                    <button onClick={() => toggleCard(`table-${entry.id}`)} style={{
                        width: '100%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'var(--bg-surface)', border: 'none', borderTop: '1px solid var(--border-default)',
                        color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'color 0.15s',
                    }}>
                        {isExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all {entry.data.length} rows</>}
                    </button>
                )}
            </div>
        );
    };

    // ─── Render ──────────────────────────────────────────────────
    const content = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

            {/* ── Conversation Area ── */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 24px 16px', scrollBehavior: 'smooth' }}>

                {/* Empty State */}
                {conversation.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ paddingTop: 20 }}
                    >
                        {/* Hero */}
                        <div style={{
                            textAlign: 'center', padding: '36px 20px 28px',
                            borderRadius: 24,
                            background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
                            border: '1px solid rgba(99,102,241,0.1)',
                            marginBottom: 24, position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.5) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 64, height: 64, borderRadius: 20,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                boxShadow: '0 12px 32px rgba(99,102,241,0.3)',
                                marginBottom: 16,
                            }}>
                                <BrainCircuit size={32} color="#fff" />
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px' }}>Ask Your Data Anything</h2>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
                                Type a question in plain English. The AI interprets your intent, writes the query, executes it {datasetId ? "natively on ClickHouse" : `on ${data.length.toLocaleString()} rows`}, and picks the perfect visualization.
                            </p>
                        </div>

                        {/* Smart example queries */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 10, paddingLeft: 4 }}>
                                Try asking
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                                {smartExamples.map((eq, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => { setQuery(eq); runQuery(eq); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '11px 14px', borderRadius: 13, textAlign: 'left',
                                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
                                    >
                                        <Sparkles size={13} style={{ color: '#6366f1', flexShrink: 0 }} />
                                        <span style={{ flex: 1 }}>{eq}</span>
                                        <ArrowRight size={12} style={{ opacity: 0.3, flexShrink: 0 }} />
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Schema chips */}
                        <div style={{
                            padding: '14px 16px', borderRadius: 16,
                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                        }}>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                                Available columns ({Object.keys(schema).length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {Object.entries(schema).map(([col, type]) => (
                                    <span key={col}
                                        onClick={() => { setQuery(prev => prev + (prev.endsWith(' ') || !prev ? '' : ' ') + col); inputRef.current?.focus(); }}
                                        style={{
                                            padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                            background: type === 'number' ? 'rgba(52,211,153,0.08)' : 'rgba(99,102,241,0.08)',
                                            color: type === 'number' ? '#34d399' : '#818cf8',
                                            border: `1px solid ${type === 'number' ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)'}`,
                                            cursor: 'pointer', transition: 'opacity 0.15s',
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                        }}
                                    >
                                        {type === 'number' ? <Hash size={10} /> : <Type size={10} />}
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Conversation Thread ── */}
                <AnimatePresence>
                    {conversation.map((entry, idx) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ marginTop: idx === 0 ? 20 : 24 }}
                        >
                            {/* User query bubble */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                                <div style={{
                                    maxWidth: '75%', padding: '12px 18px',
                                    borderRadius: '18px 18px 4px 18px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, lineHeight: 1.5,
                                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                                }}>
                                    {entry.query}
                                </div>
                            </div>

                            {/* AI response */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10, flexShrink: 0, marginTop: 2,
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <BrainCircuit size={16} style={{ color: '#818cf8' }} />
                                </div>

                                {/* Response body */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {entry.isLoading ? (
                                        <ResultSkeleton />
                                    ) : entry.error ? (
                                        <div style={{
                                            padding: '14px 18px', borderRadius: 16,
                                            background: 'rgba(239,68,68,0.06)',
                                            border: '1px solid rgba(239,68,68,0.15)',
                                            color: '#ef4444', fontSize: 13, lineHeight: 1.5
                                        }}>
                                            <strong style={{ fontWeight: 800 }}>Error:</strong> {entry.error}
                                        </div>
                                    ) : entry.result && (
                                        <div style={{
                                            borderRadius: 20, overflow: 'hidden',
                                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                        }}>
                                            {/* Result header */}
                                            <div style={{
                                                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                                                borderBottom: '1px solid var(--border-default)',
                                                background: 'var(--bg-surface)',
                                            }}>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    padding: '3px 10px', borderRadius: 99,
                                                    background: `rgba(${entry.result.chartType === 'pie' ? '236,72,153' : entry.result.chartType === 'line' || entry.result.chartType === 'area' ? '52,211,153' : '99,102,241'}, 0.1)`,
                                                    border: `1px solid rgba(${entry.result.chartType === 'pie' ? '236,72,153' : entry.result.chartType === 'line' || entry.result.chartType === 'area' ? '52,211,153' : '99,102,241'}, 0.2)`,
                                                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                                                    color: entry.result.chartType === 'pie' ? '#ec4899' : entry.result.chartType === 'line' || entry.result.chartType === 'area' ? '#34d399' : '#818cf8'
                                                }}>
                                                    {entry.result.chartType === 'table' ? <Table2 size={11} /> : entry.result.chartType === 'line' || entry.result.chartType === 'area' ? <TrendingUp size={11} /> : <BarChart3 size={11} />}
                                                    {entry.result.chartType}
                                                </div>
                                                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0, flex: 1 }}>{entry.result.chartTitle}</h3>
                                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{entry.data.length} rows</span>
                                            </div>

                                            {/* Chart */}
                                            {entry.data.length > 0 && entry.result.chartType !== 'table' && (
                                                <div style={{ padding: '12px 8px 4px' }}>
                                                    {renderChart(entry)}
                                                </div>
                                            )}

                                            {/* Table */}
                                            {entry.data.length > 0 && (
                                                <div style={{ padding: entry.result.chartType === 'table' ? '12px' : '0 12px 12px' }}>
                                                    {renderTable(entry)}
                                                </div>
                                            )}

                                            {/* Interpretation + SQL */}
                                            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {/* Interpretation */}
                                                <div style={{
                                                    padding: '12px 16px', borderRadius: 14,
                                                    background: 'rgba(99,102,241,0.05)',
                                                    border: '1px solid rgba(99,102,241,0.1)',
                                                    display: 'flex', gap: 10,
                                                }}>
                                                    <Lightbulb size={15} style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
                                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                                        {entry.result.interpretation}
                                                    </p>
                                                </div>

                                                {/* SQL */}
                                                <div style={{
                                                    padding: '10px 14px', borderRadius: 12,
                                                    background: 'var(--bg-surface)',
                                                    border: '1px solid var(--border-subtle)',
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                }}>
                                                    <code style={{ flex: 1, fontSize: 11, color: '#34d399', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                                        {entry.result.sql}
                                                    </code>
                                                    <button onClick={() => copySQL(entry.result!.sql, entry.id)} style={{
                                                        display: 'flex', padding: 4, borderRadius: 6, border: 'none',
                                                        background: 'transparent', cursor: 'pointer',
                                                        color: copiedId === entry.id ? '#34d399' : 'var(--text-tertiary)',
                                                    }}>
                                                        {copiedId === entry.id ? <Check size={13} /> : <Copy size={13} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Follow-up suggestions */}
                                            {entry.result.suggestions && entry.result.suggestions.length > 0 && (
                                                <div style={{ padding: '0 16px 16px' }}>
                                                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 8 }}>Follow-up</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                        {entry.result.suggestions.map((s, i) => (
                                                            <button key={i} onClick={() => { setQuery(s); runQuery(s); }}
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                                    padding: '7px 12px', borderRadius: 10,
                                                                    background: 'transparent', border: '1px solid var(--border-subtle)',
                                                                    cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
                                                                    transition: 'all 0.15s',
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#818cf8'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                                            >
                                                                <Sparkles size={10} style={{ color: '#6366f1' }} />
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ── Input Area (always visible at bottom) ── */}
            <div style={{
                padding: '12px 24px 16px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
            }}>
                <form onSubmit={handleSubmit} style={{
                    display: 'flex', alignItems: 'flex-end', gap: 10,
                    padding: '10px 14px',
                    borderRadius: 18,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                    <BrainCircuit size={18} style={{ color: '#6366f1', flexShrink: 0, marginBottom: 6 }} />
                    <textarea
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder='Ask your data anything… e.g. "What product generates the most revenue?"'
                        rows={1}
                        disabled={conversation.some(e => e.isLoading)}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
                            resize: 'none', lineHeight: 1.5, maxHeight: 120,
                            fontFamily: 'inherit',
                        }}
                        onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || conversation.some(e => e.isLoading)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                            background: query.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-surface-hover)',
                            color: query.trim() ? '#fff' : 'var(--text-tertiary)',
                            border: 'none', cursor: query.trim() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            boxShadow: query.trim() ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                        }}
                    >
                        {conversation.some(e => e.isLoading)
                            ? <Loader2 size={16} className="animate-spin" />
                            : <ArrowUp size={16} />
                        }
                    </button>
                </form>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '0 4px', fontSize: 11, color: 'var(--text-tertiary)' }}>
                    <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 9 }}>Enter</kbd>
                    <span>Send</span>
                    <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 9 }}>Shift+Enter</kbd>
                    <span>New line</span>
                    {conversation.length > 0 && (
                        <button onClick={() => setConversation([])} style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 6, background: 'transparent',
                            border: '1px solid var(--border-subtle)', cursor: 'pointer',
                            color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600,
                        }}>
                            <RefreshCw size={10} /> Clear
                        </button>
                    )}
                    <span style={{ marginLeft: conversation.length > 0 ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles size={9} style={{ color: '#6366f1' }} /> Powered by Nexus AI
                    </span>
                </div>
            </div>
        </div>
    );

    // Inline mode: render directly
    if (inline) return content;

    // Modal mode (legacy support)
    if (!isOpen) return null;
    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div style={{
                width: '100%', maxWidth: 800, maxHeight: '85vh',
                borderRadius: 24, overflow: 'hidden',
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column',
            }}>
                {content}
            </div>
        </div>
    );
};

export default NLQueryBar;
