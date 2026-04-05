import React, { useState, useEffect } from 'react';
import {
    Activity, Plus, Bell, Clock, Database, ChevronRight,
    Settings, Play, Pause, Trash2, Webhook, Mail, AlertTriangle,
    Target, LineChart, Zap, CheckCircle2, XCircle, Search, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data
type AlertRule = {
    id: string;
    name: string;
    isActive: boolean;
    metric: string;
    operator: string;
    threshold: number;
    window: string;
    actions: { type: string, target: string };
    lastTriggeredAt: string | null;
};


const FIELDS = ['system.cpu.total', 'transaction.amount', 'event.action', 'user.latency', 'network.bytes_out'];
const CONDITIONS = ['>', '<', '>=', '<=', '==', '!=', 'is', 'contains'];
const WINDOWS = ['1m', '5m', '10m', '30m', '1h', '24h'];

export const AlertingView: React.FC<{ token?: string }> = ({ token }) => {
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');

    // Builder State
    const [newName, setNewName] = useState('');
    const [newField, setNewField] = useState(FIELDS[0]);
    const [newCondition, setNewCondition] = useState(CONDITIONS[0]);
    const [newThreshold, setNewThreshold] = useState('');
    const [newWindow, setNewWindow] = useState(WINDOWS[1]);
    const [newActionType, setNewActionType] = useState<'webhook' | 'email'>('webhook');
    const [newActionTarget, setNewActionTarget] = useState('');

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/alerts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRules(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRules();
    }, [token]);

    const handleSaveRule = async () => {
        if (!newName || !newThreshold || !newActionTarget) return;

        try {
            const res = await fetch('http://localhost:3000/api/alerts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newName,
                    metric: newField,
                    operator: newCondition,
                    threshold: Number(newThreshold),
                    window: newWindow,
                    actions: { type: newActionType, target: newActionTarget }
                })
            });

            if (res.ok) {
                const newRule = await res.json();
                setRules([newRule, ...rules]);
                setIsCreating(false);
                setNewName(''); setNewThreshold(''); setNewActionTarget('');
            }
        } catch (err) {
            console.error('Error saving rule', err);
        }
    };

    const toggleRuleStatus = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:3000/api/alerts/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                setRules(rules.map(r => r.id === id ? updated : r));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteRule = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:3000/api/alerts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setRules(rules.filter(r => r.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
            
            {/* Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Bell style={{ color: 'var(--primary)' }} />
                            Alerting & Rules
                        </h1>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
                            Monitor data streams and trigger automated actions based on real-time conditions.
                        </p>
                    </div>
                    {!isCreating && (
                        <button
                            onClick={() => setIsCreating(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'var(--primary)', color: '#fff',
                                border: 'none', padding: '10px 18px', borderRadius: '10px',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                boxShadow: '0 4px 12px var(--primary-glow)'
                            }}
                        >
                            <Plus size={16} /> Create Alert Rule
                        </button>
                    )}
                </div>

                {/* Tabs */}
                {!isCreating && (
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {(['rules', 'history'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '0 0 12px 0', fontSize: '13px', fontWeight: 700,
                                    color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                                    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {tab === 'rules' ? 'Active Rules' : 'Trigger History'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
                <AnimatePresence mode="wait">
                    {isCreating ? (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            style={{ maxWidth: '800px', margin: '0 auto' }}
                        >
                            {/* Rule Builder */}
                            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Target size={20} color="var(--primary)" /> Define Alert Conditions
                                </h2>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Name */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>RULE NAME</label>
                                        <input
                                            value={newName} onChange={e => setNewName(e.target.value)}
                                            placeholder="e.g. CPU Spike Alert"
                                            className="analyst-input"
                                            style={{ width: '100%', maxWidth: '400px' }}
                                        />
                                    </div>

                                    {/* Logic Sentence Builder */}
                                    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>WHEN</span>
                                            
                                            <select className="analyst-input" value={newField} onChange={e => setNewField(e.target.value)}>
                                                {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>

                                            <span style={{ color: 'var(--text-secondary)' }}>IS</span>

                                            <select className="analyst-input" value={newCondition} onChange={e => setNewCondition(e.target.value)} style={{ width: '80px' }}>
                                                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>

                                            <input
                                                type="number"
                                                className="analyst-input"
                                                placeholder="Value"
                                                value={newThreshold}
                                                onChange={e => setNewThreshold(e.target.value)}
                                                style={{ width: '100px' }}
                                            />

                                            <span style={{ color: 'var(--text-secondary)' }}>FOR THE LAST</span>

                                            <select className="analyst-input" value={newWindow} onChange={e => setNewWindow(e.target.value)} style={{ width: '90px' }}>
                                                {WINDOWS.map(w => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />

                                    {/* Actions */}
                                    <div>
                                        <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>Take Action</h3>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <button
                                                onClick={() => setNewActionType('webhook')}
                                                style={{
                                                    flex: 1, padding: '16px', borderRadius: '12px',
                                                    border: `1px solid ${newActionType === 'webhook' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                                                    background: newActionType === 'webhook' ? 'var(--primary-subtle)' : 'var(--bg-main)',
                                                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                                }}
                                            >
                                                <Webhook size={20} color={newActionType === 'webhook' ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '8px' }} />
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Trigger Webhook</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Send a POST request to an endpoint</div>
                                            </button>
                                            <button
                                                onClick={() => setNewActionType('email')}
                                                style={{
                                                    flex: 1, padding: '16px', borderRadius: '12px',
                                                    border: `1px solid ${newActionType === 'email' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                                                    background: newActionType === 'email' ? 'var(--primary-subtle)' : 'var(--bg-main)',
                                                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                                }}
                                            >
                                                <Mail size={20} color={newActionType === 'email' ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '8px' }} />
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Send Email</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Notify users or teams directly</div>
                                            </button>
                                        </div>

                                        <div style={{ marginTop: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                {newActionType === 'webhook' ? 'WEBHOOK ENDPOINT / IDENTIFIER' : 'EMAIL ADDRESS'}
                                            </label>
                                            <input
                                                value={newActionTarget} onChange={e => setNewActionTarget(e.target.value)}
                                                placeholder={newActionType === 'webhook' ? 'e.g. nalyse-webhook-id' : 'e.g. alerts@company.com'}
                                                className="analyst-input"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        style={{
                                            background: 'transparent', border: '1px solid var(--border-subtle)',
                                            color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '8px',
                                            fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >Cancel</button>
                                    <button
                                        onClick={handleSaveRule}
                                        disabled={!newName || !newThreshold || !newActionTarget}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            background: 'var(--primary)', color: '#fff', border: 'none',
                                            padding: '10px 24px', borderRadius: '8px',
                                            fontWeight: 700, cursor: 'pointer',
                                            opacity: (!newName || !newThreshold || !newActionTarget) ? 0.5 : 1
                                        }}
                                    >
                                        <Save size={16} /> Save Rule
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'rules' ? (
                        <motion.div key="rules-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {rules.map(rule => (
                                    <div key={rule.id} style={{
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                        borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center',
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(0,0,0,0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{rule.name}</h3>
                                                {rule.isActive ? (
                                                    <span style={{ fontSize: '11px', fontWeight: 800, background: 'var(--success-subtle, rgba(16,185,129,0.1))', color: 'var(--success, #10b981)', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> ACTIVE</span>
                                                ) : (
                                                    <span style={{ fontSize: '11px', fontWeight: 800, background: 'var(--warning-subtle, rgba(245,158,11,0.1))', color: 'var(--warning, #f59e0b)', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Pause size={12} /> PAUSED</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                                <span><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>WHEN</span> {rule.metric} {rule.operator} {rule.threshold}</span>
                                                <span><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>FOR</span> {rule.window}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {rule.actions?.type === 'webhook' ? <Webhook size={14} /> : <Mail size={14} />}
                                                    {rule.actions?.target}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ textAlign: 'right', marginRight: '16px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>LAST TRIGGERED</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt).toLocaleString() : 'Never'}</div>
                                            </div>
                                            <div style={{ height: '32px', width: '1px', background: 'var(--border-subtle)' }} />
                                            <button onClick={() => toggleRuleStatus(rule.id)} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {rule.isActive ? <Pause size={18} /> : <Play size={18} />}
                                            </button>
                                            <button onClick={() => deleteRule(rule.id)} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--danger)', opacity: 0.8 }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {rules.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                                        <Bell size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                        <p style={{ fontSize: '14px', margin: 0 }}>No alert rules configured yet.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                             <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
                                <LineChart size={48} style={{ color: 'var(--primary)', opacity: 0.4, margin: '0 0 16px' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>Trigger History & Analytics</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                                    Full audit log of all alert evaluations, triggers, and webhook deliveries will appear here once rules start processing data streams.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
        </div>
    );
};
