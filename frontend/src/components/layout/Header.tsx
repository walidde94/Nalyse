import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserProfile } from '../UserProfile';

interface HeaderProps {
    theme: 'dark' | 'light';
    onThemeToggle: () => void;
    onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle, onMenuToggle }) => {
    const { user } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const [showProfile, setShowProfile] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // SM-01: Dynamic Greeting logic
    const greeting = React.useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return t('header.goodMorning') || 'Good morning';
        if (hour < 18) return t('header.goodAfternoon') || 'Good afternoon';
        return t('header.goodEvening') || 'Good evening';
    }, [t]);

    // SM-02: Connectivity Status (Simulated for UI detail)
    const [connStatus] = useState<'online' | 'offline' | 'syncing'>('online');

    return (
        <>
            <header
                className="sticky-glass inner-highlight"
                style={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    background: 'var(--bg-header)',
                    borderBottom: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >
                <div className="left-section" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        className="mobile-only btn btn-icon btn-ghost"
                        onClick={onMenuToggle}
                        style={{ padding: '8px' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <div className="magnetic-wrap" style={{ display: 'flex', alignItems: 'center' }}>
                        <Logo />
                        <div className="desktop-only" style={{ marginLeft: '12px', display: 'flex', flexDirection: 'column' }}>
                            <span className="tech-text" style={{ fontSize: '9px', opacity: 0.5 }}>Nexus Enterprise</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {greeting}, <span style={{ color: 'var(--text-primary)' }}>{user?.firstName}</span>
                            </span>
                        </div>
                    </div>

                    <div id="tour-nexus-ai" className="search-bar desktop-only" style={{ position: 'relative', width: '380px', display: 'flex', alignItems: 'center' }}>
                        <Search
                            size={16}
                            style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
                        />
                        <input
                            type="text"
                            placeholder="Ask Nexus AI: How is our revenue pacing?"
                            style={{
                                width: '100%',
                                padding: '10px 16px 10px 40px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-default)',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            right: '10px',
                            padding: '2px 6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--text-tertiary)'
                        }}>
                            ⌘ K
                        </div>
                    </div>
                </div>

                {/* Right Side Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* SM-03: Connectivity Indicator */}
                    <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                            <div className={`w-2 h-2 rounded-full ${connStatus === 'online' ? 'bg-[var(--success)] pulse-success' : 'bg-[var(--warning)]'}`}></div>
                            <span className="tech-text" style={{ fontSize: '9px' }}>API {connStatus.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Language Switcher */}
                    <div className="desktop-only" style={{ display: 'flex' }}>
                        <div className="flex p-0.5 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg shadow-inner">
                            {['en', 'de'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setLanguage(lang as 'en' | 'de')}
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: language === lang ? 'var(--primary)' : 'transparent',
                                        color: language === lang ? 'white' : 'var(--text-secondary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <span>{lang.toUpperCase()}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="desktop-only" style={{ width: '1px', height: '28px', background: 'var(--border-default)', opacity: 0.6 }}></div>

                    {/* Theme Toggle */}
                    <button
                        onClick={onThemeToggle}
                        className="btn btn-icon btn-ghost"
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        {theme === 'dark' ?
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                            :
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                        }
                    </button>

                    {/* Profile Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="btn btn-ghost h-auto py-1 pl-1 pr-2 gap-3 rounded-xl hover:bg-[var(--bg-surface-hover)]"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-default)',
                                padding: '4px 10px 4px 4px'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '13px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                overflow: 'hidden'
                            }}>
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
                                )}
                            </div>
                            <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {user?.firstName}
                                </span>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </button>

                        {showUserMenu && (
                            <div className="fade-in shadow-lg" style={{
                                position: 'absolute',
                                top: 'calc(100% + 12px)',
                                right: 0,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-default)',
                                borderRadius: '12px',
                                minWidth: '220px',
                                overflow: 'hidden',
                                zIndex: 1000,
                                padding: '6px'
                            }}>
                                <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{t('header.signedInAs')}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.email}</div>
                                </div>

                                <button
                                    onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                                    className="btn btn-ghost w-full"
                                    style={{ justifyContent: 'flex-start', padding: '10px 12px', borderRadius: '8px' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    <span style={{ fontSize: '13px' }}>{t('header.profile')}</span>
                                </button>

                                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }}></div>

                                <button
                                    onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                                    className="btn btn-ghost w-full"
                                    style={{ justifyContent: 'flex-start', padding: '10px 12px', color: 'var(--danger)', borderRadius: '8px' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                    <span style={{ fontSize: '13px' }}>{t('header.logout')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
            {showUserMenu && <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
        </>
    );
};
