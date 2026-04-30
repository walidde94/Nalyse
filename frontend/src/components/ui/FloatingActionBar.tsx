import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, type LucideIcon } from 'lucide-react';

interface FloatingActionBarProps {
    count: number;
    label: string;
    onDelete: () => void;
    onClear: () => void;
    deleteLabel?: string;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({ 
    count, 
    label, 
    onDelete, 
    onClear,
    deleteLabel = "Delete"
}) => {
    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0, x: '-50%' }}
                    animate={{ y: 0, opacity: 1, x: '-50%' }}
                    exit={{ y: 100, opacity: 0, x: '-50%' }}
                    style={{
                        position: 'fixed',
                        bottom: '32px',
                        left: '50%',
                        zIndex: 2147483647,
                        background: 'rgba(10, 10, 20, 0.9)',
                        backdropFilter: 'blur(32px)',
                        border: '1px solid var(--primary)',
                        borderRadius: '24px',
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 20px -5px var(--primary-glow)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900 }}>
                            {count}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{label} Selected</span>
                    </div>
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onDelete} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Trash2 size={14} /> {deleteLabel}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClear} style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <X size={14} /> Clear
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
