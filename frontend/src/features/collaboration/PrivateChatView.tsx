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
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes float-up {
        0% { transform: translateY(0); opacity: 0; }
        15% { opacity: 0.08; }
        85% { opacity: 0.08; }
        100% { transform: translateY(-100vh); opacity: 0; }
    }
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
    @keyframes typing-dot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-6px); opacity: 1; }
    }

    /* ── Background System ── */
    .nc-bg { position: fixed; inset: 0; background: var(--bg-app); z-index: 0; overflow: hidden; }
    .nc-bg-mesh {
        position: absolute; inset: 0;
        background:
            radial-gradient(ellipse at 15% 20%, var(--primary-glow) 0, transparent 55%),
            radial-gradient(ellipse at 85% 80%, var(--accent-glow) 0, transparent 55%);
        filter: blur(80px); opacity: 0.7;
    }
    .nc-particle {
        position: absolute; bottom: -40px; width: 1px; height: 80px;
        background: linear-gradient(to top, transparent, var(--primary), transparent);
        filter: blur(0.5px); opacity: 0.15;
        animation: float-up 18s linear infinite;
    }

    /* ── Sidebar ── */
    .nc-sidebar {
        background: var(--bg-sidebar); backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        border-right: 1px solid var(--border-default);
    }
    .nc-conv-card {
        display: flex; align-items: center; gap: 12px; width: 100%;
        padding: 12px 16px; border: none; background: transparent;
        cursor: pointer; border-radius: 16px; text-align: left;
        transition: all 0.2s ease; position: relative;
    }
    .nc-conv-card:hover { background: var(--bg-surface-hover); }
    .nc-conv-card.active {
        background: var(--primary-subtle);
        box-shadow: inset 3px 0 0 var(--primary);
    }
    .nc-conv-card.active .nc-conv-name { color: var(--primary) !important; }
    .nc-unread-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: var(--primary); box-shadow: 0 0 8px var(--primary-glow);
        flex-shrink: 0;
    }

    /* ── Chat Header ── */
    .nc-header {
        padding: 16px 28px; display: flex; align-items: center;
        justify-content: space-between; z-index: 10;
        background: var(--bg-header); backdrop-filter: blur(30px) saturate(180%);
        -webkit-backdrop-filter: blur(30px) saturate(180%);
        border-bottom: 1px solid var(--border-default);
    }
    .nc-header-btn {
        width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border-default);
        background: var(--bg-surface); color: var(--text-secondary);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.2s ease;
    }
    .nc-header-btn:hover { background: var(--bg-surface-hover); color: var(--text-primary); border-color: var(--border-highlight); }

    /* ── Messages ── */
    .nc-msg-own {
        background: linear-gradient(135deg, var(--primary), var(--accent, #7c3aed));
        color: #fff !important; border-radius: 20px 20px 6px 20px;
        box-shadow: 0 4px 16px -4px var(--primary-glow);
    }
    .nc-msg-other {
        background: var(--bg-surface); color: var(--text-primary);
        border: 1px solid var(--border-default); border-radius: 20px 20px 20px 6px;
        box-shadow: var(--shadow-sm);
    }
    .nc-msg-own *, .nc-msg-own span { color: #fff !important; }
    .nc-msg-bubble {
        padding: 10px 16px; font-size: 14px; line-height: 1.55;
        position: relative; max-width: 420px; word-wrap: break-word;
        transition: transform 0.15s ease;
    }
    .nc-msg-bubble:hover { transform: scale(1.008); }

    /* Message Actions */
    .nc-msg-wrap:hover .nc-msg-actions { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0); }
    .nc-msg-actions {
        position: absolute; top: -32px; display: flex; gap: 2px;
        padding: 4px; background: var(--bg-elevated); border-radius: 10px;
        box-shadow: var(--shadow-md); border: 1px solid var(--border-default);
        z-index: 20; opacity: 0; visibility: hidden; pointer-events: none;
        transform: translateY(4px); transition: all 0.15s ease;
    }
    .nc-msg-actions::after {
        content: ''; position: absolute; top: 100%; left: 0; right: 0; height: 16px;
    }
    .nc-action-btn {
        padding: 4px 6px; border: none; background: transparent;
        cursor: pointer; border-radius: 6px; transition: background 0.15s;
        display: flex; align-items: center; justify-content: center;
    }
    .nc-action-btn:hover { background: var(--bg-surface-hover); }

    /* Date Separator */
    .nc-date-sep {
        display: flex; align-items: center; gap: 16px; padding: 20px 0 12px;
        user-select: none;
    }
    .nc-date-sep::before, .nc-date-sep::after {
        content: ''; flex: 1; height: 1px; background: var(--border-subtle);
    }
    .nc-date-sep span {
        font-size: 11px; font-weight: 700; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.08em;
        padding: 4px 14px; border-radius: 20px;
        background: var(--bg-surface); border: 1px solid var(--border-subtle);
    }

    /* ── Typing Indicator ── */
    .nc-typing { display: flex; gap: 4px; padding: 4px 0; align-items: center; }
    .nc-typing-dot {
        width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted);
    }
    .nc-typing-dot:nth-child(1) { animation: typing-dot 1.2s infinite 0s; }
    .nc-typing-dot:nth-child(2) { animation: typing-dot 1.2s infinite 0.15s; }
    .nc-typing-dot:nth-child(3) { animation: typing-dot 1.2s infinite 0.3s; }

    /* ── Composer ── */
    .nc-composer {
        padding: 16px 28px 24px; z-index: 10;
    }
    .nc-composer-box {
        display: flex; align-items: flex-end; gap: 10px;
        background: var(--bg-surface); border: 1px solid var(--border-default);
        border-radius: 20px; padding: 6px 8px; box-shadow: var(--shadow-md);
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    .nc-composer-box:focus-within {
        border-color: var(--primary);
        box-shadow: var(--shadow-md), 0 0 0 3px var(--primary-subtle);
    }
    .nc-composer-input {
        flex: 1; background: transparent; border: none; outline: none;
        padding: 10px 8px; color: var(--text-primary); font-size: 14px;
        font-weight: 500; min-height: 20px; resize: none;
        font-family: var(--font-main);
    }
    .nc-composer-input::placeholder { color: var(--text-muted); }
    .nc-composer-btn {
        width: 38px; height: 38px; border-radius: 14px; border: none;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
    }
    .nc-send-btn {
        background: var(--primary); color: #fff;
        box-shadow: 0 4px 12px -2px var(--primary-glow);
    }
    .nc-send-btn:hover { filter: brightness(1.1); transform: scale(1.05); }
    .nc-send-btn:disabled { opacity: 0.4; cursor: default; transform: none; filter: none; }
    .nc-attach-btn { background: transparent; color: var(--text-muted); }
    .nc-attach-btn:hover { background: var(--bg-surface-hover); color: var(--text-secondary); }

    /* ── Reply Preview ── */
    .nc-reply-bar {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 14px; margin: 0 28px 0;
        background: var(--primary-subtle); border-left: 3px solid var(--primary);
        border-radius: 0 12px 0 0; font-size: 13px;
    }

    /* ── Emoji Picker ── */
    .nc-emoji-grid {
        display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
        padding: 12px; overflow-y: auto;
    }
    .nc-emoji-item {
        font-size: 22px; padding: 8px; cursor: pointer; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.15s ease;
    }
    .nc-emoji-item:hover { background: var(--bg-surface-hover); transform: scale(1.2); }

    /* ── Scrollbar ── */
    .nc-scroll::-webkit-scrollbar { width: 4px; }
    .nc-scroll::-webkit-scrollbar-track { background: transparent; }
    .nc-scroll::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 4px; }
    .nc-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-disabled); }

    /* ── Reactions ── */
    .nc-reaction {
        padding: 2px 8px; border-radius: 20px; font-size: 12px;
        background: var(--bg-surface); border: 1px solid var(--border-subtle);
        display: inline-flex; align-items: center; gap: 4px;
        cursor: pointer; transition: all 0.15s ease;
    }
    .nc-reaction:hover { border-color: var(--primary); background: var(--primary-subtle); }

    /* ── Empty State ── */
    .nc-empty-icon {
        width: 100px; height: 100px; border-radius: 32px;
        background: var(--primary-subtle); border: 1px solid var(--border-highlight);
        display: flex; align-items: center; justify-content: center;
        color: var(--primary); margin-bottom: 24px;
    }

    /* ── More Menu ── */
    .nc-menu-item {
        padding: 10px 14px; font-size: 13px; font-weight: 500;
        display: flex; align-items: center; gap: 10px; width: 100%;
        border: none; background: transparent; color: var(--text-primary);
        cursor: pointer; border-radius: 10px; transition: background 0.15s;
    }
    .nc-menu-item:hover { background: var(--bg-surface-hover); }
    .nc-menu-item.danger { color: var(--danger); }
    .nc-menu-item.danger:hover { background: var(--danger-glow); }
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
                <img src={user.avatarUrl} alt="" style={{ width: size, height: size, borderRadius: size * 0.32, objectFit: 'cover', border: '2px solid var(--border-default)' }} />
            ) : (
                <div style={{
                    width: size, height: size, borderRadius: size * 0.32,
                    background: `linear-gradient(135deg, ${colors[idx]}, ${colors[idx]}bb)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: size * 0.36, fontWeight: 800, color: '#fff',
                    letterSpacing: '-0.02em',
                    boxShadow: `0 4px 12px ${colors[idx]}30`
                }}>
                    {getInitials(user)}
                </div>
            )}
            {status === 'online' && (
                <div style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: size * 0.28, height: size * 0.28, borderRadius: '50%',
                    background: '#22c55e', border: '2.5px solid var(--bg-sidebar)',
                    boxShadow: '0 0 6px rgba(34,197,94,0.5)'
                }} />
            )}
        </div>
    );
};

const NeuralBackground = () => (
    <div className="nc-bg">
        <div className="nc-bg-mesh" />
        {[...Array(8)].map((_, i) => (
            <div 
                key={i} 
                className="nc-particle" 
                style={{ 
                    left: `${10 + Math.random() * 80}%`, 
                    animationDelay: `${Math.random() * 12}s`,
                    animationDuration: `${18 + Math.random() * 12}s`
                }} 
            />
        ))}
    </div>
);


export const PrivateChatView: React.FC<{ initialConversationId?: string }> = ({ initialConversationId }) => {
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

    useEffect(() => {
        if (initialConversationId && conversations.length > 0) {
            const conv = conversations.find(c => c.id === initialConversationId);
            if (conv && activeConversation?.id !== conv.id) {
                setActiveConversation(conv);
            }
        }
    }, [initialConversationId, conversations, activeConversation?.id, setActiveConversation]);

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
            <div className="nc-sidebar" style={{
                width: 320, display: 'flex', flexDirection: 'column',
                position: 'relative', zIndex: 20
            }}>
                <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary), var(--accent, #8b5cf6))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px -2px var(--primary-glow)' }}>
                                <MessageSquare size={18} color="#fff" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Messages</h2>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 1 }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</div>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border-default)',
                                background: 'var(--bg-surface)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}
                        >
                           <Plus size={18} />
                        </motion.button>
                    </div>
                    
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 14px 10px 40px', borderRadius: 12,
                                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                transition: 'border-color 0.2s, box-shadow 0.2s'
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-subtle)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                    </div>
                </div>

                <div className="nc-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                    {isSearching ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 12 }}>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ width: 28, height: 28, border: '2.5px solid var(--border-default)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}
                            />
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Searching...</div>
                        </div>
                    ) : searchTerm && searchTerm.length >= 2 ? (
                        searchResults.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <div style={{ padding: '8px 16px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Users</div>
                                {searchResults.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => handleStartChat(u)}
                                        className="nc-conv-card"
                                    >
                                        <UserAvatar user={u} size={38} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{getUserName(u)}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{u.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>No results for "{searchTerm}"</div>
                            </div>
                        )
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {conversations.length > 0 ? (
                                conversations.map(conv => {
                                    const other = conv.participants?.[0];
                                    const lastMsg = conv.messages?.[0];
                                    const isActive = activeConversation?.id === conv.id;
                                    
                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => setActiveConversation(conv)}
                                            className={`nc-conv-card ${isActive ? 'active' : ''}`}
                                        >
                                            <UserAvatar user={other} size={44} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                                    <span className="nc-conv-name" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {getUserName(other)}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                                                        {timeAgo(conv.updatedAt)}
                                                    </span>
                                                </div>
                                                <div style={{ 
                                                    fontSize: 13, color: 'var(--text-muted)', 
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    fontWeight: 400
                                                }}>
                                                    {lastMsg ? (lastMsg.senderId === user?.id ? 'You: ' : '') + lastMsg.content : 'Start a conversation...'}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                                    <MessageSquare size={32} style={{ color: 'var(--text-disabled)', marginBottom: 12 }} />
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>No conversations yet</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 4 }}>Search for someone to start chatting</div>
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
                        <div className="nc-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <UserAvatar user={otherMember!} size={42} />
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{getUserName(otherMember)}</div>
                                    <div style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, marginTop: 2 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success-glow)' }} />
                                        Online
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {isMsgSearchVisible ? (
                                    <motion.div 
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 220, opacity: 1 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-default)' }}
                                    >
                                        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                        <input 
                                            type="text" 
                                            placeholder="Search messages..."
                                            value={msgSearchQuery}
                                            onChange={(e) => setMsgSearchQuery(e.target.value)}
                                            autoFocus
                                            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%' }}
                                        />
                                        <button onClick={() => { setIsMsgSearchVisible(false); setMsgSearchQuery(''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}><X size={14} /></button>
                                    </motion.div>
                                ) : (
                                    <button className="nc-header-btn" onClick={() => setIsMsgSearchVisible(true)}><Search size={16} /></button>
                                )}
                                
                                <div style={{ position: 'relative' }}>
                                    <button className="nc-header-btn" onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}><MoreHorizontal size={16} /></button>
                                    <AnimatePresence>
                                        {isMoreMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                style={{
                                                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                                                    width: 200, background: 'var(--bg-elevated)', borderRadius: 14,
                                                    border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)',
                                                    zIndex: 100, overflow: 'hidden', padding: '4px'
                                                }}
                                            >
                                                <button className="nc-menu-item" onClick={() => setIsMoreMenuOpen(false)}><Bell size={15} /> Mute</button>
                                                <button className="nc-menu-item" onClick={() => setIsMoreMenuOpen(false)}><Download size={15} /> Export Chat</button>
                                                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 8px' }} />
                                                <button className="nc-menu-item danger" onClick={() => { setActiveMessages([]); setIsMoreMenuOpen(false); }}><Eraser size={15} /> Clear Chat</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div 
                            className="nc-scroll"
                            ref={chatContainerRef}
                            style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 4 }}
                        >
                            <AnimatePresence initial={false}>
                                {filteredMessages.map((msg, idx) => {
                                    const isMe = msg.senderId === user?.id;
                                    const nextMsg = filteredMessages[idx + 1];
                                    const prevMsg = filteredMessages[idx - 1];
                                    const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                                    
                                    // Date separator logic
                                    const msgDate = new Date(msg.createdAt).toDateString();
                                    const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
                                    const showDateSep = !prevMsg || msgDate !== prevDate;
                                    
                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDateSep && (
                                                <div className="nc-date-sep">
                                                    <span>{new Date(msg.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            )}
                                            <motion.div
                                                id={`msg-${msg.id}`}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15 }}
                                                style={{
                                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                    maxWidth: '70%',
                                                    marginBottom: isLastInGroup ? 10 : 1,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isMe ? 'flex-end' : 'flex-start',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                                                    {!isMe && isLastInGroup && (
                                                        <div style={{ marginBottom: 2 }}><UserAvatar user={msg.sender} size={28} /></div>
                                                    )}
                                                    {!isMe && !isLastInGroup && <div style={{ width: 28 }} />}

                                                    <div 
                                                        className="nc-msg-wrap"
                                                        style={{ position: 'relative' }}
                                                    >
                                                        <div className={`nc-msg-bubble ${isMe ? 'nc-msg-own' : 'nc-msg-other'}`}
                                                            style={{
                                                                borderRadius: isMe 
                                                                    ? (isLastInGroup ? '18px 18px 4px 18px' : '18px')
                                                                    : (isLastInGroup ? '18px 18px 18px 4px' : '18px'),
                                                                padding: msg.imageUrl ? '6px' : undefined
                                                            }}
                                                        >
                                                            {msg.replyTo && (
                                                                <div style={{
                                                                    padding: '6px 10px', margin: '2px 2px 6px',
                                                                    background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--bg-surface-hover)',
                                                                    borderRadius: 8,
                                                                    borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,0.5)' : 'var(--primary)'}`,
                                                                    fontSize: 12, cursor: 'pointer', maxWidth: 280
                                                                }} onClick={() => {
                                                                    const el = document.getElementById(`msg-${msg.replyToId}`);
                                                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                }}>
                                                                    <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 2 }}>
                                                                        {msg.replyTo.sender.displayName}
                                                                    </div>
                                                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.8 }}>
                                                                        {msg.replyTo.content || "Media"}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!msg.isDeleted && (
                                                                <>
                                                                    {msg.imageUrl && (
                                                                        brokenImageIds.has(msg.id) ? (
                                                                            <div style={{
                                                                                width: '100%', aspectRatio: '4/3',
                                                                                background: 'var(--bg-surface-hover)', borderRadius: 12,
                                                                                display: 'flex', flexDirection: 'column',
                                                                                alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                                color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)',
                                                                                marginBottom: msg.content ? 6 : 0
                                                                            }}>
                                                                                <ImageOff size={22} />
                                                                                <span style={{ fontSize: 11 }}>Unavailable</span>
                                                                            </div>
                                                                        ) : (
                                                                            <img 
                                                                                src={msg.imageUrl.startsWith('http') ? msg.imageUrl : `${API_URL}${msg.imageUrl}`} 
                                                                                alt="Shared" 
                                                                                style={{ 
                                                                                    maxWidth: '100%', borderRadius: 12, display: 'block',
                                                                                    marginBottom: msg.content ? 6 : 0, cursor: 'pointer',
                                                                                    background: 'var(--bg-surface-hover)'
                                                                                }} 
                                                                                onError={() => setBrokenImageIds(prev => new Set(prev).add(msg.id))}
                                                                                onClick={() => {
                                                                                    if (!msg.imageUrl) return;
                                                                                    window.open(msg.imageUrl.startsWith('http') ? msg.imageUrl : `${API_URL}${msg.imageUrl}`, '_blank');
                                                                                }}
                                                                            />
                                                                        )
                                                                    )}
                                                                    {msg.content}
                                                                    {msg.isEdited && <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 6 }}>(edited)</span>}
                                                                </>
                                                            )}
                                                            {msg.isDeleted && (
                                                                <span style={{ fontStyle: 'italic', opacity: 0.5 }}>{msg.content}</span>
                                                            )}
                                                        </div>

                                                        {/* Message Actions */}
                                                        {!msg.isDeleted && (
                                                            <div className="nc-msg-actions" style={{ [isMe ? 'right' : 'left']: 0 }}>
                                                                <button className="nc-action-btn" onClick={() => handleReaction(msg.id, '❤️')}>❤️</button>
                                                                <button className="nc-action-btn" onClick={() => handleReaction(msg.id, '👍')}>👍</button>
                                                                <button className="nc-action-btn" onClick={() => setReplyingTo(msg)} title="Reply">
                                                                    <MessageSquare size={12} style={{ color: 'var(--text-muted)' }} />
                                                                </button>
                                                                {isMe && (
                                                                    <>
                                                                        <button className="nc-action-btn" onClick={() => { setEditingMessage(msg.id); setEditContent(msg.content); }}>
                                                                            <Edit2 size={12} style={{ color: 'var(--text-muted)' }} />
                                                                        </button>
                                                                        <button className="nc-action-btn" onClick={() => handleDeleteMessage(msg.id)}>
                                                                            <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Reactions */}
                                                {msg.reactions && (msg.reactions as any[]).length > 0 && (
                                                    <div style={{ display: 'flex', gap: 4, marginTop: 4, marginLeft: isMe ? 0 : 36 }}>
                                                        {(msg.reactions as any[]).map((r, i) => (
                                                            <div key={i} className="nc-reaction">
                                                                {r.emoji} <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)' }}>{r.userIds.length}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {isLastInGroup && (
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, marginLeft: isMe ? 0 : 36, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && <CheckCheck size={12} style={{ color: 'var(--primary)' }} />}
                                                    </div>
                                                )}
                                            </motion.div>
                                        </React.Fragment>
                                    );
                                })}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Preview */}
                        <AnimatePresence>
                            {replyingTo && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="nc-reply-bar"
                                >
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 11, marginBottom: 2 }}>
                                            Replying to {replyingTo.sender?.displayName || 'User'}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>
                                            {replyingTo.content || 'Media'}
                                        </div>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Composer */}
                        <div className="nc-composer">
                            {editingMessage ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--primary-subtle)', padding: '12px 16px', borderRadius: 16, marginBottom: 12, border: '1px solid var(--border-highlight)' }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>Editing message</div>
                                        <input 
                                            type="text" 
                                            value={editContent} 
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleEditMessage(editingMessage)}
                                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 14 }}
                                            autoFocus
                                        />
                                    </div>
                                    <button onClick={() => setEditingMessage(null)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                                    <button onClick={() => handleEditMessage(editingMessage)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSendMessage}>
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
                                    <div className="nc-composer-box">
                                        <button 
                                            type="button" 
                                            className="nc-composer-btn nc-attach-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingImage}
                                        >
                                            {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                                        </button>
                                        
                                        <input
                                            type="text"
                                            className="nc-composer-input"
                                            placeholder="Type a message..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                        />
                                        
                                        <div style={{ position: 'relative' }}>
                                            <button type="button" className="nc-composer-btn nc-attach-btn" onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}>
                                                <Smile size={18} />
                                            </button>
                                            <AnimatePresence>
                                                {isEmojiPickerOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                        style={{
                                                            position: 'absolute', bottom: '120%', right: 0,
                                                            width: 300, background: 'var(--bg-elevated)', borderRadius: 16,
                                                            border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)',
                                                            zIndex: 100, overflow: 'hidden'
                                                        }}
                                                    >
                                                        <div className="nc-emoji-grid nc-scroll">
                                                            {['❤️', '👍', '🔥', '😂', '😮', '😢', '😍', '🙌', '🚀', '✨', '💯', '🤔', '😎', '🙏', '🎉', '💡', '✅', '❌', '🧠', '🤖', '⚡', '🌌', '🔗', '🔒', '👋', '🎯', '💎', '🏆'].map(emoji => (
                                                                <div 
                                                                    key={emoji} 
                                                                    className="nc-emoji-item"
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
                                            className="nc-composer-btn nc-send-btn"
                                            disabled={(!messageInput.trim() && !uploadingImage) || isSending}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ 
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', textAlign: 'center', padding: 40, position: 'relative'
                    }}>
                        <motion.div 
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="nc-empty-icon"
                        >
                            <MessageSquare size={44} />
                        </motion.div>
                        <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Select a conversation</h3>
                        <p style={{ maxWidth: 300, lineHeight: 1.6, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
                            Choose from your existing conversations or search for someone to start a new chat.
                        </p>
                        
                        <div style={{ position: 'absolute', bottom: 40, display: 'flex', gap: 20, opacity: 0.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}><Sparkles size={13} /> End-to-End Encrypted</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}><Check size={13} /> Secure</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

