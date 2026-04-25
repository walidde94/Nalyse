import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import { API_URL } from '../config';

export interface Presence {
    status: 'available' | 'busy' | 'away' | 'offline' | 'vacation';
    text: string | null;
}

interface PresenceContextType {
    presences: Record<string, Presence>;
    updateMyPresence: (status: Presence['status'], text?: string | null) => Promise<void>;
    getPresence: (userId: string) => Presence;
    refreshPresences: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token, isAuthenticated } = useAuth();
    const { socket } = useChat();
    const [presences, setPresences] = useState<Record<string, Presence>>({});

    // Fetch initial presence map for the organization
    const fetchPresences = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/presence/org`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            if (res.ok) {
                const data = await res.json();
                const presenceMap: Record<string, Presence> = {};
                
                if (Array.isArray(data)) {
                    data.forEach((u: any) => {
                        presenceMap[u.id] = {
                            status: u.presenceStatus || 'available',
                            text: u.customStatusText || null
                        };
                    });
                }
                
                setPresences(presenceMap);
            }
        } catch (error) {
            console.error('Error fetching org presences:', error);
        }
    }, [token]);

    // Initial fetch and polling
    useEffect(() => {
        if (isAuthenticated && token) {
            fetchPresences();
            const interval = setInterval(fetchPresences, 60000);
            return () => clearInterval(interval);
        } else {
            setPresences({});
        }
    }, [isAuthenticated, token, fetchPresences]);

    // Socket listener
    useEffect(() => {
        if (!socket) return;

        const handleLiveUpdate = (payload: any) => {
            if (payload.entity === 'presence') {
                const { userId, status, customText } = payload.data;
                console.log(`[Presence] Live update for ${userId}: ${status}`);
                setPresences(prev => ({
                    ...prev,
                    [userId]: { status: status || 'available', text: customText || null }
                }));
            }
        };

        const handleConnect = () => {
            console.log('[Presence] Socket connected, syncing state...');
            fetchPresences();
        };

        socket.on('live_update', handleLiveUpdate);
        socket.on('connect', handleConnect);

        // If already connected, sync immediately
        if (socket.connected) {
            fetchPresences();
        }

        return () => {
            socket.off('live_update', handleLiveUpdate);
            socket.off('connect', handleConnect);
        };
    }, [socket]);

    const updateMyPresence = async (status: Presence['status'], text?: string | null) => {
        if (!user || !token) return;
        
        // Optimistic update
        setPresences(prev => ({
            ...prev,
            [user.id]: { status, text: text || null }
        }));

        try {
            const res = await fetch(`${API_URL}/api/presence`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, customText: text })
            });
            
            if (!res.ok) {
                // If it failed, revert the optimistic update by re-fetching
                fetchPresences();
            }
        } catch (error) {
            console.error('Failed to update presence', error);
            fetchPresences();
        }
    };

    const getPresence = useCallback((userId: string): Presence => {
        return presences[userId] || { status: 'offline', text: null };
    }, [presences]);

    return (
        <PresenceContext.Provider value={{ presences, updateMyPresence, getPresence, refreshPresences: fetchPresences }}>
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => {
    const context = useContext(PresenceContext);
    if (context === undefined) {
        throw new Error('usePresence must be used within a PresenceProvider');
    }
    return context;
};
