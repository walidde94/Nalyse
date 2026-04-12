import React, { useState, useRef, useEffect } from 'react';
import { loadLayoutPreferences, LAYOUT_PREFS_EVENT, getTabBarMetrics, type TabBarDensity } from '../../preferences/layoutPreferences';
import {
    LayoutDashboard, Settings, ArrowRightLeft, FileText,
    Database, Code2, Map, Users, X, Trash2, Layers, Bell,
    ArrowRightFromLine, ArrowLeftFromLine, Files, BarChart3, Bot, Sparkles, Network, GitCompareArrows, Activity, ShieldAlert, Landmark, FlaskConical, Building2, Webhook, Boxes
} from 'lucide-react';

export interface TabType {
    id: string;
    title: string;
    type: 'dashboard' | 'analysis' | 'settings' | 'landing' | 'bi' | 'correlate' | 'migration' | 'nexus' | 'groups' | 'projects' | 'developer' | 'sources' | 'logistics' | 'agentic' | 'democracy' | 'multi-analysis' | 'diff' | 'anomaly' | 'financial' | 'simulation' | 'forecast' | 'spatial' | 'automl' | 'automation' | 'organization' | 'collaboration' | 'webhooks' | 'embed' | 'canvas' | 'lens';
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

    const iconSize = 12;

    const getTabIcon = (tab: TabType) => {
        if (tab.icon) return tab.icon;
        const s = iconSize;
        const iconMap: Record<string, React.ReactNode> = {
            'dashboard': <LayoutDashboard size={s} />,
            'analysis': <BarChart3 size={s} />,
            'settings': <Settings size={s} />,
            'migration': <ArrowRightLeft size={s} />,
            'developer': <Code2 size={s} />,
            'sources': <Database size={s} />,
            'logistics': <Map size={s} />,
            'groups': <Users size={s} />,
            'agentic': <Bot size={s} />,
            'democracy': <Sparkles size={s} />,
            'multi-analysis': <Network size={s} />,
            'diff': <GitCompareArrows size={s} />,
            'anomaly': <ShieldAlert size={s} />,
            'financial': <Landmark size={s} />,
            'simulation': <FlaskConical size={s} />,
            'organization': <Building2 size={s} />,
            'collaboration': <Users size={s} />,
            'webhooks': <Webhook size={s} />,
            'embed': <Boxes size={s} />,
            'canvas': <Layers size={s} />,
            'lens': <Sparkles size={s} />,
        };
        return iconMap[tab.type] || <FileText size={s} />;
    };

    // Don't show tab bar if only 1 tab
    if (tabs.length <= 1) return null;

    return (
        <>
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '32px',
                padding: '0 8px',
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
                                gap: '5px',
                                padding: '0 10px',
                                height: isActive ? '28px' : '26px',
                                color: isActive ? 'var(--text-primary)' : isHovered ? 'var(--text-secondary)' : 'var(--text-muted)',
                                fontSize: '11.5px',
                                fontWeight: isActive ? 600 : 500,
                                cursor: 'pointer',
                                maxWidth: '180px',
                                minWidth: '80px',
                                transition: 'all 0.15s ease',
                                position: 'relative',
                                background: isActive ? 'var(--bg-main)' : isHovered ? 'var(--bg-surface)' : 'transparent',
                                borderRadius: '6px 6px 0 0',
                                borderTop: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                                borderLeft: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                                borderRight: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                                borderBottom: isActive ? '1px solid var(--bg-main)' : '1px solid transparent',
                                marginBottom: isActive ? '-1px' : '0',
                                opacity: draggedIdx === idx ? 0.4 : 1,
                                flexShrink: 0,
                            }}
                        >
                            {/* Active top accent */}
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '25%',
                                    right: '25%',
                                    height: '1.5px',
                                    background: 'var(--primary)',
                                    borderRadius: '0 0 3px 3px',
                                }} />
                            )}

                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                opacity: isActive ? 0.9 : 0.5,
                                color: isActive ? 'var(--primary)' : 'inherit',
                                transition: 'all 0.15s',
                                flexShrink: 0,
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
                                        padding: '1px',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '3px',
                                        opacity: isActive || isHovered ? 0.5 : 0,
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'inherit',
                                        cursor: 'pointer',
                                        transition: 'all 0.1s',
                                        flexShrink: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                                        (e.target as HTMLElement).style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.target as HTMLElement).style.background = 'transparent';
                                        (e.target as HTMLElement).style.opacity = isActive ? '0.5' : '0';
                                    }}
                                >
                                    <X size={9} />
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
                        padding: '4px',
                        minWidth: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1px',
                        background: 'var(--bg-elevated)',
                        backdropFilter: 'blur(24px) saturate(150%)',
                        border: '1px solid var(--border-default)',
                        boxShadow: '0 16px 40px -12px rgba(0,0,0,0.4)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.12s ease',
                    }}
                >
                    <MenuButton onClick={() => { onClose(contextMenu.fileId); setContextMenu(null); }} icon={<X size={13} />}>Close Tab</MenuButton>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 8px', opacity: 0.3 }} />
                    <MenuButton onClick={() => { onCloseOthers(contextMenu.fileId); setContextMenu(null); }} icon={<Files size={13} />}>Close Others</MenuButton>
                    <MenuButton onClick={() => { onCloseRight(contextMenu.fileId); setContextMenu(null); }} icon={<ArrowRightFromLine size={13} />}>Close to the Right</MenuButton>
                    <MenuButton onClick={() => { onCloseLeft(contextMenu.fileId); setContextMenu(null); }} icon={<ArrowLeftFromLine size={13} />}>Close to the Left</MenuButton>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 8px', opacity: 0.3 }} />
                    <MenuButton isDanger onClick={() => { onCloseAll(); setContextMenu(null); }} icon={<Trash2 size={13} />}>Close All Tabs</MenuButton>
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
            padding: '7px 10px',
            fontSize: '12px',
            borderRadius: '6px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: isDanger ? 'var(--danger)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontWeight: 600,
            fontFamily: 'var(--font-main)',
            outline: 'none'
        }}
    >
        <span style={{
            opacity: 0.7,
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
            }
            .btn-menu-item:active {
                opacity: 0.7;
            }
        `}</style>
    </button>
);
