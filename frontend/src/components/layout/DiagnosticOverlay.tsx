import React from 'react';
import { motion } from 'framer-motion';
import { useArchitect } from '../../contexts/ArchitectContext';

/**
 * DiagnosticOverlay — A subtle, clean overlay that provides 
 * spatial awareness during layout editing without visual clutter.
 */
export const DiagnosticOverlay: React.FC = () => {
    const { isArchitectMode } = useArchitect();

    if (!isArchitectMode) return null;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 9998,
            }}
        >
            {/* Subtle grid for spatial reference */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                    linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '48px 48px',
            }} />
            
            {/* Top edge glow */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: '2px',
                background: 'linear-gradient(90deg, transparent 10%, var(--primary) 50%, transparent 90%)',
                opacity: 0.4,
            }} />
        </motion.div>
    );
};
