import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Layout, Grid, Undo2, Redo2, Eye, EyeOff, Type, Columns, 
    Sparkles, Plus, Activity, PieChart, ShieldAlert, Trash2, RotateCcw,
    Layers, Maximize2, Command, ChevronUp, ChevronDown
} from 'lucide-react';
import { useArchitect } from '../../contexts/ArchitectContext';

export const ArchitectPanel: React.FC = () => {
    const { 
        isArchitectMode, activeNodeId, setActiveNodeId, layoutState, 
        updateNodeProperty, removeNode, restoreNode, addNode,
        layoutMode, setLayoutMode, toggleArchitectMode,
        undo, redo, canUndo, canRedo, lastAction
    } = useArchitect();

    const [showLibrary, setShowLibrary] = useState(false);
    const [showHidden, setShowHidden] = useState(false);

    const activeNode = activeNodeId 
        ? layoutState[activeNodeId] || { id: activeNodeId, label: 'Unconfigured', visible: true, order: 0 } 
        : null;

    const hiddenNodes = Object.values(layoutState).filter(n => !n.visible && n.label);
    const widths = ['100%', '50%', '33%'];

    const sectorLibrary = [
        { id: 'lib-anomaly', name: 'Anomaly Matrix', icon: ShieldAlert },
        { id: 'lib-forecast', name: 'Prediction Engine', icon: Activity },
        { id: 'lib-stats', name: 'Aggregate Stats', icon: PieChart },
    ];

    if (!isArchitectMode) return null;

    return (
        <>
            {/* ── ACTION STATUS TOAST ── */}
            <AnimatePresence>
                {lastAction && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(15, 15, 25, 0.95)', backdropFilter: 'blur(16px)',
                            padding: '8px 20px', borderRadius: '12px', zIndex: 10002,
                            color: 'var(--primary)', fontSize: '12px', fontWeight: 800,
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                            letterSpacing: '0.05em', pointerEvents: 'none'
                        }}
                    >
                        {lastAction}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── BOTTOM COMMAND BAR ── */}
            <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="arch-command-bar"
            >
                {/* Left: Global controls */}
                <div className="acb-group">
                    <button onClick={() => setLayoutMode(layoutMode === 'vertical' ? 'grid' : 'vertical')} className="acb-btn" title="Toggle layout">
                        {layoutMode === 'grid' ? <Grid size={15} /> : <Layout size={15} />}
                        <span className="acb-btn-label">{layoutMode === 'grid' ? 'Grid' : 'Stack'}</span>
                    </button>
                    <div className="acb-divider" />
                    <button onClick={undo} disabled={!canUndo} className="acb-btn" title="Undo (⌘Z)">
                        <Undo2 size={15} />
                    </button>
                    <button onClick={redo} disabled={!canRedo} className="acb-btn" title="Redo (⌘⇧Z)">
                        <Redo2 size={15} />
                    </button>
                </div>

                {/* Center: Active node inspector or status */}
                <div className="acb-center">
                    <AnimatePresence mode="wait">
                        {activeNode ? (
                            <motion.div 
                                key={activeNode.id}
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="acb-inspector"
                            >
                                <span className="acb-inspector-label">{activeNode.label || activeNode.id}</span>
                                <div className="acb-divider" />

                                {/* Width selector */}
                                <div className="acb-width-group">
                                    {widths.map(w => (
                                        <button 
                                            key={w} 
                                            onClick={() => updateNodeProperty(activeNode.id, 'width', w)}
                                            className={`acb-width-btn ${(activeNode.width || '100%') === w ? 'active' : ''}`}
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                                <div className="acb-divider" />

                                {/* Order controls */}
                                <button onClick={() => updateNodeProperty(activeNode.id, 'order', (activeNode.order || 0) - 1)} className="acb-btn" title="Move up">
                                    <ChevronUp size={15} />
                                </button>
                                <button onClick={() => updateNodeProperty(activeNode.id, 'order', (activeNode.order || 0) + 1)} className="acb-btn" title="Move down">
                                    <ChevronDown size={15} />
                                </button>
                                <div className="acb-divider" />

                                {/* Visibility */}
                                <button 
                                    onClick={() => updateNodeProperty(activeNode.id, 'visible', !activeNode.visible)} 
                                    className={`acb-btn ${!activeNode.visible ? 'acb-btn-warning' : ''}`}
                                    title={activeNode.visible ? 'Hide' : 'Show'}
                                >
                                    {activeNode.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                                </button>

                                {/* Deselect */}
                                <button onClick={() => setActiveNodeId(null)} className="acb-btn" title="Deselect (Esc)">
                                    <X size={15} />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="acb-status"
                            >
                                <Command size={13} style={{ opacity: 0.4 }} />
                                <span>Click any section to edit • Drag to reorder</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Library & hidden nodes */}
                <div className="acb-group">
                    {hiddenNodes.length > 0 && (
                        <>
                            <button onClick={() => setShowHidden(!showHidden)} className="acb-btn acb-btn-warning" title="Hidden sections">
                                <EyeOff size={15} />
                                <span className="acb-badge">{hiddenNodes.length}</span>
                            </button>
                            <div className="acb-divider" />
                        </>
                    )}
                    <button onClick={() => setShowLibrary(!showLibrary)} className="acb-btn" title="Add section">
                        <Plus size={15} />
                    </button>
                    <div className="acb-divider" />
                    <button onClick={toggleArchitectMode} className="acb-btn acb-btn-done" title="Exit editor">
                        <Sparkles size={14} />
                        <span className="acb-btn-label">Done</span>
                    </button>
                </div>
            </motion.div>

            {/* ── LIBRARY POPUP ── */}
            <AnimatePresence>
                {showLibrary && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="acb-popup"
                        style={{ bottom: 80 }}
                    >
                        <div className="acb-popup-header">
                            <span>Add Section</span>
                            <button onClick={() => setShowLibrary(false)} className="acb-btn"><X size={14} /></button>
                        </div>
                        {sectorLibrary.map(item => (
                            <button 
                                key={item.id} 
                                className="acb-popup-item"
                                onClick={() => {
                                    addNode({ id: `ext-${item.id}-${Date.now()}`, label: item.name, type: item.id, visible: true });
                                    setShowLibrary(false);
                                }}
                            >
                                <item.icon size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                <span>{item.name}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── HIDDEN NODES POPUP ── */}
            <AnimatePresence>
                {showHidden && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="acb-popup"
                        style={{ bottom: 80 }}
                    >
                        <div className="acb-popup-header">
                            <span>Hidden Sections</span>
                            <button onClick={() => setShowHidden(false)} className="acb-btn"><X size={14} /></button>
                        </div>
                        {hiddenNodes.map(node => (
                            <button 
                                key={node.id} 
                                className="acb-popup-item"
                                onClick={() => { restoreNode(node.id); }}
                            >
                                <RotateCcw size={14} style={{ color: '#4ade80', flexShrink: 0 }} />
                                <span>{node.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .arch-command-bar {
                    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
                    display: flex; align-items: center; gap: 4px;
                    padding: 6px;
                    background: rgba(12, 12, 22, 0.95);
                    backdrop-filter: blur(24px) saturate(200%);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    z-index: 10001;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
                    max-width: calc(100vw - 32px);
                }
                .acb-group { display: flex; align-items: center; gap: 2px; }
                .acb-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.08); margin: 0 4px; flex-shrink: 0; }
                .acb-center { display: flex; align-items: center; padding: 0 4px; }

                .acb-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 8px 10px; border-radius: 10px;
                    border: none; background: transparent;
                    color: rgba(255,255,255,0.5); cursor: pointer;
                    transition: all 0.15s; font-size: 12px; font-weight: 700;
                    white-space: nowrap; position: relative;
                }
                .acb-btn:hover { background: rgba(255,255,255,0.08); color: white; }
                .acb-btn:disabled { opacity: 0.25; pointer-events: none; }
                .acb-btn-label { font-size: 11px; }
                .acb-btn-warning { color: #f59e0b; }
                .acb-btn-warning:hover { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }
                .acb-btn-done { 
                    background: var(--primary); color: white; 
                    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3); 
                }
                .acb-btn-done:hover { 
                    background: #818cf8; 
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
                    transform: translateY(-1px);
                }

                .acb-badge {
                    background: rgba(245, 158, 11, 0.2); color: #f59e0b;
                    font-size: 9px; font-weight: 900; padding: 1px 5px;
                    border-radius: 6px; min-width: 16px; text-align: center;
                }

                /* Inspector */
                .acb-inspector { display: flex; align-items: center; gap: 6px; }
                .acb-inspector-label {
                    font-size: 11px; font-weight: 900; color: var(--primary);
                    text-transform: uppercase; letter-spacing: 0.08em;
                    max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }

                .acb-width-group { display: flex; gap: 2px; }
                .acb-width-btn {
                    padding: 4px 8px; border: none; border-radius: 6px;
                    background: transparent; color: rgba(255,255,255,0.4);
                    font-size: 10px; font-weight: 800; font-family: var(--font-mono, monospace);
                    cursor: pointer; transition: all 0.15s;
                }
                .acb-width-btn:hover { background: rgba(255,255,255,0.08); color: white; }
                .acb-width-btn.active { background: var(--primary); color: white; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3); }

                /* Status */
                .acb-status { 
                    display: flex; align-items: center; gap: 8px; padding: 0 12px;
                    color: rgba(255,255,255,0.3); font-size: 12px; font-weight: 600; white-space: nowrap;
                }

                /* Popups */
                .acb-popup {
                    position: fixed; right: 16px;
                    width: 260px; background: rgba(12, 12, 22, 0.97);
                    backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; z-index: 10002; overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }
                .acb-popup-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
                    font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.6);
                    text-transform: uppercase; letter-spacing: 0.1em;
                }
                .acb-popup-item {
                    display: flex; align-items: center; gap: 12px; width: 100%;
                    padding: 12px 16px; border: none; background: transparent;
                    color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600;
                    cursor: pointer; transition: all 0.15s; text-align: left;
                }
                .acb-popup-item:hover { background: rgba(255,255,255,0.05); color: white; }
            `}</style>
        </>
    );
};
