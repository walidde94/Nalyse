import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export const MagneticHover = ({ children, intensity = 0.2, className = '' }: { children: React.ReactNode, intensity?: number, className?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        const boundingRect = ref.current?.getBoundingClientRect();
        if (boundingRect) {
            const { width, height, left, top } = boundingRect;
            const x = clientX - (left + width / 2);
            const y = clientY - (top + height / 2);
            setPosition({ x: x * intensity, y: y * intensity });
        }
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            style={{ position: 'relative', display: 'inline-block' }}
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
