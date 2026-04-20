import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, MessageSquare, Send, Image as ImageIcon, Smile, 
    MoreVertical, Trash2, Edit2, X, ChevronLeft, User, 
    MoreHorizontal, Check, CheckCheck, Loader2, Sparkles, Plus, Clock,
    ImageOff, Settings, Download, Bell, BellOff, Eraser
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import type { Conversation, ChatMessage, ChatParticipant } from '../../contexts/ChatContext';
import { API_URL } from '../../config';
import { useToast } from '../../components/ui/Toast';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
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

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

const UserAvatar = ({ user, size = 40 }: { user: ChatParticipant; size?: number }) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
    const idx = (user?.email || '').charCodeAt(0) % colors.length;
    
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" style={{ width: size, height: size, borderRadius: '35%', objectFit: 'cover' }} />
            ) : (
                <div style={{
                    width: size, height: size, borderRadius: '35%',
                    background: `linear-gradient(135deg, ${colors[idx]}cc, ${colors[idx]}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: size * 0.38, fontWeight: 800, color: '#fff',
                    boxShadow: `0 4px 12px ${colors[idx]}22`
                }}>
                    {getInitials(user)}
                </div>
            )}
        </div>
    );
};

export const PrivateChatView: React.FC = () => {
    const { user, token } = useAuth();
    const { 
        conversations, activeConversation, setActiveConversation, 
        startConversation, sendMessage, refreshConversations, isLoading 
    } = useChat();
    const { addToast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<ChatParticipant[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editingMessage, setEditingMessage] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    
    // New States for UI Logic
    const [isMsgSearchVisible, setIsMsgSearchVisible] = useState(false);
    const [msgSearchQuery, setMsgSearchQuery] = useState('');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set());
    const [replyingTo, setReplyingTo] = useState<any>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // Load messages when conversation changes
    useEffect(() => {
        if (!activeConversation || !token) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_URL}/api/chats/${activeConversation.id}/messages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setActiveMessages(data.messages);
                    setTimeout(() => scrollToBottom('auto'), 50);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchMessages();

        // Listen for socket events via custom events dispatched from ChatContext
        const onNewMessage = (e: any) => {
            const msg = e.detail;
            setActiveMessages(prev => [...prev, msg]);
            setTimeout(() => scrollToBottom(), 50);
        };

        const onUpdateMessage = (e: any) => {
            const updated = e.detail;
            setActiveMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        };

        const onDeleteMessage = (e: any) => {
            const { id } = e.detail;
            setActiveMessages(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true, content: 'This message was deleted', imageUrl: undefined } : m));
        };

        window.addEventListener('chat:new_message', onNewMessage);
        window.addEventListener('chat:message_updated', onUpdateMessage);
        window.addEventListener('chat:message_deleted', onDeleteMessage);

        return () => {
            window.removeEventListener('chat:new_message', onNewMessage);
            window.removeEventListener('chat:message_updated', onUpdateMessage);
            window.removeEventListener('chat:message_deleted', onDeleteMessage);
        };
    }, [activeConversation?.id, token]);

    const filteredMessages = useMemo(() => {
        if (!msgSearchQuery) return activeMessages;
        const q = msgSearchQuery.toLowerCase();
        return activeMessages.filter(m => m.content.toLowerCase().includes(q));
    }, [activeMessages, msgSearchQuery]);

    // Global user search
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`${API_URL}/api/chats/search-users?q=${encodeURIComponent(searchTerm)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, token]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!messageInput.trim() && !uploadingImage) || isSending || !activeConversation) return;

        setIsSending(true);
        try {
            await sendMessage(activeConversation.id, messageInput, undefined, replyingTo?.id);
            setMessageInput('');
            setReplyingTo(null);
        } catch (err) {
            addToast('Failed to send message', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeConversation) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploadingImage(true);
        try {
            const res = await fetch(`${API_URL}/api/chats/upload-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const { imageUrl } = await res.json();
                await sendMessage(activeConversation.id, '', imageUrl);
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            addToast('Failed to upload image', 'error');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleStartChat = async (targetUser: ChatParticipant) => {
        try {
            await startConversation(targetUser.id);
            setSearchTerm('');
            setSearchResults([]);
        } catch (err) {
            addToast('Failed to start conversation', 'error');
        }
    };

    const handleEditMessage = async (messageId: string) => {
        if (!editContent.trim()) return;
        try {
            await fetch(`${API_URL}/api/chats/messages/${messageId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ content: editContent })
            });
            setEditingMessage(null);
            setEditContent('');
        } catch (err) {
            addToast('Failed to edit message', 'error');
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            await fetch(`${API_URL}/api/chats/messages/${messageId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            addToast('Failed to delete message', 'error');
        }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        try {
            await fetch(`${API_URL}/api/chats/messages/${messageId}/react`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ emoji })
            });
        } catch (err) {
            console.error(err);
        }
    };

    const otherMember = activeConversation?.participants[0];

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            background: 'var(--bg-app)',
            overflow: 'hidden',
        }}>
            {/* ─── Sidebar ─── */}
            <div style={{
                width: 320,
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
            }}>
                <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Personal Chat</h2>
                        <button style={{
                            width: 32, height: 32, borderRadius: 8, border: 'none',
                            background: 'var(--primary-subtle)', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}>
                           <Plus size={18} />
                        </button>
                    </div>
                    
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12,
                                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                    {searchTerm && searchResults.length > 0 ? (
                        <div>
                            <div style={{ padding: '0 12px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Found</div>
                            {searchResults.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => handleStartChat(u)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                                        padding: '10px 12px', border: 'none', background: 'transparent',
                                        cursor: 'pointer', borderRadius: 12, textAlign: 'left', transition: 'all 0.2s'
                                    }}
                                    className="hover-bg"
                                >
                                    <UserAvatar user={u} size={36} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{getUserName(u)}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{u.email}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : searchTerm && !isSearching ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                            No users found for "{searchTerm}"
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const other = conv.participants?.[0];
                            const lastMsg = conv.messages?.[0];
                            const isActive = activeConversation?.id === conv.id;
                            
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                                        padding: '12px', border: '1px solid transparent',
                                        background: isActive ? 'var(--primary-subtle)' : 'transparent',
                                        borderColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                        cursor: 'pointer', borderRadius: 16, textAlign: 'left',
                                        transition: 'all 0.2s', marginBottom: 4
                                    }}
                                    className={!isActive ? "hover-bg" : ""}
                                >
                                    <UserAvatar user={other} size={44} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                                                {getUserName(other)}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                {timeAgo(conv.updatedAt)}
                                            </span>
                                        </div>
                                        <div style={{ 
                                            fontSize: 12, color: 'var(--text-muted)', 
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            fontWeight: (lastMsg && !isActive) ? 500 : 400
                                        }}>
                                            {lastMsg ? (lastMsg.senderId === user?.id ? 'You: ' : '') + lastMsg.content : 'No messages yet'}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ─── Main Chat ─── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {activeConversation ? (
                    <>
                        {/* Header */}
                        <div style={{
                            padding: '14px 24px',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-app)',
                            zIndex: 10
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <UserAvatar user={otherMember!} size={38} />
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{getUserName(otherMember)}</div>
                                    <div style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}></div>
                                        Active now
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {isMsgSearchVisible ? (
                                    <motion.div 
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 220, opacity: 1 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}
                                    >
                                        <Search size={14} color="var(--text-muted)" />
                                        <input 
                                            type="text" 
                                            placeholder="Search messages..."
                                            value={msgSearchQuery}
                                            onChange={(e) => setMsgSearchQuery(e.target.value)}
                                            autoFocus
                                            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%' }}
                                        />
                                        <button onClick={() => { setIsMsgSearchVisible(false); setMsgSearchQuery(''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                                    </motion.div>
                                ) : (
                                    <button className="icon-btn-subtle" onClick={() => setIsMsgSearchVisible(true)}><Search size={18} /></button>
                                )}
                                
                                <div style={{ position: 'relative' }}>
                                    <button className="icon-btn-subtle" onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}><MoreHorizontal size={18} /></button>
                                    <AnimatePresence>
                                        {isMoreMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                style={{
                                                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                                                    width: 180, background: 'var(--bg-elevated)', borderRadius: 12,
                                                    border: '1px solid var(--border-subtle)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                                    zIndex: 100, overflow: 'hidden'
                                                }}
                                            >
                                                <button className="more-menu-item" onClick={() => setIsMoreMenuOpen(false)}><Bell size={16} /> Mute Notifications</button>
                                                <button className="more-menu-item" onClick={() => setIsMoreMenuOpen(false)}><Download size={16} /> Export Chat</button>
                                                <button className="more-menu-item" onClick={() => setIsMoreMenuOpen(false)}><Clock size={16} /> Set Reminder</button>
                                                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }}></div>
                                                <button className="more-menu-item danger" onClick={() => { setActiveMessages([]); setIsMoreMenuOpen(false); }}><Eraser size={16} /> Clear History</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div 
                            className="custom-scrollbar"
                            style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 6 }}
                        >
                            <AnimatePresence initial={false}>
                                {filteredMessages.map((msg, idx) => {
                                    const isMe = msg.senderId === user?.id;
                                    const nextMsg = filteredMessages[idx + 1];
                                    const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                                    
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                            style={{
                                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                maxWidth: '70%',
                                                marginBottom: isLastInGroup ? 12 : 2,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                                                {!isMe && isLastInGroup && (
                                                    <div style={{ marginBottom: 4 }}><UserAvatar user={msg.sender} size={28} /></div>
                                                )}
                                                {!isMe && !isLastInGroup && <div style={{ width: 28 }}></div>}

                                                <div 
                                                    className="message-bubble-trigger"
                                                    style={{
                                                        position: 'relative',
                                                        padding: msg.imageUrl ? '8px' : '10px 16px',
                                                        borderRadius: isMe 
                                                            ? (isLastInGroup ? '18px 18px 4px 18px' : '18px 18px 18px 18px')
                                                            : (isLastInGroup ? '18px 18px 18px 4px' : '18px 18px 18px 18px'),
                                                        background: isMe ? 'var(--primary)' : 'var(--bg-surface)',
                                                        color: isMe ? '#fff' : 'var(--text-primary)',
                                                        boxShadow: isMe ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                                                        fontSize: 14,
                                                        lineHeight: 1.5,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 4
                                                    }}
                                                >
                                                    {msg.replyTo && (
                                                        <div style={{
                                                            padding: '6px 10px',
                                                            background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)',
                                                            borderRadius: 8,
                                                            borderLeft: `3px solid ${isMe ? '#fff' : 'var(--primary)'}`,
                                                            marginBottom: 4,
                                                            fontSize: '12.5px',
                                                            opacity: 0.9,
                                                            cursor: 'pointer',
                                                            maxWidth: 300,
                                                            display: 'block'
                                                        }} onClick={() => {
                                                            const el = document.getElementById(`msg-${msg.replyToId}`);
                                                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        }}>
                                                            <div style={{ fontWeight: 600, fontSize: '11px', marginBottom: 2 }}>
                                                                {msg.replyTo.sender.displayName}
                                                            </div>
                                                            <div style={{ 
                                                                whiteSpace: 'nowrap', 
                                                                overflow: 'hidden', 
                                                                textOverflow: 'ellipsis',
                                                                opacity: 0.8
                                                            }}>
                                                                {msg.replyTo.content || "Media"}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!msg.isDeleted && (
                                                        <>
                                                            {msg.imageUrl && (
                                                                brokenImageIds.has(msg.id) ? (
                                                                    <div style={{
                                                                        width: '100%',
                                                                        aspectRatio: '4/3',
                                                                        background: 'var(--bg-secondary)',
                                                                        borderRadius: 12,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: 8,
                                                                        color: 'var(--text-muted)',
                                                                        border: '1px dashed var(--border-subtle)',
                                                                        marginBottom: msg.content ? 8 : 0
                                                                    }}>
                                                                        <ImageOff size={24} />
                                                                        <span style={{ fontSize: 11 }}>Media Unavailable</span>
                                                                    </div>
                                                                ) : (
                                                                    <img 
                                                                        src={msg.imageUrl.startsWith('http') ? msg.imageUrl : `${API_URL}${msg.imageUrl}`} 
                                                                        alt="Shared" 
                                                                        style={{ 
                                                                            maxWidth: '100%', 
                                                                            borderRadius: 12, 
                                                                            display: 'block',
                                                                            marginBottom: msg.content ? 8 : 0,
                                                                            cursor: 'pointer',
                                                                            background: 'var(--bg-secondary)'
                                                                        }} 
                                                                        onError={() => {
                                                                            setBrokenImageIds(prev => new Set(prev).add(msg.id));
                                                                        }}
                                                                        onClick={() => {
                                                                            if (!msg.imageUrl) return;
                                                                            const url = msg.imageUrl.startsWith('http') ? msg.imageUrl : `${API_URL}${msg.imageUrl}`;
                                                                            window.open(url, '_blank');
                                                                        }}
                                                                    />
                                                                )
                                                            )}
                                                            {msg.content}
                                                            {msg.isEdited && <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 6 }}>(edited)</span>}
                                                        </>
                                                    )}

                                                    {/* Message Actions (Visible on Hover) */}
                                                    {!msg.isDeleted && (
                                                        <div className="message-actions-popover" style={{
                                                            position: 'absolute',
                                                            top: -30,
                                                            [isMe ? 'right' : 'left']: 0,
                                                            display: 'flex',
                                                            gap: 4,
                                                            padding: '4px',
                                                            background: 'var(--bg-elevated)',
                                                            borderRadius: 8,
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                            border: '1px solid var(--border-subtle)',
                                                            zIndex: 20,
                                                            visibility: 'hidden',
                                                            opacity: 0
                                                        }}>
                                                            <button onClick={() => handleReaction(msg.id, '❤️')} style={{ padding: '2px 4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>❤️</button>
                                                            <button onClick={() => handleReaction(msg.id, '👍')} style={{ padding: '2px 4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>👍</button>
                                                            <button onClick={() => setReplyingTo(msg)} style={{ padding: '2px 6px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }} title="Reply">
                                                                <MessageSquare size={12} />
                                                            </button>
                                                            {isMe && (
                                                                <>
                                                                    <button onClick={() => { setEditingMessage(msg.id); setEditContent(msg.content); }} style={{ padding: '2px 6px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                                        <Edit2 size={12} />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteMessage(msg.id)} style={{ padding: '2px 6px', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}>
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reactions Display */}
                                            {msg.reactions && (msg.reactions as any[]).length > 0 && (
                                                <div style={{ display: 'flex', gap: 4, marginTop: 4, marginLeft: isMe ? 0 : 36 }}>
                                                    {(msg.reactions as any[]).map((r, i) => (
                                                        <div key={i} style={{
                                                            padding: '2px 6px', borderRadius: 20, background: 'var(--bg-surface)',
                                                            border: '1px solid var(--border-subtle)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3
                                                        }}>
                                                            {r.emoji} <span style={{ fontWeight: 700 }}>{r.userIds.length}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {isLastInGroup && (
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, marginLeft: isMe ? 0 : 36, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && <CheckCheck size={12} style={{ color: 'var(--primary)' }} />}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{
                            padding: '16px 24px 24px',
                            background: 'var(--bg-app)',
                            borderTop: '1px solid var(--border-subtle)'
                        }}>
                            {editingMessage ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 16, marginBottom: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>Editing Message</div>
                                        <input 
                                            type="text" 
                                            value={editContent} 
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleEditMessage(editingMessage)}
                                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
                                            autoFocus
                                        />
                                    </div>
                                    <button onClick={() => setEditingMessage(null)} className="icon-btn-subtle"><X size={16} /></button>
                                    <button onClick={() => handleEditMessage(editingMessage)} className="icon-btn" style={{ background: 'var(--primary)' }}><Check size={16} /></button>
                                </div>
                            ) : (
                                <form 
                                    onSubmit={handleSendMessage}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        background: 'var(--bg-surface)',
                                        padding: '8px 12px',
                                        borderRadius: 20,
                                        border: '1px solid var(--border-subtle)',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleImageUpload} 
                                        style={{ display: 'none' }} 
                                        accept="image/*"
                                    />
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="icon-btn-subtle"
                                        disabled={uploadingImage}
                                    >
                                        {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={20} />}
                                    </button>
                                    
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
                                    <AnimatePresence>
                                        {replyingTo && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 44, opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{
                                                    background: 'var(--bg-secondary)',
                                                    borderLeft: '4px solid var(--primary)',
                                                    padding: '4px 12px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '13px',
                                                    overflow: 'hidden',
                                                    borderRadius: '8px 8px 0 0',
                                                    marginBottom: -4,
                                                    zIndex: 1
                                                }}
                                            >
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '11px' }}>
                                                        Replying to {replyingTo.sender.displayName}
                                                    </div>
                                                    <div style={{ opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12px' }}>
                                                        {replyingTo.content || 'Media'}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setReplyingTo(null)}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '12px 4px',
                                            color: 'var(--text-primary)',
                                            fontSize: 14,
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                    
                                    <div style={{ position: 'relative' }}>
                                        <button type="button" className="icon-btn-subtle" onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}>
                                            <Smile size={20} />
                                        </button>
                                        <AnimatePresence>
                                            {isEmojiPickerOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    style={{
                                                        position: 'absolute', bottom: '100%', right: 0, marginBottom: 12,
                                                        width: 280, height: 200, background: 'var(--bg-elevated)', borderRadius: 16,
                                                        border: '1px solid var(--border-subtle)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                                        zIndex: 100, padding: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column'
                                                    }}
                                                >
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, overflowY: 'auto' }} className="custom-scrollbar">
                                                        {['❤️', '👍', '🔥', '😂', '😮', '😢', '😍', '🙌', '🚀', '✨', '💯', '🤔', '😎', '🙏', '🎉', '💡', '✅', '❌', 'Neural', 'AI', '⚡', '🤖', '🧠', '🌈'].map(emoji => (
                                                            <div 
                                                                key={emoji} 
                                                                className="emoji-item"
                                                                onClick={() => {
                                                                    setMessageInput(prev => prev + emoji);
                                                                    setIsEmojiPickerOpen(false);
                                                                }}
                                                            >
                                                                {emoji}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        disabled={(!messageInput.trim() && !uploadingImage) || isSending}
                                        style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'var(--primary)', color: '#fff',
                                            border: 'none', cursor: 'pointer',
                                            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                                            transition: 'all 0.2s',
                                            opacity: (!messageInput.trim() && !uploadingImage) || isSending ? 0.6 : 1
                                        }}
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ 
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', textAlign: 'center', padding: 40
                    }}>
                        <div style={{ 
                            width: 80, height: 80, borderRadius: 28, background: 'var(--primary-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                            marginBottom: 24
                        }}>
                            <Send size={40} />
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Personal Chat Hub</h3>
                        <p style={{ maxWidth: 300, lineHeight: 1.6, fontSize: 14 }}>
                            Pick a contact from the list or search for someone new to start a personal neural connection.
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                .hover-bg:hover {
                    background: rgba(255, 255, 255, 0.05) !important;
                }
                .icon-btn-subtle {
                    width: 36px; 
                    height: 36px; 
                    border-radius: 10px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    background: transparent; 
                    border: none; 
                    color: var(--text-muted); 
                    cursor: pointer; 
                    transition: all 0.2s;
                    outline: none;
                }
                .icon-btn-subtle:hover {
                    background: var(--bg-surface-hover);
                    color: var(--text-primary);
                    transform: translateY(-1px);
                }
                .icon-btn-subtle:active {
                    transform: translateY(0);
                }
                .message-bubble-trigger:hover .message-actions-popover {
                    visibility: visible !important;
                    opacity: 1 !important;
                    top: -36px !important;
                }
                .emoji-item {
                    font-size: 20px;
                    padding: 8px;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .emoji-item:hover {
                    background: var(--bg-surface-hover);
                    transform: scale(1.2);
                }
                .more-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 14px;
                    border: none;
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 13px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                }
                .more-menu-item:hover {
                    background: var(--bg-surface-hover);
                }
                .more-menu-item.danger {
                    color: var(--danger);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border-subtle);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};
