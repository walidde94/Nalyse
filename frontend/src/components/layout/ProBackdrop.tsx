import React from 'react';
import { motion } from 'framer-motion';

export const ProBackdrop = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" style={{ background: 'var(--backdrop-base)' }}>
            {/* Aurora Borealis Gradients */}
            <motion.div
                animate={{
                    opacity: [0.15, 0.25, 0.15],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[120px]"
                style={{ background: 'radial-gradient(circle, var(--backdrop-aurora-1) 0%, transparent 70%)' }}
            />

            <motion.div
                animate={{
                    opacity: [0.1, 0.2, 0.1],
                    x: [0, 50, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px]"
                style={{ background: 'radial-gradient(circle, var(--backdrop-aurora-2) 0%, transparent 70%)' }}
            />

            {/* Subtle Grid Overlay */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'linear-gradient(var(--backdrop-grid) 1px, transparent 1px), linear-gradient(90deg, var(--backdrop-grid) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 bg-radial-gradient-vignette" />
        </div>
    );
};
