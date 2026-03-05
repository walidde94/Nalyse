import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PricingView } from '../subscription/PricingView';
import { PremiumGate } from '../../components/subscription/PremiumGate';

// Icons
const Icons = {
    User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Key: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>,
    Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
    ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    Moon: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
    Sun: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
    Monitor: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>,
    CreditCard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
};

import { API_URL } from '../../config';

export const SettingsView = ({ onClose, onLogout, initialTab }: any) => {
    const { user, token, refreshProfile } = useAuth();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'notifications' | 'subscription'>(initialTab || 'profile');

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [displayName, setDisplayName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [notificationPrefs, setNotificationPrefs] = useState<any>({});
    const [apiKeys, setApiKeys] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize state from user object
    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setBio(user.bio || '');
            setAvatarUrl(user.avatarUrl || '');
            setNotificationPrefs(user.notificationPreferences || {});
            // setApiKeys(user.apiKeys || []); // Don't rely on stale user object for sensitive keys
        }
    }, [user]);

    // Fetch keys fresh when tab opens
    useEffect(() => {
        if (activeTab === 'api' && token) {
            fetch(`${API_URL}/api/apikeys`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setApiKeys(data);
                })
                .catch(err => console.error(err));
        }
    }, [activeTab, token]);

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        window.dispatchEvent(new Event('theme-change'));
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    displayName,
                    firstName,
                    lastName,
                    bio
                })
            });

            if (!res.ok) throw new Error('Failed to update profile');

            await refreshProfile(); // Reload user context
            addToast('Profile updated successfully', 'success');
        } catch (e) {
            console.error(e);
            addToast('Failed to save changes', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Optimistic preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            setAvatarUrl(ev.target?.result as string); // Show local preview immediately
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await fetch(`${API_URL}/api/files/upload?type=avatar`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');

            const { file: newFile } = await uploadRes.json();
            const newAvatarUrl = `${API_URL}/uploads/${newFile.filename}`;

            // Update profile with new avatar URL
            const updateRes = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ avatarUrl: newAvatarUrl })
            });

            if (updateRes.ok) {
                await refreshProfile();
                addToast('Profile picture updated', 'success');
            }
        } catch (e) {
            addToast('Failed to upload picture', 'error');
        }
    };

    const handleGenerateKey = async () => {
        try {
            const res = await fetch(`${API_URL}/api/apikeys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: 'New API Key' })
            });

            if (!res.ok) throw new Error('Failed to create key');

            const newKey = await res.json();
            setApiKeys([...apiKeys, newKey]);

            // Optionally refresh full user context if needed, but local update is faster
            // await refreshToken(); 
            addToast('API Key created', 'success');
        } catch (e) {
            console.error(e);
            addToast('Failed to create key', 'error');
        }
    };

    const handleRevokeKey = async (keyToRevoke: string) => {
        try {
            const res = await fetch(`${API_URL}/api/apikeys/${keyToRevoke}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to revoke key');

            setApiKeys(apiKeys.filter(k => k.key !== keyToRevoke));

            // await refreshToken();
            addToast('API Key revoked', 'success');
        } catch (e) {
            console.error(e);
            addToast('Failed to revoke key', 'error');
        }
    };

    const handleNotificationToggle = async (key: string) => {
        const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
        setNotificationPrefs(newPrefs);

        try {
            await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ notificationPreferences: newPrefs })
            });
            await refreshProfile(); // Silent update
        } catch (e) {
            console.error('Failed to update prefs');
        }
    };

    const TABS = [
        { id: 'profile', label: 'Account', icon: <Icons.User /> },
        { id: 'subscription', label: 'Billing & Plans', icon: <Icons.CreditCard /> },
        { id: 'api', label: 'API Keys', icon: <Icons.Key /> },
        { id: 'notifications', label: 'Notifications', icon: <Icons.Bell /> }
    ];

    const NOTIFICATION_OPTIONS = [
        { key: 'analysis', title: 'Analysis Complete', desc: 'Get notified when your data analysis jobs finish.' },
        { key: 'digest', title: 'Weekly Digest', desc: 'Summary of your workspace activity every Monday.' },
        { key: 'security', title: 'Security Alerts', desc: 'Important notifications about account security.' },
        { key: 'updates', title: 'Product Updates', desc: 'News about new features and improvements.' }
    ];

    return (
        <div style={{ height: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="fade-in">

            {/* Top Bar */}
            <div style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-card)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <button onClick={onClose} className="btn btn-ghost btn-sm">
                            <Icons.ArrowLeft />
                            Back
                        </button>
                        <div style={{ width: '1px', height: '24px', background: 'var(--border-default)' }}></div>
                        <h1 className="text-h2">Settings</h1>
                    </div>
                    <button onClick={onLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Icons.LogOut />
                        Sign Out
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
                    <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-default)' }}>
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{
                                        borderRadius: 0,
                                        height: '48px',
                                        padding: '0 16px',
                                        background: 'transparent',
                                        borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                                        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                        boxShadow: 'none',
                                        transform: 'none'
                                    }}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px' }}>

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="fade-in">

                            {/* Left Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                                {/* Profile Picture */}
                                <div>
                                    <h3 className="text-h3" style={{ marginBottom: '24px' }}>Profile Picture</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Profile"
                                                style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement?.querySelector('.avatar-placeholder')?.setAttribute('style', 'display: flex; width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #ec4899); align-items: center; justify-content: center; font-size: 40px; font-weight: bold; color: white;');
                                                }}
                                            />
                                        ) : null}
                                        {(!avatarUrl || avatarUrl === '') && (
                                            <div className="avatar-placeholder" style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', color: 'white', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                                                {user?.email?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>Upload New Picture</button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                style={{ display: 'none' }}
                                                accept="image/png, image/jpeg, image/gif"
                                                onChange={handleAvatarUpload}
                                            />
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>JPG, GIF or PNG. Max 800KB</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info */}
                                <div>
                                    <h3 className="text-h3" style={{ marginBottom: '24px' }}>Personal Information</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>First Name</label>
                                            <input type="text" className="input" value={firstName} onChange={e => setFirstName(e.target.value)} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Last Name</label>
                                            <input type="text" className="input" value={lastName} onChange={e => setLastName(e.target.value)} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Email Address</label>
                                            <input type="email" className="input" value={user?.email || ''} disabled style={{ background: 'var(--bg-surface)', cursor: 'not-allowed' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Organization</label>
                                            <input type="text" className="input" value={user?.organization?.name || 'Personal Account'} disabled style={{ background: 'var(--bg-surface)', cursor: 'not-allowed' }} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Bio</label>
                                            <textarea className="input" style={{ height: '120px', resize: 'none', paddingTop: '10px' }} placeholder="Tell us about yourself..." value={bio} onChange={e => setBio(e.target.value)} maxLength={240} />
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>{bio.length} / 240</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
                                    <button className="btn btn-primary" style={{ padding: '0 32px' }} onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>

                            {/* Right Column - Appearance */}
                            <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
                                <h3 className="text-h3" style={{ marginBottom: '8px' }}>Appearance</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Customize how Nalyse looks</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[
                                        { id: 'light', label: 'Light', desc: 'Clean & crisp', icon: <Icons.Sun />, accent: '#3b82f6' },
                                        { id: 'dark', label: 'Dark', desc: 'Sleek & focused', icon: <Icons.Moon />, accent: '#60a5fa' },
                                        { id: 'midnight', label: 'Custom', desc: 'Your own palette', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" /><circle cx="8.5" cy="7.5" r="2.5" /><circle cx="6.5" cy="12" r="2.5" /><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.82.49 3.53 1.34 5 .84 1.45 1.6 2.55 2.16 3.24.56.69 1.34 1.48 2.27 1.6.53.07 1.15-.04 1.73-.37.58-.34 1.08-.92 1.26-1.81.18-.87.06-1.72.06-2.16 0-.55.45-1 1-1s1 .45 1 1c0 .6.18 1.62.72 2.45.54.84 1.3 1.48 2.46 1.09" /></svg>, accent: '#f59e0b' },
                                        { id: 'system', label: 'System', desc: 'Match your OS', icon: <Icons.Monitor />, accent: '#64748b' }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleThemeChange(t.id)}
                                            className={`btn btn-secondary`}
                                            style={{
                                                justifyContent: 'flex-start',
                                                padding: '14px 16px',
                                                borderColor: theme === t.id ? t.accent : 'var(--border-default)',
                                                background: theme === t.id ? `${t.accent}10` : 'transparent',
                                                color: theme === t.id ? t.accent : 'var(--text-secondary)',
                                                boxShadow: theme === t.id ? `0 0 20px ${t.accent}15, inset 0 1px 0 ${t.accent}10` : 'none',
                                                position: 'relative',
                                                overflow: 'hidden' as const,
                                            }}
                                        >
                                            {theme === t.id && (
                                                <div style={{
                                                    position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px',
                                                    borderRadius: '0 4px 4px 0',
                                                    background: t.accent,
                                                    boxShadow: `0 0 8px ${t.accent}60`
                                                }} />
                                            )}
                                            <div style={{ color: 'inherit' }}>{t.icon}</div>
                                            <div style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: theme === t.id ? t.accent : 'var(--text-primary)' }}>{t.label}</span>
                                                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginTop: '1px' }}>{t.desc}</span>
                                            </div>
                                            {theme === t.id && (
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.accent, boxShadow: `0 0 6px ${t.accent}80` }}></div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Theme Editor — shown when Custom is active */}
                                {theme === 'midnight' && (() => {
                                    const presets = [
                                        { name: 'Sahara', primary: '#f59e0b', accent: '#ea580c', bgMain: '#0d0a04', textPrimary: '#fef3c7' },
                                        { name: 'Nebula', primary: '#a855f7', accent: '#e879f9', bgMain: '#080412', textPrimary: '#f3f0ff' },
                                        { name: 'Ocean', primary: '#0ea5e9', accent: '#06b6d4', bgMain: '#020c14', textPrimary: '#e0f2fe' },
                                        { name: 'Forest', primary: '#22c55e', accent: '#10b981', bgMain: '#030d06', textPrimary: '#dcfce7' },
                                        { name: 'Rose', primary: '#f43f5e', accent: '#ec4899', bgMain: '#14040a', textPrimary: '#ffe4e6' },
                                        { name: 'Arctic', primary: '#6366f1', accent: '#818cf8', bgMain: '#040412', textPrimary: '#e0e7ff' },
                                        { name: 'Crimson', primary: '#dc2626', accent: '#f97316', bgMain: '#0c0202', textPrimary: '#fef2f2' },
                                        { name: 'Sunset', primary: '#f97316', accent: '#eab308', bgMain: '#0f0802', textPrimary: '#fff7ed' },
                                        { name: 'Midnight', primary: '#3b82f6', accent: '#8b5cf6', bgMain: '#020617', textPrimary: '#dbeafe' },
                                    ];

                                    const saved = JSON.parse(localStorage.getItem('custom-theme-colors') || '{}');
                                    const currentPrimary = saved.primary || '#f59e0b';
                                    const currentAccent = saved.accent || '#ea580c';
                                    const currentBg = saved.bgMain || '#0d0a04';
                                    const currentText = saved.textPrimary || '#fef3c7';
                                    const currentGlow = saved.glowIntensity ?? 50;
                                    const currentBlur = saved.blurAmount ?? 28;

                                    const applyCustomColors = (colors: any) => {
                                        const merged = { ...saved, ...colors };
                                        localStorage.setItem('custom-theme-colors', JSON.stringify(merged));
                                        window.dispatchEvent(new Event('theme-change'));
                                        // Force re-apply
                                        const ev = new CustomEvent('force-theme-reapply');
                                        window.dispatchEvent(ev);
                                    };

                                    const handleExport = () => {
                                        const data = btoa(JSON.stringify(saved));
                                        navigator.clipboard.writeText(data);
                                        addToast('Theme code copied to clipboard!', 'success');
                                    };

                                    const handleImport = () => {
                                        const code = prompt('Paste your theme code:');
                                        if (code) {
                                            try {
                                                const data = JSON.parse(atob(code));
                                                applyCustomColors(data);
                                                addToast('Theme imported successfully!', 'success');
                                            } catch { addToast('Invalid theme code', 'error'); }
                                        }
                                    };

                                    return (
                                        <div style={{ marginTop: '20px' }}>
                                            {/* Section: Presets */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                                                    Color Palettes
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                                    {presets.map(preset => {
                                                        const isActive = currentPrimary === preset.primary && currentBg === preset.bgMain;
                                                        return (
                                                            <button
                                                                key={preset.name}
                                                                onClick={() => applyCustomColors(preset)}
                                                                className="btn"
                                                                style={{
                                                                    padding: '0',
                                                                    borderRadius: '10px',
                                                                    border: `1.5px solid ${isActive ? preset.primary : 'var(--border-subtle)'}`,
                                                                    background: 'transparent',
                                                                    overflow: 'hidden',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                                                                    position: 'relative',
                                                                    boxShadow: isActive ? `0 0 16px ${preset.primary}30, inset 0 0 20px ${preset.primary}08` : 'none',
                                                                }}
                                                            >
                                                                {/* Gradient preview bar */}
                                                                <div style={{
                                                                    height: '28px',
                                                                    background: `linear-gradient(135deg, ${preset.bgMain} 0%, ${preset.bgMain} 30%, ${preset.primary}30 70%, ${preset.accent}25 100%)`,
                                                                    position: 'relative',
                                                                    overflow: 'hidden',
                                                                }}>
                                                                    {/* Mini UI preview dots */}
                                                                    <div style={{ position: 'absolute', top: '8px', left: '6px', display: 'flex', gap: '3px' }}>
                                                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: preset.primary, opacity: 0.9 }} />
                                                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: preset.accent, opacity: 0.7 }} />
                                                                    </div>
                                                                    <div style={{ position: 'absolute', top: '7px', right: '6px', height: '6px', width: '20px', borderRadius: '3px', background: `linear-gradient(90deg, ${preset.primary}, ${preset.accent})` }} />
                                                                    {/* Shimmer line */}
                                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${preset.primary}40, transparent)` }} />
                                                                </div>
                                                                {/* Name */}
                                                                <div style={{
                                                                    padding: '5px 0',
                                                                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                                                                    color: isActive ? preset.primary : 'var(--text-secondary)',
                                                                    background: isActive ? `${preset.primary}08` : 'var(--bg-surface)',
                                                                }}>
                                                                    {preset.name}
                                                                </div>
                                                                {isActive && (
                                                                    <div style={{ position: 'absolute', top: '3px', right: '3px', width: '5px', height: '5px', borderRadius: '50%', background: preset.primary, boxShadow: `0 0 4px ${preset.primary}` }} />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Section: Fine Tune */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>
                                                    Fine Tune
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    {[
                                                        { key: 'primary', label: 'Primary', value: currentPrimary },
                                                        { key: 'accent', label: 'Accent', value: currentAccent },
                                                        { key: 'bgMain', label: 'Background', value: currentBg },
                                                        { key: 'textPrimary', label: 'Text', value: currentText },
                                                    ].map(item => (
                                                        <label key={item.key} style={{
                                                            display: 'flex', alignItems: 'center', gap: '8px',
                                                            padding: '6px 8px', borderRadius: '8px',
                                                            background: 'var(--bg-surface)',
                                                            border: '1px solid var(--border-subtle)',
                                                            cursor: 'pointer',
                                                            transition: 'border-color 0.2s',
                                                        }}>
                                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                                <div style={{
                                                                    width: '24px', height: '24px', borderRadius: '6px',
                                                                    background: item.value,
                                                                    border: '2px solid var(--border-subtle)',
                                                                    boxShadow: `0 0 8px ${item.value}30`,
                                                                }} />
                                                                <input
                                                                    type="color"
                                                                    value={item.value}
                                                                    onChange={(e) => applyCustomColors({ [item.key]: e.target.value })}
                                                                    style={{
                                                                        position: 'absolute', inset: 0,
                                                                        opacity: 0, cursor: 'pointer',
                                                                        width: '100%', height: '100%',
                                                                    }}
                                                                />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                                                                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.value}</span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Section: Atmosphere Controls */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" /></svg>
                                                    Atmosphere
                                                </div>
                                                {[
                                                    { key: 'glowIntensity', label: 'Glow Intensity', value: currentGlow, min: 10, max: 100, icon: '✦' },
                                                    { key: 'blurAmount', label: 'Glass Blur', value: currentBlur, min: 8, max: 48, icon: '◉' },
                                                ].map(slider => (
                                                    <div key={slider.key} style={{ marginBottom: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{slider.icon} {slider.label}</span>
                                                            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: currentPrimary, fontWeight: 700 }}>{slider.value}{slider.key === 'blurAmount' ? 'px' : '%'}</span>
                                                        </div>
                                                        <div style={{ position: 'relative', height: '6px', borderRadius: '3px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                                                            <div style={{
                                                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                                                width: `${((slider.value - slider.min) / (slider.max - slider.min)) * 100}%`,
                                                                borderRadius: '3px',
                                                                background: `linear-gradient(90deg, ${currentPrimary}, ${currentAccent})`,
                                                                boxShadow: `0 0 8px ${currentPrimary}40`,
                                                                transition: 'width 0.15s ease',
                                                            }} />
                                                            <input
                                                                type="range"
                                                                min={slider.min}
                                                                max={slider.max}
                                                                value={slider.value}
                                                                onChange={(e) => applyCustomColors({ [slider.key]: parseInt(e.target.value) })}
                                                                style={{
                                                                    position: 'absolute', inset: '-4px 0', width: '100%', height: '14px',
                                                                    opacity: 0, cursor: 'pointer', margin: 0,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Live Preview — Mini Dashboard */}
                                            <div style={{ marginBottom: '20px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                                                    Live Preview
                                                </div>
                                                <div style={{
                                                    borderRadius: '10px', overflow: 'hidden',
                                                    border: `1px solid ${currentPrimary}20`,
                                                    background: currentBg,
                                                    position: 'relative',
                                                }}>
                                                    {/* Mini aurora */}
                                                    <div style={{
                                                        position: 'absolute', inset: 0, pointerEvents: 'none',
                                                        background: `radial-gradient(ellipse 70% 50% at 20% 30%, ${currentPrimary}18 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, ${currentAccent}10 0%, transparent 50%)`,
                                                    }} />
                                                    {/* Mini header */}
                                                    <div style={{
                                                        padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px',
                                                        borderBottom: `1px solid ${currentPrimary}15`,
                                                        background: `${currentBg}dd`,
                                                        position: 'relative',
                                                    }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: `linear-gradient(135deg, ${currentPrimary}, ${currentAccent})` }} />
                                                        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: currentText, opacity: 0.7 }} />
                                                        <div style={{ flex: 1 }} />
                                                        <div style={{ width: '50px', height: '4px', borderRadius: '2px', background: `${currentPrimary}30` }} />
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentPrimary, boxShadow: `0 0 6px ${currentPrimary}60` }} />
                                                        {/* Energy border */}
                                                        <div style={{ position: 'absolute', bottom: 0, left: '20%', width: '30%', height: '1px', background: `linear-gradient(90deg, transparent, ${currentPrimary}, ${currentAccent}, transparent)` }} />
                                                    </div>
                                                    {/* Mini body */}
                                                    <div style={{ display: 'flex', padding: 0, position: 'relative' }}>
                                                        {/* Mini sidebar */}
                                                        <div style={{
                                                            width: '32px', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center',
                                                            borderRight: `1px solid ${currentPrimary}12`,
                                                            background: `${currentBg}f0`,
                                                        }}>
                                                            {[0.5, 0.3, 0.3, 0.3].map((o, i) => (
                                                                <div key={i} style={{ width: '12px', height: '3px', borderRadius: '1.5px', background: i === 0 ? currentPrimary : `${currentText}${Math.round(o * 100).toString(16).padStart(2, '0')}`, transition: 'background 0.3s' }} />
                                                            ))}
                                                        </div>
                                                        {/* Mini content */}
                                                        <div style={{ flex: 1, padding: '8px', display: 'flex', gap: '6px' }}>
                                                            {/* Card 1 */}
                                                            <div style={{
                                                                flex: 1, padding: '6px', borderRadius: '5px',
                                                                border: `1px solid ${currentPrimary}15`,
                                                                background: `${currentBg}88`,
                                                            }}>
                                                                <div style={{ width: '20px', height: '3px', borderRadius: '1.5px', background: currentText, opacity: 0.6, marginBottom: '4px' }} />
                                                                <div style={{ width: '100%', height: '3px', borderRadius: '1.5px', background: `${currentText}20`, marginBottom: '2px' }} />
                                                                <div style={{ width: '70%', height: '3px', borderRadius: '1.5px', background: `${currentText}15` }} />
                                                                <div style={{ marginTop: '6px', display: 'flex', gap: '3px' }}>
                                                                    <div style={{ padding: '2px 6px', borderRadius: '3px', background: `linear-gradient(135deg, ${currentPrimary}, ${currentAccent})`, width: '16px', height: '4px' }} />
                                                                    <div style={{ padding: '2px 6px', borderRadius: '3px', background: `${currentPrimary}20`, border: `1px solid ${currentPrimary}20`, width: '16px', height: '4px' }} />
                                                                </div>
                                                            </div>
                                                            {/* Card 2 */}
                                                            <div style={{
                                                                flex: 1, padding: '6px', borderRadius: '5px',
                                                                border: `1px solid ${currentPrimary}15`,
                                                                background: `${currentBg}88`,
                                                            }}>
                                                                <div style={{ width: '16px', height: '3px', borderRadius: '1.5px', background: currentPrimary, opacity: 0.8, marginBottom: '4px' }} />
                                                                <div style={{ width: '100%', height: '3px', borderRadius: '1.5px', background: `${currentText}20`, marginBottom: '2px' }} />
                                                                <div style={{ width: '50%', height: '3px', borderRadius: '1.5px', background: `${currentText}15` }} />
                                                                <div style={{ marginTop: '4px', height: '8px', borderRadius: '2px', background: `linear-gradient(90deg, ${currentPrimary}30, ${currentAccent}20)` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Theme Sharing */}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={handleExport} className="btn btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                                                    Export Theme
                                                </button>
                                                <button onClick={handleImport} className="btn btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                    Import Theme
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* API Tab */}
                    {activeTab === 'api' && (
                        <PremiumGate
                            feature="API Access"
                            description="Integrate Nalyse with your own applications and automate your data workflows with our robust API."
                            onUpgrade={() => setActiveTab('subscription')}
                        >
                            <div style={{ maxWidth: '900px' }} className="fade-in">
                                {/* Info Banner */}
                                <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', display: 'flex', gap: '12px', marginBottom: '32px' }}>
                                    <div style={{ color: 'var(--primary)', marginTop: '2px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 500, color: 'white', marginBottom: '4px' }}>Keep your keys secure</h4>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>API keys grant access to your account. Never share them publicly.</p>
                                    </div>
                                </div>

                                {/* Keys List */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <div>
                                            <h3 className="text-h3">Secret Keys</h3>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Manage API authentication</p>
                                        </div>
                                        <button className="btn btn-primary" onClick={handleGenerateKey}>+ Create New Key</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {apiKeys.length === 0 ? (
                                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: '12px' }}>No API keys found. Create one to get started.</div>
                                        ) : (
                                            apiKeys.map((keyObj, i) => (
                                                <div key={i} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                                            <Icons.Key />
                                                        </div>
                                                        <div>
                                                            <code style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-primary)' }}>
                                                                {keyObj.key ? (keyObj.key.substring(0, 14) + '...' + keyObj.key.substring(keyObj.key.length - 8)) : 'Invalid Key'}
                                                            </code>
                                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Created {new Date(keyObj.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(keyObj.key); addToast('Copied to clipboard', 'success'); }}>Copy</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleRevokeKey(keyObj.key)}>Revoke</button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </PremiumGate>
                    )}

                    {activeTab === 'notifications' && (
                        <div style={{ maxWidth: '800px' }} className="fade-in">
                            <div style={{ marginBottom: '24px' }}>
                                <h3 className="text-h3">Email Notifications</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Choose what updates you want to receive</p>
                            </div>

                            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                                {NOTIFICATION_OPTIONS.map((pref, i) => (
                                    <div key={pref.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: i < NOTIFICATION_OPTIONS.length - 1 ? '1px solid var(--border-default)' : 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>{pref.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{pref.desc}</div>
                                        </div>
                                        <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '24px' }}>
                                            <input
                                                type="checkbox"
                                                checked={!!notificationPrefs[pref.key]}
                                                onChange={() => handleNotificationToggle(pref.key)}
                                                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                            />
                                            <div style={{ width: '44px', height: '24px', background: notificationPrefs[pref.key] ? 'var(--primary)' : 'var(--border-default)', borderRadius: '12px', position: 'relative', transition: 'background 0.2s' }}>
                                                <div style={{ position: 'absolute', top: '2px', left: notificationPrefs[pref.key] ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }}></div>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === 'subscription' && (
                        <div className="fade-in">
                            <PricingView onClose={() => setActiveTab('profile')} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
