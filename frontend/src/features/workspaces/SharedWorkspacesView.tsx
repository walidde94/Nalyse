import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { API_URL } from '../../config';
import {
    Users, Shield, Trash2, UserPlus, Settings, Plus, Search,
    FileText, FileSpreadsheet, BarChart3, Eye, Clock, ArrowUpRight,
    Share2, ChevronRight, Activity, Database, Lock, Unlock, X,
    CheckCircle2, AlertTriangle, Layers, Zap, Globe, Upload, Download,
    UserCheck, Crown, Edit3, FileJson, HardDrive, TrendingUp, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface OrgMember {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role?: string;
    avatarUrl?: string;
    lastLoginAt?: string;
}

interface SharedFile {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
    isProcessed: boolean;
    hasAnalysis: boolean;
    latestAnalysisId: string | null;
    latestAnalysisDate: string | null;
    owner: { id: string; email: string; displayName?: string; firstName?: string; lastName?: string; avatarUrl?: string };
}

interface SharedAnalysis {
    id: string;
    status: string;
    completedAt: string;
    results: any;
    insights: any;
    statistics: any;
    file: { id: string; originalName: string; filename: string; mimeType: string; size: number };
    createdBy: { id: string; email: string; displayName?: string; firstName?: string; lastName?: string; avatarUrl?: string };
}

interface ActivityLog {
    id: string;
    action: string;
    entityId: string | null;
    details: any;
    createdAt: string;
    user?: { displayName?: string; email: string };
}

type TabId = 'team' | 'data' | 'analysis' | 'activity';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

const getUserName = (u: any) => {
    if (u?.displayName) return u.displayName;
    if (u?.firstName) return `${u.firstName} ${u.lastName || ''}`.trim();
    return u?.email?.split('@')[0] || 'Unknown';
};

const getInitials = (u: any) => {
    const name = getUserName(u);
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
};

const getFileIcon = (mime: string) => {
    if (mime?.includes('json')) return <FileJson size={16} />;
    if (mime?.includes('csv') || mime?.includes('spreadsheet') || mime?.includes('excel')) return <FileSpreadsheet size={16} />;
    return <FileText size={16} />;
};

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    admin: { label: 'Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Crown },
    editor: { label: 'Editor', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: Edit3 },
    viewer: { label: 'Viewer', color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: Eye }
};

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    WORKSPACE_CREATED: { label: 'created workspace', icon: Plus, color: '#10b981' },
    MEMBER_ADDED: { label: 'added a member', icon: UserPlus, color: '#3b82f6' },
    MEMBER_REMOVED: { label: 'removed a member', icon: Trash2, color: '#ef4444' },
    MEMBER_ROLE_UPDATED: { label: 'updated a role', icon: Shield, color: '#f59e0b' },
    FILE_SHARED: { label: 'shared a file', icon: Share2, color: '#8b5cf6' },
    FILE_UNSHARED: { label: 'unshared a file', icon: Lock, color: '#64748b' },
};

// ═══════════════════════════════════════════════════════════════
// AVATAR COMPONENT
// ═══════════════════════════════════════════════════════════════

const UserAvatar = ({ user, size = 40, showStatus = false, isOnline = false }: { user: any; size?: number; showStatus?: boolean; isOnline?: boolean }) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
    const idx = (user?.email || '').charCodeAt(0) % colors.length;
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" style={{ width: size, height: size, borderRadius: size * 0.3, objectFit: 'cover' }} />
            ) : (
                <div style={{
                    width: size, height: size, borderRadius: size * 0.3,
                    background: `linear-gradient(135deg, ${colors[idx]}cc, ${colors[idx]}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: size * 0.35, fontWeight: 800, color: '#fff',
                    letterSpacing: '-0.02em', boxShadow: `0 4px 12px ${colors[idx]}33`
                }}>
                    {getInitials(user)}
                </div>
            )}
            {showStatus && (
                <div style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: size * 0.3, height: size * 0.3, borderRadius: '50%',
                    background: isOnline ? '#22c55e' : '#64748b',
                    border: '2px solid var(--bg-main)',
                    boxShadow: isOnline ? '0 0 8px rgba(34,197,94,0.5)' : 'none'
                }} />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// SHARE FILE MODAL
// ═══════════════════════════════════════════════════════════════

const ShareFileModal = ({ workspaceId, workspaceName, token, onClose, onShared }: {
    workspaceId: string; workspaceName: string; token: string; onClose: () => void; onShared: () => void;
}) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await fetch(`${API_URL}/api/workspaces/my-unshared-files`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setFiles(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchFiles();
    }, [token]);

    const handleShare = async (fileId: string) => {
        setSharing(fileId);
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/share-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ fileId })
            });
            if (res.ok) {
                setFiles(prev => prev.filter(f => f.id !== fileId));
                onShared();
            }
        } catch (e) { console.error(e); }
        finally { setSharing(null); }
    };

    const filtered = files.filter(f =>
        (f.originalName || f.filename).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--bg-main)', borderRadius: 24,
                    border: '1px solid var(--border-subtle)',
                    width: '100%', maxWidth: 560, maxHeight: '80vh',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.4)'
                }}
            >
                {/* Header */}
                <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            Share Files
                        </h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 12, color: 'var(--text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        Select files to share with <strong style={{ color: 'var(--primary)' }}>{workspaceName}</strong>
                    </p>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        background: 'var(--bg-app)', borderRadius: 14, border: '1px solid var(--border-subtle)',
                        marginBottom: 20
                    }}>
                        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <input
                            placeholder="Search your files..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{
                                background: 'none', border: 'none', outline: 'none', width: '100%',
                                fontSize: 13, color: 'var(--text-primary)', fontWeight: 500
                            }}
                        />
                    </div>
                </div>

                {/* File List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <div className="animate-spin" style={{ display: 'inline-block' }}><Settings size={24} /></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Database size={32} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 12 }} />
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {search ? 'No matching files' : 'All files are already shared'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filtered.map(f => (
                                <div key={f.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', borderRadius: 14,
                                    border: '1px solid var(--border-subtle)',
                                    background: sharing === f.id ? 'var(--primary-subtle)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            background: 'var(--primary-subtle)', color: 'var(--primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            {getFileIcon(f.mimeType)}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {f.originalName || f.filename}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                                {formatBytes(f.size)} · {timeAgo(f.createdAt)}
                                                {f.isProcessed && <span style={{ color: '#10b981', marginLeft: 8 }}>● Analyzed</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleShare(f.id)}
                                        disabled={sharing === f.id}
                                        style={{
                                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                            color: '#fff', border: 'none', borderRadius: 10,
                                            padding: '8px 16px', fontSize: 12, fontWeight: 700,
                                            cursor: 'pointer', flexShrink: 0, opacity: sharing === f.id ? 0.5 : 1,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {sharing === f.id ? '...' : 'Share'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const SharedWorkspacesView = () => {
    const { token, user } = useAuth();
    const { workspaces, refreshWorkspaces, activeUsers, activityFeed } = useWorkspace();

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
    const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [sharedAnalyses, setSharedAnalyses] = useState<SharedAnalysis[]>([]);
    const [wsActivity, setWsActivity] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('team');
    const [showShareModal, setShowShareModal] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    // Set default workspace
    useEffect(() => {
        if (workspaces.length > 0 && !selectedWorkspaceId) {
            setSelectedWorkspaceId(workspaces[0].id);
        }
    }, [workspaces]);

    // Fetch org members
    useEffect(() => {
        const fetchOrgMembers = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/organization`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrgMembers(data.members || []);
                }
            } catch (error) {
                console.error('Failed to fetch organization members:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrgMembers();
    }, [token]);

    // Fetch workspace-specific data when workspace changes
    const fetchWorkspaceData = useCallback(async () => {
        if (!token || !selectedWorkspaceId) return;
        try {
            const [filesRes, analysesRes, activityRes] = await Promise.all([
                fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/files`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/analyses`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/activity`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (filesRes.ok) setSharedFiles(await filesRes.json());
            if (analysesRes.ok) setSharedAnalyses(await analysesRes.json());
            if (activityRes.ok) setWsActivity(await activityRes.json());
        } catch (e) { console.error('Failed to fetch workspace data:', e); }
    }, [token, selectedWorkspaceId]);

    useEffect(() => { fetchWorkspaceData(); }, [fetchWorkspaceData]);

    // Listen for real-time workspace updates
    useEffect(() => {
        const handler = () => { fetchWorkspaceData(); };
        window.addEventListener('workspace:global_update', handler);
        return () => window.removeEventListener('workspace:global_update', handler);
    }, [fetchWorkspaceData]);

    const activeWorkspace = workspaces.find((w: any) => w.id === selectedWorkspaceId) as any;
    const isCurrentUserAdmin = activeWorkspace?.members?.some((m: any) => m.userId === user?.id && m.role === 'admin');
    const currentUserRole = activeWorkspace?.members?.find((m: any) => m.userId === user?.id)?.role || 'viewer';

    // ─── HANDLERS ─────────────────────────────────────────────────────

    const handleAddMember = async (userId: string, role: string = 'viewer') => {
        if (!selectedWorkspaceId || isUpdating) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetUserId: userId, role })
            });
            if (res.ok) await refreshWorkspaces();
            else { const err = await res.json(); alert(err.error || 'Failed'); }
        } catch (e) { console.error(e); }
        finally { setIsUpdating(false); }
    };

    const handleUpdateRole = async (userId: string, targetRole: string) => {
        if (!selectedWorkspaceId || isUpdating) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/members/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ role: targetRole })
            });
            if (res.ok) await refreshWorkspaces();
        } catch (e) { console.error(e); }
        finally { setIsUpdating(false); }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!selectedWorkspaceId || isUpdating) return;
        if (!confirm('Remove this member from the workspace?')) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/members/${userId}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) await refreshWorkspaces();
        } catch (e) { console.error(e); }
        finally { setIsUpdating(false); }
    };

    const handleUnshareFile = async (fileId: string) => {
        if (!selectedWorkspaceId) return;
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/unshare-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ fileId })
            });
            if (res.ok) fetchWorkspaceData();
        } catch (e) { console.error(e); }
    };

    const handleCreateWorkspace = async () => {
        const name = prompt('Enter a name for the new workspace:');
        if (!name || isCreating) return;
        setIsCreating(true);
        try {
            const orgId = (user as any)?.organizationId || orgMembers[0]?.id;
            const userObj = await fetch(`${API_URL}/api/organization`, { headers: { Authorization: `Bearer ${token}` } });
            const orgData = await userObj.json();
            const res = await fetch(`${API_URL}/api/workspaces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, organizationId: orgData.organization?.id || orgId })
            });
            if (res.ok) {
                const newWs = await res.json();
                await refreshWorkspaces();
                setSelectedWorkspaceId(newWs.id);
            }
        } catch (e) { console.error(e); }
        finally { setIsCreating(false); }
    };

    // ─── COMPUTED DATA ────────────────────────────────────────────────

    const wsMembers = useMemo(() => activeWorkspace?.members || [], [activeWorkspace]);
    const wsMemberIds = useMemo(() => new Set(wsMembers.map((m: any) => m.userId)), [wsMembers]);
    
    const filteredOrgMembers = useMemo(() => {
        if (!memberSearch) return orgMembers;
        const q = memberSearch.toLowerCase();
        return orgMembers.filter(m =>
            m.email.toLowerCase().includes(q) ||
            (m.firstName || '').toLowerCase().includes(q) ||
            (m.lastName || '').toLowerCase().includes(q)
        );
    }, [orgMembers, memberSearch]);

    const tabs: { id: TabId; label: string; icon: any; count?: number }[] = [
        { id: 'team', label: 'Team', icon: Users, count: wsMembers.length },
        { id: 'data', label: 'Shared Data', icon: Database, count: sharedFiles.length },
        { id: 'analysis', label: 'Analysis Hub', icon: BarChart3, count: sharedAnalyses.length },
        { id: 'activity', label: 'Activity', icon: Activity, count: wsActivity.length }
    ];

    // ─── LOADING STATE ────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                <div className="animate-spin" style={{ color: 'var(--primary)' }}><Settings size={32} /></div>
            </div>
        );
    }

    // ─── RENDER ───────────────────────────────────────────────────────

    return (
        <div style={{
            fontFamily: 'var(--font-main)', height: '100%', overflowY: 'auto',
            background: 'var(--bg-app)', position: 'relative', zIndex: 10
        }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 64px' }}>
                
                {/* ─── HEADER ──────────────────────────────────────────── */}
                <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{
                            fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em',
                            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 14
                        }}>
                            <div style={{
                                padding: 12, borderRadius: 16,
                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                                boxShadow: '0 8px 24px -8px var(--primary-glow)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Users size={24} color="#fff" />
                            </div>
                            Collaboration Hub
                        </h1>
                        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)', maxWidth: 500, lineHeight: 1.6 }}>
                            Share datasets, analyses, and dashboards with your team. Manage access across your organization.
                        </p>
                    </div>
                    <button
                        onClick={handleCreateWorkspace}
                        disabled={isCreating}
                        style={{
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            color: '#fff', border: 'none', borderRadius: 14,
                            padding: '12px 24px', fontSize: 13, fontWeight: 800,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 8px 24px -8px var(--primary-glow)',
                            letterSpacing: '0.02em', transition: 'all 0.2s'
                        }}
                    >
                        <Plus size={18} /> New Workspace
                    </button>
                </div>

                {/* ─── WORKSPACE SELECTOR (Horizontal Pills) ───────────── */}
                <div style={{
                    display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto',
                    padding: '4px 0', WebkitOverflowScrolling: 'touch'
                }}>
                    {workspaces.map((ws: any) => {
                        const isActive = selectedWorkspaceId === ws.id;
                        const memberCount = ws.members?.length || 1;
                        return (
                            <button
                                key={ws.id}
                                onClick={() => setSelectedWorkspaceId(ws.id)}
                                style={{
                                    background: isActive
                                        ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                                        : 'var(--bento-glass)',
                                    color: isActive ? '#fff' : 'var(--text-primary)',
                                    border: `1px solid ${isActive ? 'transparent' : 'var(--border-subtle)'}`,
                                    borderRadius: 14, padding: '10px 20px',
                                    fontSize: 13, fontWeight: isActive ? 800 : 600,
                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    transition: 'all 0.25s ease',
                                    boxShadow: isActive ? '0 6px 20px -6px var(--primary-glow)' : 'none',
                                    flexShrink: 0
                                }}
                            >
                                <Globe size={14} style={{ opacity: 0.8 }} />
                                {ws.name}
                                <span style={{
                                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                    background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-app)',
                                    fontWeight: 700
                                }}>
                                    {memberCount}
                                </span>
                            </button>
                        );
                    })}
                    {workspaces.length === 0 && (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0', fontStyle: 'italic' }}>
                            No workspaces yet. Create one to start collaborating.
                        </div>
                    )}
                </div>

                {/* ─── MAIN CONTENT ────────────────────────────────────── */}
                {activeWorkspace ? (
                    <div style={{
                        background: 'var(--bento-card)', borderRadius: 24,
                        border: '1px solid var(--border-subtle)',
                        boxShadow: '0 20px 60px -20px rgba(0,0,0,0.3)',
                        overflow: 'hidden'
                    }}>
                        {/* Tab Bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 0,
                            borderBottom: '1px solid var(--border-subtle)',
                            padding: '0 24px', overflowX: 'auto'
                        }}>
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            background: 'none', border: 'none',
                                            padding: '16px 20px',
                                            fontSize: 13, fontWeight: isActive ? 800 : 600,
                                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                            borderBottom: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                                            transition: 'all 0.2s', whiteSpace: 'nowrap',
                                            marginBottom: -1
                                        }}
                                    >
                                        <Icon size={16} />
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 800, padding: '2px 7px',
                                                borderRadius: 10,
                                                background: isActive ? 'var(--primary-subtle)' : 'var(--bg-app)',
                                                color: isActive ? 'var(--primary)' : 'var(--text-muted)'
                                            }}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                            <div style={{ flex: 1 }} />
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 10,
                                background: isCurrentUserAdmin ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                border: `1px solid ${isCurrentUserAdmin ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                fontSize: 11, fontWeight: 800,
                                color: isCurrentUserAdmin ? '#10b981' : '#f59e0b',
                                textTransform: 'uppercase', letterSpacing: '0.08em'
                            }}>
                                {isCurrentUserAdmin ? <Crown size={12} /> : <Eye size={12} />}
                                {currentUserRole}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div style={{ padding: 28, minHeight: 400 }}>
                            <AnimatePresence mode="wait">
                                {activeTab === 'team' && (
                                    <motion.div key="team" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                        {/* Search bar */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                            <div style={{
                                                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '10px 16px', background: 'var(--bg-app)',
                                                borderRadius: 14, border: '1px solid var(--border-subtle)'
                                            }}>
                                                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                                                <input
                                                    placeholder="Search organization members..."
                                                    value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                                                    style={{
                                                        background: 'none', border: 'none', outline: 'none', width: '100%',
                                                        fontSize: 13, color: 'var(--text-primary)', fontWeight: 500
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Members section */}
                                        <div style={{ marginBottom: 20 }}>
                                            <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                                                Workspace Members ({wsMembers.length})
                                            </h4>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {filteredOrgMembers.map(orgUser => {
                                                const wsMember = wsMembers.find((m: any) => m.userId === orgUser.id);
                                                const isSelf = orgUser.id === user?.id;
                                                const isOnline = !!activeUsers[orgUser.id];
                                                const roleConf = wsMember ? ROLE_CONFIG[wsMember.role] || ROLE_CONFIG.viewer : null;

                                                return (
                                                    <div key={orgUser.id} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '14px 18px', borderRadius: 16,
                                                        border: `1px solid ${wsMember ? 'var(--border-subtle)' : 'transparent'}`,
                                                        background: wsMember ? 'var(--bento-glass)' : 'transparent',
                                                        transition: 'all 0.2s', gap: 12
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                                                            <UserAvatar user={orgUser} size={42} showStatus isOnline={isOnline} />
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                        {getUserName(orgUser)}
                                                                    </span>
                                                                    {isSelf && (
                                                                        <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 6, background: 'var(--primary-subtle)', color: 'var(--primary)', fontWeight: 700 }}>
                                                                            You
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {orgUser.email}
                                                                    {orgUser.lastLoginAt && (
                                                                        <span style={{ marginLeft: 8, opacity: 0.6 }}>· Last seen {timeAgo(orgUser.lastLoginAt)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {wsMember ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                                                {isCurrentUserAdmin && !isSelf ? (
                                                                    <select
                                                                        value={wsMember.role}
                                                                        onChange={e => handleUpdateRole(orgUser.id, e.target.value)}
                                                                        disabled={isUpdating}
                                                                        style={{
                                                                            background: roleConf?.bg || 'var(--bg-main)',
                                                                            border: '1px solid var(--border-subtle)',
                                                                            borderRadius: 10, padding: '6px 12px',
                                                                            fontSize: 12, fontWeight: 700,
                                                                            color: roleConf?.color || 'var(--text-secondary)',
                                                                            outline: 'none', cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <option value="viewer">Viewer</option>
                                                                        <option value="editor">Editor</option>
                                                                        <option value="admin">Admin</option>
                                                                    </select>
                                                                ) : (
                                                                    <div style={{
                                                                        padding: '6px 14px', borderRadius: 10,
                                                                        background: roleConf?.bg, color: roleConf?.color,
                                                                        fontSize: 12, fontWeight: 700,
                                                                        display: 'flex', alignItems: 'center', gap: 6
                                                                    }}>
                                                                        {roleConf && <roleConf.icon size={12} />}
                                                                        {roleConf?.label}
                                                                    </div>
                                                                )}
                                                                {isCurrentUserAdmin && !isSelf && (
                                                                    <button
                                                                        onClick={() => handleRemoveMember(orgUser.id)}
                                                                        disabled={isUpdating}
                                                                        style={{
                                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                                            padding: 8, borderRadius: 10, color: '#ef4444',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                        title="Remove from workspace"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                                {isCurrentUserAdmin ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleAddMember(orgUser.id, 'viewer')}
                                                                            disabled={isUpdating}
                                                                            style={{
                                                                                background: 'none', border: '1px solid var(--border-subtle)',
                                                                                borderRadius: 10, padding: '6px 14px',
                                                                                fontSize: 12, fontWeight: 700,
                                                                                color: 'var(--text-secondary)', cursor: 'pointer',
                                                                                transition: 'all 0.2s'
                                                                            }}
                                                                        >
                                                                            <Eye size={12} style={{ marginRight: 4 }} /> Viewer
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAddMember(orgUser.id, 'editor')}
                                                                            disabled={isUpdating}
                                                                            style={{
                                                                                background: 'var(--primary-subtle)', border: '1px solid var(--primary)',
                                                                                borderRadius: 10, padding: '6px 14px',
                                                                                fontSize: 12, fontWeight: 700,
                                                                                color: 'var(--primary)', cursor: 'pointer',
                                                                                display: 'flex', alignItems: 'center', gap: 4,
                                                                                transition: 'all 0.2s'
                                                                            }}
                                                                        >
                                                                            <UserPlus size={12} /> Editor
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.6 }}>
                                                                        Not in workspace
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'data' && (
                                    <motion.div key="data" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                        {/* Header with Share button */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                            <div>
                                                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                                                    Shared Datasets
                                                </h3>
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                                    {sharedFiles.length} file{sharedFiles.length !== 1 ? 's' : ''} shared in this workspace
                                                </p>
                                            </div>
                                            {(currentUserRole === 'admin' || currentUserRole === 'editor') && (
                                                <button
                                                    onClick={() => setShowShareModal(true)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                                        color: '#fff', border: 'none', borderRadius: 12,
                                                        padding: '10px 20px', fontSize: 13, fontWeight: 700,
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                                        boxShadow: '0 6px 20px -6px var(--primary-glow)'
                                                    }}
                                                >
                                                    <Share2 size={15} /> Share Files
                                                </button>
                                            )}
                                        </div>

                                        {sharedFiles.length === 0 ? (
                                            <div style={{
                                                textAlign: 'center', padding: '60px 20px',
                                                border: '2px dashed var(--border-subtle)', borderRadius: 20
                                            }}>
                                                <Database size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
                                                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>No shared files yet</p>
                                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                    Share files from your datasets to make them accessible to workspace members.
                                                </p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {sharedFiles.map(f => (
                                                    <div key={f.id} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '14px 18px', borderRadius: 16,
                                                        border: '1px solid var(--border-subtle)',
                                                        background: 'var(--bento-glass)', transition: 'all 0.2s', gap: 12
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                                                            <div style={{
                                                                width: 42, height: 42, borderRadius: 12,
                                                                background: f.hasAnalysis ? 'rgba(16,185,129,0.1)' : 'var(--primary-subtle)',
                                                                color: f.hasAnalysis ? '#10b981' : 'var(--primary)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                            }}>
                                                                {f.hasAnalysis ? <CheckCircle2 size={18} /> : getFileIcon(f.mimeType)}
                                                            </div>
                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {f.originalName || f.filename}
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginTop: 3, flexWrap: 'wrap' }}>
                                                                    <span>{formatBytes(f.size)}</span>
                                                                    <span>·</span>
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                        <UserAvatar user={f.owner} size={16} />
                                                                        {getUserName(f.owner)}
                                                                    </span>
                                                                    <span>·</span>
                                                                    <span>{timeAgo(f.createdAt)}</span>
                                                                    {f.hasAnalysis && (
                                                                        <>
                                                                            <span>·</span>
                                                                            <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Analyzed</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                            {f.hasAnalysis && (
                                                                <div style={{
                                                                    padding: '6px 12px', borderRadius: 10,
                                                                    background: 'rgba(16,185,129,0.08)', color: '#10b981',
                                                                    fontSize: 11, fontWeight: 700,
                                                                    display: 'flex', alignItems: 'center', gap: 4
                                                                }}>
                                                                    <BarChart3 size={12} /> View Analysis
                                                                </div>
                                                            )}
                                                            {(currentUserRole === 'admin' || (f.owner?.id === user?.id)) && (
                                                                <button
                                                                    onClick={() => handleUnshareFile(f.id)}
                                                                    style={{
                                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                                        padding: 8, borderRadius: 10, color: 'var(--text-muted)',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    title="Remove from workspace"
                                                                >
                                                                    <X size={15} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'analysis' && (
                                    <motion.div key="analysis" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                        <div style={{ marginBottom: 24 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                                                Shared Analysis Results
                                            </h3>
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                                Completed analyses from shared datasets, accessible to all workspace members.
                                            </p>
                                        </div>

                                        {sharedAnalyses.length === 0 ? (
                                            <div style={{
                                                textAlign: 'center', padding: '60px 20px',
                                                border: '2px dashed var(--border-subtle)', borderRadius: 20
                                            }}>
                                                <BarChart3 size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
                                                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>No analyses yet</p>
                                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                    Share and analyze files to populate this view.
                                                </p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                                                {sharedAnalyses.map(a => {
                                                    const stats = a.statistics as any;
                                                    const rowCount = stats?.rowCount || stats?.totalRows || '–';
                                                    const colCount = stats?.columnCount || stats?.totalColumns || '–';
                                                    return (
                                                        <div key={a.id} style={{
                                                            padding: 20, borderRadius: 18,
                                                            border: '1px solid var(--border-subtle)',
                                                            background: 'var(--bento-glass)',
                                                            transition: 'all 0.25s', cursor: 'pointer',
                                                            position: 'relative', overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                position: 'absolute', top: 0, right: 0, width: 80, height: 80,
                                                                background: 'radial-gradient(circle at top right, var(--primary-glow) 0%, transparent 70%)',
                                                                opacity: 0.15, pointerEvents: 'none'
                                                            }} />
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                                                <div style={{
                                                                    width: 40, height: 40, borderRadius: 12,
                                                                    background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}>
                                                                    <TrendingUp size={18} />
                                                                </div>
                                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                                                                    {a.completedAt ? timeAgo(a.completedAt) : '–'}
                                                                </div>
                                                            </div>
                                                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {a.file.originalName || a.file.filename}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                                                                <UserAvatar user={a.createdBy} size={18} />
                                                                <span>{getUserName(a.createdBy)}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                <div style={{
                                                                    flex: 1, padding: '8px 12px', borderRadius: 10,
                                                                    background: 'var(--bg-app)', textAlign: 'center'
                                                                }}>
                                                                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>{rowCount}</div>
                                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Rows</div>
                                                                </div>
                                                                <div style={{
                                                                    flex: 1, padding: '8px 12px', borderRadius: 10,
                                                                    background: 'var(--bg-app)', textAlign: 'center'
                                                                }}>
                                                                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>{colCount}</div>
                                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Columns</div>
                                                                </div>
                                                                <div style={{
                                                                    flex: 1, padding: '8px 12px', borderRadius: 10,
                                                                    background: 'var(--bg-app)', textAlign: 'center'
                                                                }}>
                                                                    <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>
                                                                        <CheckCircle2 size={16} style={{ display: 'inline' }} />
                                                                    </div>
                                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Complete</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'activity' && (
                                    <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                        <div style={{ marginBottom: 24 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                                                Activity Timeline
                                            </h3>
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                                Real-time collaboration activity in this workspace.
                                            </p>
                                        </div>

                                        {wsActivity.length === 0 ? (
                                            <div style={{
                                                textAlign: 'center', padding: '60px 20px',
                                                border: '2px dashed var(--border-subtle)', borderRadius: 20
                                            }}>
                                                <Activity size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
                                                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>No activity yet</p>
                                            </div>
                                        ) : (
                                            <div style={{ position: 'relative', paddingLeft: 28 }}>
                                                {/* Timeline line */}
                                                <div style={{
                                                    position: 'absolute', left: 11, top: 8, bottom: 8, width: 2,
                                                    background: 'linear-gradient(to bottom, var(--primary), var(--border-subtle))',
                                                    borderRadius: 1, opacity: 0.3
                                                }} />

                                                {wsActivity.map((log, idx) => {
                                                    const conf = ACTION_CONFIG[log.action] || { label: log.action, icon: Activity, color: '#64748b' };
                                                    const Icon = conf.icon;
                                                    return (
                                                        <div key={log.id} style={{
                                                            display: 'flex', gap: 16, marginBottom: 20,
                                                            position: 'relative'
                                                        }}>
                                                            {/* Dot */}
                                                            <div style={{
                                                                position: 'absolute', left: -22, top: 4,
                                                                width: 22, height: 22, borderRadius: '50%',
                                                                background: 'var(--bg-main)',
                                                                border: `2px solid ${conf.color}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                zIndex: 1
                                                            }}>
                                                                <Icon size={10} style={{ color: conf.color }} />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                    <strong>{log.user?.displayName || log.user?.email?.split('@')[0] || 'System'}</strong>
                                                                    {' '}<span style={{ color: 'var(--text-muted)' }}>{conf.label}</span>
                                                                    {log.details?.filename && (
                                                                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}> {log.details.filename}</span>
                                                                    )}
                                                                    {log.details?.role && (
                                                                        <span style={{ color: conf.color, fontWeight: 700 }}> ({log.details.role || log.details.newRole})</span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                                                    {timeAgo(log.createdAt)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center', padding: '80px 20px',
                        background: 'var(--bento-glass)', borderRadius: 24,
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <Sparkles size={48} style={{ color: 'var(--primary)', opacity: 0.3, marginBottom: 20 }} />
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                            Create Your First Workspace
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 24px' }}>
                            Workspaces let you organize team members, share datasets, and collaborate on analyses.
                        </p>
                        <button
                            onClick={handleCreateWorkspace}
                            disabled={isCreating}
                            style={{
                                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                color: '#fff', border: 'none', borderRadius: 14,
                                padding: '14px 28px', fontSize: 14, fontWeight: 800,
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
                                boxShadow: '0 10px 30px -8px var(--primary-glow)'
                            }}
                        >
                            <Plus size={18} /> Create Workspace
                        </button>
                    </div>
                )}
            </div>

            {/* Share File Modal */}
            <AnimatePresence>
                {showShareModal && activeWorkspace && token && (
                    <ShareFileModal
                        workspaceId={activeWorkspace.id}
                        workspaceName={activeWorkspace.name}
                        token={token}
                        onClose={() => setShowShareModal(false)}
                        onShared={() => fetchWorkspaceData()}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
