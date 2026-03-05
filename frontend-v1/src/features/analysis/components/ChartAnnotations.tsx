import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Flag, Lightbulb, X, Pin, Send, Trash2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ChartAnnotation {
    id: string;
    chartId: string;
    x: number;         // Relative X position (0-1)
    y: number;         // Relative Y position (0-1)
    type: 'comment' | 'flag' | 'insight';
    text: string;
    author: string;
    createdAt: string;
    color: string;
    isPinned: boolean;
}

interface ChartAnnotationLayerProps {
    chartId: string;
    annotations: ChartAnnotation[];
    onAddAnnotation: (annotation: ChartAnnotation) => void;
    onRemoveAnnotation: (id: string) => void;
    onTogglePin: (id: string) => void;
    enabled: boolean;
    isDark?: boolean;
    authorName?: string;
}

const TYPE_CONFIG = {
    comment: { icon: MessageSquare, color: '#38bdf8', label: 'Comment' },
    flag: { icon: Flag, color: '#f43f5e', label: 'Flag' },
    insight: { icon: Lightbulb, color: '#fbbf24', label: 'Insight' },
};

// ═══════════════════════════════════════════════════════════════════
// ANNOTATION LAYER
// ═══════════════════════════════════════════════════════════════════

export const ChartAnnotationLayer: React.FC<ChartAnnotationLayerProps> = ({
    chartId, annotations, onAddAnnotation, onRemoveAnnotation, onTogglePin,
    enabled, isDark = true, authorName = 'Analyst',
}) => {
    const [showInput, setShowInput] = useState<{ x: number; y: number } | null>(null);
    const [inputText, setInputText] = useState('');
    const [inputType, setInputType] = useState<'comment' | 'flag' | 'insight'>('comment');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const bg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const fg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(15,23,42,${a})`;

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!enabled || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setShowInput({ x, y });
        setInputText('');
    }, [enabled]);

    const handleSubmit = useCallback(() => {
        if (!inputText.trim() || !showInput) return;
        const annotation: ChartAnnotation = {
            id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            chartId,
            x: showInput.x,
            y: showInput.y,
            type: inputType,
            text: inputText.trim(),
            author: authorName,
            createdAt: new Date().toISOString(),
            color: TYPE_CONFIG[inputType].color,
            isPinned: false,
        };
        onAddAnnotation(annotation);
        setShowInput(null);
        setInputText('');
    }, [inputText, showInput, inputType, chartId, authorName, onAddAnnotation]);

    const chartAnnotations = annotations.filter(a => a.chartId === chartId);

    return (
        <div
            ref={containerRef}
            onClick={handleClick}
            style={{
                position: 'absolute', inset: 0,
                cursor: enabled ? 'crosshair' : 'default',
                zIndex: 10,
                pointerEvents: enabled || chartAnnotations.length > 0 ? 'auto' : 'none',
            }}
        >
            {/* Annotation Markers */}
            {chartAnnotations.map((ann) => {
                const Config = TYPE_CONFIG[ann.type];
                const Icon = Config.icon;
                const isHovered = hoveredId === ann.id;

                return (
                    <div key={ann.id} style={{
                        position: 'absolute',
                        left: `${ann.x * 100}%`,
                        top: `${ann.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: isHovered || ann.isPinned ? 30 : 20,
                    }}>
                        {/* Marker dot */}
                        <div
                            onMouseEnter={() => setHoveredId(ann.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: `${ann.color}20`,
                                border: `2px solid ${ann.color}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                                boxShadow: `0 0 12px ${ann.color}30`,
                            }}
                        >
                            <Icon size={10} color={ann.color} />
                        </div>

                        {/* Tooltip popover */}
                        <AnimatePresence>
                            {(isHovered || ann.isPinned) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        position: 'absolute',
                                        top: '28px', left: '50%', transform: 'translateX(-50%)',
                                        minWidth: '180px', maxWidth: '260px',
                                        padding: '10px 12px', borderRadius: '10px',
                                        background: isDark ? 'rgba(15,15,25,0.95)' : 'rgba(255,255,255,0.95)',
                                        backdropFilter: 'blur(16px)',
                                        border: `1px solid ${ann.color}30`,
                                        boxShadow: `0 8px 20px rgba(0,0,0,0.3)`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '8px', fontWeight: 900, padding: '2px 5px', borderRadius: '4px', background: `${ann.color}20`, color: ann.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {Config.label}
                                        </span>
                                        <span style={{ flex: 1 }} />
                                        <button onClick={() => onTogglePin(ann.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ann.isPinned ? '#fbbf24' : fg(0.3), padding: '1px' }}>
                                            <Pin size={10} />
                                        </button>
                                        <button onClick={() => onRemoveAnnotation(ann.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: fg(0.3), padding: '1px' }}>
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: fg(0.8), lineHeight: 1.5, marginBottom: '4px' }}>
                                        {ann.text}
                                    </div>
                                    <div style={{ fontSize: '9px', color: fg(0.3) }}>
                                        {ann.author} · {new Date(ann.createdAt).toLocaleDateString()}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            {/* Inline Add Form */}
            <AnimatePresence>
                {showInput && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            left: `${showInput.x * 100}%`,
                            top: `${showInput.y * 100}%`,
                            transform: 'translate(-50%, 12px)',
                            width: '240px',
                            padding: '12px', borderRadius: '12px',
                            background: isDark ? 'rgba(15,15,25,0.95)' : 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${bg(0.1)}`,
                            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                            zIndex: 40,
                        }}
                    >
                        {/* Type selector */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                            {(Object.entries(TYPE_CONFIG) as [string, typeof TYPE_CONFIG.comment][]).map(([key, config]) => {
                                const Icon = config.icon;
                                const isActive = inputType === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setInputType(key as any)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 800,
                                            background: isActive ? `${config.color}15` : 'transparent',
                                            border: `1px solid ${isActive ? config.color : bg(0.08)}`,
                                            color: isActive ? config.color : fg(0.4),
                                            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}
                                    >
                                        <Icon size={10} /> {config.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Text input */}
                        <textarea
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder="Add your annotation..."
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                                if (e.key === 'Escape') setShowInput(null);
                            }}
                            style={{
                                width: '100%', minHeight: '50px', padding: '8px',
                                borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                background: bg(0.04), border: `1px solid ${bg(0.08)}`,
                                color: fg(0.8), resize: 'none', outline: 'none',
                                fontFamily: 'inherit', lineHeight: 1.5,
                            }}
                        />

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            <button onClick={() => setShowInput(null)} style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                background: 'transparent', border: `1px solid ${bg(0.08)}`, color: fg(0.4),
                                cursor: 'pointer',
                            }}>
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={!inputText.trim()} style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '4px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                background: inputText.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : bg(0.04),
                                border: 'none', color: inputText.trim() ? '#fff' : fg(0.3),
                                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                            }}>
                                <Send size={10} /> Add
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
// HOOK: Annotation State Manager
// ═══════════════════════════════════════════════════════════════════

export function useAnnotations(storageKey: string = 'nalyse_annotations') {
    const [annotations, setAnnotations] = useState<ChartAnnotation[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const persist = useCallback((updated: ChartAnnotation[]) => {
        setAnnotations(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
    }, [storageKey]);

    const addAnnotation = useCallback((ann: ChartAnnotation) => {
        persist([...annotations, ann]);
    }, [annotations, persist]);

    const removeAnnotation = useCallback((id: string) => {
        persist(annotations.filter(a => a.id !== id));
    }, [annotations, persist]);

    const togglePin = useCallback((id: string) => {
        persist(annotations.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
    }, [annotations, persist]);

    const clearChart = useCallback((chartId: string) => {
        persist(annotations.filter(a => a.chartId !== chartId));
    }, [annotations, persist]);

    return { annotations, addAnnotation, removeAnnotation, togglePin, clearChart };
}
