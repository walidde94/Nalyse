import React, { useState, useEffect } from 'react';
import { Logo } from '../common/Logo';
import { Search, Bell, Hexagon, Radio, Shield, Settings, LogOut, Zap, Fingerprint, Compass, Command, MessageCircle, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useArchitect } from '../../contexts/ArchitectContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { UserProfile } from '../UserProfile';
import { ArchitectNode } from './ArchitectNode';

export type SettingsNavTab = 'profile' | 'api' | 'notifications' | 'subscription';

interface HeaderProps {
    theme: 'dark' | 'light' | 'midnight';
    onThemeToggle: () => void;
    onMenuToggle?: () => void;
    onNavigate?: (path: string, options?: { settingsTab?: SettingsNavTab }) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle, onMenuToggle, onNavigate }) => {
    const { user, logout } = useAuth();
    const { isArchitectMode, toggleArchitectMode } = useArchitect();
    const { language, setLanguage, t } = useLanguage();
    const { activeWorkspace, activeUsers, isConnected } = useWorkspace();
    const [showProfile, setShowProfile] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Toast notification state
    const [toastData, setToastData] = useState<{ title: string; message: string; author: any; type: 'mention' | 'message' } | null>(null);

    // Listen for real-time messages to show toast and play sound
    useEffect(() => {
        const handleNewMessage = (e: CustomEvent) => {
            const msg = e.detail;
            if (!msg || !msg.author) return;
            
            // Don't notify the sender!
            if (msg.author.id === user?.id) return;

            const isMention = msg.mentions?.includes(user?.id);

            // 1. Play Dynamic Sound via Web Audio API
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    if (ctx.state === 'suspended') ctx.resume();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.type = isMention ? 'square' : 'sine';
                    osc.frequency.setValueAtTime(isMention ? 880 : 600, ctx.currentTime);
                    if (isMention) osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
                    else osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
                    
                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isMention ? 0.3 : 0.2));
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + (isMention ? 0.3 : 0.2));
                }
            } catch (err) { console.warn('Audio auto-play blocked', err); }

            // 2. Play Bell Animation
            const bell = document.getElementById('hdr-bell-icon');
            if (bell) {
                bell.classList.remove('animate-bell');
                void bell.offsetWidth; // force reflow
                bell.classList.add('animate-bell');
            }

            // 3. Show Visual Toast
            const preview = msg.content.replace(/[@#]\[([^\]]+)\]\([^)]+\)/g, '$1');
            setToastData({
                title: isMention ? 'You were mentioned' : 'New Message',
                message: preview,
                author: msg.author,
                type: isMention ? 'mention' : 'message'
            });

            // Auto dismiss toast
            setTimeout(() => {
                setToastData(current => {
                    // Only dismiss if it's the same exact toast (prevent dismissing newer ones)
                    return current?.message === preview ? null : current;
                });
            }, 6000);
        };

        window.addEventListener('workspace:new_message', handleNewMessage as EventListener);
        return () => window.removeEventListener('workspace:new_message', handleNewMessage as EventListener);
    }, [user?.id]);

    const isDark = theme === 'dark' || theme === 'midnight';
    const isMidnight = theme === 'midnight';
    const isPro = (user as any)?.organization?.plan === 'pro' || (user as any)?.plan === 'pro';

    return (
        <>
            <header className="nexus-header" style={{
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: isMidnight
                    ? 'rgba(14, 10, 4, 0.6)'
                    : isDark
                        ? 'rgba(3, 7, 17, 0.5)'
                        : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: isMidnight ? 'blur(24px) saturate(220%)' : 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: isMidnight ? 'blur(24px) saturate(220%)' : 'blur(20px) saturate(180%)',
                borderBottom: `1px solid ${isMidnight ? 'var(--primary-subtle)' : 'var(--bento-border)'}`,
            }}>

                {/* Left: Logo + Identity */}
                <ArchitectNode id="header-identity" label="Core Identity" isDraggable={false}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                        <button
                            className="mobile-only btn-ghost"
                            onClick={onMenuToggle}
                            style={{ padding: '6px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)', background: 'transparent', border: 'none' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Logo />
                            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    fontFamily: 'var(--font-heading)',
                                    color: isDark ? '#fff' : '#0f172a',
                                    letterSpacing: '-0.02em',
                                }}>Nalyse</span>

                                {/* Connection status dot */}
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: isMidnight ? 'var(--primary)' : '#10b981',
                                    boxShadow: `0 0 8px ${isMidnight ? 'var(--primary-glow)' : 'rgba(16, 185, 129, 0.5)'}`,
                                    flexShrink: 0,
                                }} title="Connected" />
                            </div>
                        </div>
                    </div>
                </ArchitectNode>

                {/* Center: Search trigger (keyboard shortcut hint) */}
                <div className="desktop-only" style={{ flex: 1, maxWidth: '320px', margin: '0 auto' }}>
                    <button
                        onClick={() => {
                            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
                            window.dispatchEvent(e);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '7px 12px',
                            background: isMidnight ? 'var(--primary-subtle)' : 'var(--bento-glass)',
                            border: `1px solid ${isMidnight ? 'var(--primary-subtle)' : 'var(--bento-border)'}`,
                            borderRadius: 'var(--bento-radius-sm)',
                            cursor: 'pointer',
                            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.35)',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            transition: 'all 0.25s ease',
                            boxShadow: 'var(--bento-inset)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? 'var(--bento-glass-hover)' : 'rgba(0,0,0,0.03)';
                            e.currentTarget.style.borderColor = 'var(--bento-border-hover)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isDark ? 'var(--bento-glass)' : 'rgba(0,0,0,0.02)';
                            e.currentTarget.style.borderColor = isDark ? 'var(--bento-border)' : 'rgba(0,0,0,0.04)';
                        }}
                    >
                        <Search size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                        <span style={{ flex: 1, textAlign: 'left' }}>Search or jump to…</span>
                        <kbd style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 5px',
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                            borderRadius: '4px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)',
                            lineHeight: 1,
                        }}>⌘K</kbd>
                    </button>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

                    {/* Shared Workspace Status */}
                    {/* Shared Workspace Status */}
                    {activeWorkspace && (
                        <div className="desktop-only" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: isMidnight 
                                ? 'rgba(var(--primary-rgb), 0.08)' 
                                : isDark 
                                    ? 'rgba(255,255,255,0.03)' 
                                    : 'rgba(0,0,0,0.03)',
                            padding: '4px 12px',
                            borderRadius: '99px',
                            border: `1px solid ${isMidnight ? 'var(--primary-subtle)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                            marginRight: '12px',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}>
                             <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <div className="absolute w-2 h-2 rounded-full animate-ping" style={{ background: isConnected ? '#10b981' : '#ef4444', opacity: 0.4 }} />
                                <div style={{ 
                                    width: '6px', 
                                    height: '6px', 
                                    borderRadius: '50%', 
                                    background: isConnected ? '#10b981' : '#ef4444',
                                    boxShadow: isConnected ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                                }} />
                            </div>
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 700, 
                                color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                {activeWorkspace.name}
                                {Object.keys(activeUsers).length > 1 && (
                                    <span style={{ 
                                        fontSize: '9px', 
                                        fontWeight: 800,
                                        padding: '1px 6px',
                                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                        borderRadius: '4px',
                                        color: 'var(--primary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {Object.keys(activeUsers).length} ONLINE
                                    </span>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Language Switcher — minimal pills */}
                    <div className="desktop-only" style={{
                        display: 'flex',
                        padding: '2px',
                        background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.5)',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                        marginRight: '4px',
                    }}>
                        {['en', 'de'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang as 'en' | 'de')}
                                style={{
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    padding: '3px 7px',
                                    borderRadius: '6px',
                                    transition: 'all 0.25s ease',
                                    background: language === lang ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                                    color: language === lang ? (isDark ? '#fff' : '#0f172a') : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)'),
                                    border: 'none',
                                    cursor: 'pointer',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    lineHeight: 1,
                                }}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>

                    {/* Notifications */}
                    <div style={{ position: 'relative' }}>
                        <button
                            id="hdr-bell-icon"
                            className="hdr-icon-btn"
                            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                        >
                            <Bell size={16} />
                            <div style={{
                                position: 'absolute',
                                top: '6px',
                                right: '7px',
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                background: '#f43f5e',
                                boxShadow: '0 0 6px #f43f5e',
                            }} />
                        </button>

                        {/* Real-time Toast Popup */}
                        <AnimatePresence>
                            {toastData && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20, x: '-50%' }}
                                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                                    exit={{ opacity: 0, y: -20, x: '-50%' }}
                                    transition={{ type: 'spring', bounce: 0.4 }}
                                    style={{
                                        position: 'fixed',
                                        top: 60,
                                        left: '50%',
                                        zIndex: 9999,
                                        background: toastData.type === 'mention' ? 'rgba(139, 92, 246, 0.95)' : 'var(--bg-elevated)',
                                        backdropFilter: 'blur(20px)',
                                        border: `1px solid ${toastData.type === 'mention' ? '#8b5cf6' : 'var(--border-subtle)'}`,
                                        borderRadius: 16,
                                        padding: '12px 16px',
                                        display: 'flex',
                                        gap: 12,
                                        alignItems: 'center',
                                        boxShadow: toastData.type === 'mention' ? '0 10px 40px -10px rgba(139, 92, 246, 0.5)' : 'var(--shadow-xl)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setToastData(null)}
                                >
                                    <div style={{ 
                                        width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
                                    }}>
                                        {toastData.type === 'mention' ? <AtSign size={16} /> : <MessageCircle size={16} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: toastData.type === 'mention' ? '#fff' : 'var(--text-primary)' }}>
                                            {toastData.title}
                                        </div>
                                        <div style={{ fontSize: 12, color: toastData.type === 'mention' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {toastData.message}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 10px)',
                                right: '-40px',
                                background: 'var(--bg-elevated)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '16px',
                                minWidth: '320px',
                                zIndex: 1000,
                                padding: '14px',
                                boxShadow: 'var(--shadow-xl)',
                                animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                transformOrigin: 'top right',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h3 style={{ fontSize: '12px', fontWeight: 700, margin: 0, color: isDark ? '#fff' : '#0f172a', letterSpacing: '-0.01em' }}>Notifications</h3>
                                    <button style={{
                                        background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.15)', color: '#38bdf8',
                                        fontSize: '10px', fontWeight: 700, cursor: 'pointer', padding: '3px 8px',
                                        borderRadius: '6px', transition: 'all 0.2s',
                                    }}>Mark read</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{
                                        display: 'flex', gap: '10px', padding: '10px', borderRadius: '10px',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-subtle)',
                                    }}>
                                        <div style={{
                                            width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)',
                                            color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <Zap size={14} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>Model Updated</span>
                                            <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)', lineHeight: 1.35 }}>Predictive weights recalibrated.</span>
                                            <span style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)', fontWeight: 600, marginTop: '2px' }}>2 min ago</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex', gap: '10px', padding: '10px', borderRadius: '10px',
                                        background: 'rgba(244, 63, 94, 0.04)',
                                    }}>
                                        <div style={{
                                            width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.12)',
                                            color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <Shield size={14} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>Risk Alert</span>
                                            <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)', lineHeight: 1.35 }}>Failure probability exceeds threshold.</span>
                                            <span style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)', fontWeight: 600, marginTop: '2px' }}>1 hour ago</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={onThemeToggle}
                        className="hdr-icon-btn"
                        title={`Switch to ${theme === 'dark' ? 'Light' : theme === 'light' ? 'Custom' : 'Dark'} mode`}
                    >
                        <div style={{
                            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            transform: theme === 'light' ? 'rotate(180deg)' : theme === 'midnight' ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'flex',
                        }}>
                            {theme === 'dark' ?
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                                : theme === 'light' ?
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                                    :
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="1.5" /><circle cx="8.5" cy="7.5" r="1.5" /><circle cx="6.5" cy="12" r="1.5" /><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12a10 10 0 0 0 10 10Z" /></svg>
                            }
                        </div>
                    </button>

                    {/* Architect Toggle */}
                    <button
                        onClick={toggleArchitectMode}
                        className="hdr-icon-btn"
                        title={isArchitectMode ? "Exit Architect mode" : "Enter Architect mode"}
                        style={{
                            borderColor: isArchitectMode ? 'var(--primary)' : undefined,
                            background: isArchitectMode ? 'var(--primary-alpha)' : undefined,
                            color: isArchitectMode ? 'var(--primary)' : undefined,
                            boxShadow: isArchitectMode ? '0 0 12px var(--primary-glow)' : undefined
                        }}
                    >
                        <Compass size={15} className={isArchitectMode ? 'animate-spin' : ''} style={{ animationDuration: '10s' }} />
                    </button>

                    <div style={{ width: '1px', height: '20px', background: isMidnight ? 'var(--primary-subtle)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '0 2px' }} />

                    {/* Profile */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'transparent',
                                border: 'none',
                                padding: '4px',
                                borderRadius: '24px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: isPro
                                    ? 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)'
                                    : (isDark ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' : 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)'),
                                border: isPro ? '2px solid transparent' : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDark ? '#fff' : '#0f172a',
                                fontWeight: 800,
                                fontSize: '11px',
                                overflow: 'hidden',
                                position: 'relative',
                            }}>
                                <div style={{
                                    position: 'absolute', inset: isPro ? '2px' : '0', background: isDark ? '#09090b' : '#ffffff', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
                                }}>
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    ) : (
                                        <>{user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}</>
                                    )}
                                </div>
                            </div>
                            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#fff' : '#0f172a', lineHeight: 1.1 }}>
                                    {user?.firstName || 'User'}
                                </span>
                                {isPro && (
                                    <span style={{
                                        fontSize: '8px',
                                        fontWeight: 800,
                                        background: 'linear-gradient(90deg, #818cf8, #f472b6)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        lineHeight: 1,
                                    }}>Pro</span>
                                )}
                            </div>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                className="desktop-only"
                                style={{
                                    color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)',
                                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease',
                                }}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 10px)',
                                right: 0,
                                background: 'var(--bg-elevated)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '16px',
                                minWidth: '240px',
                                zIndex: 1000,
                                padding: '10px',
                                boxShadow: 'var(--shadow-xl)',
                                animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                transformOrigin: 'top right',
                            }}>
                                <div style={{
                                    padding: '10px 12px',
                                    background: 'var(--bg-surface)',
                                    borderRadius: '10px',
                                    marginBottom: '8px',
                                }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>{user?.firstName} {user?.lastName}</div>
                                    <div style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)', marginTop: '2px' }}>{user?.email || '—'}</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {[
                                        { title: 'Profile & Security', icon: Fingerprint, color: 'var(--accent)', settingsTab: 'profile' as const },
                                        { title: 'Settings', icon: Settings, color: 'var(--primary)', settingsTab: 'profile' as const }
                                    ].map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setShowUserMenu(false); onNavigate?.('settings', { settingsTab: item.settingsTab }); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '8px 10px', borderRadius: '8px',
                                                background: 'transparent', border: 'none',
                                                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)',
                                                width: '100%', cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'left', fontSize: '12.5px', fontWeight: 600,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--bg-surface-hover)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <item.icon size={15} style={{ color: item.color, opacity: 0.8 }} />
                                            <span>{item.title}</span>
                                        </button>
                                    ))}
                                </div>

                                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />

                                <button
                                    onClick={() => { logout(); setShowUserMenu(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 10px', borderRadius: '8px',
                                        background: 'transparent', border: 'none',
                                        color: '#fb7185',
                                        width: '100%', cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontSize: '12.5px', fontWeight: 700,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <LogOut size={15} />
                                    <span>Sign Out</span>
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
                @keyframes bellRing {
                    0% { transform: rotate(0deg); }
                    15% { transform: rotate(15deg); }
                    30% { transform: rotate(-15deg); }
                    45% { transform: rotate(10deg); }
                    60% { transform: rotate(-10deg); }
                    75% { transform: rotate(5deg); }
                    85% { transform: rotate(-5deg); }
                    100% { transform: rotate(0deg); }
                }
                .animate-bell svg {
                    animation: bellRing 0.6s ease-in-out;
                    transform-origin: top center;
                    color: var(--primary) !important;
                }
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(8px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .hdr-icon-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${isMidnight ? 'var(--primary-subtle)' : 'var(--bento-glass)'};
                    border: 1px solid ${isMidnight ? 'var(--primary-subtle)' : 'var(--bento-border)'};
                    color: ${isMidnight ? 'var(--primary)' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)'};
                    transition: all 0.25s ease;
                    cursor: pointer;
                    position: relative;
                }
                .hdr-icon-btn:hover {
                    background: ${isMidnight ? 'var(--primary-subtle)' : 'var(--bento-glass-hover)'};
                    border-color: ${isMidnight ? 'var(--primary-glow)' : 'var(--bento-border-hover)'};
                    color: ${isMidnight ? 'var(--primary)' : isDark ? '#fff' : '#0f172a'};
                    transform: translateY(-1px);
                }
            `}</style>
        </>
    );
};
