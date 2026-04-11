import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Save, FolderOpen, Trash2, Maximize2, Minimize2,
    BarChart3, PieChart, TrendingUp, Hash, Type, Table2,
    FileText, AreaChart, RefreshCw, Settings, GripVertical,
    X, Copy, Edit3, ChevronDown, Lock, Unlock, Grid3X3,
    Download, Upload, Eye, EyeOff, Layers, Layout as LayoutIcon, Clock,
    Check, Sparkles, AlertCircle, Loader2
} from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import type { LayoutItem, Layout as RGLLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
    BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
    AreaChart as RechartsArea, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';

/* ─── Types ─── */
interface PanelConfig {
    id: string;
    type: 'metric' | 'bar' | 'line' | 'pie' | 'area' | 'table' | 'markdown' | 'scatter';
    title: string;
    config: Record<string, any>;
    locked: boolean;
}


interface DashboardLayout {
    id: string;
    name: string;
    panels: PanelConfig[];
    gridLayout: LayoutItem[];
    createdAt: number;
    updatedAt: number;
}

/* ─── Colors ─── */
const CHART_COLORS = [
    '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
    '#ec4899', '#f43f5e', '#06b6d4', '#10b981',
    '#f59e0b', '#84cc16',
];

/* ─── Demo Data ─── */
const DEMO_DATA = [
    { month: 'Jan', revenue: 4200, expenses: 2400, profit: 1800, users: 320 },
    { month: 'Feb', revenue: 5100, expenses: 2800, profit: 2300, users: 410 },
    { month: 'Mar', revenue: 4800, expenses: 2600, profit: 2200, users: 380 },
    { month: 'Apr', revenue: 6200, expenses: 3100, profit: 3100, users: 520 },
    { month: 'May', revenue: 7400, expenses: 3400, profit: 4000, users: 640 },
    { month: 'Jun', revenue: 6800, expenses: 3200, profit: 3600, users: 590 },
];

const PIE_DATA = [
    { name: 'Product A', value: 35 },
    { name: 'Product B', value: 25 },
    { name: 'Product C', value: 20 },
    { name: 'Product D', value: 12 },
    { name: 'Other', value: 8 },
];

/* ─── Storage ─── */
const STORAGE_KEY = 'nalyse_canvas_dashboards';
function persistDashboards(ds: DashboardLayout[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ds));
}

function toTimeMs(v: unknown): number {
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
        const t = Date.parse(v);
        return Number.isNaN(t) ? 0 : t;
    }
    return 0;
}

/** API may return a raw array or legacy wrappers; DB uses ISO dates for timestamps */
function normalizeDashboardList(raw: unknown): DashboardLayout[] {
    let arr: unknown[] = [];
    if (Array.isArray(raw)) arr = raw;
    else if (raw && typeof raw === 'object' && Array.isArray((raw as { dashboards?: unknown[] }).dashboards)) {
        arr = (raw as { dashboards: unknown[] }).dashboards;
    }
    return arr
        .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object' && typeof (x as { id?: string }).id === 'string')
        .map((x) => ({
            id: x.id as string,
            name: String(x.name ?? 'Untitled'),
            panels: Array.isArray(x.panels) ? (x.panels as PanelConfig[]) : [],
            gridLayout: Array.isArray(x.gridLayout) ? (x.gridLayout as LayoutItem[]) : [],
            createdAt: toTimeMs(x.createdAt),
            updatedAt: toTimeMs(x.updatedAt),
        }));
}

/** Keep local-only dashboards (e.g. dash_* from offline saves) when server returns UUID-only list */
function mergeDashboardLists(server: DashboardLayout[], local: DashboardLayout[]): DashboardLayout[] {
    const map = new Map<string, DashboardLayout>();
    for (const d of server) map.set(d.id, d);
    for (const d of local) {
        if (!map.has(d.id)) map.set(d.id, d);
    }
    return [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

function loadDashboards(): DashboardLayout[] {
    try {
        return normalizeDashboardList(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {
        return [];
    }
}

/* ─── Panel Templates ─── */
const PANEL_TEMPLATES: { type: PanelConfig['type']; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: 'metric', label: 'Metric', icon: <Hash size={18} />, desc: 'Single KPI with trend' },
    { type: 'bar', label: 'Bar Chart', icon: <BarChart3 size={18} />, desc: 'Grouped or stacked bars' },
    { type: 'line', label: 'Line Chart', icon: <TrendingUp size={18} />, desc: 'Trends over time' },
    { type: 'pie', label: 'Pie / Donut', icon: <PieChart size={18} />, desc: 'Distribution breakdown' },
    { type: 'area', label: 'Area Chart', icon: <AreaChart size={18} />, desc: 'Filled trend area' },
    { type: 'scatter', label: 'Scatter Plot', icon: <Hash size={18} />, desc: 'Correlation analysis' },
    { type: 'table', label: 'Data Table', icon: <Table2 size={18} />, desc: 'Tabular data view' },
    { type: 'markdown', label: 'Markdown', icon: <FileText size={18} />, desc: 'Rich text annotation' },
];

/* ─── Default Panel Configs ─── */
function defaultConfig(type: PanelConfig['type']): Record<string, any> {
    const monthKey = 'month';
    switch (type) {
        case 'metric': return { label: 'Total Revenue', value: '$34,500', change: '+12.4%', positive: true };
        case 'bar': return { dataKey: 'revenue', xAxisKey: monthKey, color: '#6366f1' };
        case 'line': return { dataKey: 'revenue', xAxisKey: monthKey, color: '#10b981' };
        case 'pie': return {};
        case 'scatter': return { dataKey: 'revenue', xAxisKey: 'users', yAxisKey: 'revenue', color: '#ec4899' };
        case 'area': return { dataKey: 'users', xAxisKey: monthKey, color: '#8b5cf6' };
        case 'table': return {};
        case 'markdown': return { content: '## Notes\n\nAdd your insights here...' };
        default: return {};
    }
}

function defaultLayout(type: PanelConfig['type']): { w: number; h: number } {
    switch (type) {
        case 'metric': return { w: 3, h: 2 };
        case 'bar': case 'line': case 'area': case 'scatter': return { w: 6, h: 4 };
        case 'pie': return { w: 4, h: 4 };
        case 'table': return { w: 6, h: 4 };
        case 'markdown': return { w: 4, h: 3 };
        default: return { w: 4, h: 3 };
    }
}

/* ═══════════════════════════════════════
   Panel Renderers
   ═══════════════════════════════════════ */

const MetricPanel: React.FC<{ config: Record<string, any> }> = ({ config }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '4px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{config.label}</div>
        <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{config.value}</div>
        <div style={{
            fontSize: '13px', fontWeight: 700,
            color: config.positive ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)',
            display: 'flex', alignItems: 'center', gap: '4px',
        }}>
            {config.positive ? '↑' : '↓'} {config.change}
        </div>
    </div>
);

const BarPanel: React.FC<{ config: Record<string, any> }> = ({ config }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={config.data || DEMO_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey={config.xAxisKey || "category"} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '11px' }} />
            <Bar dataKey={config.yAxisKey || config.dataKey || 'value'} fill={config.color || '#6366f1'} radius={[4, 4, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);

const LinePanel: React.FC<{ config: Record<string, any> }> = ({ config }) => (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={config.data || DEMO_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey={config.xAxisKey || "category"} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '11px' }} />
            <Line type="monotone" dataKey={config.yAxisKey || config.dataKey || 'value'} stroke={config.color || '#10b981'} strokeWidth={2.5} dot={{ r: 4, fill: config.color || '#10b981' }} />
        </LineChart>
    </ResponsiveContainer>
);

const PiePanel: React.FC<{ config: Record<string, any> }> = ({ config }) => (
    <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
            <Pie data={config.data || PIE_DATA} cx="50%" cy="50%" innerRadius="40%" outerRadius="75%" paddingAngle={3} dataKey={config.yAxisKey || "value"} nameKey={config.xAxisKey || "name"}>
                {(config.data || PIE_DATA).map((_: any, i: number) => <Cell key={i} fill={config.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '11px' }} />
            <Legend wrapperStyle={{ fontSize: '10px', color: 'var(--text-muted)' }} />
        </RechartsPie>
    </ResponsiveContainer>
);

const AreaPanel: React.FC<{ config: Record<string, any> }> = ({ config }) => (
    <ResponsiveContainer width="100%" height="100%">
        <RechartsArea data={config.data || DEMO_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
                <linearGradient id={`gradient-${config.yAxisKey || 'users'}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color || '#8b5cf6'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={config.color || '#8b5cf6'} stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey={config.xAxisKey || "category"} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '11px' }} />
            <Area type="monotone" dataKey={config.yAxisKey || config.dataKey || 'users'} stroke={config.color || '#8b5cf6'} fillOpacity={1} fill={`url(#gradient-${config.yAxisKey || 'users'})`} />
        </RechartsArea>
    </ResponsiveContainer>
);

const ScatterPanel: React.FC<{ config: Record<string, any> }> = ({ config }) => {
    const data = config.data || DEMO_DATA;
    const xKey = config.xAxisKey || 'users';
    const yKey = config.yAxisKey || config.dataKey || 'revenue';
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={xKey} type="number" name={xKey} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis dataKey={yKey} type="number" name={yKey} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '11px' }} />
                <Scatter data={data} fill={config.color || '#ec4899'} />
            </ScatterChart>
        </ResponsiveContainer>
    );
};

const TablePanel: React.FC = () => (
    <div style={{ overflow: 'auto', height: '100%', fontSize: '11px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    {Object.keys(DEMO_DATA[0]).map(k => (
                        <th key={k} style={{
                            padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid var(--border-subtle)',
                            color: 'var(--text-muted)', fontWeight: 800, fontSize: '9px', textTransform: 'uppercase',
                            letterSpacing: '0.08em', position: 'sticky', top: 0, background: 'var(--bg-elevated)',
                        }}>{k}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {DEMO_DATA.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        {Object.values(row).map((v, j) => (
                            <td key={j} style={{ padding: '6px 8px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                {typeof v === 'number' ? v.toLocaleString() : v}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const MarkdownPanel: React.FC<{ config: Record<string, any> }> = ({ config }) => (
    <div style={{ padding: '8px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, overflow: 'auto', height: '100%' }}>
        {(config.content || '').split('\n').map((line: string, i: number) => {
            if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '8px 0 4px' }}>{line.replace('## ', '')}</h2>;
            if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0 4px' }}>{line.replace('# ', '')}</h1>;
            if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: '16px' }}>{line.replace('- ', '')}</li>;
            return <p key={i} style={{ margin: '4px 0' }}>{line}</p>;
        })}
    </div>
);

function renderPanel(panel: PanelConfig) {
    switch (panel.type) {
        case 'metric': return <MetricPanel config={panel.config} />;
        case 'bar': return <BarPanel config={panel.config} />;
        case 'line': return <LinePanel config={panel.config} />;
        case 'pie': return <PiePanel config={panel.config} />;
        case 'area': return <AreaPanel config={panel.config} />;
        case 'scatter': return <ScatterPanel config={panel.config} />;
        case 'table': return <TablePanel />;
        case 'markdown': return <MarkdownPanel config={panel.config} />;
        default: return <div>Unknown panel type</div>;
    }
}

function panelIcon(type: PanelConfig['type']) {
    const t = PANEL_TEMPLATES.find(p => p.type === type);
    return t?.icon || <Hash size={14} />;
}

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */

export const DashboardCanvas: React.FC = () => {
    const { token, isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const [dashboards, setDashboards] = useState<DashboardLayout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [editMode, setEditMode] = useState(true);
    const [showLoadMenu, setShowLoadMenu] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(0); // seconds, 0 = off
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const containerRef = useRef<HTMLDivElement>(null);
    const loadMenuRef = useRef<HTMLDivElement>(null);
    /** Only replace local panels/grid when switching dashboards — not when the list refreshes from polling */
    const lastSyncedDashboardIdRef = useRef<string | null>(null);
    /** When true, skip auto-picking the first saved dashboard (blank canvas / import / New) */
    const skipAutoSelectDashboardRef = useRef(false);
    const { width: gridWidth, containerRef: gridContainerRef, mounted: gridMounted } = useContainerWidth({ initialWidth: 1200 });

    // ─── API Sync ───
    const activeDashboardIdRef = useRef<string | null>(null);
    activeDashboardIdRef.current = activeDashboardId;

    const fetchDashboards = useCallback(async (silent = false) => {
        if (!token) {
            const local = normalizeDashboardList(loadDashboards());
            setDashboards(local);
            if (!silent) setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/dashboards`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const raw = await res.json();
                const serverList = normalizeDashboardList(raw);
                const localList = normalizeDashboardList(loadDashboards());
                const merged = mergeDashboardLists(serverList, localList);
                setDashboards(merged);
                persistDashboards(merged);

                const cur = activeDashboardIdRef.current;
                if (cur && !merged.some((d) => d.id === cur)) {
                    lastSyncedDashboardIdRef.current = null;
                    const next = merged[0]?.id ?? null;
                    setActiveDashboardId(next);
                } else if (!cur && merged.length > 0 && !skipAutoSelectDashboardRef.current) {
                    setActiveDashboardId(merged[0].id);
                }
            } else {
                const local = normalizeDashboardList(loadDashboards());
                setDashboards(local);
                persistDashboards(local);
            }
        } catch {
            const local = normalizeDashboardList(loadDashboards());
            setDashboards(local);
            persistDashboards(local);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [token]); // No activeDashboardId dependency — use ref instead

    // Initial fetch
    useEffect(() => {
        fetchDashboards();
    }, [fetchDashboards]);

    // Cross-device polling — every 15 seconds, silently check for updates
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => fetchDashboards(true), 15000);
        return () => clearInterval(interval);
    }, [token, fetchDashboards]);

    // Active dashboard
    const activeDashboard = useMemo(() => dashboards.find(d => d.id === activeDashboardId), [dashboards, activeDashboardId]);
    const [panels, setPanels] = useState<PanelConfig[]>([]);
    const [gridLayout, setGridLayout] = useState<LayoutItem[]>([]);

    useEffect(() => {
        if (activeDashboardId === null) {
            lastSyncedDashboardIdRef.current = null;
            return;
        }
        const d = dashboards.find((x) => x.id === activeDashboardId);
        if (!d) return;
        if (lastSyncedDashboardIdRef.current !== activeDashboardId) {
            lastSyncedDashboardIdRef.current = activeDashboardId;
            setPanels(d.panels);
            setGridLayout(d.gridLayout);
        }
    }, [activeDashboardId, dashboards]);

    // Auto refresh — bump key so chart panels remount / re-animate (and any live data hooks re-run)
    useEffect(() => {
        if (autoRefresh <= 0) return;
        const interval = setInterval(() => setLastRefresh(Date.now()), autoRefresh * 1000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    // Auto-select first dashboard if none is active (not after New / Import blank canvas)
    useEffect(() => {
        if (skipAutoSelectDashboardRef.current) return;
        if (!activeDashboardId && dashboards.length > 0) {
            setActiveDashboardId(dashboards[0].id);
        }
    }, [dashboards, activeDashboardId]);

    // Sync with other window events (like Lens saving to Dashboard)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                setDashboards(loadDashboards());
            }
        };
        window.addEventListener('storage', handleStorage);
        // also listen to a custom event for same window sync
        const customSync = () => {
            if (token) fetchDashboards();
            else setDashboards(loadDashboards());
        };
        window.addEventListener('sync-dashboard', customSync);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('sync-dashboard', customSync);
        };
    }, [token, fetchDashboards]);

    useEffect(() => {
        const onFs = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFs);
        return () => document.removeEventListener('fullscreenchange', onFs);
    }, []);

    useEffect(() => {
        if (!showLoadMenu) return;
        let removeListener: (() => void) | undefined;
        let cancelled = false;
        const frame = requestAnimationFrame(() => {
            if (cancelled) return;
            const close = (e: MouseEvent) => {
                if (loadMenuRef.current && !loadMenuRef.current.contains(e.target as Node)) {
                    setShowLoadMenu(false);
                }
            };
            document.addEventListener('mousedown', close);
            removeListener = () => document.removeEventListener('mousedown', close);
        });
        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            removeListener?.();
        };
    }, [showLoadMenu]);

    // Fullscreen
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement && containerRef.current) {
                await containerRef.current.requestFullscreen();
            } else if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch {
            addToast('Fullscreen is not available in this browser', 'warning');
        }
    }, [addToast]);

    // Add Panel
    const addPanel = useCallback((type: PanelConfig['type']) => {
        const id = `panel_${Date.now()}`;
        const newPanel: PanelConfig = {
            id, type,
            title: PANEL_TEMPLATES.find(t => t.type === type)?.label || 'Panel',
            config: defaultConfig(type),
            locked: false,
        };
        const dl = defaultLayout(type);
        const newLayoutItem: LayoutItem = {
            i: id, x: 0, y: Infinity, // auto-place at bottom
            w: dl.w, h: dl.h, minW: 2, minH: 2,
        };
        setPanels(prev => [...prev, newPanel]);
        setGridLayout(prev => [...prev, newLayoutItem]);
        setShowAddPanel(false);
    }, []);

    // Remove Panel
    const removePanel = useCallback((id: string) => {
        setPanels(prev => prev.filter(p => p.id !== id));
        setGridLayout(prev => prev.filter(l => l.i !== id));
    }, []);

    // Duplicate Panel
    const duplicatePanel = useCallback((id: string) => {
        const panel = panels.find(p => p.id === id);
        const layout = gridLayout.find(l => l.i === id);
        if (!panel || !layout) return;
        const newId = `panel_${Date.now()}`;
        setPanels(prev => [...prev, { ...panel, id: newId, title: panel.title + ' (Copy)' }]);
        setGridLayout(prev => [...prev, { ...layout, i: newId, x: 0, y: Infinity }]);
    }, [panels, gridLayout]);

    // Toggle Lock
    const toggleLock = useCallback((id: string) => {
        setPanels(prev => prev.map(p => p.id === id ? { ...p, locked: !p.locked } : p));
        setGridLayout(prev => prev.map(l => l.i === id ? { ...l, static: !l.static } : l));
    }, []);

    const commitDashboardSave = useCallback(
        async (nameOverride?: string) => {
            const effectiveName = (nameOverride !== undefined ? nameOverride : saveName).trim();
            if (!effectiveName) {
                addToast('Enter a dashboard name to save', 'warning');
                return;
            }
            setIsSaving(true);
            try {
                const now = Date.now();
                const existing = activeDashboardId ? dashboards.find((d) => d.id === activeDashboardId) : undefined;
                let toastSuccess = 'Dashboard saved successfully';

                let updatedDashboards = [...dashboards];
                let targetId = activeDashboardId;

                if (existing) {
                    const updated = { ...existing, name: effectiveName, panels, gridLayout, updatedAt: now };
                    updatedDashboards = dashboards.map((d) => (d.id === activeDashboardId ? updated : d));

                    if (token) {
                        try {
                            const putRes = await fetch(`${API_URL}/api/dashboards/${activeDashboardId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ name: effectiveName, panels, gridLayout }),
                            });
                            if (putRes.status === 404) {
                                const res = await fetch(`${API_URL}/api/dashboards`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ name: effectiveName, panels, gridLayout }),
                                });
                                if (res.ok) {
                                    const saved = normalizeDashboardList([await res.json()])[0];
                                    if (saved) {
                                        updatedDashboards = dashboards
                                            .filter((d) => d.id !== activeDashboardId)
                                            .concat([{ ...updated, id: saved.id, createdAt: saved.createdAt, updatedAt: saved.updatedAt }]);
                                        targetId = saved.id;
                                        setActiveDashboardId(saved.id);
                                        lastSyncedDashboardIdRef.current = null;
                                        toastSuccess = 'Saved to cloud (re-created; old id was not on server)';
                                    }
                                } else {
                                    addToast('Could not sync to cloud. Saved on this device only.', 'warning');
                                }
                            } else if (!putRes.ok) {
                                addToast('Could not sync to cloud. Saved on this device only.', 'warning');
                            }
                        } catch {
                            addToast('Failed to sync with cloud. Saved locally.', 'warning');
                        }
                    }
                } else {
                    const newId = `dash_${now}`;
                    const newDash: DashboardLayout = {
                        id: newId,
                        name: effectiveName,
                        panels,
                        gridLayout,
                        createdAt: now,
                        updatedAt: now,
                    };

                    if (token) {
                        try {
                            const res = await fetch(`${API_URL}/api/dashboards`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ name: effectiveName, panels, gridLayout }),
                            });
                            if (res.ok) {
                                const saved = normalizeDashboardList([await res.json()])[0];
                                if (saved) {
                                    newDash.id = saved.id;
                                    newDash.createdAt = saved.createdAt;
                                    newDash.updatedAt = saved.updatedAt;
                                    targetId = saved.id;
                                }
                            } else {
                                addToast('Could not create on cloud. Saved on this device only.', 'warning');
                            }
                        } catch {
                            addToast('Failed to sync with cloud. Saved locally.', 'warning');
                        }
                    }
                    updatedDashboards = [newDash, ...dashboards];
                    setActiveDashboardId(targetId || newDash.id);
                    lastSyncedDashboardIdRef.current = null;
                }

                setDashboards(updatedDashboards);
                persistDashboards(updatedDashboards);
                setShowSaveDialog(false);
                setSaveName('');
                addToast(toastSuccess, 'success');
                skipAutoSelectDashboardRef.current = false;
            } finally {
                setIsSaving(false);
            }
        },
        [saveName, panels, gridLayout, dashboards, activeDashboardId, token, addToast]
    );

    const requestSave = useCallback(
        (e?: React.MouseEvent) => {
            if (e?.shiftKey) {
                setSaveName(activeDashboard?.name || 'Main Dashboard');
                setShowSaveDialog(true);
                return;
            }
            if (activeDashboardId && dashboards.some((d) => d.id === activeDashboardId)) {
                const ex = dashboards.find((d) => d.id === activeDashboardId);
                if (ex?.name?.trim()) {
                    void commitDashboardSave(ex.name);
                    return;
                }
            }
            setSaveName(activeDashboard?.name || 'Main Dashboard');
            setShowSaveDialog(true);
        },
        [activeDashboardId, dashboards, activeDashboard?.name, commitDashboardSave]
    );

    // Load Dashboard
    const loadDashboard = useCallback((id: string) => {
        skipAutoSelectDashboardRef.current = false;
        setActiveDashboardId(id);
        setShowLoadMenu(false);
    }, []);

    // Delete Dashboard
    const deleteDashboard = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this dashboard?')) return;
        
        let updatedDashboards = dashboards.filter(d => d.id !== id);
        
        if (token) {
            try {
                await fetch(`${API_URL}/api/dashboards/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (e) {
                addToast('Failed to sync deletion with cloud.', 'error');
            }
        }

        setDashboards(updatedDashboards);
        persistDashboards(updatedDashboards);
        if (activeDashboardId === id) {
            lastSyncedDashboardIdRef.current = null;
            setActiveDashboardId(null);
            setPanels([]);
            setGridLayout([]);
        }
        addToast('Dashboard deleted', 'success');
    }, [dashboards, activeDashboardId, token, addToast]);

    // New Dashboard
    const newDashboard = useCallback(() => {
        if (panels.length > 0 && !window.confirm('Start a new canvas? Unsaved layout changes will be cleared.')) {
            return;
        }
        skipAutoSelectDashboardRef.current = true;
        lastSyncedDashboardIdRef.current = null;
        setActiveDashboardId(null);
        setPanels([]);
        setGridLayout([]);
        setShowLoadMenu(false);
    }, [panels.length]);

    // Grid layout change
    const onLayoutChange = useCallback((layout: RGLLayout) => {
        setGridLayout([...layout]);
    }, []);

    // Export JSON
    const exportDashboard = useCallback(() => {
        const name = activeDashboard?.name || 'dashboard';
        const slug = name.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'export';
        const data = {
            version: 1,
            name,
            dashboardId: activeDashboardId,
            panels,
            gridLayout,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nalyse-${slug}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Dashboard exported', 'success');
    }, [panels, gridLayout, activeDashboard?.name, activeDashboardId, addToast]);

    const importFileRef = useRef<HTMLInputElement>(null);

    const openLoadMenu = useCallback(() => {
        if (dashboards.length === 0) {
            addToast('No saved dashboards yet. Save this canvas first.', 'info');
            return;
        }
        setShowLoadMenu((v) => !v);
    }, [dashboards.length, addToast]);

    const triggerImport = useCallback(() => importFileRef.current?.click(), []);

    const importDashboard = useCallback(
        (file: File) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const raw = JSON.parse(String(reader.result)) as {
                        panels?: PanelConfig[];
                        gridLayout?: LayoutItem[];
                    };
                    if (!Array.isArray(raw.panels) || !Array.isArray(raw.gridLayout)) {
                        addToast('Invalid file: need panels and gridLayout arrays', 'error');
                        return;
                    }
                    skipAutoSelectDashboardRef.current = true;
                    lastSyncedDashboardIdRef.current = null;
                    setActiveDashboardId(null);
                    setPanels(raw.panels);
                    setGridLayout(raw.gridLayout);
                    setShowLoadMenu(false);
                    addToast('Layout imported — use Save to store it', 'success');
                } catch {
                    addToast('Could not read dashboard JSON', 'error');
                }
            };
            reader.readAsText(file);
        },
        [addToast]
    );

    const importInput = (
        <input
            type="file"
            ref={importFileRef}
            hidden
            accept="application/json,.json"
            onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importDashboard(f);
                e.target.value = '';
            }}
        />
    );

    /* ─ Empty State ─ */
    if (panels.length === 0 && !showAddPanel) {
        return (
            <>
            <div ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Toolbar */}
                <Toolbar
                    editMode={editMode} setEditMode={setEditMode}
                    onAdd={() => setShowAddPanel(true)}
                    onSave={requestSave}
                    onLoad={openLoadMenu} onNew={newDashboard}
                    onFullscreen={toggleFullscreen} isFullscreen={isFullscreen}
                    onExport={exportDashboard} onImport={triggerImport}
                    dashboardName={activeDashboard?.name}
                    autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh}
                    dashboards={dashboards} showLoadMenu={showLoadMenu}
                    onLoadDashboard={loadDashboard} onDeleteDashboard={deleteDashboard}
                    loadMenuRef={loadMenuRef}
                />

                {/* Empty Canvas */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '24px', padding: '48px',
                }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, var(--primary-subtle), var(--bg-surface))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px dashed var(--border-subtle)',
                    }}>
                        <LayoutIcon size={32} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px' }}>Dashboard Canvas</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.6 }}>
                            Build custom dashboards by adding panels with charts, metrics, tables, and annotations.
                            Drag to reorder, resize to fit, and save for later.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {PANEL_TEMPLATES.map(t => (
                            <button
                                key={t.type}
                                onClick={() => addPanel(t.type)}
                                style={{
                                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                    borderRadius: '12px', padding: '14px 18px',
                                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                                    color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600,
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.background = 'var(--primary-subtle)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                    e.currentTarget.style.background = 'var(--bg-surface)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <span style={{ color: 'var(--primary)' }}>{t.icon}</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 700 }}>{t.label}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                    {dashboards.length > 0 && (
                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>or load:</span>
                            {dashboards.slice(0, 5).map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => loadDashboard(d.id)}
                                    style={{
                                        background: 'var(--bg-main)', border: '1px solid var(--border-subtle)',
                                        borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
                                        color: 'var(--primary)', fontSize: '11px', fontWeight: 700,
                                    }}
                                >
                                    {d.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Save Dialog Overlay */}
                <SaveDialog show={showSaveDialog} name={saveName} setName={setSaveName}
                    onSave={() => void commitDashboardSave()} onClose={() => setShowSaveDialog(false)} isSaving={isSaving} />
            </div>
            {importInput}
            </>
        );
    }

    return (
        <>
        <div ref={containerRef} style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            background: isFullscreen ? 'var(--bg-main)' : undefined,
        }}>
            {/* Toolbar */}
            <Toolbar
                editMode={editMode} setEditMode={setEditMode}
                onAdd={() => setShowAddPanel(true)}
                onSave={requestSave}
                onLoad={openLoadMenu} onNew={newDashboard}
                onFullscreen={toggleFullscreen} isFullscreen={isFullscreen}
                onExport={exportDashboard} onImport={triggerImport}
                dashboardName={activeDashboard?.name}
                autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh}
                dashboards={dashboards} showLoadMenu={showLoadMenu}
                onLoadDashboard={loadDashboard} onDeleteDashboard={deleteDashboard}
                loadMenuRef={loadMenuRef}
                panelCount={panels.length}
            />

            {/* Grid */}
            <div ref={gridContainerRef} style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
                {gridMounted && <ResponsiveGridLayout
                    className="dashboard-canvas-grid"
                    width={gridWidth}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
                    rowHeight={60}
                    layouts={{ lg: gridLayout }}
                    onLayoutChange={(layout) => onLayoutChange(layout)}
                    dragConfig={{ enabled: editMode, handle: '.panel-drag-handle', cancel: 'button', threshold: 3, bounded: false }}
                    resizeConfig={{ enabled: editMode, handles: ['se'] }}
                    margin={[12, 12] as const}
                    containerPadding={[0, 0] as const}
                >
                    {panels.map(panel => (
                        <div key={panel.id} style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '0 2px 12px -4px rgba(0,0,0,0.15)',
                            transition: 'box-shadow 0.2s',
                        }}>
                            {/* Panel Header */}
                            <div className="panel-drag-handle" style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 12px',
                                borderBottom: '1px solid var(--border-subtle)',
                                cursor: editMode ? 'grab' : 'default',
                                background: 'var(--bg-surface)',
                                minHeight: '36px',
                            }}>
                                {editMode && <GripVertical size={14} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
                                <span style={{ color: 'var(--primary)', opacity: 0.7 }}>{panelIcon(panel.type)}</span>
                                <span style={{
                                    fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)',
                                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{panel.title}</span>
                                {editMode && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button type="button" onClick={() => toggleLock(panel.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: panel.locked ? 'var(--warning)' : 'var(--text-muted)', opacity: panel.locked ? 1 : 0.4 }}>
                                            {panel.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                        </button>
                                        <button type="button" onClick={() => duplicatePanel(panel.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)', opacity: 0.4 }}>
                                            <Copy size={12} />
                                        </button>
                                        <button type="button" onClick={() => removePanel(panel.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--danger)', opacity: 0.6 }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Panel Content */}
                            <div
                                style={{ flex: 1, padding: panel.type === 'table' || panel.type === 'markdown' ? '0' : '8px', overflow: 'hidden' }}
                                key={`${panel.id}-${lastRefresh}`}
                            >
                                {renderPanel(panel)}
                            </div>
                        </div>
                    ))}
                </ResponsiveGridLayout>}
            </div>

            {/* Add Panel Overlay */}
            <AnimatePresence>
                {showAddPanel && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)', zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onClick={() => setShowAddPanel(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                borderRadius: '20px', padding: '24px', width: '500px', maxWidth: '90vw',
                                boxShadow: '0 24px 80px -16px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Add Panel</h3>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Choose visualization type</p>
                                </div>
                                <button onClick={() => setShowAddPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                {PANEL_TEMPLATES.map(t => (
                                    <button
                                        key={t.type}
                                        onClick={() => addPanel(t.type)}
                                        style={{
                                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                            borderRadius: '12px', padding: '16px',
                                            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                            textAlign: 'left', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                            e.currentTarget.style.background = 'var(--primary-subtle)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                            e.currentTarget.style.background = 'var(--bg-surface)';
                                        }}
                                    >
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--primary)', flexShrink: 0,
                                        }}>{t.icon}</div>
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{t.label}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Save Dialog */}
            <SaveDialog show={showSaveDialog} name={saveName} setName={setSaveName}
                onSave={() => void commitDashboardSave()} onClose={() => setShowSaveDialog(false)} isSaving={isSaving} />
        </div>
        {importInput}
        </>
    );
};

/* ═══ Toolbar ═══ */
interface ToolbarProps {
    editMode: boolean; setEditMode: (v: boolean) => void;
    onAdd: () => void; onSave: (e?: React.MouseEvent) => void; onLoad: () => void; onNew: () => void;
    onFullscreen: () => void; isFullscreen: boolean; onExport: () => void; onImport: () => void;
    dashboardName?: string; autoRefresh: number; setAutoRefresh: (v: number) => void;
    dashboards: DashboardLayout[]; showLoadMenu: boolean;
    onLoadDashboard: (id: string) => void; onDeleteDashboard: (id: string) => void;
    panelCount?: number;
    loadMenuRef: React.RefObject<HTMLDivElement | null>;
}

const Toolbar: React.FC<ToolbarProps> = ({
    editMode, setEditMode, onAdd, onSave, onLoad, onNew, onFullscreen, isFullscreen,
    onExport, onImport, dashboardName, autoRefresh, setAutoRefresh, dashboards, showLoadMenu,
    onLoadDashboard, onDeleteDashboard, panelCount = 0, loadMenuRef,
}) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        flexWrap: 'wrap',
    }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>
                {dashboardName || 'Untitled Canvas'}
            </span>
            {panelCount > 0 && (
                <span style={{
                    fontSize: '9px', fontWeight: 800, background: 'var(--primary-subtle)',
                    color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px',
                }}>{panelCount} panels</span>
            )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Edit Mode Toggle */}
        <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: editMode ? 'var(--primary-subtle)' : 'var(--bg-main)',
                border: `1px solid ${editMode ? 'var(--primary)' : 'var(--border-subtle)'}`,
                borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
                color: editMode ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '11px', fontWeight: 700, transition: 'all 0.2s',
            }}
        >
            {editMode ? <Edit3 size={13} /> : <Eye size={13} />}
            {editMode ? 'Editing' : 'Viewing'}
        </button>

        {/* Auto Refresh */}
        <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
            <select
                value={autoRefresh}
                onChange={e => setAutoRefresh(Number(e.target.value))}
                style={{
                    background: 'var(--bg-main)', border: '1px solid var(--border-subtle)',
                    borderRadius: '8px', padding: '6px 8px', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600,
                    appearance: 'none', paddingRight: '24px', paddingLeft: '28px',
                }}
            >
                <option value={0}>Auto-refresh: Off</option>
                <option value={10}>Every 10s</option>
                <option value={30}>Every 30s</option>
                <option value={60}>Every 1m</option>
                <option value={300}>Every 5m</option>
            </select>
            <RefreshCw size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>

        {/* Action Buttons */}
        <ToolbarBtn icon={<Plus size={14} />} label="Add" onClick={onAdd} primary />
        <ToolbarBtn icon={<Save size={14} />} label="Save" title="Save — Shift+click to name or rename" onClick={onSave} />
        <div ref={loadMenuRef} style={{ position: 'relative' }}>
            <ToolbarBtn icon={<FolderOpen size={14} />} label="Load" onClick={onLoad} />
            {showLoadMenu && dashboards.length > 0 && (
                <div
                    style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        borderRadius: '12px', padding: '8px', minWidth: '220px', maxHeight: '320px', overflowY: 'auto', zIndex: 50000,
                        boxShadow: '0 12px 40px -8px rgba(0,0,0,0.4)',
                    }}
                    onMouseDown={e => e.stopPropagation()}
                >
                    {dashboards.map(d => (
                        <div key={d.id} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                            transition: 'background 0.1s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-subtle)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            <button
                                type="button"
                                onClick={() => onLoadDashboard(d.id)}
                                style={{
                                    flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                                    padding: 0, color: 'inherit',
                                }}
                            >
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</div>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{d.panels.length} panels · {new Date(d.updatedAt).toLocaleDateString()}</div>
                            </button>
                            <button
                                type="button"
                                title="Delete dashboard"
                                onClick={(e) => { e.stopPropagation(); onDeleteDashboard(d.id); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--danger)', opacity: 0.6 }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <ToolbarBtn icon={<Upload size={14} />} label="Import" onClick={onImport} />
        <ToolbarBtn icon={<Download size={14} />} label="Export" onClick={onExport} />
        <ToolbarBtn icon={isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />} label={isFullscreen ? 'Exit' : 'Full'} onClick={onFullscreen} />
        <ToolbarBtn icon={<Grid3X3 size={14} />} label="New" onClick={onNew} />
    </div>
);

/* ═══ Toolbar Button ═══ */
const ToolbarBtn: React.FC<{
    icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; primary?: boolean; title?: string;
}> = ({ icon, label, onClick, primary, title }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: primary ? 'var(--primary)' : 'var(--bg-main)',
            border: `1px solid ${primary ? 'var(--primary)' : 'var(--border-subtle)'}`,
            borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
            color: primary ? '#fff' : 'var(--text-muted)',
            fontSize: '10px', fontWeight: 700, transition: 'all 0.15s',
            whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
            if (!primary) e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={e => {
            if (!primary) e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
    >
        {icon}
        <span className="hidden md:inline">{label}</span>
    </button>
);

/* ═══ Save Dialog ═══ */
const SaveDialog: React.FC<{
    show: boolean; name: string; setName: (v: string) => void;
    onSave: () => void; onClose: () => void; isSaving?: boolean;
}> = ({ show, name, setName, onSave, onClose, isSaving = false }) =>
    createPortal(
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)', zIndex: 100000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                            borderRadius: '16px', padding: '24px', width: '400px', maxWidth: '92vw',
                            boxShadow: '0 24px 80px -16px rgba(0,0,0,0.5)',
                        }}
                    >
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                            <Save size={18} style={{ verticalAlign: '-3px', marginRight: '8px', color: 'var(--primary)' }} />
                            Save Dashboard
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '-8px 0 12px' }}>
                            Tip: a normal click on Save updates the current dashboard. Shift+click Save to pick a new name.
                        </p>
                        <input
                            autoFocus value={name} onChange={e => setName(e.target.value)}
                            disabled={isSaving}
                            onKeyDown={e => { if (e.key === 'Enter' && !isSaving) onSave(); if (e.key === 'Escape' && !isSaving) onClose(); }}
                            placeholder="Dashboard name (e.g. Revenue Overview)"
                            style={{
                                width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-default)',
                                padding: '10px 14px', borderRadius: '10px', color: 'var(--text-primary)',
                                fontSize: '13px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={onClose} disabled={isSaving} style={{
                                background: 'var(--bg-main)', border: '1px solid var(--border-subtle)',
                                padding: '8px 16px', borderRadius: '8px', color: 'var(--text-muted)',
                                fontSize: '12px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.5 : 1,
                            }}>Cancel</button>
                            <button type="button" onClick={onSave} disabled={!name.trim() || isSaving} style={{
                                background: 'var(--primary)', border: 'none',
                                padding: '8px 20px', borderRadius: '8px', color: '#fff',
                                fontSize: '12px', fontWeight: 700, cursor: !name.trim() || isSaving ? 'not-allowed' : 'pointer',
                                opacity: name.trim() && !isSaving ? 1 : 0.4,
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                            }}>{isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Dashboard'}</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
