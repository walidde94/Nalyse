import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
    Radio, Shield, Zap, TrendingUp, AlertTriangle, CheckCircle2,
    Clock, ChevronRight, X, Filter, Bell, BellOff, Trash2,
    Activity, Brain, Eye, ArrowUpRight, Cpu, Layers, BarChart3,
    Volume2, VolumeX, Pin, Inbox, Search, Check
} from 'lucide-react';
import { API_URL } from '../../config';

// ═══════════════════════════════════════════════════════════════
// TYPES (mirrors backend entity)
// ═══════════════════════════════════════════════════════════════
type NotifCategory = 'all' | 'critical' | 'warning' | 'insight' | 'success' | 'info';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    category: 'critical' | 'warning' | 'insight' | 'success' | 'info';
    priority: 'critical' | 'high' | 'medium' | 'low';
    createdAt: string;
    read: boolean;
    pinned: boolean;
    source: string;
    iconType: string;
    color: string;
    actionLabel?: string;
    actionUrl?: string;
    prediction?: string;
    confidence?: number;
    impactScore?: number;
    metadata?: Record<string, any>;
}

interface NotificationCenterProps {
    isDark: boolean;
    onClose: () => void;
    onNavigate?: (path: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// ICON RESOLVER — Maps backend iconType to lucide icon
// ═══════════════════════════════════════════════════════════════
const ICON_MAP: Record<string, React.ElementType> = {
    shield: Shield, zap: Zap, trending: TrendingUp, alert: AlertTriangle,
    check: CheckCircle2, activity: Activity, brain: Brain, cpu: Cpu,
    layers: Layers, chart: BarChart3, bell: Bell, eye: Eye, radio: Radio,
};
const resolveIcon = (iconType: string): React.ElementType => ICON_MAP[iconType] || Bell;

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    all: { label: 'All Signals', color: '#94a3b8', icon: Radio },
    critical: { label: 'Critical', color: '#f43f5e', icon: Shield },
    warning: { label: 'Warnings', color: '#f59e0b', icon: AlertTriangle },
    insight: { label: 'Insights', color: '#8b5cf6', icon: Brain },
    success: { label: 'Resolved', color: '#10b981', icon: CheckCircle2 },
    info: { label: 'Info', color: '#3b82f6', icon: Bell },
};

// ═══════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════
const getToken = () => localStorage.getItem('accessToken');
const apiFetch = async (path: string, options?: RequestInit) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/api/notifications${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
};

// ═══════════════════════════════════════════════════════════════
// MINI SPARKLINE (for metadata.sparklineData if present)
// ═══════════════════════════════════════════════════════════════
const MiniSparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({ data, color, width = 80, height = 24 }) => {
    if (!data?.length) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
    const areaPoints = `0,${height} ${points} ${width},${height}`;
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <defs><linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
            <polygon points={areaPoints} fill={`url(#spark-${color.replace('#', '')})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="2.5" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        </svg>
    );
};

// ═══════════════════════════════════════════════════════════════
// LIVE PULSE WAVEFORM
// ═══════════════════════════════════════════════════════════════
const LivePulse: React.FC<{ color: string; active: boolean }> = ({ color, active }) => {
    const [bars, setBars] = useState([30, 60, 45, 80, 55, 70, 40, 65, 50, 75, 35, 60]);
    useEffect(() => {
        if (!active) return;
        const iv = setInterval(() => setBars(prev => prev.map(() => Math.random() * 80 + 15)), 200);
        return () => clearInterval(iv);
    }, [active]);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 16 }}>
            {bars.map((h, i) => (
                <div key={i} style={{ width: 2, height: `${h}%`, borderRadius: 1, background: active ? color : 'rgba(255,255,255,0.1)', transition: 'height 0.15s ease', opacity: active ? 0.8 : 0.3 }} />
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// THREAT GAUGE
// ═══════════════════════════════════════════════════════════════
const ThreatGauge: React.FC<{ level: number; isDark: boolean }> = ({ level, isDark }) => {
    const color = level >= 70 ? '#f43f5e' : level >= 40 ? '#f59e0b' : '#10b981';
    const label = level >= 70 ? 'CRITICAL' : level >= 40 ? 'ELEVATED' : 'NOMINAL';
    const r = 36;
    const circ = Math.PI * r;
    const offset = circ - (level / 100) * circ;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', width: 80, height: 48 }}>
                <svg width="80" height="48" viewBox="0 0 80 48">
                    <path d={`M 4 44 A ${r} ${r} 0 0 1 76 44`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="6" strokeLinecap="round" />
                    <motion.path d={`M 4 44 A ${r} ${r} 0 0 1 76 44`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
                </svg>
                <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-mono)', color, lineHeight: 1, textShadow: isDark ? `0 0 12px ${color}40` : 'none' }}>{Math.round(level)}</div>
                </div>
            </div>
            <div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontWeight: 600 }}>Threat Level</div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// SWIPEABLE NOTIFICATION CARD
// ═══════════════════════════════════════════════════════════════
const NotifCard: React.FC<{
    notif: NotificationItem; isDark: boolean; isExpanded: boolean;
    onExpand: () => void; onDismiss: () => void; onPin: () => void;
    onMarkRead: () => void; idx: number;
}> = ({ notif, isDark, isExpanded, onExpand, onDismiss, onPin, onMarkRead, idx }) => {
    const x = useMotionValue(0);
    const bg = useTransform(x, [-120, 0], ['rgba(239,68,68,0.2)', 'transparent']);
    const iconOpacity = useTransform(x, [-120, -40, 0], [1, 0.5, 0]);
    const IconComp = resolveIcon(notif.iconType);
    const sparkline = notif.metadata?.sparklineData as number[] | undefined;

    const handleDragEnd = (_: any, info: PanInfo) => { if (info.offset.x < -100) onDismiss(); };

    const formatTime = (dateStr: string) => {
        const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
        return `${Math.floor(mins / 1440)}d ago`;
    };

    return (
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
            <motion.div style={{ position: 'absolute', inset: 0, background: bg, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px' }}>
                <motion.div style={{ opacity: iconOpacity, color: '#ef4444' }}><Trash2 size={20} /></motion.div>
            </motion.div>

            <motion.div
                style={{ x, position: 'relative', zIndex: 1 }}
                drag="x" dragConstraints={{ left: -140, right: 0 }} dragElastic={0.1}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -200, scale: 0.95, transition: { duration: 0.3 } }}
                transition={{ duration: 0.4, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
                <div
                    onClick={() => { onExpand(); onMarkRead(); }}
                    style={{
                        position: 'relative', padding: '14px 16px', borderRadius: 18, cursor: 'pointer', transition: 'all 0.3s ease', overflow: 'hidden',
                        background: isDark ? (notif.read ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.04)') : (notif.read ? 'rgba(0,0,0,0.01)' : 'rgba(0,0,0,0.03)'),
                        border: `1px solid ${isDark ? (notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)') : (notif.read ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)')}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.045)'; e.currentTarget.style.borderColor = notif.color + '35'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isDark ? (notif.read ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.04)') : (notif.read ? 'rgba(0,0,0,0.01)' : 'rgba(0,0,0,0.03)'); e.currentTarget.style.borderColor = isDark ? (notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)') : (notif.read ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)'); e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    {/* Priority accent */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '3px 0 0 3px', background: notif.color, boxShadow: `0 0 12px ${notif.color}60`, opacity: notif.read ? 0.3 : 1 }} />
                    {notif.pinned && <div style={{ position: 'absolute', top: 8, right: 8 }}><Pin size={10} color={notif.color} style={{ transform: 'rotate(45deg)' }} /></div>}
                    {!notif.read && !notif.pinned && <div style={{ position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: '50%', background: notif.color, boxShadow: `0 0 10px ${notif.color}` }} />}
                    {notif.priority === 'critical' && !notif.read && <div style={{ position: 'absolute', top: 8, right: 8, width: 12, height: 12, borderRadius: '50%', border: `2px solid ${notif.color}`, animation: 'critical-pulse 1.5s ease-in-out infinite' }} />}

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: `linear-gradient(135deg, ${notif.color}12, ${notif.color}06)`, border: `1px solid ${notif.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: notif.color }}>
                            <IconComp size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 12.5, fontWeight: notif.read ? 600 : 800, color: isDark ? (notif.read ? 'rgba(255,255,255,0.65)' : '#fff') : (notif.read ? 'rgba(15,23,42,0.65)' : '#0f172a'), lineHeight: 1.35 }}>{notif.title}</span>
                                {sparkline && !isExpanded && <div style={{ flexShrink: 0, marginTop: 2 }}><MiniSparkline data={sparkline} color={notif.color} width={56} height={18} /></div>}
                            </div>
                            <p style={{ fontSize: 11.5, lineHeight: 1.5, margin: '5px 0 0', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.45)', display: isExpanded ? 'block' : '-webkit-box', WebkitLineClamp: isExpanded ? undefined : 2, WebkitBoxOrient: 'vertical' as any, overflow: isExpanded ? 'visible' : 'hidden' }}>{notif.message}</p>

                            {/* Meta */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} /> {formatTime(notif.createdAt)}</span>
                                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)' }}>{notif.source}</span>
                                {notif.impactScore != null && <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: `${notif.color}10`, color: notif.color, textTransform: 'uppercase' }}>IMPACT: {notif.impactScore}%</span>}
                                {notif.metadata?.relatedCount && <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>+{notif.metadata.relatedCount} RELATED</span>}
                            </div>

                            {/* Expanded */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                                            {sparkline && (
                                                <div style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 12, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>TREND</span>
                                                        <span style={{ fontSize: 9, fontWeight: 700, color: notif.color, fontFamily: 'var(--font-mono)' }}>{sparkline[sparkline.length - 1]}</span>
                                                    </div>
                                                    <MiniSparkline data={sparkline} color={notif.color} width={320} height={40} />
                                                </div>
                                            )}
                                            {notif.prediction && (
                                                <div style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 12, background: isDark ? 'rgba(139,92,246,0.05)' : 'rgba(139,92,246,0.03)', border: `1px solid ${isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.06)'}` }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}><Brain size={11} color="#a78bfa" /><span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa' }}>Neural Prediction</span></div>
                                                    <div style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15,23,42,0.65)', fontWeight: 600, lineHeight: 1.5 }}>{notif.prediction}</div>
                                                    {notif.confidence != null && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                                                            <div style={{ flex: 1, height: 4, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                                                <motion.div initial={{ width: '0%' }} animate={{ width: `${notif.confidence}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #818cf8, #c084fc)', boxShadow: '0 0 8px rgba(139,92,246,0.3)' }} />
                                                            </div>
                                                            <span style={{ fontSize: 10, fontWeight: 900, color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>{notif.confidence}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {notif.actionLabel && (
                                                    <button onClick={e => { e.stopPropagation(); if (notif.actionUrl) window.location.hash = notif.actionUrl; }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${notif.color}20, ${notif.color}10)`, color: notif.color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                                        {notif.actionLabel} <ArrowUpRight size={12} />
                                                    </button>
                                                )}
                                                <button onClick={e => { e.stopPropagation(); onPin(); }} style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, background: 'transparent', color: notif.pinned ? '#f59e0b' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'), fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Pin size={11} style={{ transform: 'rotate(45deg)' }} /> {notif.pinned ? 'Unpin' : 'Pin'}
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); onDismiss(); }} style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, background: 'transparent', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN NOTIFICATION CENTER — PRODUCTION VERSION
// ═══════════════════════════════════════════════════════════════
export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isDark, onClose, onNavigate }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({ total: 0 });
    const [activeCategory, setActiveCategory] = useState<NotifCategory>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── FETCH NOTIFICATIONS ───
    const fetchNotifications = useCallback(async () => {
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (activeCategory !== 'all') params.set('category', activeCategory);
            const data = await apiFetch(`?${params.toString()}`);
            setNotifications(data.items || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [activeCategory]);

    const fetchUnreadCounts = useCallback(async () => {
        try {
            const data = await apiFetch('/unread-counts');
            setUnreadCounts(data);
        } catch (err) {
            console.error('Failed to fetch unread counts:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCounts();
    }, [fetchNotifications, fetchUnreadCounts]);

    // Live polling (every 15s when live mode is on)
    useEffect(() => {
        if (isLive) {
            pollRef.current = setInterval(() => {
                fetchNotifications();
                fetchUnreadCounts();
            }, 15000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [isLive, fetchNotifications, fetchUnreadCounts]);

    // WebSocket listener for real-time notifications
    useEffect(() => {
        const handleLiveUpdate = (event: CustomEvent) => {
            const payload = event.detail;
            if (payload?.entity === 'notification') {
                // New notification pushed from backend
                if (payload.data?.notification) {
                    setNotifications(prev => [payload.data.notification, ...prev]);
                    setUnreadCounts(prev => ({ ...prev, total: (prev.total || 0) + 1, [payload.data.notification.category]: (prev[payload.data.notification.category] || 0) + 1 }));
                } else {
                    // Generic refresh
                    fetchNotifications();
                    fetchUnreadCounts();
                }
            }
        };
        window.addEventListener('live_update' as any, handleLiveUpdate);
        return () => window.removeEventListener('live_update' as any, handleLiveUpdate);
    }, [fetchNotifications, fetchUnreadCounts]);

    // ─── ACTIONS ───
    const markRead = useCallback(async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try { await apiFetch(`/${id}/read`, { method: 'PATCH' }); fetchUnreadCounts(); } catch { /* optimistic */ }
    }, [fetchUnreadCounts]);

    const markAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCounts({ total: 0 });
        try { await apiFetch('/read-all', { method: 'PATCH' }); } catch { /* optimistic */ }
    }, []);

    const dismissNotification = useCallback(async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        try { await apiFetch(`/${id}`, { method: 'DELETE' }); fetchUnreadCounts(); } catch { /* optimistic */ }
    }, [fetchUnreadCounts]);

    const pinNotification = useCallback(async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
        try { await apiFetch(`/${id}/pin`, { method: 'PATCH' }); } catch { /* optimistic */ }
    }, []);

    // ─── DERIVED STATE ───
    const filtered = useMemo(() => {
        let items = notifications;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || n.source.toLowerCase().includes(q));
        }
        return items.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [notifications, searchQuery]);

    const unreadCount = unreadCounts.total || 0;
    const criticalCount = unreadCounts.critical || 0;
    const threatLevel = Math.min(100, criticalCount * 25 + (unreadCounts.warning || 0) * 10 + Math.min(unreadCount * 5, 30));

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(8px)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="notification-center-dropdown"
            style={{
                position: 'absolute', top: 'calc(100% + 16px)', right: '-60px',
                width: 460, maxHeight: '88vh',
                background: isDark ? 'rgba(8, 8, 14, 0.94)' : 'rgba(255, 255, 255, 0.97)',
                backdropFilter: 'blur(60px) saturate(200%)', WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: 24, zIndex: 1000,
                boxShadow: isDark ? '0 40px 80px -20px rgba(0,0,0,0.9), 0 0 60px rgba(99,102,241,0.08)' : '0 40px 80px -20px rgba(0,0,0,0.15)',
                transformOrigin: 'top right', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: isDark ? 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(236,72,153,0.3), transparent)' : 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)', zIndex: 2 }} />

            {/* ═══ HEADER ═══ */}
            <div style={{ padding: '18px 18px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 13, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.1))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Radio size={18} color="#818cf8" />
                            {unreadCount > 0 && (
                                <div style={{ position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px', background: criticalCount > 0 ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'var(--primary)', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 12px ${criticalCount > 0 ? 'rgba(244,63,94,0.5)' : 'rgba(99,102,241,0.4)'}`, border: `2px solid ${isDark ? '#08080e' : '#fff'}` }}>{unreadCount}</div>
                            )}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: isDark ? '#fff' : '#0f172a', fontFamily: 'var(--font-heading)' }}>Intelligence Feed</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <LivePulse color={threatLevel >= 70 ? '#f43f5e' : threatLevel >= 40 ? '#f59e0b' : '#10b981'} active={isLive} />
                                <span style={{ fontSize: 9, fontWeight: 700, color: isLive ? (threatLevel >= 70 ? '#f43f5e' : '#10b981') : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'), letterSpacing: '0.1em', textTransform: 'uppercase' }}>{isLive ? 'LIVE' : 'PAUSED'}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {[
                            { icon: <Search size={13} />, action: () => setShowSearch(!showSearch), active: showSearch },
                            { icon: isLive ? <VolumeX size={13} /> : <Volume2 size={13} />, action: () => setIsLive(!isLive) },
                            { icon: <Check size={13} />, action: markAllRead },
                            { icon: <X size={14} />, action: onClose },
                        ].map((btn, i) => (
                            <button key={i} onClick={btn.action} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: (btn as any).active ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), color: (btn as any).active ? '#818cf8' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                {btn.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <AnimatePresence>
                    {showSearch && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                                <Search size={13} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notifications..." autoFocus style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12, fontWeight: 500, color: isDark ? '#fff' : '#0f172a' }} />
                                {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', display: 'flex' }}><X size={12} /></button>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Threat gauge */}
                <div style={{ padding: '12px 14px', borderRadius: 14, marginBottom: 12, background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThreatGauge level={threatLevel} isDark={isDark} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {criticalCount > 0 && <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6, background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>{criticalCount} CRITICAL</span>}
                        <span style={{ fontSize: 9, fontWeight: 800, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }}>{unreadCount} UNREAD</span>
                    </div>
                </div>

                {/* Category pills */}
                <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
                    {(Object.keys(CATEGORY_CONFIG) as NotifCategory[]).map(cat => {
                        const cfg = CATEGORY_CONFIG[cat];
                        const count = cat === 'all' ? notifications.length : notifications.filter(n => n.category === cat).length;
                        const isActive = activeCategory === cat;
                        const CatIcon = cfg.icon;
                        return (
                            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, border: `1px solid ${isActive ? cfg.color + '40' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}`, background: isActive ? cfg.color + '12' : 'transparent', color: isActive ? cfg.color : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'), cursor: 'pointer', transition: 'all 0.25s', whiteSpace: 'nowrap', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                <CatIcon size={11} /> {cfg.label}
                                <span style={{ fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 6, background: isActive ? cfg.color + '18' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isActive ? cfg.color : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)') }}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ═══ NOTIFICATIONS LIST ═══ */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', scrollbarWidth: 'thin', scrollbarColor: isDark ? 'rgba(255,255,255,0.08) transparent' : 'rgba(0,0,0,0.08) transparent' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px 20px', color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)' }}>
                            <div style={{ width: 24, height: 24, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: 12, fontWeight: 600 }}>Loading signals...</div>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.length === 0 ? (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '48px 20px', color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)' }}>
                                    <Inbox size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
                                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{searchQuery ? 'No matching signals' : 'All clear'}</div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>{searchQuery ? 'Try a different search term' : 'No notifications yet'}</div>
                                </motion.div>
                            ) : filtered.map((notif, idx) => (
                                <NotifCard
                                    key={notif.id} notif={notif} isDark={isDark}
                                    isExpanded={expandedId === notif.id}
                                    onExpand={() => setExpandedId(expandedId === notif.id ? null : notif.id)}
                                    onDismiss={() => dismissNotification(notif.id)}
                                    onPin={() => pinNotification(notif.id)}
                                    onMarkRead={() => markRead(notif.id)}
                                    idx={idx}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={{ padding: '10px 16px', flexShrink: 0, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.01)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => onNavigate?.('settings')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: 'none', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.45)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'; }}
                ><Filter size={11} /> Preferences <ChevronRight size={11} /></button>
                <span style={{ fontSize: 9, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{notifications.length} Signals</span>
            </div>

            <style>{`
                @keyframes critical-pulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.8); opacity: 0; } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};
