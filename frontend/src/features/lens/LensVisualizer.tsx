import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';
import { 
    BarChart3, LineChart, PieChart, ScatterChart, 
    Calculator, Hash, Type, Calendar, MapPin, 
    GripVertical, Settings2, Sparkles, Plus, Play,
    CheckCircle2, AlertTriangle, Layers, XCircle, Database
} from 'lucide-react';
import { 
    BarChart, Bar, LineChart as RechartsLine, Line, 
    PieChart as RechartsPie, Pie, ScatterChart as RechartsScatter, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Area, AreaChart
} from 'recharts';
import { InsightPanel } from '../../components/ui/InsightPanel';

// --- Types ---
type FieldType = 'number' | 'string' | 'date' | 'geo';

interface Field {
    id: string;
    name: string;
    type: FieldType;
}

interface DropZone {
    id: 'xAxis' | 'yAxis' | 'breakdown';
    label: string;
    field: Field | null;
    accepts: FieldType[]; // If empty, accepts all
}

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'metric' | 'area';

const COLORS = ['#00d4aa', '#ffb800', '#a78bfa', '#ff6b6b', '#74b9ff', '#55efc4'];

const FieldIcon = ({ type }: { type: FieldType }) => {
    switch (type) {
        case 'number': return <Hash size={14} color="var(--primary)" />;
        case 'string': return <Type size={14} color="var(--warning)" />;
        case 'date': return <Calendar size={14} color="var(--success)" />;
        case 'geo': return <MapPin size={14} color="var(--danger)" />;
    }
};

const ChartIcon = ({ type }: { type: ChartType }) => {
    switch (type) {
        case 'bar': return <BarChart3 size={16} />;
        case 'line': return <LineChart size={16} />;
        case 'pie': return <PieChart size={16} />;
        case 'scatter': return <ScatterChart size={16} />;
        case 'metric': return <Calculator size={16} />;
        case 'area': return <Layers size={16} />;
    }
};

export const LensVisualizer: React.FC = () => {
    const { token } = useAuth();
    const { addToast } = useToast();
    const [datasets, setDatasets] = useState<any[]>([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
    const [datasetData, setDatasetData] = useState<any[]>([]);
    const [fields, setFields] = useState<Field[]>([]);
    const [zones, setZones] = useState<DropZone[]>([
        { id: 'xAxis', label: 'X-Axis / Category', field: null, accepts: [] },
        { id: 'yAxis', label: 'Y-Axis / Measure', field: null, accepts: ['number'] },
        { id: 'breakdown', label: 'Breakdown / Series', field: null, accepts: ['string'] }
    ]);
    const [draggedField, setDraggedField] = useState<Field | null>(null);
    const [selectedChartOverride, setSelectedChartOverride] = useState<ChartType | null>(null);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/api/files`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setDatasets(data);
            })
            .catch(e => console.error(e));
    }, [token]);

    useEffect(() => {
        if (!selectedDatasetId || !token) {
            setDatasetData([]);
            setFields([]);
            setZones(prev => prev.map(z => ({ ...z, field: null })));
            return;
        }
        fetch(`${API_URL}/api/files/${selectedDatasetId}/analyze`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (data && data.sampleData && data.sampleData.length > 0) {
                    setDatasetData(data.sampleData);
                    const sample = data.sampleData[0];
                    const newFields: Field[] = Object.keys(sample).map(key => {
                        const val = sample[key];
                        let type: FieldType = 'string';
                        if (typeof val === 'number') type = 'number';
                        else if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') type = 'number';
                        else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) type = 'date';
                        return { id: key, name: key, type };
                    });
                    setFields(newFields);
                } else {
                    setDatasetData([]);
                    setFields([]);
                }
                setZones(prev => prev.map(z => ({ ...z, field: null })));
            })
            .catch(e => console.error(e));
    }, [selectedDatasetId, token]);

    // --- HTML5 Drag & Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, field: Field) => {
        setDraggedField(field);
        e.dataTransfer.setData('text/plain', field.id);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent, zone: DropZone) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent, zoneId: string) => {
        e.preventDefault();
        if (!draggedField) return;

        setZones(prev => prev.map(zone => {
            if (zone.id === zoneId) {
                // Check if accepted
                if (zone.accepts.length > 0 && !zone.accepts.includes(draggedField.type)) {
                    // Could show a toast error here
                    return zone; 
                }
                return { ...zone, field: draggedField };
            }
            return zone;
        }));
        setDraggedField(null);
        setSelectedChartOverride(null); // Reset override on new drop
    };

    const removeField = (zoneId: string) => {
        setZones(prev => prev.map(z => z.id === zoneId ? { ...z, field: null } : z));
    };

    // --- Smart Suggestion Engine ---
    const { suggestedChart, availableCharts, xField, yField, breakdownField } = useMemo(() => {
        const xField = zones.find(z => z.id === 'xAxis')?.field;
        const yField = zones.find(z => z.id === 'yAxis')?.field;
        const breakdownField = zones.find(z => z.id === 'breakdown')?.field;

        let suggested: ChartType = 'bar';
        let available: ChartType[] = [];

        if (!xField && !yField) {
            return { suggestedChart: null, availableCharts: [], xField, yField, breakdownField };
        }

        if (yField && !xField && !breakdownField) {
            suggested = 'metric';
            available = ['metric'];
        } else if (xField?.type === 'date' && yField?.type === 'number') {
            suggested = 'area';
            available = ['line', 'area', 'bar'];
        } else if ((xField?.type === 'string' || xField?.type === 'number') && yField?.type === 'number') {
            suggested = 'bar';
            available = ['bar', 'pie', 'line', 'scatter'];
        } else if (xField?.type === 'number' && yField?.type === 'number') {
            suggested = 'scatter';
            available = ['scatter', 'bar', 'line'];
        } else if (xField?.type === 'string' && !yField) {
            // Edge case: Just a category dragged, imply count
            suggested = 'pie';
            available = ['pie', 'bar'];
        } else {
            suggested = 'bar';
            available = ['bar', 'line', 'pie'];
        }

        return { suggestedChart: suggested, availableCharts: available, xField, yField, breakdownField };
    }, [zones]);

    const activeChart = selectedChartOverride || suggestedChart;

    // --- Aggregation logic for mock preview ---
    const previewData = useMemo(() => {
        if (!xField && !yField) return [];
        
        // Simple mock aggregation
        const keyMap = new Map();
        
        datasetData.forEach(row => {
            let key = 'All';
            if (xField) {
                key = (row as any)[xField.name];
            }
            
            if (!keyMap.has(key)) {
                keyMap.set(key, { category: key, value: 0 });
            }
            
            const curr = keyMap.get(key);
            if (yField) {
                const rawVal = (row as any)[yField.name];
                const numVal = Number(rawVal);
                curr.value += (isNaN(numVal) ? 0 : numVal);
            } else {
                curr.value += 1; // Count
            }
        });

        // Add breakdown split if needed (simplified mock logic)
        return Array.from(keyMap.values()).slice(0, 10); // Limit to 10 for preview
    }, [xField, yField, breakdownField]);

    // --- Renderer Helpers ---
    const renderChart = () => {
        if (!selectedDatasetId) {
            return (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', marginBottom: '24px' }}>
                        <Database size={48} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Select Data Source</h3>
                    <p style={{ fontSize: '14px', maxWidth: '320px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Choose a dataset from the registry on the left to begin building visualizations.
                    </p>
                </div>
            );
        }

        if (!activeChart || previewData.length === 0) {
            return (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                        <Sparkles size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--primary)' }} />
                    </motion.div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Lens Ready</h3>
                    <p style={{ fontSize: '14px', maxWidth: '300px', textAlign: 'center', marginTop: '8px' }}>
                        Drag and drop fields from the sidebar onto the canvas zones to generate smart visualizations.
                    </p>
                </div>
            );
        }

        const yName = yField ? yField.name : 'count';
        const xName = xField ? xField.name : 'category';

        switch (activeChart) {
            case 'metric':
                const sum = previewData.reduce((acc, curr) => acc + curr.value, 0);
                return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                            Total {yName}
                        </div>
                        <div style={{ fontSize: '64px', fontWeight: 800, color: 'var(--text-primary)', textShadow: '0 0 40px rgba(99, 102, 241, 0.3)' }}>
                            {sum > 1000 ? `${(sum/1000).toFixed(1)}k` : sum}
                        </div>
                    </div>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                            <Pie data={previewData} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={120} label>
                                {previewData.map((e, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Legend />
                        </RechartsPie>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsLine data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                            <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                            <Line type="monotone" dataKey="value" name={yName} stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </RechartsLine>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={previewData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                            <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                            <Area type="monotone" dataKey="value" name={yName} stroke="var(--primary)" fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsScatter data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                            <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis dataKey="value" stroke="var(--text-muted)" fontSize={12} name={yName} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                            <Scatter name={xName} data={previewData} fill="var(--primary)" />
                        </RechartsScatter>
                    </ResponsiveContainer>
                );
            case 'bar':
            default:
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={previewData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                            <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                            <Tooltip cursor={{ fill: 'var(--hover-bg)' }} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                            <Bar dataKey="value" name={yName} fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)', display: 'flex', flexDirection: 'column' }}>
            
            {/* ─── Premium Header ────────────────────────────────────────── */}
            <div style={{ marginBottom: '28px', flexShrink: 0 }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(52,211,153,0.2))', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={24} style={{ color: '#818cf8' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #818cf8 0%, #34d399 50%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                            Smart Lens Engine
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: '4px 0 0 0' }}>
                            Drag-and-drop visual builder · Auto-detect field types · AI chart suggestions
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '24px', overflow: 'hidden' }}>
                {/* Sidebar: Available Fields */}
                <div style={{ width: '280px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: '18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Registry</div>
                            <select 
                                value={selectedDatasetId}
                                onChange={(e) => setSelectedDatasetId(e.target.value)}
                                style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-default)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                            >
                                <option value="">Select a Dataset...</option>
                                {datasets.map(d => (
                                    <option key={d.id} value={d.id}>{d.originalName || d.filename}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {fields.map(field => (
                                <div 
                                    key={field.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, field)}
                                    style={{ 
                                        padding: '10px 14px', 
                                        background: 'var(--bg-main)', 
                                        border: '1px solid var(--border-default)', 
                                        borderRadius: '10px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px',
                                        cursor: 'grab',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-subtle)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-main)'; }}
                                >
                                    <GripVertical size={14} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                                    <FieldIcon type={field.type} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{field.name}</span>
                                    <span style={{ fontSize: '9px', background: 'var(--hover-bg)', padding: '2px 6px', borderRadius: '6px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{field.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflow: 'hidden' }}>
                    
                    {/* AI Insight Panel for loaded dataset */}
                    {datasetData.length > 0 && (
                        <InsightPanel data={datasetData} context="smart-lens" compact={true} maxInsights={3} />
                    )}

                    {/* Configuration Bar (Drop Zones) */}
                    <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-default)' }}>
                        {zones.map(zone => (
                            <div 
                                key={zone.id}
                                onDragOver={(e) => handleDragOver(e, zone)}
                                onDrop={(e) => handleDrop(e, zone.id)}
                                style={{ 
                                    flex: 1, 
                                    border: `2px dashed ${zone.field ? 'var(--primary)' : draggedField ? 'var(--primary-subtle)' : 'var(--border-default)'}`, 
                                    borderRadius: '12px', 
                                    padding: '14px',
                                    background: zone.field ? 'var(--primary-subtle)' : 'var(--bg-main)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    transition: 'all 0.3s ease',
                                    minHeight: '100px'
                                }}
                            >
                                <div style={{ fontSize: '10px', fontWeight: 800, color: zone.field ? 'var(--primary)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="flex items-center gap-2">
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: zone.field ? 'var(--primary)' : 'var(--border-default)' }} />
                                    {zone.label}
                                </div>
                                {zone.field ? (
                                    <div style={{ background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(99,102,241,0.1)' }}>
                                        <FieldIcon type={zone.field.type} />
                                        <span style={{ fontSize: '13px', fontWeight: 700, flex: 1 }}>{zone.field.name}</span>
                                        <button onClick={() => removeField(zone.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }} title="Remove">
                                            <XCircle size={15} className="hover:text-danger hover:scale-110 transition-all" />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: draggedField ? 0.8 : 0.4, fontWeight: 500, gap: '8px' }}>
                                        {zone.id === 'xAxis' && <BarChart3 size={20} />}
                                        {zone.id === 'yAxis' && <Calculator size={20} />}
                                        {zone.id === 'breakdown' && <Layers size={20} />}
                                        <span style={{ color: draggedField ? 'var(--primary-light)' : 'inherit' }}>Drop field here</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Suggestions & Chart Area */}
                    <div style={{ flex: 1, display: 'flex', gap: '24px', overflow: 'hidden' }}>
                        
                        {/* Viewport */}
                        <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '18px', border: '1px solid var(--border-default)', padding: '24px', position: 'relative' }}>
                            {suggestedChart && activeChart === suggestedChart && (
                                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                                    <div style={{ background: 'linear-gradient(135deg, #818cf8, #34d399)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
                                        <Sparkles size={12} /> AI SUGGESTION
                                    </div>
                                </div>
                            )}
                            {renderChart()}
                        </div>

                        {/* Chart Picker Side-panel */}
                        {availableCharts.length > 0 && (
                            <div style={{ width: '80px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Views</div>
                                {availableCharts.map(type => (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        key={type}
                                        onClick={() => setSelectedChartOverride(type)}
                                        style={{
                                            background: activeChart === type ? 'var(--primary)' : 'var(--bg-secondary)',
                                            border: `1px solid ${activeChart === type ? 'var(--primary)' : 'var(--border-default)'}`,
                                            color: activeChart === type ? '#fff' : 'var(--text-secondary)',
                                            borderRadius: '14px',
                                            padding: '16px 0',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            boxShadow: activeChart === type ? '0 4px 16px rgba(99,102,241,0.3)' : 'none'
                                        }}
                                        title={`Switch to ${type}`}
                                    >
                                        <ChartIcon type={type} />
                                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'capitalize' }}>{type}</span>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button onClick={() => { setZones(prev => prev.map(z => ({...z, field: null}))); setDraggedField(null); setSelectedChartOverride(null); }} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', padding: '10px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-white/5">
                            Clear Canvas
                        </button>
                        <button 
                            disabled={!activeChart} 
                            onClick={async () => {
                                const storageKey = 'nalyse_canvas_dashboards';
                                const now = Date.now();
                                const dbs = JSON.parse(localStorage.getItem(storageKey) || '[]');
                                let dash = dbs[0];
                                
                                const panelId = `panel_${now}`;
                                const newPanel = {
                                    id: panelId,
                                    type: activeChart === 'scatter' ? 'scatter' : activeChart,
                                    title: `${yField?.name || 'Count'} by ${xField?.name || 'Category'}`,
                                    config: {
                                        data: previewData,
                                        xAxisKey: 'category',
                                        yAxisKey: 'value',
                                        color: '#818cf8',
                                        sourceLens: true
                                    },
                                    locked: false
                                };
                                const newLayoutItem = { i: panelId, x: 0, y: Infinity, w: 6, h: 4, minW: 2, minH: 2 };

                                if (dash) {
                                    // Local Update
                                    dash.panels.push(newPanel);
                                    dash.gridLayout.push(newLayoutItem);
                                    dash.updatedAt = now;
                                    localStorage.setItem(storageKey, JSON.stringify(dbs));

                                    // API Sync
                                    if (token) {
                                        try {
                                            await fetch(`${API_URL}/api/dashboards/${dash.id}`, {
                                                method: 'PUT',
                                                headers: { 
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}` 
                                                },
                                                body: JSON.stringify({
                                                    panels: dash.panels,
                                                    gridLayout: dash.gridLayout
                                                })
                                            });
                                        } catch (e) {
                                            console.error('Failed to sync lens save with cloud:', e);
                                        }
                                    }
                                } else {
                                    // No dashboard yet, create one
                                    const newDash = { id: `dash_${now}`, name: 'Main Dashboard', panels: [newPanel], gridLayout: [newLayoutItem], createdAt: now, updatedAt: now };
                                    dbs.push(newDash);
                                    localStorage.setItem(storageKey, JSON.stringify(dbs));

                                    if (token) {
                                        try {
                                            await fetch(`${API_URL}/api/dashboards`, {
                                                method: 'POST',
                                                headers: { 
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}` 
                                                },
                                                body: JSON.stringify({
                                                    name: 'Main Dashboard',
                                                    panels: [newPanel],
                                                    gridLayout: [newLayoutItem]
                                                })
                                            });
                                        } catch (e) {
                                          console.error('Failed to sync new dashboard with cloud:', e);
                                        }
                                    }
                                }
                                
                                window.dispatchEvent(new CustomEvent('sync-dashboard'));
                                addToast(`Pinned ${activeChart} visualization to Dashboard Canvas`, 'success');
                                setZones(prev => prev.map(z => ({...z, field: null})));
                                setDraggedField(null);
                                setSelectedChartOverride(null);
                            }}
                            style={{ background: 'linear-gradient(135deg, #818cf8, #34d399)', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: activeChart ? 'pointer' : 'not-allowed', opacity: activeChart ? 1 : 0.4, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Layers size={15} /> Save to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
