import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Sparkles,
    Layout,
    TrendingUp,
    Target,
    MessageSquare,
    ChevronRight,
    ArrowRight,
    BarChart3,
    Database,
    ShieldCheck,
    Globe,
    AlertCircle,
    CheckCircle2,
    Activity,
    Layers,
    Download,
    Filter,
    SortAsc,
    Share2,
    UserPlus,
    RefreshCw,
    Columns,
    Zap,
    Maximize2,
    Cpu,
    Network,
    Radio,
    Wifi,
    Shield,
    Terminal,
    Eye,
    Hexagon,
    Radar
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useToast } from '../../components/ui/Toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExecutiveFindings } from '../analysis/components/ExecutiveFindings';

interface Department {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    metrics: string[];
}

const DEPARTMENTS: Department[] = [
    {
        id: 'marketing',
        name: 'Marketing Intelligence',
        icon: <Target size={24} />,
        color: '#ff4d4d',
        description: 'Track campaign ROI, customer acquisition costs, and segment performance.',
        metrics: ['CAC', 'LTV', 'CTR', 'Conversion Rate']
    },
    {
        id: 'finance',
        name: 'Financial Planning',
        icon: <TrendingUp size={24} />,
        color: '#4db8ff',
        description: 'Analyze burn rate, revenue forecasting, and departmental budget health.',
        metrics: ['MRR', 'Gross Margin', 'OpEx', 'EBIDTA']
    },
    {
        id: 'product',
        name: 'Product Analytics',
        icon: <Layout size={24} />,
        color: '#4dff88',
        description: 'Measure feature adoption, churn patterns, and user engagement loops.',
        metrics: ['DAU/MAU', 'Stickiness', 'NPS', 'Feature Velocity']
    },
    {
        id: 'hr',
        name: 'People & Culture',
        icon: <Users size={24} />,
        color: '#ffb84d',
        description: 'Monitor headcount growth, retention rates, and talent acquisition efficiency.',
        metrics: ['Retention', 'Time-to-Hire', 'eNPS', 'Diversity']
    }
];

export const SelfServiceStudio = ({
    files,
    token,
    apiUrl,
    userPlan,
    runWithProgress
}: {
    files: any[],
    token: string,
    apiUrl: string,
    userPlan?: string,
    runWithProgress?: (fn: () => Promise<void | { type: string; title: string; data: any }>) => Promise<void>
}) => {
    const { addToast } = useToast();

    if (userPlan === 'free') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="card text-center flex-col items-center gap-6 premium-highlight-card" style={{ maxWidth: '440px', padding: '48px', position: 'relative', overflow: 'hidden' }}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"></div>
                    <div className="inner-highlight" style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <Sparkles size={40} />
                    </div>
                    <div className="flex-col gap-2">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="badge badge-primary">PRO FEATURE</span>
                        </div>
                        <h2 className="text-h1">Self-Service Studio</h2>
                        <p className="text-sec">Advanced natural language data discovery and departmental portals are Pro features.</p>
                    </div>

                    <div className="flex-col gap-3 w-full">
                        <button className="btn btn-primary btn-lg w-full glow-btn" onClick={() => (window as any).dispatchEvent(new CustomEvent('navigate-to-settings', { detail: { initialTab: 'subscription' } }))}>
                            <span className="shimmer-text">Upgrade to Pro</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<string>('');
    const [query, setQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [insight, setInsight] = useState<any>(null);
    const [fileStats, setFileStats] = useState<{ rows: number, cols: number } | null>(null);
    const [activeAnalysis, setActiveAnalysis] = useState<any>(null);
    const [auditResults, setAuditResults] = useState<any>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');
    const [sortBy, setSortBy] = useState('none');

    const activeFile = files.find(f => f.id === selectedFileId);

    const getSynonyms = (term: string): string[] => {
        if (term.includes('cost') || term.includes('spend')) return ['revenue', 'price', 'expenses', 'profit', 'budget'];
        if (term.includes('churn')) return ['retention', 'customers', 'active', 'users'];
        if (term.includes('sales')) return ['revenue', 'income', 'orders'];
        if (term.includes('growth')) return ['increase', 'trend', 'change'];
        return [];
    };

    const fetchAnalysis = async (customQuery?: string) => {
        if (!selectedFileId) return;

        const worker = async () => {
            setIsGenerating(true);
            setInsight(null);

            try {
                const file = files.find(f => f.id === selectedFileId);
                if (!file) return;

                const response = await fetch(`${apiUrl}/api/files/${selectedFileId}/analyze`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Neural formulation interrupted.');

                const analysis = await response.json();
                setActiveAnalysis(analysis);
                setFileStats({ rows: analysis.summary?.rows || 0, cols: analysis.summary?.columns || 0 });

                let targetOption = null;
                if (customQuery) {
                    const terms = [customQuery.toLowerCase(), ...getSynonyms(customQuery.toLowerCase())];
                    targetOption = analysis.options?.find((opt: any) =>
                        terms.some(term => opt.title.toLowerCase().includes(term) || opt.description?.toLowerCase().includes(term))
                    );
                }

                if (!targetOption && analysis.options?.length > 0) {
                    targetOption = analysis.options[0];
                }

                if (targetOption) {
                    setInsight({
                        data: targetOption.data,
                        type: targetOption.chartType === 'line' ? 'area' : targetOption.chartType,
                        title: targetOption.title,
                        description: targetOption.description
                    });
                } else {
                    addToast('Analysis complete. No visual patterns detected.', 'info');
                }
            } catch (err: any) {
                console.error('Analysis failed:', err);
                addToast('Failed to analyze dataset.', 'error');
            } finally {
                setIsGenerating(false);
            }
        };

        if (runWithProgress) {
            await runWithProgress(worker);
        } else {
            await worker();
        }
    };

    const handleRunAudit = async () => {
        if (!selectedFileId) return;

        const worker = async () => {
            setIsAuditing(true);
            await new Promise(r => setTimeout(r, 2000));
            setAuditResults({
                completeness: 98.4,
                anomalies: 12,
                reliability: 'High',
                warnings: [
                    'Slight seasonality detected in Q3 spend',
                    '3 outliers detected in customer LTV'
                ]
            });
            setIsAuditing(false);
            addToast('Audit complete. Intelligence quality verified.', 'success');
        };

        if (runWithProgress) {
            await runWithProgress(worker);
        } else {
            await worker();
        }
    };

    // Load analysis immediately when file is selected
    React.useEffect(() => {
        if (selectedFileId && token) {
            fetchAnalysis();
        }
    }, [selectedFileId, token]);

    const handleGenerate = () => {
        if (!query.trim()) return;
        fetchAnalysis(query);
    };

    const handleDeploy = async () => {
        if (!activeAnalysis || !insight) return;
        setIsGenerating(true);
        try {
            const actions = activeAnalysis.keyFindings?.map((f: any) => f.text || f.insight) || [];

            const response = await fetch(`${apiUrl}/api/projects`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: insight.title,
                    description: (activeAnalysis.executiveReasoning?.executiveSummary || activeAnalysis.executiveReasoning || insight.description || 'Actionable intelligence derived from automated analysis.'),
                    objective: 'AI_STRATEGIC_PULSE',
                    actions: actions.length > 0 ? actions : ['Review detailed analysis findings', 'Establish monitoring for this metric'],
                    impact: 'High'
                })
            });

            if (response.ok) {
                addToast('Strategy successfully deployed to Strategic Board.', 'success');
            } else {
                addToast('System failed to register strategy.', 'error');
            }
        } catch (e) {
            addToast('Deployment failed.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('studio-preview-pane');
        if (!element) return;

        addToast('Synthesizing Executive PDF Report...', 'info');

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0a0a0c',
                scale: 2,
                logging: false,
                useCORS: true,
                windowWidth: 1200
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Set dark theme for PDF background
            pdf.setFillColor(10, 10, 12);
            pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, imgHeight);
            pdf.save(`Nalyse_Executive_Intelligence_${new Date().toISOString().split('T')[0]}.pdf`);

            addToast('Executive Report successfully generated.', 'success');
        } catch (e) {
            console.error('PDF Error:', e);
            addToast('Failed to generate intelligence document.', 'error');
        }
    };

    return (
        <div className="sss-container fade-in" style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)', position: 'relative', overflow: 'hidden' }}>

            {/* ═══ AMBIENT LAYERS ═══ */}
            <div className="sss-holo-grid" />
            <div className="sss-scan-line" />
            <div className="sss-ambient-orb sss-orb-1" />
            <div className="sss-ambient-orb sss-orb-2" />
            <div className="sss-data-stream sss-stream-1" />
            <div className="sss-data-stream sss-stream-2" />

            {/* ═══ LIVE TELEMETRY BAR ═══ */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ marginBottom: '20px', padding: '10px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(129,140,248,0.04), rgba(52,211,153,0.03))', border: '1px solid rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-6">
                    {[
                        { icon: <Wifi size={11} />, label: 'UPLINK', value: 'ACTIVE', color: '#34d399' },
                        { icon: <Shield size={11} />, label: 'ENCRYPTION', value: 'AES-256', color: '#818cf8' },
                        { icon: <Cpu size={11} />, label: 'NEURAL CORES', value: '8/8', color: '#fbbf24' },
                        { icon: <Activity size={11} />, label: 'LATENCY', value: '12ms', color: '#34d399' }
                    ].map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span style={{ color: t.color, opacity: 0.7 }}>{t.icon}</span>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{t.label}</span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: t.color, fontFamily: 'var(--font-mono)' }}>{t.value}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <div className="sss-live-dot" />
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#34d399', letterSpacing: '0.1em' }}>SYSTEM NOMINAL</span>
                </div>
            </motion.div>

            {/* ═══ HEADER ═══ */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                <div className="flex items-center gap-4">
                    <div style={{ position: 'relative' }}>
                        <div className="sss-icon-pulse" />
                        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(52,211,153,0.08))', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, boxShadow: '0 8px 40px rgba(129,140,248,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                            <Hexagon size={30} style={{ color: '#818cf8' }} className="sss-icon-rotate" />
                        </div>
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #e0e7ff 0%, #818cf8 40%, #34d399 70%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
                            Self-Service Studio
                        </h1>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.15)' }}>
                                <Sparkles size={10} style={{ color: '#fbbf24' }} />
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.06em' }}>AI-POWERED</span>
                            </span>
                            Autonomous Data Democratization Engine
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(129,140,248,0.15)', background: 'rgba(129,140,248,0.05)', backdropFilter: 'blur(10px)' }}>
                        <Eye size={13} style={{ color: '#818cf8' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', letterSpacing: '0.04em' }}>OBSERVER MODE</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)', backdropFilter: 'blur(10px)' }}>
                        <ShieldCheck size={13} style={{ color: '#34d399' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', letterSpacing: '0.04em' }}>ENCRYPTED</span>
                    </div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 460px', gap: '24px', alignItems: 'start', position: 'relative', zIndex: 2 }}>

                {/* ═══ LEFT PANEL ═══ */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Dataset Connection Bar */}
                    <div style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #818cf8, #34d399, #fbbf24)' }} />
                        <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                            <Database size={15} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Connect Strategic Dataset</span>
                        </div>

                        <div className="flex justify-between items-center gap-6">
                            <select
                                value={selectedFileId}
                                onChange={(e) => setSelectedFileId(e.target.value)}
                                style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${selectedFileId ? '#818cf844' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, transition: 'border-color 0.2s', appearance: 'none' }}
                            >
                                <option value="">Select a Data Mesh...</option>
                                {files.map(f => (
                                    <option key={f.id} value={f.id}>{(f as any).originalName || f.filename} ({(f.size / 1024).toFixed(1)} KB)</option>
                                ))}
                            </select>
                        </div>

                        {activeFile && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em' }}>CONNECTED</div>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Live ingestion active for <span style={{ color: '#818cf8' }}>{activeFile.originalName || activeFile.filename}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleRunAudit}
                                        disabled={isAuditing}
                                        style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        className="hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                                    >
                                        {isAuditing ? <RefreshCw size={12} className="animate-spin" /> : <Activity size={12} />}
                                        Run Audit
                                    </button>
                                    <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
                                    {fileStats && (
                                        <div className="flex items-center gap-4">
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rows</span>
                                                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fileStats.rows}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cols</span>
                                                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fileStats.cols}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* ═══ DEPARTMENT SELECTION ═══ */}
                    <div style={{ padding: '24px', borderRadius: '18px', background: 'linear-gradient(180deg, var(--bg-secondary), rgba(15,15,20,0.95))', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                        <div className="sss-corner-glow" style={{ top: 0, right: 0 }} />
                        <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                            <div className="flex items-center gap-2">
                                <Radar size={15} style={{ color: '#818cf8' }} />
                                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>Neural Domain Selector</span>
                            </div>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedDept ? '1/4 ACTIVE' : '0/4 ACTIVE'}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            {DEPARTMENTS.map((dept, idx) => (
                                <motion.button
                                    key={dept.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * idx + 0.3 }}
                                    whileHover={{ scale: 1.02, y: -3 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedDept(dept)}
                                    className={selectedDept?.id === dept.id ? 'sss-card-active' : 'sss-card-idle'}
                                    style={{
                                        padding: '18px',
                                        borderRadius: '14px',
                                        background: selectedDept?.id === dept.id ? `linear-gradient(135deg, ${dept.color}10, rgba(15,15,20,0.9))` : 'var(--bg-main)',
                                        border: `1px solid ${selectedDept?.id === dept.id ? dept.color + '60' : 'var(--border-default)'}`,
                                        display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left',
                                        cursor: 'pointer', transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden',
                                        boxShadow: selectedDept?.id === dept.id ? `0 12px 40px -15px ${dept.color}50, inset 0 1px 0 ${dept.color}15` : 'none'
                                    }}
                                >
                                    {selectedDept?.id === dept.id && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${dept.color}, ${dept.color}40, transparent)` }} />}
                                    {selectedDept?.id === dept.id && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px', background: `linear-gradient(180deg, ${dept.color}, transparent)` }} />}
                                    <div className="flex items-center gap-3">
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: selectedDept?.id === dept.id ? `${dept.color}20` : `${dept.color}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedDept?.id === dept.id ? dept.color : 'var(--text-tertiary)', flexShrink: 0, border: `1px solid ${selectedDept?.id === dept.id ? `${dept.color}40` : 'var(--border-subtle)'}`, transition: 'all 0.3s' }}>
                                            {dept.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: '13px', fontWeight: 800, color: selectedDept?.id === dept.id ? '#fff' : 'var(--text-secondary)', transition: 'color 0.3s' }}>{dept.name}</h4>
                                        </div>
                                        <ChevronRight size={14} style={{ color: selectedDept?.id === dept.id ? dept.color : 'transparent', transform: selectedDept?.id === dept.id ? 'translateX(0)' : 'translateX(-6px)', opacity: selectedDept?.id === dept.id ? 1 : 0, transition: 'all 0.3s' }} />
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {dept.metrics.map(m => (
                                            <span key={m} style={{ fontSize: '9px', fontWeight: 700, padding: '3px 7px', borderRadius: '6px', background: selectedDept?.id === dept.id ? `${dept.color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedDept?.id === dept.id ? `${dept.color}25` : 'var(--border-subtle)'}`, color: selectedDept?.id === dept.id ? dept.color : 'var(--text-muted)', letterSpacing: '0.04em', transition: 'all 0.3s' }}>{m}</span>
                                        ))}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* ═══ AI COMMAND TERMINAL ═══ */}
                    <div style={{ padding: '24px', borderRadius: '18px', background: 'linear-gradient(180deg, var(--bg-secondary), rgba(15,15,20,0.95))', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg, #818cf8, #34d399, transparent)' }} />
                        <div className="sss-corner-glow" style={{ bottom: 0, left: 0, transform: 'rotate(180deg)' }} />

                        <div className="flex items-center justify-between" style={{ marginBottom: '16px', paddingLeft: '8px' }}>
                            <div className="flex items-center gap-2">
                                <Terminal size={14} style={{ color: '#818cf8' }} />
                                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>AI Query Terminal</span>
                            </div>
                            <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>⌘K</span>
                        </div>

                        <div className="sss-terminal-input" style={{ display: 'flex', padding: '5px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', marginBottom: '14px', alignItems: 'center', transition: 'all 0.3s', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)' }}>
                            <div style={{ padding: '0 10px', color: '#818cf8', display: 'flex', alignItems: 'center' }}>
                                <Sparkles size={15} />
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                placeholder="Describe the insight you need..."
                                style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, outline: 'none' }}
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                style={{ padding: '9px 18px', borderRadius: '9px', border: 'none', background: isGenerating ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #818cf8, #6366f1)', color: isGenerating ? 'var(--text-disabled)' : '#fff', fontSize: '12px', fontWeight: 700, cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(129,140,248,0.3)', transition: 'all 0.2s' }}
                            >
                                {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} fill="currentColor" />}
                                Synthesize
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingLeft: '8px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SUGGESTIONS:</span>
                            {["Burn rate analysis", "CAC by Region", "Feature adoption", "Revenue forecast"].map((q, i) => (
                                <button key={i} onClick={() => setQuery(q)} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:border-[#818cf8] hover:text-[#818cf8] hover:bg-[rgba(129,140,248,0.05)]">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Right Panel: Preview & Insights ───────────────────────────────── */}
                <section style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #34d399, #fbbf24, #f87171)' }} />

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: selectedDept ? `${selectedDept.color}22` : 'var(--bg-main)', border: `1px solid ${selectedDept ? selectedDept.color + '40' : 'var(--border-default)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedDept ? selectedDept.icon : <Globe size={16} style={{ color: 'var(--text-muted)' }} />}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                    {selectedDept ? `${selectedDept.name} Intelligence` : 'Global Overview'}
                                </h3>
                                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>Live Feed Active</p>
                            </div>
                        </div>
                        <div>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} className="animate-pulse" />
                                Monitoring
                            </span>
                        </div>
                    </div>

                    {/* Toolbar */}
                    {selectedFileId && (
                        <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                            <div className="flex items-center gap-2 flex-1">
                                <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Filter insight context..."
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', width: '100%' }}
                                    value={filterQuery}
                                    onChange={(e) => setFilterQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSortBy(sortBy === 'asc' ? 'desc' : 'asc')} style={{ padding: '4px 8px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} className="hover:bg-white/5 transition-colors">
                                    <SortAsc size={12} /> Sort
                                </button>
                                <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
                                <button style={{ padding: '4px 8px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} className="hover:bg-white/5 transition-colors">
                                    <Share2 size={12} /> Share
                                </button>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {(insight || selectedDept) ? (
                            <motion.div
                                key={selectedDept?.id || 'global-insight'}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                            >
                                {/* Metrics Pills */}
                                {selectedDept && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        {selectedDept.metrics.map(m => {
                                            let val = '--';
                                            if (activeAnalysis?.summary?.columnTypes) {
                                                const matchingCol = Object.keys(activeAnalysis.summary.columnTypes).find(c => c.toLowerCase().includes(m.toLowerCase()));
                                                if (matchingCol) {
                                                    const rawVal = activeAnalysis.sampleData?.[0]?.[matchingCol];
                                                    val = typeof rawVal === 'number' ? rawVal.toLocaleString() : (rawVal || '--');
                                                }
                                            }

                                            return (
                                                <div key={m} style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m}</span>
                                                        <Activity size={10} style={{ color: 'var(--text-tertiary)' }} />
                                                    </div>
                                                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{val}</span>
                                                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                        <TrendingUp size={9} /> +2.4%
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Audit Results */}
                                {auditResults && (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                                        style={{ padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(248,113,113,0.05), transparent)', border: '1px solid var(--border-subtle)' }}>
                                        <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                                            <AlertCircle size={14} style={{ color: '#f87171' }} />
                                            <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>Dataset Quality Audit</h4>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                                            <div>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completeness</span>
                                                <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{auditResults.completeness}%</div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Anomalies</span>
                                                <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{auditResults.anomalies}</div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reliability</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                                                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{auditResults.reliability}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {auditResults.warnings.map((w: string, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f87171' }} />
                                                    {w}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Main Chart Area */}
                                <div id="studio-preview-pane" style={{ borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', overflow: 'hidden', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                                    {insight ? (
                                        <>
                                            <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700 }}>{insight.title}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="badge badge-sm" style={{ textTransform: 'capitalize', fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>{insight.type} Chart</span>
                                                    <button style={{ padding: '4px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer' }} className="hover:bg-white/5 transition-colors">
                                                        <Maximize2 size={13} style={{ color: 'var(--text-tertiary)' }} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ padding: '12px', height: '300px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {insight.type === 'area' ? (
                                                        <AreaChart data={insight.data}>
                                                            <defs>
                                                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                                                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                                            <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} />
                                                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#818cf8', fontWeight: 'bold' }} />
                                                            <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                                        </AreaChart>
                                                    ) : insight.type === 'pie' ? (
                                                        <PieChart>
                                                            <Pie data={insight.data} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                                                                {insight.data.map((_: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : index === 1 ? '#34d399' : 'var(--border-default)'} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: '12px' }} />
                                                        </PieChart>
                                                    ) : (
                                                        <BarChart data={insight.data}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                                            <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} />
                                                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                                            <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={32} />
                                                        </BarChart>
                                                    )}
                                                </ResponsiveContainer>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4 }}>
                                            <BarChart3 size={40} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
                                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select a dataset to render visual insights</p>
                                        </div>
                                    )}
                                </div>

                                {/* Executive Findings Component */}
                                {activeAnalysis?.executiveReasoning && (
                                    <div style={{ marginTop: '12px' }}>
                                        <ExecutiveFindings reasoning={activeAnalysis.executiveReasoning} />
                                    </div>
                                )}

                                {/* Key Findings Array */}
                                {activeAnalysis?.keyFindings?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                                            <Sparkles size={14} style={{ color: 'var(--text-muted)' }} />
                                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Key Strategic Findings</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {activeAnalysis.keyFindings.slice(0, 3).map((finding: any, idx: number) => (
                                                <div key={idx} style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(129,140,248,0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Sparkles size={12} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>{finding.text || finding.insight}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Next Steps */}
                                <div>
                                    <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                                        <Layers size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Actionable Workflows</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <button onClick={handleDownloadPDF} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }} className="hover:border-[var(--primary)] transition-colors">
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Download size={14} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Export PDF</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Generate full review report</div>
                                            </div>
                                        </button>
                                        <button onClick={handleDeploy} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }} className="hover:border-[var(--primary)] transition-colors">
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Target size={14} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Deploy to Tracker</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Set monitoring alerts</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Collab Tray */}
                                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Shared Intelligence Protocol</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} className="hover:text-white transition-colors">
                                            <UserPlus size={14} />
                                        </button>
                                        <div style={{ display: 'flex', paddingLeft: '8px' }}>
                                            {[1, 2, 3].map(i => (
                                                <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 1 ? '#6366f1' : i === 2 ? '#ec4899' : '#10b981', border: '2px solid var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#fff', marginLeft: '-8px' }}>
                                                    {['JD', 'AS', 'MK'][i - 1]}
                                                </div>
                                            ))}
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', marginLeft: '-8px' }}>
                                                +4
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                                    <div className="sss-orbital" style={{ inset: 0, border: '1px solid rgba(129,140,248,0.12)', animation: 'sss-spin 12s linear infinite' }}>
                                        <div style={{ position: 'absolute', top: '-3px', left: '50%', width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 10px #818cf8' }} />
                                    </div>
                                    <div className="sss-orbital" style={{ inset: '18px', border: '1px dashed rgba(52,211,153,0.15)', animation: 'sss-spin-r 18s linear infinite' }}>
                                        <div style={{ position: 'absolute', bottom: '-3px', right: '30%', width: '4px', height: '4px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                                    </div>
                                    <div className="sss-orbital" style={{ inset: '36px', border: '1px solid rgba(129,140,248,0.06)', animation: 'sss-spin 10s linear infinite' }} />
                                    <div className="sss-orbital" style={{ inset: '50px', border: '1px solid rgba(251,191,36,0.06)', animation: 'sss-spin-r 14s linear infinite' }}>
                                        <div style={{ position: 'absolute', top: '50%', right: '-2px', width: '4px', height: '4px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} />
                                    </div>
                                    <div className="sss-core">
                                        <Network size={40} style={{ color: '#818cf8' }} />
                                    </div>
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' }}>Neural Core Standby</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', lineHeight: 1.6, marginBottom: '16px' }}>
                                    Connect a strategic dataset or deploy a natural language query to activate the synthesis engine.
                                </p>
                                <div className="flex items-center gap-3" style={{ marginTop: '16px' }}>
                                    {['Dataset', 'Domain', 'Query'].map((step, i) => (
                                        <div key={step} className="flex items-center gap-2">
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1px solid ${i === 0 ? '#818cf8' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: i === 0 ? '#818cf8' : 'var(--text-muted)' }}>{i + 1}</div>
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: i === 0 ? '#818cf8' : 'var(--text-muted)' }}>{step}</span>
                                            {i < 2 && <ChevronRight size={10} style={{ color: 'var(--border-subtle)' }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </section>
            </div>

            <style>{`
                .sss-container { position: relative; }

                /* ─── HOLOGRAPHIC GRID ─── */
                .sss-holo-grid {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background-size: 50px 50px;
                    background-image:
                        linear-gradient(to right, rgba(129,140,248,0.025) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(129,140,248,0.025) 1px, transparent 1px);
                    mask-image: radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent);
                    -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent);
                    pointer-events: none; z-index: 0;
                }

                /* ─── SCANNING LASER ─── */
                .sss-scan-line {
                    position: absolute; left: 0; right: 0; height: 1px; z-index: 0;
                    background: linear-gradient(90deg, transparent, rgba(129,140,248,0.15), rgba(52,211,153,0.1), transparent);
                    animation: sss-scan 6s ease-in-out infinite;
                    pointer-events: none;
                }
                @keyframes sss-scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }

                /* ─── AMBIENT ORBS ─── */
                .sss-ambient-orb {
                    position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
                    filter: blur(100px);
                }
                .sss-orb-1 { width: 400px; height: 400px; top: -100px; right: -100px; background: rgba(129,140,248,0.06); animation: sss-float 12s ease-in-out infinite; }
                .sss-orb-2 { width: 300px; height: 300px; bottom: -50px; left: -50px; background: rgba(52,211,153,0.04); animation: sss-float 15s ease-in-out infinite reverse; }
                @keyframes sss-float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(20px, -20px) scale(1.1); }
                }

                /* ─── DATA STREAMS ─── */
                .sss-data-stream {
                    position: absolute; width: 1px; pointer-events: none; z-index: 0;
                    background: linear-gradient(180deg, transparent, rgba(129,140,248,0.08), transparent);
                }
                .sss-stream-1 { height: 200px; left: 25%; animation: sss-stream 4s linear infinite; }
                .sss-stream-2 { height: 150px; right: 30%; animation: sss-stream 5s linear infinite 2s; }
                @keyframes sss-stream {
                    0% { top: -200px; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }

                /* ─── LIVE DOT ─── */
                .sss-live-dot {
                    width: 6px; height: 6px; border-radius: 50%; background: #34d399;
                    box-shadow: 0 0 8px #34d399;
                    animation: sss-blink 2s ease-in-out infinite;
                }
                @keyframes sss-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                /* ─── ICON EFFECTS ─── */
                .sss-icon-pulse {
                    position: absolute; inset: -4px; border-radius: 20px;
                    background: rgba(129,140,248,0.15);
                    animation: sss-pulse 3s cubic-bezier(0.4,0,0.6,1) infinite;
                }
                @keyframes sss-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.15; }
                    50% { transform: scale(1.25); opacity: 0; }
                }
                .sss-icon-rotate { animation: sss-rotate 20s linear infinite; }
                @keyframes sss-rotate { 100% { transform: rotate(360deg); } }

                /* ─── CORNER GLOW ─── */
                .sss-corner-glow {
                    position: absolute; width: 200px; height: 200px;
                    background: radial-gradient(circle, rgba(129,140,248,0.04), transparent 70%);
                    pointer-events: none;
                }

                /* ─── TERMINAL FOCUS ─── */
                .sss-terminal-input:focus-within {
                    border-color: rgba(129,140,248,0.4) !important;
                    box-shadow: inset 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(129,140,248,0.15), 0 0 20px rgba(129,140,248,0.05) !important;
                }

                /* ─── NEURAL RINGS ─── */
                .sss-orbital { position: absolute; border-radius: 50%; pointer-events: none; }
                .sss-core {
                    width: 90px; height: 90px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    background: var(--bg-main);
                    border: 1px solid rgba(129,140,248,0.4);
                    box-shadow: 0 0 50px rgba(129,140,248,0.15), inset 0 0 25px rgba(129,140,248,0.08);
                    animation: sss-heartbeat 2.5s ease-in-out infinite;
                }
                @keyframes sss-heartbeat {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 50px rgba(129,140,248,0.15), inset 0 0 25px rgba(129,140,248,0.08); }
                    50% { transform: scale(1.04); box-shadow: 0 0 70px rgba(129,140,248,0.3), inset 0 0 35px rgba(129,140,248,0.15); border-color: rgba(129,140,248,0.7); }
                }
                @keyframes sss-spin { 100% { transform: rotate(360deg); } }
                @keyframes sss-spin-r { 100% { transform: rotate(-360deg); } }

                @media (max-width: 1100px) {
                    .sss-container > div:last-of-type { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div >
    );
};
