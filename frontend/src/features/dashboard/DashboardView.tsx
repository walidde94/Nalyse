import { useState, useMemo, useEffect } from 'react';
import {
    LayoutList,
    LayoutGrid,
    Folder,
    Trash2,
    FileText,
    FileSpreadsheet,
    Star,
    CloudUpload,
    BrainCircuit,
    BarChart3,
    Zap,
    ShieldCheck,
    TrendingUp,
    AlertTriangle,
    Activity,
    Clock,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ArrowRight,
    X,
    Lightbulb
} from 'lucide-react';
import { calculatePulse } from './pulseEngine';

// --- SUB-COMPONENTS for Dashboard ---

const MetricCard = ({ label, value, trend, trendLabel, color, icon: Icon }: any) => {
    const isPositive = trend?.includes('+') || trend?.includes('Up') || (!trend?.includes('-') && !trend?.includes('Down'));
    const colorVar = color === 'success' ? '#10b981' : color === 'danger' ? '#ef4444' : color === 'warning' ? '#f59e0b' : '#3b82f6';

    return (
        <div className="card hover-glow p-5 flex flex-col justify-between" style={{ height: '140px', borderLeft: `4px solid ${colorVar}` }}>
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-secondary text-xs font-bold uppercase tracking-wider">{label}</span>
                    <h3 className="text-h2 font-black mt-2" style={{ fontSize: '28px' }}>{value}</h3>
                </div>
                <div className="p-2.5 rounded-lg flex items-center justify-center" style={{ background: `${colorVar}15`, color: colorVar, width: '40px', height: '40px' }}>
                    <Icon size={20} strokeWidth={2} />
                </div>
            </div>

            {trend && (
                <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-bold flex items-center ${isPositive ? 'text-success' : 'text-danger'}`} style={{ color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
                    </span>
                    <span className="text-xs text-secondary opacity-70">{trendLabel}</span>
                </div>
            )}
        </div>
    );
};

const ExecutiveSummary = ({ metrics, fileCount, anomalyCount, onViewReport }: any) => (
    <div className="card relative overflow-hidden p-6 mb-8 border border-[var(--primary)]/30" style={{ background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
        <div className="absolute top-0 right-0 p-4" style={{ opacity: 0.1, pointerEvents: 'none' }}>
            <Sparkles size={120} />
        </div>
        <div className="flex items-start gap-4 relative z-10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-600 shadow-lg text-white">
                <BrainCircuit size={28} />
            </div>
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-black text-primary">Nexus AI Executive Brief</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold border border-[var(--primary)]/20">LIVE ANALYSIS</span>
                </div>
                <p className="text-secondary text-sm leading-relaxed max-w-4xl">
                    Across your <strong className="text-primary">{fileCount} active datasets</strong>,
                    {metrics.revenueGrowth === '—' || metrics.revenueGrowth === 'Waiting for Data' ? (
                        <span> the intelligence engine is currently <strong className="text-primary">mapping your business topology</strong>. </span>
                    ) : (
                        <span> current intelligence indicates a <strong className="text-success">{metrics.revenueGrowth} growth trajectory</strong>. </span>
                    )}
                    {anomalyCount > 0 ? (
                        <span> Attention is required for <strong className="text-danger">{anomalyCount} detected {anomalyCount === 1 ? 'anomaly' : 'anomalies'}</strong> in your recent logistics data. </span>
                    ) : (
                        <span> Data stability is optimal. </span>
                    )}
                    {metrics.efficiencyTrend !== '—' && (
                        <span> Optimizing your storage clusters could yield an estimated <strong className="text-purple-400">{metrics.efficiencyTrend} efficiency gain</strong> this cycle. </span>
                    )}
                </p>
                <div className="flex gap-3 mt-4">
                    <button className="btn btn-sm btn-primary flex items-center gap-2" onClick={onViewReport}>
                        <FileText size={14} /> View Strategic Report
                    </button>
                    <button className="btn btn-sm btn-ghost text-secondary" style={{ opacity: 0.8 }}>Dismiss</button>
                </div>
            </div>
        </div>
    </div>
);

const RecentActivityItem = ({ file, onClick }: any) => (
    <div
        className="flex items-center justify-between p-3 hover:bg-[var(--bg-secondary)] rounded-lg cursor-pointer transition-colors group border-b border-[var(--border-subtle)] last:border-0"
        onClick={onClick}
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${file.filename.endsWith('.csv') ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {file.filename.endsWith('.csv') ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
            </div>
            <div>
                <h4 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{file.filename}</h4>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Clock size={12} />
                    <span>Updated {new Date(file.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{(file.size / 1024).toFixed(0)} KB</span>
                </div>
            </div>
        </div>
        <button className="btn btn-icon btn-ghost btn-xs opacity-0 group-hover:opacity-100">
            <ArrowUpRight size={16} />
        </button>
    </div>
);

const WatchlistItem = ({ insight, onRemove }: any) => (
    <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-primary/30 transition-all group">
        <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={14} className="text-primary" />
                    <h4 className="text-sm font-bold text-primary">{insight.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                        {new Date(insight.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                </div>
                <p className="text-sm text-secondary line-clamp-2 leading-relaxed">{insight.summary}</p>
                {insight.advice && insight.advice.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-tertiary">{insight.advice.length} recommendations</span>
                    </div>
                )}
            </div>
            <button
                onClick={onRemove}
                className="btn btn-icon btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove from watchlist"
            >
                <X size={14} />
            </button>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

export const DashboardView = ({
    userEmail,
    firstName,
    userPlan,
    files,
    groups,
    onUpload,
    onUpgrade,
    dragActive,
    handleDrag,
    handleDrop,
    onFileSelect,
    onDeleteFile,
    onToggleFavorite,
    onUpdateFileGroup,
    onCreateGroup,
    onDeleteGroup,
    onDeleteMultiple,
    onViewReport
}: any) => {

    const maxStorageMB = userPlan === 'pro' ? 10240 : userPlan === 'enterprise' ? 1000000 : 100;
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [pinnedInsights, setPinnedInsights] = useState<any[]>([]);

    // Load pinned insights from localStorage
    useEffect(() => {
        const loadInsights = () => {
            try {
                const stored = localStorage.getItem('strategic_watchlist');
                setPinnedInsights(stored ? JSON.parse(stored) : []);
            } catch (e) {
                console.error('Failed to load insights:', e);
                setPinnedInsights([]);
            }
        };
        loadInsights();

        // Listen for storage changes (from other tabs/windows)
        window.addEventListener('storage', loadInsights);
        return () => window.removeEventListener('storage', loadInsights);
    }, []);

    const safeFiles = Array.isArray(files) ? files : [];

    // Derived State
    const metrics = useMemo(() => calculatePulse(safeFiles), [safeFiles]);
    const recentFiles = useMemo(() => [...safeFiles].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [safeFiles]);
    const starredFiles = useMemo(() => safeFiles.filter((f: any) => f.isFavorite), [safeFiles]);

    const filteredFiles = safeFiles.filter((f: any) => {
        return f.filename.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalStorage = (safeFiles.reduce((acc: number, f: any) => acc + Number(f.size), 0) / 1024 / 1024).toFixed(2);
    const fileCount = safeFiles.length;
    const totalStorageNum = Number(totalStorage);
    const isOverLimit = totalStorageNum >= maxStorageMB;

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;
        onCreateGroup(newGroupName, '');
        setNewGroupName('');
        setShowCreateGroup(false);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedFiles(newSet);
    };

    const toggleAll = (groupFiles: any[]) => {
        const newSet = new Set(selectedFiles);
        const allSelected = groupFiles.every(f => newSet.has(f.id));

        if (allSelected) {
            groupFiles.forEach(f => newSet.delete(f.id));
        } else {
            groupFiles.forEach(f => newSet.add(f.id));
        }
        setSelectedFiles(newSet);
    };

    const handleBulkDelete = () => {
        if (selectedFiles.size === 0) return;
        if (confirm(`Delete ${selectedFiles.size} selected items?`)) {
            onDeleteMultiple(Array.from(selectedFiles));
            setSelectedFiles(new Set());
        }
    };

    // Group logic for 'All Files' view
    const groupedFiles: Record<string, any[]> = { 'ungrouped': [] };
    const safeGroups = Array.isArray(groups) ? groups : [];
    safeGroups.forEach((g: any) => { groupedFiles[g.id] = []; });
    filteredFiles.forEach((f: any) => {
        if (f.groupId && groupedFiles[f.groupId]) {
            groupedFiles[f.groupId].push(f);
        } else {
            groupedFiles['ungrouped'].push(f);
        }
    });

    return (
        <div className="flex-col gap-6 fade-in main-content-mobile" style={{
            padding: 'clamp(16px, 5vw, 32px)',
            maxWidth: '1600px',
            margin: '0 auto',
            width: '100%',
            fontFamily: 'Dubai, sans-serif',
            position: 'relative'
        }}>
            <div className="bg-mesh"></div>

            {/* --- HEADER --- */}
            <header>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <span className="text-xs font-black tracking-[0.2em] text-[var(--primary)] uppercase mb-2 block">Enterprise Workspace</span>
                        <h1 className="text-h1" style={{ fontSize: 'clamp(28px, 5vw, 38px)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                            Welcome back, <span className="text-gradient font-black">{firstName || userEmail?.split('@')[0]}</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <div className="card glass-morphism py-2 px-4 flex items-center gap-3">
                            <Clock size={16} className="text-secondary" />
                            <span className="text-xs font-bold text-secondary">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <div className="card glass-morphism py-2 px-4 flex items-center gap-3">
                            <ShieldCheck size={16} className="text-success" />
                            <span className="text-xs font-bold text-success">Status: Online</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- NEW: PRIMARY FILE EXPLORER AT THE TOP --- */}
            <section className="mb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--primary-subtle)] rounded-lg text-[var(--primary)]">
                            <CloudUpload size={20} />
                        </div>
                        <h3 className="text-h3 text-xl">Active Workspace</h3>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                        {selectedFiles.size > 0 && (
                            <button
                                className="btn btn-danger btn-sm h-10 animate-in fade-in zoom-in duration-200 flex items-center gap-2 px-4 shadow-sm"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 size={14} /> <span className="font-bold">Purge ({selectedFiles.size})</span>
                            </button>
                        )}
                        <div className="relative flex-1 w-full md:w-auto group">
                            <input
                                type="text"
                                placeholder="Search datasets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input h-10 w-full md:w-64 text-sm px-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--primary)] transition-all rounded-xl"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`btn btn-secondary h-10 flex items-center gap-2 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all ${viewMode === 'list' ? 'ring-1 ring-[var(--border-subtle)]' : 'opacity-70 hover:opacity-100'
                                    }`}
                                title="List View"
                            >
                                <LayoutList size={16} className={viewMode === 'list' ? "text-[var(--primary)]" : "text-[var(--text-secondary)]"} />
                                <span className={`font-bold ${viewMode === 'list' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>List</span>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`btn btn-secondary h-10 flex items-center gap-2 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all ${viewMode === 'grid' ? 'ring-1 ring-[var(--border-subtle)]' : 'opacity-70 hover:opacity-100'
                                    }`}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} className={viewMode === 'grid' ? "text-[var(--primary)]" : "text-[var(--text-secondary)]"} />
                                <span className={`font-bold ${viewMode === 'grid' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>Grid</span>
                            </button>
                        </div>
                        <div className="h-6 w-px bg-[var(--border-subtle)] mx-1 hidden md:block"></div>
                        <button className="btn btn-secondary h-10 flex items-center gap-2 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]" onClick={() => setShowCreateGroup(true)}>
                            <Folder size={16} className="text-[var(--primary)]" /> <span className="font-bold">New Group</span>
                        </button>
                        <button
                            id="tour-upload-btn"
                            className={`btn btn-primary h-10 flex items-center gap-2 px-6 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all ${dragActive ? 'ring-4 ring-[var(--primary)]/30' : ''}`}
                            onClick={() => document.getElementById('file-input')?.click()}
                            disabled={isOverLimit}
                        >
                            <CloudUpload size={18} /> <span className="font-black uppercase tracking-wider text-xs">Upload Dataset</span>
                        </button>
                    </div>
                </div>

                {/* File Explorer Content */}
                <div className="flex-col gap-6">
                    {/* Groups */}
                    {groups.map((group: any) => {
                        const groupFiles = groupedFiles[group.id] || [];
                        if (groupFiles.length === 0 && searchTerm) return null;
                        return (
                            <div key={group.id} className="flex-col gap-3 mb-6">
                                <div className="flex justify-between items-center px-4 py-2 bg-[var(--bg-card)]/50 rounded-xl border border-[var(--border-subtle)] border-dashed">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-[var(--primary-subtle)] rounded-lg text-primary">
                                            <Folder size={14} />
                                        </div>
                                        <span className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)]">{group.name}</span>
                                        <div className="px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[10px] font-bold opacity-60">
                                            {groupFiles.length} Assets
                                        </div>
                                    </div>
                                    <button className="btn btn-icon btn-ghost btn-xs text-danger/50 hover:text-danger" onClick={() => confirm('Delete group?') && onDeleteGroup(group.id)}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                {viewMode === 'list' ? (
                                    <div className="card overflow-hidden p-0 border border-[var(--border-subtle)] shadow-xl">
                                        <FileTable
                                            files={groupFiles}
                                            groups={groups}
                                            selectedFiles={selectedFiles}
                                            onToggleSelection={toggleSelection}
                                            onToggleAll={() => toggleAll(groupFiles)}
                                            onFileSelect={onFileSelect}
                                            onToggleFavorite={onToggleFavorite}
                                            onDeleteFile={onDeleteFile}
                                            onUpdateFileGroup={onUpdateFileGroup}
                                        />
                                    </div>
                                ) : (
                                    <FileGrid
                                        files={groupFiles}
                                        selectedFiles={selectedFiles}
                                        onToggleSelection={toggleSelection}
                                        onFileSelect={onFileSelect}
                                        onDeleteFile={onDeleteFile}
                                        onToggleFavorite={onToggleFavorite}
                                    />
                                )}
                            </div>
                        );
                    })}

                    {/* Ungrouped */}
                    {(groupedFiles['ungrouped'].length > 0 || groups.length === 0) && (
                        <div className="flex-col gap-3">
                            {groups.length > 0 && (
                                <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-card)]/50 rounded-xl border border-[var(--border-subtle)] border-dashed">
                                    <div className="p-1.5 bg-[var(--bg-surface)] rounded-lg text-tertiary">
                                        <FileText size={14} />
                                    </div>
                                    <span className="font-black text-xs uppercase tracking-widest text-secondary">Uncategorized Intelligence</span>
                                </div>
                            )}
                            {viewMode === 'list' ? (
                                <div className="card overflow-hidden p-0 border border-[var(--border-subtle)] shadow-xl">
                                    {groupedFiles['ungrouped'].length === 0 ? (
                                        <div className="p-20 text-center flex flex-col items-center gap-4">
                                            <div className="p-4 bg-[var(--bg-surface)] rounded-full text-tertiary opacity-20">
                                                <CloudUpload size={48} />
                                            </div>
                                            <div>
                                                <p className="text-secondary font-bold">No data assets detected in this sector.</p>
                                                <p className="text-xs text-tertiary mt-1">Upload your first dataset to initiate neural mapping.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <FileTable
                                            files={groupedFiles['ungrouped']}
                                            groups={groups}
                                            selectedFiles={selectedFiles}
                                            onToggleSelection={toggleSelection}
                                            onToggleAll={() => toggleAll(groupedFiles['ungrouped'])}
                                            onFileSelect={onFileSelect}
                                            onToggleFavorite={onToggleFavorite}
                                            onDeleteFile={onDeleteFile}
                                            onUpdateFileGroup={onUpdateFileGroup}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-card)]/30 p-4 rounded-2xl border border-[var(--border-subtle)]">
                                    <FileGrid
                                        files={groupedFiles['ungrouped']}
                                        selectedFiles={selectedFiles}
                                        onToggleSelection={toggleSelection}
                                        onFileSelect={onFileSelect}
                                        onDeleteFile={onDeleteFile}
                                        onToggleFavorite={onToggleFavorite}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* --- STRATEGIC PULSE (Refined) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Revenue Card */}
                <div className="relative group overflow-hidden rounded-xl border border-white/5 bg-[#0f172a]/60 backdrop-blur-md p-6 hover:bg-[#1e293b]/60 transition-all duration-300 hover:border-emerald-500/30">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <TrendingUp size={20} />
                        </div>
                        {metrics.revenueGrowth !== '—' && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-bold ${metrics.revenueGrowth.includes('-') ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {metrics.revenueGrowth.includes('-') ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                                {metrics.revenueGrowth}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-secondary text-[11px] font-bold uppercase tracking-widest mb-1">Strategic Revenue</h3>
                        <div className="text-3xl font-black text-white tracking-tight">{metrics.revenue}</div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-secondary font-medium">Performance Pacing</span>
                            <span className="text-emerald-400 font-bold uppercase tracking-wider">Optimal</span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 w-[78%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                        </div>
                    </div>
                </div>

                {/* Neural Drift Card */}
                <div className="relative group overflow-hidden rounded-xl border border-white/5 bg-[#0f172a]/60 backdrop-blur-md p-6 hover:bg-[#1e293b]/60 transition-all duration-300 hover:border-rose-500/30">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-rose-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2.5 rounded-lg border ${metrics.anomalies > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                            <Activity size={20} />
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase ${metrics.anomalies > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {metrics.modelHealth}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-secondary text-[11px] font-bold uppercase tracking-widest mb-1">Neural Drift</h3>
                        <div className="text-3xl font-black text-white tracking-tight">{metrics.anomalies}</div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[11px] text-secondary font-medium leading-relaxed truncate">
                            {metrics.anomalies > 0
                                ? "Critical variance detected in recent datasets."
                                : "Data integrity is optimal across all clusters."}
                        </p>
                    </div>
                </div>

                {/* Active Projects Card */}
                <div className="relative group overflow-hidden rounded-xl border border-white/5 bg-[#0f172a]/60 backdrop-blur-md p-6 hover:bg-[#1e293b]/60 transition-all duration-300 hover:border-violet-500/30">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            <BrainCircuit size={20} />
                        </div>
                        <div className="px-2 py-1 rounded text-[10px] bg-violet-500/10 text-violet-300 font-mono font-bold uppercase border border-violet-500/10">
                            Core
                        </div>
                    </div>

                    <div>
                        <h3 className="text-secondary text-[11px] font-bold uppercase tracking-widest mb-1">Active Units</h3>
                        <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
                            {metrics.projects} <span className="text-lg text-secondary font-bold opacity-50">Strategy</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                        <button
                            onClick={onViewReport}
                            className="group/btn flex items-center gap-2 text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider"
                        >
                            Open Strategic Board
                            <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- REBORN GRID: WATCHLIST & INSIGHTS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: WATCHLIST (8 cols) */}
                <div className="lg:col-span-8">
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-lg text-white shadow-lg">
                                    <Sparkles size={18} />
                                </div>
                                <h3 className="text-h3 text-xl">Strategic Watchlist</h3>
                            </div>
                            {pinnedInsights.length > 0 && (
                                <button
                                    className="btn btn-ghost btn-sm text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100"
                                    onClick={() => {
                                        if (confirm('Clear neural watchlist?')) {
                                            localStorage.setItem('strategic_watchlist', '[]');
                                            setPinnedInsights([]);
                                        }
                                    }}
                                >
                                    Purge All
                                </button>
                            )}
                        </div>
                        {pinnedInsights.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pinnedInsights.map((insight) => (
                                    <WatchlistItem
                                        key={insight.id}
                                        insight={insight}
                                        onRemove={() => {
                                            const updated = pinnedInsights.filter(i => i.id !== insight.id);
                                            localStorage.setItem('strategic_watchlist', JSON.stringify(updated));
                                            setPinnedInsights(updated);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="card min-h-[160px] flex items-center justify-center border-dashed border-2 opacity-60">
                                <div className="text-center">
                                    <Sparkles size={32} className="mx-auto mb-3 text-tertiary" />
                                    <p className="text-sm font-bold text-secondary uppercase tracking-widest">Neural Watchlist Latent</p>
                                    <p className="text-xs text-secondary mt-1 max-w-[200px] mx-auto opacity-60">Pin critical insights from the Analysis Studio to monitor them here.</p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* RIGHT COLUMN: QUICK METRICS & ACTIONS (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    {/* Starred Assets */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Star size={18} className="text-amber-400" />
                            <h3 className="text-h3 text-xl">Vaulted Artifacts</h3>
                        </div>
                        <div className="card p-5 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl">
                            {starredFiles.length > 0 ? (
                                <div className="flex flex-col gap-4">
                                    {starredFiles.map((f: any) => (
                                        <div key={f.id} className="flex items-center gap-4 p-3 hover:bg-[var(--bg-secondary)] rounded-xl cursor-pointer transition-all border border-transparent hover:border-[var(--primary)]/30 group" onClick={() => onFileSelect(f)}>
                                            <div className="p-2 bg-amber-400/10 text-amber-500 rounded-lg">
                                                <Star size={16} fill="currentColor" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-black text-xs truncate uppercase tracking-wider">{f.filename}</div>
                                                <div className="text-[10px] text-tertiary font-bold">READY FOR DISCOVERY</div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={14} className="text-primary" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <Star size={32} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">No Vaulted Assets</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Quick Strategies */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Zap size={18} className="text-primary" />
                            <h3 className="text-h3 text-xl">Pulse Actions</h3>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="card p-5 border-l-4 border-l-primary cursor-pointer hover:bg-[var(--bg-secondary)] transition-all group">
                                <h4 className="font-black text-xs mb-2 uppercase tracking-widest group-hover:text-primary">Schedule Neural Report</h4>
                                <p className="text-[11px] text-secondary leading-relaxed opacity-70">Automate cross-cluster intelligence distribution for active streams.</p>
                            </div>
                            <div className="card p-5 border-l-4 border-l-[#f59e0b] cursor-pointer hover:bg-[var(--bg-secondary)] transition-all group">
                                <h4 className="font-black text-xs mb-2 uppercase tracking-widest group-hover:text-amber-500">Drift Audit Required</h4>
                                <p className="text-[11px] text-secondary leading-relaxed opacity-70">3 anomalies detected in logistics variance. Structural review suggested.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Hidden Input, Modals */}
            <input
                type="file"
                id="file-input"
                style={{ display: 'none' }}
                multiple
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        onUpload(Array.from(e.target.files));
                    }
                }}
            />
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="card w-96 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-h3 mb-4">Create Dataset Group</h3>
                        <input className="input w-full mb-4" placeholder="Group Name" autoFocus value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                        <div className="flex justify-end gap-2">
                            <button className="btn btn-ghost" onClick={() => setShowCreateGroup(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateGroup}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- UTILITY COMPONENTS (Unchanged logic, updated styling) ---

const FileGrid = ({ files, selectedFiles, onToggleSelection, onFileSelect, onDeleteFile, onToggleFavorite }: any) => {
    if (files.length === 0) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {files.map((f: any) => {
                const isSelected = selectedFiles.has(f.id);
                return (
                    <div
                        key={f.id}
                        className={`card group transition-all relative ${isSelected ? 'border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--primary)]/5' : 'hover:border-[var(--primary)]'}`}
                        onClick={() => onToggleSelection(f.id)}
                        style={{ padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                        <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelection(f.id)}
                            />
                        </div>
                        <div className="flex justify-between items-start pl-6">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${f.filename.endsWith('.csv') ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {f.filename.endsWith('.csv') ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                            </div>
                            <button
                                className="btn btn-icon btn-ghost btn-xs"
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(f); }}
                                style={{ color: f.isFavorite ? '#fbbf24' : 'var(--text-tertiary)' }}
                            >
                                <Star size={14} fill={f.isFavorite ? 'currentColor' : 'none'} />
                            </button>
                        </div>
                        <div className="pl-6">
                            <h4 className="font-bold text-sm truncate" title={f.filename}>{f.filename}</h4>
                            <p className="text-xs text-secondary mt-1">{(f.size / 1024).toFixed(1)} KB • {new Date(f.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="mt-2 flex gap-2">
                            <button className="btn btn-xs btn-primary w-full" onClick={(e) => { e.stopPropagation(); onFileSelect(f); }}>Analyze</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const FileTable = ({ files, groups, selectedFiles, onToggleSelection, onToggleAll, onFileSelect, onToggleFavorite, onDeleteFile, onUpdateFileGroup }: any) => {
    const allSelected = files.length > 0 && files.every((f: any) => selectedFiles.has(f.id));

    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="text-[10px] text-secondary border-b-2 border-[var(--border-default)] bg-[var(--bg-secondary)]">
                    <th className="p-4 pl-4 w-10">
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={allSelected}
                            onChange={onToggleAll}
                        />
                    </th>
                    <th className="p-4 w-10"><Star size={12} /></th>
                    <th className="p-4 font-bold uppercase tracking-wider">Dataset</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Type</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Size</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Created</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Group</th>
                    <th className="p-4 text-right pr-4 font-bold uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody>
                {files.map((f: any) => {
                    const isSelected = selectedFiles.has(f.id);
                    return (
                        <tr
                            key={f.id}
                            className={`border-b border-[var(--border-subtle)] transition-all duration-200 cursor-pointer group ${isSelected ? 'bg-[var(--primary)]/5 border-l-4 border-l-[var(--primary)]' : 'hover:bg-[var(--bg-subtle)] hover:shadow-sm'}`}
                            onClick={() => onToggleSelection(f.id)}
                        >
                            <td className="p-4 pl-4" onClick={e => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={isSelected}
                                    onChange={() => onToggleSelection(f.id)}
                                />
                            </td>
                            <td onClick={e => { e.stopPropagation(); onToggleFavorite(f); }} className="p-4">
                                <Star size={16} className={`transition-all ${f.isFavorite ? 'text-amber-400 fill-amber-400 scale-110' : 'text-gray-400 hover:text-amber-300'}`} />
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-all group-hover:scale-110 ${f.filename.endsWith('.csv') ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {f.filename.endsWith('.csv') ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span
                                            className="font-semibold text-sm text-[var(--text-primary)] truncate max-w-[280px] group-hover:text-[var(--primary)] transition-colors"
                                            title={f.originalName || f.filename}
                                        >
                                            {f.originalName || f.filename}
                                        </span>
                                        <span className="text-[9px] text-secondary font-mono opacity-50">
                                            {f.id}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${f.filename.endsWith('.csv') ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                                    {f.filename.endsWith('.csv') ? 'CSV' : f.filename.endsWith('.json') ? 'JSON' : f.filename.endsWith('.xlsx') ? 'Excel' : 'Data'}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-mono text-[var(--text-primary)] font-semibold">
                                        {(f.size / 1024).toFixed(1)} KB
                                    </span>
                                    <span className="text-[9px] text-secondary opacity-50">
                                        {(f.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-[var(--text-primary)] font-medium">
                                        {new Date(f.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                    <span className="text-[9px] text-secondary opacity-50">
                                        {new Date(f.createdAt).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </td>
                            <td className="p-4" onClick={e => e.stopPropagation()}>
                                <select
                                    className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs px-3 py-1.5 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                                    value={f.groupId || ''}
                                    onChange={(e) => onUpdateFileGroup(f.id, e.target.value || null)}
                                >
                                    <option value="">Ungrouped</option>
                                    {groups.map((g: any) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-4 text-right pr-4">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <button
                                        className="btn btn-primary btn-xs flex items-center gap-1.5 px-3 py-2 hover:scale-105 transition-transform"
                                        onClick={(e) => { e.stopPropagation(); onFileSelect(f); }}
                                        title="Analyze this dataset"
                                    >
                                        <BarChart3 size={14} /> Analyze
                                    </button>
                                    <button
                                        className="btn btn-icon btn-ghost btn-xs text-danger hover:bg-red-500/10 hover:scale-110 transition-all"
                                        onClick={(e) => { e.stopPropagation(); onDeleteFile(f); }}
                                        title="Delete dataset"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table >
    );
};
