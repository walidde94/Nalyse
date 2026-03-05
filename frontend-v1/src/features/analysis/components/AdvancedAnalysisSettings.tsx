import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Settings, Sliders, Save, Trash2, ChevronDown, ChevronRight,
    Zap, Shield, Brain, TrendingUp, Target, Filter, Clock,
    AlertTriangle, CheckCircle2, Info, RefreshCw, Copy,
    BarChart3, Layers, Eye, Activity, Sparkles, X, Plus
} from 'lucide-react';
import { API_URL } from '../../../config';

/* ════════════════════════════════════════════════════════════════════
 * Types (mirrors backend)
 * ════════════════════════════════════════════════════════════════════ */

type AnalysisMode = 'basic' | 'advanced';
type ConfidenceLevel = 0.90 | 0.95 | 0.99;
type AggMethod = 'mean' | 'median' | 'sum' | 'min' | 'max' | 'count' | 'std_dev';
type OutlierMethod = 'iqr' | 'zscore' | 'isolation_forest';

interface ThresholdConfig { metric: string; direction: 'above' | 'below' | 'between'; value: number; upperBound?: number; sensitivity: number; }
interface FeatureWeight { column: string; weight: number; enabled: boolean; }
interface TimeRangeFilter { column: string; start?: string; end?: string; granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'; includeProjections: boolean; }
interface CustomFilter { column: string; operator: string; value: string | number | (string | number)[]; }

interface ConfigState {
    name: string;
    description: string;
    mode: AnalysisMode;
    thresholds: ThresholdConfig[];
    featureWeights: FeatureWeight[];
    aggregationMethod: AggMethod;
    timeRange: TimeRangeFilter | null;
    customFilters: CustomFilter[];
    confidenceLevel: ConfidenceLevel;
    outlierDetection: boolean;
    outlierMethod: OutlierMethod;
    outlierThreshold: number;
    enableCorrelation: boolean;
    enableClustering: boolean;
    clusterCount: number;
    enableForecasting: boolean;
    forecastHorizon: number;
    samplePercentage: number;
}

interface Preset { id: string; name: string; description: string; isBuiltIn: boolean; config: any; }
interface ValidationMsg { field: string; message: string; }

const DEFAULT_CONFIG: ConfigState = {
    name: '', description: '', mode: 'basic',
    thresholds: [], featureWeights: [],
    aggregationMethod: 'mean', timeRange: null, customFilters: [],
    confidenceLevel: 0.95, outlierDetection: true, outlierMethod: 'iqr', outlierThreshold: 1.5,
    enableCorrelation: true, enableClustering: false, clusterCount: 3,
    enableForecasting: false, forecastHorizon: 12, samplePercentage: 100,
};

/* ════════════════════════════════════════════════════════════════════
 * Props
 * ════════════════════════════════════════════════════════════════════ */

interface AdvancedAnalysisSettingsProps {
    isDark?: boolean;
    token?: string;
    onConfigApplied?: (result: any) => void;
    onClose?: () => void;
}

/* ════════════════════════════════════════════════════════════════════
 * Component
 * ════════════════════════════════════════════════════════════════════ */

export const AdvancedAnalysisSettings: React.FC<AdvancedAnalysisSettingsProps> = ({
    isDark = true,
    token,
    onConfigApplied,
    onClose,
}) => {
    const [config, setConfig] = useState<ConfigState>({ ...DEFAULT_CONFIG });
    const [presets, setPresets] = useState<Preset[]>([]);
    const [selectedPresetId, setSelectedPresetId] = useState<string>('');
    const [savedConfigs, setSavedConfigs] = useState<{ id: string; name: string; updatedAt: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<ValidationMsg[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [toastMsg, setToastMsg] = useState('');
    const [showPresetDropdown, setShowPresetDropdown] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general', 'outlier']));
    const presetRef = useRef<HTMLDivElement>(null);

    const headers = useCallback(() => ({
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }), [token]);

    // ─── Fetch presets & saved configs ────────────────────────────
    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const [presetsRes, configsRes] = await Promise.all([
                    fetch(`${API_URL}/api/analysis-config/presets`, { headers: headers() }),
                    fetch(`${API_URL}/api/analysis-config`, { headers: headers() }),
                ]);
                if (presetsRes.ok) {
                    const data = await presetsRes.json();
                    setPresets(data.presets || []);
                }
                if (configsRes.ok) {
                    const data = await configsRes.json();
                    setSavedConfigs((data.configs || []).map((c: any) => ({ id: c.id, name: c.name, updatedAt: c.updatedAt })));
                }
            } catch { /* silent */ }
        })();
    }, [token, headers]);

    // ─── Close preset dropdown on outside click ──────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
                setShowPresetDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ─── Toast auto-dismiss ──────────────────────────────────────
    useEffect(() => { if (toastMsg) { const t = setTimeout(() => setToastMsg(''), 3000); return () => clearTimeout(t); } }, [toastMsg]);

    // ─── Handlers ────────────────────────────────────────────────
    const set = (key: keyof ConfigState, val: any) => setConfig(prev => ({ ...prev, [key]: val }));

    const toggleSection = (s: string) => setExpandedSections(prev => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next; });

    const applyPreset = (preset: Preset) => {
        const c = preset.config;
        setConfig({
            ...DEFAULT_CONFIG,
            ...c,
            name: c.name || preset.name,
            description: c.description || preset.description || '',
            mode: c.mode || 'advanced',
        });
        setSelectedPresetId(preset.id);
        setShowPresetDropdown(false);
        setToastMsg(`Preset "${preset.name}" loaded`);
    };

    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        setErrors([]);
        setWarnings([]);
        try {
            const body = { name: config.name || 'Untitled Configuration', description: config.description, mode: config.mode, config };
            const res = await fetch(`${API_URL}/api/analysis-config`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) {
                if (data.validation) { setErrors(data.validation.errors || []); setWarnings(data.validation.warnings || []); }
                else setErrors([{ field: 'general', message: data.error || 'Save failed' }]);
                return;
            }
            if (data.validation?.warnings?.length) setWarnings(data.validation.warnings);
            setSavedConfigs(prev => [{ id: data.config.id, name: data.config.name, updatedAt: data.config.updatedAt }, ...prev]);
            setToastMsg('Configuration saved successfully');
        } catch { setErrors([{ field: 'general', message: 'Network error' }]); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!token) return;
        try {
            await fetch(`${API_URL}/api/analysis-config/${id}`, { method: 'DELETE', headers: headers() });
            setSavedConfigs(prev => prev.filter(c => c.id !== id));
            setToastMsg('Configuration deleted');
        } catch { /* silent */ }
    };

    // ─── Style helpers ───────────────────────────────────────────
    const bg = (alpha: number) => isDark ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    const fg = (alpha: number) => isDark ? `rgba(255,255,255,${alpha})` : `rgba(15,23,42,${alpha})`;
    const accent = '#6366f1';
    const accentBg = (a: number) => `rgba(99,102,241,${a})`;

    const sectionHeader = (key: string, label: string, Icon: React.ElementType, color: string) => (
        <button
            onClick={() => toggleSection(key)}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: '12px', border: `1px solid ${bg(0.06)}`,
                background: expandedSections.has(key) ? bg(0.04) : 'transparent',
                cursor: 'pointer', transition: 'all 0.25s',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: `${color}15`, border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                }}><Icon size={16} /></div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: fg(0.9), letterSpacing: '0.02em' }}>{label}</span>
            </div>
            <ChevronDown size={14} style={{ color: fg(0.4), transform: expandedSections.has(key) ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
        </button>
    );

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 600,
        background: bg(0.03), border: `1px solid ${bg(0.08)}`, color: fg(0.9), outline: 'none',
        transition: 'all 0.2s',
    };

    const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' as never, backgroundImage: 'none' };

    const labelStyle: React.CSSProperties = {
        fontSize: '10px', fontWeight: 800, color: fg(0.5), textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px',
    };

    const toggleBtn = (active: boolean, onClick: () => void, label: string) => (
        <button onClick={onClick} style={{
            padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
            border: `1px solid ${active ? accentBg(0.4) : bg(0.08)}`,
            background: active ? accentBg(0.12) : 'transparent',
            color: active ? accent : fg(0.5),
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.03em',
        }}>{label}</button>
    );

    const tooltipIcon = (text: string) => (
        <span title={text} style={{ cursor: 'help', marginLeft: '4px', display: 'inline-flex' }}>
            <Info size={10} color={fg(0.3)} />
        </span>
    );

    // ─── Render ──────────────────────────────────────────────────
    return (
        <div style={{
            width: '100%', maxWidth: '720px', margin: '0 auto',
            background: isDark ? 'rgba(10,10,16,0.6)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(40px)',
            border: `1px solid ${bg(0.06)}`, borderRadius: '24px',
            overflow: 'hidden', position: 'relative',
        }}>
            {/* Accent top line */}
            <div style={{
                position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                background: `linear-gradient(90deg, transparent, ${accentBg(0.4)}, rgba(236,72,153,0.3), transparent)`,
            }} />

            {/* ═══════ HEADER ═══════ */}
            <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${bg(0.05)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.08))',
                            border: '1px solid rgba(99,102,241,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Sliders size={20} color="#818cf8" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: fg(0.95) }}>Analysis Configuration</h2>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: fg(0.4), letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                {config.mode === 'basic' ? 'Basic Mode' : 'Advanced Mode'} — Intelligence Engine
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Mode Toggle */}
                        <div style={{ display: 'flex', gap: '4px', padding: '3px', background: bg(0.04), borderRadius: '10px', border: `1px solid ${bg(0.06)}` }}>
                            {toggleBtn(config.mode === 'basic', () => set('mode', 'basic'), 'Basic')}
                            {toggleBtn(config.mode === 'advanced', () => set('mode', 'advanced'), 'Advanced')}
                        </div>
                        {onClose && (
                            <button onClick={onClose} style={{
                                width: '32px', height: '32px', borderRadius: '10px', border: `1px solid ${bg(0.06)}`,
                                background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: fg(0.4),
                            }}><X size={16} /></button>
                        )}
                    </div>
                </div>

                {/* Preset Selector */}
                <div ref={presetRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderRadius: '12px', border: `1px solid ${bg(0.08)}`,
                            background: bg(0.02), cursor: 'pointer', transition: 'all 0.2s', color: fg(0.7),
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={14} color={accent} />
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                {selectedPresetId ? presets.find(p => p.id === selectedPresetId)?.name || 'Select Preset' : 'Load a Preset...'}
                            </span>
                        </div>
                        <ChevronDown size={14} style={{ transform: showPresetDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                    </button>

                    {showPresetDropdown && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                            background: isDark ? 'rgba(15,15,22,0.95)' : 'rgba(255,255,255,0.98)',
                            border: `1px solid ${bg(0.1)}`, borderRadius: '14px', padding: '6px',
                            boxShadow: isDark ? '0 20px 40px -10px rgba(0,0,0,0.7)' : '0 20px 40px -10px rgba(0,0,0,0.12)',
                            maxHeight: '280px', overflowY: 'auto',
                        }}>
                            {presets.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: fg(0.4), fontSize: '12px' }}>No presets available</div>
                            ) : presets.map(p => (
                                <button key={p.id} onClick={() => applyPreset(p)} style={{
                                    width: '100%', display: 'flex', flexDirection: 'column', gap: '2px',
                                    padding: '10px 12px', borderRadius: '10px', border: 'none',
                                    background: selectedPresetId === p.id ? accentBg(0.08) : 'transparent',
                                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => { if (selectedPresetId !== p.id) e.currentTarget.style.background = bg(0.04); }}
                                    onMouseLeave={e => { if (selectedPresetId !== p.id) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: fg(0.9) }}>{p.name}</span>
                                        {p.isBuiltIn && <span style={{ fontSize: '8px', fontWeight: 900, padding: '2px 5px', borderRadius: '4px', background: accentBg(0.12), color: accent, letterSpacing: '0.08em' }}>BUILT-IN</span>}
                                    </div>
                                    {p.description && <span style={{ fontSize: '11px', color: fg(0.4), lineHeight: 1.3 }}>{p.description}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════ BODY ═══════ */}
            <div style={{ padding: '16px 24px 20px', maxHeight: '60vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: `${bg(0.1)} transparent` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* ── General ─────────────────────────────────────────── */}
                    {sectionHeader('general', 'General Settings', Settings, '#6366f1')}
                    {expandedSections.has('general') && (
                        <div style={{ padding: '14px', borderRadius: '14px', background: bg(0.02), border: `1px solid ${bg(0.04)}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <div style={labelStyle}>Configuration Name</div>
                                    <input style={inputStyle} value={config.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Q3 Revenue Deep Dive" />
                                </div>
                                <div>
                                    <div style={labelStyle}>Aggregation Method {tooltipIcon('How numeric columns are summarized: mean, median, sum, etc.')}</div>
                                    <select style={selectStyle} value={config.aggregationMethod} onChange={e => set('aggregationMethod', e.target.value)}>
                                        {['mean', 'median', 'sum', 'min', 'max', 'count', 'std_dev'].map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div style={labelStyle}>Description</div>
                                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={config.description} onChange={e => set('description', e.target.value)} placeholder="Optional description..." />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <div style={labelStyle}>Confidence Level {tooltipIcon('Statistical confidence level for hypothesis tests and intervals.')}</div>
                                    <select style={selectStyle} value={config.confidenceLevel} onChange={e => set('confidenceLevel', parseFloat(e.target.value))}>
                                        <option value={0.90}>90% Confidence</option>
                                        <option value={0.95}>95% Confidence</option>
                                        <option value={0.99}>99% Confidence</option>
                                    </select>
                                </div>
                                <div>
                                    <div style={labelStyle}>Sample Size {tooltipIcon('Percentage of data to analyze. Lower values speed up processing but may reduce accuracy.')}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="range" min={1} max={100} value={config.samplePercentage} onChange={e => set('samplePercentage', parseInt(e.target.value))}
                                            style={{ flex: 1, accentColor: accent }} />
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: accent, fontFamily: 'var(--font-mono)', minWidth: '36px' }}>{config.samplePercentage}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Outlier Detection ───────────────────────────────── */}
                    {sectionHeader('outlier', 'Outlier Detection', Eye, '#f43f5e')}
                    {expandedSections.has('outlier') && (
                        <div style={{ padding: '14px', borderRadius: '14px', background: bg(0.02), border: `1px solid ${bg(0.04)}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: fg(0.7) }}>Enable Outlier Detection {tooltipIcon('Automatically detect unusual data points that deviate from the norm.')}</span>
                                <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={config.outlierDetection} onChange={e => set('outlierDetection', e.target.checked)}
                                        style={{ opacity: 0, width: 0, height: 0 }} />
                                    <span style={{
                                        position: 'absolute', inset: 0, borderRadius: '11px', transition: 'all 0.3s',
                                        background: config.outlierDetection ? accent : bg(0.15),
                                    }}>
                                        <span style={{
                                            position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                                            top: '3px', left: config.outlierDetection ? '21px' : '3px', transition: 'left 0.3s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        }} />
                                    </span>
                                </label>
                            </div>
                            {config.outlierDetection && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <div style={labelStyle}>Detection Method</div>
                                        <select style={selectStyle} value={config.outlierMethod} onChange={e => set('outlierMethod', e.target.value)}>
                                            <option value="iqr">IQR (Interquartile Range)</option>
                                            <option value="zscore">Z-Score</option>
                                            <option value="isolation_forest">Isolation Forest (ML)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <div style={labelStyle}>Threshold {tooltipIcon('IQR: multiplier (1.5=moderate), Z-Score: std devs (3=strict), IF: contamination fraction')}</div>
                                        <input type="number" step={0.1} style={inputStyle} value={config.outlierThreshold}
                                            onChange={e => set('outlierThreshold', parseFloat(e.target.value) || 0)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══ Advanced-only sections ═══════════════════════════ */}
                    {config.mode === 'advanced' && (
                        <>
                            {/* ── Correlation / Clustering / Forecasting ──────── */}
                            {sectionHeader('ml', 'ML & Forecasting', Brain, '#8b5cf6')}
                            {expandedSections.has('ml') && (
                                <div style={{ padding: '14px', borderRadius: '14px', background: bg(0.02), border: `1px solid ${bg(0.04)}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {/* Correlation Toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: fg(0.7) }}>Correlation Analysis {tooltipIcon('Identify relationships between numeric features.')}</span>
                                        <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={config.enableCorrelation} onChange={e => set('enableCorrelation', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                            <span style={{ position: 'absolute', inset: 0, borderRadius: '11px', transition: 'all 0.3s', background: config.enableCorrelation ? '#8b5cf6' : bg(0.15) }}>
                                                <span style={{ position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', top: '3px', left: config.enableCorrelation ? '21px' : '3px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                                            </span>
                                        </label>
                                    </div>

                                    {/* Clustering */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: fg(0.7) }}>K-Means Clustering {tooltipIcon('Group similar data points into clusters.')}</span>
                                        <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={config.enableClustering} onChange={e => set('enableClustering', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                            <span style={{ position: 'absolute', inset: 0, borderRadius: '11px', transition: 'all 0.3s', background: config.enableClustering ? '#8b5cf6' : bg(0.15) }}>
                                                <span style={{ position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', top: '3px', left: config.enableClustering ? '21px' : '3px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                                            </span>
                                        </label>
                                    </div>
                                    {config.enableClustering && (
                                        <div style={{ paddingLeft: '20px' }}>
                                            <div style={labelStyle}>Number of Clusters (k) {tooltipIcon('2-20 clusters. More clusters = finer segmentation.')}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input type="range" min={2} max={20} value={config.clusterCount} onChange={e => set('clusterCount', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#8b5cf6' }} />
                                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#8b5cf6', fontFamily: 'var(--font-mono)', minWidth: '24px' }}>{config.clusterCount}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Forecasting */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: fg(0.7) }}>Time-Series Forecasting {tooltipIcon('Generate future predictions using ARIMA/ETS ensemble models.')}</span>
                                        <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={config.enableForecasting} onChange={e => set('enableForecasting', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                            <span style={{ position: 'absolute', inset: 0, borderRadius: '11px', transition: 'all 0.3s', background: config.enableForecasting ? '#8b5cf6' : bg(0.15) }}>
                                                <span style={{ position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', top: '3px', left: config.enableForecasting ? '21px' : '3px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                                            </span>
                                        </label>
                                    </div>
                                    {config.enableForecasting && (
                                        <div style={{ paddingLeft: '20px' }}>
                                            <div style={labelStyle}>Forecast Horizon (periods) {tooltipIcon('Number of future periods to predict. 1-120.')}</div>
                                            <input type="number" min={1} max={120} style={inputStyle} value={config.forecastHorizon}
                                                onChange={e => set('forecastHorizon', parseInt(e.target.value) || 12)} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Thresholds ─────────────────────────────────── */}
                            {sectionHeader('thresholds', 'Threshold Monitoring', Target, '#f59e0b')}
                            {expandedSections.has('thresholds') && (
                                <div style={{ padding: '14px', borderRadius: '14px', background: bg(0.02), border: `1px solid ${bg(0.04)}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {config.thresholds.map((t, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 2 }}>
                                                {i === 0 && <div style={labelStyle}>Metric</div>}
                                                <input style={inputStyle} value={t.metric} placeholder="Column name"
                                                    onChange={e => { const next = [...config.thresholds]; next[i] = { ...t, metric: e.target.value }; set('thresholds', next); }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                {i === 0 && <div style={labelStyle}>Direction</div>}
                                                <select style={selectStyle} value={t.direction}
                                                    onChange={e => { const next = [...config.thresholds]; next[i] = { ...t, direction: e.target.value as any }; set('thresholds', next); }}>
                                                    <option value="above">Above</option><option value="below">Below</option><option value="between">Between</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                {i === 0 && <div style={labelStyle}>Value</div>}
                                                <input type="number" style={inputStyle} value={t.value}
                                                    onChange={e => { const next = [...config.thresholds]; next[i] = { ...t, value: parseFloat(e.target.value) || 0 }; set('thresholds', next); }} />
                                            </div>
                                            <button onClick={() => set('thresholds', config.thresholds.filter((_, j) => j !== i))} style={{
                                                width: '32px', height: '38px', borderRadius: '8px', border: 'none',
                                                background: 'rgba(244,63,94,0.1)', color: '#f43f5e', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => set('thresholds', [...config.thresholds, { metric: '', direction: 'above' as const, value: 0, sensitivity: 0.5 }])} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        padding: '8px', borderRadius: '10px', border: `1px dashed ${bg(0.15)}`,
                                        background: 'transparent', color: fg(0.5), fontSize: '11px', fontWeight: 700,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}><Plus size={14} /> Add Threshold</button>
                                </div>
                            )}

                            {/* ── Custom Filters ─────────────────────────────── */}
                            {sectionHeader('filters', 'Custom Filters', Filter, '#06b6d4')}
                            {expandedSections.has('filters') && (
                                <div style={{ padding: '14px', borderRadius: '14px', background: bg(0.02), border: `1px solid ${bg(0.04)}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {config.customFilters.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 2 }}>
                                                {i === 0 && <div style={labelStyle}>Column</div>}
                                                <input style={inputStyle} value={f.column} placeholder="Column name"
                                                    onChange={e => { const next = [...config.customFilters]; next[i] = { ...f, column: e.target.value }; set('customFilters', next); }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                {i === 0 && <div style={labelStyle}>Operator</div>}
                                                <select style={selectStyle} value={f.operator}
                                                    onChange={e => { const next = [...config.customFilters]; next[i] = { ...f, operator: e.target.value }; set('customFilters', next); }}>
                                                    {['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains'].map(op => <option key={op} value={op}>{op.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                {i === 0 && <div style={labelStyle}>Value</div>}
                                                <input style={inputStyle} value={String(f.value)} placeholder="Value"
                                                    onChange={e => { const next = [...config.customFilters]; next[i] = { ...f, value: e.target.value }; set('customFilters', next); }} />
                                            </div>
                                            <button onClick={() => set('customFilters', config.customFilters.filter((_, j) => j !== i))} style={{
                                                width: '32px', height: '38px', borderRadius: '8px', border: 'none',
                                                background: 'rgba(244,63,94,0.1)', color: '#f43f5e', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => set('customFilters', [...config.customFilters, { column: '', operator: 'eq', value: '' }])} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        padding: '8px', borderRadius: '10px', border: `1px dashed ${bg(0.15)}`,
                                        background: 'transparent', color: fg(0.5), fontSize: '11px', fontWeight: 700,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}><Plus size={14} /> Add Filter</button>
                                </div>
                            )}

                            {/* ── Feature Weights ────────────────────────────── */}
                            {sectionHeader('weights', 'Feature Weighting', Layers, '#10b981')}
                            {expandedSections.has('weights') && (
                                <div style={{ padding: '14px', borderRadius: '14px', background: bg(0.02), border: `1px solid ${bg(0.04)}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {config.featureWeights.map((w, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input style={{ ...inputStyle, flex: 2 }} value={w.column} placeholder="Column"
                                                onChange={e => { const next = [...config.featureWeights]; next[i] = { ...w, column: e.target.value }; set('featureWeights', next); }} />
                                            <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <input type="range" min={0} max={100} value={Math.round(w.weight * 100)}
                                                    onChange={e => { const next = [...config.featureWeights]; next[i] = { ...w, weight: parseInt(e.target.value) / 100 }; set('featureWeights', next); }}
                                                    style={{ flex: 1, accentColor: '#10b981' }} />
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', minWidth: '32px' }}>{Math.round(w.weight * 100)}%</span>
                                            </div>
                                            <button onClick={() => set('featureWeights', config.featureWeights.filter((_, j) => j !== i))} style={{
                                                width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                                                background: 'rgba(244,63,94,0.1)', color: '#f43f5e', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}><X size={12} /></button>
                                        </div>
                                    ))}
                                    {(() => {
                                        const total = config.featureWeights.reduce((s, w) => s + w.weight, 0);
                                        return total > 0 ? (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px',
                                                background: total > 1 ? 'rgba(244,63,94,0.06)' : 'rgba(16,185,129,0.06)',
                                                border: `1px solid ${total > 1 ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)'}`,
                                            }}>
                                                {total > 1 ? <AlertTriangle size={12} color="#f43f5e" /> : <CheckCircle2 size={12} color="#10b981" />}
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: total > 1 ? '#f43f5e' : '#10b981' }}>
                                                    Total weight: {(total * 100).toFixed(0)}% {total > 1 ? '(exceeds 100%!)' : ''}
                                                </span>
                                            </div>
                                        ) : null;
                                    })()}
                                    <button onClick={() => set('featureWeights', [...config.featureWeights, { column: '', weight: 0.5, enabled: true }])} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        padding: '8px', borderRadius: '10px', border: `1px dashed ${bg(0.15)}`,
                                        background: 'transparent', color: fg(0.5), fontSize: '11px', fontWeight: 700,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}><Plus size={14} /> Add Feature Weight</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ═══════ VALIDATION ERRORS / WARNINGS ═══════ */}
            {(errors.length > 0 || warnings.length > 0) && (
                <div style={{ padding: '0 24px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {errors.map((e, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px',
                            background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.12)',
                        }}>
                            <AlertTriangle size={13} color="#f43f5e" />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#f43f5e' }}>{e.message}</span>
                        </div>
                    ))}
                    {warnings.map((w, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px',
                            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)',
                        }}>
                            <Info size={13} color="#f59e0b" />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>{w}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════ FOOTER ACTIONS ═══════ */}
            <div style={{
                padding: '14px 24px', borderTop: `1px solid ${bg(0.05)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: bg(0.015),
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => { setConfig({ ...DEFAULT_CONFIG }); setSelectedPresetId(''); setErrors([]); setWarnings([]); }} style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '8px 14px', borderRadius: '10px', border: `1px solid ${bg(0.08)}`,
                        background: 'transparent', color: fg(0.5), fontSize: '11px', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}><RefreshCw size={13} /> Reset</button>
                </div>
                <button onClick={handleSave} disabled={saving} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 20px', borderRadius: '12px', border: 'none',
                    background: saving ? bg(0.1) : `linear-gradient(135deg, ${accent}, #8b5cf6)`,
                    color: '#fff', fontSize: '12px', fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    boxShadow: saving ? 'none' : `0 4px 12px ${accentBg(0.3)}`,
                    letterSpacing: '0.03em',
                }}>{saving ? <><Activity size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save Configuration</>}</button>
            </div>

            {/* ═══════ TOAST ═══════ */}
            {toastMsg && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 20px', borderRadius: '14px',
                    background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    backdropFilter: 'blur(20px)',
                    color: '#10b981', fontSize: '12px', fontWeight: 700,
                    animation: 'notifSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.15)',
                }}>
                    <CheckCircle2 size={16} /> {toastMsg}
                </div>
            )}

            <style>{`
                @keyframes notifSlideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AdvancedAnalysisSettings;
