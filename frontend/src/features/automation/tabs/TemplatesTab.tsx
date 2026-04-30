import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Check } from 'lucide-react';
import { TEMPLATE_ICONS } from '../AutomationComponents';
import { API_URL } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';

export const TemplatesTab = ({ onDeployed }: { onDeployed: () => void }) => {
    const { token } = useAuth();
    const { addToast } = useToast();
    const [templates, setTemplates] = useState<any[]>([]);
    const [deploying, setDeploying] = useState<string | null>(null);
    const [deployed, setDeployed] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetch(`${API_URL}/api/automation/templates`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(setTemplates).catch(() => {});
    }, [token]);

    const categories = ['all', ...new Set(templates.map(tpl => tpl.category))];
    const filtered = filter === 'all' ? templates : templates.filter(tpl => tpl.category === filter);

    const handleDeploy = async (tpl: any) => {
        setDeploying(tpl.id);
        try {
            const res = await fetch(`${API_URL}/api/automation/templates/${tpl.id}/deploy`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ deliverTo: '' })
            });
            if (res.ok) {
                setDeployed(prev => new Set(prev).add(tpl.id));
                addToast(`"${tpl.name}" deployed as pipeline`, 'success');
                onDeployed();
            }
        } catch { addToast('Deploy failed', 'error'); }
        setDeploying(null);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilter(c)} style={{
                            padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700,
                            background: filter === c ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface-hover)',
                            color: filter === c ? '#818cf8' : 'var(--text-muted)', cursor: 'pointer', textTransform: 'capitalize'
                        }}>{c}</button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                {filtered.map((tpl, i) => {
                    const isDone = deployed.has(tpl.id);
                    return (
                        <motion.div key={tpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="template-card glass-panel" style={{ padding: 28, borderRadius: 24, border: '1px solid var(--border-default)' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tpl.color }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${tpl.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    {TEMPLATE_ICONS[tpl.icon] || '📄'}
                                </div>
                                <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: tpl.color, padding: '3px 10px', borderRadius: 6, background: `${tpl.color}15` }}>{tpl.category}</span>
                            </div>

                            <h4 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>{tpl.name}</h4>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>{tpl.description}</p>

                            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 4, background: 'var(--bg-surface-hover)', fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tpl.format}</span>
                                <span style={{ padding: '3px 8px', borderRadius: 4, background: 'var(--bg-surface-hover)', fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{tpl.cronExpression}</span>
                                <span style={{ padding: '3px 8px', borderRadius: 4, background: `${tpl.color}15`, fontSize: 9, fontWeight: 700, color: tpl.color, textTransform: 'uppercase' }}>{tpl.priority}</span>
                            </div>

                            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                                {Object.entries(tpl.modules).filter(([, v]) => v).map(([k]) => (
                                    <span key={k} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.08)', fontSize: 9, fontWeight: 700, color: '#818cf8', textTransform: 'capitalize' }}>{k}</span>
                                ))}
                            </div>

                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => handleDeploy(tpl)} disabled={deploying === tpl.id || isDone}
                                style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: isDone ? 'default' : 'pointer', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    background: isDone ? 'rgba(16,185,129,0.15)' : `linear-gradient(135deg, ${tpl.color}, ${tpl.color}cc)`,
                                    color: isDone ? '#10b981' : '#fff', opacity: deploying === tpl.id ? 0.6 : 1
                                }}>
                                {isDone ? <><Check size={14} /> Deployed</> : <><Rocket size={14} /> Deploy Template</>}
                            </motion.button>
                        </motion.div>
                    );
                })}
            </div>
            {filtered.length === 0 && <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-disabled)', fontSize: 13 }}>No templates in this category.</div>}
        </motion.div>
    );
};
