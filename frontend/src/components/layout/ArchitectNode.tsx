import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Maximize2 } from 'lucide-react';
import { useArchitect } from '../../contexts/ArchitectContext';

interface ArchitectNodeProps {
    children: React.ReactNode;
    id: string;
    label: string;
    className?: string;
    style?: React.CSSProperties;
    isDraggable?: boolean;
    onRemove?: () => void;
}

export const ArchitectNode: React.FC<ArchitectNodeProps> = ({ 
    children, id, label: defaultLabel, className, style, isDraggable = true, onRemove
}) => {
    const { 
        isArchitectMode, layoutState, setActiveNodeId, activeNodeId, 
        removeNode, moveNode, resizeNode, layoutMode
    } = useArchitect();
    
    const nodeRef = useRef<HTMLDivElement>(null);

    const config = layoutState[id];
    const label = config?.label || defaultLabel;
    const isShellNode = id.startsWith('shell-');
    const isVisible = config?.visible !== false || isShellNode;
    const isActive = activeNodeId === id;
    
    // Matrix configuration
    const CELL_SIZE = 120; // 120px grid cells
    const GAP = 24;

    // Fallback to legacy layout if not in canvas mode
    const isCanvas = layoutMode === 'canvas';
    const legacyWidth = config?.width || '100%';

    // Read spatial coordinates (default to flat stream if unset)
    const [x, setX] = useState(config?.x ?? 0);
    const [y, setY] = useState(config?.y ?? (config?.order ?? 0) * 3);
    const [w, setW] = useState(config?.w ?? 4); // Default span 4 columns
    const [h, setH] = useState(config?.h ?? 3); // Default span 3 rows

    useEffect(() => {
        if (config?.x !== undefined) setX(config.x);
        if (config?.y !== undefined) setY(config.y);
        if (config?.w !== undefined) setW(config.w);
        if (config?.h !== undefined) setH(config.h);
    }, [config]);

    // Visibility logic
    if (!isVisible && !isArchitectMode) return null;
    if (!isArchitectMode) return (
        <div style={isCanvas ? {
            position: 'absolute',
            left: x * (CELL_SIZE + GAP),
            top: y * (CELL_SIZE + GAP),
            width: w * (CELL_SIZE + GAP) - GAP,
            height: h * (CELL_SIZE + GAP) - GAP,
            transition: 'all 0.3s ease'
        } : {
            width: legacyWidth,
            flex: legacyWidth === '100%' ? '0 0 100%' : (legacyWidth === '50%' ? '1 1 calc(50% - 12px)' : (legacyWidth === '33%' ? '1 1 calc(33.33% - 16px)' : '1 1 auto')),
        }}>
            {children}
        </div>
    );

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemove) onRemove();
        else removeNode(id);
    };

    // Canvas Matrix logic
    const calcPos = (val: number) => val * (CELL_SIZE + GAP);
    const calcDim = (span: number) => span * (CELL_SIZE + GAP) - GAP;

    return (
        <motion.div 
            ref={nodeRef}
            className={`architect-node-canvas ${isActive ? 'anc-active' : ''} ${!isVisible ? 'anc-hidden' : ''} ${className || ''}`}
            data-node-id={id}
            onClick={(e) => { e.stopPropagation(); setActiveNodeId(isActive ? null : id); }}
            
            // Framer Motion Properties for Dragging & Snapping
            drag={isDraggable && isCanvas}
            dragMomentum={false}
            onDrag={(e, info) => {
                // Update local visual state to snap cleanly on drag
                if (!nodeRef.current || !isCanvas) return;
                const rect = nodeRef.current.getBoundingClientRect();
                const parentRect = nodeRef.current.parentElement?.getBoundingClientRect();
                if (!parentRect) return;

                const localX = rect.left - parentRect.left;
                const localY = rect.top - parentRect.top;

                const snapX = Math.round(localX / (CELL_SIZE + GAP));
                const snapY = Math.round(localY / (CELL_SIZE + GAP));
                
                // Show drop ghost (could be drawn via parent, but local state works)
            }}
            onDragEnd={(e, info) => {
                if (!isCanvas) return;
                const snapX = Math.max(0, Math.round((calcPos(x) + info.offset.x) / (CELL_SIZE + GAP)));
                const snapY = Math.max(0, Math.round((calcPos(y) + info.offset.y) / (CELL_SIZE + GAP)));
                setX(snapX);
                setY(snapY);
                moveNode(id, snapX, snapY);
            }}

            // Positioning
            initial={false}
            animate={{
                x: isCanvas ? calcPos(x) : 0,
                y: isCanvas ? calcPos(y) : 0,
                width: isCanvas ? calcDim(w) : 'auto',
                height: isCanvas ? calcDim(h) : 'auto'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            
            style={{ 
                position: isCanvas ? 'absolute' : 'relative',
                zIndex: isActive ? 100 : 1,
                // Legacy support
                ...(!isCanvas && {
                    width: legacyWidth,
                    flex: legacyWidth === '100%' ? '0 0 100%' : (legacyWidth === '50%' ? '1 1 calc(50% - 12px)' : (legacyWidth === '33%' ? '1 1 calc(33.33% - 16px)' : '1 1 auto')),
                }),
                ...style,
            }}
        >
            {/* Selection border */}
            <div className="anc-border" />

            {/* Floating toolbar */}
            <div className="anc-toolbar drag-handle">
                {/* Drag handle */}
                {isDraggable && (
                    <div className="anc-drag-handle" title="Drag to move on grid">
                        <GripVertical size={14} />
                    </div>
                )}
                <span className="anc-label">{label}</span>
                <div className="anc-actions">
                    <button onClick={handleRemove} title={isVisible ? "Hide section" : "Show section"} className="anc-btn anc-btn-danger">
                        {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                </div>
            </div>

            {/* Freeform Resize Handles (Only when active and in canvas mode) */}
            {isCanvas && isActive && (
                <>
                    {/* Right Handle (Width) */}
                    <div className="anc-resize-handle anc-resize-e"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startW = w;
                            const onMove = (me: PointerEvent) => {
                                const diffItems = Math.round((me.clientX - startX) / (CELL_SIZE + GAP));
                                setW(Math.max(1, startW + diffItems));
                            };
                            const onUp = () => {
                                resizeNode(id, Math.max(1, w), h);
                                window.removeEventListener('pointermove', onMove);
                                window.removeEventListener('pointerup', onUp);
                            };
                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
                        }}
                    />
                    {/* Bottom Handle (Height) */}
                    <div className="anc-resize-handle anc-resize-s"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            const startY = e.clientY;
                            const startH = h;
                            const onMove = (me: PointerEvent) => {
                                const diffItems = Math.round((me.clientY - startY) / (CELL_SIZE + GAP));
                                setH(Math.max(1, startH + diffItems));
                            };
                            const onUp = () => {
                                resizeNode(id, w, Math.max(1, h));
                                window.removeEventListener('pointermove', onMove);
                                window.removeEventListener('pointerup', onUp);
                            };
                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
                        }}
                    />
                    {/* Bottom-Right Handle (Both) */}
                    <div className="anc-resize-handle anc-resize-se"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startW = w;
                            const startH = h;
                            const onMove = (me: PointerEvent) => {
                                const diffX = Math.round((me.clientX - startX) / (CELL_SIZE + GAP));
                                const diffY = Math.round((me.clientY - startY) / (CELL_SIZE + GAP));
                                setW(Math.max(1, startW + diffX));
                                setH(Math.max(1, startH + diffY));
                            };
                            const onUp = () => {
                                resizeNode(id, w, h);
                                window.removeEventListener('pointermove', onMove);
                                window.removeEventListener('pointerup', onUp);
                            };
                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
                        }}
                    >
                        <Maximize2 size={10} style={{ transform: 'rotate(90deg)', opacity: 0.5 }} />
                    </div>
                </>
            )}

            {/* Content Container */}
            <div style={{ 
                opacity: isVisible ? 1 : 0.25,
                filter: isVisible ? 'none' : 'grayscale(1)',
                transition: 'opacity 0.3s, filter 0.3s',
                pointerEvents: 'auto',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            }}>
                {children}
            </div>

            <style>{`
                .architect-node-canvas {
                    transition: box-shadow 0.2s ease;
                    border-radius: 16px;
                }
                .architect-node-canvas:hover { z-index: 50 !important; }
                .architect-node-canvas:hover .anc-toolbar { opacity: 1; transform: translateY(0); pointer-events: auto; }
                .architect-node-canvas:hover .anc-border { opacity: 1; }

                .anc-border {
                    position: absolute; inset: -2px; border-radius: 18px; pointer-events: none; z-index: 5;
                    border: 2px dashed rgba(99, 102, 241, 0.25);
                    opacity: 0; transition: all 0.25s ease;
                }
                .anc-active .anc-border {
                    opacity: 1;
                    border: 2px solid var(--primary);
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
                }
                .anc-hidden .anc-border { border-color: rgba(239, 68, 68, 0.3); }

                .anc-toolbar {
                    position: absolute;
                    top: 8px; left: 8px; right: 8px;
                    display: flex; align-items: center; gap: 8px;
                    padding: 6px 8px;
                    background: rgba(15, 15, 25, 0.92);
                    backdrop-filter: blur(16px) saturate(180%);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    z-index: 100;
                    opacity: 0;
                    transform: translateY(-4px);
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    pointer-events: none;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                }
                .anc-active .anc-toolbar { opacity: 1; transform: translateY(0); pointer-events: auto; }

                .anc-drag-handle {
                    display: flex; align-items: center; justify-content: center;
                    width: 28px; height: 28px; border-radius: 8px;
                    color: rgba(255,255,255,0.4); cursor: grab;
                    transition: all 0.15s; flex-shrink: 0;
                }
                .anc-drag-handle:hover { background: rgba(255,255,255,0.1); color: white; }
                .anc-drag-handle:active { cursor: grabbing; }

                .anc-label {
                    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
                    color: rgba(255,255,255,0.5); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none;
                }
                .anc-active .anc-label { color: var(--primary); }

                .anc-actions { display: flex; gap: 4px; flex-shrink: 0; }
                .anc-btn {
                    display: flex; align-items: center; gap: 4px;
                    padding: 4px 8px; border-radius: 8px; border: none; background: rgba(255,255,255,0.06);
                    color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s;
                }
                .anc-btn:hover { background: rgba(255,255,255,0.12); color: white; }
                .anc-btn-danger:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

                /* Resize handles */
                .anc-resize-handle {
                    position: absolute;
                    background: var(--primary);
                    border-radius: 4px;
                    z-index: 105;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .anc-active:hover .anc-resize-handle { opacity: 1; }
                
                .anc-resize-e {
                    top: 20%; bottom: 20%; right: -6px; width: 4px;
                    cursor: ew-resize;
                }
                .anc-resize-s {
                    left: 20%; right: 20%; bottom: -6px; height: 4px;
                    cursor: ns-resize;
                }
                .anc-resize-se {
                    bottom: -10px; right: -10px; width: 20px; height: 20px;
                    border-radius: 50%;
                    cursor: nwse-resize;
                    display: flex; align-items: center; justify-content: center;
                    color: white; box-shadow: 0 4px 12px rgba(99,102,241,0.5);
                }
            `}</style>
        </motion.div>
    );
};
