import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronDown, ChevronUp, RefreshCw, Eye, Download } from 'lucide-react';
import { StatusBadge, RunStatusIcon } from '../AutomationComponents';

interface ExecutionLogTabProps {
    history: any[]; schedules: any[]; total: number; page: number; limit: number;
    onFilterChange: (f: any) => void; onRetry: (scheduleId: string) => void;
    onView: (url: string) => void; onDownload: (runId: string) => void;
}

export const ExecutionLogTab = ({ history, schedules, total, page, limit, onFilterChange, onRetry, onView, onDownload }: ExecutionLogTabProps) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [scheduleFilter, setScheduleFilter] = useState('');

    const handleFilter = (status?: string, scheduleId?: string) => {
        const s = status !== undefined ? status : statusFilter;
        const sc = scheduleId !== undefined ? scheduleId : scheduleFilter;
        if (status !== undefined) setStatusFilter(s);
        if (scheduleId !== undefined) setScheduleFilter(sc);
        onFilterChange({ status: s, scheduleId: sc, page: 1 });
    };

    const S: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: 10, color: '#fff', outline: 'none', fontSize: 12 };
    const totalPages = Math.ceil(total / limit);

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Filters */}
            <div className="glass-panel" style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <History size={16} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Filter:</span>
                <select style={S} value={statusFilter} onChange={e => handleFilter(e.target.value, undefined)}>
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                </select>
                <select style={S} value={scheduleFilter} onChange={e => handleFilter(undefined, e.target.value)}>
                    <option value="">All Pipelines</option>
                    {schedules.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{total} execution{total !== 1 ? 's' : ''}</div>
            </div>

            {/* Log entries */}
            <div className="glass-panel" style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                {history.map((run: any) => {
                    const isExpanded = expandedId === run.id;
                    return (
                        <div key={run.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div onClick={() => setExpandedId(isExpanded ? null : run.id)} style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: run.status === 'success' ? 'rgba(16,185,129,0.1)' : run.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <RunStatusIcon status={run.status} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{run.schedule?.name || 'Unknown'}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{new Date(run.startedAt).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    {run.durationMs && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>{run.durationMs}ms</span>}
                                    <StatusBadge status={run.status} />
                                    {isExpanded ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                                </div>
                            </div>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                        <div style={{ padding: '0 24px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                            <div><div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Started</div><div style={{ fontSize: 12, color: '#fff', fontFamily: 'var(--font-mono)' }}>{new Date(run.startedAt).toLocaleString()}</div></div>
                                            <div><div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Completed</div><div style={{ fontSize: 12, color: '#fff', fontFamily: 'var(--font-mono)' }}>{run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}</div></div>
                                            <div><div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Duration</div><div style={{ fontSize: 12, color: '#fff', fontFamily: 'var(--font-mono)' }}>{run.durationMs ? `${run.durationMs}ms` : '—'}</div></div>
                                            {run.errorMessage && <div style={{ gridColumn: '1 / -1', padding: 12, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}><div style={{ fontSize: 9, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: 4 }}>Error</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>{run.errorMessage}</div></div>}
                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                                                {run.status === 'success' && run.outputUrl && (
                                                    <>
                                                        <button onClick={() => onView(run.outputUrl)} className="glass-button" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={12} /> Preview</button>
                                                        <button onClick={() => onDownload(run.id)} className="glass-button" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={12} /> Download</button>
                                                    </>
                                                )}
                                                {run.status === 'failed' && run.scheduleId && (
                                                    <button onClick={() => onRetry(run.scheduleId)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer' }}><RefreshCw size={12} /> Retry</button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
                {history.length === 0 && <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No executions match your filters.</div>}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => onFilterChange({ status: statusFilter, scheduleId: scheduleFilter, page: p })}
                            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, background: page === p ? '#6366f1' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}>{p}</button>
                    ))}
                </div>
            )}
        </motion.div>
    );
};
