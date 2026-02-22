{/* Right Side (Premium Enterprise Level) */ }
<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    {/* Network Telemetry */}
    <div className="desktop-only" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '6px 16px',
        background: 'linear-gradient(90deg, var(--bg-surface) 0%, transparent 100%)',
        border: '1px solid var(--border-subtle)',
        borderRight: 'none',
        borderRadius: '20px 0 0 20px',
    }}>
        <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connStatus === 'online' ? 'var(--success)' : 'var(--warning)',
                zIndex: 2
            }} />
            <div style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connStatus === 'online' ? 'var(--success)' : 'var(--warning)',
                opacity: 0.6,
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                zIndex: 1
            }} />
        </div>
        <span style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            letterSpacing: '0.05em',
        }}>{currentTime}</span>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-default)' }} />
        <span style={{
            fontSize: '9px',
            fontWeight: 900,
            color: connStatus === 'online' ? 'var(--success)' : 'var(--warning)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
        }}>{connStatus === 'online' ? 'SYS_NOMINAL' : 'SYS_SYNC'}</span>
    </div>

    {/* App Controls */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '12px', borderRight: '1px solid var(--border-subtle)' }}>
        {/* Language Switcher */}
        <div className="desktop-only" style={{
            display: 'flex',
            padding: '3px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            marginRight: '6px'
        }}>
            {['en', 'de'].map((lang) => (
                <button
                    key={lang}
                    onClick={() => setLanguage(lang as 'en' | 'de')}
                    style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        background: language === lang ? 'var(--bg-surface)' : 'transparent',
                        color: language === lang ? 'var(--primary)' : 'var(--text-muted)',
                        border: language === lang ? '1px solid var(--border-highlight)' : '1px solid transparent',
                        boxShadow: language === lang ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                    }}
                >
                    {lang.toUpperCase()}
                </button>
            ))}
        </div>

        {/* Notifications */}
        <button
            className="btn-icon"
            style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                position: 'relative',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.border = '1px solid var(--border-subtle)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.border = '1px solid transparent';
            }}
        >
            <Bell size={18} />
            <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--danger)',
                boxShadow: '0 0 0 2px var(--bg-header)',
            }} />
        </button>

        {/* Theme Toggle */}
        <button
            onClick={onThemeToggle}
            className="btn-icon"
            style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.border = '1px solid var(--border-subtle)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.border = '1px solid transparent';
            }}
        >
            <div style={{
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)',
                display: 'flex',
            }}>
                {theme === 'dark' ?
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                    :
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                }
            </div>
        </button>
    </div>

    {/* Identity Matrix (Profile) */}
    <div style={{ position: 'relative', marginLeft: '4px' }}>
        <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'transparent',
                border: '1px solid transparent',
                padding: '4px 12px 4px 4px',
                borderRadius: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.border = '1px solid var(--border-highlight)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.border = '1px solid transparent';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isPro
                    ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'
                    : 'var(--bg-secondary)',
                border: isPro ? '2px solid var(--bg-header)' : '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isPro ? 'white' : 'var(--text-primary)',
                fontWeight: 800,
                fontSize: '13px',
                overflow: 'hidden',
                boxShadow: isPro ? '0 0 0 2px rgba(168, 85, 247, 0.3)' : 'none',
            }}>
                {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <>{user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}</>
                )}
            </div>
            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {user?.firstName || 'User'}
                </span>
                {isPro ? (
                    <span style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        color: '#a855f7',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        lineHeight: 1,
                    }}>PRO <span style={{ opacity: 0.5 }}>PLAN</span></span>
                ) : (
                    <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        lineHeight: 1,
                    }}>Developer</span>
                )}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{
                    color: 'var(--text-muted)',
                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    marginLeft: '4px'
                }}>
                <polyline points="6 9 12 15 18 9" />
            </svg>
        </button>

        {/* Ultra-Premium Profile Menu */}
        {showUserMenu && (
            <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                background: 'var(--bg-card)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                border: '1px solid var(--border-highlight)',
                borderRadius: '20px',
                minWidth: '260px',
                zIndex: 1000,
                padding: '12px',
                boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)',
                animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transformOrigin: 'top right',
            }}>
                <div style={{
                    padding: '12px',
                    background: 'var(--bg-surface)',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Identity</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.email || 'admin@nalyse.com'}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                        onClick={() => { setShowUserMenu(false); onNavigate?.('settings'); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '8px 12px', borderRadius: '12px',
                            background: 'transparent', border: 'none',
                            color: 'var(--text-secondary)',
                            width: '100%', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-surface-hover)';
                            e.currentTarget.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>Profile Config</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Preferences</span>
                        </div>
                    </button>

                    <button
                        onClick={() => { setShowUserMenu(false); onNavigate?.('settings'); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '8px 12px', borderRadius: '12px',
                            background: 'transparent', border: 'none',
                            color: 'var(--text-secondary)',
                            width: '100%', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-surface-hover)';
                            e.currentTarget.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>App Settings</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>System properties</span>
                        </div>
                    </button>
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '12px 0' }} />

                <button
                    onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px', borderRadius: '12px',
                        background: 'transparent', border: 'none',
                        color: 'var(--danger)',
                        width: '100%', cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Terminate Session</span>
                </button>
            </div>
        )}
    </div>
</div>
            </header >

    { showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
{ showUserMenu && <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} /> }
<style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
};
