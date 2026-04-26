import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Reply, Check, Trash2, MoreHorizontal, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { API_URL } from '../../config';


interface Author {
  id: string; email: string; firstName?: string; lastName?: string;
  displayName?: string; avatarUrl?: string;
}
interface Comment {
  id: string; content: string; targetType: string; targetId?: string;
  authorId: string; author: Author; isResolved: boolean;
  createdAt: string; replies?: Comment[]; replyToId?: string;
}

interface Props {
  analysisId: string; targetType: string; targetId?: string;
  isOpen: boolean; onClose: () => void; title?: string;
}

const getInitials = (a: Author) => {
  if (a.displayName) return a.displayName.slice(0, 2).toUpperCase();
  if (a.firstName) return (a.firstName[0] + (a.lastName?.[0] || '')).toUpperCase();
  return a.email.slice(0, 2).toUpperCase();
};
const getName = (a: Author) => a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email;
const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const COLORS = ['#818cf8','#34d399','#f472b6','#fbbf24','#38bdf8','#a78bfa'];
const getColor = (id: string) => COLORS[id.charCodeAt(0) % COLORS.length];

export const CommentThread = ({ analysisId, targetType, targetId, isOpen, onClose, title }: Props) => {
  const { token, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { socket } = useChat();


  const fetchComments = async () => {
    if (!token || !analysisId) return;
    try {
      const q = new URLSearchParams({ targetType });
      if (targetId) q.set('targetId', targetId);
      const res = await fetch(`${API_URL}/api/comments/${analysisId}?${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setComments(await res.json());
    } catch {}
  };

  useEffect(() => { if (isOpen) fetchComments(); }, [isOpen, analysisId, targetType, targetId]);

  useEffect(() => {
    if (!socket || !analysisId) return;

    socket.emit('join_analysis', { analysisId });

    const handleCreated = (newComment: Comment) => {
      // Only add if it matches current filter
      if (newComment.targetType === targetType && newComment.targetId === (targetId || null)) {
        setComments(prev => {
          if (prev.some(c => c.id === newComment.id)) return prev;
          if (newComment.replyToId) {
             return prev.map(c => c.id === newComment.replyToId ? { ...c, replies: [...(c.replies || []), newComment] } : c);
          }
          return [newComment, ...prev];
        });
      }
    };

    const handleUpdated = (updated: Comment) => {
      setComments(prev => {
        if (updated.replyToId) {
          return prev.map(c => c.id === updated.replyToId ? {
            ...c,
            replies: (c.replies || []).map(r => r.id === updated.id ? updated : r)
          } : c);
        }
        return prev.map(c => c.id === updated.id ? { ...updated, replies: c.replies } : c);
      });
    };

    const handleDeleted = (payload: { id: string }) => {
      setComments(prev => {
        // Try removing from top level
        const filtered = prev.filter(c => c.id !== payload.id);
        // Also try removing from replies
        return filtered.map(c => ({
          ...c,
          replies: (c.replies || []).filter(r => r.id !== payload.id)
        }));
      });
    };

    socket.on('comment_created', handleCreated);
    socket.on('comment_updated', handleUpdated);
    socket.on('comment_deleted', handleDeleted);

    return () => {
      socket.emit('leave_analysis', { analysisId });
      socket.off('comment_created', handleCreated);
      socket.off('comment_updated', handleUpdated);
      socket.off('comment_deleted', handleDeleted);
    };
  }, [socket, analysisId, targetType, targetId]);


  const submit = async () => {
    if (!input.trim() || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId, content: input.trim(), targetType,
          targetId: targetId || null, replyToId: replyTo?.id || null
        })
      });
      if (res.ok) {
        setInput(''); setReplyTo(null);
        await fetchComments();
        setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }
    } catch {} finally { setLoading(false); }
  };

  const deleteComment = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/comments/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      await fetchComments();
    } catch {}
  };

  const toggleResolve = async (c: Comment) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/comments/${c.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: !c.isResolved })
      });
      await fetchComments();
    } catch {}
  };

  const renderComment = (c: Comment, isReply = false) => {
    const color = getColor(c.authorId);
    const isOwn = c.authorId === user?.id;
    return (
      <motion.div key={c.id}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          padding: isReply ? '10px 12px' : '14px 16px',
          marginLeft: isReply ? 28 : 0,
          borderRadius: 12,
          background: c.isResolved ? 'rgba(52,211,153,0.05)' : 'var(--bg-surface)',
          border: `1px solid ${c.isResolved ? 'rgba(52,211,153,0.15)' : 'var(--bg-surface-hover)'}`,
          position: 'relative',
        }}
      >
        {isReply && <div style={{
          position: 'absolute', left: -16, top: 18, width: 12, height: 1,
          background: 'var(--border-default)'
        }} />}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: isReply ? 26 : 32, height: isReply ? 26 : 32, borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}40, ${color}20)`,
            border: `1.5px solid ${color}50`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: isReply ? 9 : 11, fontWeight: 800,
            color, flexShrink: 0,
          }}>
            {getInitials(c.author)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {getName(c.author)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{timeAgo(c.createdAt)}</span>
              {c.isResolved && (
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 6,
                  background: 'rgba(52,211,153,0.1)', color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.2)', textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Resolved</span>
              )}
            </div>
            <p style={{
              fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)',
              margin: 0, wordBreak: 'break-word'
            }}>{c.content}</p>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {!isReply && (
                <button onClick={() => { setReplyTo(c); inputRef.current?.focus(); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px',
                    borderRadius: 6, fontSize: 11, fontWeight: 600, display: 'flex',
                    alignItems: 'center', gap: 4, color: 'var(--text-tertiary)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                  <Reply size={12} /> Reply
                </button>
              )}
              <button onClick={() => toggleResolve(c)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px',
                  borderRadius: 6, fontSize: 11, fontWeight: 600, display: 'flex',
                  alignItems: 'center', gap: 4, color: 'var(--text-tertiary)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.color = '#34d399'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
              >
                <Check size={12} /> {c.isResolved ? 'Unresolve' : 'Resolve'}
              </button>
              {isOwn && (
                <button onClick={() => deleteComment(c.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px',
                    borderRadius: 6, fontSize: 11, fontWeight: 600, display: 'flex',
                    alignItems: 'center', gap: 4, color: 'var(--text-tertiary)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
        {c.replies && c.replies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10,
            borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: 4 }}>
            {c.replies.map(r => renderComment(r, true))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
            maxWidth: '100vw', zIndex: 1000, display: 'flex', flexDirection: 'column',
            background: 'var(--bg-sidebar)',
            borderLeft: '1px solid var(--border-subtle)',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 20px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8'
              }}>
                <MessageCircle size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Comments
                </h3>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  {title || targetType} · {comments.length} thread{comments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)',
              borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Comments List */}
          <div ref={scrollRef} style={{
            flex: 1, overflowY: 'auto', padding: 16, display: 'flex',
            flexDirection: 'column', gap: 10,
          }}>
            {comments.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 12, opacity: 0.3, padding: 40,
              }}>
                <MessageCircle size={40} strokeWidth={1} />
                <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  No comments yet
                </span>
                <span style={{ fontSize: 11, textAlign: 'center' }}>
                  Start a conversation about this {targetType}
                </span>
              </div>
            ) : comments.map(c => renderComment(c))}
          </div>

          {/* Reply Banner */}
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  padding: '8px 16px', background: 'rgba(129,140,248,0.06)',
                  borderTop: '1px solid rgba(129,140,248,0.15)',
                  display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden'
                }}
              >
                <Reply size={14} style={{ color: '#818cf8', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Replying to {getName(replyTo.author)}
                </span>
                <button onClick={() => setReplyTo(null)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                  padding: 2, display: 'flex'
                }}>
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div style={{
            padding: 16, borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
              background: 'var(--bg-surface)', borderRadius: 12,
              border: '1px solid var(--border-default)', padding: '4px 4px 4px 12px',
              transition: 'border-color 0.2s',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                placeholder="Add a comment..."
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
                  color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-main)',
                  lineHeight: 1.5, padding: '8px 0', minHeight: 36, maxHeight: 120,
                }}
              />
              <button
                onClick={submit}
                disabled={!input.trim() || loading}
                style={{
                  width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: input.trim() ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'var(--bg-surface-hover)',
                  color: input.trim() ? '#fff' : 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0, opacity: loading ? 0.5 : 1,
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Badge button to show on each chart/section
export const CommentBadge = ({ count, onClick }: { count?: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    title="Comments"
    style={{
      background: count ? 'rgba(129,140,248,0.12)' : 'var(--bg-surface-hover)',
      border: `1px solid ${count ? 'rgba(129,140,248,0.25)' : 'var(--border-default)'}`,
      borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer', position: 'relative',
      color: count ? '#818cf8' : 'var(--text-secondary)', transition: 'all 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.15)'; e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.transform = 'scale(1.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = count ? 'rgba(129,140,248,0.12)' : 'var(--bg-surface-hover)'; e.currentTarget.style.color = count ? '#818cf8' : 'var(--text-secondary)'; e.currentTarget.style.transform = 'scale(1)'; }}
  >
    <MessageCircle size={14} />
    {(count ?? 0) > 0 && (
      <span style={{
        position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16,
        borderRadius: 8, background: '#818cf8', color: 'var(--text-primary)', fontSize: 9,
        fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px', boxShadow: '0 2px 8px rgba(129,140,248,0.4)',
      }}>
        {count}
      </span>
    )}
  </button>
);
