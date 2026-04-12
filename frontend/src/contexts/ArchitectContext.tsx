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
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    });

    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [layoutMode, setLayoutMode] = useState<'vertical' | 'grid' | 'canvas'>('canvas');
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [lastAction, setLastAction] = useState<string | null>(null);

    // --- UNDO/REDO ---
    const historyRef = useRef<Record<string, NodeConfig>[]>([]);
    const futureRef = useRef<Record<string, NodeConfig>[]>([]);
    const skipHistoryRef = useRef(false);

    const pushHistory = useCallback((prev: Record<string, NodeConfig>) => {
        if (skipHistoryRef.current) { skipHistoryRef.current = false; return; }
        historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), prev];
        futureRef.current = []; // clear redo on new action
    }, []);

    const undo = useCallback(() => {
        if (historyRef.current.length === 0) return;
        const prev = historyRef.current[historyRef.current.length - 1];
        historyRef.current = historyRef.current.slice(0, -1);
        futureRef.current = [...futureRef.current, layoutState];
        skipHistoryRef.current = true;
        setLayoutState(prev);
        setLastAction('Undo');
    }, [layoutState]);

    const redo = useCallback(() => {
        if (futureRef.current.length === 0) return;
        const next = futureRef.current[futureRef.current.length - 1];
        futureRef.current = futureRef.current.slice(0, -1);
        historyRef.current = [...historyRef.current, layoutState];
        skipHistoryRef.current = true;
        setLayoutState(next);
        setLastAction('Redo');
    }, [layoutState]);

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
                setActiveNodeId(null);
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

    const toggleArchitectMode = () => {
        setIsArchitectMode(prev => {
            const next = !prev;
            if (!next) {
                setActiveNodeId(null);
                setDraggedNodeId(null);
                setDropTargetId(null);
            }
            return next;
        });
    };

    const updateNodeProperty = (id: string, property: keyof NodeConfig, value: any) => {
        pushHistory(layoutState);
        setLayoutState(prev => ({
            ...prev,
            [id]: { ...prev[id], id, [property]: value }
        }));
        setLastAction(`Updated ${property}`);
    };

    const removeNode = (id: string) => {
        pushHistory(layoutState);
        setLayoutState(prev => {
            const next = { ...prev };
            if (next[id]) { next[id] = { ...next[id], visible: false }; }
            else { next[id] = { id, label: '', visible: false }; }
            return next;
        });
        if (activeNodeId === id) setActiveNodeId(null);
        setLastAction('Section hidden');
    };

    const restoreNode = (id: string) => {
        pushHistory(layoutState);
        setLayoutState(prev => ({
            ...prev,
            [id]: { ...prev[id], visible: true }
        }));
        setLastAction('Section restored');
    };

    const addNode = (config: NodeConfig) => {
        pushHistory(layoutState);
        setLayoutState(prev => ({
            ...prev,
            [config.id]: { ...config, visible: true }
        }));
        setActiveNodeId(config.id);
        setLastAction('Section added');
    };

    const reorderNode = useCallback((fromId: string, toId: string) => {
        if (fromId === toId) return;
        pushHistory(layoutState);
        setLayoutState(prev => {
            const next = { ...prev };
            const fromOrder = next[fromId]?.order ?? 0;
            const toOrder = next[toId]?.order ?? 0;
            // Swap orders
            next[fromId] = { ...next[fromId], id: fromId, order: toOrder };
            next[toId] = { ...next[toId], id: toId, order: fromOrder };
            return next;
        });
        setLastAction('Reordered');
    }, [layoutState, pushHistory]);

    const moveNode = useCallback((id: string, x: number, y: number) => {
        pushHistory(layoutState);
        setLayoutState(prev => {
            const next = { ...prev };
            const node = next[id];
            if (!node) return next;
            
            // Auto layout shift logic: If placing precisely where another node lives (and not a freeform overlap mode), 
            // shift the colliding node downwards. For a true completely freeform absolute canvas without constraints, 
            // we skip explicit collisions and visually layer them via zIndex. We will stick to deterministic coordinate grid here.
            next[id] = { ...node, id, x, y };
            return next;
        });
        setLastAction('Node moved');
    }, [layoutState, pushHistory]);

    const resizeNode = useCallback((id: string, w: number, h: number) => {
        pushHistory(layoutState);
        setLayoutState(prev => {
            const next = { ...prev };
            if (!next[id]) return next;
            // Ensure minimum sizes (1 column, 1 row minimum)
            next[id] = { ...next[id], w: Math.max(1, w), h: Math.max(1, h) };
            return next;
        });
        setLastAction('Node resized');
    }, [layoutState, pushHistory]);

    const updateLayoutSequence = useCallback((layouts: { i: string; x: number; y: number; w: number; h: number }[]) => {
        pushHistory(layoutState);
        setLayoutState(prev => {
            const next = { ...prev };
            layouts.forEach(l => {
                if (next[l.i]) {
                    next[l.i] = { ...next[l.i], x: l.x, y: l.y, w: l.w, h: l.h };
                }
            });
            return next;
        });
        setLastAction('Layout updated');
    }, [layoutState, pushHistory]);

    return (
        <ArchitectContext.Provider value={{ 
            isArchitectMode, setArchitectMode: setIsArchitectMode, toggleArchitectMode,
            layoutState, updateNodeProperty,
            activeNodeId, setActiveNodeId,
            removeNode, restoreNode, addNode,
            layoutMode, setLayoutMode,
            moveNode, resizeNode, updateLayoutSequence,
            reorderNode, draggedNodeId, setDraggedNodeId, dropTargetId, setDropTargetId,
            undo, redo,
            canUndo: historyRef.current.length > 0,
            canRedo: futureRef.current.length > 0,
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
