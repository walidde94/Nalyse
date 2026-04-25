import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import { API_URL } from '../config';

export interface Presence {
    status: 'available' | 'busy' | 'away' | 'offline' | 'vacation';
    text: string | null;
}

interface PresenceContextType {
    presences: Record<string, Presence>;
    updateMyPresence: (status: Presence['status'], text?: string | null) => Promise<void>;
    getPresence: (userId: string) => Presence;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [presences, setPresences] = useState<Record<string, Presence>>({});

    // Fetch initial presence map for the organization
    const fetchPresences = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/presence/org`, {
                headers: { 'Authorization': `Bearer ${token}` }
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

    useEffect(() => {
        if (user && token) {
            fetchPresences();

            // Set up socket listener for live presence updates
            const socket = io(API_URL.replace('http', 'ws'), {
                auth: { token },
                transports: ['websocket']
            });
            
            socket.on('live_update', (payload: any) => {
                if (payload.entity === 'presence') {
                    const { userId, status, customText } = payload.data;
                    setPresences(prev => ({
                        ...prev,
                        [userId]: { status: status || 'available', text: customText || null }
                    }));
                }
            });

            return () => {
                socket.disconnect();
            };
        } else {
            setPresences({});
        }
    }, [user, token, fetchPresences]);

    const updateMyPresence = async (status: Presence['status'], text?: string | null) => {
        if (!user || !token) return;
        
        // Optimistic update
        setPresences(prev => ({
            ...prev,
            [user.id]: { status, text: text || null }
        }));

        try {
            await fetch(`${API_URL}/api/presence`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, customText: text })
            });
        } catch (error) {
            console.error('Failed to update presence', error);
        }
    };

    const getPresence = useCallback((userId: string): Presence => {
        return presences[userId] || { status: 'offline', text: null };
    }, [presences]);

    return (
        <PresenceContext.Provider value={{ presences, updateMyPresence, getPresence }}>
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
