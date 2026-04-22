import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Globe, Clock, Bell, Palette, Shield, Save, RefreshCw } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { API_URL } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';

export const SettingsTab = () => {
    const { addToast } = useToast();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({
        brandName: '', brandColor: '#6366f1', logoUrl: '', footerText: '',
        timezone: 'UTC', retention: '90', defaultFormat: 'html', defaultPriority: 'normal',
        notifySuccess: true, notifyFailure: true, notifyInApp: true, weeklyDigest: false,
        maxConcurrent: '3', rateLimit: '10'
    });

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/automation/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings((prev: any) => ({ ...prev, ...data }));
            }
        } catch { addToast('Failed to load settings', 'error'); }
        setLoading(false);
    }, [token, addToast]);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const u = (key: string, val: any) => setSettings((p: any) => ({ ...p, [key]: val }));
    
    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/automation/settings`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) addToast('Enterprise settings updated', 'success');
            else throw new Error();
        } catch { addToast('Failed to save settings', 'error'); }
        setSaving(false);
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><RefreshCw className="animate-spin" size={24} style={{ color: '#6366f1', opacity: 0.5 }} /></div>;

    const S: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box', fontSize: 13 };
    const L: React.CSSProperties = { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 };
    const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
        <div className="glass-panel" style={{ padding: 28, borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={18} style={{ color: '#6366f1' }} /> {title}
            </h3>
            {children}
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
            <Section icon={Clock} title="Schedule Defaults">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div><div style={L}>Default Timezone</div>
                        <select style={S} value={settings.timezone} onChange={e => u('timezone', e.target.value)}>
                            {['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Europe/London','Europe/Paris','Europe/Berlin','Asia/Tokyo','Asia/Shanghai','Australia/Sydney'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                    </div>
                    <div><div style={L}>Report Retention</div>
                        <select style={S} value={settings.retention} onChange={e => u('retention', e.target.value)}>
                            <option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option><option value="180">180 days</option><option value="never">Never delete</option>
                        </select>
                    </div>
                    <div><div style={L}>Default Format</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['html','pdf','csv','json'].map(f => <button key={f} onClick={() => u('defaultFormat', f)} style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', background: settings.defaultFormat === f ? '#6366f1' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}>{f}</button>)}
                        </div>
                    </div>
                    <div><div style={L}>Default Priority</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['low','normal','high','critical'].map(p => <button key={p} onClick={() => u('defaultPriority', p)} style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', background: settings.defaultPriority === p ? '#6366f1' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}>{p}</button>)}
                        </div>
                    </div>
                </div>
            </Section>

            <Section icon={Bell} title="Notifications">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                        { key: 'notifySuccess', label: 'Email on successful report generation' },
                        { key: 'notifyFailure', label: 'Email on failed report generation' },
                        { key: 'notifyInApp', label: 'In-app notifications for all events' },
                        { key: 'weeklyDigest', label: 'Weekly automation digest summary' },
                    ].map(n => (
                        <label key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{n.label}</span>
                            <div onClick={() => u(n.key, !settings[n.key])} style={{ width: 40, height: 22, borderRadius: 11, background: settings[n.key] ? '#6366f1' : 'rgba(255,255,255,0.1)', transition: 'background 0.2s', position: 'relative', cursor: 'pointer' }}>
                                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: settings[n.key] ? 21 : 3, transition: 'left 0.2s' }} />
                            </div>
                        </label>
                    ))}
                </div>
            </Section>

            <Section icon={Palette} title="Report Branding">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div><div style={L}>Organization Name</div><input style={S} placeholder="Your Company" value={settings.brandName} onChange={e => u('brandName', e.target.value)} /></div>
                    <div><div style={L}>Logo URL</div><input style={S} placeholder="https://..." value={settings.logoUrl} onChange={e => u('logoUrl', e.target.value)} /></div>
                    <div><div style={L}>Primary Color</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="color" value={settings.brandColor} onChange={e => u('brandColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
                            <input style={S} value={settings.brandColor} onChange={e => u('brandColor', e.target.value)} />
                        </div>
                    </div>
                    <div><div style={L}>Footer Text</div><input style={S} placeholder="Confidential • Internal Use Only" value={settings.footerText} onChange={e => u('footerText', e.target.value)} /></div>
                </div>
            </Section>

            <Section icon={Shield} title="Security & Limits">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div><div style={L}>Max Concurrent Runs</div><select style={S} value={settings.maxConcurrent} onChange={e => u('maxConcurrent', e.target.value)}>
                        {['1','2','3','5','10'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select></div>
                    <div><div style={L}>Rate Limit (runs/hour)</div><select style={S} value={settings.rateLimit} onChange={e => u('rateLimit', e.target.value)}>
                        {['5','10','25','50','100'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select></div>
                </div>
            </Section>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={save} disabled={saving}
                style={{ padding: 16, borderRadius: 16, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: saving ? 0.7 : 1 }}>
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Save All Settings
            </motion.button>
        </motion.div>
    );
};

