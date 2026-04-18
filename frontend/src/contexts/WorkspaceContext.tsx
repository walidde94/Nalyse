import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

export interface Workspace {
    id: string;
    name: string;
    organizationId: string;
}

export interface AuditLog {
    id: string;
    action: string;
    entityId: string | null;
    details: any;
    createdAt: string;
    user?: { displayName: string | null, email: string };
}

export interface Presence {
    userId: string;
    action: string;
    timestamp: Date;
}

interface WorkspaceContextType {
    activeWorkspace: Workspace | null;
    workspaces: Workspace[];
    socket: Socket | null;
    isConnected: boolean;
    activityFeed: AuditLog[];
    activeUsers: Record<string, Presence>;
    setActiveWorkspace: (ws: Workspace) => void;
    refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token, isAuthenticated } = useAuth();
    
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activityFeed, setActivityFeed] = useState<AuditLog[]>([]);
    const [activeUsers, setActiveUsers] = useState<Record<string, Presence>>({});

    const fetchWorkspaces = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/workspaces`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data);
                
                // Set default workspace if none selected
                if (data.length > 0 && !activeWorkspace) {
                    const savedWsId = localStorage.getItem('activeWorkspaceId');
                    const savedWs = data.find((w: Workspace) => w.id === savedWsId);
                    setActiveWorkspace(savedWs || data[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch workspaces', err);
        }
    }, [token, activeWorkspace]);

    const fetchActivityFeed = useCallback(async (wsId: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${wsId}/activity`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setActivityFeed(data);
            }
        } catch (err) {
            console.error('Failed to fetch activity feed', err);
        }
    }, [token]);

    // Initial Load
    useEffect(() => {
        if (isAuthenticated) {
            fetchWorkspaces();
        } else {
            setWorkspaces([]);
            setActiveWorkspace(null);
            setActivityFeed([]);
            setActiveUsers({});
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [isAuthenticated, fetchWorkspaces]);

    // Handle Active Workspace Change & Socket Reconnection
    useEffect(() => {
        if (!activeWorkspace || !user || !token) return;

        localStorage.setItem('activeWorkspaceId', activeWorkspace.id);
        fetchActivityFeed(activeWorkspace.id);

        const newSocket = io(API_URL.replace('http', 'ws'), {
            auth: { token },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('join_workspace', { workspaceId: activeWorkspace.id, userId: user.id });
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('initial_presence', (occupants: Presence[]) => {
            const presenceMap: Record<string, Presence> = {};
            occupants.forEach(p => {
                presenceMap[p.userId] = p;
            });
            setActiveUsers(presenceMap);
        });

        newSocket.on('workspace:action', (log: AuditLog) => {
            setActivityFeed(prev => {
                // Prevent duplicate logs
                if (prev.some(l => l.id === log.id)) return prev;
                return [log, ...prev].slice(0, 50);
            });
            window.dispatchEvent(new CustomEvent('workspace:global_update', { detail: log }));
        });

        newSocket.on('new_message', (msg: any) => {
            window.dispatchEvent(new CustomEvent('workspace:new_message', { detail: msg }));
        });

        newSocket.on('workspace:presence', (presence: Presence) => {
            setActiveUsers(prev => {
                const next = { ...prev };
                if (presence.action === 'left' || presence.action === 'offline') {
                    delete next[presence.userId];
                } else {
                    next[presence.userId] = presence;
                }
                return next;
            });
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [activeWorkspace?.id, user?.id, token, fetchActivityFeed]);

    return (
        <WorkspaceContext.Provider value={{
            activeWorkspace,
            workspaces,
            socket,
            isConnected,
            activityFeed,
            activeUsers,
            setActiveWorkspace,
            refreshWorkspaces: fetchWorkspaces
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};
