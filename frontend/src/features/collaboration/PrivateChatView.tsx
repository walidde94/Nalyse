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
// NEURAL THEME STYLES
// ═══════════════════════════════════════════════════════════════

const neuralStyles = `
    @keyframes neural-pulse {
        0%, 100% { opacity: 0.5; transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
        50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 15px 4px rgba(34, 197, 94, 0.2); }
    }
    
    @keyframes floating-data {
        0% { transform: translateY(0) rotate(0deg); opacity: 0; }
        20% { opacity: 0.15; }
        80% { opacity: 0.15; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
    }

    @keyframes scan-line {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
    }

    .neural-bg {
        position: fixed;
        inset: 0;
        background: #020308;
        overflow: hidden;
        z-index: 0;
    }

    .neural-mesh {
        position: absolute;
        inset: 0;
        background: 
            radial-gradient(circle at 20% 30%, hsla(253,16%,7%,1) 0, transparent 50%), 
            radial-gradient(circle at 80% 70%, hsla(225,39%,30%,0.15) 0, transparent 50%), 
            radial-gradient(circle at 50% 50%, hsla(339,49%,30%,0.1) 0, transparent 50%);
        filter: blur(100px);
        opacity: 0.8;
    }

    .data-particle {
        position: absolute;
        bottom: -20px;
        background: linear-gradient(to top, transparent, var(--primary), transparent);
        width: 1px;
        height: 120px;
        filter: blur(1px);
        animation: floating-data 12s linear infinite;
    }

    .glass-panel-premium {
        background: rgba(8, 12, 22, 0.75);
        backdrop-filter: blur(50px) saturate(200%);
        -webkit-backdrop-filter: blur(50px) saturate(200%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .sidebar-item-active {
        background: linear-gradient(90deg, rgba(99, 102, 241, 0.18) 0%, transparent 100%);
        border-left: 4px solid var(--primary);
    }

    .message-bubble-own {
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        box-shadow: 0 8px 25px -5px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
        color: white;
    }

    .message-bubble-other {
        background: rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        color: #fff;
    }

    .neural-status-indicator {
        background: #22c55e;
        box-shadow: 0 0 10px #22c55e;
        animation: neural-pulse 2.5s infinite ease-in-out;
    }

    .hover-lift {
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .hover-lift:hover {
        transform: translateY(-3px) scale(1.03);
        box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);
    }

    .focus-glow {
        transition: all 0.3s ease;
    }
    .focus-glow:focus {
        border-color: var(--primary) !important;
        background: rgba(255, 255, 255, 0.07) !important;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15), 0 0 20px rgba(99, 102, 241, 0.1) !important;
    }

    .message-bubble-own:hover, .message-bubble-other:hover {
        transform: scale(1.01) translateY(-1px);
        filter: brightness(1.1);
    }

    .message-bubble-trigger:hover .message-actions-popover {
        opacity: 1 !important;
        visibility: visible !important;
        transform: translateY(-8px) !important;
        pointer-events: auto !important;
    }

    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); }

    .emoji-item {
        font-size: 20px;
        padding: 10px;
        cursor: pointer;
        border-radius: 12px;
        transition: all 0.3s var(--ease-spring);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .emoji-item:hover {
        background: rgba(255,255,255,0.08);
        transform: scale(1.3) rotate(5deg);
    }
`;



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

const UserAvatar = ({ user, size = 40, status = 'online' }: { user: ChatParticipant; size?: number; status?: 'online' | 'offline' }) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
    const idx = (user?.email || '').charCodeAt(0) % colors.length;
    
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" style={{ width: size, height: size, borderRadius: '14px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
            ) : (
                <div style={{
                    width: size, height: size, borderRadius: '14px',
                    background: `linear-gradient(135deg, ${colors[idx]}dd, ${colors[idx]}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: size * 0.38, fontWeight: 800, color: '#fff',
                    boxShadow: `0 8px 16px ${colors[idx]}22`,
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {getInitials(user)}
                </div>
            )}
            <div className={status === 'online' ? 'neural-status-indicator' : ''} style={{
                position: 'absolute', bottom: -2, right: -2,
                width: size * 0.25, height: size * 0.25, borderRadius: '50%',
                background: status === 'online' ? '#22c55e' : '#64748b',
                border: '2px solid #03040c',
                display: status === 'online' ? 'block' : 'none'
            }} />
        </div>
    );
};

const NeuralBackground = () => (
    <div className="neural-bg">
        <div className="neural-mesh" />
        {[...Array(12)].map((_, i) => (
            <div 
                key={i} 
                className="data-particle" 
                style={{ 
                    left: `${Math.random() * 100}%`, 
                    animationDelay: `${Math.random() * 10}s`,
                    animationDuration: `${15 + Math.random() * 10}s`
                }} 
            />
        ))}
    </div>
);


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
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'var(--font-main)'
        }}>
            <style>{neuralStyles}</style>
            <NeuralBackground />
            
            {/* ─── Sidebar ─── */}
            <div className="glass-panel-premium" style={{
                width: 320,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 20,
                borderRight: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ padding: '30px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <motion.div 
                                whileHover={{ rotate: 180 }}
                                style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)' }}
                            >
                                <MessageSquare size={20} color="#fff" />
                            </motion.div>
                            <div>
                                <h2 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>Neural Link</h2>
                                <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Quantum Core v3</div>
                            </div>
                        </div>
                        <button style={{
                            width: 38, height: 38, borderRadius: 14, border: '1px solid rgba(99, 102, 241, 0.2)',
                            background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }} className="hover-lift">
                           <Plus size={22} />
                        </button>
                    </div>
                    
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Identify connection..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 16px 14px 46px', borderRadius: 16,
                                background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#fff', fontSize: 14, outline: 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            className="focus-glow"
                        />
                    </div>
                </div>

                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                    {isSearching ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 16 }}>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ width: 32, height: 32, border: '3px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}
                            />
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Scanning Network...</div>
                        </div>
                    ) : searchTerm && searchTerm.length >= 2 ? (
                        searchResults.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ padding: '0 16px 12px', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Found Connections</div>
                                {searchResults.map(u => (
                                    <motion.button
                                        key={u.id}
                                        whileHover={{ x: 4 }}
                                        onClick={() => handleStartChat(u)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                                            padding: '12px 16px', border: 'none', background: 'transparent',
                                            cursor: 'pointer', borderRadius: 16, textAlign: 'left', transition: 'all 0.2s'
                                        }}
                                        className="hover-bg"
                                    >
                                        <UserAvatar user={u} size={40} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{getUserName(u)}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{u.email}</div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>No users found for "{searchTerm}"</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>Verify identity and try again</div>
                            </div>
                        )
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {conversations.length > 0 ? (
                                conversations.map(conv => {
                                    const other = conv.participants?.[0];
                                    const lastMsg = conv.messages?.[0];
                                    const isActive = activeConversation?.id === conv.id;
                                    
                                    return (
                                        <motion.button
                                            key={conv.id}
                                            whileHover={{ x: 4 }}
                                            onClick={() => setActiveConversation(conv)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                                                padding: '14px 16px', border: 'none',
                                                background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                                                cursor: 'pointer', borderRadius: 20, textAlign: 'left',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative'
                                            }}
                                            className={!isActive ? "hover-bg" : "sidebar-item-active"}
                                        >
                                            <UserAvatar user={other} size={48} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <span style={{ fontSize: 15, fontWeight: 800, color: isActive ? 'var(--primary)' : '#fff' }}>
                                                        {getUserName(other)}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                                        {timeAgo(conv.updatedAt)}
                                                    </span>
                                                </div>
                                                <div style={{ 
                                                    fontSize: 13, color: isActive ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255,255,255,0.5)', 
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    fontWeight: (lastMsg && !isActive) ? 600 : 400
                                                }}>
                                                    {lastMsg ? (lastMsg.senderId === user?.id ? 'You: ' : '') + lastMsg.content : 'Initiate sequence...'}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="active-indicator"
                                                    style={{ position: 'absolute', right: 12, width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} 
                                                />
                                            )}
                                        </motion.button>
                                    );
                                })
                            ) : (
                                <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.5 }}>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No active tunnels</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* ─── Main Chat ─── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
                {activeConversation ? (
                    <>
                        {/* Header */}
                        <div className="glass-panel-premium" style={{
                            padding: '20px 32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            zIndex: 10,
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                                <UserAvatar user={otherMember!} size={46} />
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{getUserName(otherMember)}</div>
                                    <div style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                                        <div className="neural-status-indicator" style={{ width: 6, height: 6 }} />
                                        Neural Tunnel Active
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {isMsgSearchVisible ? (
                                    <motion.div 
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 240, opacity: 1 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <Search size={16} color="rgba(255,255,255,0.5)" />
                                        <input 
                                            type="text" 
                                            placeholder="Query history..."
                                            value={msgSearchQuery}
                                            onChange={(e) => setMsgSearchQuery(e.target.value)}
                                            autoFocus
                                            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, width: '100%' }}
                                        />
                                        <button onClick={() => { setIsMsgSearchVisible(false); setMsgSearchQuery(''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}><X size={16} /></button>
                                    </motion.div>
                                ) : (
                                    <button className="icon-btn-subtle" onClick={() => setIsMsgSearchVisible(true)} style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)', width: 40, height: 40, borderRadius: 12 }}><Search size={20} /></button>
                                )}
                                
                                <div style={{ position: 'relative' }}>
                                    <button className="icon-btn-subtle" onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)', width: 40, height: 40, borderRadius: 12 }}><MoreHorizontal size={20} /></button>
                                    <AnimatePresence>
                                        {isMoreMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                                style={{
                                                    position: 'absolute', top: '100%', right: 0, marginTop: 12,
                                                    width: 200, background: 'rgba(15, 23, 42, 0.95)', borderRadius: 18,
                                                    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                                                    backdropFilter: 'blur(20px)',
                                                    zIndex: 100, overflow: 'hidden', padding: '6px'
                                                }}
                                            >
                                                <button className="more-menu-item" style={{ padding: '12px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', borderRadius: 12 }} onClick={() => setIsMoreMenuOpen(false)}><Bell size={16} /> Mute Channel</button>
                                                <button className="more-menu-item" style={{ padding: '12px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', borderRadius: 12 }} onClick={() => setIsMoreMenuOpen(false)}><Download size={16} /> Archive Logs</button>
                                                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 8px' }}></div>
                                                <button className="more-menu-item danger" style={{ padding: '12px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', borderRadius: 12 }} onClick={() => { setActiveMessages([]); setIsMoreMenuOpen(false); }}><Eraser size={16} /> Wipe Terminal</button>
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
                                                        padding: msg.imageUrl ? '10px' : '12px 18px',
                                                        borderRadius: isMe 
                                                            ? (isLastInGroup ? '22px 22px 6px 22px' : '22px 22px 22px 22px')
                                                            : (isLastInGroup ? '22px 22px 22px 6px' : '22px 22px 22px 22px'),
                                                        background: isMe 
                                                            ? 'linear-gradient(135deg, var(--primary), #4f46e5)' 
                                                            : 'rgba(255, 255, 255, 0.03)',
                                                        color: isMe ? '#fff' : 'var(--text-primary)',
                                                        border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                                                        boxShadow: isMe 
                                                            ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)' 
                                                            : '0 4px 12px rgba(0,0,0,0.1)',
                                                        fontSize: 14,
                                                        lineHeight: 1.6,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 6,
                                                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
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
                            padding: '24px 32px 32px',
                            zIndex: 10
                        }}>
                            {editingMessage ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(99, 102, 241, 0.1)', padding: '16px 20px', borderRadius: 20, marginBottom: 16, border: '1px solid rgba(99, 102, 241, 0.2)', backdropFilter: 'blur(20px)' }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Neural Stream Override</div>
                                        <input 
                                            type="text" 
                                            value={editContent} 
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleEditMessage(editingMessage)}
                                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: 15 }}
                                            autoFocus
                                        />
                                    </div>
                                    <button onClick={() => setEditingMessage(null)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
                                    <button onClick={() => handleEditMessage(editingMessage)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer' }}><Check size={18} /></button>
                                </motion.div>
                            ) : (
                                <form 
                                    onSubmit={handleSendMessage}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        padding: '10px 14px',
                                        borderRadius: 24,
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                        backdropFilter: 'blur(30px)'
                                    }}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleImageUpload} 
                                        style={{ display: 'none' }} 
                                        accept="image/*"
                                    />
                                    
                                    <motion.button 
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ width: 44, height: 44, borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        disabled={uploadingImage}
                                    >
                                        {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={22} />}
                                    </motion.button>
                                    
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
                                    <AnimatePresence>
                                        {replyingTo && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 50, opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    borderLeft: '4px solid var(--primary)',
                                                    padding: '6px 14px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '14px',
                                                    overflow: 'hidden',
                                                    borderRadius: '12px 12px 0 0',
                                                    marginBottom: -4,
                                                    zIndex: 1,
                                                    backdropFilter: 'blur(10px)'
                                                }}
                                            >
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Targeting: {replyingTo.sender.displayName}
                                                    </div>
                                                    <div style={{ color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px', marginTop: 2 }}>
                                                        {replyingTo.content || 'Media Stream'}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setReplyingTo(null)}
                                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 6 }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    <input
                                        type="text"
                                        placeholder="Transmit data packet..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '16px 8px',
                                            color: '#fff',
                                            fontSize: 15,
                                            outline: 'none',
                                            fontWeight: 500
                                        }}
                                    />
                                </div>
                                    
                                    <div style={{ position: 'relative' }}>
                                        <button type="button" style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-lift" onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}>
                                            <Smile size={22} />
                                        </button>
                                        <AnimatePresence>
                                            {isEmojiPickerOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -15, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -15, scale: 0.9 }}
                                                    style={{
                                                        position: 'absolute', bottom: '110%', right: 0,
                                                        width: 320, height: 240, background: 'rgba(15, 23, 42, 0.98)', borderRadius: 24,
                                                        border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 15px 50px rgba(0,0,0,0.6)',
                                                        backdropFilter: 'blur(30px)',
                                                        zIndex: 100, padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column'
                                                    }}
                                                >
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, overflowY: 'auto' }} className="custom-scrollbar">
                                                        {['❤️', '👍', '🔥', '😂', '😮', '😢', '😍', '🙌', '🚀', '✨', '💯', '🤔', '😎', '🙏', '🎉', '💡', '✅', '❌', '🧠', '🤖', '⚡', '🌌', '🔗', '🔒'].map(emoji => (
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
                                    
                                    <motion.button 
                                        whileHover={{ scale: 1.1, x: 2 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="submit" 
                                        disabled={(!messageInput.trim() && !uploadingImage) || isSending}
                                        style={{
                                            width: 44, height: 44, borderRadius: 18,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'var(--primary)', color: '#fff',
                                            border: 'none', cursor: 'pointer',
                                            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
                                            transition: 'all 0.3s ease',
                                            opacity: (!messageInput.trim() && !uploadingImage) || isSending ? 0.5 : 1
                                        }}
                                    >
                                        <Send size={22} />
                                    </motion.button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ 
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40, position: 'relative'
                    }}>
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.05, 1],
                                opacity: [0.6, 1, 0.6]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ 
                                width: 120, height: 120, borderRadius: 40, background: 'rgba(99, 102, 241, 0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                                marginBottom: 32, border: '1px solid rgba(99, 102, 241, 0.15)',
                                boxShadow: '0 0 40px rgba(99, 102, 241, 0.1)'
                            }}
                        >
                            <MessageSquare size={54} />
                        </motion.div>
                        <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>Neural Link Standby</h3>
                        <p style={{ maxWidth: 320, lineHeight: 1.7, fontSize: 15, fontWeight: 500 }}>
                            Select a neural pathway from the list or initiate a new connection to begin secure data transmission.
                        </p>
                        
                        <div style={{ position: 'absolute', bottom: 40, display: 'flex', gap: 24, opacity: 0.3 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}><Sparkles size={14} /> End-to-End Encryption</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}><Check size={14} /> Quantum Secure</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

