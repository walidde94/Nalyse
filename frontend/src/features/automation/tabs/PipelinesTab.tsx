import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Trash2, Copy, FileText, Mail, Globe, Settings2, X, RefreshCw, Plus, Check, Calendar, Clock } from 'lucide-react';
import { StatusBadge, cronToHuman, PriorityBadge, getNextRuns } from '../AutomationComponents';

const CRON_PRESETS = [
    { value: '0 9 * * *', label: 'Every day at 9 AM' },
    { value: '0 0 * * 1', label: 'Every Monday' },
    { value: '0 9 1 * *', label: '1st of every month' },
];

export const PipelinesTab = ({ schedules, dashboards, analyses, loading, onTrigger, onToggle, onDelete, onDuplicate, onCreate }: any) => {
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [form, setForm] = useState<any>({
        name: '', description: '', cronExpression: '0 9 * * *',
        targetFileId: '', dashboardId: '', analysisId: '',
        priority: 'normal', deliveryChannel: 'email', deliverTo: '', format: 'pdf',
        isDelayed: false, delayValue: 10, delayUnit: 'minutes'
    });

    const computeDelayedCron = (val: number, unit: string) => {
        const target = new Date();
        if (unit === 'minutes') target.setMinutes(target.getMinutes() + val);
        else if (unit === 'hours') target.setHours(target.getHours() + val);
        else if (unit === 'days') target.setDate(target.getDate() + val);
        return `${target.getMinutes()} ${target.getHours()} ${target.getDate()} ${target.getMonth() + 1} *`;
    };

    const handleCreate = () => {
        const finalCron = form.isDelayed ? computeDelayedCron(form.delayValue, form.delayUnit) : form.cronExpression;
        onCreate({
            ...form,
            cronExpression: finalCron,
            config: {
                ...form,
                isOneTime: form.isDelayed,
                description: form.description
            }
        });
        setIsWizardOpen(false);
        setWizardStep(1);
    };

    const L = { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: 8, letterSpacing: '0.05em' };
    const S = { width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, outline: 'none' };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Active Intelligence Pipelines</h2>
                <button onClick={() => setIsWizardOpen(true)} style={{ padding: '10px 20px', borderRadius: 12, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={16} /> Create Pipeline
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {schedules.map((s: any) => (
                    <motion.div key={s.id} layout className="glass-panel" style={{ padding: 20, borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>{s.name}</h3>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.config?.isOneTime ? 'One-time Delayed' : cronToHuman(s.cronExpression)}</div>
                            </div>
                            <StatusBadge status={s.isActive ? 'active' : 'paused'} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                            <PriorityBadge priority={s.config?.priority || 'normal'} />
                            <div style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{s.config?.deliveryChannel?.toUpperCase()}</div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                            <button onClick={() => onTrigger(s.id)} style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Play size={14} /> Run Now</button>
                            <button onClick={() => onToggle(s.id, !s.isActive)} style={{ padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>{s.isActive ? <Square size={14} /> : <Play size={14} />}</button>
                            <button onClick={() => onDuplicate(s.id)} style={{ padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}><Copy size={14} /></button>
                            <button onClick={() => onDelete(s.id)} style={{ padding: '8px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isWizardOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel" style={{ width: '100%', maxWidth: 500, borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                            <button onClick={() => setIsWizardOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={20} /></button>
                            
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(99,102,241,0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} /></div>
                                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>New Pipeline</h2>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {[1, 2, 3].map(i => <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= wizardStep ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />)}
                                </div>
                            </div>

                            {wizardStep === 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div><div style={L}>Pipeline Name *</div><input style={S} placeholder="e.g. Tactical Audit" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                                    
                                    <div>
                                        <div style={L}>Execution Mode</div>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                            <button onClick={() => setForm({...form, isDelayed: false})} style={{ flex: 1, padding: '12px', borderRadius: 12, background: !form.isDelayed ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: !form.isDelayed ? '1px solid #6366f1' : '1px solid transparent', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><RefreshCw size={14} /> Recurring</button>
                                            <button onClick={() => setForm({...form, isDelayed: true})} style={{ flex: 1, padding: '12px', borderRadius: 12, background: form.isDelayed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: form.isDelayed ? '1px solid #10b981' : '1px solid transparent', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><Clock size={14} /> Delayed</button>
                                        </div>
                                    </div>

                                    {!form.isDelayed ? (
                                        <div>
                                            <div style={L}>Schedule (Cron)</div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                                {CRON_PRESETS.map(p => <button key={p.value} onClick={() => setForm({...form, cronExpression: p.value})} style={{ padding: '6px 12px', borderRadius: 8, background: form.cronExpression === p.value ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: 'none', color: form.cronExpression === p.value ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>{p.label}</button>)}
                                            </div>
                                            <input style={S} value={form.cronExpression} onChange={e => setForm({...form, cronExpression: e.target.value})} />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <div style={L}>Execute in...</div>
                                                <input type="number" style={S} value={form.delayValue} onChange={e => setForm({...form, delayValue: parseInt(e.target.value)})} />
                                            </div>
                                            <div>
                                                <div style={L}>Unit</div>
                                                <select style={S} value={form.delayUnit} onChange={e => setForm({...form, delayUnit: e.target.value})}>
                                                    <option value="minutes">Minutes</option>
                                                    <option value="hours">Hours</option>
                                                    <option value="days">Days</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', marginBottom: 8 }}><Calendar size={10} /> Prediction</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {form.isDelayed ? (
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Target Execution</span>
                                                    <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>{new Date(Date.now() + (form.delayValue * (form.delayUnit === 'minutes' ? 60000 : form.delayUnit === 'hours' ? 3600000 : 86400000))).toLocaleString()}</span>
                                                </div>
                                            ) : (
                                                getNextRuns(form.cronExpression).map((d: Date, i: number) => (
                                                    <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Run #{i+1}</span>
                                                        <span style={{ fontFamily: 'var(--font-mono)' }}>{d.toLocaleString()}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 2 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div><div style={L}>Data Scope</div><select style={S} value={form.analysisId} onChange={e => setForm({...form, analysisId: e.target.value})}>
                                        <option value="">Full Organization Context</option>
                                        {analyses.map((a: any) => <option key={a.id} value={a.id}>{a.title}</option>)}
                                    </select></div>
                                    <div><div style={L}>Priority</div><div style={{ display: 'flex', gap: 8 }}>
                                        {['low','normal','high','critical'].map(p => <button key={p} onClick={() => setForm({...form, priority: p})} style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', background: form.priority === p ? '#6366f1' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}>{p}</button>)}
                                    </div></div>
                                </div>
                            )}

                            {wizardStep === 3 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div><div style={L}>Delivery Channel</div><div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => setForm({...form, deliveryChannel: 'email'})} style={{ flex: 1, padding: 12, borderRadius: 12, background: form.deliveryChannel === 'email' ? '#6366f1' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 11, fontWeight: 700 }}><Mail size={14} /> Email</button>
                                        <button onClick={() => setForm({...form, deliveryChannel: 'webhook'})} style={{ flex: 1, padding: 12, borderRadius: 12, background: form.deliveryChannel === 'webhook' ? '#10b981' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 11, fontWeight: 700 }}><Globe size={14} /> Webhook</button>
                                    </div></div>
                                    <div><div style={L}>Format</div><div style={{ display: 'flex', gap: 8 }}>
                                        {['html','pdf','csv','json'].map(f => <button key={f} onClick={() => setForm({...form, format: f})} style={{ flex: 1, padding: 12, borderRadius: 12, background: form.format === f ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 800, fontSize: 11 }}>{f}</button>)}
                                    </div></div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                                {wizardStep > 1 && <button onClick={() => setWizardStep(wizardStep - 1)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Back</button>}
                                {wizardStep < 3 ? (
                                    <button onClick={() => setWizardStep(wizardStep + 1)} style={{ flex: 2, padding: '14px', borderRadius: 14, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Next Step</button>
                                ) : (
                                    <button onClick={handleCreate} style={{ flex: 2, padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #10b981)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800 }}>{form.isDelayed ? 'Schedule One-Time' : 'Activate Pipeline'}</button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
