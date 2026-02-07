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
                                <h3 className="text-h3" style={{ marginBottom: '16px' }}>Appearance</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Customize how Nalyse looks</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { id: 'light', label: 'Light', icon: <Icons.Sun /> },
                                        { id: 'dark', label: 'Dark', icon: <Icons.Moon /> },
                                        { id: 'system', label: 'System', icon: <Icons.Monitor /> }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleThemeChange(t.id)}
                                            className={`btn btn-secondary`}
                                            style={{
                                                justifyContent: 'flex-start',
                                                padding: '12px 16px',
                                                borderColor: theme === t.id ? 'var(--primary)' : 'var(--border-default)',
                                                background: theme === t.id ? 'var(--bg-surface)' : 'transparent',
                                                color: theme === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                                            }}
                                        >
                                            <div style={{ color: 'inherit' }}>{t.icon}</div>
                                            <span style={{ fontSize: '14px', fontWeight: 500, flex: 1, textAlign: 'left' }}>{t.label}</span>
                                            {theme === t.id && (
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
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
