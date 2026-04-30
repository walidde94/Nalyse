import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, TrendingUp, Target, MessageSquare, ArrowRight, BarChart3,
    Database, ShieldCheck, Globe, Activity, Layers, Download, Filter,
    Share2, Layout, Users, Zap, Eye, Search, ChevronDown, ChevronUp,
    Maximize2, PieChart as PieChartIcon, LineChart, BarChart2, ScatterChart,
    AlertTriangle, CheckCircle2, Info, ArrowUpRight, ArrowDownRight,
    Cpu, Brain, Lightbulb, Clock, Hash, Type, Calendar, Percent,
    DollarSign, MapPin, Mail, Phone, ToggleLeft, Link2, FileText,
    RefreshCw, Command, Play, X, GripVertical, Plus, Minus
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, ScatterChart as RechartsScatter,
    Scatter, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useToast } from '../../components/ui/Toast';
import { useLanguage } from '../../contexts/LanguageContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StudioProps {
    files: any[];
    token: string;
    apiUrl: string;
    userPlan?: string;
    runWithProgress?: (fn: () => Promise<void | { type: string; title: string; data: any }>) => Promise<void>;
}

interface ColumnInfo {
    name: string;
    type: string;
    stats?: any;
    health?: { completeness: number; uniqueness: number; entropy?: number };
}

interface ChartWidget {
    id: string;
    title: string;
    chartType: string;
    data: any[];
    description?: string;
    priority?: number;
}

interface InsightItem {
    id: string;
    type: string;
    description: string;
    confidence: number;
    severity?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CHART_COLORS = ['#34d399', '#38bdf8', '#818cf8', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#22d3ee'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
    number: <Hash size={12} />, currency: <DollarSign size={12} />, percent: <Percent size={12} />,
    date: <Calendar size={12} />, category: <Layers size={12} />, text: <Type size={12} />,
    email: <Mail size={12} />, boolean: <ToggleLeft size={12} />, url: <Link2 size={12} />,
    phone: <Phone size={12} />, country: <Globe size={12} />, city: <MapPin size={12} />,
    id: <Hash size={12} />, coordinate: <MapPin size={12} />,
};

const CHART_TYPE_ICONS: Record<string, React.ReactNode> = {
    bar: <BarChart2 size={14} />, area: <LineChart size={14} />, line: <LineChart size={14} />,
    pie: <PieChartIcon size={14} />, scatter: <ScatterChart size={14} />,
};

// ─── Tooltip Component ──────────────────────────────────────────────────────

const StudioTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(10,10,18,0.95)', border: '1px solid rgba(99,102,241,0.3)', padding: '10px 14px', borderRadius: '10px', backdropFilter: 'blur(12px)', fontSize: '12px' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '10px' }}>{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ color: p.color || '#34d399', fontWeight: 700 }}>
                    {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
                </div>
            ))}
        </div>
    );
};

// ─── Chart Renderer ─────────────────────────────────────────────────────────

const RenderChart = ({ widget, height = 220 }: { widget: ChartWidget; height?: number }) => {
    const { t: translate } = useLanguage();
    const type = widget.chartType === 'line' ? 'area' : widget.chartType;
    const data = widget.data || [];
    if (!data.length) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: '12px' }}>{translate('studio.noData')}</div>;

    return (
        <ResponsiveContainer width="100%" height={height}>
            {type === 'pie' ? (
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={height * 0.22} outerRadius={height * 0.38} paddingAngle={3} dataKey="value" stroke="none">
                        {data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<StudioTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
            ) : type === 'scatter' ? (
                <RechartsScatter data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke='var(--border-default)' />
                    <XAxis dataKey="x" stroke='var(--text-disabled)' fontSize={10} />
                    <YAxis dataKey="y" stroke='var(--text-disabled)' fontSize={10} />
                    <Tooltip content={<StudioTooltip />} />
                    <Scatter dataKey="y" fill="#818cf8" fillOpacity={0.7} />
                </RechartsScatter>
            ) : type === 'area' ? (
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke='var(--border-default)' vertical={false} />
                    <XAxis dataKey="name" stroke='var(--text-disabled)' fontSize={9} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis stroke='var(--text-disabled)' fontSize={9} axisLine={false} tickLine={false} width={45} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                    <Tooltip content={<StudioTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.5} fill={`url(#grad-${widget.id})`} />
                </AreaChart>
            ) : (
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke='var(--border-default)' vertical={false} />
                    <XAxis dataKey="name" stroke='var(--text-disabled)' fontSize={9} axisLine={false} tickLine={false} interval={0} angle={data.length > 6 ? -35 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 60 : 30} />
                    <YAxis stroke='var(--text-disabled)' fontSize={9} axisLine={false} tickLine={false} width={45} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                    <Tooltip content={<StudioTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={Math.min(40, Math.max(12, 300 / data.length))}>
                        {data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />)}
                    </Bar>
                </BarChart>
            )}
        </ResponsiveContainer>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export const SelfServiceStudio = ({ files, token, apiUrl, userPlan, runWithProgress }: StudioProps) => {
    const { addToast } = useToast();
    const { t: translate } = useLanguage();

    // Pro gate
    if (userPlan === 'free') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="card text-center flex-col items-center gap-6 premium-highlight-card" style={{ maxWidth: '440px', padding: '48px', position: 'relative', overflow: 'hidden' }}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"></div>
                    <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <Sparkles size={40} />
                    </div>
                    <h2 className="text-h1">{translate('studio.title')}</h2>
                    <p className="text-sec">{translate('studio.pro.desc')}</p>
                    <button className="btn btn-primary btn-lg w-full glow-btn" onClick={() => (window as any).dispatchEvent(new CustomEvent('navigate-to-settings', { detail: { initialTab: 'subscription' } }))}>
                        <span className="shimmer-text">{translate('pricing.upgradePro')}</span>
                    </button>
                </div>
            </div>
        );
    }

    // ─── State ──────────────────────────────────────────────────────────────
    const [selectedFileId, setSelectedFileId] = useState('');
    const [activeAnalysis, setActiveAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [activeView, setActiveView] = useState<'explorer' | 'schema' | 'insights' | 'charts'>('explorer');
    const [expandedChart, setExpandedChart] = useState<string | null>(null);
    const [selectedInsightType, setSelectedInsightType] = useState<string>('all');
    const [schemaSearch, setSchemaSearch] = useState('');
    const [pinnedCharts, setPinnedCharts] = useState<Set<string>>(new Set());
    const [chartLayout, setChartLayout] = useState<'grid' | 'list'>('grid');

    const activeFile = files.find((f: any) => f.id === selectedFileId);

    // ─── Data Derivation ────────────────────────────────────────────────────

    const columns: ColumnInfo[] = useMemo(() => {
        if (!activeAnalysis?.summary?.columnTypes) return [];
        const types = activeAnalysis.summary.columnTypes;
        const stats = activeAnalysis.summary.statistics || {};
        const healths = activeAnalysis.dataHealth?.columnHealth || [];
        return Object.entries(types).map(([name, type]) => ({
            name,
            type: type as string,
            stats: stats[name],
            health: healths.find((h: any) => h.column === name)
        }));
    }, [activeAnalysis]);

    const chartWidgets: ChartWidget[] = useMemo(() => {
        if (!activeAnalysis?.options) return [];
        return activeAnalysis.options.map((opt: any) => ({
            id: opt.id,
            title: opt.title,
            chartType: opt.chartType,
            data: opt.data || [],
            description: opt.description,
            priority: opt.priority || 0
        }));
    }, [activeAnalysis]);

    const allInsights: InsightItem[] = useMemo(() => {
        if (!activeAnalysis?.aiInsights) return [];
        return activeAnalysis.aiInsights;
    }, [activeAnalysis]);

    const filteredInsights = useMemo(() => {
        if (selectedInsightType === 'all') return allInsights;
        return allInsights.filter(i => i.type === selectedInsightType);
    }, [allInsights, selectedInsightType]);

    const metrics = useMemo(() => activeAnalysis?.metrics || [], [activeAnalysis]);

    const filteredColumns = useMemo(() => {
        if (!schemaSearch) return columns;
        const q = schemaSearch.toLowerCase();
        return columns.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q));
    }, [columns, schemaSearch]);

    // ─── Actions ────────────────────────────────────────────────────────────

    const fetchAnalysis = useCallback(async (customQuery?: string) => {
        if (!selectedFileId) return;

        const worker = async () => {
            setIsLoading(true);
            try {
                const url = new URL(`${apiUrl}/api/files/${selectedFileId}/analyze`);
                if (customQuery) url.searchParams.append('q', customQuery);
                
                const res = await fetch(url.toString(), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Analysis failed');
                const data = await res.json();
                setActiveAnalysis(data);
                if (data.cached) {
                    addToast(`${translate('studio.cacheRetrieved')} (${data.id.substring(0, 8)})`, 'success');
                }
                if (customQuery) addToast(`${translate('studio.queryLoaded')} "${customQuery}"`, 'success');
            } catch (e: any) {
                addToast(e.message || translate('common.error'), 'error');
            } finally {
                setIsLoading(false);
            }
        };

        // UI OPTIMIZATION: Only show full-screen overlay if file is not already processed or if it's a new query
        if (runWithProgress && !activeFile?.isProcessed) {
            await runWithProgress(worker);
        } else {
            await worker();
        }
    }, [selectedFileId, token, apiUrl, runWithProgress, addToast, activeFile]);

    React.useEffect(() => { if (selectedFileId && token) fetchAnalysis(); }, [selectedFileId, token]);

    const handleQuery = () => { if (query.trim()) fetchAnalysis(query); };

    const handleExportPDF = async () => {
        const el = document.getElementById('studio-canvas');
        if (!el) return;
        addToast(translate('studio.generatingPDF'), 'info');
        try {
            const canvas = await html2canvas(el, { backgroundColor: '#0a0a0c', scale: 2 });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const w = pdf.internal.pageSize.getWidth();
            const h = (canvas.height * w) / canvas.width;
            pdf.setFillColor(10, 10, 12);
            pdf.rect(0, 0, w, pdf.internal.pageSize.getHeight(), 'F');
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 5, 5, w - 10, h);
            pdf.save(`Nalyse_Studio_${new Date().toISOString().split('T')[0]}.pdf`);
            addToast(translate('studio.pdfExported'), 'success');
        } catch { addToast(translate('studio.pdfFailed'), 'error'); }
    };

    const togglePin = (id: string) => {
        setPinnedCharts(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ─── Render ─────────────────────────────────────────────────────────────

    const insightTypes = useMemo(() => {
        const types = new Set(allInsights.map(i => i.type));
        return ['all', ...Array.from(types)];
    }, [allInsights]);

    const severityIcon = (s?: string) => {
        if (s === 'critical') return <AlertTriangle size={12} style={{ color: '#ef4444' }} />;
        if (s === 'warning') return <AlertTriangle size={12} style={{ color: '#fbbf24' }} />;
        return <Info size={12} style={{ color: '#38bdf8' }} />;
    };

    const sortedCharts = useMemo(() => {
        const pinned = chartWidgets.filter(c => pinnedCharts.has(c.id));
        const unpinned = chartWidgets.filter(c => !pinnedCharts.has(c.id));
        return [...pinned, ...unpinned];
    }, [chartWidgets, pinnedCharts]);

    return (
        <div style={S.container}>
            {/* ── Command Bar ── */}
            <div style={S.commandBar}>
                <div style={S.commandLeft}>
                    <div style={S.logoBox}><Brain size={20} /></div>
                    <div>
                        <h1 style={S.title}>{translate('studio.title')}</h1>
                        <p style={S.subtitle}>{translate('studio.subtitle')}</p>
                    </div>
                </div>
                <div style={S.commandCenter}>
                    <div style={S.datasetPicker}>
                        <Database size={14} style={{ opacity: 0.4 }} />
                        <select value={selectedFileId} onChange={e => setSelectedFileId(e.target.value)} style={S.datasetSelect}>
                            <option value="">{translate('studio.selectDataset')}</option>
                            {files.map((f: any) => <option key={f.id} value={f.id}>{f.originalName || f.filename}</option>)}
                        </select>
                    </div>
                    {activeFile && (
                        <div style={S.connectedBadge}>
                            <div style={S.pulseDot} />
                            <span style={{ fontSize: '10px', fontWeight: 700 }}>{translate('studio.connected').toUpperCase()}</span>
                            {activeAnalysis && (
                                <span style={{ fontSize: '10px', opacity: 0.5, marginLeft: '8px' }}>
                                    {activeAnalysis.summary?.rows?.toLocaleString()} {translate('studio.rows')} × {activeAnalysis.summary?.columns} {translate('studio.cols')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div style={S.commandRight}>
                    <button onClick={() => fetchAnalysis()} style={S.iconBtn} title={translate('studio.refresh')}><RefreshCw size={15} /></button>
                    <button onClick={handleExportPDF} style={S.iconBtn} title={translate('studio.export')}><Download size={15} /></button>
                    <div style={S.securityBadge}><ShieldCheck size={13} /> <span style={{ fontSize: '10px' }}>{translate('studio.encrypted')}</span></div>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            {activeAnalysis && (
                <div style={S.tabBar}>
                    {(['explorer', 'charts', 'schema', 'insights'] as const).map(tabName => (
                        <button key={tabName} onClick={() => setActiveView(tabName)} style={{ ...S.tabBtn, ...(activeView === tabName ? S.tabBtnActive : {}) }}>
                            {tabName === 'explorer' && <Cpu size={13} />}
                            {tabName === 'charts' && <BarChart2 size={13} />}
                            {tabName === 'schema' && <Database size={13} />}
                            {tabName === 'insights' && <Lightbulb size={13} />}
                            <span style={{ textTransform: 'capitalize' }}>{translate(`studio.tab.${tabName}`)}</span>
                            {tabName === 'insights' && allInsights.length > 0 && (
                                <span style={S.tabBadge}>{allInsights.length}</span>
                            )}
                            {tabName === 'charts' && chartWidgets.length > 0 && (
                                <span style={S.tabBadge}>{chartWidgets.length}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Main Content ── */}
            <div id="studio-canvas" style={S.canvas}>
                {!activeAnalysis && !isLoading && (
                    <div style={S.emptyState}>
                        <div style={S.emptyIcon}><Sparkles size={48} /></div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{translate('studio.empty.title')}</h2>
                        <p style={{ fontSize: '13px', opacity: 0.4, maxWidth: '360px', textAlign: 'center', lineHeight: '1.6' }}>
                            {translate('studio.empty.desc')}
                        </p>
                    </div>
                )}

                {isLoading && (
                    <div style={S.emptyState}>
                        <div className="spinner-lg" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                        <p style={{ fontSize: '13px', opacity: 0.5, marginTop: '16px' }}>{translate('studio.analyzing')}</p>
                    </div>
                )}

                {activeAnalysis && !isLoading && (
                    <AnimatePresence mode="wait">
                        {/* ── EXPLORER VIEW ── */}
                        {activeView === 'explorer' && (
                            <motion.div key="explorer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={S.explorerGrid}>
                                {/* Metrics Row */}
                                {metrics.length > 0 && (
                                    <div style={S.metricsRow}>
                                        {metrics.map((m: any, i: number) => (
                                            <div key={i} style={S.metricCard}>
                                                <div style={{ fontSize: '10px', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{m.label}</div>
                                                <div style={{ fontSize: '22px', fontWeight: 800, color: m.color || 'var(--text-primary)' }}>{m.value}</div>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: m.trend?.startsWith('+') ? '#34d399' : m.trend?.startsWith('-') ? '#ef4444' : 'var(--text-tertiary)' }}>
                                                    {m.trend?.startsWith('+') && <ArrowUpRight size={10} style={{ display: 'inline' }} />}
                                                    {m.trend?.startsWith('-') && <ArrowDownRight size={10} style={{ display: 'inline' }} />}
                                                    {' '}{m.trend}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* NLQ Bar */}
                                <div style={S.nlqBar}>
                                    <MessageSquare size={16} style={{ opacity: 0.3, flexShrink: 0 }} />
                                    <input
                                        value={query} onChange={e => setQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleQuery()}
                                        placeholder={translate('studio.nlq.placeholder')}
                                        style={S.nlqInput}
                                    />
                                    <button onClick={handleQuery} disabled={isLoading || !query.trim()} style={S.nlqBtn}>
                                        <Play size={14} />
                                    </button>
                                </div>

                                {/* Top Charts (2-col) */}
                                <div style={S.chartGrid2}>
                                    {chartWidgets.slice(0, 4).map(w => (
                                        <div key={w.id} style={S.chartCard}>
                                            <div style={S.chartHeader}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {CHART_TYPE_ICONS[w.chartType] || <BarChart2 size={14} />}
                                                    <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7 }}>{w.title}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => togglePin(w.id)} style={{ ...S.miniBtn, color: pinnedCharts.has(w.id) ? '#fbbf24' : undefined }} title={translate('studio.pin')}>
                                                        <Sparkles size={11} />
                                                    </button>
                                                    <button onClick={() => setExpandedChart(expandedChart === w.id ? null : w.id)} style={S.miniBtn} title={translate('studio.expand')}>
                                                        <Maximize2 size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                            <RenderChart widget={w} height={expandedChart === w.id ? 350 : 180} />
                                        </div>
                                    ))}
                                </div>

                                {/* Executive Summary */}
                                {activeAnalysis.executiveReasoning && (
                                    <div style={S.summaryCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <Brain size={16} style={{ color: 'var(--primary)' }} />
                                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.15em', opacity: 0.5 }}>{translate('studio.summary.title')}</span>
                                        </div>
                                        <p style={{ fontSize: '13px', lineHeight: '1.7', opacity: 0.8 }}>{activeAnalysis.executiveReasoning.executiveSummary}</p>
                                        {activeAnalysis.executiveReasoning.strategicAdvice?.length > 0 && (
                                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                                                {activeAnalysis.executiveReasoning.strategicAdvice.slice(0, 3).map((a: string, i: number) => (
                                                    <div key={i} style={S.adviceItem}>
                                                        <Zap size={11} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                                                        <span style={{ fontSize: '12px', opacity: 0.7 }}>{a}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Key Findings row */}
                                {allInsights.filter(i => i.confidence > 0.85).length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.15em', opacity: 0.3 }}>{translate('studio.findings.title')}</span>
                                        {allInsights.filter(i => i.confidence > 0.85).slice(0, 4).map(ins => (
                                            <div key={ins.id} style={S.findingRow}>
                                                {severityIcon(ins.severity)}
                                                <span style={{ fontSize: '12px', opacity: 0.7, flex: 1 }} dangerouslySetInnerHTML={{ __html: ins.description.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>') }} />
                                                <span style={{ fontSize: '9px', opacity: 0.3, fontWeight: 700 }}>{(ins.confidence * 100).toFixed(0)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Neural Processing Terminal */}
                                <div style={{ marginTop: '12px', background: 'var(--bg-card)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div style={{ padding: '8px 16px', background: 'rgba(52,211,153,0.05)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(52,211,153,0.1)' }}>
                                        <Command size={12} style={{ color: '#34d399' }} />
                                        <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{translate('studio.terminal.title')}</span>
                                        <span style={{ fontSize: '10px', opacity: 0.5, marginLeft: 'auto', fontFamily: 'monospace' }}>latency: {(activeAnalysis.processingTimeMs || 0)}ms</span>
                                    </div>
                                    <div style={{ padding: '16px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <span style={{ color: '#34d399', opacity: 0.5 }}>[SYS]</span>
                                            <span style={{ color: '#fbbf24' }}>{translate('studio.terminal.init')}</span>
                                        </div>
                                        {activeAnalysis.processingLog?.map((log: string, idx: number) => (
                                            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                <span style={{ color: '#34d399', opacity: 0.5, flexShrink: 0 }}>[{String(idx + 1).padStart(3, '0')}]</span>
                                                <span dangerouslySetInnerHTML={{ __html: log.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff">$1</strong>') }} />
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <span style={{ color: '#34d399', opacity: 0.5 }}>[EOF]</span>
                                            <span style={{ color: '#34d399' }}>{translate('studio.terminal.done')}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── CHARTS VIEW ── */}
                        {activeView === 'charts' && (
                            <motion.div key="charts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', opacity: 0.4 }}>{chartWidgets.length} {translate('studio.charts.count')}</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={() => setChartLayout('grid')} style={{ ...S.miniBtn, background: chartLayout === 'grid' ? 'var(--primary-subtle)' : undefined }}>{translate('studio.layout.grid')}</button>
                                        <button onClick={() => setChartLayout('list')} style={{ ...S.miniBtn, background: chartLayout === 'list' ? 'var(--primary-subtle)' : undefined }}>{translate('studio.layout.list')}</button>
                                    </div>
                                </div>
                                <div style={chartLayout === 'grid' ? S.chartGrid2 : { display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                                    {sortedCharts.map(w => (
                                        <div key={w.id} style={{ ...S.chartCard, ...(pinnedCharts.has(w.id) ? { border: '1px solid rgba(251,191,36,0.3)' } : {}) }}>
                                            <div style={S.chartHeader}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                                    {CHART_TYPE_ICONS[w.chartType] || <BarChart2 size={14} />}
                                                    <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{w.title}</span>
                                                    {pinnedCharts.has(w.id) && <Sparkles size={10} style={{ color: '#fbbf24' }} />}
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => togglePin(w.id)} style={{ ...S.miniBtn, color: pinnedCharts.has(w.id) ? '#fbbf24' : undefined }}><Sparkles size={11} /></button>
                                                    <button onClick={() => setExpandedChart(expandedChart === w.id ? null : w.id)} style={S.miniBtn}><Maximize2 size={11} /></button>
                                                </div>
                                            </div>
                                            {w.description && <p style={{ fontSize: '10px', opacity: 0.35, margin: '0 0 8px 0', lineHeight: '1.4' }}>{w.description}</p>}
                                            <RenderChart widget={w} height={expandedChart === w.id ? 350 : chartLayout === 'list' ? 250 : 200} />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ── SCHEMA VIEW ── */}
                        {activeView === 'schema' && (
                            <motion.div key="schema" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                                <div style={S.schemaHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Database size={16} style={{ color: 'var(--primary)' }} />
                                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{translate('studio.schema.title')}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.3 }}>({columns.length} {translate('studio.columns')})</span>
                                    </div>
                                    <div style={{ position: 'relative' as const }}>
                                        <Search size={13} style={{ position: 'absolute' as const, left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                        <input value={schemaSearch} onChange={e => setSchemaSearch(e.target.value)} placeholder={translate('studio.schema.search')} style={S.schemaSearchInput} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '8px' }}>
                                    {['number', 'currency', 'category', 'date', 'text', 'percent'].map(typeKey => {
                                        const count = columns.filter(c => c.type === typeKey).length;
                                        if (count === 0) return null;
                                        return <span key={typeKey} style={S.typeBadge}>{TYPE_ICONS[typeKey]} {typeKey} ({count})</span>;
                                    })}
                                </div>
                                <div style={S.schemaGrid}>
                                    {filteredColumns.map(col => (
                                        <div key={col.name} style={S.schemaCard}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ ...S.typeChip, background: col.type === 'number' || col.type === 'currency' ? 'rgba(52,211,153,0.15)' : col.type === 'date' ? 'rgba(56,189,248,0.15)' : col.type === 'category' ? 'rgba(129,140,248,0.15)' : 'var(--bg-surface-hover)' }}>
                                                        {TYPE_ICONS[col.type] || <Type size={12} />}
                                                    </span>
                                                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{col.name}</span>
                                                </div>
                                                <span style={{ fontSize: '9px', opacity: 0.3, textTransform: 'uppercase' as const, fontWeight: 700, letterSpacing: '0.05em' }}>{col.type}</span>
                                            </div>
                                            {col.health && (
                                                <div style={{ display: 'flex', gap: '12px', fontSize: '10px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
                                                        <span style={{ opacity: 0.3, fontWeight: 700 }}>{translate('studio.schema.complete')}</span>
                                                        <span style={{ fontWeight: 800, color: col.health.completeness > 90 ? '#34d399' : col.health.completeness > 70 ? '#fbbf24' : '#ef4444' }}>{col.health.completeness}%</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
                                                        <span style={{ opacity: 0.3, fontWeight: 700 }}>{translate('studio.schema.unique')}</span>
                                                        <span style={{ fontWeight: 800 }}>{col.health.uniqueness}%</span>
                                                    </div>
                                                    {col.health.entropy !== undefined && (
                                                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
                                                            <span style={{ opacity: 0.3, fontWeight: 700 }}>{translate('studio.schema.entropy')}</span>
                                                            <span style={{ fontWeight: 800 }}>{col.health.entropy}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {col.stats && (col.type === 'number' || col.type === 'currency' || col.type === 'percent') && (
                                                <div style={{ display: 'flex', gap: '8px', fontSize: '10px', marginTop: '8px', padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                                                    {col.stats.min !== undefined && <span style={{ opacity: 0.5 }}>min: <b>{Number(col.stats.min).toLocaleString()}</b></span>}
                                                    {col.stats.max !== undefined && <span style={{ opacity: 0.5 }}>max: <b>{Number(col.stats.max).toLocaleString()}</b></span>}
                                                    {col.stats.mean !== undefined && <span style={{ opacity: 0.5 }}>μ: <b>{Number(col.stats.mean).toFixed(2)}</b></span>}
                                                </div>
                                            )}
                                            {col.stats?.topValues && col.stats.topValues.length > 0 && (col.type === 'category' || col.type === 'text') && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginTop: '8px' }}>
                                                    {col.stats.topValues.slice(0, 5).map((tv: any, i: number) => (
                                                        <span key={i} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-surface-hover)', fontWeight: 600 }}>
                                                            {String(tv.value).substring(0, 15)} ({tv.count})
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ── INSIGHTS VIEW ── */}
                        {activeView === 'insights' && (
                            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Lightbulb size={16} style={{ color: '#fbbf24' }} />
                                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{translate('studio.insights.title')}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.3 }}>({allInsights.length} {translate('studio.insights.discovered')})</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                                    {insightTypes.map(it => (
                                        <button key={it} onClick={() => setSelectedInsightType(it)} style={{ ...S.filterChip, ...(selectedInsightType === it ? S.filterChipActive : {}) }}>
                                            {it === 'all' ? translate('studio.filter.all') : (translate(`studio.insights.type.${it}`) || it)}
                                            {it !== 'all' && <span style={{ fontSize: '9px', opacity: 0.5 }}>({allInsights.filter(i => i.type === it).length})</span>}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                                    {filteredInsights.map(ins => (
                                        <div key={ins.id} style={S.insightCard}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                {severityIcon(ins.severity)}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                        <span style={{ ...S.insightType, background: ins.type === 'anomaly' ? 'rgba(239,68,68,0.15)' : ins.type === 'correlation' ? 'rgba(129,140,248,0.15)' : ins.type === 'trend' ? 'rgba(52,211,153,0.15)' : ins.type === 'risk' ? 'rgba(251,191,36,0.15)' : 'var(--bg-surface-hover)' }}>
                                                            {translate(`studio.insights.type.${ins.type}`) || ins.type}
                                                        </span>
                                                        <span style={{ fontSize: '9px', opacity: 0.3, fontWeight: 700 }}>{(ins.confidence * 100).toFixed(0)}% {translate('studio.insights.confidence')}</span>
                                                    </div>
                                                    <p style={{ fontSize: '12px', lineHeight: '1.6', opacity: 0.75, margin: 0 }} dangerouslySetInnerHTML={{ __html: ins.description.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>') }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
    container: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', background: 'transparent' },
    commandBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid var(--border-subtle)', gap: '16px', flexWrap: 'wrap' },
    commandLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    commandCenter: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' },
    commandRight: { display: 'flex', alignItems: 'center', gap: '8px' },
    logoBox: { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
    title: { fontSize: '16px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
    subtitle: { fontSize: '11px', opacity: 0.35, margin: 0 },
    datasetPicker: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)' },
    datasetSelect: { background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, outline: 'none', minWidth: '180px' },
    connectedBadge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', color: '#34d399' },
    pulseDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', animation: 'pulse 2s infinite' },
    iconBtn: { width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
    securityBadge: { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(52,211,153,0.06)', color: '#34d399', fontSize: '10px', fontWeight: 700 },
    tabBar: { display: 'flex', gap: '4px', padding: '0 28px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' },
    tabBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', border: 'none', background: 'transparent', color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderBottom: '2px solid transparent', transition: 'all 0.2s' },
    tabBtnActive: { color: 'var(--primary)', borderBottomColor: 'var(--primary)' },
    tabBadge: { fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)' },
    canvas: { flex: 1, padding: '24px 28px', overflow: 'auto' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '16px', opacity: 0.6 },
    emptyIcon: { width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(52,211,153,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' },
    explorerGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
    metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' },
    metricCard: { padding: '16px 18px', borderRadius: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '4px' },
    nlqBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' },
    nlqInput: { flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' },
    nlqBtn: { width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    chartGrid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' },
    chartCard: { padding: '16px', borderRadius: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', transition: 'border-color 0.2s' },
    chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    miniBtn: { width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: 'var(--bg-surface-hover)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', fontWeight: 700, padding: '0 6px' },
    summaryCard: { padding: '20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(52,211,153,0.03))', border: '1px solid rgba(99,102,241,0.1)' },
    adviceItem: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-surface)' },
    findingRow: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)' },
    schemaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    schemaSearchInput: { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 10px 6px 30px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '200px' },
    schemaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' },
    schemaCard: { padding: '14px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' },
    typeChip: { width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    typeBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', textTransform: 'capitalize' as const },
    filterChip: { padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const, display: 'flex', alignItems: 'center', gap: '4px' },
    filterChipActive: { borderColor: 'var(--primary)', background: 'var(--primary-subtle)', color: 'var(--primary)' },
    insightCard: { padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', transition: 'border-color 0.2s' },
    insightType: { fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
};
