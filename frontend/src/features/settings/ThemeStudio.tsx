import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   THEME STUDIO — An immersive, charming custom theme editor
   ═══════════════════════════════════════════════════════════ */

// ── Utility Helpers ──

const hexToHSL = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

const getComplementary = (hex: string): string => {
    const [h, s, l] = hexToHSL(hex);
    return hslToHex((h + 180) % 360, s, l);
};

const getAnalogous = (hex: string): [string, string] => {
    const [h, s, l] = hexToHSL(hex);
    return [hslToHex((h + 30) % 360, s, l), hslToHex((h + 330) % 360, s, l)];
};

const getTriadic = (hex: string): [string, string] => {
    const [h, s, l] = hexToHSL(hex);
    return [hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
};

const getSplitComplementary = (hex: string): [string, string] => {
    const [h, s, l] = hexToHSL(hex);
    return [hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
};

// ── Mood Palette Collections ──

interface MoodPalette {
    name: string;
    emoji: string;
    description: string;
    primary: string;
    accent: string;
    bgMain: string;
    textPrimary: string;
    glowIntensity: number;
    blurAmount: number;
}

const MOOD_COLLECTIONS: { category: string; icon: string; palettes: MoodPalette[] }[] = [
    {
        category: 'Time of Day',
        icon: '🌅',
        palettes: [
            { name: 'Golden Dawn', emoji: '🌅', description: 'Warm morning light', primary: '#f59e0b', accent: '#f97316', bgMain: '#0f0904', textPrimary: '#fef3c7', glowIntensity: 45, blurAmount: 24 },
            { name: 'Noon Sky', emoji: '☀️', description: 'Clear daylight energy', primary: '#0ea5e9', accent: '#38bdf8', bgMain: '#020d18', textPrimary: '#e0f2fe', glowIntensity: 35, blurAmount: 20 },
            { name: 'Twilight', emoji: '🌆', description: 'Peaceful dusk glow', primary: '#c084fc', accent: '#f472b6', bgMain: '#0c0618', textPrimary: '#f3e8ff', glowIntensity: 55, blurAmount: 32 },
            { name: 'Midnight Blue', emoji: '🌙', description: 'Deep night focus', primary: '#6366f1', accent: '#818cf8', bgMain: '#020317', textPrimary: '#e0e7ff', glowIntensity: 40, blurAmount: 28 },
        ]
    },
    {
        category: 'Music Vibes',
        icon: '🎵',
        palettes: [
            { name: 'Synthwave', emoji: '🎹', description: 'Retro neon pulse', primary: '#f43f5e', accent: '#a855f7', bgMain: '#0a0115', textPrimary: '#fce7f3', glowIntensity: 70, blurAmount: 36 },
            { name: 'Lo-Fi', emoji: '🎧', description: 'Mellow & cozy', primary: '#a78bfa', accent: '#c4b5fd', bgMain: '#0e0b18', textPrimary: '#ede9fe', glowIntensity: 30, blurAmount: 42 },
            { name: 'Jazz Club', emoji: '🎷', description: 'Smoky amber warmth', primary: '#d97706', accent: '#b45309', bgMain: '#0c0804', textPrimary: '#fef3c7', glowIntensity: 35, blurAmount: 30 },
            { name: 'Electronica', emoji: '🎛️', description: 'Electric & vivid', primary: '#06b6d4', accent: '#22d3ee', bgMain: '#020e12', textPrimary: '#cffafe', glowIntensity: 65, blurAmount: 22 },
        ]
    },
    {
        category: 'Nature',
        icon: '🌿',
        palettes: [
            { name: 'Northern Lights', emoji: '🌌', description: 'Aurora borealis', primary: '#34d399', accent: '#a78bfa', bgMain: '#020c08', textPrimary: '#d1fae5', glowIntensity: 60, blurAmount: 38 },
            { name: 'Deep Ocean', emoji: '🌊', description: 'Abyssal depths', primary: '#0891b2', accent: '#06b6d4', bgMain: '#020911', textPrimary: '#cffafe', glowIntensity: 40, blurAmount: 34 },
            { name: 'Cherry Blossom', emoji: '🌸', description: 'Sakura spring', primary: '#ec4899', accent: '#f9a8d4', bgMain: '#120408', textPrimary: '#fce7f3', glowIntensity: 45, blurAmount: 30 },
            { name: 'Volcanic', emoji: '🌋', description: 'Molten ember glow', primary: '#ef4444', accent: '#f97316', bgMain: '#0d0202', textPrimary: '#fef2f2', glowIntensity: 55, blurAmount: 26 },
        ]
    },
    {
        category: 'Luxe',
        icon: '💎',
        palettes: [
            { name: 'Black Gold', emoji: '✨', description: 'Elite dark opulence', primary: '#eab308', accent: '#ca8a04', bgMain: '#080604', textPrimary: '#fef9c3', glowIntensity: 50, blurAmount: 28 },
            { name: 'Diamond', emoji: '💎', description: 'Crystal clarity', primary: '#94a3b8', accent: '#cbd5e1', bgMain: '#0a0c10', textPrimary: '#f1f5f9', glowIntensity: 30, blurAmount: 40 },
            { name: 'Royal Purple', emoji: '👑', description: 'Regal majesty', primary: '#7c3aed', accent: '#a78bfa', bgMain: '#08031a', textPrimary: '#ede9fe', glowIntensity: 55, blurAmount: 32 },
            { name: 'Rose Gold', emoji: '🌹', description: 'Elegant blush', primary: '#e11d48', accent: '#f472b6', bgMain: '#10030a', textPrimary: '#ffe4e6', glowIntensity: 40, blurAmount: 30 },
        ]
    },
];

// ── Interactive Color Wheel ──

const ColorWheel = ({ value, onChange, size = 200 }: { value: string; onChange: (hex: string) => void; size?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHSL(value));

    useEffect(() => {
        setHsl(hexToHSL(value));
    }, [value]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cx = size / 2, cy = size / 2, radius = size / 2 - 8;

        ctx.clearRect(0, 0, size, size);

        // Draw hue ring
        for (let angle = 0; angle < 360; angle += 0.5) {
            const startAngle = (angle - 1) * Math.PI / 180;
            const endAngle = (angle + 1) * Math.PI / 180;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.arc(cx, cy, radius - 24, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = `hsl(${angle}, 90%, 55%)`;
            ctx.fill();
        }

        // Draw inner saturation/lightness area
        const innerRadius = radius - 32;
        const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius);
        innerGrad.addColorStop(0, `hsla(${hsl[0]}, 0%, 100%, 1)`);
        innerGrad.addColorStop(0.5, `hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, 1)`);
        innerGrad.addColorStop(1, `hsla(${hsl[0]}, 100%, 10%, 1)`);

        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();

        // Draw hue indicator on the ring
        const hueAngle = (hsl[0] - 90) * Math.PI / 180;
        const ringMidRadius = radius - 12;
        const hueX = cx + Math.cos(hueAngle) * ringMidRadius;
        const hueY = cy + Math.sin(hueAngle) * ringMidRadius;

        ctx.beginPath();
        ctx.arc(hueX, hueY, 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hueX, hueY, 5, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hsl[0]}, 90%, 55%)`;
        ctx.fill();

        // Draw center selected color preview
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fillStyle = value;
        ctx.fill();
        ctx.strokeStyle = 'var(--text-muted)';
        ctx.lineWidth = 2;
        ctx.stroke();

    }, [size, hsl, value]);

    const handleInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = size / 2, cy = size / 2;
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = size / 2 - 8;

        if (dist >= radius - 28 && dist <= radius) {
            // On the hue ring
            let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
            if (angle < 0) angle += 360;
            const newHex = hslToHex(Math.round(angle), hsl[1] || 80, hsl[2] || 55);
            setHsl([Math.round(angle), hsl[1] || 80, hsl[2] || 55]);
            onChange(newHex);
        } else if (dist < radius - 32) {
            // In the center area - adjust saturation/lightness
            const innerRadius = radius - 32;
            const normDist = dist / innerRadius;
            const newS = Math.round(Math.min(100, normDist * 100));
            const angle = Math.atan2(dy, dx);
            const newL = Math.round(50 + (Math.cos(angle) * 30));
            const newHex = hslToHex(hsl[0], newS, newL);
            setHsl([hsl[0], newS, newL]);
            onChange(newHex);
        }
    }, [size, hsl, onChange]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ cursor: 'crosshair', borderRadius: '50%', filter: `drop-shadow(0 0 20px ${value}40)` }}
            onMouseDown={(e) => { setIsDragging(true); handleInteraction(e); }}
            onMouseMove={(e) => isDragging && handleInteraction(e)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
        />
    );
};

// ── Floating Particles Background ──

const ParticleField = ({ primary, accent, intensity }: { primary: string; accent: string; intensity: number }) => {
    const particles = useMemo(() => {
        const count = Math.floor(intensity / 5) + 6;
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 2 + Math.random() * 4,
            duration: 10 + Math.random() * 20,
            delay: Math.random() * 5,
            color: Math.random() > 0.5 ? primary : accent,
            opacity: 0.1 + (intensity / 100) * 0.4,
        }));
    }, [primary, accent, intensity]);

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    animate={{
                        x: [0, (Math.random() - 0.5) * 80, 0],
                        y: [0, (Math.random() - 0.5) * 60, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        borderRadius: '50%',
                        background: p.color,
                        opacity: p.opacity,
                        filter: `blur(${p.size > 4 ? 2 : 0}px)`,
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}60`,
                    }}
                />
            ))}
        </div>
    );
};

// ── Harmony Suggestions ──

const HarmonySuggestions = ({ primary, onSelect }: { primary: string; onSelect: (p: string, a: string) => void }) => {
    const complementary = getComplementary(primary);
    const analogous = getAnalogous(primary);
    const triadic = getTriadic(primary);
    const splitComp = getSplitComplementary(primary);

    const harmonies = [
        { name: 'Complementary', colors: [primary, complementary], accent: complementary },
        { name: 'Analogous', colors: [analogous[1], primary, analogous[0]], accent: analogous[0] },
        { name: 'Triadic', colors: [primary, triadic[0], triadic[1]], accent: triadic[0] },
        { name: 'Split', colors: [primary, splitComp[0], splitComp[1]], accent: splitComp[0] },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '2px' }}>
                🎨 Color Harmonies
            </div>
            {harmonies.map(h => (
                <motion.button
                    key={h.name}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(primary, h.accent)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', borderRadius: '10px',
                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}
                >
                    <div style={{ display: 'flex', gap: '3px' }}>
                        {h.colors.map((c, i) => (
                            <div key={i} style={{
                                width: '16px', height: '16px', borderRadius: '4px',
                                background: c, border: '1px solid var(--border-default)',
                                boxShadow: `0 0 6px ${c}40`,
                            }} />
                        ))}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{h.name}</span>
                </motion.button>
            ))}
        </div>
    );
};

// ── Live Preview Component ──

const LivePreviewPanel = ({ colors }: { colors: any }) => {
    const { primary, accent, bgMain, textPrimary, glowIntensity } = colors;
    const glowFactor = (glowIntensity ?? 50) / 100;

    return (
        <div style={{
            borderRadius: '16px', overflow: 'hidden',
            border: `1px solid ${primary}25`,
            background: bgMain,
            position: 'relative',
            height: '220px',
            boxShadow: `0 20px 60px -20px ${primary}25`,
        }}>
            {/* Aurora bg */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `
                    radial-gradient(ellipse 60% 50% at 20% 30%, ${primary}${Math.round(18 * glowFactor).toString(16).padStart(2, '0')} 0%, transparent 60%),
                    radial-gradient(ellipse 50% 40% at 80% 70%, ${accent}${Math.round(12 * glowFactor).toString(16).padStart(2, '0')} 0%, transparent 50%)
                `,
            }} />

            {/* Header */}
            <div style={{
                padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px',
                borderBottom: `1px solid ${primary}12`,
                background: `${bgMain}ee`,
                position: 'relative',
            }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#eab308' }} />
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '100px', height: '5px', borderRadius: '3px', background: `${textPrimary}15` }} />
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: `linear-gradient(135deg, ${primary}, ${accent})` }} />
            </div>

            {/* Body */}
            <div style={{ display: 'flex', height: 'calc(100% - 33px)' }}>
                {/* Sidebar */}
                <div style={{
                    width: '44px', padding: '10px 6px',
                    display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center',
                    borderRight: `1px solid ${primary}10`,
                    background: `${bgMain}f8`,
                }}>
                    {[primary, `${textPrimary}30`, `${textPrimary}20`, `${textPrimary}20`, `${textPrimary}15`].map((c, i) => (
                        <div key={i} style={{
                            width: i === 0 ? '20px' : '16px', height: i === 0 ? '20px' : '4px',
                            borderRadius: i === 0 ? '5px' : '2px',
                            background: i === 0 ? `linear-gradient(135deg, ${primary}, ${accent})` : c,
                        }} />
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Stats Row */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[primary, accent, `${primary}cc`].map((c, i) => (
                            <div key={i} style={{
                                flex: 1, padding: '8px', borderRadius: '8px',
                                border: `1px solid ${primary}15`, background: `${bgMain}88`,
                            }}>
                                <div style={{ width: '20px', height: '3px', borderRadius: '2px', background: c, marginBottom: '4px', opacity: 0.8 }} />
                                <div style={{ width: '28px', height: '6px', borderRadius: '3px', background: textPrimary, opacity: 0.7, marginBottom: '3px' }} />
                                <div style={{ width: '100%', height: '2px', borderRadius: '1px', background: `${textPrimary}12` }} />
                            </div>
                        ))}
                    </div>

                    {/* Cards */}
                    <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                        <div style={{
                            flex: 2, padding: '8px', borderRadius: '8px',
                            border: `1px solid ${primary}12`, background: `${bgMain}66`,
                        }}>
                            <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: textPrimary, opacity: 0.5, marginBottom: '5px' }} />
                            <div style={{ width: '100%', height: '2px', borderRadius: '1px', background: `${textPrimary}12`, marginBottom: '3px' }} />
                            <div style={{ width: '80%', height: '2px', borderRadius: '1px', background: `${textPrimary}10`, marginBottom: '3px' }} />
                            <div style={{ width: '60%', height: '2px', borderRadius: '1px', background: `${textPrimary}08` }} />
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                <div style={{ padding: '3px 10px', borderRadius: '4px', background: `linear-gradient(135deg, ${primary}, ${accent})`, height: '6px' }} />
                                <div style={{ padding: '3px 8px', borderRadius: '4px', border: `1px solid ${primary}25`, height: '6px' }} />
                            </div>
                        </div>
                        <div style={{
                            flex: 1, padding: '8px', borderRadius: '8px',
                            border: `1px solid ${primary}12`, background: `${bgMain}66`,
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        }}>
                            <div>
                                <div style={{ width: '24px', height: '3px', borderRadius: '2px', background: accent, opacity: 0.7, marginBottom: '4px' }} />
                                <div style={{ width: '100%', height: '2px', borderRadius: '1px', background: `${textPrimary}12`, marginBottom: '2px' }} />
                                <div style={{ width: '70%', height: '2px', borderRadius: '1px', background: `${textPrimary}08` }} />
                            </div>
                            <div style={{ height: '14px', borderRadius: '3px', background: `linear-gradient(90deg, ${primary}25, ${accent}15)` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Atmosphere Slider ──

const AtmosphereSlider = ({ label, icon, value, min, max, unit, color, accentColor, onChange }: {
    label: string; icon: string; value: number; min: number; max: number; unit: string; color: string; accentColor: string; onChange: (v: number) => void;
}) => {
    const percent = ((value - min) / (max - min)) * 100;

    return (
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
                </div>
                <span style={{
                    fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800,
                    color, padding: '2px 8px', borderRadius: '6px',
                    background: `${color}15`, border: `1px solid ${color}20`,
                }}>{value}{unit}</span>
            </div>
            <div style={{ position: 'relative', height: '8px', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)' }}>
                <motion.div
                    animate={{ width: `${percent}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        borderRadius: '4px',
                        background: `linear-gradient(90deg, ${color}, ${accentColor})`,
                        boxShadow: `0 0 12px ${color}50`,
                    }}
                />
                <input
                    type="range" min={min} max={max} value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    style={{
                        position: 'absolute', inset: '-6px 0', width: '100%', height: '20px',
                        opacity: 0, cursor: 'pointer', margin: 0,
                    }}
                />
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT: ThemeStudio
// ═══════════════════════════════════════════════════════════

export const ThemeStudio = ({ addToast }: { addToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) => {
    const saved = JSON.parse(localStorage.getItem('custom-theme-colors') || '{}');

    const [primary, setPrimary] = useState(saved.primary || '#f59e0b');
    const [accent, setAccent] = useState(saved.accent || '#ea580c');
    const [bgMain, setBgMain] = useState(saved.bgMain || '#0d0a04');
    const [textPrimary, setTextPrimary] = useState(saved.textPrimary || '#fef3c7');
    const [glowIntensity, setGlowIntensity] = useState(saved.glowIntensity ?? 50);
    const [blurAmount, setBlurAmount] = useState(saved.blurAmount ?? 28);
    const [activeMoodCategory, setActiveMoodCategory] = useState(0);
    const [showWheel, setShowWheel] = useState(false);
    const [wheelTarget, setWheelTarget] = useState<'primary' | 'accent'>('primary');

    const applyColors = useCallback((colors: Partial<{
        primary: string; accent: string; bgMain: string; textPrimary: string; glowIntensity: number; blurAmount: number;
    }>) => {
        const current = { primary, accent, bgMain, textPrimary, glowIntensity, blurAmount };
        const merged = { ...current, ...colors };

        if (colors.primary !== undefined) setPrimary(colors.primary);
        if (colors.accent !== undefined) setAccent(colors.accent);
        if (colors.bgMain !== undefined) setBgMain(colors.bgMain);
        if (colors.textPrimary !== undefined) setTextPrimary(colors.textPrimary);
        if (colors.glowIntensity !== undefined) setGlowIntensity(colors.glowIntensity);
        if (colors.blurAmount !== undefined) setBlurAmount(colors.blurAmount);

        localStorage.setItem('custom-theme-colors', JSON.stringify(merged));
        window.dispatchEvent(new Event('theme-change'));
        window.dispatchEvent(new CustomEvent('force-theme-reapply'));
    }, [primary, accent, bgMain, textPrimary, glowIntensity, blurAmount]);

    const applyMoodPalette = (palette: MoodPalette) => {
        applyColors({
            primary: palette.primary, accent: palette.accent,
            bgMain: palette.bgMain, textPrimary: palette.textPrimary,
            glowIntensity: palette.glowIntensity, blurAmount: palette.blurAmount,
        });
    };

    const handleExport = () => {
        const data = btoa(JSON.stringify({ primary, accent, bgMain, textPrimary, glowIntensity, blurAmount }));
        navigator.clipboard.writeText(data);
        addToast('Theme code copied to clipboard!', 'success');
    };

    const handleImport = () => {
        const code = prompt('Paste your theme code:');
        if (code) {
            try {
                const data = JSON.parse(atob(code));
                applyColors(data);
                addToast('Theme imported successfully!', 'success');
            } catch { addToast('Invalid theme code', 'error'); }
        }
    };

    const currentColors = { primary, accent, bgMain, textPrimary, glowIntensity };

    return (
        <div style={{
            marginTop: '20px',
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
        }}>
            {/* Background particles */}
            <ParticleField primary={primary} accent={accent} intensity={glowIntensity} />

            {/* Header */}
            <div style={{
                padding: '20px 24px 16px',
                position: 'relative', zIndex: 1,
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(0,0,0,0.2)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: `linear-gradient(135deg, ${primary}, ${accent})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 20px ${primary}40`,
                            fontSize: '16px',
                        }}>🎨</div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Theme Studio</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Craft your perfect atmosphere</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleImport}
                            style={{
                                padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                        >📥 Import</motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleExport}
                            style={{
                                padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                background: `linear-gradient(135deg, ${primary}20, ${accent}15)`, border: `1px solid ${primary}30`,
                                color: primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                        >📤 Export</motion.button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>

                {/* ── MOOD PALETTES ── */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✦ Mood Palettes
                    </div>

                    {/* Category Tabs */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        {MOOD_COLLECTIONS.map((col, i) => (
                            <motion.button
                                key={col.category}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveMoodCategory(i)}
                                style={{
                                    padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                    background: activeMoodCategory === i ? `${primary}15` : 'var(--bg-surface)',
                                    border: `1px solid ${activeMoodCategory === i ? primary + '40' : 'var(--border-subtle)'}`,
                                    color: activeMoodCategory === i ? primary : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                }}
                            >
                                <span>{col.icon}</span> {col.category}
                            </motion.button>
                        ))}
                    </div>

                    {/* Palette Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <AnimatePresence mode="wait">
                            {MOOD_COLLECTIONS[activeMoodCategory].palettes.map((palette) => {
                                const isActive = primary === palette.primary && bgMain === palette.bgMain;
                                return (
                                    <motion.button
                                        key={palette.name}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => applyMoodPalette(palette)}
                                        style={{
                                            padding: 0, borderRadius: '12px',
                                            border: `1.5px solid ${isActive ? palette.primary : 'var(--border-subtle)'}`,
                                            background: 'transparent', overflow: 'hidden', cursor: 'pointer',
                                            boxShadow: isActive ? `0 0 20px ${palette.primary}30` : 'none',
                                            position: 'relative',
                                            textAlign: 'left',
                                        }}
                                    >
                                        {/* Mini gradient preview */}
                                        <div style={{
                                            height: '36px', position: 'relative', overflow: 'hidden',
                                            background: `linear-gradient(135deg, ${palette.bgMain} 0%, ${palette.bgMain} 25%, ${palette.primary}30 65%, ${palette.accent}20 100%)`,
                                        }}>
                                            {/* Mini aurora */}
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: `radial-gradient(circle at 70% 50%, ${palette.primary}25$, transparent 60%), radial-gradient(circle at 30% 80%, ${palette.accent}15, transparent 50%)`,
                                            }} />
                                            {/* Mini dots */}
                                            <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: palette.primary, boxShadow: `0 0 6px ${palette.primary}60` }} />
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: palette.accent, opacity: 0.6 }} />
                                            </div>
                                            {/* Active indicator */}
                                            {isActive && (
                                                <motion.div
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    style={{
                                                        position: 'absolute', top: '6px', right: '6px',
                                                        width: '8px', height: '8px', borderRadius: '50%',
                                                        background: palette.primary, boxShadow: `0 0 8px ${palette.primary}`,
                                                    }}
                                                />
                                            )}
                                            {/* Bottom shimmer */}
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
                                                background: `linear-gradient(90deg, transparent, ${palette.primary}50, ${palette.accent}30, transparent)`,
                                            }} />
                                        </div>
                                        {/* Label */}
                                        <div style={{
                                            padding: '8px 10px',
                                            background: isActive ? `${palette.primary}08` : 'var(--bg-surface)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                <span style={{ fontSize: '12px' }}>{palette.emoji}</span>
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: isActive ? palette.primary : 'var(--text-primary)' }}>
                                                    {palette.name}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{palette.description}</span>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── COLOR FINE TUNING ── */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🔧 Fine Tune Colors
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                            { key: 'primary', label: 'Primary', value: primary, set: (v: string) => { setPrimary(v); applyColors({ primary: v }); }, wheelable: true },
                            { key: 'accent', label: 'Accent', value: accent, set: (v: string) => { setAccent(v); applyColors({ accent: v }); }, wheelable: true },
                            { key: 'bgMain', label: 'Background', value: bgMain, set: (v: string) => { setBgMain(v); applyColors({ bgMain: v }); } },
                            { key: 'textPrimary', label: 'Text Color', value: textPrimary, set: (v: string) => { setTextPrimary(v); applyColors({ textPrimary: v }); } },
                        ].map(item => (
                            <label key={item.key} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 10px', borderRadius: '10px',
                                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                cursor: 'pointer', transition: 'border-color 0.2s',
                            }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <motion.div
                                        whileHover={{ scale: 1.15 }}
                                        style={{
                                            width: '28px', height: '28px', borderRadius: '8px',
                                            background: item.value,
                                            border: '2px solid rgba(255,255,255,0.1)',
                                            boxShadow: `0 0 10px ${item.value}30`,
                                        }}
                                        onClick={(e) => {
                                            if ((item as any).wheelable) {
                                                e.preventDefault();
                                                setWheelTarget(item.key as 'primary' | 'accent');
                                                setShowWheel(true);
                                            }
                                        }}
                                    />
                                    <input
                                        type="color" value={item.value}
                                        onChange={(e) => item.set(e.target.value)}
                                        style={{
                                            position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer',
                                            width: '100%', height: '100%',
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</span>
                                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.value}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* ── COLOR HARMONIES ── */}
                <div style={{ marginBottom: '24px' }}>
                    <HarmonySuggestions
                        primary={primary}
                        onSelect={(p, a) => applyColors({ primary: p, accent: a })}
                    />
                </div>

                {/* ── ATMOSPHERE CONTROLS ── */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✧ Atmosphere
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <AtmosphereSlider
                            label="Glow Intensity" icon="✦" value={glowIntensity} min={10} max={100} unit="%"
                            color={primary} accentColor={accent}
                            onChange={(v) => { setGlowIntensity(v); applyColors({ glowIntensity: v }); }}
                        />
                        <AtmosphereSlider
                            label="Glass Blur" icon="◉" value={blurAmount} min={8} max={48} unit="px"
                            color={accent} accentColor={primary}
                            onChange={(v) => { setBlurAmount(v); applyColors({ blurAmount: v }); }}
                        />
                    </div>
                </div>

                {/* ── LIVE PREVIEW ── */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🖥️ Live Preview
                    </div>
                    <LivePreviewPanel colors={currentColors} />
                </div>
            </div>

            {/* ── Color Wheel Modal ── */}
            <AnimatePresence>
                {showWheel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', inset: 0, zIndex: 100,
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '16px',
                        }}
                        onClick={() => setShowWheel(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                Pick {wheelTarget === 'primary' ? 'Primary' : 'Accent'} Color
                            </div>
                            <ColorWheel
                                value={wheelTarget === 'primary' ? primary : accent}
                                onChange={(hex) => {
                                    if (wheelTarget === 'primary') {
                                        setPrimary(hex);
                                        applyColors({ primary: hex });
                                    } else {
                                        setAccent(hex);
                                        applyColors({ accent: hex });
                                    }
                                }}
                                size={220}
                            />
                        </motion.div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowWheel(false)}
                            style={{
                                padding: '8px 24px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                                background: `linear-gradient(135deg, ${primary}, ${accent})`,
                                border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
                                boxShadow: `0 0 20px ${primary}40`,
                            }}
                        >Done</motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
