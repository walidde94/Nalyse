import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Share2, Users, Activity, Link, Send, AtSign, Clock, Sparkles,
    Eye, ExternalLink, MoreHorizontal, Loader2, Copy, Check, Globe, Lock, ChevronRight,
    Zap, FileText, AlertTriangle, Edit3, Download
} from 'lucide-react';
import { API_URL } from '../../config';

interface CollaborationViewProps {
    token?: string;
}

export const CollaborationView = ({ token }: CollaborationViewProps) => {
    const [activeSection, setActiveSection] = useState<'dashboards' | 'activity' | 'threads'>('dashboards');
    const [dashboards, setDashboards] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const commentInputRef = useRef<HTMLInputElement>(null);

    const headers: any = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dashRes, actRes, commRes] = await Promise.all([
                fetch(`${API_URL}/api/collaboration/dashboards`, { headers }).then(r => r.json()).catch(() => ({ dashboards: [] })),
                fetch(`${API_URL}/api/collaboration/activity`, { headers }).then(r => r.json()).catch(() => ({ activity: [] })),
                fetch(`${API_URL}/api/collaboration/comments/dash-1`, { headers }).then(r => r.json()).catch(() => ({ comments: [] })),
            ]);
            setDashboards(dashRes.dashboards || []);
            setActivity(actRes.activity || []);
            setComments(commRes.comments || []);
        } catch { }
        setLoading(false);
    };

    const sendComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await fetch(`${API_URL}/api/collaboration/comments`, {
                method: 'POST', headers,
                body: JSON.stringify({ dashboardId: 'dash-1', text: newComment })
            });
            const data = await res.json();
            if (data.success) {
                setComments(prev => [...prev, data.comment]);
                setNewComment('');
            }
        } catch { }
    };

    const generateShareLink = async () => {
        try {
            const res = await fetch(`${API_URL}/api/collaboration/share-link`, { method: 'POST', headers, body: JSON.stringify({}) });
            const data = await res.json();
            if (data.success) setShareLink(data.shareLink);
        } catch { }
    };

    const copyLink = () => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const timeAgo = (ts: string) => {
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const actionIcon = (type: string) => {
        switch (type) {
            case 'comment': return <MessageSquare size={14} color="#818cf8" />;
            case 'share': return <Share2 size={14} color="#34d399" />;
            case 'alert': return <AlertTriangle size={14} color="#fbbf24" />;
            case 'edit': return <Edit3 size={14} color="#3b82f6" />;
            case 'export': return <Download size={14} color="#a78bfa" />;
            default: return <Activity size={14} />;
        }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-main)', position: 'relative', minHeight: '100%' }}>
            {/* Atmospheric Glow */}
            <div style={{ position: 'absolute', top: '5%', left: '40%', width: '40vw', height: '40vh', background: 'radial-gradient(ellipse, rgba(52, 211, 153, 0.06), transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vh', background: 'radial-gradient(circle, rgba(129, 140, 248, 0.05), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, letterSpacing: '-0.03em' }}>
                        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #34d399, #3b82f6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -6px rgba(52, 211, 153, 0.5)' }}>
                            <Users size={22} color="#fff" />
                        </div>
                        Collaborative Workspace
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500, marginLeft: '52px' }}>
                        Real-time team collaboration, shared dashboards, and threaded discussions.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={generateShareLink} style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(52, 211, 153, 0.3)' }}>
                        <Link size={16} /> Generate Share Link
                    </button>
                </div>
            </div>

            {/* Share Link Toast */}
            <AnimatePresence>
                {shareLink && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Globe size={18} color="#34d399" />
                            <code style={{ fontSize: '13px', color: '#34d399', fontFamily: 'var(--font-mono)' }}>{shareLink}</code>
                        </div>
                        <button onClick={copyLink} style={{ background: copied ? '#10b981' : 'var(--bg-elevated)', border: 'none', padding: '8px 16px', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
                {[
                    { id: 'dashboards', label: 'Shared Dashboards', icon: <FileText size={15} />, count: dashboards.length },
                    { id: 'activity', label: 'Live Activity', icon: <Activity size={15} />, count: activity.length },
                    { id: 'threads', label: 'Discussion Threads', icon: <MessageSquare size={15} />, count: comments.length },
                ].map(tab => {
                    const isActive = activeSection === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveSection(tab.id as any)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px',
                            background: isActive ? 'var(--border-default)' : 'transparent',
                            border: `1px solid ${isActive ? 'var(--border-default)' : 'transparent'}`,
                            color: isActive ? '#fff' : 'var(--text-muted)',
                            fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                            {tab.icon} {tab.label}
                            <span style={{ background: isActive ? 'rgba(52, 211, 153, 0.2)' : 'var(--bg-surface-hover)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, color: isActive ? '#34d399' : 'var(--text-muted)' }}>{tab.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                            <Loader2 className="animate-spin" size={32} color="#34d399" />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Collaboration Data...</span>
                        </motion.div>
                    ) : (
                        <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>

                            {/* ─── SHARED DASHBOARDS ───────────────────────────── */}
                            {activeSection === 'dashboards' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                                    {dashboards.map((d, i) => (
                                        <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
                                            className="hover:border-white/15"
                                        >
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: d.status === 'live' ? 'linear-gradient(90deg, #34d399, #3b82f6)' : 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' }} />

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0' }}>{d.name}</h3>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {d.owner}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{
                                                        fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                                                        padding: '4px 8px', borderRadius: '4px',
                                                        background: d.status === 'live' ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-surface-hover)',
                                                        color: d.status === 'live' ? '#34d399' : 'var(--text-muted)'
                                                    }}>
                                                        {d.status === 'live' && '● '}{d.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    <Eye size={13} /> {d.viewers} viewers
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    <Clock size={13} /> {timeAgo(d.lastEdited)}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '-4px' }}>
                                                    {d.sharedWith.map((name: string, j: number) => (
                                                        <div key={j} title={name} style={{ width: '28px', height: '28px', borderRadius: '50%', background: `hsl(${name.length * 40}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: 'var(--text-primary)', border: '2px solid #0f172a', marginLeft: j > 0 ? '-8px' : '0', position: 'relative', zIndex: d.sharedWith.length - j }}>
                                                            {name.charAt(0)}
                                                        </div>
                                                    ))}
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>+{d.sharedWith.length} collaborators</span>
                                                </div>
                                                <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    Open <ExternalLink size={12} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* ─── ACTIVITY FEED ────────────────────────────────── */}
                            {activeSection === 'activity' && (
                                <div style={{ maxWidth: '700px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {activity.map((a, i) => (
                                            <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                                                className="hover:bg-white/5"
                                            >
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {actionIcon(a.type)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontSize: '13px' }}>
                                                        <strong style={{ color: 'var(--text-primary)' }}>{a.user}</strong>{' '}
                                                        <span style={{ color: 'var(--text-muted)' }}>{a.action}</span>{' '}
                                                        <strong style={{ color: '#818cf8' }}>{a.target}</strong>
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{timeAgo(a.time)}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ─── DISCUSSION THREADS ──────────────────────────── */}
                            {activeSection === 'threads' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                                    {/* Comment Thread */}
                                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <MessageSquare size={16} color="#818cf8" /> Thread: Q4 Revenue Overview
                                            </h3>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{comments.length} messages</span>
                                        </div>

                                        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                                            {comments.map((c, i) => (
                                                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                                    style={{ display: 'flex', gap: '12px' }}
                                                >
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.userName === 'Nalyse AI' ? 'linear-gradient(135deg, #818cf8, #6366f1)' : `hsl(${c.userName.length * 40}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                                                        {c.userName === 'Nalyse AI' ? <Sparkles size={14} /> : c.userName.charAt(0)}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.userName}</span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{timeAgo(c.timestamp)}</span>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.text}</p>
                                                        {c.reactions && Object.keys(c.reactions).length > 0 && (
                                                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                                                {Object.entries(c.reactions).map(([emoji, count]) => (
                                                                    <span key={emoji} style={{ background: 'var(--bg-surface-hover)', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-default)' }}>
                                                                        {emoji} {count as number}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', gap: '12px' }}>
                                            <input
                                                ref={commentInputRef}
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && sendComment()}
                                                placeholder="Type a message... use @ to mention"
                                                style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '12px 16px', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                                            />
                                            <button onClick={sendComment} disabled={!newComment.trim()} style={{ background: newComment.trim() ? '#818cf8' : 'var(--bg-surface-hover)', color: 'var(--text-primary)', border: 'none', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s', opacity: newComment.trim() ? 1 : 0.5 }}>
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sidebar: Participants & Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '20px' }}>
                                            <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Active Participants</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {['Alice Chen', 'Bob Smith', 'Nalyse AI'].map((name, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: name === 'Nalyse AI' ? 'linear-gradient(135deg, #818cf8, #6366f1)' : `hsl(${name.length * 40}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#fff' }}>
                                                            {name === 'Nalyse AI' ? <Sparkles size={12} /> : name.charAt(0)}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{name}</div>
                                                        </div>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153, 0.6)' }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '20px' }}>
                                            <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Thread Stats</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Messages</span>
                                                    <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{comments.length}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Reactions</span>
                                                    <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{comments.reduce((a: number, c: any) => a + (Object.values(c.reactions || {}) as number[]).reduce((b: number, v: number) => b + v, 0), 0)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mentions</span>
                                                    <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{comments.filter((c: any) => c.text.includes('@')).length}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(52, 211, 153, 0.05))', border: '1px solid rgba(129, 140, 248, 0.2)', borderRadius: '16px', padding: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <Sparkles size={16} color="#818cf8" />
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#818cf8' }}>AI Suggestion</span>
                                            </div>
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                                Based on the thread activity, the APAC revenue anomaly discussed earlier correlates with the new enterprise contract. Consider creating a follow-up dashboard to track contract impact.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
