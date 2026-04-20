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
import { useToast } from '../../components/ui/Toast';

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
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden',
        }}
    >
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${color}15, transparent 70%)`, filter: 'blur(20px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', position: 'relative' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </motion.div>
);

const STATUS_THEME: Record<string, { color: string; glow: boolean; label: string }> = {
    online: { color: '#22c55e', glow: true, label: 'Online' },
    active: { color: '#10b981', glow: false, label: 'Active' },
    away:   { color: '#f59e0b', glow: false, label: 'Away' },
    offline:{ color: '#64748b', glow: false, label: 'Offline' },
};

const AVAILABLE_ROLES = ['admin', 'user', 'member', 'viewer'] as const;

const MemberRow = ({ m, idx, isAdmin, token, activeUsers, onRefresh, onSelect }: { m: any; idx: number; isAdmin: boolean; token?: string; activeUsers?: any; onRefresh: () => void; onSelect: () => void }) => {
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
            else { const err = await res.json(); alert(err.error || 'Failed to change role'); }
        } catch (e) { console.error(e); }
        finally { setActing(false); setRolePickerOpen(false); setMenuOpen(false); }
    };

    const handleRemove = async () => {
        if (acting) return;
        setActing(true);
        try {
            const res = await fetch(`${API_URL}/api/organization/members/${m.id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) onRefresh();
            else { const err = await res.json(); alert(err.error || 'Failed to remove member'); }
        } catch (e) { console.error(e); }
        finally { setActing(false); setConfirmRemove(false); setMenuOpen(false); }
    };

    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
            onClick={onSelect}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
            <td style={{ padding: '14px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', boxShadow: `0 4px 12px ${avatarColor}33`, flexShrink: 0 }}>
                            {(m.firstName?.charAt(0) || m.email.charAt(0)).toUpperCase()}
                        </div>
                        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: status.color, border: '2px solid #0d0d0d', boxShadow: status.glow ? `0 0 8px ${status.color}88` : 'none' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{getUserName(m)}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{m.email}</div>
                    </div>
                </div>
            </td>
            <td style={{ padding: '14px 24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: rt.bg, border: `1px solid ${rt.color}25` }}>
                    <RoleIcon size={12} color={rt.color} />
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
                    <span title="Files (owned + shared)" style={{ fontSize: 12, color: fileCount > 0 ? '#a78bfa' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: fileCount > 0 ? 700 : 500 }}><FileText size={12} /> {fileCount}</span>
                    <span title="Analyses run" style={{ fontSize: 12, color: analysisCount > 0 ? '#3b82f6' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: analysisCount > 0 ? 700 : 500 }}><BarChart3 size={12} /> {analysisCount}</span>
                    <span title="Messages" style={{ fontSize: 12, color: msgCount > 0 ? '#10b981' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: msgCount > 0 ? 700 : 500 }}><MessageCircle size={12} /> {msgCount}</span>
                    <span title="Workspaces" style={{ fontSize: 12, color: wsCount > 0 ? '#f59e0b' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: wsCount > 0 ? 700 : 500 }}><Globe size={12} /> {wsCount}</span>
                </div>
            </td>
            <td style={{ padding: '14px 24px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{timeAgo(m.lastLoginAt)}</td>
            <td style={{ padding: '14px 24px', textAlign: 'right', position: 'relative' }}>
                {isAdmin ? (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); setRolePickerOpen(false); setConfirmRemove(false); }}
                            style={{ background: menuOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 8px', color: menuOpen ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <MoreVertical size={14} />
                        </button>
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                    style={{ position: 'absolute', right: 24, top: '100%', marginTop: -4, zIndex: 50, background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6, minWidth: 180, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                                    {!rolePickerOpen && !confirmRemove ? (
                                        <>
                                            <button onClick={() => setRolePickerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'none', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                                <Shield size={14} color="#8b5cf6" /> Change Role
                                            </button>
                                            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                                            <button onClick={() => setConfirmRemove(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'none', border: 'none', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                                <XCircle size={14} /> Remove Member
                                            </button>
                                        </>
                                    ) : rolePickerOpen ? (
                                        <div style={{ padding: 4 }}>
                                            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Select Role</div>
                                            {AVAILABLE_ROLES.map(r => {
                                                const rTheme = getRoleTheme(r);
                                                const isCurrent = m.role === r;
                                                return (
                                                    <button key={r} onClick={() => handleRoleChange(r)} disabled={acting || isCurrent}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 10px', background: isCurrent ? 'rgba(255,255,255,0.04)' : 'none', border: 'none', borderRadius: 6, color: isCurrent ? 'rgba(255,255,255,0.3)' : '#fff', fontSize: 12, fontWeight: 600, cursor: isCurrent ? 'default' : 'pointer' }}
                                                        onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                                        onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = isCurrent ? 'rgba(255,255,255,0.04)' : 'none'; }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: rTheme.color }} />
                                                            <span style={{ textTransform: 'capitalize' }}>{r}</span>
                                                        </span>
                                                        {isCurrent && <CheckCircle2 size={13} color="rgba(255,255,255,0.3)" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                                            <AlertTriangle size={20} color="#ef4444" style={{ marginBottom: 8 }} />
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Remove {getUserName(m)}?</div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>They will lose access to this org.</div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => setConfirmRemove(false)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                                <button onClick={handleRemove} disabled={acting} style={{ flex: 1, padding: '8px', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: acting ? 0.5 : 1 }}>{acting ? '...' : 'Remove'}</button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                ) : (
                    <button style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 8px', color: 'rgba(255,255,255,0.15)', cursor: 'default' }}>
                        <MoreVertical size={14} />
                    </button>
                )}
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

    // Data
    const [orgData, setOrgData] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [currentUserRole, setCurrentUserRole] = useState<string>('user');
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    const selectedMember = useMemo(() => 
        members.find(m => m.id === selectedMemberId), 
        [members, selectedMemberId]
    );

    const handleRevokeInvite = async (invId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/organization/invitations/${invId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchGovernanceData();
                addToast('Invitation revoked.', 'info');
            }
        } catch (err) {
            addToast('Failed to revoke invitation.', 'error');
        }
    };

    const handleResendInvite = async (invId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/organization/invitations/${invId}/resend`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchGovernanceData();
                addToast('Invitation resent with a fresh link.', 'success');
            }
        } catch (err) {
            addToast('Failed to resend invitation.', 'error');
        }
    };

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
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${API_URL}/api/organization/governance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                // Fallback to base organization endpoint
                const fallbackRes = await fetch(`${API_URL}/api/organization`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (fallbackRes.ok) {
                    const data = await fallbackRes.json();
                    setOrgData(data.organization);
                    setMembers(data.members || []);
                    setStats({ totalMembers: data.members?.length || 0, activeMembers: data.members?.filter((m: any) => m.isActive).length || 0 });
                    if (data.currentUserRole) setCurrentUserRole(data.currentUserRole);
                    setWorkspaces([]);
                    setAuditLogs([]);
                    setInvitations([]);
                    setRecentMessages([]);
                } else {
                    const text = await res.text();
                    console.error('[Governance Error details]', text);
                    throw new Error('Failed to fetch organization data');
                }
                return;
            }

            const data = await res.json();
            setOrgData(data.organization);
            setMembers(data.members || []);
            setWorkspaces(data.workspaces || []);
            setAuditLogs(data.auditLogs || []);
            setInvitations(data.invitations || []);
            setRecentMessages(data.recentMessages || []);
            setStats(data.stats || {});
            if (data.currentUserRole) setCurrentUserRole(data.currentUserRole);
        } catch (err: any) {
            setError(err.message);
            console.error('Governance fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filtered members
    const filteredMembers = useMemo(() => {
        if (!searchQuery) return members;
        const q = searchQuery.toLowerCase();
        return members.filter(m =>
            getUserName(m).toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.role?.toLowerCase().includes(q)
        );
    }, [members, searchQuery]);

    // Storage percentage
    const storagePct = orgData ? Math.round((parseInt(stats.totalStorage || '0') / parseInt(orgData.storageLimit || '1')) * 100) : 0;

    const tabs: { id: TabId; label: string; icon: any; count?: number }[] = [
        { id: 'overview', label: 'Overview', icon: Layers },
        { id: 'members', label: 'Members', icon: Users, count: stats.totalMembers },
        { id: 'workspaces', label: 'Workspaces', icon: Globe, count: stats.totalWorkspaces },
        { id: 'audit', label: 'Audit Trail', icon: Activity, count: auditLogs.length },
    ];

    return (
        <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto', fontFamily: 'var(--font-main)', minHeight: '100%', position: 'relative' }}>
            {/* Ambient glow */}
            <div style={{ position: 'absolute', top: '-5%', left: '15%', width: '50vw', height: '40vh', background: 'radial-gradient(ellipse, rgba(139,92,246,0.06), transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Header */}
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
                            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 10 }}>
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
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>
                                Enterprise data governance, access controls & organizational intelligence
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchGovernanceData}
                    style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, padding: '10px 16px', color: 'rgba(255,255,255,0.6)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </motion.div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 28, position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.04)' }}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
                                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                border: 'none',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                flex: 1, justifyContent: 'center',
                            }}
                        >
                            <TabIcon size={15} />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span style={{
                                    fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                                    background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                                    minWidth: 16, textAlign: 'center'
                                }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, minHeight: 500 }}>
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
                        >
                            <Loader2 className="animate-spin" size={28} color="#8b5cf6" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Loading governance data...
                            </span>
                        </motion.div>
                    ) : error ? (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.4)' }}
                        >
                            <AlertTriangle size={40} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Failed to load governance data</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>{error}</div>
                            <button onClick={fetchGovernanceData} style={{ marginTop: 20, background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                                Retry
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                            {/* ═══ OVERVIEW TAB ═══ */}
                            {activeTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    {/* Stat Cards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                                        <StatCard icon={Users} label="Members" value={stats.totalMembers || 0} sub={`${stats.activeLastWeek || 0} active this week`} color="#8b5cf6" delay={0} />
                                        <StatCard icon={Globe} label="Workspaces" value={stats.totalWorkspaces || 0} sub={`${stats.totalDashboards || 0} dashboards`} color="#3b82f6" delay={0.05} />
                                        <StatCard icon={FileText} label="Datasets" value={stats.totalFiles || 0} sub={formatBytes(stats.totalStorage || '0') + ' stored'} color="#10b981" delay={0.1} />
                                        <StatCard icon={Zap} label="Analyses" value={stats.totalAnalyses || 0} sub="Total executed" color="#f59e0b" delay={0.15} />
                                    </div>

                                    {/* Two-column layout */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        {/* Role Distribution */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
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
                                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{role}</span>
                                                                </div>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{count} · {pct}%</span>
                                                            </div>
                                                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
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

                                            {/* Storage Usage */}
                                            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <HardDrive size={13} /> Storage Usage
                                                    </span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: storagePct > 80 ? '#ef4444' : '#10b981' }}>
                                                        {formatBytes(stats.totalStorage || '0')} / {formatBytes(orgData?.storageLimit || '0')}
                                                    </span>
                                                </div>
                                                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
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

                                        {/* Live Activity Feed */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
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
                                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                                                                    <strong style={{ color: '#fff' }}>{getUserName(log.user)}</strong>{' '}
                                                                    {config.label}
                                                                    {log.workspace && (
                                                                        <span style={{ color: 'rgba(255,255,255,0.35)' }}> in {log.workspace.name}</span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                                                                    {timeAgo(log.createdAt)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }) : (
                                                    <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)' }}>
                                                        <Activity size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                                                        <div style={{ fontSize: 12 }}>No activity recorded yet</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pending Invitations */}
                                        {invitations.length > 0 && (
                                            <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 16, padding: 20 }}>
                                                <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Mail size={15} /> Pending Invitations ({invitations.length})
                                                </h3>
                                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                    {invitations.map(inv => (
                                                        <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                                                            <Mail size={13} color="#f59e0b" />
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{inv.email}</span>
                                                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inv.role} · Expires {timeAgo(inv.expiresAt)}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                                                                <button 
                                                                    onClick={() => handleResendInvite(inv.id)}
                                                                    title="Resend Invitation"
                                                                    style={{ background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 4, padding: 4, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                                                                >
                                                                    <RefreshCw size={11} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleRevokeInvite(inv.id)}
                                                                    title="Revoke Invitation"
                                                                    style={{ background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 4, padding: 4, color: '#ef4444', cursor: 'pointer' }}
                                                                >
                                                                    <XCircle size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ═══ MEMBERS TAB ═══ */}
                            {activeTab === 'members' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', width: 320 }}>
                                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, or role..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '9px 16px 9px 36px', borderRadius: 10, color: '#fff', fontSize: 13, width: '100%', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                                                {filteredMembers.length} of {members.length}
                                            </span>
                                            {currentUserRole === 'admin' && (
                                                <button
                                                    onClick={() => setInviteModalOpen(true)}
                                                    style={{
                                                        background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px',
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
                                                <tr style={{ background: 'rgba(255,255,255,0.015)', textAlign: 'left' }}>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Identity</th>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</th>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</th>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assets</th>
                                                    <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Seen</th>
                                                    <th style={{ padding: '14px 24px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredMembers.length > 0 ? filteredMembers.map((m, i) => (
                                                    <MemberRow 
                                                        key={m.id} m={m} idx={i} 
                                                        isAdmin={currentUserRole === 'admin'} 
                                                        token={token} activeUsers={activeUsers} 
                                                        onRefresh={fetchGovernanceData} 
                                                        onSelect={() => setSelectedMemberId(m.id)}
                                                    />
                                                )) : (
                                                    <tr>
                                                        <td colSpan={6} style={{ padding: 64, textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>
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

                            {/* ═══ WORKSPACES TAB ═══ */}
                            {activeTab === 'workspaces' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                                    {workspaces.length > 0 ? workspaces.map((ws, i) => (
                                        <motion.div
                                            key={ws.id}
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: i * 0.05 }}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden',
                                            }}
                                        >
                                            <div style={{ position: 'absolute', top: -15, right: -15, width: 60, height: 60, background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent)', filter: 'blur(15px)' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Globe size={18} color="#3b82f6" />
                                                    </div>
                                                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#fff' }}>{ws.name}</h3>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                                {[
                                                    { icon: Users, label: 'Members', value: ws._count?.members || 0 },
                                                    { icon: FileText, label: 'Files', value: ws._count?.files || 0 },
                                                    { icon: MessageCircle, label: 'Messages', value: ws._count?.messages || 0 },
                                                ].map(stat => (
                                                    <div key={stat.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <stat.icon size={14} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 4 }} />
                                                        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{stat.value}</div>
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{stat.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 14 }}>
                                                Created {timeAgo(ws.createdAt)}
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.25)' }}>
                                            <Globe size={48} style={{ opacity: 0.1, marginBottom: 12 }} />
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>No workspaces yet</div>
                                        </div>
                                    )}

                                    {/* Access Matrix (Bulk Management) */}
                                    {currentUserRole === 'admin' && workspaces.length > 0 && (
                                        <div style={{ gridColumn: '1 / -1', marginTop: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 32 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                                                <div>
                                                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <Database size={18} color="#f59e0b" /> Access Control Matrix
                                                    </h3>
                                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>Manage all member workspace permissions in a high-density grid</p>
                                                </div>
                                            </div>
                                            <AccessMatrix 
                                                members={members} 
                                                workspaces={workspaces} 
                                                token={token} 
                                                onRefresh={fetchGovernanceData} 
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ═══ AUDIT LOG TAB ═══ */}
                            {activeTab === 'audit' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                                            <ShieldAlert size={16} color="#3b82f6" /> Security Audit Trail
                                        </h3>
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
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
                                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono, monospace)' }}>
                                                        {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>
                                                            {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Users size={12} color="rgba(255,255,255,0.5)" />
                                                        </div>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{getUserName(log.user)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                                                        <LogIcon size={13} color={config.color} />
                                                        {config.label}
                                                        {log.workspace && (
                                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>in {log.workspace.name}</span>
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
                                            <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.2)' }}>
                                                <ShieldAlert size={40} style={{ opacity: 0.1, marginBottom: 12 }} />
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>No audit events recorded yet</div>
                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Actions in workspaces will appear here automatically</div>
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
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                position: 'relative', width: 440, background: '#121212', borderRadius: 24, padding: 32,
                                border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
                            }}
                        >
                            <button onClick={() => setInviteModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                                <XCircle size={20} />
                            </button>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(99,102,241,0.25)' }}>
                                    <Mail size={24} color="#fff" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Invite Member</h2>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Send an email invitation to join {orgData?.name}</p>
                                </div>
                            </div>

                            <form onSubmit={handleInvite}>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Email Address</label>
                                    <input
                                        type="email" required autoFocus
                                        value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                                        onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>

                                <div style={{ marginBottom: 32 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Role</label>
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
                                                    background: inviteRole === r.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)'
                                                }}
                                            >
                                                <div style={{ fontSize: 13, fontWeight: 700, color: inviteRole === r.id ? '#fff' : 'rgba(255,255,255,0.7)' }}>{r.label}</div>
                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{r.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={inviting || !inviteEmail}
                                    style={{
                                        width: '100%', padding: '14px', background: '#fff', color: '#000', border: 'none', borderRadius: 12,
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

            {/* Member Details Sidebar */}
            <AnimatePresence>
                {selectedMember && (
                    <MemberDetailsSidebar 
                        member={selectedMember} 
                        token={token} 
                        allWorkspaces={workspaces}
                        onClose={() => setSelectedMemberId(null)}
                        onRefresh={fetchGovernanceData}
                        isAdmin={currentUserRole === 'admin'}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

    );
};

const AccessMatrix = ({ members, workspaces, token, onRefresh }: { members: any[]; workspaces: any[]; token?: string; onRefresh: () => void }) => {
    const { addToast } = useToast();
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    
    const handleToggle = async (memberId: string, wsId: string, currentIds: string[]) => {
        const opId = `${memberId}-${wsId}`;
        if (updatingIds.includes(opId)) return;
        
        const isRemoving = currentIds.includes(wsId);
        const newIds = isRemoving ? currentIds.filter(id => id !== wsId) : [...currentIds, wsId];
        
        setUpdatingIds(prev => [...prev, opId]);
        try {
            const res = await fetch(`${API_URL}/api/organization/members/${memberId}/workspaces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ workspaceIds: newIds })
            });
            if (res.ok) onRefresh();
            else addToast('Access update failed.', 'error');
        } catch (e) { addToast('Network error.', 'error'); }
        finally { setUpdatingIds(prev => prev.filter(id => id !== opId)); }
    };

    return (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Member Identity</th>
                        {workspaces.map(ws => (
                            <th key={ws.id} style={{ padding: '14px 20px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', textAlign: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <Globe size={12} color="#3b82f6" />
                                    {ws.name}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {members.map(m => {
                        const mWsIds = m.workspaces?.map((w: any) => w.id) || [];
                        return (
                            <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '12px 20px' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{getUserName(m)}</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{m.email}</div>
                                </td>
                                {workspaces.map(ws => {
                                    const isIncluded = mWsIds.includes(ws.id);
                                    const isUpdating = updatingIds.includes(`${m.id}-${ws.id}`);
                                    return (
                                        <td key={ws.id} style={{ padding: '12px 20px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleToggle(m.id, ws.id, mWsIds)}
                                                disabled={isUpdating}
                                                style={{ 
                                                    background: 'none', border: 'none', cursor: isUpdating ? 'wait' : 'pointer',
                                                    color: isIncluded ? '#10b981' : 'rgba(255,255,255,0.05)',
                                                    transition: 'all 0.2s', opacity: isUpdating ? 0.3 : 1
                                                }}
                                            >
                                                {isIncluded ? <CheckCircle2 size={16} /> : <div style={{ width: 14, height: 14, borderRadius: 4, border: '2px solid currentColor', margin: '0 auto' }} />}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const PolicyMatrix = () => {
    const policies = [
        { feature: 'Workspace Creation', roles: { admin: true, user: true, member: false, viewer: false } },
        { feature: 'Member Management', roles: { admin: true, user: false, member: false, viewer: false } },
        { feature: 'Data Source Connectors', roles: { admin: true, user: true, member: true, viewer: false } },
        { feature: 'BI Dashboard Publish', roles: { admin: true, user: true, member: false, viewer: false } },
        { feature: 'Security Audit View', roles: { admin: true, user: false, member: false, viewer: false } },
        { feature: 'LLM Policy Control', roles: { admin: true, user: false, member: false, viewer: false } },
    ];
    
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Capability</th>
                        <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', textAlign: 'center' }}>Admin</th>
                        <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', textAlign: 'center' }}>User</th>
                        <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', textAlign: 'center' }}>Member</th>
                        <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Viewer</th>
                    </tr>
                </thead>
                <tbody>
                    {policies.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{p.feature}</td>
                            {Object.values(p.roles).map((allowed, j) => (
                                <td key={j} style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    {allowed ? <CheckCircle2 size={14} color="#10b981" /> : <XCircle size={14} color="rgba(255,255,255,0.1)" />}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

interface MemberDetailsSidebarProps {
    member: any;
    token?: string;
    allWorkspaces: any[];
    onClose: () => void;
    onRefresh: () => void;
    isAdmin: boolean;
}

const MemberDetailsSidebar = ({ member, token, allWorkspaces, onClose, onRefresh, isAdmin }: MemberDetailsSidebarProps) => {
    const { addToast } = useToast();
    const [updating, setUpdating] = useState(false);
    const [activeWsIds, setActiveWsIds] = useState<string[]>(member.workspaces?.map((w: any) => w.id) || []);

    const toggleWorkspace = async (wsId: string) => {
        if (!isAdmin || updating) return;
        const isRemoving = activeWsIds.includes(wsId);
        const newIds = isRemoving 
            ? activeWsIds.filter(id => id !== wsId)
            : [...activeWsIds, wsId];
        
        setActiveWsIds(newIds);
        setUpdating(true);
        try {
            const res = await fetch(`${API_URL}/api/organization/members/${member.id}/workspaces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ workspaceIds: newIds })
            });
            if (res.ok) {
                onRefresh();
                addToast(isRemoving ? 'Access revoked.' : 'Access granted.', 'success');
            } else {
                addToast('Failed to update workspace access.', 'error');
                setActiveWsIds(activeWsIds); // Revert UI
            }
        } catch (e) { 
            console.error(e);
            addToast('Network error during access update.', 'error');
            setActiveWsIds(activeWsIds); // Revert UI
        }
        finally { setUpdating(false); }
    };

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#eab308'];
    const avatarColor = colors[(member.email || '').charCodeAt(0) % colors.length];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', justifyContent: 'flex-end' }}>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ 
                    position: 'relative', width: 480, height: '100%', background: '#0d0d0d', 
                    borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                        <XCircle size={18} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', boxShadow: `0 12px 32px ${avatarColor}44` }}>
                            {(member.firstName?.charAt(0) || member.email.charAt(0)).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{getUserName(member)}</h2>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{member.email}</p>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Owned Assets</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: '#8b5cf6' }}>{member.files?.length || 0}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Files & Datasets</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Nalyse Activity</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: '#3b82f6' }}>{member.messages?.length || 0}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Total Interations</div>
                        </div>
                    </div>

                    {/* Workspace Matrix */}
                    <div style={{ marginBottom: 40 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Globe size={16} color="#3b82f6" /> Workspace Access Control
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {allWorkspaces.map(ws => {
                                const isActive = activeWsIds.includes(ws.id);
                                return (
                                    <div 
                                        key={ws.id}
                                        onClick={() => toggleWorkspace(ws.id)}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                            padding: '12px 16px', background: isActive ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.01)', 
                                            borderRadius: 12, border: `1px solid ${isActive ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)'}`,
                                            cursor: isAdmin ? 'pointer' : 'default', transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: isActive ? '#3b82f6' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Globe size={14} color={isActive ? '#fff' : 'rgba(255,255,255,0.3)'} />
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)' }}>{ws.name}</span>
                                        </div>
                                        {isActive ? (
                                            <div style={{ width: 18, height: 18, borderRadius: 6, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <CheckCircle2 size={12} color="#fff" />
                                            </div>
                                        ) : (
                                            <div style={{ width: 18, height: 18, borderRadius: 6, border: '2px solid rgba(255,255,255,0.1)' }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px' }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Member Since</span>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{new Date(member.createdAt).toLocaleDateString()}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Last Activity</span>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{timeAgo(member.lastLoginAt)}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Platform Role</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>{member.role}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '24px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
                    <button 
                        onClick={onClose}
                        style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                        Close Profile
                    </button>
                    {isAdmin && (
                         <button 
                            onClick={() => { onClose(); /* Handle secondary action if needed */ }}
                            style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                        >
                            Audit Activity
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
