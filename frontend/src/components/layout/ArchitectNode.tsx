import React, { forwardRef, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
        removeNode, layoutMode
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
    
    if (!isArchitectMode) {
        return (
            <div 
                ref={ref} 
                className={className}
                style={{
                    ...(isCanvas && style ? style : {
                        width: legacyWidth,
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
            {/* Selection border */}
            <div className="anc-border" />

            {/* Floating toolbar */}
            <div className="anc-toolbar">
                {/* Drag handle specifically configured for react-grid-layout */}
                {isDraggable && (
                    <div className="anc-drag-handle react-grid-drag-handle" title="Drag to move on grid" style={{ cursor: 'grab' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                            <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                        </svg>
                    </div>
                )}
                <span className="anc-label">{label}</span>
                <div className="anc-actions">
                    <button 
                        onMouseDown={(e) => e.stopPropagation()} // Prevent grid dragging when clicking
                        onClick={handleRemove} 
                        title={isVisible ? "Hide section" : "Show section"} 
                        className="anc-btn anc-btn-danger"
                    >
                        {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div style={{ 
                opacity: isVisible ? 1 : 0.25,
                filter: isVisible ? 'none' : 'grayscale(1)',
                transition: 'opacity 0.3s, filter 0.3s',
                pointerEvents: 'auto',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            }}
            onMouseDown={(e) => e.stopPropagation()} /* Prevent internal clicks from triggering grid dragging */
            >
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
                
                /* Override react grid layout resize handle appearance */
                .react-resizable-handle {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    bottom: -5px;
                    right: -5px;
                    cursor: se-resize;
                    z-index: 110;
                    opacity: 0;
                    background: var(--primary);
                    border-radius: 50%;
                    pointer-events: auto;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                }
                .anc-active .react-resizable-handle { opacity: 1; }
                .react-resizable-handle:hover { transform: scale(1.2); }
            `}</style>
        </div>
    );
});
ArchitectNode.displayName = 'ArchitectNode';
