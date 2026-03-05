import React, { useState, useEffect } from 'react';
import { Logo } from '../common/Logo';
import { Search, Bell, Sparkles, Command, Activity, Hexagon, Terminal, Radio, Shield, Settings, LogOut, Zap, Fingerprint } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserProfile } from '../UserProfile';

interface HeaderProps {
    theme: 'dark' | 'light' | 'midnight';
    onThemeToggle: () => void;
    onMenuToggle?: () => void;
    onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle, onMenuToggle, onNavigate }) => {
    const { user } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const [showProfile, setShowProfile] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [pulseTrack, setPulseTrack] = useState<number[]>([10, 25, 15, 30, 20, 35, 25, 40]);
    const isDark = theme === 'dark' || theme === 'midnight';
    const isMidnight = theme === 'midnight';

    // Read dynamic custom theme colors for inline styles
    const customPrimary = isMidnight ? (getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#f59e0b') : '';
    const customAccent = isMidnight ? (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ea580c') : '';

    // Live clock
    useEffect(() => {
        const update = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, second: '2-digit' }));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    // Simulated telemetry pulse
    useEffect(() => {
        const interval = setInterval(() => {
            setPulseTrack(prev => [...prev.slice(1), Math.random() * 30 + 10]);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    const greeting = React.useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return t('header.goodMorning') || 'Initialization: Morning Phase';
        if (hour < 18) return t('header.goodAfternoon') || 'Cycle Active: Afternoon';
        return t('header.goodEvening') || 'Night Protocol Engaged';
    }, [t]);

    const [connStatus] = useState<'online' | 'offline' | 'syncing'>('online');
    const isPro = (user as any)?.organization?.plan === 'pro' || (user as any)?.plan === 'pro';

    return (
        <>
            <header className="nexus-header" style={{
                height: '76px', // Slightly taller for a grander feel
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: isMidnight
                    ? 'linear-gradient(180deg, rgba(14, 10, 4, 0.97) 0%, rgba(10, 8, 3, 0.85) 100%)'
                    : isDark
                        ? 'linear-gradient(180deg, rgba(5, 5, 10, 0.95) 0%, rgba(5, 5, 10, 0.7) 100%)'
                        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%)',
                backdropFilter: isMidnight ? 'blur(40px) saturate(220%)' : 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: isMidnight ? 'blur(40px) saturate(220%)' : 'blur(32px) saturate(200%)',
                boxShadow: isMidnight
                    ? `0 10px 50px -10px ${customPrimary}30, 0 1px 0 ${customPrimary}15`
                    : isDark
                        ? '0 10px 40px -10px rgba(0,0,0,0.5)'
                        : '0 10px 40px -10px rgba(0,0,0,0.1)',
            }}>
                {/* 
                  FUTURISTIC ENERGY BORDER 
                  An animated conduit line running at the bottom of the header
                */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: isMidnight ? '2px' : '1px',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: isMidnight ? '40%' : '30%',
                        background: isMidnight
                            ? `linear-gradient(90deg, transparent, ${customPrimary}, ${customAccent}, ${customPrimary}, transparent)`
                            : 'linear-gradient(90deg, transparent, #38bdf8, #818cf8, #e879f9, transparent)',
                        filter: isMidnight ? 'blur(2px)' : 'blur(1px)',
                        opacity: isMidnight ? 1 : 0.8,
                        animation: isMidnight ? 'energy-flow 3s linear infinite' : 'energy-flow 4s linear infinite'
                    }} />
                </div>

                {/* Left: Logo + App Context */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                    <button
                        className="mobile-only btn-ghost"
                        onClick={onMenuToggle}
                        style={{ padding: '8px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)', background: 'transparent', border: 'none' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
                        {/* Glowing Logo Wrap */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                position: 'absolute', inset: '-8px', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
                                borderRadius: '50%', filter: 'blur(8px)', opacity: 0.6
                            }} />
                            <Logo />
                        </div>

                        <div className="desktop-only" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                            paddingLeft: '16px',
                            height: '36px'
                        }}>
                            <span style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                background: 'linear-gradient(90deg, #94a3b8, #475569)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '2px',
                                textShadow: isDark ? '0 0 10px rgba(148, 163, 184, 0.2)' : 'none'
                            }}>Synthesis Engine</span>
                            <span style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span>{greeting.includes('header.') ? t('header.welcome') : greeting}</span>
                                <span style={{
                                    color: isDark ? '#fff' : '#0f172a',
                                    fontWeight: 700,
                                    textShadow: isDark ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
                                }}>{user?.firstName}</span>
                            </span>
                        </div>
                    </div>

                    {/* Highly Advanced Neural Command Prompt */}
                    <div id="tour-nexus-ai" className="desktop-only" style={{
                        position: 'relative',
                        width: '460px',
                        marginLeft: '24px',
                    }}>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            transform: searchFocused ? 'scale(1.01) translateY(-1px)' : 'scale(1)',
                        }}>
                            {/* Halo Effect */}
                            {searchFocused && (
                                <div style={{
                                    position: 'absolute',
                                    inset: '-2px',
                                    background: 'linear-gradient(90deg, #6366f1, #ec4899, #8b5cf6)',
                                    borderRadius: '14px',
                                    filter: 'blur(10px)',
                                    opacity: 0.4,
                                    animation: 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }} />
                            )}

                            {/* Inner Box */}
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                background: searchFocused ? (isDark ? 'rgba(15, 15, 25, 0.9)' : '#fff') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                                border: `1px solid ${searchFocused ? 'rgba(99, 102, 241, 0.5)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: searchFocused ? 'inset 0 0 20px rgba(99, 102, 241, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 12px',
                                    color: searchFocused ? '#a855f7' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)'),
                                    transition: 'color 0.3s'
                                }}>
                                    {searchFocused ? <Sparkles size={16} className="sparkle-spin" /> : <Terminal size={16} />}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter natural language query or system command..."
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    style={{
                                        width: '100%',
                                        padding: '11px 0',
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: isDark ? '#fff' : '#0f172a',
                                        outline: 'none',
                                        letterSpacing: '0.02em',
                                    }}
                                />
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 10px',
                                    gap: '6px'
                                }}>
                                    {!searchFocused && (
                                        <div style={{
                                            padding: '4px 8px',
                                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}>
                                            <Command size={10} />K
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side (Ultra-Premium Enterprise Telemetry) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                    {/* Living Telemetry Panel */}
                    <div className="desktop-only" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '6px 14px',
                        background: isMidnight ? `${customPrimary}10` : isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                        border: `1px solid ${isMidnight ? `${customPrimary}20` : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.05)'}`,
                        borderRadius: '24px',
                        boxShadow: isMidnight ? `inset 0 1px 3px rgba(10,5,0,0.3), 0 0 12px ${customPrimary}10` : isDark ? 'inset 0 1px 3px rgba(0,0,0,0.3), 0 0 10px rgba(16, 185, 129, 0.05)' : 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '14px', gap: '2px', opacity: 0.8 }}>
                            {pulseTrack.map((val, idx) => (
                                <div key={idx} style={{
                                    width: '3px',
                                    height: `${val}%`,
                                    background: isMidnight ? (connStatus === 'online' ? customPrimary : '#fbbf24') : (connStatus === 'online' ? '#10b981' : '#f59e0b'),
                                    borderRadius: '2px',
                                    transition: 'height 0.3s ease'
                                }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: 'var(--font-mono)',
                                color: isDark ? 'rgba(255,255,255,0.8)' : '#0f172a',
                                letterSpacing: '0.05em',
                                lineHeight: 1
                            }}>{currentTime}</span>
                            <span style={{
                                fontSize: '8px',
                                fontWeight: 900,
                                color: isMidnight ? (connStatus === 'online' ? customPrimary : '#fbbf24') : (connStatus === 'online' ? '#10b981' : '#f59e0b'),
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                marginTop: '2px',
                                textShadow: isMidnight ? (connStatus === 'online' ? `0 0 10px ${customPrimary}80` : 'none') : (connStatus === 'online' && isDark) ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
                            }}>{connStatus === 'online' ? 'SYS_NOMINAL' : 'SYS_SYNC'}</span>
                        </div>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: isMidnight ? `${customPrimary}25` : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

                    {/* App Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Holographic Language Switcher */}
                        <div className="desktop-only" style={{
                            display: 'flex',
                            padding: '3px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                            borderRadius: '12px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                        }}>
                            {['en', 'de'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setLanguage(lang as 'en' | 'de')}
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        padding: '5px 10px',
                                        borderRadius: '8px',
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                        background: language === lang ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                        color: language === lang ? (isDark ? '#fff' : '#0f172a') : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'),
                                        boxShadow: language === lang ? (isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.05)') : 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>

                        {/* Notifications with Orbital Glow */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className="nexus-icon-btn"
                                onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                            >
                                <Bell size={18} />
                                <div style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '8px',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#f43f5e',
                                    boxShadow: '0 0 10px #f43f5e',
                                }} />
                                {/* Scanning orbit effect for notifications */}
                                <div style={{
                                    position: 'absolute',
                                    inset: '-2px',
                                    border: '1px solid rgba(244, 63, 94, 0.3)',
                                    borderRadius: '12px',
                                    borderTopColor: 'transparent',
                                    borderBottomColor: 'transparent',
                                    animation: 'spin 4s linear infinite',
                                    pointerEvents: 'none'
                                }} />
                            </button>

                            {/* Notifications Dropdown - Cinematic Glassmorphism */}
                            {showNotifications && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 16px)',
                                    right: '-40px',
                                    background: isDark ? 'rgba(10, 10, 16, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(40px) saturate(200%)',
                                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                    borderRadius: '24px',
                                    minWidth: '340px',
                                    zIndex: 1000,
                                    padding: '20px',
                                    boxShadow: isDark ? '0 30px 60px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' : '0 30px 60px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                                    animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    transformOrigin: 'top right',
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: isDark ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)' }} />

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Radio size={16} color="#38bdf8" />
                                            <h3 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: isDark ? '#fff' : '#0f172a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>System Intercepts</h3>
                                        </div>
                                        <button style={{
                                            background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8',
                                            fontSize: '10px', fontWeight: 800, cursor: 'pointer', padding: '4px 10px',
                                            borderRadius: '8px', textTransform: 'uppercase', transition: 'all 0.2s', letterSpacing: '0.05em'
                                        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}>Acknowledge</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{
                                            display: 'flex', gap: '14px', padding: '14px', borderRadius: '16px',
                                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                            position: 'relative', overflow: 'hidden'
                                        }}>
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)',
                                                color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                border: '1px solid rgba(59, 130, 246, 0.3)'
                                            }}>
                                                <Zap size={18} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }}>Neural Model Updated</span>
                                                <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)', lineHeight: 1.4 }}>The predictive baseline weights have been recalibrated across global clusters.</span>
                                                <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)', fontWeight: 700, marginTop: '4px', letterSpacing: '0.05em' }}>T-MINUS 2 MINS</span>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex', gap: '14px', padding: '14px', borderRadius: '16px',
                                            background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.1)',
                                            position: 'relative'
                                        }}>
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: '#f43f5e', boxShadow: '0 0 10px #f43f5e' }} />
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)',
                                                color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                border: '1px solid rgba(244, 63, 94, 0.3)'
                                            }}>
                                                <Shield size={18} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }}>Structural Risk Detected</span>
                                                <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)', lineHeight: 1.4 }}>Cascading failure probability exceeds 64% in primary logistics network.</span>
                                                <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)', fontWeight: 700, marginTop: '4px', letterSpacing: '0.05em' }}>T-MINUS 1 HOUR</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={onThemeToggle}
                            className="nexus-icon-btn"
                        >
                            <div style={{
                                transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                transform: theme === 'light' ? 'rotate(180deg)' : theme === 'midnight' ? 'rotate(90deg)' : 'rotate(0deg)',
                                display: 'flex',
                            }}>
                                {theme === 'dark' ?
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                                    : theme === 'light' ?
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                                        :
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="1.5" /><circle cx="8.5" cy="7.5" r="1.5" /><circle cx="6.5" cy="12" r="1.5" /><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12a10 10 0 0 0 10 10Z" /></svg>
                                }
                            </div>
                        </button>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: isMidnight ? `${customPrimary}25` : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

                    {/* Identity Matrix (Profile Profile) */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                padding: '6px 16px 6px 6px',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
                                e.currentTarget.style.boxShadow = isDark ? '0 0 20px rgba(99, 102, 241, 0.15)' : '0 4px 12px rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: isPro
                                    ? 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)'
                                    : (isDark ? 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' : 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)'),
                                border: isPro ? '2px solid transparent' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDark ? '#fff' : '#0f172a',
                                fontWeight: 800,
                                fontSize: '13px',
                                overflow: 'hidden',
                                boxShadow: isPro ? '0 0 15px rgba(236, 72, 153, 0.4)' : 'none',
                                position: 'relative',
                            }}>
                                {/* Spinning inner ring for Pro */}
                                {isPro && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: '-2px',
                                        background: 'conic-gradient(from 0deg, transparent 0%, #fff 50%, transparent 100%)',
                                        animation: 'spin 3s linear infinite',
                                        opacity: 0.3
                                    }} />
                                )}
                                <div style={{
                                    position: 'absolute', inset: '2px', background: isDark ? '#09090b' : '#ffffff', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
                                }}>
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    ) : (
                                        <>{user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}</>
                                    )}
                                </div>
                            </div>
                            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a', lineHeight: 1.2 }}>
                                    {user?.firstName || 'User'}
                                </span>
                                {isPro ? (
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: 900,
                                        background: 'linear-gradient(90deg, #818cf8, #f472b6)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        lineHeight: 1,
                                    }}>Nexus Tier</span>
                                ) : (
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        lineHeight: 1,
                                    }}>Standard Auth</span>
                                )}
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                style={{
                                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)',
                                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    marginLeft: '4px'
                                }}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {/* Ultra-Premium Holographic Dropdown */}
                        {showUserMenu && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 16px)',
                                right: 0,
                                background: isDark ? 'rgba(10, 10, 16, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                borderRadius: '24px',
                                minWidth: '280px',
                                zIndex: 1000,
                                padding: '16px',
                                boxShadow: isDark ? '0 30px 60px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' : '0 30px 60px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                                animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                transformOrigin: 'top right',
                            }}>
                                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)' }} />

                                <div style={{
                                    padding: '16px',
                                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                    borderRadius: '16px',
                                    marginBottom: '16px',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, color: '#6366f1' }}>
                                        <Hexagon size={100} />
                                    </div>
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>Network Identity</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a', letterSpacing: '0.02em' }}>{user?.email || 'admin@nexus.ai'}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {[
                                        { title: 'Identity Matrix', sub: 'Profile & Security', icon: Fingerprint, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
                                        { title: 'Core Settings', sub: 'System Parameters', icon: Settings, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
                                    ].map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setShowUserMenu(false); onNavigate?.('settings'); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '14px',
                                                padding: '10px 14px', borderRadius: '14px',
                                                background: 'transparent', border: '1px solid transparent',
                                                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)',
                                                width: '100%', cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
                                                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.borderColor = 'transparent';
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '12px',
                                                background: item.bg, border: `1px solid ${item.color}30`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color
                                            }}>
                                                <item.icon size={18} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>{item.title}</span>
                                                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)', fontWeight: 600 }}>{item.sub}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', margin: '16px 0' }} />

                                <button
                                    onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '12px',
                                        padding: '14px', borderRadius: '16px',
                                        background: 'transparent', border: '1px solid rgba(244, 63, 94, 0.1)',
                                        color: '#fb7185',
                                        width: '100%', cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.1)';
                                    }}
                                >
                                    <LogOut size={16} />
                                    <span style={{ fontSize: '13px', fontWeight: 800 }}>Sever Connection</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
            {showUserMenu && <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
            {showNotifications && <div onClick={() => setShowNotifications(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}

            <style>{`
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(15px) scale(0.95); filter: blur(4px); }
                    to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                }
                @keyframes energy-flow {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.02); }
                }
                .sparkle-spin {
                    animation: spin 3s linear infinite;
                }
                .nexus-icon-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${isMidnight ? `${customPrimary}0d` : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
                    border: 1px solid ${isMidnight ? `${customPrimary}20` : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
                    color: ${isMidnight ? `${customPrimary}cc` : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'};
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    cursor: pointer;
                }
                .nexus-icon-btn:hover {
                    background: ${isMidnight ? `${customPrimary}20` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
                    border-color: ${isMidnight ? `${customPrimary}50` : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
                    color: ${isMidnight ? customPrimary : isDark ? '#fff' : '#0f172a'};
                    transform: translateY(-1px);
                    box-shadow: ${isMidnight ? `0 4px 16px ${customPrimary}25, 0 0 0 1px ${customPrimary}15` : isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'};
                }
            `}</style>
        </>
    );
};
