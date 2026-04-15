import React from 'react';
import { motion } from 'framer-motion';

export const ProBackdrop = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
            {/* Vivid Void Luxe Aurora Orbs */}
            <motion.div
                animate={{
                    opacity: [0.4, 0.6, 0.4],
                    scale: [1, 1.15, 1],
                    x: [0, 80, 0],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[140px]"
                style={{ background: 'radial-gradient(circle, rgba(0, 212, 170, 0.3) 0%, transparent 60%)' }}
            />

            <motion.div
                animate={{
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, -80, 0],
                    y: [0, 40, 0]
                }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px]"
                style={{ background: 'radial-gradient(circle, rgba(255, 184, 0, 0.25) 0%, transparent 60%)' }}
            />
            
            <motion.div
                animate={{
                    opacity: [0.25, 0.4, 0.25],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 6 }}
                className="absolute top-[30%] right-[5%] w-[45vw] h-[45vw] rounded-full blur-[100px]"
                style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 60%)' }}
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
