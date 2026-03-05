import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    GripVertical, Plus, X, Save, RotateCcw, Maximize2, Minimize2,
    BarChart3, LineChart as LineIcon, PieChart as PieIcon,
    ScatterChart as ScatterIcon, Activity, Settings2, Layout
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface DashboardWidget {
    id: string;
    type: 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'radar' | 'kpi';
    title: string;
    dataKey?: string;
    categoryKey?: string;
    data?: any[];
    col: number;      // Grid column start (0-based)
    row: number;       // Grid row start (0-based)
    width: number;     // Grid columns span
    height: number;    // Grid rows span
    color?: string;
}

interface DashboardLayout {
    id: string;
    name: string;
    widgets: DashboardWidget[];
    createdAt: string;
}

interface CustomDashboardProps {
    analysisData: any;
    isDark?: boolean;
}

const COLORS = [
    '#34d399', // Emerald 400
    '#60a5fa', // Blue 400
    '#818cf8', // Indigo 400
    '#f472b6', // Pink 400
    '#fbbf24', // Amber 400
    '#a78bfa', // Violet 400
    '#2dd4bf', // Teal 400
    '#fb923c', // Orange 400
    '#38bdf8', // Sky 400
    '#c084fc', // Purple 400
];

const CHART_TYPES: Array<{ type: DashboardWidget['type']; icon: React.ReactNode; label: string }> = [
    { type: 'bar', icon: <BarChart3 size={14} />, label: 'Bar' },
    { type: 'line', icon: <LineIcon size={14} />, label: 'Line' },
    { type: 'area', icon: <Activity size={14} />, label: 'Area' },
    { type: 'pie', icon: <PieIcon size={14} />, label: 'Pie' },
    { type: 'scatter', icon: <ScatterIcon size={14} />, label: 'Scatter' },
    { type: 'kpi', icon: <Layout size={14} />, label: 'KPI' },
];

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════

export const CustomDashboard: React.FC<CustomDashboardProps> = ({ analysisData, isDark = true }) => {
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
    const [resizingWidget, setResizingWidget] = useState<string | null>(null);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [savedLayouts, setSavedLayouts] = useState<DashboardLayout[]>([]);
    const [layoutName, setLayoutName] = useState('');
    const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);
    const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

    const bg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const fg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(15,23,42,${a})`;

    // Extract available data from analysis
    const chartOptions = useMemo(() => analysisData?.options || [], [analysisData]);
    const measures = useMemo(() => analysisData?.summary?.measures || [], [analysisData]);
    const dimensions = useMemo(() => analysisData?.summary?.dimensions || [], [analysisData]);
    const rawData = useMemo(() => analysisData?.rawData || analysisData?.data || [], [analysisData]);

    // Load saved layouts from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('nalyse_dashboard_layouts');
            if (saved) setSavedLayouts(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    // Auto-refresh timer
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            setWidgets(w => [...w]); // Trigger re-render
        }, 30000); // 30s
        return () => clearInterval(interval);
    }, [autoRefresh]);

    // Initialize default widgets from analysis options
    useEffect(() => {
        if (widgets.length === 0 && chartOptions.length > 0) {
            const defaults: DashboardWidget[] = chartOptions.slice(0, 4).map((opt: any, i: number) => ({
                id: `widget-${i}`,
                type: (opt.chartType === 'scatter' ? 'scatter' : opt.chartType === 'pie' ? 'pie' : i % 2 === 0 ? 'bar' : 'line') as DashboardWidget['type'],
                title: opt.title || `Chart ${i + 1}`,
                data: opt.data,
                dataKey: opt.data?.[0] ? Object.keys(opt.data[0]).find(k => typeof opt.data[0][k] === 'number') : undefined,
                categoryKey: opt.data?.[0] ? Object.keys(opt.data[0]).find(k => typeof opt.data[0][k] === 'string') || 'name' : 'name',
                col: (i % 2) * 6,
                row: Math.floor(i / 2) * 4,
                width: 6,
                height: 4,
                color: COLORS[i % COLORS.length],
            }));
            setWidgets(defaults);
        }
    }, [chartOptions]);

    const addWidget = useCallback((type: DashboardWidget['type']) => {
        const maxRow = widgets.reduce((max, w) => Math.max(max, w.row + w.height), 0);
        const newWidget: DashboardWidget = {
            id: `widget-${Date.now()}`,
            type,
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
            data: chartOptions[0]?.data || rawData.slice(0, 50),
            dataKey: measures[0] || 'value',
            categoryKey: dimensions[0] || 'name',
            col: 0,
            row: maxRow,
            width: type === 'kpi' ? 3 : 6,
            height: type === 'kpi' ? 2 : 4,
            color: COLORS[widgets.length % COLORS.length],
        };
        setWidgets(prev => [...prev, newWidget]);
        setShowAddPanel(false);
    }, [widgets, chartOptions, rawData, measures, dimensions]);

    const removeWidget = useCallback((id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
    }, []);

    const saveLayout = useCallback(() => {
        if (!layoutName.trim()) return;
        const layout: DashboardLayout = {
            id: `layout-${Date.now()}`,
            name: layoutName,
            widgets,
            createdAt: new Date().toISOString(),
        };
        const updated = [...savedLayouts, layout];
        setSavedLayouts(updated);
        localStorage.setItem('nalyse_dashboard_layouts', JSON.stringify(updated));
        setLayoutName('');
    }, [layoutName, widgets, savedLayouts]);

    const loadLayout = useCallback((layout: DashboardLayout) => {
        setWidgets(layout.widgets);
    }, []);

    const resetDashboard = useCallback(() => {
        setWidgets([]);
    }, []);

    // Drag handlers
    const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
        setDraggedWidget(widgetId);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedWidget || !gridRef.current) return;

        const rect = gridRef.current.getBoundingClientRect();
        const colWidth = rect.width / 12;
        const rowHeight = 80;
        const newCol = Math.max(0, Math.min(11, Math.floor((e.clientX - rect.left) / colWidth)));
        const newRow = Math.max(0, Math.floor((e.clientY - rect.top) / rowHeight));

        setWidgets(prev => prev.map(w =>
            w.id === draggedWidget ? { ...w, col: newCol, row: newRow } : w
        ));
        setDraggedWidget(null);
    }, [draggedWidget]);

    // Resize handlers
    const handleResizeStart = useCallback((e: React.MouseEvent, widgetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return;
        setResizingWidget(widgetId);
        resizeStart.current = { x: e.clientX, y: e.clientY, w: widget.width, h: widget.height };

        const handleMove = (ev: MouseEvent) => {
            if (!resizeStart.current || !gridRef.current) return;
            const rect = gridRef.current.getBoundingClientRect();
            const colWidth = rect.width / 12;
            const rowHeight = 80;
            const dCols = Math.round((ev.clientX - resizeStart.current.x) / colWidth);
            const dRows = Math.round((ev.clientY - resizeStart.current.y) / rowHeight);

            setWidgets(prev => prev.map(w =>
                w.id === widgetId ? {
                    ...w,
                    width: Math.max(2, Math.min(12, resizeStart.current!.w + dCols)),
                    height: Math.max(2, Math.min(8, resizeStart.current!.h + dRows)),
                } : w
            ));
        };

        const handleUp = () => {
            setResizingWidget(null);
            resizeStart.current = null;
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    }, [widgets]);

    // ═══════════════════════════════════════════════════════════════
    // CHART RENDERER
    // ═══════════════════════════════════════════════════════════════

    const renderWidgetChart = useCallback((widget: DashboardWidget) => {
        const chartData = widget.data || [];
        if (chartData.length === 0) {
            return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: fg(0.3), fontSize: '12px' }}>No data</div>;
        }

        const numericKeys = chartData[0] ? Object.keys(chartData[0]).filter(k => typeof chartData[0][k] === 'number') : [];
        const catKey = widget.categoryKey || 'name';
        const valKey = widget.dataKey || numericKeys[0] || 'value';

        const tooltipStyle = {
            contentStyle: { background: isDark ? '#1a1a2e' : '#fff', border: `1px solid ${bg(0.1)}`, borderRadius: '10px', fontSize: '11px', color: fg(0.9) },
            cursor: { fill: bg(0.03) },
        };

        switch (widget.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={bg(0.06)} />
                            <XAxis dataKey={catKey} stroke={fg(0.3)} tick={{ fontSize: 9 }} />
                            <YAxis stroke={fg(0.3)} tick={{ fontSize: 9 }} />
                            <Tooltip {...tooltipStyle} />
                            {numericKeys.slice(0, 3).map((k, i) => (
                                <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={bg(0.06)} />
                            <XAxis dataKey={catKey} stroke={fg(0.3)} tick={{ fontSize: 9 }} />
                            <YAxis stroke={fg(0.3)} tick={{ fontSize: 9 }} />
                            <Tooltip {...tooltipStyle} />
                            {numericKeys.slice(0, 3).map((k, i) => (
                                <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                {numericKeys.slice(0, 3).map((k, i) => (
                                    <linearGradient key={k} id={`area-${widget.id}-${k}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={bg(0.06)} />
                            <XAxis dataKey={catKey} stroke={fg(0.3)} tick={{ fontSize: 9 }} />
                            <YAxis stroke={fg(0.3)} tick={{ fontSize: 9 }} />
                            <Tooltip {...tooltipStyle} />
                            {numericKeys.slice(0, 3).map((k, i) => (
                                <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} fill={`url(#area-${widget.id}-${k})`} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={chartData.slice(0, 8)} dataKey={valKey} nameKey={catKey} cx="50%" cy="50%" innerRadius="35%" outerRadius="70%" paddingAngle={2}>
                                {chartData.slice(0, 8).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip {...tooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: '10px', color: fg(0.5) }} />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={bg(0.06)} />
                            <XAxis dataKey={numericKeys[0] || 'x'} type="number" stroke={fg(0.3)} tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                            <YAxis dataKey={numericKeys[1] || 'y'} type="number" stroke={fg(0.3)} tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                            <Tooltip {...tooltipStyle} />
                            <Scatter data={chartData} fill={widget.color} />
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'kpi': {
                const val = chartData[0]?.[valKey] ?? 0;
                const formatted = typeof val === 'number' ? val.toLocaleString() : String(val);
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '4px' }}>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: widget.color || fg(0.95), letterSpacing: '-0.02em' }}>{formatted}</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: fg(0.4), textTransform: 'uppercase', letterSpacing: '0.1em' }}>{widget.title}</div>
                    </div>
                );
            }

            default:
                return null;
        }
    }, [isDark, bg, fg]);

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    const maxRow = widgets.reduce((max, w) => Math.max(max, w.row + w.height), 0) + 4;

    return (
        <div style={{ width: '100%', padding: '16px 0' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
                padding: '10px 16px', borderRadius: '14px',
                background: bg(0.03), border: `1px solid ${bg(0.06)}`,
            }}>
                <button onClick={() => setShowAddPanel(!showAddPanel)} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                    border: 'none', cursor: 'pointer',
                }}>
                    <Plus size={13} /> Add Widget
                </button>

                <div style={{ flex: 1 }} />

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: fg(0.4), cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
                        style={{ accentColor: '#6366f1' }} />
                    Auto-refresh (30s)
                </label>

                <div style={{ width: '1px', height: '20px', background: bg(0.08) }} />

                <input
                    type="text" placeholder="Layout name..." value={layoutName}
                    onChange={e => setLayoutName(e.target.value)}
                    style={{
                        padding: '5px 10px', borderRadius: '6px', fontSize: '11px',
                        background: bg(0.04), border: `1px solid ${bg(0.08)}`, color: fg(0.8),
                        width: '140px', outline: 'none',
                    }}
                />
                <button onClick={saveLayout} disabled={!layoutName.trim()} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    background: bg(0.04), border: `1px solid ${bg(0.08)}`, color: fg(0.5),
                    cursor: layoutName.trim() ? 'pointer' : 'not-allowed', opacity: layoutName.trim() ? 1 : 0.4,
                }}>
                    <Save size={11} /> Save
                </button>

                {savedLayouts.length > 0 && (
                    <select
                        onChange={e => {
                            const layout = savedLayouts.find(l => l.id === e.target.value);
                            if (layout) loadLayout(layout);
                        }}
                        value=""
                        style={{
                            padding: '5px 8px', borderRadius: '6px', fontSize: '10px',
                            background: bg(0.04), border: `1px solid ${bg(0.08)}`, color: fg(0.6),
                            cursor: 'pointer', outline: 'none',
                        }}
                    >
                        <option value="" disabled>Load layout...</option>
                        {savedLayouts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                )}

                <button onClick={resetDashboard} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    background: bg(0.04), border: `1px solid ${bg(0.08)}`, color: fg(0.4),
                    cursor: 'pointer',
                }}>
                    <RotateCcw size={11} /> Reset
                </button>
            </div>

            {/* Add Widget Panel */}
            <AnimatePresence>
                {showAddPanel && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            marginBottom: '12px', overflow: 'hidden', borderRadius: '12px',
                            background: bg(0.03), border: `1px solid ${bg(0.06)}`, padding: '12px 16px',
                        }}
                    >
                        <div style={{ fontSize: '10px', fontWeight: 800, color: fg(0.4), textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                            Select Widget Type
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {CHART_TYPES.map(ct => (
                                <button key={ct.type} onClick={() => addWidget(ct.type)} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                    background: bg(0.04), border: `1px solid ${bg(0.08)}`, color: fg(0.7),
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = bg(0.08); e.currentTarget.style.borderColor = '#6366f1'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = bg(0.04); e.currentTarget.style.borderColor = bg(0.08); }}
                                >
                                    {ct.icon} {ct.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid */}
            <div
                ref={gridRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gridAutoRows: '80px',
                    gap: '12px',
                    minHeight: `${maxRow * 80}px`,
                    position: 'relative',
                }}
            >
                {widgets.map(widget => {
                    const isExpanded = expandedWidget === widget.id;
                    return (
                        <motion.div
                            key={widget.id}
                            layout
                            style={{
                                gridColumn: isExpanded ? '1 / -1' : `${widget.col + 1} / span ${widget.width}`,
                                gridRow: isExpanded ? `span 6` : `${widget.row + 1} / span ${widget.height}`,
                                background: isDark ? 'rgba(10,10,16,0.7)' : 'rgba(255,255,255,0.9)',
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${draggedWidget === widget.id ? '#6366f1' : bg(0.06)}`,
                                borderRadius: '16px',
                                overflow: 'hidden',
                                display: 'flex', flexDirection: 'column',
                                transition: resizingWidget === widget.id ? 'none' : 'all 0.3s ease',
                                cursor: draggedWidget === widget.id ? 'grabbing' : 'default',
                                position: 'relative',
                                zIndex: isExpanded ? 50 : 1,
                            }}
                        >
                            {/* Widget Header */}
                            <div
                                draggable
                                onDragStart={e => handleDragStart(e, widget.id)}
                                onDragEnd={() => setDraggedWidget(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 12px',
                                    borderBottom: `1px solid ${bg(0.04)}`,
                                    cursor: 'grab',
                                }}
                            >
                                <GripVertical size={12} color={fg(0.2)} />
                                <span style={{ flex: 1, fontSize: '11px', fontWeight: 800, color: fg(0.8), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {widget.title}
                                </span>
                                <button onClick={() => setExpandedWidget(isExpanded ? null : widget.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: fg(0.3), padding: '2px' }}>
                                    {isExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                                </button>
                                <button onClick={() => removeWidget(widget.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: fg(0.3), padding: '2px' }}>
                                    <X size={11} />
                                </button>
                            </div>

                            {/* Chart Area */}
                            <div style={{ flex: 1, padding: '8px', minHeight: 0 }}>
                                {renderWidgetChart(widget)}
                            </div>

                            {/* Resize Handle */}
                            <div
                                onMouseDown={e => handleResizeStart(e, widget.id)}
                                style={{
                                    position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px',
                                    cursor: 'se-resize', opacity: 0.3,
                                    background: `linear-gradient(135deg, transparent 50%, ${fg(0.2)} 50%)`,
                                    borderRadius: '0 0 16px 0',
                                }}
                            />
                        </motion.div>
                    );
                })}

                {widgets.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1', gridRow: '1 / span 4',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: fg(0.3), gap: '12px',
                    }}>
                        <Layout size={40} strokeWidth={1} />
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>Build Your Dashboard</div>
                        <div style={{ fontSize: '11px', color: fg(0.2) }}>Click "Add Widget" to start adding visualizations</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomDashboard;
