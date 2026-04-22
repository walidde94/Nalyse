import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Trash2, Copy, FileText, Mail, Globe, Settings2, X, RefreshCw, Plus, Check } from 'lucide-react';
import { StatusBadge, cronToHuman, PriorityBadge } from '../AutomationComponents';

const CRON_PRESETS = [
    { value: '0 9 * * *', label: 'Every day at 9:00 AM' },
    { value: '0 18 * * *', label: 'Every day at 6:00 PM' },
    { value: '0 0 * * 1', label: 'Every Monday at midnight' },
    { value: '0 9 1 * *', label: '1st of month at 9:00 AM' },
    { value: '0 18 * * 5', label: 'Every Friday at 6:00 PM' },
];

const MODULE_LIST = [
    { key: 'infrastructure', label: 'Infrastructure', icon: '🖥️' },
    { key: 'analysis', label: 'Analysis Intelligence', icon: '🧠' },
    { key: 'audit', label: 'Audit & Governance', icon: '🛡️' },
    { key: 'business', label: 'Business Metrics', icon: '📊' },
    { key: 'team', label: 'Team Activity', icon: '👥' },
    { key: 'quality', label: 'Data Quality', icon: '✅' },
    { key: 'financial', label: 'Financial Metrics', icon: '💰' },
    { key: 'custom', label: 'Custom Notes', icon: '📝' },
];

interface PipelinesTabProps {
    schedules: any[]; dashboards: any[]; analyses: any[]; loading: boolean;
    onTrigger: (id: string) => void; onToggle: (id: string, active: boolean) => void;
    onDelete: (id: string) => void; onDuplicate: (id: string) => void;
    onCreate: (data: any) => void;
}

export const PipelinesTab = ({ schedules, dashboards, analyses, loading, onTrigger, onToggle, onDelete, onDuplicate, onCreate }: PipelinesTabProps) => {
    const [isCreating, setIsCreating] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [form, setForm] = useState({
        name: '', description: '', cronExpression: '0 9 * * *', priority: 'normal',
        dashboardId: '', analysisId: '', deliverTo: '', deliveryChannel: 'email', format: 'pdf',
        modules: { infrastructure: true, analysis: true, audit: true, business: true, team: false, quality: false, financial: false, custom: false },
    });

    const resetForm = () => {
        setForm({ name: '', description: '', cronExpression: '0 9 * * *', priority: 'normal', dashboardId: '', analysisId: '', deliverTo: '', deliveryChannel: 'email', format: 'pdf', modules: { infrastructure: true, analysis: true, audit: true, business: true, team: false, quality: false, financial: false, custom: false } });
        setWizardStep(1); setIsCreating(false);
    };

    const handleCreate = () => {
        if (!form.name || !form.deliverTo) return;
        onCreate({ name: form.name, cronExpression: form.cronExpression, dashboardId: form.dashboardId || null, config: { deliverTo: form.deliverTo, format: form.format, deliveryChannel: form.deliveryChannel, modules: form.modules, priority: form.priority, description: form.description }, isActive: true });
        resetForm();
    };

    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const S: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box', fontSize: 13 };
    const L: React.CSSProperties = { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{schedules.length} pipeline{schedules.length !== 1 ? 's' : ''}</div>
                <button onClick={() => setIsCreating(true)} style={{ padding: '10px 22px', borderRadius: 12, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={16} /> New Pipeline
                </button>
            </div>

            {/* Wizard */}
            <AnimatePresence>
            {isCreating && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-panel" style={{ borderRadius: 24, border: '1px solid rgba(99,102,241,0.3)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #6366f1, #10b981)' }} />
                    <div style={{ padding: 32 }}>
                        {/* Wizard steps indicator */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[1,2,3].map(s => (
                                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: wizardStep >= s ? '#6366f1' : 'rgba(255,255,255,0.05)', color: wizardStep >= s ? '#fff' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
                                            {wizardStep > s ? <Check size={14} /> : s}
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: wizardStep >= s ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                                            {s === 1 ? 'Identity' : s === 2 ? 'Sources' : 'Delivery'}
                                        </span>
                                        {s < 3 && <div style={{ width: 30, height: 1, background: wizardStep > s ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />}
                                    </div>
                                ))}
                            </div>
                            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        {wizardStep === 1 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div><div style={L}>Pipeline Name *</div><input style={S} placeholder="e.g. Executive Weekly" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                                <div><div style={L}>Description</div><input style={S} placeholder="Optional description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                                <div><div style={L}>Schedule</div><select style={S} value={form.cronExpression} onChange={e => setForm({...form, cronExpression: e.target.value})}>
                                    {CRON_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                                <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', marginBottom: 8 }}><Calendar size={10} /> Next 5 Run Predictions</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {getNextRuns(form.cronExpression).map((d, i) => (
                                            <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Run #{i+1}</span>
                                                <span style={{ fontFamily: 'var(--font-mono)' }}>{d.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                </div>
                                <div><div style={L}>Priority</div><div style={{ display: 'flex', gap: 8 }}>
                                    {['low','normal','high','critical'].map(p => (
                                        <button key={p} onClick={() => setForm({...form, priority: p})} style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', background: form.priority === p ? '#6366f1' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}>{p}</button>
                                    ))}
                                </div></div>
                            </div>
                        )}

                        {wizardStep === 2 && (
                            <div style={{ display: 'grid', gap: 20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div><div style={L}>Dashboard Source</div><select style={S} value={form.dashboardId} onChange={e => setForm({...form, dashboardId: e.target.value})}>
                                        <option value="">None / Full System</option>
                                        {dashboards.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select></div>
                                    <div><div style={L}>Analysis Context</div><select style={S} value={form.analysisId} onChange={e => setForm({...form, analysisId: e.target.value})}>
                                        <option value="">None / System Logs</option>
                                        {analyses.filter((a: any) => a.status === 'completed').map((a: any) => <option key={a.id} value={a.id}>{a.file?.filename || 'Insight'}</option>)}
                                    </select></div>
                                </div>
                                <div><div style={L}>Report Modules</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                        {MODULE_LIST.map(m => {
                                            const on = (form.modules as any)[m.key];
                                            return <button key={m.key} onClick={() => setForm({...form, modules: {...form.modules, [m.key]: !on}})} style={{ padding: '10px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800, background: on ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, color: on ? '#818cf8' : 'rgba(255,255,255,0.4)', cursor: 'pointer', textAlign: 'left' }}>{m.icon} {m.label}</button>;
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {wizardStep === 3 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div><div style={L}>Delivery Endpoint *</div><input style={S} placeholder={form.deliveryChannel === 'email' ? 'exec@company.com' : 'https://...'} value={form.deliverTo} onChange={e => setForm({...form, deliverTo: e.target.value})} /></div>
                                <div><div style={L}>Channel</div><div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => setForm({...form, deliveryChannel: 'email'})} style={{ flex: 1, padding: 12, borderRadius: 12, background: form.deliveryChannel === 'email' ? '#6366f1' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 11, fontWeight: 700 }}><Mail size={14} /> Email</button>
                                    <button onClick={() => setForm({...form, deliveryChannel: 'webhook'})} style={{ flex: 1, padding: 12, borderRadius: 12, background: form.deliveryChannel === 'webhook' ? '#10b981' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 11, fontWeight: 700 }}><Globe size={14} /> Webhook</button>
                                    <button onClick={() => setForm({...form, deliveryChannel: 'slack'})} style={{ flex: 1, padding: 12, borderRadius: 12, background: form.deliveryChannel === 'slack' ? '#ec4899' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="8" x="2" y="2" rx="2"/><rect width="8" height="8" x="14" y="2" rx="2"/><rect width="8" height="8" x="2" y="14" rx="2"/><rect width="8" height="8" x="14" y="14" rx="2"/></svg> Slack
                                    </button>
                                </div></div>
                                <div style={{ gridColumn: '1 / -1' }}><div style={L}>Format</div><div style={{ display: 'flex', gap: 8 }}>
                                    {['html','pdf','csv','json'].map(f => <button key={f} onClick={() => setForm({...form, format: f})} style={{ flex: 1, padding: 12, borderRadius: 12, background: form.format === f ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 800, fontSize: 11 }}>{f}</button>)}
                                </div></div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
                            <button onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : resetForm()} className="glass-button" style={{ padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>{wizardStep > 1 ? 'Back' : 'Cancel'}</button>
                            {wizardStep < 3 ? (
                                <button onClick={() => setWizardStep(wizardStep + 1)} disabled={wizardStep === 1 && !form.name} style={{ padding: '12px 28px', borderRadius: 12, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, opacity: wizardStep === 1 && !form.name ? 0.5 : 1 }}>Next Step →</button>
                            ) : (
                                <button onClick={handleCreate} disabled={!form.deliverTo || loading} style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{loading ? <RefreshCw className="animate-spin" size={16} /> : '⚡ Deploy Pipeline'}</button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Pipeline Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
                {schedules.map((s: any) => {
                    const cfg = s.config || {};
                    const isSelected = selectedIds.has(s.id);
                    return (
                        <div key={s.id} className="pipeline-card glass-panel" style={{ padding: 24, borderRadius: 20, border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.06)'}`, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.isActive ? 'linear-gradient(90deg, #6366f1, #10b981)' : 'rgba(255,255,255,0.05)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(s.id)} style={{ accentColor: '#6366f1' }} />
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={18} style={{ color: '#6366f1' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{s.name}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {cfg.deliveryChannel === 'email' ? <Mail size={10} /> : <Globe size={10} />}
                                            {cfg.deliverTo || '—'}
                                        </div>
                                    </div>
                                </div>
                                <StatusBadge status={s.isActive ? 'active' : 'paused'} />
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                                <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>{cronToHuman(s.cronExpression)}</span>
                                <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{cfg.format || 'PDF'}</span>
                                <PriorityBadge priority={cfg.priority} />
                            </div>

                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Last run: {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : 'Never'}</div>

                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => onTrigger(s.id)} title="Run Now" style={{ padding: 8, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: 'none', color: '#10b981', cursor: 'pointer' }}><Play size={14} /></button>
                                <button onClick={() => onToggle(s.id, s.isActive)} title={s.isActive ? 'Pause' : 'Activate'} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}>{s.isActive ? <Square size={14} /> : <Play size={14} />}</button>
                                <button onClick={() => onDuplicate(s.id)} title="Duplicate" style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#818cf8', cursor: 'pointer' }}><Copy size={14} /></button>
                                <button onClick={() => onDelete(s.id)} title="Delete" style={{ padding: 8, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {schedules.length === 0 && <div style={{ padding: 80, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600 }}>No pipelines configured yet. Create one to get started.</div>}
        </motion.div>
    );
};
