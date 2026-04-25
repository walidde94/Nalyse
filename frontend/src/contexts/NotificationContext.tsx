import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

export interface Notification {
    id: string;
    title: string;
    message: string;
    category: 'info' | 'alert' | 'success' | 'warning' | 'error' | string;
    priority: 'low' | 'medium' | 'high' | 'critical' | string;
    source: string;
    iconType: string;
    color: string;
    actionLabel?: string;
    actionUrl?: string;
    read: boolean;
    pinned?: boolean;
    createdAt: string;
    metadata?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    totalCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    addLocalNotification: (notification: Partial<Notification>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<any>(null);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications?limit=100&unreadOnly=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Backend returns { items: [...], total: N }
                setNotifications(data.items || []);
                setTotalCount(data.total || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // For instantaneous local updates from WebSockets or UI events before refetch
    const addLocalNotification = useCallback((notif: Partial<Notification>) => {
        const newNotif: Notification = {
            id: notif.id || 'local-' + Date.now().toString(),
            title: notif.title || 'Notification',
            message: notif.message || '',
            category: notif.category || 'info',
            priority: notif.priority || 'medium',
            source: notif.source || 'SYSTEM',
            iconType: notif.iconType || 'bell',
            color: notif.color || '#6366f1',
            read: false,
            createdAt: notif.createdAt || new Date().toISOString(),
            ...notif
        };
        // Deduplicate — don't add if we already have this ID
        setNotifications(prev => {
            if (prev.some(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
        });
    }, []);

    // Initial fetch and polling setup
    useEffect(() => {
        if (user && token) {
            fetchNotifications();
            // Fallback robust polling every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);

            // Socket connection for real-time updates
            const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
            socketRef.current = socket;

            socket.on('live_update', (payload: any) => {
                if (payload.entity === 'notification' && payload.data?.notification) {
                    const notif = payload.data.notification;
                    if (notif.userId === user.id) {
                        addLocalNotification(notif);

                        // Animate bell icon
                        const bell = document.getElementById('hdr-bell-icon');
                        if (bell) {
                            bell.classList.remove('animate-bell');
                            void bell.offsetWidth;
                            bell.classList.add('animate-bell');
                        }

                        // Play notification sound (single source — no duplicate in Header)
                        try {
                            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                            if (AudioContext) {
                                const ctx = new AudioContext();
                                if (ctx.state === 'suspended') ctx.resume();
                                const osc = ctx.createOscillator();
                                const gain = ctx.createGain();

                                osc.type = 'sine';
                                osc.frequency.setValueAtTime(800, ctx.currentTime);
                                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

                                gain.gain.setValueAtTime(0, ctx.currentTime);
                                gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
                                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

                                osc.connect(gain);
                                gain.connect(ctx.destination);
                                osc.start();
                                osc.stop(ctx.currentTime + 0.2);
                            }
                        } catch (err) { /* Audio auto-play blocked — silent fallback */ }
                    }
                }
            });

            return () => {
                clearInterval(interval);
                socket.disconnect();
                socketRef.current = null;
            };
        } else {
            setNotifications([]);
            setLoading(false);
        }
    }, [user, token, fetchNotifications, addLocalNotification]);

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        setNotifications([]);
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const clearAll = async () => {
        setNotifications([]);
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };



    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            totalCount,
            loading,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAll,
            addLocalNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
