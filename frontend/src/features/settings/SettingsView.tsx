import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/Toast';
import { PricingView } from '../subscription/PricingView';
import { PremiumGate } from '../../components/subscription/PremiumGate';
import { ThemeStudio } from './ThemeStudio';

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
    Layout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
};

import { API_URL } from '../../config';

export const SettingsView = ({ onClose, onLogout, initialTab }: any) => {
    const { user, token, refreshProfile } = useAuth();
    const { addToast } = useToast();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'notifications' | 'subscription'>(
        initialTab || 'profile'
    );

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);
    const [theme, setTheme] = useState(() => {
        const userThemeKey = user?.id ? `theme-${user.id}` : 'theme';
        return localStorage.getItem(userThemeKey) || 'dark';
    });
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
        const userThemeKey = user?.id ? `theme-${user.id}` : 'theme';
        localStorage.setItem(userThemeKey, newTheme);
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
            addToast(t('settings.profile.updatedSuccess'), 'success');
        } catch (e) {
            console.error(e);
            addToast(t('settings.profile.saveFailed'), 'error');
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
                addToast(t('settings.profile.pictureUpdated'), 'success');
            }
        } catch (e) {
            addToast(t('settings.profile.pictureUploadFailed'), 'error');
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
            addToast(t('settings.api.created'), 'success');
        } catch (e) {
            console.error(e);
            addToast(t('settings.api.createFailed'), 'error');
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
            addToast(t('settings.api.revoked'), 'success');
        } catch (e) {
            console.error(e);
            addToast(t('settings.api.revokeFailed'), 'error');
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
        { id: 'profile', label: t('settings.tabs.account'), icon: <Icons.User /> },
        { id: 'subscription', label: t('settings.tabs.billing'), icon: <Icons.CreditCard /> },
        { id: 'api', label: t('settings.tabs.api'), icon: <Icons.Key /> },
        { id: 'notifications', label: t('settings.tabs.notifications'), icon: <Icons.Bell /> }
    ];

    const NOTIFICATION_CATEGORIES = [
        {
            title: t('settings.notifications.collab.title'),
            description: t('settings.notifications.collab.desc'),
            options: [
                { key: 'direct_messages', title: t('settings.notifications.collab.dm'), desc: t('settings.notifications.collab.dmDesc') },
                { key: 'mentions', title: t('settings.notifications.collab.mentions'), desc: t('settings.notifications.collab.mentionsDesc') },
                { key: 'thread_replies', title: t('settings.notifications.collab.threadReplies'), desc: t('settings.notifications.collab.threadRepliesDesc') }
            ]
        },
        {
            title: t('settings.notifications.analysis.title'),
            description: t('settings.notifications.analysis.desc'),
            options: [
                { key: 'analysis_complete', title: t('settings.notifications.analysis.complete'), desc: t('settings.notifications.analysis.completeDesc') },
                { key: 'automl_training', title: t('settings.notifications.analysis.automl'), desc: t('settings.notifications.analysis.automlDesc') },
                { key: 'anomaly_detected', title: t('settings.notifications.analysis.anomaly'), desc: t('settings.notifications.analysis.anomalyDesc') },
                { key: 'scheduled_reports', title: t('settings.notifications.analysis.scheduled'), desc: t('settings.notifications.analysis.scheduledDesc') }
            ]
        },
        {
            title: t('settings.notifications.data.title'),
            description: t('settings.notifications.data.desc'),
            options: [
                { key: 'sync_failure', title: t('settings.notifications.data.syncFailure'), desc: t('settings.notifications.data.syncFailureDesc') },
                { key: 'schema_change', title: t('settings.notifications.data.schemaChange'), desc: t('settings.notifications.data.schemaChangeDesc') },
                { key: 'pipeline_success', title: t('settings.notifications.data.pipelineSuccess'), desc: t('settings.notifications.data.pipelineSuccessDesc') }
            ]
        },
        {
            title: t('settings.notifications.security.title'),
            description: t('settings.notifications.security.desc'),
            options: [
                { key: 'new_logins', title: t('settings.notifications.security.newLogins'), desc: t('settings.notifications.security.newLoginsDesc') },
                { key: 'role_changes', title: t('settings.notifications.security.roleChanges'), desc: t('settings.notifications.security.roleChangesDesc') },
                { key: 'security', title: t('settings.notifications.security.alerts'), desc: t('settings.notifications.security.alertsDesc') },
                { key: 'updates', title: t('settings.notifications.security.updates'), desc: t('settings.notifications.security.updatesDesc') }
            ]
        }
    ];

    return (
        <div style={{ height: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="fade-in">

            {/* Top Bar */}
            <div style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-card)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <button onClick={onClose} className="btn btn-ghost btn-sm">
                            <Icons.ArrowLeft />
                            {t('settings.back')}
                        </button>
                        <div style={{ width: '1px', height: '24px', background: 'var(--border-default)' }}></div>
                        <h1 className="text-h2">{t('settings.title')}</h1>
                    </div>
                    <button onClick={onLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Icons.LogOut />
                        {t('settings.signOut')}
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
                                    <h3 className="text-h3" style={{ marginBottom: '24px' }}>{t('settings.profile.picture')}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Profile"
                                                style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement?.querySelector('.avatar-placeholder')?.setAttribute('style', 'display: flex; width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #ec4899); align-items: center; justify-content: center; font-size: 40px; font-weight: bold; color: var(--text-primary);');
                                                }}
                                            />
                                        ) : null}
                                        {(!avatarUrl || avatarUrl === '') && (
                                            <div className="avatar-placeholder" style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', color: 'white', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                                                {user?.email?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>{t('settings.profile.uploadPicture')}</button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                style={{ display: 'none' }}
                                                accept="image/png, image/jpeg, image/gif"
                                                onChange={handleAvatarUpload}
                                            />
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('settings.profile.pictureHint')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info */}
                                <div>
                                    <h3 className="text-h3" style={{ marginBottom: '24px' }}>{t('settings.profile.personalInfo')}</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{t('settings.profile.firstName')}</label>
                                            <input type="text" className="input" value={firstName} onChange={e => setFirstName(e.target.value)} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{t('settings.profile.lastName')}</label>
                                            <input type="text" className="input" value={lastName} onChange={e => setLastName(e.target.value)} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{t('settings.profile.email')}</label>
                                            <input type="email" className="input" value={user?.email || ''} disabled style={{ background: 'var(--bg-surface)', cursor: 'not-allowed' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{t('settings.profile.organization')}</label>
                                            <input type="text" className="input" value={user?.organization?.name || t('settings.profile.personalAccount')} disabled style={{ background: 'var(--bg-surface)', cursor: 'not-allowed' }} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{t('settings.profile.bio')}</label>
                                            <textarea className="input" style={{ height: '120px', resize: 'none', paddingTop: '10px' }} placeholder={t('settings.profile.bioPlaceholder')} value={bio} onChange={e => setBio(e.target.value)} maxLength={240} />
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>{bio.length} / 240</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
                                    <button className="btn btn-primary" style={{ padding: '0 32px' }} onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving ? t('settings.profile.saving') : t('settings.profile.saveChanges')}
                                    </button>
                                </div>
                            </div>

                            {/* Right Column - Appearance */}
                            <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
                                <h3 className="text-h3" style={{ marginBottom: '8px' }}>{t('settings.appearance.title')}</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>{t('settings.appearance.desc')}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[
                                        { id: 'light', label: t('settings.appearance.light'), desc: t('settings.appearance.lightDesc'), icon: <Icons.Sun />, accent: '#3b82f6' },
                                        { id: 'dark', label: t('settings.appearance.dark'), desc: t('settings.appearance.darkDesc'), icon: <Icons.Moon />, accent: '#60a5fa' },
                                        { id: 'midnight', label: t('settings.appearance.custom'), desc: t('settings.appearance.customDesc'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" /><circle cx="8.5" cy="7.5" r="2.5" /><circle cx="6.5" cy="12" r="2.5" /><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.82.49 3.53 1.34 5 .84 1.45 1.6 2.55 2.16 3.24.56.69 1.34 1.48 2.27 1.6.53.07 1.15-.04 1.73-.37.58-.34 1.08-.92 1.26-1.81.18-.87.06-1.72.06-2.16 0-.55.45-1 1-1s1 .45 1 1c0 .6.18 1.62.72 2.45.54.84 1.3 1.48 2.46 1.09" /></svg>, accent: '#f59e0b' },
                                        { id: 'system', label: t('settings.appearance.system'), desc: t('settings.appearance.systemDesc'), icon: <Icons.Monitor />, accent: '#64748b' }
                                    ].map(thm => (
                                        <button
                                            key={thm.id}
                                            onClick={() => handleThemeChange(thm.id)}
                                            className={`btn btn-secondary`}
                                            style={{
                                                justifyContent: 'flex-start',
                                                padding: '14px 16px',
                                                borderColor: theme === thm.id ? thm.accent : 'var(--border-default)',
                                                background: theme === thm.id ? `${thm.accent}10` : 'transparent',
                                                color: theme === thm.id ? thm.accent : 'var(--text-secondary)',
                                                boxShadow: theme === thm.id ? `0 0 20px ${thm.accent}15, inset 0 1px 0 ${thm.accent}10` : 'none',
                                                position: 'relative',
                                                overflow: 'hidden' as const,
                                            }}
                                        >
                                            {theme === thm.id && (
                                                <div style={{
                                                    position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px',
                                                    borderRadius: '0 4px 4px 0',
                                                    background: thm.accent,
                                                    boxShadow: `0 0 8px ${thm.accent}60`
                                                }} />
                                            )}
                                            <div style={{ color: 'inherit' }}>{thm.icon}</div>
                                            <div style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: theme === thm.id ? thm.accent : 'var(--text-primary)' }}>{thm.label}</span>
                                                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginTop: '1px' }}>{thm.desc}</span>
                                            </div>
                                            {theme === thm.id && (
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: thm.accent, boxShadow: `0 0 6px ${thm.accent}80` }}></div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Theme Studio — shown when Custom is active */}
                                {theme === 'midnight' && (
                                    <ThemeStudio addToast={addToast} />
                                )}
                            </div>
                        </div>
                    )}


                    {/* API Tab */}
                    {activeTab === 'api' && (
                        <PremiumGate
                            feature={t('settings.api.feature')}
                            description={t('settings.api.featureDesc')}
                            onUpgrade={() => setActiveTab('subscription')}
                        >
                            <div style={{ maxWidth: '900px' }} className="fade-in">
                                {/* Info Banner */}
                                <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', display: 'flex', gap: '12px', marginBottom: '32px' }}>
                                    <div style={{ color: 'var(--primary)', marginTop: '2px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Keep your keys secure</h4>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>API keys grant access to your account. Never share them publicly.</p>
                                    </div>
                                </div>

                                {/* Keys List */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <div>
                                            <h3 className="text-h3">{t('settings.api.secretKeys')}</h3>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('settings.api.manageAuth')}</p>
                                        </div>
                                        <button className="btn btn-primary" onClick={handleGenerateKey}>{t('settings.api.createNew')}</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {apiKeys.length === 0 ? (
                                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: '12px' }}>{t('settings.api.noKeys')}</div>
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
                                                        <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(keyObj.key); addToast(t('settings.api.copied'), 'success'); }}>{t('settings.api.copy')}</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleRevokeKey(keyObj.key)}>{t('settings.api.revoke')}</button>
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
                        <div style={{ maxWidth: '900px' }} className="fade-in">
                            <div style={{ marginBottom: '32px' }}>
                                <h3 className="text-h3">{t('settings.notifications.title')}</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>{t('settings.notifications.desc')}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {NOTIFICATION_CATEGORIES.map((category, catIdx) => (
                                    <div key={catIdx}>
                                        <div style={{ marginBottom: '16px' }}>
                                            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{category.title}</h4>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{category.description}</p>
                                        </div>

                                        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                                            {category.options.map((pref, i) => (
                                                <div key={pref.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: i < category.options.length - 1 ? '1px solid var(--border-default)' : 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                    <div style={{ flex: 1, paddingRight: '24px' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>{pref.title}</div>
                                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{pref.desc}</div>
                                                    </div>
                                                    <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!notificationPrefs[pref.key]}
                                                            onChange={() => handleNotificationToggle(pref.key)}
                                                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                                        />
                                                        <div style={{ width: '44px', height: '24px', background: notificationPrefs[pref.key] ? 'var(--primary)' : 'var(--border-default)', borderRadius: '12px', position: 'relative', transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                                            <div style={{ position: 'absolute', top: '2px', left: notificationPrefs[pref.key] ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}></div>
                                                        </div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
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
