import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface NodeConfig {
    id: string;
    label: string;
    visible: boolean;
    type?: string; 
    order?: number;         // Legacy 1D ordering
    width?: string | number;// Legacy width
    x?: number;             // Grid X (column)
    y?: number;             // Grid Y (row)
    w?: number;             // Grid width span
    h?: number;             // Grid height span
    customProps?: Record<string, any>;
}

interface ArchitectContextType {
    isArchitectMode: boolean;
    setArchitectMode: (mode: boolean) => void;
    toggleArchitectMode: () => void;
    layoutState: Record<string, NodeConfig>;
    updateNodeProperty: (id: string, property: keyof NodeConfig, value: any) => void;
    activeNodeId: string | null;
    setActiveNodeId: (id: string | null) => void;
    removeNode: (id: string) => void;
    restoreNode: (id: string) => void;
    addNode: (config: NodeConfig) => void;
    layoutMode: 'vertical' | 'grid' | 'canvas';
    setLayoutMode: (mode: 'vertical' | 'grid' | 'canvas') => void;
    
    // Matrix Handlers
    moveNode: (id: string, x: number, y: number) => void;
    resizeNode: (id: string, w: number, h: number) => void;
    updateLayoutSequence: (layouts: { i: string; x: number; y: number; w: number; h: number }[]) => void;
    
    // Reset
    resetLayout: () => void;
    
    // Legacy Drag reorder
    reorderNode: (fromId: string, toId: string) => void;
    draggedNodeId: string | null;
    setDraggedNodeId: (id: string | null) => void;
    dropTargetId: string | null;
    setDropTargetId: (id: string | null) => void;
    // Undo/Redo
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    // Status
    lastAction: string | null;
}

const ArchitectContext = createContext<ArchitectContextType | undefined>(undefined);

const STORAGE_KEY = 'nalyse-workspace-layout-v4';
const MAX_HISTORY = 30;

export const ArchitectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isArchitectMode, setIsArchitectMode] = useState(() => {
        return localStorage.getItem('nalyse-architect-mode') === 'true';
    });

    const [layoutState, setLayoutState] = useState<Record<string, NodeConfig>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [layoutMode, setLayoutMode] = useState<'vertical' | 'grid' | 'canvas'>('canvas');
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [lastAction, setLastAction] = useState<string | null>(null);

    // --- UNDO/REDO (reactive state for canUndo/canRedo) ---
    const [undoStack, setUndoStack] = useState<Record<string, NodeConfig>[]>([]);
    const [redoStack, setRedoStack] = useState<Record<string, NodeConfig>[]>([]);
    const skipHistoryRef = useRef(false);

    const canUndo = undoStack.length > 0;
    const canRedo = redoStack.length > 0;

    const pushHistory = useCallback((snapshot: Record<string, NodeConfig>) => {
        if (skipHistoryRef.current) { skipHistoryRef.current = false; return; }
        setUndoStack(prev => [...prev.slice(-MAX_HISTORY), snapshot]);
        setRedoStack([]); // clear redo on new action
    }, []);

    const undo = useCallback(() => {
        setUndoStack(prevUndo => {
            if (prevUndo.length === 0) return prevUndo;
            const snapshot = prevUndo[prevUndo.length - 1];
            const remaining = prevUndo.slice(0, -1);
            // Push current state to redo before restoring
            setLayoutState(current => {
                setRedoStack(prevRedo => [...prevRedo, current]);
                return snapshot;
            });
            skipHistoryRef.current = true;
            setLastAction('Undo');
            return remaining;
        });
    }, []);

    const redo = useCallback(() => {
        setRedoStack(prevRedo => {
            if (prevRedo.length === 0) return prevRedo;
            const snapshot = prevRedo[prevRedo.length - 1];
            const remaining = prevRedo.slice(0, -1);
            // Push current state to undo before restoring
            setLayoutState(current => {
                setUndoStack(prevUndo => [...prevUndo, current]);
                return snapshot;
            });
            skipHistoryRef.current = true;
            setLastAction('Redo');
            return remaining;
        });
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isArchitectMode) return;
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault(); undo();
            }
            if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault(); redo();
            }
            if (e.key === 'Escape') {
                // If a node is selected, deselect it first; otherwise exit architect mode
                setActiveNodeId(prev => {
                    if (prev !== null) return null;
                    // No node selected — exit architect mode
                    setIsArchitectMode(false);
                    setDraggedNodeId(null);
                    setDropTargetId(null);
                    setLastAction('Exited editor');
                    return null;
                });
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isArchitectMode, undo, redo]);

    // Persistence
    useEffect(() => { localStorage.setItem('nalyse-architect-mode', String(isArchitectMode)); }, [isArchitectMode]);
    useEffect(() => { localStorage.setItem('nalyse-layout-mode', layoutMode); }, [layoutMode]);
    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutState)); }, [layoutState]);

    // Clear action toast
    useEffect(() => {
        if (!lastAction) return;
        const t = setTimeout(() => setLastAction(null), 1500);
        return () => clearTimeout(t);
    }, [lastAction]);

    const toggleArchitectMode = useCallback(() => {
        setIsArchitectMode(prev => {
            const next = !prev;
            if (!next) {
                setActiveNodeId(null);
                setDraggedNodeId(null);
                setDropTargetId(null);
            }
            return next;
        });
    }, []);

    const updateNodeProperty = useCallback((id: string, property: keyof NodeConfig, value: any) => {
        setLayoutState(prev => {
            pushHistory(prev);
            return {
                ...prev,
                [id]: { ...prev[id], id, [property]: value }
            };
        });
        setLastAction(`Updated ${property}`);
    }, [pushHistory]);

    const removeNode = useCallback((id: string) => {
        setLayoutState(prev => {
            pushHistory(prev);
            const next = { ...prev };
            if (next[id]) { next[id] = { ...next[id], visible: false }; }
            else { next[id] = { id, label: '', visible: false }; }
            return next;
        });
        setActiveNodeId(prev => prev === id ? null : prev);
        setLastAction('Section hidden');
    }, [pushHistory]);

    const restoreNode = useCallback((id: string) => {
        setLayoutState(prev => {
            pushHistory(prev);
            return {
                ...prev,
                [id]: { ...prev[id], visible: true }
            };
        });
        setLastAction('Section restored');
    }, [pushHistory]);

    const addNode = useCallback((config: NodeConfig) => {
        setLayoutState(prev => {
            pushHistory(prev);
            return {
                ...prev,
                [config.id]: { ...config, visible: true }
            };
        });
        setActiveNodeId(config.id);
        setLastAction('Section added');
    }, [pushHistory]);

    const reorderNode = useCallback((fromId: string, toId: string) => {
        if (fromId === toId) return;
        setLayoutState(prev => {
            pushHistory(prev);
            const next = { ...prev };
            const fromOrder = next[fromId]?.order ?? 0;
            const toOrder = next[toId]?.order ?? 0;
            next[fromId] = { ...next[fromId], id: fromId, order: toOrder };
            next[toId] = { ...next[toId], id: toId, order: fromOrder };
            return next;
        });
        setLastAction('Reordered');
    }, [pushHistory]);

    const moveNode = useCallback((id: string, x: number, y: number) => {
        setLayoutState(prev => {
            pushHistory(prev);
            const node = prev[id];
            if (!node) return prev;
            return { ...prev, [id]: { ...node, id, x, y } };
        });
        setLastAction('Node moved');
    }, [pushHistory]);

    const resizeNode = useCallback((id: string, w: number, h: number) => {
        setLayoutState(prev => {
            pushHistory(prev);
            if (!prev[id]) return prev;
            return { ...prev, [id]: { ...prev[id], w: Math.max(1, w), h: Math.max(1, h) } };
        });
        setLastAction('Node resized');
    }, [pushHistory]);

    const updateLayoutSequence = useCallback((layouts: { i: string; x: number; y: number; w: number; h: number }[]) => {
        setLayoutState(prev => {
            pushHistory(prev);
            const next = { ...prev };
            layouts.forEach(l => {
                if (next[l.i]) {
                    next[l.i] = { ...next[l.i], x: l.x, y: l.y, w: l.w, h: l.h };
                }
            });
            return next;
        });
        setLastAction('Layout updated');
    }, [pushHistory]);

    const resetLayout = useCallback(() => {
        setLayoutState(prev => {
            pushHistory(prev);
            return {};
        });
        setActiveNodeId(null);
        setUndoStack([]);
        setRedoStack([]);
        setLastAction('Layout reset to default');
    }, [pushHistory]);

    return (
        <ArchitectContext.Provider value={{ 
            isArchitectMode, setArchitectMode: setIsArchitectMode, toggleArchitectMode,
            layoutState, updateNodeProperty,
            activeNodeId, setActiveNodeId,
            removeNode, restoreNode, addNode,
            layoutMode, setLayoutMode,
            moveNode, resizeNode, updateLayoutSequence,
            resetLayout,
            reorderNode, draggedNodeId, setDraggedNodeId, dropTargetId, setDropTargetId,
            undo, redo,
            canUndo,
            canRedo,
            lastAction
        }}>
            {children}
        </ArchitectContext.Provider>
    );
};

export const useArchitect = () => {
    const context = useContext(ArchitectContext);
    if (!context) throw new Error('useArchitect must be used within an ArchitectProvider');
    return context;
};
