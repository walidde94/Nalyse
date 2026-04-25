import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

export interface ChatParticipant {
    id: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    lastActiveAt?: string;
    presenceStatus?: string;
    organization?: {
        name: string;
    };
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    imageUrl?: string;
    reactions: any;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: string;
    sender: ChatParticipant;
    replyToId?: string;
    replyTo?: {
        id: string;
        content: string;
        sender: { displayName: string };
    };
}

export interface Conversation {
    id: string;
    participants: ChatParticipant[];
    messages: ChatMessage[];
    updatedAt: string;
}

interface ChatContextType {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    socket: Socket | null;
    unreadCount: number;
    isLoading: boolean;
    setActiveConversation: (conv: Conversation | null) => void;
    refreshConversations: () => Promise<void>;
    startConversation: (targetUserId: string) => Promise<Conversation>;
    sendMessage: (convId: string, content: string, imageUrl?: string, replyToId?: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token, isAuthenticated } = useAuth();
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConversations = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/chats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations();
        } else {
            setConversations([]);
            setActiveConversation(null);
            setUnreadCount(0);
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [isAuthenticated, fetchConversations]);

    const activeConversationIdRef = useRef<string | null>(null);

    useEffect(() => {
        activeConversationIdRef.current = activeConversation?.id || null;
    }, [activeConversation?.id]);

    // Socket initialization
    useEffect(() => {
        if (!token || !isAuthenticated) return;

        const newSocket = io(API_URL.replace('http', 'ws'), {
            auth: { token },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            console.log('[ChatSocket] Connected');
        });

        newSocket.on('new_message', (msg: ChatMessage) => {
            // Update conversations list
            setConversations(prev => {
                const existing = prev.find(c => c.id === msg.conversationId);
                if (existing) {
                    return [
                        { ...existing, messages: [msg], updatedAt: new Date().toISOString() },
                        ...prev.filter(c => c.id !== msg.conversationId)
                    ];
                }
                // If it's a new conversation we don't have yet, we should probably refresh
                fetchConversations();
                return prev;
            });

            // If it's the active conversation, dispatch local event for the view
            if (activeConversationIdRef.current === msg.conversationId) {
                window.dispatchEvent(new CustomEvent('chat:new_message', { detail: msg }));
            } else {
                // Increment unread if not active
                setUnreadCount(prev => prev + 1);
            }
        });

        newSocket.on('message_updated', (msg: ChatMessage) => {
            if (activeConversationIdRef.current === msg.conversationId) {
                window.dispatchEvent(new CustomEvent('chat:message_updated', { detail: msg }));
            }
        });

        newSocket.on('message_deleted', (payload: { id: string }) => {
            window.dispatchEvent(new CustomEvent('chat:message_deleted', { detail: payload }));
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token, isAuthenticated, fetchConversations]);

    // Automatically join the active conversation room
    useEffect(() => {
        if (socket && activeConversation && user) {
            socket.emit('join_chat', { conversationId: activeConversation.id, userId: user.id });
            // Clear unread for this conversation if we implement per-conversation unread
        }
    }, [socket, activeConversation?.id, user?.id]);

    const startConversation = async (targetUserId: string): Promise<Conversation> => {
        const res = await fetch(`${API_URL}/api/chats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ targetUserId })
        });
        if (!res.ok) throw new Error('Failed to start conversation');
        const conv = await res.json();
        
        setConversations(prev => {
            if (prev.some(c => c.id === conv.id)) return prev;
            return [conv, ...prev];
        });
        setActiveConversation(conv);
        return conv;
    };

    const sendMessage = async (convId: string, content: string, imageUrl?: string, replyToId?: string) => {
        const res = await fetch(`${API_URL}/api/chats/${convId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content, imageUrl, replyToId })
        });
        if (!res.ok) throw new Error('Failed to send message');
    };

    return (
        <ChatContext.Provider value={{
            conversations,
            activeConversation,
            socket,
            unreadCount,
            isLoading,
            setActiveConversation,
            refreshConversations: fetchConversations,
            startConversation,
            sendMessage
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
