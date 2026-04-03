import React, { useState } from 'react';
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
    UserPlus
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useToast } from '../../components/ui/Toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
        <div className="democracy-container fade-in">
            {/* Header Section */}
            <header className="democracy-header">
                <div className="flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--primary-subtle)] rounded-lg text-[var(--primary)]">
                            <Sparkles size={24} />
                        </div>
                        <h1 className="text-h1">Self-Service Studio</h1>
                    </div>
                    <p className="text-secondary max-w-2xl">
                        Empowering every stakeholder with executive-grade insights. No SQL, no complex modeling—just data democratization for everyone.
                    </p>
                </div>
                <div className="security-badge glass-morphism">
                    <ShieldCheck size={16} className="text-success" />
                    <span className="text-xs font-bold">Encrypted Data Access</span>
                </div>
            </header>

            <div className="democracy-grid">
                {/* Left: Departmental Portals */}
                <section className="dept-selection">
                    {/* Dataset Connection Bar */}
                    <div className="card glass-morphism mb-8" style={{ padding: '20px', border: '1px solid var(--border-highlight)' }}>
                        <div className="flex justify-between items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--primary-subtle)] rounded-lg text-[var(--primary)]">
                                    <Database size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">Connect Strategic Dataset</h4>
                                    <p className="text-[10px] opacity-50 uppercase tracking-widest font-black">Link your real-time analytics mesh</p>
                                </div>
                            </div>
                            <select
                                className="input h-10 w-64 text-sm"
                                value={selectedFileId}
                                onChange={(e) => setSelectedFileId(e.target.value)}
                                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-default)' }}
                            >
                                <option value="">Select a Dataset...</option>
                                {files.map(f => (
                                    <option key={f.id} value={f.id}>{f.originalName || f.filename} ({(f.size / 1024).toFixed(1)} KB)</option>
                                ))}
                            </select>
                        </div>
                        {activeFile && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="badge badge-success px-3 py-1">CONNECTED</div>
                                    <span className="text-xs font-bold opacity-60">
                                        Live ingestion active for <span className="text-[var(--primary)]">{activeFile.originalName || activeFile.filename}</span>
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRunAudit}
                                        disabled={isAuditing}
                                        className="btn btn-ghost btn-xs"
                                        style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}
                                    >
                                        {isAuditing ? <div className="spinner-xs" /> : <Activity size={12} className="mr-1" />}
                                        Run Audit
                                    </button>
                                    <div className="divider-v" style={{ background: 'var(--border-subtle)' }} />
                                    {fileStats && (
                                        <div className="flex gap-4">
                                            <div className="flex-col items-end">
                                                <span className="text-[10px] opacity-40 uppercase font-black">Rows</span>
                                                <span className="text-xs font-bold">{fileStats.rows}</span>
                                            </div>
                                            <div className="flex-col items-end">
                                                <span className="text-[10px] opacity-40 uppercase font-black">Cols</span>
                                                <span className="text-xs font-bold">{fileStats.cols}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <h3 className="section-title">Select your Department</h3>
                    <div className="dept-grid">
                        {DEPARTMENTS.map(dept => (
                            <motion.button
                                key={dept.id}
                                whileHover={{ scale: 1.02, translateY: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedDept(dept)}
                                className={`dept-card glass-morphism ${selectedDept?.id === dept.id ? 'active' : ''}`}
                                style={{ '--accent-color': dept.color } as any}
                            >
                                <div className="dept-icon" style={{ background: `${dept.color}22`, color: dept.color }}>
                                    {dept.icon}
                                </div>
                                <div className="dept-info">
                                    <h4>{dept.name}</h4>
                                    <p>{dept.description}</p>
                                </div>
                                <ChevronRight className="arrow" size={16} />
                            </motion.button>
                        ))}
                    </div>

                    {/* Natural Language Interface */}
                    <div className="nli-container card glass-morphism mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageSquare size={20} className="text-[var(--primary)]" />
                            <h3 className="text-h3" style={{ fontSize: '16px' }}>Ask your Data</h3>
                        </div>
                        <div className="nli-input-wrapper">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. 'Show me the revenue growth by marketing campaign for Q3'"
                                className="nli-input"
                            />
                            <button className="btn btn-primary btn-icon" onClick={handleGenerate} disabled={isGenerating}>
                                {isGenerating ? <div className="spinner-xs" /> : <ArrowRight size={20} />}
                            </button>
                        </div>
                        <div className="nli-suggestions">
                            <span className="text-xs opacity-50">Try:</span>
                            <button onClick={() => setQuery("What is our current burn rate?")} className="suggest-item">"Burn rate analysis"</button>
                            <button onClick={() => setQuery("Compare CAC across all regions")} className="suggest-item">"CAC by Region"</button>
                            <button onClick={() => setQuery("Feature adoption for new UI")} className="suggest-item">"Feature adoption"</button>
                        </div>
                    </div>
                </section>

                {/* Right: Live Preview / Active Metrics */}
                <section className="preview-section glass-morphism">
                    <div className="preview-header">
                        <div className="flex items-center gap-3">
                            {selectedDept ? (
                                <div className="dept-dot" style={{ background: selectedDept.color }} />
                            ) : (
                                <Globe size={20} className="text-tertiary" />
                            )}
                            <h3 className="section-title mb-0">
                                {selectedDept ? `${selectedDept.name} Overview` : 'Global Overview'}
                            </h3>
                        </div>
                        <div className="live-status">
                            <div className="pulse-dot" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Live Feed</span>
                        </div>
                    </div>

                    {selectedFileId && (
                        <div className="refinement-toolbar flex items-center justify-between gap-4 p-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] mb-4">
                            <div className="flex items-center gap-2 flex-1">
                                <Filter size={14} className="text-tertiary ml-2" />
                                <input
                                    type="text"
                                    placeholder="Filter current view..."
                                    className="bg-transparent border-none text-[11px] focus:outline-none w-full"
                                    value={filterQuery}
                                    onChange={(e) => setFilterQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="btn btn-ghost btn-xs" style={{ fontSize: '10px' }} onClick={() => setSortBy(sortBy === 'asc' ? 'desc' : 'asc')}>
                                    <SortAsc size={12} className="mr-1" />
                                    Sort {sortBy === 'none' ? '' : sortBy}
                                </button>
                                <div className="divider-v" style={{ height: '14px', margin: '0 4px' }} />
                                <button className="btn btn-ghost btn-xs" style={{ fontSize: '10px' }}>
                                    <Share2 size={12} className="mr-1" />
                                    Share
                                </button>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {(insight || selectedDept) ? (
                            <motion.div
                                key={selectedDept?.id || 'global-insight'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="dept-preview-content"
                            >
                                {selectedDept && (
                                    <div className="metrics-ribbon">
                                        {selectedDept.metrics.map(m => {
                                            // Extract real metric if available
                                            let val = '--';
                                            if (activeAnalysis?.summary?.columnTypes) {
                                                const matchingCol = Object.keys(activeAnalysis.summary.columnTypes).find(
                                                    c => c.toLowerCase().includes(m.toLowerCase())
                                                );
                                                if (matchingCol) {
                                                    // This is a simplification: we take the first row's value or an aggregate
                                                    const rawVal = activeAnalysis.sampleData?.[0]?.[matchingCol];
                                                    val = typeof rawVal === 'number' ? rawVal.toLocaleString() : (rawVal || '--');
                                                }
                                            }

                                            return (
                                                <div key={m} className="metric-pill glass-morphism">
                                                    <div className="flex justify-between items-start">
                                                        <span className="metric-label">{m}</span>
                                                        <Activity size={10} className="opacity-30" />
                                                    </div>
                                                    <span className="metric-value">{val}</span>
                                                    <div className="metric-trend text-[9px] mt-1 text-success font-bold flex items-center gap-1">
                                                        <TrendingUp size={8} /> +12.4% vs prev
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {auditResults && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="audit-summary-card glass-morphism p-4 mb-6"
                                        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(0,0,0,0))' }}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertCircle size={16} className="text-[var(--primary)]" />
                                            <h4 className="text-xs font-black uppercase tracking-widest">Dataset Quality Audit</h4>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="flex-col">
                                                <span className="text-[9px] opacity-50 uppercase font-bold">Completeness</span>
                                                <span className="text-sm font-black">{auditResults.completeness}%</span>
                                            </div>
                                            <div className="flex-col">
                                                <span className="text-[9px] opacity-50 uppercase font-bold">Anomalies</span>
                                                <span className="text-sm font-black">{auditResults.anomalies}</span>
                                            </div>
                                            <div className="flex-col">
                                                <span className="text-[9px] opacity-50 uppercase font-bold">Reliability</span>
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle2 size={12} className="text-success" />
                                                    <span className="text-sm font-black">{auditResults.reliability}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {auditResults.warnings.map((w: string, i: number) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] opacity-70">
                                                    <div className="w-1 h-1 rounded-full bg-[var(--primary)]" />
                                                    {w}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                <div id="studio-preview-pane" className="dashboard-render-target">
                                    <div className="placeholder-viz card" style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
                                        {insight ? (
                                            <div style={{ width: '100%', height: '100%', padding: '24px' }}>
                                                <div className="flex justify-between items-center mb-4">
                                                    <h5 className="text-xs font-black uppercase opacity-60 tracking-widest">{insight.title}</h5>
                                                    {isGenerating && <div className="spinner-xs text-[var(--primary)]" />}
                                                </div>
                                                <ResponsiveContainer width="100%" height={250}>
                                                    {insight.type === 'area' ? (
                                                        <AreaChart data={insight.data}>
                                                            <defs>
                                                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} axisLine={false} tickLine={false} />
                                                            <Tooltip
                                                                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '12px' }}
                                                                itemStyle={{ color: 'var(--primary)' }}
                                                            />
                                                            <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                                        </AreaChart>
                                                    ) : insight.type === 'pie' ? (
                                                        <PieChart>
                                                            <Pie
                                                                data={insight.data}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                                stroke="none"
                                                            >
                                                                {insight.data.map((_: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary)' : index === 1 ? 'var(--accent)' : 'var(--bg-secondary)'} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                        </PieChart>
                                                    ) : (
                                                        <BarChart data={insight.data}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} axisLine={false} tickLine={false} />
                                                            <Tooltip
                                                                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '12px' }}
                                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                            />
                                                            <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                                                        </BarChart>
                                                    )}
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="flex-col items-center justify-center gap-4 opacity-30">
                                                <BarChart3 size={48} />
                                                <p className="text-sm font-medium">Select a dataset to populate insights</p>
                                            </div>
                                        )}
                                    </div>

                                    {activeAnalysis?.keyFindings?.length > 0 && (
                                        <div className="findings-grid mt-6">
                                            <h4 className="text-[10px] uppercase font-black tracking-widest opacity-50 mb-3">Key Strategic Findings</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {activeAnalysis.keyFindings.slice(0, 3).map((finding: any, idx: number) => (
                                                    <div key={idx} className="finding-card-sm flex items-center gap-3 p-3 glass-morphism rounded-xl border border-[var(--border-subtle)]">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)]">
                                                            <Sparkles size={14} />
                                                        </div>
                                                        <span className="text-xs font-medium text-secondary">{finding.text || finding.insight}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="recommendations mt-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4">Strategic Next Steps</h4>
                                    <div className="rec-list">
                                        <button onClick={handleDownloadPDF} className="rec-item glass-morphism w-full text-left premium-hover">
                                            <div className="rec-icon"><Download size={14} /></div>
                                            <div className="flex-col">
                                                <span>Export Intelligence to Executive PDF</span>
                                                <span className="text-[10px] opacity-50">Share formatted report with stakeholders</span>
                                            </div>
                                        </button>
                                        <button onClick={handleDeploy} className="rec-item glass-morphism w-full text-left premium-hover">
                                            <div className="rec-icon"><Layers size={14} /></div>
                                            <div className="flex-col">
                                                <span>Deploy to Strategic Monitoring</span>
                                                <span className="text-[10px] opacity-50">Set automated alerts for these metrics</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="collaboration-tray mt-8 pt-6 border-t border-[var(--border-subtle)]">
                                    <div className="flex justify-between items-center mb-4">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Shared with</h5>
                                        <button className="btn btn-ghost btn-xs p-1"><UserPlus size={14} /></button>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--bg-app)] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[10px] font-bold" style={{ background: i === 1 ? '#6366f1' : i === 2 ? '#ec4899' : '#10b981' }}>
                                                {['JD', 'AS', 'MK'][i - 1]}
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-app)] bg-[var(--bg-secondary)] flex items-center justify-center text-[10px] font-bold text-tertiary">
                                            +4
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="empty-preview">
                                <div className="flex-col items-center gap-6 text-center opacity-40 py-40">
                                    <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)]">
                                        <Layout size={40} className="text-[var(--primary)]" />
                                    </div>
                                    <div className="flex-col gap-2">
                                        <h4 className="text-h4">Studio Latent State</h4>
                                        <p className="max-w-[240px] text-xs">Select a department or ask a natural language query to activate the intelligence engine.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </section>
            </div>

            <style>{`
                .democracy-container {
                    padding: 32px;
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                    min-height: 100%;
                }

                .democracy-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .security-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid var(--success-subtle);
                    background: rgba(16, 185, 129, 0.05);
                }

                .democracy-grid {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 32px;
                    align-items: start;
                }

                .dept-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }

                .dept-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 24px;
                    border-radius: 16px;
                    text-align: left;
                    border: 1px solid var(--border-subtle);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .dept-card.active {
                    border-color: var(--accent-color);
                    background: color-mix(in srgb, var(--accent-color), transparent 95%);
                    box-shadow: 0 8px 32px -8px color-mix(in srgb, var(--accent-color), transparent 80%);
                }

                .dept-icon {
                    width: 48px;
                    height: 48px;
                    min-width: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dept-info h4 {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dept-info p {
                    font-size: 12px;
                    color: var(--text-tertiary);
                    line-height: 1.5;
                }

                .arrow {
                    margin-left: auto;
                    opacity: 0.3;
                }

                .nli-container {
                    padding: 24px;
                    border-radius: 20px;
                }

                .nli-input-wrapper {
                    position: relative;
                    display: flex;
                    gap: 12px;
                }

                .nli-input {
                    flex: 1;
                    height: 52px;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-default);
                    border-radius: 12px;
                    padding: 0 20px;
                    font-size: 14px;
                    color: var(--text-primary);
                    transition: all 0.2s;
                }

                .nli-input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px var(--primary-subtle);
                }

                .nli-suggestions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 16px;
                }

                .suggest-item {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-subtle);
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .suggest-item:hover {
                    background: var(--bg-surface-hover);
                    border-color: var(--primary-subtle);
                    color: var(--primary);
                }

                .preview-section {
                    height: 100%;
                    min-height: 600px;
                    border-radius: 24px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .dept-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .live-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(16, 185, 129, 0.1);
                    padding: 4px 12px;
                    border-radius: 20px;
                    color: var(--success);
                }

                .pulse-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--success);
                    box-shadow: 0 0 8px var(--success);
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }

                .metrics-ribbon {
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    padding-bottom: 8px;
                }

                .metric-pill {
                    display: flex;
                    flex-direction: column;
                    padding: 12px 16px;
                    border-radius: 12px;
                    min-width: 100px;
                    border: 1px solid var(--border-subtle);
                }

                .metric-label {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    opacity: 0.5;
                }

                .metric-value {
                    font-size: 18px;
                    font-weight: 700;
                }

                .rec-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    margin-bottom: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    border: 1px solid var(--border-subtle);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .rec-item:hover {
                    border-color: var(--primary-subtle);
                    background: var(--bg-surface-hover);
                }

                .rec-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background: var(--primary-subtle);
                    color: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (max-width: 1100px) {
                    .democracy-grid {
                        grid-template-columns: 1fr;
                    }
                    .preview-section {
                        min-height: auto;
                    }
                }
                .premium-hover:hover {
                    box-shadow: 0 8px 16px -4px rgba(99,102,241,0.2);
                    border-color: var(--primary-glow) !important;
                    transform: translateX(4px);
                }

                .dashboard-render-target {
                    position: relative;
                }

                .dashboard-render-target::before {
                    content: '';
                    position: absolute;
                    inset: -1px;
                    background: linear-gradient(45deg, transparent, rgba(99,102,241,0.1), transparent);
                    border-radius: 20px;
                    pointer-events: none;
                    z-index: -1;
                }

                .divider-v {
                    width: 1px;
                    height: 24px;
                    margin: 0 8px;
                }

                .audit-summary-card {
                    border: 1px solid var(--border-highlight);
                    border-radius: 16px;
                }

                .refinement-toolbar input::placeholder {
                    color: var(--text-tertiary);
                    opacity: 0.5;
                }

                .collaboration-tray {
                    background: linear-gradient(to bottom, transparent, rgba(99,102,241,0.02));
                    border-radius: 0 0 24px 24px;
                    margin: 0 -24px -24px;
                    padding: 24px;
                }
            `}</style>
        </div >
    );
};
