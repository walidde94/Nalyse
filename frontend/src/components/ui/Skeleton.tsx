import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    style?: React.CSSProperties;
    animate?: boolean;
}

/**
 * Premium Skeleton component for loading states.
 * Uses a subtle shimmer animation and high-contrast design tokens.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ 
    className = '', 
    width, 
    height, 
    borderRadius = '8px', 
    style = {},
    animate = true
}) => {
    return (
        <div 
            className={`skeleton-base ${animate ? 'skeleton-animate' : ''} ${className}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: borderRadius,
                background: 'var(--bg-surface-hover)',
                position: 'relative',
                overflow: 'hidden',
                ...style
            }}
        >
            {animate && (
                <div className="skeleton-shimmer" />
            )}
            
            <style>{`
                .skeleton-base {
                    display: inline-block;
                    border: 1px solid var(--border-subtle);
                }
                
                .skeleton-shimmer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(255, 255, 255, 0.03) 50%,
                        transparent 100%
                    );
                    animation: shimmer 1.8s infinite linear;
                }
                
                .skeleton-animate {
                    animation: breathe 3s infinite ease-in-out;
                }
                
                @keyframes shimmer {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                
                @keyframes breathe {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 0.9; }
                }
            `}</style>
        </div>
    );
};

export default Skeleton;
