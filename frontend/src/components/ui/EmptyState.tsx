import React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
    illustration?: 'data' | 'files' | 'search' | 'analytics';
}

/**
 * Premium Empty State component with cinematic entrance and theme-aware design.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon: Icon,
    actionLabel,
    onAction,
    illustration = 'files'
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center p-12 bg-[var(--bg-surface-hover)] rounded-2xl border border-dashed border-[var(--border-subtle)]"
            style={{ minHeight: '400px' }}
        >
            <div className="relative mb-8">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center text-[var(--primary)] opacity-20 blur-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
                
                <div className="relative z-10 w-24 h-24 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl flex items-center justify-center">
                    {Icon ? (
                        <Icon size={40} className="text-[var(--primary)]" />
                    ) : (
                        <div className="text-4xl">📊</div>
                    )}
                </div>
            </div>

            <h2 className="text-h2 mb-3 text-[var(--text-primary)]">{title}</h2>
            <p className="text-secondary max-w-md mb-8 leading-relaxed">
                {description}
            </p>

            {onAction && actionLabel && (
                <button 
                    onClick={onAction}
                    className="btn btn-primary group flex items-center gap-2 px-6 py-3"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    {actionLabel}
                </button>
            )}

            <style>{`
                .btn-primary {
                    background: var(--primary);
                    color: white;
                    border-radius: 12px;
                    font-weight: 600;
                    box-shadow: 0 10px 20px -5px var(--primary-glow);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px -8px var(--primary-glow);
                    filter: brightness(1.1);
                }
            `}</style>
        </motion.div>
    );
};
