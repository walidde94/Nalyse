import { useEffect, useRef, useCallback } from 'react';
import { useArchitect } from '../../contexts/ArchitectContext';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    alpha: number;
    pulsePhase: number;
    pulseSpeed: number;
}

interface Connection {
    from: number;
    to: number;
    alpha: number;
}

/**
 * NeuralCanvas — A GPU-accelerated animated particle network background
 * that creates a living, breathing neural-network effect behind the dashboard.
 */
export const NeuralCanvas = ({ intensity = 1 }: { intensity?: number }) => {
    const { isArchitectMode, activeNodeId } = useArchitect();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const targetRef = useRef<{ x: number, y: number } | null>(null);
    const timeRef = useRef(0);

    const COLORS = [
        'rgba(59, 130, 246, ',   // blue
        'rgba(139, 92, 246, ',   // violet
        'rgba(6, 182, 212, ',    // cyan
        'rgba(16, 185, 129, ',   // emerald
        'rgba(99, 102, 241, ',   // indigo
    ];

    const initParticles = useCallback((width: number, height: number) => {
        const baseCount = Math.min(Math.floor((width * height) / 18000) * intensity, 120);
        const count = isArchitectMode ? baseCount * 1.5 : baseCount;
        const particles: Particle[] = [];

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * (isArchitectMode ? 0.6 : 0.3),
                vy: (Math.random() - 0.5) * (isArchitectMode ? 0.6 : 0.3),
                radius: Math.random() * 2 + 0.5,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                alpha: Math.random() * 0.5 + 0.1,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.02 + 0.005,
            });
        }
        return particles;
    }, [intensity, isArchitectMode]);

    // Track active node position for magnetism
    useEffect(() => {
        if (!isArchitectMode || !activeNodeId) {
            targetRef.current = null;
            return;
        }

        const updateTarget = () => {
            const el = document.querySelector(`[data-node-id="${activeNodeId}"]`);
            if (el) {
                const rect = el.getBoundingClientRect();
                targetRef.current = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            }
        };

        updateTarget();
        const interval = setInterval(updateTarget, 100);
        return () => clearInterval(interval);
    }, [isArchitectMode, activeNodeId]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.scale(dpr, dpr);
            particlesRef.current = initParticles(canvas.offsetWidth, canvas.offsetHeight);
        };

        resize();
        window.addEventListener('resize', resize);

        const handleMouse = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };
        canvas.addEventListener('mousemove', handleMouse);

        const CONNECTION_DIST = isArchitectMode ? 200 : 150;
        const MOUSE_DIST = 200;
        const TARGET_DIST = 400;

        const animate = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            timeRef.current += 0.016;

            ctx.clearRect(0, 0, w, h);

            const particles = particlesRef.current;
            const connections: Connection[] = [];

            // Update particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.pulsePhase += p.pulseSpeed;

                // Boundary wrapping
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                if (p.y > h + 10) p.y = -10;

                // Mouse attraction
                const mdx = mouseRef.current.x - p.x;
                const mdy = mouseRef.current.y - p.y;
                const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                if (mdist < MOUSE_DIST) {
                    const force = (MOUSE_DIST - mdist) / MOUSE_DIST * (isArchitectMode ? 0.02 : 0.008);
                    p.vx += mdx * force;
                    p.vy += mdy * force;
                }

                // Target (Active Node) Magnetism
                if (targetRef.current) {
                    const tdx = targetRef.current.x - p.x;
                    const tdy = targetRef.current.y - p.y;
                    const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
                    if (tdist < TARGET_DIST) {
                        const tforce = (TARGET_DIST - tdist) / TARGET_DIST * 0.012;
                        p.vx += tdx * tforce;
                        p.vy += tdy * tforce;
                    }
                }

                // Damping
                p.vx *= isArchitectMode ? 0.99 : 0.998;
                p.vy *= isArchitectMode ? 0.99 : 0.998;

                // Find connections
                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j];
                    const dx = p.x - q.x;
                    const dy = p.y - q.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECTION_DIST) {
                        connections.push({
                            from: i,
                            to: j,
                            alpha: (1 - dist / CONNECTION_DIST) * (isArchitectMode ? 0.25 : 0.15),
                        });
                    }
                }
            }

            // Draw connections
            for (const conn of connections) {
                const p = particles[conn.from];
                const q = particles[conn.to];
                const gradient = ctx.createLinearGradient(p.x, p.y, q.x, q.y);
                gradient.addColorStop(0, `${p.color}${conn.alpha})`);
                gradient.addColorStop(1, `${q.color}${conn.alpha})`);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(q.x, q.y);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = isArchitectMode ? 0.8 : 0.5;
                ctx.stroke();
            }

            // Draw particles
            for (const p of particles) {
                const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7;
                const alpha = p.alpha * pulse;
                const radius = p.radius * (0.8 + pulse * 0.4);

                // Glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius * (isArchitectMode ? 6 : 4), 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${alpha * 0.1})`;
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${alpha})`;
                ctx.fill();
            }

            // Draw flowing data streams
            const streamCount = isArchitectMode ? 5 : 3;
            for (let s = 0; s < streamCount; s++) {
                const y = (h / (streamCount + 1)) * (s + 1);
                const phase = timeRef.current * (isArchitectMode ? 0.8 : 0.5) + s * 2;
                const waveY = y + Math.sin(phase) * 20;

                ctx.beginPath();
                ctx.moveTo(0, waveY);

                for (let x = 0; x <= w; x += 5) {
                    const localY = waveY + Math.sin(x * 0.01 + phase) * 8 + Math.sin(x * 0.005 + phase * 0.5) * 4;
                    ctx.lineTo(x, localY);
                }

                const streamGrad = ctx.createLinearGradient(0, waveY, w, waveY);
                streamGrad.addColorStop(0, 'rgba(59, 130, 246, 0)');
                if (isArchitectMode) {
                    streamGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
                } else {
                    streamGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
                }
                streamGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

                ctx.strokeStyle = streamGrad;
                ctx.lineWidth = isArchitectMode ? 2 : 1;
                ctx.stroke();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouse);
        };
    }, [initParticles, isArchitectMode]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: isArchitectMode ? 0.8 : 0.6,
                transition: 'opacity 1s ease',
            }}
        />
    );
};
