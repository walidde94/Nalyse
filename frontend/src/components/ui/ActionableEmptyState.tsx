import React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon, Sparkles, ShieldAlert } from 'lucide-react';

interface ActionableEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const ActionableEmptyState: React.FC<ActionableEmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-16 text-center max-w-lg mx-auto relative overflow-hidden rounded-3xl bg-[var(--bg-card)]/30 border border-[var(--border-subtle)] border-dashed">
            {/* Ambient background glow */}
            <div 
                style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
                    opacity: 0.1,
                    filter: 'blur(60px)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} 
            />

            <div className="relative z-10">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    style={{ 
                        width: '96px', 
                        height: '96px', 
                        borderRadius: '24px', 
                        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-card) 100%)', 
                        border: '1px solid var(--border-subtle)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: 'var(--primary)',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.02)',
                        position: 'relative'
                    }}
                >
                    <Icon size={40} strokeWidth={1.5} />
                    <motion.div 
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8], x: [0, 10, 0], y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{ position: 'absolute', top: -10, right: -10, color: 'var(--warning)' }}
                    >
                        <Sparkles size={20} />
                    </motion.div>
                </motion.div>

                <h3 className="text-h2 mb-3 text-[var(--text-primary)]" style={{ letterSpacing: '-0.02em' }}>
                    {title}
                </h3>
                
                <p className="text-secondary text-sm leading-relaxed mb-10 max-w-xs mx-auto">
                    {description}
                </p>

                {actionLabel && onAction && (
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAction}
                        className="btn btn-primary"
                        style={{
                            padding: '12px 32px',
                            background: 'var(--primary)',
                            color: '#fff',
                            borderRadius: '14px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 12px 24px -8px var(--primary-glow)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {actionLabel}
                    </motion.button>
                )}
            </div>
        </div>
    );
};
