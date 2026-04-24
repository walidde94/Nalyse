import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    emailVerified: boolean;
    bio?: string;
    displayName?: string;
    avatarUrl?: string;
    notificationPreferences?: any;
    apiKeys?: any[];
    organization?: {
        id: string;
        name: string;
        plan: string;
        subscriptionStartedAt?: string;
        currentPeriodEnd?: string;
        cancelAtPeriodEnd?: boolean;
    };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, firstName?: string, lastName?: string, organizationName?: string) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    syncSubscription: () => Promise<{ success: boolean; message?: string } | false>;
    requestSubscriptionCancellation: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_URL } from '../config';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('accessToken');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));

                // Validate token by fetching profile
                try {
                    const res = await fetch(`${API_URL}/api/auth/profile`, {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });

                    if (res.ok) {
                        const { user } = await res.json();
                        setUser(user);
                        localStorage.setItem('user', JSON.stringify(user));
                    } else {
                        const data = await res.json().catch(() => ({}));
                        if (data.code === 'FORCE_LOGOUT') {
                            logout();
                            return;
                        }
                        // Token invalid, try refresh
                        await refreshToken();
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    logout();
                }
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    // Auto-refresh token before expiry
    useEffect(() => {
        if (!token) return;

        // Refresh token every 10 minutes (tokens expire in 15 min)
        const interval = setInterval(() => {
            refreshToken();
        }, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, [token]);

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await res.json();

        setToken(data.accessToken);
        setUser(data.user);

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
    };

    const register = async (email: string, password: string, firstName?: string, lastName?: string, organizationName?: string) => {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName, organizationName })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Registration failed');
        }

        // After registration, automatically log in
        localStorage.setItem('is_new_user', 'true');
        await login(email, password);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    };

    const refreshToken = async () => {
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (!storedRefreshToken) {
            logout();
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: storedRefreshToken })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data.code === 'FORCE_LOGOUT') {
                    console.warn('[Security] Refresh token invalidated by force logout signal');
                }
                logout();
                return;
            }

            const data = await res.json();

            setToken(data.accessToken);
            setUser(data.user);

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
        }
    };

    const refreshProfile = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Handle response format variations (some endpoints return {user}, others just user)
                const userData = data.user || data;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                const data = await res.json().catch(() => ({}));
                if (data.code === 'FORCE_LOGOUT') {
                    logout();
                }
            }
        } catch (e) {
            console.error('Failed to refresh profile:', e);
        }
    };

    const syncSubscription = async () => {
        if (!token) return false;
        try {
            const res = await fetch(`${API_URL}/api/subscription/sync-status`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || 'Sync failed on server');
            }

            const syncData = await res.json();

            // Fetch the latest profile to update state
            const profileRes = await fetch(`${API_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (profileRes.ok) {
                const data = await profileRes.json();
                const userData = data.user || data;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));

                // Return success and the message from sync logic
                if (syncData.plan === 'pro' || syncData.plan === 'enterprise') {
                    return { success: true, message: 'Your account has been upgraded successfully.' };
                } else {
                    return { success: false, message: syncData.message || 'No active subscription found. You are on the free plan.' };
                }
            }
            throw new Error('Failed to fetch updated profile');
        } catch (e: any) {
            console.error('Failed to sync subscription:', e);
            throw e;
        }
    };

    const requestSubscriptionCancellation = async () => {
        if (!token) return false;
        try {
            const res = await fetch(`${API_URL}/api/subscription/cancel`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                return true;
            }
        } catch (e) {
            console.error('Failed to cancel subscription:', e);
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            logout,
            refreshToken,
            refreshProfile,
            syncSubscription,
            requestSubscriptionCancellation
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
