import React, { useState, useRef, useEffect } from 'react';
import {
    LayoutDashboard, Settings, ArrowRightLeft, FileText,
    Database, Code2, Map, Users, X, Trash2,
    ArrowRightFromLine, ArrowLeftFromLine, Files, BarChart3, Bot, Sparkles
} from 'lucide-react';

export interface TabType {
    id: string;
    title: string;
    type: 'dashboard' | 'analysis' | 'settings' | 'landing' | 'bi' | 'correlate' | 'migration' | 'nexus' | 'groups' | 'projects' | 'developer' | 'sources' | 'logistics' | 'agentic' | 'democracy';
    data?: any;
    icon?: React.ReactNode;
}

interface TabBarProps {
    tabs: TabType[];
    activeTabId: string;
    onActivate: (id: string) => void;
    onClose: (id: string) => void;
    onCloseOthers: (id: string) => void;
    onCloseRight: (id: string) => void;
    onCloseLeft: (id: string) => void;
    onCloseAll: () => void;
    onMove: (fromIndex: number, toIndex: number) => void;
}

export const TabBar = ({
    tabs,
    activeTabId,
    onActivate,
    onClose,
    onCloseOthers,
    onCloseRight,
    onCloseLeft,
    onCloseAll,
    onMove
}: TabBarProps) => {
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId: string } | null>(null);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close Context Menu on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = 'move';
        // For Firefox mostly
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === undefined) return;
        if (draggedIdx !== index) {
            onMove(draggedIdx, index);
        }
        setDraggedIdx(null);
    };

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, fileId: id });
    };

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '40px',
                    padding: '0 16px',
                    gap: '2px',
                    userSelect: 'none',
                    overflowX: 'auto',
                    background: 'var(--bg-header)',
                    borderBottom: '1px solid var(--border-default)',
                    position: 'relative',
                    zIndex: 10
                }}
            >
                {tabs.map((tab, idx) => (
                    <div
                        key={tab.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onClick={() => onActivate(tab.id)}
                        onContextMenu={(e) => handleContextMenu(e, tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0 12px 0 14px',
                            height: '32px',
                            color: activeTabId === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: activeTabId === tab.id ? 700 : 500,
                            cursor: 'pointer',
                            maxWidth: '180px',
                            minWidth: '100px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            background: activeTabId === tab.id ? 'var(--bg-card)' : 'transparent',
                            borderRadius: '8px',
                            border: activeTabId === tab.id ? '1px solid var(--border-default)' : '1px solid transparent',
                            opacity: draggedIdx === idx ? 0.5 : 1,
                            flexShrink: 0
                        }}
                        className="tab-item"
                    >
                        <span style={{ opacity: activeTabId === tab.id ? 1 : 0.6, display: 'flex', alignItems: 'center' }}>
                            {tab.icon || (
                                tab.type === 'dashboard' ? <LayoutDashboard size={14} /> :
                                    tab.type === 'analysis' ? <BarChart3 size={14} /> :
                                        tab.type === 'settings' ? <Settings size={14} /> :
                                            tab.type === 'migration' ? <ArrowRightLeft size={14} /> :
                                                tab.type === 'developer' ? <Code2 size={14} /> :
                                                    tab.type === 'sources' ? <Database size={14} /> :
                                                        tab.type === 'logistics' ? <Map size={14} /> :
                                                            tab.type === 'groups' ? <Users size={14} /> :
                                                                tab.type === 'agentic' ? <Bot size={14} /> :
                                                                    tab.type === 'democracy' ? <Sparkles size={14} /> :
                                                                        <FileText size={14} />
                            )}
                        </span>
                        <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1
                        }}>
                            {tab.title}
                        </span>

                        {tabs.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose(tab.id);
                                }}
                                className="btn btn-icon btn-ghost btn-sm"
                                style={{
                                    padding: '2px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '4px',
                                    opacity: 0.6
                                }}
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Styled Context Menu */}
            {contextMenu && (
                <div
                    ref={menuRef}
                    className="glass-morphism animate-fade-in"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y + 5,
                        left: contextMenu.x + 5,
                        zIndex: 2000,
                        padding: '8px',
                        minWidth: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                        borderRadius: '16px',
                        overflow: 'hidden'
                    }}
                >
                    <MenuButton onClick={() => { onClose(contextMenu.fileId); setContextMenu(null); }} icon={<X size={15} />}>Close Tab</MenuButton>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 12px', opacity: 0.3 }}></div>
                    <MenuButton onClick={() => { onCloseOthers(contextMenu.fileId); setContextMenu(null); }} icon={<Files size={15} />}>Close Others</MenuButton>
                    <MenuButton onClick={() => { onCloseRight(contextMenu.fileId); setContextMenu(null); }} icon={<ArrowRightFromLine size={15} />}>Close to the Right</MenuButton>
                    <MenuButton onClick={() => { onCloseLeft(contextMenu.fileId); setContextMenu(null); }} icon={<ArrowLeftFromLine size={15} />}>Close to the Left</MenuButton>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 12px', opacity: 0.3 }}></div>
                    <MenuButton isDanger onClick={() => { onCloseAll(); setContextMenu(null); }} icon={<Trash2 size={15} />}>Close All Tabs</MenuButton>
                </div>
            )}
        </>
    );
};

const MenuButton = ({ children, onClick, icon, isDanger }: any) => (
    <button
        onClick={onClick}
        className="btn-menu-item"
        style={{
            textAlign: 'left',
            padding: '10px 14px',
            fontSize: '13px',
            borderRadius: '10px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'transparent',
            border: 'none',
            color: isDanger ? 'var(--danger)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 600,
            outline: 'none'
        }}
    >
        <span style={{
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            color: isDanger ? 'var(--danger)' : 'var(--primary)'
        }}>
            {icon}
        </span>
        <span style={{ flex: 1 }}>{children}</span>

        <style>{`
            .btn-menu-item:hover {
                background: var(--bg-surface-hover) !important;
                color: var(--text-primary) !important;
                transform: translateX(4px);
            }
            .btn-menu-item:active {
                transform: translateX(2px);
                opacity: 0.7;
            }
        `}</style>
    </button>
);
