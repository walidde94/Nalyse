import { motion } from 'framer-motion';
import { FileCode, Eye, Download, Trash2, Clock, Zap, Share2 } from 'lucide-react';

interface ReportGalleryTabProps {
    history: any[]; onView: (url: string) => void; onDownload: (id: string) => void;
    onDelete: (id: string) => void; onGoSchedules: () => void; onTriggerFirst: () => void;
    hasSchedules: boolean;
}

export const ReportGalleryTab = ({ history, onView, onDownload, onDelete, onGoSchedules, onTriggerFirst, hasSchedules }: ReportGalleryTabProps) => {
    const reports = history.filter((r: any) => (r.status === 'success' || r.status === 'pending') && r.schedule);
    const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const handleShare = (run: any) => {
        const url = `${window.location.origin}/api/automation/reports/${run.id}/view`;
        navigator.clipboard.writeText(url);
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {reports.map((report: any, i: number) => (
                    <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="glass-panel" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                        {report.status === 'pending' && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                    <Zap size={28} style={{ color: '#6366f1' }} />
                                </motion.div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Generating...</div>
                            </div>
                        )}

                        {/* Cover gradient */}
                        <div style={{ height: 80, borderRadius: 16, marginBottom: 18, background: `linear-gradient(135deg, ${report.schedule?.config?.templateId ? '#6366f1' : '#1e293b'}, ${report.schedule?.config?.templateId ? '#8b5cf6' : '#334155'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.05), transparent 70%)' }} />
                            <FileCode size={32} style={{ color: 'rgba(255,255,255,0.3)' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>{report.schedule?.name || 'Report'}</h4>
                            <span style={{ padding: '3px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{report.schedule?.config?.format || 'HTML'}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginBottom: 18, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {report.status === 'pending' ? 'Just now' : formatDate(report.startedAt)}</span>
                            {report.durationMs && <span>{report.durationMs}ms</span>}
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <button disabled={report.status === 'pending'} className="glass-button" onClick={() => onView(report.outputUrl)}
                                style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: report.status === 'pending' ? 0.4 : 1 }}>
                                <Eye size={13} /> Preview
                            </button>
                            <button disabled={report.status === 'pending'} className="glass-button" onClick={() => onDownload(report.id)}
                                style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', opacity: report.status === 'pending' ? 0.4 : 1 }}>
                                <Download size={13} /> Download
                            </button>
                            <button disabled={report.status === 'pending'} onClick={() => handleShare(report)} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', opacity: report.status === 'pending' ? 0.4 : 1 }} title="Copy link">
                                <Share2 size={13} />
                            </button>
                            <button onClick={() => onDelete(report.id)} style={{ padding: 10, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer' }} title="Delete">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {reports.length === 0 && (
                <div style={{ padding: 100, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <FileCode size={36} style={{ opacity: 0.2 }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>No reports yet</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', maxWidth: 360, margin: '8px auto 28px' }}>Generate your first intelligence dossier by running a pipeline or deploying a template.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="glass-button" style={{ padding: '10px 22px', borderRadius: 10, fontSize: 12, fontWeight: 700 }} onClick={onGoSchedules}>View Pipelines</button>
                        {hasSchedules && <button onClick={onTriggerFirst} style={{ padding: '10px 22px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>Run First Pipeline</button>}
                    </div>
                </div>
            )}
        </motion.div>
    );
};
