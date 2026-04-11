import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Settings2, X, Eye, EyeOff, ChevronUp, ChevronDown, Columns, Maximize2 } from 'lucide-react';
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
        removeNode, updateNodeProperty, 
        draggedNodeId, setDraggedNodeId, dropTargetId, setDropTargetId, reorderNode
    } = useArchitect();
    const nodeRef = useRef<HTMLDivElement>(null);

    const config = layoutState[id];
    const label = config?.label || defaultLabel;
    const isShellNode = id.startsWith('shell-');
    const isVisible = config?.visible !== false || isShellNode;
    const isActive = activeNodeId === id;
    const width = config?.width || '100%';
    const isDragging = draggedNodeId === id;
    const isDropTarget = dropTargetId === id && draggedNodeId !== id;

    // Visibility logic
    if (!isVisible && !isArchitectMode) return null;
    if (!isArchitectMode) return <>{children}</>;

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemove) onRemove();
        else removeNode(id);
    };

    // --- DRAG & DROP ---
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        setDraggedNodeId(id);
        // Use a timeout so the dragging style applies after the ghost image is created
        requestAnimationFrame(() => {
            if (nodeRef.current) nodeRef.current.style.opacity = '0.3';
        });
    };

    const handleDragEnd = () => {
        setDraggedNodeId(null);
        setDropTargetId(null);
        if (nodeRef.current) nodeRef.current.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedNodeId && draggedNodeId !== id) {
            setDropTargetId(id);
        }
    };

    const handleDragLeave = () => {
        if (dropTargetId === id) setDropTargetId(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData('text/plain');
        if (fromId && fromId !== id) {
            reorderNode(fromId, id);
        }
        setDraggedNodeId(null);
        setDropTargetId(null);
    };

    // Width cycling
    const widths = ['100%', '50%', '33%'];
    const cycleWidth = (e: React.MouseEvent) => {
        e.stopPropagation();
        const currentIdx = widths.indexOf(String(width));
        const nextIdx = (currentIdx + 1) % widths.length;
        updateNodeProperty(id, 'width', widths[nextIdx]);
    };

    return (
        <div 
            ref={nodeRef}
            className={`architect-node-v2 ${isActive ? 'an2-active' : ''} ${isDropTarget ? 'an2-drop-target' : ''} ${isDragging ? 'an2-dragging' : ''} ${!isVisible ? 'an2-hidden' : ''} ${className || ''}`}
            data-node-id={id}
            onClick={(e) => { e.stopPropagation(); setActiveNodeId(isActive ? null : id); }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ 
                position: 'relative',
                ...style,
                width,
                flex: width === '100%' ? '0 0 100%' : (width === '50%' ? '1 1 calc(50% - 12px)' : (width === '33%' ? '1 1 calc(33.33% - 16px)' : '1 1 auto')),
            }}
        >
            {/* Drop indicator line */}
            <AnimatePresence>
                {isDropTarget && (
                    <motion.div 
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
                        style={{ 
                            position: 'absolute', top: -4, left: 0, right: 0, height: 3,
                            background: 'var(--primary)', borderRadius: 2, zIndex: 200,
                            boxShadow: '0 0 12px var(--primary)',
                            transformOrigin: 'left center'
                        }} 
                    />
                )}
            </AnimatePresence>

            {/* Selection border */}
            <div className="an2-border" />

            {/* Floating toolbar — appears on hover/active */}
            <div className="an2-toolbar">
                {/* Drag handle */}
                {isDraggable && (
                    <div 
                        className="an2-drag-handle"
                        draggable
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        title="Drag to reorder"
                    >
                        <GripVertical size={14} />
                    </div>
                )}

                {/* Label */}
                <span className="an2-label">{label}</span>

                {/* Quick actions */}
                <div className="an2-actions">
                    <button onClick={cycleWidth} title={`Width: ${width}`} className="an2-btn">
                        <Columns size={13} />
                        <span className="an2-btn-text">{width}</span>
                    </button>
                    <button onClick={handleRemove} title={isVisible ? "Hide section" : "Show section"} className="an2-btn an2-btn-danger">
                        {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ 
                opacity: isVisible ? 1 : 0.25,
                filter: isVisible ? 'none' : 'grayscale(1)',
                transition: 'opacity 0.3s, filter 0.3s',
                pointerEvents: 'auto',
            }}>
                {children}
            </div>

            <style>{`
                .architect-node-v2 {
                    position: relative;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    border-radius: 16px;
                }
                .architect-node-v2:hover { z-index: 10; }
                .architect-node-v2:hover .an2-toolbar { opacity: 1; transform: translateY(0); pointer-events: auto; }
                .architect-node-v2:hover .an2-border { opacity: 1; }
                
                /* Selection border — subtle dashed on hover, solid on active */
                .an2-border {
                    position: absolute; inset: -2px; border-radius: 18px; pointer-events: none; z-index: 50;
                    border: 2px dashed rgba(99, 102, 241, 0.25);
                    opacity: 0; transition: all 0.25s ease;
                }
                .an2-active .an2-border {
                    opacity: 1;
                    border: 2px solid var(--primary);
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
                }
                .an2-drop-target .an2-border {
                    opacity: 1;
                    border: 2px dashed var(--primary);
                    background: rgba(99, 102, 241, 0.04);
                }
                .an2-dragging { opacity: 0.3 !important; }
                .an2-hidden .an2-border {
                    border-color: rgba(239, 68, 68, 0.3);
                }
                .an2-active.an2-hidden .an2-border {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
                }

                /* Floating toolbar */
                .an2-toolbar {
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
                .an2-active .an2-toolbar {
                    opacity: 1; transform: translateY(0); pointer-events: auto;
                }

                /* Drag handle */
                .an2-drag-handle {
                    display: flex; align-items: center; justify-content: center;
                    width: 28px; height: 28px; border-radius: 8px;
                    color: rgba(255,255,255,0.4); cursor: grab;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }
                .an2-drag-handle:hover { background: rgba(255,255,255,0.1); color: white; }
                .an2-drag-handle:active { cursor: grabbing; }

                /* Label */
                .an2-label {
                    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
                    color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    flex: 1; min-width: 0;
                    user-select: none;
                }
                .an2-active .an2-label { color: var(--primary); }

                /* Action buttons */
                .an2-actions { display: flex; gap: 4px; flex-shrink: 0; }
                .an2-btn {
                    display: flex; align-items: center; gap: 4px;
                    padding: 4px 8px; border-radius: 8px;
                    border: none; background: rgba(255,255,255,0.06);
                    color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 700;
                    cursor: pointer; transition: all 0.15s; white-space: nowrap;
                }
                .an2-btn:hover { background: rgba(255,255,255,0.12); color: white; }
                .an2-btn-text { font-family: var(--font-mono, monospace); }
                .an2-btn-danger:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
            `}</style>
        </div>
    );
};
