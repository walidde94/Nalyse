import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Users, Activity, Plus, CheckCircle2, Search, MoreVertical,
    ShieldAlert, Building2, Loader2, Clock, Database, Server,
    FileText, BarChart3, TrendingUp, Zap, Globe, Crown, Eye,
    Edit3, UserPlus, Mail, XCircle, ArrowUpRight, Layers,
    HardDrive, MessageCircle, AlertTriangle, Lock, RefreshCw
} from 'lucide-react';
import { API_URL } from '../../config';
import { useWorkspace } from '../../contexts/WorkspaceContext';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const formatBytes = (bytes: string | number) => {
    const n = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (!n || n === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(n) / Math.log(k));
    return parseFloat((n / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const timeAgo = (d: string | null) => {
    if (!d) return 'Never';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getUserName = (u: any) => {
    if (u?.displayName) return u.displayName;
    if (u?.firstName) return `${u.firstName} ${u.lastName || ''}`.trim();
    return u?.email?.split('@')[0] || 'Unknown';
};

const ROLE_THEME: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    admin: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Crown, label: 'Admin' },
    user:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Edit3, label: 'User' },
    member:{ color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: Users, label: 'Member' },
    viewer:{ color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: Eye, label: 'Viewer' },
};

const getRoleTheme = (role: string) => ROLE_THEME[role] || ROLE_THEME.member;

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
    WORKSPACE_CREATED: { label: 'created workspace', icon: Plus, color: '#10b981' },
    MEMBER_ADDED: { label: 'added a member', icon: UserPlus, color: '#3b82f6' },
    MEMBER_REMOVED: { label: 'removed a member', icon: XCircle, color: '#ef4444' },
    MEMBER_ROLE_UPDATED: { label: 'updated role', icon: Shield, color: '#f59e0b' },
    FILE_SHARED: { label: 'shared a file', icon: FileText, color: '#8b5cf6' },
    FILE_UNSHARED: { label: 'unshared a file', icon: Lock, color: '#64748b' },
    MESSAGE_SENT: { label: 'sent a message', icon: MessageCircle, color: '#06b6d4' },
};

// ═══════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }: {
    icon: any; label: string; value: string | number; sub?: string; color: string; delay?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden',
        }}
    >
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${color}15, transparent 70%)`, filter: 'blur(20px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', position: 'relative' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </motion.div>
);

const STATUS_THEME: Record<string, { color: string; glow: boolean; label: string }> = {
    online: { color: '#22c55e', glow: true, label: 'Online' },
    active: { color: '#10b981', glow: false, label: 'Active' },
    away:   { color: '#f59e0b', glow: false, label: 'Away' },
    offline:{ color: '#64748b', glow: false, label: 'Offline' },
};

const AVAILABLE_ROLES = ['admin', 'user', 'member', 'viewer'] as const;

const MemberRow = ({ m, idx, isAdmin, token, activeUsers, onRefresh, onSelect }: { m: any; idx: number; isAdmin: boolean; token?: string; activeUsers?: any; onRefresh: () => void; onSelect: (m: any) => void }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [rolePickerOpen, setRolePickerOpen] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [acting, setActing] = useState(false);

    const rt = getRoleTheme(m.role);
    const RoleIcon = rt.icon;
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#eab308'];
    const avatarColor = colors[(m.email || '').charCodeAt(0) % colors.length];
    
    // Fallback to offline if undefined
    let finalStatus = m.activityStatus || 'offline';
    // Override with live websocket presence if available
    if (activeUsers && activeUsers[m.id]) finalStatus = 'online';
    
    const status = STATUS_THEME[finalStatus] || STATUS_THEME.offline;

    const assets = m.assets || {};
    const fileCount = (assets.ownedFiles || 0) + (assets.sharedFiles || 0);
    const analysisCount = assets.analyses || m._count?.analyses || 0;
    const msgCount = assets.messages || m._count?.workspaceMessages || 0;
    const wsCount = assets.workspaces || m._count?.workspaceMembers || 0;

    const handleRoleChange = async (newRole: string) => {
        if (newRole === m.role || acting) return;
        setActing(true);
        try {
            const res = await fetch(`${API_URL}/api/organization/members/${m.id}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) onRefresh();
        } catch (err) {
            console.error('Failed to update role', err);
        } finally {
            setActing(false);
            setRolePickerOpen(false);
            setMenuOpen(false);
        }
    };

    return (
        <motion.tr
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect(m)}
            style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
            <td style={{ padding: '14px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', boxShadow: `0 4px 12px ${avatarColor}33`, flexShrink: 0 }}>
                            {(m.firstName?.charAt(0) || m.email.charAt(0)).toUpperCase()}
                        </div>
                        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: status.color, border: '2px solid var(--bg-main)', boxShadow: status.glow ? `0 0 8px ${status.color}88` : 'none' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{getUserName(m)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{m.email}</div>
                    </div>
                </div>
            </td>
            <td style={{ padding: '14px 24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: rt.bg, border: `1px solid ${rt.color}25` }}>
                    <rt.icon size={12} color={rt.color} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: rt.color }}>{rt.label}</span>
                </div>
            </td>
            <td style={{ padding: '14px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: status.color }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.color, boxShadow: status.glow ? `0 0 8px ${status.color}88` : 'none' }} />
                    {status.label}
                </div>
            </td>
            <td style={{ padding: '14px 24px' }}>
                <div style={{ display: 'flex', gap: 14 }}>
                    <span title="Files (owned + shared)" style={{ fontSize: 12, color: fileCount > 0 ? '#a78bfa' : 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: fileCount > 0 ? 700 : 500 }}><FileText size={12} /> {fileCount}</span>
                    <span title="Analyses run" style={{ fontSize: 12, color: analysisCount > 0 ? '#3b82f6' : 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: analysisCount > 0 ? 700 : 500 }}><BarChart3 size={12} /> {analysisCount}</span>
                    <span title="Messages" style={{ fontSize: 12, color: msgCount > 0 ? '#10b981' : 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: msgCount > 0 ? 700 : 500 }}><MessageCircle size={12} /> {msgCount}</span>
                    <span title="Workspaces" style={{ fontSize: 12, color: wsCount > 0 ? '#f59e0b' : 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: wsCount > 0 ? 700 : 500 }}><Globe size={12} /> {wsCount}</span>
                </div>
            </td>
            <td style={{ padding: '14px 24px', fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(m.lastLoginAt)}</td>
            <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                <button style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '6px 8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <MoreVertical size={14} />
                </button>
            </td>
        </motion.tr>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

type TabId = 'overview' | 'members' | 'workspaces' | 'audit';

export const OrganizationView = ({ token }: { token?: string }) => {
    const { activeUsers } = useWorkspace();
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('user');
    const [inviting, setInviting] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [acting, setActing] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState('user');

    // Data
    const [orgData, setOrgData] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || inviting) return;
        setInviting(true);
        try {
            const res = await fetch(`${API_URL}/api/organization/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });
            if (res.ok) {
                setInviteEmail('');
                setInviteModalOpen(false);
                fetchGovernanceData();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to send invite');
            }
        } catch (err) {
            console.error('Invite error', err);
        } finally {
            setInviting(false);
        }
    };

    useEffect(() => {
        fetchGovernanceData();
    }, []);

    const fetchGovernanceData = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/organization/governance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const fallbackRes = await fetch(`${API_URL}/api/organization`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    setMembers(fallbackData.members || []);
                    setOrgData(fallbackData.organization || null);
                    setWorkspaces([]);
                    setAuditLogs([]);
                    setInvitations([]);
                } else {
                    throw new Error('Failed to fetch organization data');
                }
                return;
            }

            const data = await res.json();
            setOrgData(data.organization || null);
            setMembers(data.members || []);
            setWorkspaces(data.workspaces || []);
            setAuditLogs(data.auditLogs || []);
            setInvitations(data.invitations || []);
            setStats(data.stats || {});
            if (data.currentUserRole) setCurrentUserRole(data.currentUserRole);
        } catch (err: any) {
            console.error('[Governance Fetch Error]', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeInvite = async (invId: string) => {
        try {
            setActing(true);
            const res = await fetch(`${API_URL}/api/organization/invitations/${invId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchGovernanceData();
        } finally {
            setActing(false);
        }
    };

    const handleResendInvite = async (invId: string) => {
        try {
            setActing(true);
            const res = await fetch(`${API_URL}/api/organization/invitations/${invId}/resend`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchGovernanceData();
        } finally {
            setActing(false);
        }
    };

    const filteredMembers = useMemo(() => {
        if (!searchQuery) return members;
        const q = searchQuery.toLowerCase();
        return members.filter(m =>
            getUserName(m).toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.role?.toLowerCase().includes(q)
        );
    }, [members, searchQuery]);

    const storagePct = orgData ? Math.round((parseInt(stats.totalStorage || '0') / parseInt(orgData.storageLimit || '1')) * 100) : 0;

    const tabs: { id: TabId; label: string; icon: any; count?: number }[] = [
        { id: 'overview', label: 'Overview', icon: Layers },
        { id: 'members', label: 'Members', icon: Users, count: stats.totalMembers },
        { id: 'workspaces', label: 'Workspaces', icon: Globe, count: stats.totalWorkspaces },
        { id: 'audit', label: 'Audit Trail', icon: Activity, count: auditLogs.length },
    ];

    return (
        <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto', fontFamily: 'var(--font-main)', minHeight: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-5%', left: '15%', width: '50vw', height: '40vh', background: 'radial-gradient(ellipse, rgba(139,92,246,0.06), transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

            <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, position: 'relative', zIndex: 1 }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px -6px rgba(139,92,246,0.5)'
                        }}>
                            <Building2 size={22} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 10 }}>
                                {orgData?.name || 'Organization'}
                                <span style={{
                                    fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
                                    background: orgData?.plan === 'enterprise' ? 'rgba(245,158,11,0.15)' : orgData?.plan === 'pro' ? 'rgba(139,92,246,0.15)' : 'rgba(100,116,139,0.15)',
                                    color: orgData?.plan === 'enterprise' ? '#f59e0b' : orgData?.plan === 'pro' ? '#a78bfa' : '#94a3b8',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                }}>
                                    {orgData?.plan || 'free'}
                                </span>
                            </h1>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                                Enterprise data governance, access controls & organizational intelligence
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchGovernanceData}
                    style={{
                        background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)',
                        borderRadius: 10, padding: '10px 16px', color: 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </motion.div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 28, position: 'relative', zIndex: 1, background: 'var(--bg-surface)', borderRadius: 14, padding: 4, border: '1px solid var(--border-subtle)' }}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
                                background: isActive ? 'var(--border-default)' : 'transparent',
                                border: 'none',
                                color: isActive ? '#fff' : 'var(--text-muted)',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                flex: 1, justifyContent: 'center',
                            }}
                        >
                            <TabIcon size={15} />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span style={{
                                    fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                                    background: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface-hover)',
                                    color: isActive ? '#fff' : 'var(--text-muted)',
                                    minWidth: 16, textAlign: 'center'
                                }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div style={{ position: 'relative', zIndex: 1, minHeight: 500 }}>
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
                        >
                            <Loader2 className="animate-spin" size={28} color="#8b5cf6" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Loading governance data...
                            </span>
                        </motion.div>
                    ) : error ? (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}
                        >
                            <AlertTriangle size={40} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Failed to load governance data</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>{error}</div>
                            <button onClick={fetchGovernanceData} style={{ marginTop: 20, background: '#8b5cf6', color: 'var(--text-primary)', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                                Retry
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                            {activeTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                                        <StatCard icon={Users} label="Members" value={stats.totalMembers || 0} sub={`${stats.activeLastWeek || 0} active this week`} color="#8b5cf6" delay={0} />
                                        <StatCard icon={Globe} label="Workspaces" value={stats.totalWorkspaces || 0} sub={`${stats.totalDashboards || 0} dashboards`} color="#3b82f6" delay={0.05} />
                                        <StatCard icon={FileText} label="Datasets" value={stats.totalFiles || 0} sub={formatBytes(stats.totalStorage || '0') + ' stored'} color="#10b981" delay={0.1} />
                                        <StatCard icon={Zap} label="Analyses" value={stats.totalAnalyses || 0} sub="Total executed" color="#f59e0b" delay={0.15} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 24 }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                                                <Shield size={16} color="#8b5cf6" /> Role Distribution
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {Object.entries(stats.roleDistribution || {}).map(([role, count]: [string, any]) => {
                                                    const rt = getRoleTheme(role);
                                                    const pct = stats.totalMembers ? Math.round((count / stats.totalMembers) * 100) : 0;
                                                    return (
                                                        <div key={role}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: rt.color }} />
                                                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{role}</span>
                                                                </div>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{count} · {pct}%</span>
                                                            </div>
                                                            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-surface-hover)', overflow: 'hidden' }}>
                                                                <motion.div
                                                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                                    transition={{ duration: 0.8, delay: 0.2 }}
                                                                    style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${rt.color}, ${rt.color}88)` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-default)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <HardDrive size={13} /> Storage Usage
                                                    </span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: storagePct > 80 ? '#ef4444' : '#10b981' }}>
                                                        {formatBytes(stats.totalStorage || '0')} / {formatBytes(orgData?.storageLimit || '0')}
                                                    </span>
                                                </div>
                                                <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-surface-hover)', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }} animate={{ width: `${Math.min(storagePct, 100)}%` }}
                                                        transition={{ duration: 1, delay: 0.3 }}
                                                        style={{
                                                            height: '100%', borderRadius: 4,
                                                            background: storagePct > 80
                                                                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                                                : 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                                                <Activity size={16} color="#10b981" /> Recent Activity
                                            </h3>
                                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {auditLogs.length > 0 ? auditLogs.slice(0, 8).map((log, i) => {
                                                    const config = ACTION_LABELS[log.action] || { label: log.action.toLowerCase().replace(/_/g, ' '), icon: Activity, color: '#64748b' };
                                                    const LogIcon = config.icon;
                                                    return (
                                                        <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                                            <div style={{ width: 28, height: 28, borderRadius: 7, background: `${config.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                                                <LogIcon size={13} color={config.color} />
                                                            </div>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                                    <strong style={{ color: 'var(--text-primary)' }}>{getUserName(log.user)}</strong>{' '}
                                                                    {config.label}
                                                                    {log.workspace && (
                                                                        <span style={{ color: 'var(--text-muted)' }}> in {log.workspace.name}</span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 2 }}>
                                                                    {timeAgo(log.createdAt)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }) : (
                                                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-disabled)' }}>
                                                        <Activity size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                                                        <div style={{ fontSize: 12 }}>No activity recorded yet</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {invitations.length > 0 && (
                                        <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 16, padding: 20 }}>
                                            <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Mail size={15} /> Pending Invitations ({invitations.length})
                                            </h3>
                                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                {invitations.map(inv => (
                                                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-default)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Mail size={13} color="#f59e0b" />
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{inv.email}</span>
                                                        </div>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{inv.role}</div>
                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Expires {timeAgo(inv.expiresAt)}</div>
                                                        {currentUserRole === 'admin' && (
                                                            <div style={{ display: 'flex', gap: 4, marginLeft: 4, paddingLeft: 8, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                                                                <button onClick={() => handleResendInvite(inv.id)} disabled={acting} title="Resend Invite" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, cursor: 'pointer' }}><RefreshCw size={12} /></button>
                                                                <button onClick={() => handleRevokeInvite(inv.id)} disabled={acting} title="Revoke Invite" style={{ background: 'none', border: 'none', color: '#ef4444', padding: 4, cursor: 'pointer' }}><XCircle size={12} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'members' && (
                                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', width: 320 }}>
                                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, or role..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', padding: '9px 16px 9px 36px', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, width: '100%', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {filteredMembers.length} of {members.length}
                                            </span>
                                            {currentUserRole === 'admin' && (
                                                <button
                                                    onClick={() => setInviteModalOpen(true)}
                                                    style={{
                                                        background: '#fff', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, padding: '8px 16px',
                                                        fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                                        boxShadow: '0 4px 12px rgba(255,255,255,0.1)'
                                                    }}
                                                >
                                                    <UserPlus size={14} /> Invite Member
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-surface-hover)', textAlign: 'left' }}>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Identity</th>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</th>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</th>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assets</th>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Seen</th>
                                                    <th style={{ padding: '14px 24px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredMembers.length > 0 ? filteredMembers.map((m, i) => (
                                                    <MemberRow key={m.id} m={m} idx={i} isAdmin={currentUserRole === 'admin'} token={token} activeUsers={activeUsers} onRefresh={fetchGovernanceData} onSelect={setSelectedMember} />
                                                )) : (
                                                    <tr>
                                                        <td colSpan={6} style={{ padding: 64, textAlign: 'center', color: 'var(--text-disabled)' }}>
                                                            <Users size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
                                                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                                                                {searchQuery ? 'No members match your search' : 'No members in this organization'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'workspaces' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                                    {workspaces.length > 0 ? workspaces.map((ws, i) => (
                                        <motion.div
                                            key={ws.id}
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: i * 0.05 }}
                                            style={{
                                                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                                                borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden',
                                            }}
                                        >
                                            <div style={{ position: 'absolute', top: -15, right: -15, width: 60, height: 60, background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent)', filter: 'blur(15px)' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Globe size={18} color="#3b82f6" />
                                                    </div>
                                                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{ws.name}</h3>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                                {[
                                                    { icon: Users, label: 'Members', value: ws._count?.members || 0 },
                                                    { icon: FileText, label: 'Files', value: ws._count?.files || 0 },
                                                    { icon: MessageCircle, label: 'Messages', value: ws._count?.messages || 0 },
                                                ].map(stat => (
                                                    <div key={stat.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                                                        <stat.icon size={14} style={{ color: 'var(--text-muted)', marginBottom: 4 }} />
                                                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{stat.value}</div>
                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 14 }}>
                                                Created {timeAgo(ws.createdAt)}
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 80, color: 'var(--text-disabled)' }}>
                                            <Globe size={48} style={{ opacity: 0.1, marginBottom: 12 }} />
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>No workspaces yet</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'audit' && (
                                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                                            <ShieldAlert size={16} color="#3b82f6" /> Security Audit Trail
                                        </h3>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                                            {auditLogs.length} events
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {auditLogs.length > 0 ? auditLogs.map((log, i) => {
                                            const config = ACTION_LABELS[log.action] || { label: log.action.toLowerCase().replace(/_/g, ' '), icon: Activity, color: '#64748b' };
                                            const LogIcon = config.icon;
                                            return (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    style={{
                                                        display: 'grid', gridTemplateColumns: '120px 200px 1fr 100px',
                                                        alignItems: 'center', padding: '14px 24px', gap: 16,
                                                        borderBottom: '1px solid var(--border-subtle)',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>
                                                        {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 1 }}>
                                                            {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Users size={12} color='var(--text-muted)' />
                                                        </div>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{getUserName(log.user)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                        <LogIcon size={13} color={config.color} />
                                                        {config.label}
                                                        {log.workspace && (
                                                            <span style={{ fontSize: 11, color: 'var(--text-disabled)', marginLeft: 4 }}>in {log.workspace.name}</span>
                                                        )}
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                                                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                                        }}>
                                                            logged
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        }) : (
                                            <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-disabled)' }}>
                                                <ShieldAlert size={40} style={{ opacity: 0.1, marginBottom: 12 }} />
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>No audit events recorded yet</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>Actions in workspaces will appear here automatically</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {inviteModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                            onClick={() => setInviteModalOpen(false)}
                            style={{ position: 'absolute', inset: 0, background: 'var(--bg-card)', backdropFilter: 'blur(8px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                position: 'relative', width: 440, background: 'var(--bg-main)', borderRadius: 24, padding: 32,
                                border: '1px solid var(--border-default)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
                            }}
                        >
                            <button onClick={() => setInviteModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <XCircle size={20} />
                            </button>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(99,102,241,0.25)' }}>
                                    <Mail size={24} color="#fff" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Invite Member</h2>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Send an email invitation to join {orgData?.name}</p>
                                </div>
                            </div>

                            <form onSubmit={handleInvite}>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Email Address</label>
                                    <input
                                        type="email" required autoFocus
                                        value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '12px 16px', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                                        onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--bg-elevated)'}
                                    />
                                </div>

                                <div style={{ marginBottom: 32 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Role</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {[
                                            { id: 'admin', label: 'Admin', desc: 'Full access' },
                                            { id: 'user', label: 'User', desc: 'Can create' },
                                            { id: 'member', label: 'Member', desc: 'Can collaborate' },
                                            { id: 'viewer', label: 'Viewer', desc: 'Read only' }
                                        ].map(r => (
                                            <div
                                                key={r.id} onClick={() => setInviteRole(r.id)}
                                                style={{
                                                    padding: 12, borderRadius: 12, cursor: 'pointer',
                                                    border: inviteRole === r.id ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                                                    background: inviteRole === r.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-surface)'
                                                }}
                                            >
                                                <div style={{ fontSize: 13, fontWeight: 700, color: inviteRole === r.id ? '#fff' : 'var(--text-secondary)' }}>{r.label}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={inviting || !inviteEmail}
                                    style={{
                                        width: '100%', padding: '14px', background: '#fff', color: 'var(--text-inverse)', border: 'none', borderRadius: 12,
                                        fontSize: 14, fontWeight: 800, cursor: (inviting || !inviteEmail) ? 'not-allowed' : 'pointer',
                                        opacity: (inviting || !inviteEmail) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                    }}
                                >
                                    {inviting ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                                    {inviting ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MEMBER SIDEBAR
// ═══════════════════════════════════════════════════════════════

const MemberSidebar = ({ member, onClose, worksaces, auditLogs, token, onRefresh, adminRole }: any) => {
    const { activeUsers } = useWorkspace();
    const isOnline = !!activeUsers[member.id];
    const theme = getRoleTheme(member.role);
    const [syncing, setSyncing] = useState(false);

    // Calc memberships
    const userWorkspaceIds = new Set(member.workspaceRoles?.map((w: any) => w.workspaceId) || []);

    const toggleWorkspace = async (wsId: string) => {
        const next = new Set(userWorkspaceIds);
        if (next.has(wsId)) next.delete(wsId);
        else next.add(wsId);

        try {
            setSyncing(true);
            const res = await fetch(`${API_URL}/api/organization/members/${member.id}/workspaces`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceIds: Array.from(next).map(id => ({ id, role: 'editor' })) })
            });
            if (res.ok) onRefresh();
        } finally {
            setSyncing(false);
        }
    };

    const userActions = auditLogs.filter((l: any) => l.user?.id === member.id);

    return (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
                position: 'fixed', top: 0, right: 0, width: 420, height: '100%',
                background: 'var(--bg-card)', backdropFilter: 'blur(32px)',
                borderLeft: '1px solid var(--border-default)', zIndex: 1000,
                boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
            }}
        >
            {/* Header */}
            <div style={{ padding: 24, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #334155, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}>
                            {member.avatarUrl ? <img src={member.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} /> : getUserName(member)[0]}
                        </div>
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: isOnline ? '#10b981' : '#64748b', border: '3px solid #0f172a' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{getUserName(member)}</h2>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={12} /> {member.email}
                        </div>
                        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: theme.bg, color: theme.color, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <theme.icon size={12} /> {theme.label}
                        </div>
                    </div>
                </div>
                <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-surface-hover)', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ArrowUpRight size={16} />
                </button>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 32px' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                    <div style={{ padding: 16, borderRadius: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{member.assets?.ownedFiles || 0}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assets Created</div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{member.assets?.auditActions || 0}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Actions</div>
                    </div>
                </div>

                {/* Workspace Access */}
                <div style={{ marginTop: 32 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={14} /> Workspace Access
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {worksaces.map((ws: any) => {
                            const hasAccess = userWorkspaceIds.has(ws.id);
                            return (
                                <div key={ws.id}
                                    onClick={() => (adminRole === 'admin' || adminRole === 'owner') && toggleWorkspace(ws.id)}
                                    style={{
                                        padding: '12px 16px', borderRadius: 12, background: hasAccess ? 'rgba(59,130,246,0.08)' : 'var(--bg-surface)',
                                        border: '1px solid', borderColor: hasAccess ? 'rgba(59,130,246,0.2)' : 'var(--bg-surface-hover)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (adminRole === 'admin' || adminRole === 'owner') ? 'pointer' : 'default', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasAccess ? '#3b82f6' : 'var(--bg-elevated)' }} />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: hasAccess ? '#fff' : 'var(--text-muted)' }}>{ws.name}</span>
                                    </div>
                                    {hasAccess ? <CheckCircle2 size={14} color="#3b82f6" /> : syncing ? <Loader2 className="animate-spin" size={14} color='var(--bg-elevated)' /> : null}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Activity */}
                <div style={{ marginTop: 32 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={14} /> Personal Activity
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {userActions.length > 0 ? userActions.slice(0, 10).map((log: any) => (
                            <div key={log.id} style={{ display: 'flex', gap: 12 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-disabled)', width: 60, flexShrink: 0, marginTop: 2 }}>{timeAgo(log.createdAt)}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    {ACTION_LABELS[log.action]?.label || log.action}
                                    {log.workspace && <span style={{ color: 'var(--text-muted)' }}> in {log.workspace.name}</span>}
                                </div>
                            </div>
                        )) : <div style={{ fontSize: 12, color: 'var(--text-disabled)' }}>No activity found.</div>}
                    </div>
                </div>
            </div>
            
            {/* Footer Actions */}
            {(adminRole === 'admin' || adminRole === 'owner') && (
                <div style={{ padding: 24, borderTop: '1px solid var(--border-default)', display: 'flex', gap: 12 }}>
                     <button style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                        Remove Member
                     </button>
                </div>
            )}
        </motion.div>
    );
};
