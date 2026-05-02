import React, { forwardRef, useEffect, useState } from 'react';
import { Eye, EyeOff, Maximize, Minimize, Copy, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArchitect } from '../../contexts/ArchitectContext';

interface ArchitectNodeProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    id: string;
    label: string;
    isDraggable?: boolean;
    onRemove?: () => void;
}

export const ArchitectNode = forwardRef<HTMLDivElement, ArchitectNodeProps>(({ 
    children, id, label: defaultLabel, className, style, isDraggable = true, onRemove, ...rest
}, ref) => {
    const { 
        isArchitectMode, layoutState, setActiveNodeId, activeNodeId, 
        removeNode, layoutMode, updateNodeProperty, addNode
    } = useArchitect();
    
    const config = layoutState[id];
    const label = config?.label || defaultLabel;
    const isShellNode = id.startsWith('shell-');
    const isVisible = config?.visible !== false || isShellNode;
    const isActive = activeNodeId === id;
    
    // Fallback to legacy layout if not in canvas mode
    const isCanvas = layoutMode === 'canvas';
    const legacyWidth = config?.width || '100%';

    // Visibility logic
    if (!isVisible && !isArchitectMode) return null;
    
    const isShellElement = id.startsWith('header-') || id.startsWith('sb-') || id.startsWith('shell-');

    if (!isArchitectMode) {
        // Shell nodes (header, sidebar elements) should pass through without forced sizing
        return (
            <div 
                ref={ref} 
                className={className}
                style={{
                    ...(isShellElement ? style : {
                        width: legacyWidth || '100%',
                        flex: legacyWidth === '100%' ? '0 0 100%' : (legacyWidth === '50%' ? '1 1 calc(50% - 12px)' : (legacyWidth === '33%' ? '1 1 calc(33.33% - 16px)' : '1 1 auto')),
                        ...style
                    })
                }}
                {...rest}
            >
                {children}
            </div>
        );
    }

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemove) onRemove();
        else removeNode(id);
    };

    return (
        <div 
            ref={ref}
            className={`architect-node-canvas ${isActive ? 'anc-active' : ''} ${!isVisible ? 'anc-hidden' : ''} ${className || ''}`}
            data-node-id={id}
            onClick={(e) => { e.stopPropagation(); setActiveNodeId(isActive ? null : id); }}
            style={{
                zIndex: isActive ? 100 : 1,
                // Legacy support
                ...(!isCanvas && {
                    position: 'relative',
                    width: legacyWidth,
                    flex: legacyWidth === '100%' ? '0 0 100%' : (legacyWidth === '50%' ? '1 1 calc(50% - 12px)' : (legacyWidth === '33%' ? '1 1 calc(33.33% - 16px)' : '1 1 auto')),
                }),
                ...style,
            }}
            {...rest}
        >
            {/* Glowing Selection border */}
            <motion.div 
                className="anc-border"
                initial={false}
                animate={{
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? 1 : 0.98,
                    borderColor: isActive ? 'var(--primary)' : 'rgba(99, 102, 241, 0.25)',
                    boxShadow: isActive ? '0 0 20px 2px rgba(99, 102, 241, 0.3)' : '0 0 0px 0px rgba(99,102,241,0)',
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />

            {/* Glowing Backdrop for active node */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="anc-glow-bg"
                    />
                )}
            </AnimatePresence>

            {/* Floating toolbar */}
            <div className="anc-toolbar-container">
                <motion.div 
                    className="anc-toolbar"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    {/* Drag handle specifically configured for react-grid-layout */}
                    {isDraggable && (
                        <div className="anc-drag-handle react-grid-drag-handle" title="Drag to move on grid">
                            <Move size={14} />
                        </div>
                    )}
                    <span className="anc-label">{label}</span>
                <div className="anc-actions">
                    {!isShellElement && isCanvas && (
                        <>
                            <button 
                                onMouseDown={(e) => e.stopPropagation()} 
                                onClick={(e) => { e.stopPropagation(); addNode({ ...config, id: `${config.id}-copy-${Date.now()}`, x: (config.x || 0) + 1, y: (config.y || 0) + 1 }); }}
                                title="Duplicate Section" className="anc-btn"
                            >
                                <Copy size={12} />
                            </button>
                            <button 
                                onMouseDown={(e) => e.stopPropagation()} 
                                onClick={(e) => { e.stopPropagation(); updateNodeProperty(id, 'w', config.w === 12 ? 6 : 12); }}
                                title={config.w === 12 ? "Shrink Width" : "Full Width"} className="anc-btn"
                            >
                                {config.w === 12 ? <Minimize size={12} /> : <Maximize size={12} />}
                            </button>
                        </>
                    )}
                    <button 
                        onMouseDown={(e) => e.stopPropagation()} // Prevent grid dragging when clicking
                        onClick={handleRemove} 
                        title={isVisible ? "Hide section" : "Show section"} 
                        className="anc-btn anc-btn-danger"
                    >
                        {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                </div>
                </motion.div>
            </div>

            {/* Content Container */}
            <div style={{ 
                opacity: isVisible ? 1 : 0.25,
                filter: isVisible ? 'none' : 'grayscale(1)',
                transition: 'opacity 0.3s, filter 0.3s',
                pointerEvents: 'auto',
                width: '100%',
                height: isShellElement ? 'auto' : '100%',
                overflow: isShellElement ? 'visible' : 'auto'
            }}
            onMouseDown={(e) => e.stopPropagation()} /* Prevent internal clicks from triggering grid dragging */
            >
                {children}
            </div>

            <style>{`
                .architect-node-canvas {
                    transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 16px;
                }
                .architect-node-canvas:hover { z-index: 50 !important; }
                
                /* Toolbar interaction */
                .anc-toolbar-container {
                    position: absolute;
                    top: 8px; left: 8px; right: 8px;
                    z-index: 100;
                    pointer-events: none;
                }
                .anc-toolbar {
                    display: flex; align-items: center; gap: 8px;
                    padding: 6px 8px;
                    background: rgba(10, 10, 15, 0.85);
                    backdrop-filter: blur(24px) saturate(200%);
                    -webkit-backdrop-filter: blur(24px) saturate(200%);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    opacity: 0;
                    transform: translateY(-8px) scale(0.95);
                    transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);
                    pointer-events: auto;
                }
                
                .architect-node-canvas:hover .anc-toolbar { 
                    opacity: 1 !important; 
                    transform: translateY(0) scale(1) !important;
                }
                .anc-active .anc-toolbar { 
                    opacity: 1 !important; 
                    transform: translateY(0) scale(1) !important;
                }

                .anc-border {
                    position: absolute; inset: -1px; border-radius: 17px; pointer-events: none; z-index: 5;
                    border: 2px dashed rgba(99, 102, 241, 0.25);
                }
                
                .anc-glow-bg {
                    position: absolute; inset: 0; border-radius: 16px; pointer-events: none; z-index: 0;
                    background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
                }
                
                .architect-node-canvas:hover .anc-border { opacity: 0.6 !important; }
                .anc-hidden .anc-border { border-color: rgba(239, 68, 68, 0.3) !important; }

                .anc-drag-handle {
                    display: flex; align-items: center; justify-content: center;
                    width: 28px; height: 28px; border-radius: 8px;
                    color: rgba(255,255,255,0.6); cursor: grab;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); flex-shrink: 0;
                    background: rgba(255,255,255,0.03);
                }
                .anc-drag-handle:hover { background: var(--primary); color: white; transform: scale(1.1); box-shadow: 0 0 15px rgba(99,102,241,0.5); }
                .anc-drag-handle:active { cursor: grabbing; transform: scale(0.95); }

                .anc-label {
                    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;
                    color: rgba(255,255,255,0.7); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                .anc-active .anc-label { color: var(--primary-light); text-shadow: 0 0 10px rgba(99,102,241,0.5); }

                .anc-actions { display: flex; gap: 4px; flex-shrink: 0; }
                .anc-btn {
                    display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;
                    border-radius: 8px; border: 1px solid transparent; background: transparent;
                    color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .anc-btn:hover { background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.15); transform: translateY(-1px); }
                .anc-btn:active { transform: translateY(1px); }
                .anc-btn-danger:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 15px rgba(239, 68, 68, 0.3); }
                
                /* Override react grid layout resize handle appearance */
                .react-resizable-handle {
                    position: absolute;
                    width: 24px;
                    height: 24px;
                    bottom: -6px;
                    right: -6px;
                    cursor: se-resize;
                    z-index: 110;
                    opacity: 0;
                    background: var(--primary);
                    border: 3px solid var(--bg-card);
                    border-radius: 50%;
                    pointer-events: auto;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 0 0 0 rgba(99,102,241,0);
                }
                .anc-active .react-resizable-handle { opacity: 1; }
                .react-resizable-handle:hover { transform: scale(1.3); box-shadow: 0 0 20px rgba(99,102,241,0.6); }
            `}</style>
        </div>
    );
});
ArchitectNode.displayName = 'ArchitectNode';
