import React from 'react';
import { Plane } from 'lucide-react';
import type { Presence } from '../../contexts/PresenceContext';

interface PresenceIndicatorProps {
    status?: Presence['status'];
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ 
    status = 'offline', 
    size = 'md',
    className = ''
}) => {
    // Sizing
    const dimensions = {
        sm: { dot: '8px', icon: '6px', border: '1.5px' },
        md: { dot: '12px', icon: '8px', border: '2px' },
        lg: { dot: '16px', icon: '10px', border: '2.5px' }
    }[size];

    // Colors
    const getStatusStyle = () => {
        switch (status) {
            case 'available':
                return { bg: '#10b981', border: 'transparent' };
            case 'busy':
                return { bg: '#ef4444', border: 'transparent' };
            case 'away':
                return { bg: '#f59e0b', border: 'transparent' };
            case 'vacation':
                return { bg: '#8b5cf6', border: 'transparent' };
            case 'offline':
            default:
                return { bg: 'var(--bg-surface)', border: '#9ca3af' };
        }
    };

    const style = getStatusStyle();

    return (
        <div 
            className={`presence-indicator ${className}`}
            style={{
                width: dimensions.dot,
                height: dimensions.dot,
                borderRadius: '50%',
                backgroundColor: style.bg,
                border: status === 'offline' ? `${dimensions.border} solid ${style.border}` : 'none',
                boxShadow: `0 0 0 ${dimensions.border} var(--bg-surface)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                bottom: 0,
                right: 0,
                zIndex: 10
            }}
            title={status.charAt(0).toUpperCase() + status.slice(1)}
        >
            {status === 'vacation' && (
                <Plane size={dimensions.icon} color="#fff" strokeWidth={3} />
            )}
        </div>
    );
};
