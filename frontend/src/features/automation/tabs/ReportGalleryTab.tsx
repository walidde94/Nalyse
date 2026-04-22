import { motion } from 'framer-motion';
import { FileText, Download, Eye, Trash2, Clock, RefreshCw, Zap, ExternalLink, Share2 } from 'lucide-react';
import { StatusBadge } from '../AutomationComponents';

export const ReportGalleryTab = ({ history, onView, onDownload, onDelete, onShare, onGoSchedules, onTriggerFirst, hasSchedules }: any) => {
    // Only show runs that were intended to be reports
    const reportRuns = history.filter((h: any) => h.status === 'completed' || h.status === 'pending' || h.status === 'running');

    if (reportRuns.length === 0 && !hasSchedules) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--border-default)' }}>
                    <FileText size={40} style={{ color: 'var(--bg-elevated)' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>NO REPORTS YET</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>Deploy a template or create a custom pipeline to start generating intelligence dossiers.</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button onClick={onGoSchedules} className="glass-button" style={{ padding: '12px 24px', borderRadius: 12, fontWeight: 700 }}>Go to Pipelines</button>
                </div>
            </motion.div>
        );
    }

    if (reportRuns.length === 0 && hasSchedules) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--border-default)' }}>
                    <Zap size={40} style={{ color: '#6366f1', opacity: 0.2 }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>READY TO GENERATE</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>Your pipelines are configured. Run your first intelligence dossier to see it here.</p>
                <button onClick={onTriggerFirst} style={{ padding: '14px 32px', borderRadius: 14, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>Run First Pipeline</button>
            </motion.div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {reportRuns.map((run: any) => {
                const isPending = run.status === 'pending' || run.status === 'running';
                const format = run.metadata?.format || run.schedule?.config?.format || 'HTML';
                
                return (
                    <motion.div key={run.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel"
                        style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border-default)', position: 'relative', background: 'var(--bg-surface)' }}>
                        
                        {/* Report Cover */}
                        <div style={{ height: 160, background: isPending ? 'rgba(0,0,0,0.4)' : 'linear-gradient(135deg, #1e1b4b, #312e81)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isPending ? (
                                <div style={{ textAlign: 'center' }}>
                                    <RefreshCw className="animate-spin" size={32} style={{ color: '#6366f1', marginBottom: 12 }} />
                                    <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Generating...</div>
                                </div>
                            ) : (
                                <FileText size={60} style={{ color: 'var(--bg-elevated)' }} />
                            )}
                            <div style={{ position: 'absolute', top: 12, right: 12 }}><StatusBadge status={run.status} /></div>
                        </div>

                        {/* Info */}
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{run.schedule?.name || 'Manual Run'}</h3>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{format}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, color: 'var(--text-muted)', fontSize: 11 }}>
                                <Clock size={12} /> {new Date(run.startedAt).toLocaleString()}
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => onView(run)} disabled={isPending}
                                    style={{ flex: 2, padding: '10px', borderRadius: 10, background: isPending ? 'var(--bg-surface-hover)' : '#6366f1', color: '#fff', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: isPending ? 0.5 : 1 }}>
                                    <Eye size={14} /> View Report
                                </button>
                                <button onClick={() => onShare(run)} disabled={isPending}
                                    style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isPending ? 0.5 : 1 }}>
                                    <Share2 size={14} />
                                </button>
                                <button onClick={() => onDownload(run)} disabled={isPending}
                                    style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isPending ? 0.5 : 1 }}>
                                    <Download size={14} />
                                </button>
                                <button onClick={() => onDelete(run.id)}
                                    style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
