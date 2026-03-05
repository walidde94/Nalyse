import React, { useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const MagneticTilt = ({ children, className = '', maxTilt = 10, scale = 1.02 }: { children: ReactNode, className?: string, maxTilt?: number, scale?: number }) => {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);

    // Smooth physics values
    const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const rotateX = useTransform(springY, [0, 1], [maxTilt, -maxTilt]);
    const rotateY = useTransform(springX, [0, 1], [-maxTilt, maxTilt]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();

        // Calculate relative position (0 to 1)
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;

        x.set(relX);
        y.set(relY);
    };

    const handleMouseLeave = () => {
        // Reset to center
        x.set(0.5);
        y.set(0.5);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                perspective: "1000px"
            }}
            whileHover={{ scale }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
