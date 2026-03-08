import React, { useState, useRef, useEffect } from 'react';
import {
    LayoutDashboard, Settings, ArrowRightLeft, FileText,
    Database, Code2, Map, Users, X, Trash2,
    ArrowRightFromLine, ArrowLeftFromLine, Files, BarChart3, Bot, Sparkles, Network, GitCompareArrows, Activity, ShieldAlert, Landmark, FlaskConical, Building2, Webhook
} from 'lucide-react';

export interface TabType {
    id: string;
    title: string;
    type: 'dashboard' | 'analysis' | 'settings' | 'landing' | 'bi' | 'correlate' | 'migration' | 'nexus' | 'groups' | 'projects' | 'developer' | 'sources' | 'logistics' | 'agentic' | 'democracy' | 'multi-analysis' | 'diff' | 'anomaly' | 'financial' | 'simulation' | 'automation' | 'organization' | 'collaboration' | 'webhooks';
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
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const getTabIcon = (tab: TabType) => {
        if (tab.icon) return tab.icon;
        const iconMap: Record<string, React.ReactNode> = {
            'dashboard': <LayoutDashboard size={13} />,
            'analysis': <BarChart3 size={13} />,
            'settings': <Settings size={13} />,
            'migration': <ArrowRightLeft size={13} />,
            'developer': <Code2 size={13} />,
            'sources': <Database size={13} />,
            'logistics': <Map size={13} />,
            'groups': <Users size={13} />,
            'agentic': <Bot size={13} />,
            'democracy': <Sparkles size={13} />,
            'multi-analysis': <Network size={13} />,
            'diff': <GitCompareArrows size={13} />,
            'anomaly': <ShieldAlert size={13} />,
            'financial': <Landmark size={13} />,
            'simulation': <FlaskConical size={13} />,
            'organization': <Building2 size={13} />,
            'collaboration': <Users size={13} />,
            'webhooks': <Webhook size={13} />,

        };
        return iconMap[tab.type] || <FileText size={13} />;
    };

    return (
        <>
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '38px',
                padding: '0 12px',
                gap: '1px',
                userSelect: 'none',
                overflowX: 'auto',
                overflowY: 'hidden',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'relative',
                zIndex: 10,
            }}>
                {tabs.map((tab, idx) => {
                    const isActive = activeTabId === tab.id;
                    const isHovered = hoveredTab === tab.id;

                    return (
                        <div
                            key={tab.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e)}
                            onDrop={(e) => handleDrop(e, idx)}
                            onClick={() => onActivate(tab.id)}
                            onContextMenu={(e) => handleContextMenu(e, tab.id)}
                            onMouseEnter={() => setHoveredTab(tab.id)}
                            onMouseLeave={() => setHoveredTab(null)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px',
                                padding: '0 14px',
                                height: isActive ? '32px' : '30px',
                                color: isActive ? 'var(--text-primary)' : isHovered ? 'var(--text-secondary)' : 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                maxWidth: '200px',
                                minWidth: '100px',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                position: 'relative',
                                background: isActive ? 'var(--bg-main)' : isHovered ? 'var(--bg-surface)' : 'transparent',
                                borderRadius: '8px 8px 0 0',
                                borderTop: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                                borderLeft: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                                borderRight: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                                borderBottom: isActive ? '1px solid var(--bg-main)' : '1px solid transparent',
                                marginBottom: isActive ? '-1px' : '0',
                                opacity: draggedIdx === idx ? 0.4 : 1,
                                flexShrink: 0,
                            }}
                        >
                            {/* Active bottom glow */}
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '20%',
                                    right: '20%',
                                    height: '2px',
                                    background: 'var(--primary)',
                                    borderRadius: '0 0 4px 4px',
                                    boxShadow: '0 2px 8px var(--primary-glow)',
                                }} />
                            )}

                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                opacity: isActive ? 1 : 0.6,
                                color: isActive ? 'var(--primary)' : 'inherit',
                                transition: 'all 0.2s',
                            }}>
                                {getTabIcon(tab)}
                            </span>

                            <span style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1,
                                letterSpacing: '-0.01em',
                            }}>
                                {tab.title}
                            </span>

                            {tabs.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose(tab.id);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '2px',
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '4px',
                                        opacity: isActive || isHovered ? 0.7 : 0,
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'inherit',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                                        (e.target as HTMLElement).style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.target as HTMLElement).style.background = 'transparent';
                                        (e.target as HTMLElement).style.opacity = isActive ? '0.7' : '0';
                                    }}
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: contextMenu.y + 5,
                        left: contextMenu.x + 5,
                        zIndex: 2000,
                        padding: '6px',
                        minWidth: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1px',
                        background: 'var(--bg-elevated)',
                        backdropFilter: 'blur(24px) saturate(150%)',
                        border: '1px solid var(--border-default)',
                        boxShadow: '0 20px 48px -12px rgba(0,0,0,0.5)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <MenuButton onClick={() => { onClose(contextMenu.fileId); setContextMenu(null); }} icon={<X size={14} />}>Close Tab</MenuButton>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 10px', opacity: 0.3 }} />
                    <MenuButton onClick={() => { onCloseOthers(contextMenu.fileId); setContextMenu(null); }} icon={<Files size={14} />}>Close Others</MenuButton>
                    <MenuButton onClick={() => { onCloseRight(contextMenu.fileId); setContextMenu(null); }} icon={<ArrowRightFromLine size={14} />}>Close to the Right</MenuButton>
                    <MenuButton onClick={() => { onCloseLeft(contextMenu.fileId); setContextMenu(null); }} icon={<ArrowLeftFromLine size={14} />}>Close to the Left</MenuButton>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 10px', opacity: 0.3 }} />
                    <MenuButton isDanger onClick={() => { onCloseAll(); setContextMenu(null); }} icon={<Trash2 size={14} />}>Close All Tabs</MenuButton>
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
            padding: '9px 12px',
            fontSize: '12.5px',
            borderRadius: '8px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'transparent',
            border: 'none',
            color: isDanger ? 'var(--danger)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            fontWeight: 600,
            fontFamily: 'var(--font-main)',
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
                transform: translateX(2px);
            }
            .btn-menu-item:active {
                transform: translateX(1px);
                opacity: 0.7;
            }
        `}</style>
    </button>
);
