import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';

export const NeuralAuthBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse Parallax Trackers
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // We will use standard state/refs for the animation loop
    const nodesRef = useRef<any[]>([]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX / window.innerWidth);
            mouseY.set(e.clientY / window.innerHeight);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initNodes();
        };

        const initNodes = () => {
            const count = Math.floor((canvas.width * canvas.height) / 15000); // Dynamic density
            nodesRef.current = Array.from({ length: count }).map(() => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 1.5 + 0.5,
                depth: Math.random() * 0.5 + 0.5 // For parallax multiplier
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const mx = (mouseX.get() - 0.5) * 50;
            const my = (mouseY.get() - 0.5) * 50;

            const nodes = nodesRef.current;

            // Advance positions
            for (let i = 0; i < nodes.length; i++) {
                let node = nodes[i];
                node.x += node.vx;
                node.y += node.vy;

                // Bounce off edges
                if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
                if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

                // Draw Node
                const px = node.x + mx * node.depth;
                const py = node.y + my * node.depth;

                ctx.beginPath();
                ctx.arc(px, py, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59, 130, 246, ${0.4 * node.depth})`;
                ctx.fill();
            }

            // Draw connections
            ctx.lineWidth = 0.5;
            for (let i = 0; i < nodes.length; i++) {
                const nodeA = nodes[i];
                const pxA = nodeA.x + mx * nodeA.depth;
                const pyA = nodeA.y + my * nodeA.depth;

                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeB = nodes[j];
                    const pxB = nodeB.x + mx * nodeB.depth;
                    const pyB = nodeB.y + my * nodeB.depth;

                    const dx = pxA - pxB;
                    const dy = pyA - pyB;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < 15000) {
                        const opacity = 1 - Math.sqrt(distSq) / Math.sqrt(15000);
                        ctx.beginPath();
                        ctx.moveTo(pxA, pyA);
                        ctx.lineTo(pxB, pyB);
                        ctx.strokeStyle = `rgba(6, 182, 212, ${opacity * 0.25})`;
                        ctx.stroke();
                    }
                }
            }

            // Render Waveform effect at bottom indicating processing
            const time = Date.now() * 0.001;
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x += 10) {
                const y = canvas.height - 50 + Math.sin(x * 0.01 + time) * 15 * Math.sin(time * 0.5);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            // Fade gradient for wave
            const grad = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
            grad.addColorStop(0, 'rgba(59, 130, 246, 0)');
            grad.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.fillStyle = grad;
            ctx.fill();

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [mouseX, mouseY]);

    return (
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none', background: 'var(--bg-main)' }}>
            {/* Base ambient gradient */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '60vw',
                height: '60vw',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                filter: 'blur(100px)',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '50vw',
                height: '50vw',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
                filter: 'blur(100px)',
            }} />
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
};
