import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useUIStore } from '../../store/uiStore';
import { useToast } from '../../components/ui/Toast';
import { PricingView } from '../subscription/PricingView';
import { PremiumGate } from '../../components/subscription/PremiumGate';
import { RBACSettings } from './RBACSettings';
import { API_URL } from '../../config';
import {
    User, Key, Bell, ArrowLeft, LogOut, Shield, Moon, Sun, Monitor,
    CreditCard, Camera, Sparkles, ChevronRight, Copy, Eye, EyeOff,
    Plus, Trash2, Check, X, Palette, Zap, Lock, Globe, Clock, Mail,
    Activity, BarChart3, Fingerprint, Smartphone, Database, Download
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// SECURITY HEALTH SCORE — Animated arc gauge
// ═══════════════════════════════════════════════════════════════
const SecurityScore: React.FC<{ score: number }> = ({ score }) => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto' }}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle
                    cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{score}</div>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color, marginTop: 2 }}>
                    {score >= 80 ? 'Excellent' : score >= 50 ? 'Fair' : 'At Risk'}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// TOGGLE SWITCH — Premium animated toggle
// ═══════════════════════════════════════════════════════════════
const Toggle: React.FC<{ checked: boolean; onChange: () => void; color?: string }> = ({ checked, onChange, color }) => (
    <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
        <div style={{
            width: 48, height: 26,
            background: checked ? (color || 'var(--primary)') : 'rgba(255,255,255,0.08)',
            borderRadius: 13, position: 'relative', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: checked ? `0 0 16px ${(color || 'var(--primary)')}40` : 'inset 0 1px 3px rgba(0,0,0,0.2)',
            border: `1px solid ${checked ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
        }}>
            <div style={{
                position: 'absolute', top: 2, left: checked ? 24 : 2,
                width: 20, height: 20, background: 'white', borderRadius: '50%',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }} />
        </div>
    </label>
);

// ═══════════════════════════════════════════════════════════════
// SIDEBAR NAV ITEM
// ═══════════════════════════════════════════════════════════════
const NavItem: React.FC<{
    icon: React.ReactNode; label: string; desc: string;
    active: boolean; onClick: () => void; color: string; badge?: string;
}> = ({ icon, label, desc, active, onClick, color, badge }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            background: active ? `${color}10` : 'transparent',
            border: active ? `1px solid ${color}25` : '1px solid transparent',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
            position: 'relative',
        }}
    >
        <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: active ? color : 'var(--text-tertiary)', transition: 'all 0.2s',
            flexShrink: 0,
        }}>
            {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{desc}</div>
        </div>
        {badge && (
            <div style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800,
                background: `${color}15`, color, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>{badge}</div>
        )}
        {active && <div style={{ position: 'absolute', left: 0, top: '30%', bottom: '30%', width: 3, borderRadius: 4, background: color }} />}
    </motion.button>
);

// ═══════════════════════════════════════════════════════════════
// THEME CARD — Interactive preview
// ═══════════════════════════════════════════════════════════════
const ThemeCard: React.FC<{ id: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void; preview: React.ReactNode }> = ({ id, label, icon, active, onClick, preview }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.97 }}
        style={{
            flex: 1, padding: 0, borderRadius: 16, overflow: 'hidden',
            background: 'rgba(255,255,255,0.02)',
            border: active ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.06)',
            cursor: 'pointer', transition: 'all 0.3s ease',
            boxShadow: active ? '0 0 24px rgba(99, 102, 241, 0.15)' : 'none',
            display: 'flex', flexDirection: 'column',
        }}
    >
        <div style={{ height: 80, background: id === 'dark' ? '#0a0f1e' : id === 'light' ? '#f1f5f9' : 'linear-gradient(135deg, #0a0f1e 50%, #f1f5f9 50%)', position: 'relative', overflow: 'hidden' }}>
            {preview}
            {active && <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color="white" /></div>}
        </div>
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: active ? 'var(--primary)' : 'var(--text-tertiary)' }}>{icon}</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
        </div>
    </motion.button>
);

// ═══════════════════════════════════════════════════════════════
// MAIN SETTINGS VIEW
// ═══════════════════════════════════════════════════════════════
export const SettingsView = () => {
    const { user, token, refreshProfile, logout } = useAuth();
    const { addToast } = useToast();
    const { closeSettings, settingsInitialTab } = useUIStore();

    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'api' | 'notifications' | 'subscription'>(settingsInitialTab as any || 'profile');
    useEffect(() => { if (settingsInitialTab) setActiveTab(settingsInitialTab as any); }, [settingsInitialTab]);

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [glassMode, setGlassMode] = useState(localStorage.getItem('glassMode') === 'on');
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [notificationPrefs, setNotificationPrefs] = useState<any>({});
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [revealedKeys, setRevealedKeys] = useState<Record<number, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setBio(user.bio || '');
            setAvatarUrl(user.avatarUrl || '');
            setNotificationPrefs(user.notificationPreferences || {});
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'api' && token) {
            fetch(`${API_URL}/api/apikeys`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json()).then(d => { if (Array.isArray(d)) setApiKeys(d); }).catch(console.error);
        }
    }, [activeTab, token]);

    // Handlers (same logic, shorter)
    const handleThemeChange = (t: string) => { setTheme(t); localStorage.setItem('theme', t); document.documentElement.setAttribute('data-theme', t); window.dispatchEvent(new Event('theme-change')); };
    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ firstName, lastName, bio }) });
            if (!res.ok) throw new Error();
            await refreshProfile();
            addToast('Profile updated successfully', 'success');
        } catch { addToast('Failed to save changes', 'error'); }
        finally { setIsSaving(false); }
    };
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader(); reader.onload = (ev) => setAvatarUrl(ev.target?.result as string); reader.readAsDataURL(file);
        const fd = new FormData(); fd.append('file', file);
        try {
            const uploadRes = await fetch(`${API_URL}/api/files/upload?type=avatar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
            if (!uploadRes.ok) throw new Error(); const { file: nf } = await uploadRes.json();
            await fetch(`${API_URL}/api/auth/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ avatarUrl: `${API_URL}/uploads/${nf.filename}` }) });
            await refreshProfile(); addToast('Avatar updated', 'success');
        } catch { addToast('Upload failed', 'error'); }
    };
    const handleGenerateKey = async () => {
        try {
            const res = await fetch(`${API_URL}/api/apikeys`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: 'New API Key' }) });
            if (!res.ok) throw new Error(); const nk = await res.json(); setApiKeys([...apiKeys, nk]); addToast('API Key created', 'success');
        } catch { addToast('Failed to create key', 'error'); }
    };
    const handleRevokeKey = async (k: string) => {
        try {
            const res = await fetch(`${API_URL}/api/apikeys/${k}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(); setApiKeys(apiKeys.filter(x => x.key !== k)); addToast('Key revoked', 'success');
        } catch { addToast('Failed to revoke key', 'error'); }
    };
    const handleNotificationToggle = async (key: string) => {
        const np = { ...notificationPrefs, [key]: !notificationPrefs[key] }; setNotificationPrefs(np);
        try { await fetch(`${API_URL}/api/auth/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ notificationPreferences: np }) }); await refreshProfile(); } catch { console.error('Failed'); }
    };

    const isPro = (user as any)?.organization?.plan === 'pro' || (user as any)?.plan === 'pro';

    const TABS = [
        { id: 'profile', label: 'Account', desc: 'Personal info', icon: <User size={18} />, color: '#6366f1' },
        { id: 'appearance', label: 'Appearance', desc: 'Theme & display', icon: <Palette size={18} />, color: '#ec4899' },
        { id: 'security', label: 'Security & Team', desc: 'RBAC & access', icon: <Shield size={18} />, color: '#f43f5e' },
        { id: 'subscription', label: 'Billing', desc: 'Plans & invoices', icon: <CreditCard size={18} />, color: '#10b981' },
        { id: 'api', label: 'API Keys', desc: 'Developer access', icon: <Key size={18} />, color: '#f59e0b', badge: 'Pro' },
        { id: 'notifications', label: 'Notifications', desc: 'Email & alerts', icon: <Bell size={18} />, color: '#3b82f6' },
    ];

    const NOTIFICATIONS = [
        { key: 'analysis', title: 'Analysis Complete', desc: 'When your data analysis jobs finish', icon: <BarChart3 size={16} />, color: '#6366f1' },
        { key: 'digest', title: 'Weekly Digest', desc: 'Activity summary every Monday', icon: <Activity size={16} />, color: '#3b82f6' },
        { key: 'security', title: 'Security Alerts', desc: 'Account security notifications', icon: <Shield size={16} />, color: '#f43f5e' },
        { key: 'updates', title: 'Product Updates', desc: 'New features and improvements', icon: <Sparkles size={16} />, color: '#10b981' },
    ];

    const securityScore = (user?.emailVerified ? 25 : 0) + (apiKeys.length > 0 ? 15 : 0) + 35 + (isPro ? 25 : 10);

    return (
        <div style={{ height: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)', display: 'flex', overflow: 'hidden' }} className="fade-in">
            {/* ─── SPATIAL SIDEBAR ─── */}
            <div style={{
                width: 290, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column',
                padding: '0', overflow: 'hidden',
            }}>
                {/* Sidebar header */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <button onClick={closeSettings} className="btn btn-ghost btn-sm" style={{ padding: '8px', borderRadius: 10 }}>
                            <ArrowLeft size={18} />
                        </button>
                        <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>Settings</h1>
                    </div>

                    {/* Mini user card */}
                    <div style={{
                        padding: '14px', borderRadius: 14,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(236,72,153,0.04))',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, fontWeight: 800, color: 'white',
                        }}>
                            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.email?.[0]?.toUpperCase() || 'U')}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.firstName} {user?.lastName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                        </div>
                        {isPro && (
                            <div style={{ padding: '3px 7px', borderRadius: 6, background: 'linear-gradient(135deg, #FFD700, #FFA500)', fontSize: 8, fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PRO</div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {TABS.map(tab => (
                            <NavItem
                                key={tab.id}
                                icon={tab.icon} label={tab.label} desc={tab.desc}
                                active={activeTab === tab.id} onClick={() => setActiveTab(tab.id as any)}
                                color={tab.color} badge={tab.badge}
                            />
                        ))}
                    </div>
                </div>

                {/* Sign out */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <button onClick={logout} className="btn btn-ghost" style={{
                        width: '100%', justifyContent: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12,
                        color: 'var(--text-tertiary)', fontSize: 13,
                    }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>

            {/* ─── MAIN CONTENT ─── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px 48px' }}>
                <div style={{ maxWidth: 860 }}>
                    <AnimatePresence mode="wait">

                        {/* ══════════════ PROFILE TAB ══════════════ */}
                        {activeTab === 'profile' && (
                            <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                                <div style={{ marginBottom: 32 }}>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>Account Settings</h2>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>Manage your personal information and preferences</p>
                                </div>

                                {/* Avatar section */}
                                <div className="card" style={{ padding: '28px', borderRadius: 18, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Profile Picture</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 24px rgba(99,102,241,0.2)' }}
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            ) : (
                                                <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: 'white', boxShadow: '0 8px 24px rgba(99,102,241,0.2)' }}>
                                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', border: '3px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Camera size={12} color="white" />
                                            </div>
                                        </div>
                                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg, image/gif" onChange={handleAvatarUpload} />
                                        <div>
                                            <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} style={{ borderRadius: 10, marginBottom: 8 }}>Change Photo</button>
                                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>JPG, GIF or PNG. Max 5MB</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal info */}
                                <div className="card" style={{ padding: '28px', borderRadius: 18, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Personal Information</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        {[
                                            { l: 'First Name', v: firstName, s: setFirstName, d: false },
                                            { l: 'Last Name', v: lastName, s: setLastName, d: false },
                                            { l: 'Email Address', v: user?.email || '', s: null, d: true },
                                            { l: 'Organization', v: user?.organization?.name || 'Personal Account', s: null, d: true },
                                        ].map(f => (
                                            <div key={f.l} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.l}</label>
                                                <input type="text" className="input" value={f.v} onChange={f.s ? (e => f.s(e.target.value)) : undefined} disabled={f.d}
                                                    style={{ borderRadius: 12, padding: '11px 14px', fontSize: 14, ...(f.d ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--bg-surface)' } : {}) }} />
                                            </div>
                                        ))}
                                        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 7 }}>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bio</label>
                                            <textarea className="input" style={{ height: 100, resize: 'none', borderRadius: 12, padding: '11px 14px', fontSize: 14 }} placeholder="Tell us about yourself..." value={bio} onChange={e => setBio(e.target.value)} maxLength={240} />
                                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>{bio.length}/240</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                                        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={isSaving} style={{ borderRadius: 12, padding: '10px 32px', gap: 8 }}>
                                            {isSaving ? <><div style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Saving...</> : <><Check size={16} /> Save Changes</>}
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="card" style={{ padding: '28px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Account Overview</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                        {[
                                            { icon: <Database size={18} />, label: 'Datasets', value: '42', color: '#6366f1' },
                                            { icon: <BarChart3 size={18} />, label: 'Analyses', value: '156', color: '#10b981' },
                                            { icon: <Globe size={18} />, label: 'Shared', value: '23', color: '#3b82f6' },
                                            { icon: <Clock size={18} />, label: 'This Month', value: '18', color: '#f59e0b' },
                                        ].map(s => (
                                            <div key={s.label} style={{ padding: '16px', borderRadius: 14, background: `${s.color}06`, border: `1px solid ${s.color}12`, textAlign: 'center' }}>
                                                <div style={{ color: s.color, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                                                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{s.value}</div>
                                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ══════════════ APPEARANCE TAB ══════════════ */}
                        {activeTab === 'appearance' && (
                            <motion.div key="appearance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                                <div style={{ marginBottom: 32 }}>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>Appearance</h2>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>Customize how Nalyse looks and feels</p>
                                </div>

                                {/* Theme Selection */}
                                <div className="card" style={{ padding: '28px', borderRadius: 18, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Color Theme</h3>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        {[
                                            {
                                                id: 'dark', label: 'Midnight', icon: <Moon size={16} />, preview: (
                                                    <div style={{ padding: 12 }}>
                                                        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>{[1, 2, 3].map(i => <div key={i} style={{ height: 6, flex: 1, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }} />)}</div>
                                                        <div style={{ height: 20, borderRadius: 6, background: 'rgba(99,102,241,0.3)', marginBottom: 6 }} />
                                                        <div style={{ display: 'flex', gap: 6 }}>{[1, 2].map(i => <div key={i} style={{ height: 16, flex: 1, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />)}</div>
                                                    </div>
                                                )
                                            },
                                            {
                                                id: 'light', label: 'Daylight', icon: <Sun size={16} />, preview: (
                                                    <div style={{ padding: 12 }}>
                                                        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>{[1, 2, 3].map(i => <div key={i} style={{ height: 6, flex: 1, borderRadius: 3, background: 'rgba(0,0,0,0.1)' }} />)}</div>
                                                        <div style={{ height: 20, borderRadius: 6, background: 'rgba(37,99,235,0.15)', marginBottom: 6 }} />
                                                        <div style={{ display: 'flex', gap: 6 }}>{[1, 2].map(i => <div key={i} style={{ height: 16, flex: 1, borderRadius: 4, background: 'rgba(0,0,0,0.05)' }} />)}</div>
                                                    </div>
                                                )
                                            },
                                            {
                                                id: 'system', label: 'System', icon: <Monitor size={16} />, preview: (
                                                    <div style={{ padding: 12, display: 'flex', height: '100%' }}>
                                                        <div style={{ flex: 1 }}><div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', marginBottom: 6 }} /><div style={{ height: 30, borderRadius: 6, background: 'rgba(255,255,255,0.08)' }} /></div>
                                                        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
                                                        <div style={{ flex: 1 }}><div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.15)', marginBottom: 6 }} /><div style={{ height: 30, borderRadius: 6, background: 'rgba(0,0,0,0.08)' }} /></div>
                                                    </div>
                                                )
                                            },
                                        ].map(t => (
                                            <ThemeCard key={t.id} id={t.id} label={t.label} icon={t.icon} active={theme === t.id} onClick={() => handleThemeChange(t.id)} preview={t.preview} />
                                        ))}
                                    </div>
                                </div>

                                {/* Glass Mode */}
                                <div className="card" style={{ padding: '28px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Sparkles size={22} color="#6366f1" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    Glass Effect
                                                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 5, background: 'var(--primary-subtle)', color: 'var(--primary)' }}>Beta</span>
                                                </div>
                                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Enable glassmorphism overlay on all surfaces. Works with both themes.</p>
                                            </div>
                                        </div>
                                        <Toggle checked={glassMode} onChange={() => {
                                            const ng = !glassMode; setGlassMode(ng);
                                            localStorage.setItem('glassMode', ng ? 'on' : 'off');
                                            document.documentElement.setAttribute('data-glass', ng ? 'on' : 'off');
                                            window.dispatchEvent(new Event('theme-change'));
                                        }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ══════════════ SECURITY TAB ══════════════ */}
                        {activeTab === 'security' && (
                            <motion.div key="security" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                                <div style={{ marginBottom: 32 }}>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>Security & Team</h2>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>Manage access control and security settings</p>
                                </div>

                                {/* Security Score */}
                                <div className="card" style={{ padding: '28px', borderRadius: 18, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(99,102,241,0.02))' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                                        <SecurityScore score={securityScore} />
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Security Health</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {[
                                                    { label: 'Email Verified', done: !!user?.emailVerified, icon: <Mail size={13} /> },
                                                    { label: 'Strong Password', done: true, icon: <Lock size={13} /> },
                                                    { label: 'API Keys Secured', done: apiKeys.length > 0, icon: <Key size={13} /> },
                                                    { label: 'Pro Protection', done: isPro, icon: <Shield size={13} /> },
                                                ].map(item => (
                                                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                                        <div style={{ width: 18, height: 18, borderRadius: 5, background: item.done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {item.done ? <Check size={10} color="#10b981" /> : <X size={10} color="var(--text-disabled)" />}
                                                        </div>
                                                        <span style={{ color: item.done ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <RBACSettings />
                            </motion.div>
                        )}

                        {/* ══════════════ API TAB ══════════════ */}
                        {activeTab === 'api' && (
                            <motion.div key="api" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                                <PremiumGate feature="API Access" description="Integrate Nalyse with your applications using our powerful API." onUpgrade={() => setActiveTab('subscription')}>
                                    <div style={{ marginBottom: 32 }}>
                                        <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>API Keys</h2>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>Manage authentication keys for API access</p>
                                    </div>

                                    {/* Security notice */}
                                    <div className="card" style={{ padding: '18px 20px', borderRadius: 14, marginBottom: 24, borderLeft: '4px solid var(--primary)', display: 'flex', gap: 14, alignItems: 'center', border: '1px solid rgba(99,102,241,0.15)' }}>
                                        <Shield size={20} color="var(--primary)" />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Keep your keys secure</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>API keys grant full access. Never share them publicly or commit to version control.</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <div><h3 style={{ fontSize: 16, fontWeight: 700 }}>Secret Keys</h3><p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''} active</p></div>
                                        <button className="btn btn-primary btn-sm" onClick={handleGenerateKey} style={{ borderRadius: 10, gap: 6 }}><Plus size={14} /> Create Key</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {apiKeys.length === 0 ? (
                                            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
                                                <Key size={32} style={{ opacity: 0.3, marginBottom: 12 }} /><br />No API keys yet. Create one to get started.
                                            </div>
                                        ) : apiKeys.map((k, i) => (
                                            <div key={i} className="card" style={{ padding: '16px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}><Key size={18} /></div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>
                                                        {revealedKeys[i] ? k.key : (k.key ? `${k.key.substring(0, 10)}${'•'.repeat(20)}${k.key.slice(-6)}` : 'Invalid')}
                                                    </code>
                                                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Created {new Date(k.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: 8 }} onClick={() => setRevealedKeys(p => ({ ...p, [i]: !p[i] }))} title={revealedKeys[i] ? 'Hide' : 'Reveal'}>
                                                        {revealedKeys[i] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: 8 }} onClick={() => { navigator.clipboard.writeText(k.key); addToast('Copied', 'success'); }}><Copy size={14} /></button>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: 8, color: 'var(--danger)' }} onClick={() => handleRevokeKey(k.key)}><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </PremiumGate>
                            </motion.div>
                        )}

                        {/* ══════════════ NOTIFICATIONS TAB ══════════════ */}
                        {activeTab === 'notifications' && (
                            <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                                <div style={{ marginBottom: 32 }}>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>Notifications</h2>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>Choose what updates you receive</p>
                                </div>

                                <div className="card" style={{ padding: 0, borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    {NOTIFICATIONS.map((n, i) => (
                                        <div key={n.key} style={{
                                            display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
                                            borderBottom: i < NOTIFICATIONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                            transition: 'background 0.2s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${n.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: n.color, flexShrink: 0 }}>{n.icon}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{n.desc}</div>
                                            </div>
                                            <Toggle checked={!!notificationPrefs[n.key]} onChange={() => handleNotificationToggle(n.key)} color={n.color} />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ══════════════ SUBSCRIPTION TAB ══════════════ */}
                        {activeTab === 'subscription' && (
                            <motion.div key="subscription" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                                <PricingView onClose={() => setActiveTab('profile')} />
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};
