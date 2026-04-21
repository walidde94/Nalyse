import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: number;
    createdAt: number;
}

const ToastContext = createContext<{ addToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void } | null>(null);

const TOAST_CONFIG = {
    success: { icon: CheckCircle, gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16, 185, 129, 0.4)', accent: '#10b981', label: 'Success' },
    error: { icon: XCircle, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239, 68, 68, 0.4)', accent: '#ef4444', label: 'Error' },
    warning: { icon: AlertTriangle, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245, 158, 11, 0.4)', accent: '#f59e0b', label: 'Warning' },
    info: { icon: Info, gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', glow: 'rgba(99, 102, 241, 0.4)', accent: '#6366f1', label: 'Info' },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [progress, setProgress] = useState(100);
    const [isExiting, setIsExiting] = useState(false);
    const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
    const Icon = config.icon;
    const intervalRef = useRef<number>(0);

    useEffect(() => {
        const startTime = Date.now();
        intervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(intervalRef.current);
                handleDismiss();
            }
        }, 30);
        return () => clearInterval(intervalRef.current);
    }, [toast.duration]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
    };

    return (
        <div
            className={`nalyse-toast ${isExiting ? 'toast-exit' : 'toast-enter'}`}
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '16px',
                padding: '0',
                minWidth: '360px',
                maxWidth: '460px',
                overflow: 'hidden',
                boxShadow: `0 20px 60px -15px rgba(0,0,0,0.5), 0 0 20px ${config.glow}`,
                backdropFilter: 'blur(20px)',
                position: 'relative',
            }}
        >
            {/* Accent line top */}
            <div style={{
                height: '3px',
                background: config.gradient,
                borderRadius: '16px 16px 0 0',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 16px 14px' }}>
                {/* Icon */}
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: config.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${config.glow}`,
                }}>
                    <Icon size={18} color="#fff" />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: config.accent,
                        marginBottom: '4px',
                    }}>
                        {config.label}
                    </div>
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        lineHeight: 1.5,
                    }}>
                        {toast.message}
                    </div>
                </div>

                {/* Dismiss */}
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-surface-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div style={{
                height: '2px',
                background: 'var(--bg-surface)',
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: config.gradient,
                    transition: 'width 0.03s linear',
                    borderRadius: '0 2px 2px 0',
                }} />
            </div>

            <style>{`
                .nalyse-toast.toast-enter {
                    animation: toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .nalyse-toast.toast-exit {
                    animation: toast-slide-out 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
                }
                @keyframes toast-slide-in {
                    from { opacity: 0; transform: translateX(100px) scale(0.8); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes toast-slide-out {
                    from { opacity: 1; transform: translateX(0) scale(1); }
                    to { opacity: 0; transform: translateX(100px) scale(0.8); }
                }
            `}</style>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 4000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration, createdAt: Date.now() }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '10px',
                zIndex: 99999,
                pointerEvents: 'none',
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                        <ToastItem toast={toast} onDismiss={dismissToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
