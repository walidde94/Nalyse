import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { API_URL } from '../../config';
import {
    Users, Shield, Trash2, UserPlus, Settings, Plus, Search,
    FileText, FileSpreadsheet, BarChart3, Eye, Clock, ArrowUpRight,
    Share2, ChevronRight, Activity, Database, Lock, Unlock, X,
    CheckCircle2, AlertTriangle, Layers, Zap, Globe, Upload, Download,
    UserCheck, Crown, Edit3, FileJson, HardDrive, TrendingUp, Sparkles,
    MessageCircle, AtSign, Send, Link, Copy, Check, Reply, File
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

interface WorkspaceMessage {
    id: string;
    content: string;
    mentions: string[];
    createdAt: string;
    author: { id: string; email: string; displayName?: string; firstName?: string; lastName?: string; avatarUrl?: string };
    replyTo?: {
        id: string;
        content: string;
        author: { id: string; email: string; displayName?: string; firstName?: string; lastName?: string; avatarUrl?: string };
    } | null;
}

interface MentionableUser {
    id: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
}

type TabId = 'team' | 'data' | 'analysis' | 'discussion' | 'activity';

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
    MESSAGE_SENT: { label: 'sent a message', icon: MessageCircle, color: '#06b6d4' },
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
// DISCUSSION TAB WITH @MENTION SYSTEM
// ═══════════════════════════════════════════════════════════════

const DiscussionTab = ({ workspaceId, token, messages, sharedFiles, onRefresh, user, onOpenFile }: {
    workspaceId: string; token: string; messages: WorkspaceMessage[]; sharedFiles: any[]; onRefresh: () => void; user: any; onOpenFile?: (f: any) => void;
}) => {
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);

    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionUsers, setMentionUsers] = useState<MentionableUser[]>([]);
    const [mentionIdx, setMentionIdx] = useState(0);

    const [fileMentionQuery, setFileMentionQuery] = useState<string | null>(null);
    const [mentionFileIdx, setMentionFileIdx] = useState(0);

    const [cursorPos, setCursorPos] = useState(0);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Listen for new real-time messages
    useEffect(() => {
        const handleNewMessage = () => {
            onRefresh();
        };
        window.addEventListener('workspace:new_message', handleNewMessage);
        return () => window.removeEventListener('workspace:new_message', handleNewMessage);
    }, [onRefresh]);

    // Fetch mentionable users when @ is typed
    useEffect(() => {
        if (mentionQuery === null) { setMentionUsers([]); return; }
        const controller = new AbortController();
        const fetchUsers = async () => {
            try {
                const res = await fetch(
                    `${API_URL}/api/workspaces/${workspaceId}/mentionable-users?q=${encodeURIComponent(mentionQuery)}`,
                    { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
                );
                if (res.ok) {
                    const users = await res.json();
                    setMentionUsers(users);
                    setMentionIdx(0);
                }
            } catch (e: any) {
                if (e.name !== 'AbortError') console.error(e);
            }
        };
        fetchUsers();
        return () => controller.abort();
    }, [mentionQuery, workspaceId, token]);

    const filteredFiles = useMemo(() => {
        if (fileMentionQuery === null) return [];
        const q = fileMentionQuery.toLowerCase();
        return sharedFiles.filter((f: any) => (f.originalName || f.filename).toLowerCase().includes(q)).slice(0, 5);
    }, [sharedFiles, fileMentionQuery]);

    useEffect(() => { setMentionFileIdx(0); }, [filteredFiles]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const pos = e.target.selectionStart || 0;
        setInputValue(val);
        setCursorPos(pos);

        const textBefore = val.slice(0, pos);
        const mentionMatch = textBefore.match(/(?:^|\s)@([^\s]*)$/);
        const fileMentionMatch = textBefore.match(/(?:^|\s)#([^\s]*)$/);
        
        if (mentionMatch) {
            setMentionQuery(mentionMatch[1]);
            setFileMentionQuery(null);
        } else if (fileMentionMatch) {
            setFileMentionQuery(fileMentionMatch[1]);
            setMentionQuery(null);
        } else {
            setMentionQuery(null);
            setFileMentionQuery(null);
        }
    };

    const insertMention = (mentionUser: MentionableUser) => {
        const name = getUserName(mentionUser);
        const textBefore = inputValue.slice(0, cursorPos);
        const textAfter = inputValue.slice(cursorPos);
        const mentionStart = textBefore.lastIndexOf('@');
        const mention = `@[${name}](${mentionUser.id}) `;
        setInputValue(textBefore.slice(0, mentionStart) + mention + textAfter);
        setMentionQuery(null);
        inputRef.current?.focus();
    };

    const insertFileMention = (file: any) => {
        const name = file.originalName || file.filename;
        const textBefore = inputValue.slice(0, cursorPos);
        const textAfter = inputValue.slice(cursorPos);
        const mentionStart = textBefore.lastIndexOf('#');
        const mention = `#[${name}](${file.id}) `;
        setInputValue(textBefore.slice(0, mentionStart) + mention + textAfter);
        setFileMentionQuery(null);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (mentionQuery !== null && mentionUsers.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(prev => Math.min(prev + 1, mentionUsers.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx(prev => Math.max(prev - 1, 0)); }
            else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionUsers[mentionIdx]); }
            else if (e.key === 'Escape') { e.preventDefault(); setMentionQuery(null); }
            return;
        }
        if (fileMentionQuery !== null && filteredFiles.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setMentionFileIdx(prev => Math.min(prev + 1, filteredFiles.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setMentionFileIdx(prev => Math.max(prev - 1, 0)); }
            else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertFileMention(filteredFiles[mentionFileIdx]); }
            else if (e.key === 'Escape') { e.preventDefault(); setFileMentionQuery(null); }
            return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim() || sending) return;
        setSending(true);
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: inputValue.trim(), replyToId: replyingTo?.id })
            });
            if (res.ok) {
                setInputValue('');
                setReplyingTo(null);
                onRefresh();
            }
        } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    // Render message content with highlighted @mentions and #files
    const renderContent = (content: string) => {
        const parts = content.split(/([@#])\[([^\]]+)\]\(([^)]+)\)/g);
        const result: React.ReactNode[] = [];
        
        for (let i = 0; i < parts.length; i += 4) {
            if (parts[i]) result.push(<span key={`text-${i}`}>{parts[i]}</span>);
            
            if (i + 1 < parts.length) {
                const type = parts[i + 1];
                const name = parts[i + 2];
                const id = parts[i + 3];
                const isUser = type === '@';
                
                const handleClick = (e: any) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isUser && onOpenFile) {
                        const file = sharedFiles.find((f: any) => f.id === id);
                        if (file) {
                            // Ensure the App handler treats it as processed so it fetches from cache correctly instead of attempting a full re-upload cycle!
                            onOpenFile({ ...file, isProcessed: true });
                        }
                    }
                };

                result.push(
                    <span 
                        key={`mention-${i}`} 
                        onClick={handleClick}
                        style={{
                            background: isUser ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))' : 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.15))',
                            color: isUser ? '#a78bfa' : '#34d399',
                            fontWeight: 700, padding: '2px 8px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 4, margin: '0 4px', whiteSpace: 'nowrap'
                        }}
                    >
                        {isUser ? <AtSign size={12} /> : <File size={12} />}
                        {name}
                    </span>
                );
            }
        }
        return result;
    };

    const isSelf = (authorId: string) => authorId === user?.id;

    return (
        <motion.div key="discussion" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', height: 600 }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '24px', flex: 1 }}>
                
                {/* Main Chat Area */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                            <MessageCircle size={16} color="#818cf8" /> Workspace Discussion
                        </h3>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{messages.length} messages</span>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px',
                        padding: '20px 24px',
                    }}>
                        {messages.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '60px 20px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1
                            }}>
                                <MessageCircle size={40} style={{ color: 'var(--text-muted)', opacity: 0.2, marginBottom: 16 }} />
                                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>No messages yet</p>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start a conversation with your team</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const self = isSelf(msg.author.id);
                                const showAvatar = idx === 0 || messages[idx - 1].author.id !== msg.author.id;
                                const showTime = idx === 0 || (new Date(msg.createdAt).getTime() - new Date(messages[idx-1].createdAt).getTime()) > 300000;
                                const hasMentions = msg.mentions?.length > 0;
                                const mentionsMe = msg.mentions?.includes(user?.id);

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showTime && (
                                            <div style={{
                                                textAlign: 'center', fontSize: 10, fontWeight: 700,
                                                color: 'var(--text-muted)', padding: '8px 0', letterSpacing: '0.08em',
                                                textTransform: 'uppercase', opacity: 0.6
                                            }}>
                                                {timeAgo(msg.createdAt)}
                                            </div>
                                        )}
                                        <div 
                                            className="group"
                                            style={{
                                                display: 'flex', gap: 12, padding: mentionsMe ? '8px 12px' : '0',
                                                borderRadius: 12, position: 'relative',
                                                background: mentionsMe ? 'rgba(139,92,246,0.06)' : 'transparent',
                                                borderLeft: mentionsMe ? '3px solid #a78bfa' : '3px solid transparent',
                                                transition: 'all 0.2s', marginLeft: mentionsMe ? '-15px' : '0'
                                            }}
                                        >
                                            {/* Hover Reply Button */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{
                                                position: 'absolute', right: -10, top: -5, background: 'var(--bento-glass)',
                                                border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 4, zIndex: 10,
                                                boxShadow: '0 8px 24px -4px rgba(0,0,0,0.5)'
                                            }}>
                                                <button onClick={() => setReplyingTo(msg)} style={{
                                                    background: 'none', border: 'none', color: 'var(--text-secondary)',
                                                    cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center',
                                                    gap: 4, fontSize: 11, fontWeight: 700, borderRadius: 6
                                                }}>
                                                    <Reply size={14} /> Reply
                                                </button>
                                            </div>

                                            <div style={{ width: 32, flexShrink: 0, marginTop: showAvatar ? (msg.replyTo ? 28 : 0) : 28 }}>
                                                {showAvatar && <UserAvatar user={msg.author} size={32} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, paddingTop: showAvatar ? 0 : 28, position: 'relative' }}>
                                                {/* Reply Context Banner (WhatsApp Style Quote) */}
                                                {msg.replyTo && (
                                                    <div style={{
                                                        display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8,
                                                        padding: '6px 12px', background: 'rgba(255,255,255,0.03)',
                                                        borderLeft: '3px solid #a78bfa', borderRadius: '4px 8px 8px 4px',
                                                        fontSize: 12, cursor: 'pointer'
                                                    }}>
                                                        <div style={{ fontWeight: 800, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Reply size={12} /> {getUserName(msg.replyTo.author)}
                                                        </div>
                                                        <div style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {renderContent(msg.replyTo.content)}
                                                        </div>
                                                    </div>
                                                )}

                                                {showAvatar && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                                                            {self ? 'You' : getUserName(msg.author)}
                                                        </span>
                                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                                                            {timeAgo(msg.createdAt)}
                                                        </span>
                                                        {hasMentions && (
                                                            <span style={{
                                                                fontSize: 9, fontWeight: 800, padding: '1px 6px',
                                                                borderRadius: 6, background: 'rgba(139,92,246,0.12)',
                                                                color: '#a78bfa', letterSpacing: '0.05em'
                                                            }}>
                                                                <AtSign size={8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                                                                {msg.mentions.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div style={{
                                                    fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6,
                                                    wordBreak: 'break-word', fontWeight: 400
                                                }}>
                                                    {renderContent(msg.content)}
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Compose Area */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                        
                        {/* Reply Indicator Preview */}
                        {replyingTo && (
                            <div style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                                padding: '10px 14px', borderRadius: '12px 12px 0 0', position: 'absolute',
                                left: 24, right: 24, top: -38, zIndex: 0
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                                    <Reply size={14} color="#a78bfa" />
                                    Replying to <span style={{ color: '#fff' }}>{getUserName(replyingTo.author)}</span>
                                </div>
                                <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* File Mention Dropdown */}
                        <AnimatePresence>
                            {fileMentionQuery !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                    style={{
                                        position: 'absolute', bottom: '100%', left: '24px', right: '24px',
                                        background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 14, padding: 6, marginBottom: replyingTo ? 44 : 6,
                                        boxShadow: '0 12px 40px -8px rgba(0,0,0,0.6)',
                                        zIndex: 50, maxHeight: 200, overflowY: 'auto'
                                    }}
                                >
                                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        Attach a file
                                    </div>
                                    {filteredFiles.length === 0 ? (
                                        <div style={{ padding: '12px 10px', fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                                            No files match your search. Share files in this workspace first!
                                        </div>
                                    ) : (
                                        filteredFiles.map((f: any, i: number) => (
                                            <div
                                                key={f.id}
                                                onClick={() => insertFileMention(f)}
                                                onMouseEnter={() => setMentionFileIdx(i)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                                                    background: i === mentionFileIdx ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                                                    borderLeft: i === mentionFileIdx ? '2px solid #34d399' : '2px solid transparent',
                                                }}
                                            >
                                                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                                                    <File size={14} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{f.originalName || f.filename}</div>
                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{formatBytes(f.size)}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Mention Autocomplete Dropdown */}
                        <AnimatePresence>
                            {mentionQuery !== null && mentionUsers.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                    style={{
                                        position: 'absolute', bottom: '100%', left: '24px', right: '24px',
                                        background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 14, padding: 6, marginBottom: replyingTo ? 44 : 6,
                                        boxShadow: '0 12px 40px -8px rgba(0,0,0,0.6)',
                                        zIndex: 50, maxHeight: 200, overflowY: 'auto'
                                    }}
                                >
                                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        Mention a member
                                    </div>
                                    {mentionUsers.map((u, i) => (
                                        <div
                                            key={u.id}
                                            onClick={() => insertMention(u)}
                                            onMouseEnter={() => setMentionIdx(i)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                                                background: i === mentionIdx ? 'rgba(139,92,246,0.15)' : 'transparent',
                                                borderLeft: i === mentionIdx ? '2px solid #a78bfa' : '2px solid transparent',
                                            }}
                                        >
                                            <UserAvatar user={u} size={28} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{getUserName(u)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '4px 8px', transition: 'border-color 0.2s' }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, cursor: 'pointer', transition: 'color 0.2s'
                                }}
                                title="Type @ to mention"
                                onClick={() => { setInputValue(prev => prev + '@'); setMentionQuery(''); inputRef.current?.focus(); }}
                                className="hover:text-white"
                                >
                                    <AtSign size={16} />
                                </div>
                                <textarea
                                    ref={inputRef} value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
                                    placeholder="Type a message... @ for members, # for files" rows={1}
                                    style={{
                                        flex: 1, background: 'none', border: 'none', outline: 'none',
                                        fontSize: 13, color: '#fff', fontWeight: 500, resize: 'none', lineHeight: 1.5, maxHeight: 120, minHeight: 24, padding: '8px 4px', fontFamily: 'var(--font-main)'
                                    }}
                                    onInput={(e) => {
                                        const t = e.currentTarget;
                                        t.style.height = '24px'; t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleSend} disabled={!inputValue.trim() || sending}
                                style={{
                                    height: 42, width: 42, borderRadius: '12px',
                                    background: inputValue.trim() ? '#818cf8' : 'rgba(255,255,255,0.05)',
                                    color: '#fff', border: 'none', cursor: inputValue.trim() ? 'pointer' : 'default',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s',
                                    opacity: inputValue.trim() && !sending ? 1 : 0.5,
                                    boxShadow: inputValue.trim() ? '0 4px 14px rgba(129, 140, 248, 0.4)' : 'none'
                                }}
                            >
                                {sending ? <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /> : <Send size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Thread Stats</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Total Messages</span>
                                <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{messages.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Mentions</span>
                                <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{messages.filter(m => m.mentions && m.mentions.length > 0).length}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(52, 211, 153, 0.05))', border: '1px solid rgba(129, 140, 248, 0.2)', borderRadius: '16px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Sparkles size={16} color="#818cf8" />
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#818cf8' }}>AI Insights</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
                            Based on your recent workspace message activity, team engagement is steady. Consider creating dashboards out of the files shared in the Data tab to stimulate further discussion.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const SharedWorkspacesView = ({ onOpenFile }: { onOpenFile?: (file: any) => void }) => {
    const { token, user } = useAuth();
    const { workspaces, refreshWorkspaces, activeUsers, activityFeed } = useWorkspace();

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
    const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [sharedAnalyses, setSharedAnalyses] = useState<SharedAnalysis[]>([]);
    const [wsActivity, setWsActivity] = useState<ActivityLog[]>([]);
    const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('team');
    const [showShareModal, setShowShareModal] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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
            const [filesRes, analysesRes, activityRes, messagesRes] = await Promise.all([
                fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/files`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/analyses`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/activity`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/workspaces/${selectedWorkspaceId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (filesRes.ok) setSharedFiles(await filesRes.json());
            if (analysesRes.ok) setSharedAnalyses(await analysesRes.json());
            if (activityRes.ok) setWsActivity(await activityRes.json());
            if (messagesRes.ok) {
                const data = await messagesRes.json();
                setMessages(data.messages || []);
            }
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

    const generateShareLink = () => {
        // Mock share link behavior for the revolutionary design
        const link = `${window.location.origin}/join-workspace/${selectedWorkspaceId}`;
        setShareLink(link);
    };

    const copyLink = () => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
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
        { id: 'discussion', label: 'Discussion', icon: MessageCircle, count: messages.length },
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
            {/* Atmospheric Glow */}
            <div style={{ position: 'absolute', top: '5%', left: '40%', width: '40vw', height: '40vh', background: 'radial-gradient(ellipse, rgba(52, 211, 153, 0.05), transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vh', background: 'radial-gradient(circle, rgba(129, 140, 248, 0.04), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 64px', position: 'relative', zIndex: 1 }}>
                
                {/* ─── HEADER ──────────────────────────────────────────── */}
                <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{
                            fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em',
                            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 14
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: 'linear-gradient(135deg, #34d399, #3b82f6)',
                                boxShadow: '0 8px 24px -8px rgba(52, 211, 153, 0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Users size={24} color="#fff" />
                            </div>
                            Collaborative Workspace
                        </h1>
                        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)', maxWidth: 500, lineHeight: 1.6, marginLeft: 58 }}>
                            Real-time team collaboration, shared datasets, and threaded discussions.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={generateShareLink}
                            disabled={!activeWorkspace}
                            style={{
                                background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#fff', border: 'none',
                                padding: '12px 24px', borderRadius: 14, fontSize: 13, fontWeight: 800,
                                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(52, 211, 153, 0.3)', opacity: !activeWorkspace ? 0.5 : 1,
                                transition: 'transform 0.2s'
                            }}
                        >
                            <Link size={18} /> Generate Share Link
                        </button>
                        <button
                            onClick={handleCreateWorkspace}
                            disabled={isCreating}
                            style={{
                                background: 'transparent',
                                color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 14,
                                padding: '12px 24px', fontSize: 13, fontWeight: 800,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={18} /> New Workspace
                        </button>
                    </div>
                </div>

                {/* Share Link Toast */}
                <AnimatePresence>
                    {shareLink && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '16px 20px', borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Globe size={18} color="#34d399" />
                                <code style={{ fontSize: 13, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{shareLink}</code>
                            </div>
                            <button onClick={copyLink} style={{ background: copied ? '#10b981' : 'rgba(255,255,255,0.1)', border: 'none', padding: '8px 16px', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                        <div style={{ padding: '0 24px' }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
                                {tabs.map(t => {
                                    const isActive = activeTab === t.id;
                                    const Icon = t.icon;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => setActiveTab(t.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
                                                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                border: `1px solid ${isActive ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                                                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <Icon size={15} /> {t.label}
                                            <span style={{ 
                                                background: isActive ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.05)', 
                                                padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 800, 
                                                color: isActive ? '#34d399' : 'rgba(255,255,255,0.4)' 
                                            }}>
                                                {t.count || 0}
                                            </span>
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

                                {activeTab === 'discussion' && (
                                    <DiscussionTab
                                        workspaceId={selectedWorkspaceId}
                                        token={token!}
                                        messages={messages}
                                        sharedFiles={sharedFiles}
                                        onRefresh={fetchWorkspaceData}
                                        user={user}
                                        onOpenFile={onOpenFile}
                                    />
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
