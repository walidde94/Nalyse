import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

import {
    Home,
    LayoutDashboard,
    Database,
    Briefcase,
    BrainCircuit,
    Map,
    Code2,
    BarChart3,
    Link2,
    ArrowRightLeft,
    Settings,
    FileCheck,
    PanelLeftClose,
    PanelLeftOpen,
    Sparkles,
    Network
} from 'lucide-react';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
    const [collapsed, setCollapsed] = useState(false);
    const { t } = useLanguage();

    const NAV_GROUPS = [
        {
            title: 'Data Analysis',
            items: [
                { id: 'dashboard', label: t('nav.workspace'), icon: <LayoutDashboard size={20} /> },
                { id: 'sources', label: 'Data Connectors', icon: <Database size={20} /> },
                { id: 'correlate', label: t('nav.correlation'), icon: <Link2 size={20} /> },
                { id: 'multi-analysis', label: 'Multi-Dataset Analysis', icon: <Network size={20} /> },
                { id: 'migration', label: 'Data Migration', icon: <ArrowRightLeft size={20} /> },
            ]
        },
        {
            title: 'Data Science',
            items: [
                { id: 'nexus', label: 'Nexus AI', icon: <BrainCircuit size={20} /> },
                { id: 'logistics', label: 'Road Intelligence', icon: <Map size={20} /> },
                { id: 'developer', label: 'Developer API', icon: <Code2 size={20} /> },
            ]
        },
        {
            title: 'Business Intelligence',
            items: [
                { id: 'bi', label: t('nav.bi'), icon: <BarChart3 size={20} /> },
                { id: 'projects', label: 'Strategic Board', icon: <Briefcase size={20} /> },
            ]
        },
        {
            title: 'Democratized Analytics',
            items: [
                { id: 'democracy', label: 'Self-Service Studio', icon: <Sparkles size={20} /> },
            ]
        },

    ];

    return (
        <aside
            className="glass-morphism inner-highlight sidebar-responsive"
            style={{
                width: collapsed ? '72px' : '260px',
                height: '100%',
                borderRight: '1px solid var(--border-default)',
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 20
            }}
        >
            <div className="desktop-only" style={{
                padding: '16px',
                display: 'flex',
                justifyContent: collapsed ? 'center' : 'flex-end',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="btn btn-icon btn-ghost btn-sm"
                    title={collapsed ? "Expand" : "Collapse"}
                >
                    {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
            </div>

            <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', overflowX: 'hidden' }}>
                {/* Landing/Home (Outside groups for prominence) */}
                <button
                    onClick={() => onViewChange('landing')}
                    className={`btn btn-ghost hover-lift ${currentView === 'landing' ? 'active-nav-item' : ''}`}
                    style={{
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: '12px',
                        gap: '16px',
                        background: currentView === 'landing' ? 'var(--primary-subtle)' : 'transparent',
                        color: currentView === 'landing' ? 'var(--primary)' : 'var(--text-secondary)',
                        width: '100%',
                        borderRadius: '12px',
                    }}
                >
                    <Home size={20} />
                    {!collapsed && <span className="sidebar-label" style={{ fontSize: '14px', fontWeight: currentView === 'landing' ? 700 : 600 }}>{t('nav.home')}</span>}
                </button>

                {NAV_GROUPS.map((group, gIdx) => (
                    <div key={gIdx} className="nav-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!collapsed && (
                            <div className="nav-group-title" style={{
                                padding: '0 12px 8px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--text-tertiary)',
                                opacity: 0.7
                            }}>
                                {group.title}
                            </div>
                        )}
                        {group.items.map((item) => {
                            const isActive = currentView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onViewChange(item.id)}
                                    className={`btn btn-ghost hover-lift ${isActive ? 'active-nav-item' : ''}`}
                                    style={{
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        padding: '12px',
                                        gap: '16px',
                                        background: isActive ? 'var(--primary-subtle)' : 'transparent',
                                        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                        width: '100%',
                                        position: 'relative',
                                        borderRadius: '12px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: isActive ? '1px solid var(--primary-glow)' : '1px solid transparent'
                                    }}
                                    title={collapsed ? item.label : ''}
                                >
                                    {isActive && (
                                        <div className="animate-breathe" style={{
                                            position: 'absolute',
                                            left: '0',
                                            top: '20%',
                                            bottom: '20%',
                                            width: '3px',
                                            background: 'var(--primary)',
                                            borderRadius: '0 4px 4px 0',
                                            boxShadow: '0 0 10px var(--primary-glow)'
                                        }} />
                                    )}
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                        transition: 'transform 0.2s'
                                    }}>
                                        {item.icon}
                                    </span>
                                    {!collapsed && (
                                        <span className="sidebar-label" style={{ fontSize: '14px', fontWeight: isActive ? 700 : 600, whiteSpace: 'nowrap' }}>
                                            {item.label}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}

                <div style={{ flex: 1 }}></div>

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 12px', opacity: 0.5 }}></div>

                {!collapsed && (
                    <div className="nav-group-title" style={{ padding: '0 12px 12px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
                        Preferences
                    </div>
                )}

                <button
                    onClick={() => onViewChange('settings')}
                    className={`btn btn-ghost ${currentView === 'settings' ? 'active-nav-item' : ''}`}
                    style={{
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: '12px',
                        gap: '16px',
                        color: currentView === 'settings' ? 'var(--primary)' : 'var(--text-secondary)',
                        width: '100%'
                    }}
                >
                    <Settings size={20} />
                    {!collapsed && <span className="sidebar-label" style={{ fontSize: '14px', fontWeight: 600 }}>{t('nav.settings')}</span>}
                </button>

                <button
                    onClick={() => window.open('/NALYSE_WORK_INSTRUCTIONS.html', '_blank')}
                    className="btn btn-ghost"
                    style={{
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: '12px',
                        gap: '16px',
                        color: 'var(--text-secondary)',
                        width: '100%'
                    }}
                    title={collapsed ? "Work Instructions" : ""}
                >
                    <span style={{ display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
                        <FileCheck size={20} />
                    </span>
                    {!collapsed && (
                        <span className="sidebar-label" style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            Work Instructions
                        </span>
                    )}
                </button>
            </nav>
        </aside>
    );
};
