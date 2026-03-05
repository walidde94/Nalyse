import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, FileSpreadsheet, FileText, Sparkles, Zap, Database, Shield } from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   NEURAL DROP ZONE — Cinematic Full-Screen Drag & Drop
   A premium portal overlay that appears when files are
   dragged over the dashboard, with particle effects,
   animated borders, and file type detection.
   ══════════════════════════════════════════════════════════ */

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
    life: number;
}

const PARTICLE_COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#a855f7', '#ec4899'];

export const NeuralDropZone = ({
    dragActive,
    handleDrag,
    handleDrop,
    isOverLimit = false,
}: {
    dragActive: boolean;
    handleDrag: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    isOverLimit?: boolean;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number>(0);
    const [filePreview, setFilePreview] = useState<{ name: string; type: string }[]>([]);
    const [glowAngle, setGlowAngle] = useState(0);

    // Animated border glow
    useEffect(() => {
        if (!dragActive) return;
        const interval = setInterval(() => setGlowAngle(a => (a + 2) % 360), 20);
        return () => clearInterval(interval);
    }, [dragActive]);

    // Spawn particles on canvas
    const spawnParticles = useCallback((mouseX: number, mouseY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        for (let i = 0; i < 3; i++) {
            particlesRef.current.push({
                id: Date.now() + Math.random(),
                x: mouseX + (Math.random() - 0.5) * 100,
                y: mouseY + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 0.5,
                size: Math.random() * 4 + 2,
                opacity: Math.random() * 0.6 + 0.4,
                color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
                life: 1,
            });
        }
    }, []);

    // Animate particles
    useEffect(() => {
        if (!dragActive) {
            particlesRef.current = [];
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Size canvas to window
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Spawn ambient particles from edges
        const ambientInterval = setInterval(() => {
            for (let i = 0; i < 2; i++) {
                const edge = Math.floor(Math.random() * 4);
                let x = 0, y = 0;
                if (edge === 0) { x = Math.random() * canvas.width; y = 0; }
                else if (edge === 1) { x = canvas.width; y = Math.random() * canvas.height; }
                else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height; }
                else { x = 0; y = Math.random() * canvas.height; }

                particlesRef.current.push({
                    id: Date.now() + Math.random(),
                    x, y,
                    vx: (canvas.width / 2 - x) * 0.002 + (Math.random() - 0.5) * 0.5,
                    vy: (canvas.height / 2 - y) * 0.002 + (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 3 + 1,
                    opacity: Math.random() * 0.4 + 0.1,
                    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
                    life: 1,
                });
            }
        }, 100);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current = particlesRef.current.filter(p => p.life > 0);

            for (const p of particlesRef.current) {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.005;
                p.opacity = p.life * 0.6;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.fill();

                // Glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.globalAlpha = p.opacity * 0.3;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            clearInterval(ambientInterval);
            window.removeEventListener('resize', resize);
        };
    }, [dragActive]);

    // Track dragged file types
    const onDragOverInner = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleDrag(e);
        spawnParticles(e.clientX, e.clientY);

        // Try to get file info from dataTransfer
        if (e.dataTransfer.items && filePreview.length === 0) {
            const items: { name: string; type: string }[] = [];
            for (let i = 0; i < Math.min(e.dataTransfer.items.length, 5); i++) {
                const item = e.dataTransfer.items[i];
                if (item.kind === 'file') {
                    items.push({
                        name: `File ${i + 1}`,
                        type: item.type || 'unknown',
                    });
                }
            }
            if (items.length > 0) setFilePreview(items);
        }
    }, [handleDrag, spawnParticles, filePreview.length]);

    const onDropInner = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Extract real file names for the brief animation
        if (e.dataTransfer.files.length > 0) {
            const names: { name: string; type: string }[] = [];
            for (let i = 0; i < Math.min(e.dataTransfer.files.length, 5); i++) {
                names.push({
                    name: e.dataTransfer.files[i].name,
                    type: e.dataTransfer.files[i].type,
                });
            }
            setFilePreview(names);
        }

        handleDrop(e);
        setFilePreview([]);
    }, [handleDrop]);

    const onDragLeaveInner = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only close if we're leaving the overlay itself (not a child)
        if (e.currentTarget === e.target) {
            handleDrag(e);
            setFilePreview([]);
        }
    }, [handleDrag]);

    const getFileIcon = (type: string) => {
        if (type.includes('csv') || type.includes('spreadsheet') || type.includes('excel')) {
            return <FileSpreadsheet size={20} />;
        }
        if (type.includes('json') || type.includes('text')) {
            return <FileText size={20} />;
        }
        return <Database size={20} />;
    };

    return createPortal(
        <AnimatePresence>
            {dragActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="neural-drop-overlay"
                    onDragOver={onDragOverInner}
                    onDrop={onDropInner}
                    onDragLeave={onDragLeaveInner}
                >
                    {/* Particle Canvas */}
                    <canvas ref={canvasRef} className="neural-drop-canvas" />

                    {/* Animated border */}
                    <div className="neural-drop-border" style={{
                        background: isOverLimit
                            ? 'conic-gradient(from ' + glowAngle + 'deg, #ef4444, #f59e0b, #ef4444, #f59e0b, #ef4444)'
                            : 'conic-gradient(from ' + glowAngle + 'deg, #8b5cf6, #3b82f6, #06b6d4, #10b981, #a855f7, #ec4899, #8b5cf6)'
                    }} />

                    {/* Content Zone */}
                    <div className="neural-drop-inner">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="neural-drop-content"
                        >
                            {/* Rotating ring */}
                            <div className="neural-drop-ring">
                                <svg viewBox="0 0 200 200" className="neural-drop-ring-svg">
                                    <defs>
                                        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="50%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                    <circle
                                        cx="100" cy="100" r="90"
                                        fill="none" stroke="url(#ring-grad)"
                                        strokeWidth="2" strokeDasharray="8 12"
                                        opacity="0.4"
                                    />
                                    <circle
                                        cx="100" cy="100" r="75"
                                        fill="none" stroke="url(#ring-grad)"
                                        strokeWidth="1.5" strokeDasharray="4 8"
                                        opacity="0.3"
                                    />
                                </svg>
                            </div>

                            {/* Central icon */}
                            <motion.div
                                animate={{
                                    y: [-8, 8, -8],
                                    rotate: [0, -3, 3, 0],
                                }}
                                transition={{
                                    y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                                    rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                                }}
                                className="neural-drop-icon"
                            >
                                {isOverLimit ? (
                                    <Shield size={48} className="text-red-400" />
                                ) : (
                                    <CloudUpload size={48} />
                                )}
                            </motion.div>

                            {/* Text */}
                            <div className="neural-drop-text">
                                <motion.h2
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="neural-drop-title"
                                >
                                    {isOverLimit ? 'Storage Limit Reached' : 'Release to Upload'}
                                </motion.h2>
                                <motion.p
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="neural-drop-subtitle"
                                >
                                    {isOverLimit
                                        ? 'Upgrade your plan to upload more datasets'
                                        : 'Drop your files to begin neural processing'}
                                </motion.p>
                            </div>

                            {/* File type badges */}
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="neural-drop-formats"
                            >
                                <span className="neural-drop-format">.CSV</span>
                                <span className="neural-drop-format">.JSON</span>
                                <span className="neural-drop-format">.XLSX</span>
                                <span className="neural-drop-format">.TSV</span>
                            </motion.div>

                            {/* Dragged file preview pills */}
                            <AnimatePresence>
                                {filePreview.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="neural-drop-previews"
                                    >
                                        {filePreview.map((f, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="neural-drop-file-pill"
                                            >
                                                <div className="ndp-icon">{getFileIcon(f.type)}</div>
                                                <span className="ndp-name">{f.name}</span>
                                                <Zap size={12} className="ndp-zap" />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Bottom hint */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="neural-drop-hint"
                            >
                                <Sparkles size={12} />
                                <span>Intelligent schema detection • Auto-analysis on upload</span>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
