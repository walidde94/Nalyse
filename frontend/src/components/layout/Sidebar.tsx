import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import {
    Home,
    LayoutDashboard,
    Database,
    Briefcase,

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
    Network,
    GitCompareArrows,
    ChevronRight,
    Activity,
    ShieldAlert,
    Landmark,
    FlaskConical,
    Building2,
    MessageSquare,
    Webhook,
    Boxes,
    Layers,
    Bell
} from 'lucide-react';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const { t } = useLanguage();
    const { user } = useAuth();
    const isPro = user && ((user as any)?.organization?.plan === 'pro' || (user as any)?.plan === 'pro');

    const NAV_GROUPS = [
        {
            title: 'Decision Engine',
            items: [
                { id: 'simulation', label: 'Simulation Engine', icon: <FlaskConical size={19} /> },
            ]
        },
        {
            title: 'Analytics Studio',
            items: [
                { id: 'dashboard', label: t('nav.workspace'), icon: <LayoutDashboard size={19} /> },
                { id: 'lens', label: 'Smart Lens', icon: <Sparkles size={19} /> },
                { id: 'correlate', label: t('nav.correlation'), icon: <Link2 size={19} /> },
                { id: 'diff', label: 'Version Diff', icon: <GitCompareArrows size={19} /> },
                { id: 'anomaly', label: 'Anomaly Detection', icon: <ShieldAlert size={19} /> },
                { id: 'financial', label: 'Financial Risk', icon: <Landmark size={19} /> },
            ]
        },
        {
            title: 'Predictive Models',
            items: [

                { id: 'logistics', label: 'Road Intelligence', icon: <Map size={19} /> },
                { id: 'developer', label: 'Developer API', icon: <Code2 size={19} /> },
                { id: 'webhooks', label: 'Webhooks & API', icon: <Webhook size={19} /> },
                { id: 'embed', label: 'Embed SDK', icon: <Boxes size={19} /> },
            ]
        },
        {
            title: 'Business Intelligence',
            items: [
                { id: 'canvas', label: 'Dashboard Canvas', icon: <Layers size={19} /> },
                { id: 'bi', label: t('nav.bi'), icon: <BarChart3 size={19} /> },
                { id: 'projects', label: 'Strategic Board', icon: <Briefcase size={19} /> },
            ]
        },
        {
            title: 'Self-Service',
            items: [
                { id: 'democracy', label: 'Self-Service Studio', icon: <Sparkles size={19} /> },
                { id: 'automation', label: 'Automated Reports', icon: <Activity size={19} /> },
                { id: 'collaboration', label: 'Collaboration', icon: <MessageSquare size={19} /> },
            ]
        },
    ];

    return (
        <aside
            className={`sidebar-responsive ${isPro ? 'pro-sidebar-glow' : ''}`}
            style={{
                width: collapsed ? '72px' : '256px',
                height: '100%',
                borderRight: '1px solid var(--glass-border)',
                transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 20,
                position: 'relative',
                background: 'var(--bg-sidebar)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                overflow: 'hidden',
            }}
        >
            {/* Subtle aurora background for Pro */}
            {isPro && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '300px',
                        background: 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, transparent 100%)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '200px',
                        background: 'linear-gradient(0deg, rgba(217,70,239,0.06) 0%, transparent 100%)',
                    }} />
                </div>
            )}

            {/* Collapse Button */}
            <div className="desktop-only" style={{
                padding: '12px 14px',
                display: 'flex',
                justifyContent: collapsed ? 'center' : 'flex-end',
                borderBottom: '1px solid var(--border-subtle)',
            }}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="btn btn-icon btn-ghost btn-sm"
                    title={collapsed ? "Expand" : "Collapse"}
                    style={{
                        borderRadius: '8px',
                        width: '30px',
                        height: '30px',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav style={{
                padding: '12px 10px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflowY: 'auto',
                overflowX: 'hidden',
            }}>
                {/* Home Button */}
                <NavItem
                    id="landing"
                    label={t('nav.home')}
                    icon={<Home size={19} />}
                    isActive={currentView === 'landing'}
                    collapsed={collapsed}
                    hovered={hoveredItem === 'landing'}
                    onHover={setHoveredItem}
                    onClick={() => onViewChange('landing')}
                />

                {NAV_GROUPS.map((group, gIdx) => (
                    <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {!collapsed && (
                            <div className="nav-group-title" style={{
                                padding: '4px 12px 8px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                color: 'var(--text-muted)',
                                opacity: 0.6,
                            }}>
                                {group.title}
                            </div>
                        )}
                        {group.items.map((item) => (
                            <NavItem
                                key={item.id}
                                id={item.id}
                                label={item.label}
                                icon={item.icon}
                                isActive={currentView === item.id}
                                collapsed={collapsed}
                                hovered={hoveredItem === item.id}
                                onHover={setHoveredItem}
                                onClick={() => onViewChange(item.id)}
                            />
                        ))}
                    </div>
                ))}

                <div style={{ flex: 1 }} />

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 10px', opacity: 0.3 }} />

                {!collapsed && (
                    <div className="nav-group-title" style={{
                        padding: '4px 12px 8px', fontSize: '10px', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)',
                        opacity: 0.6,
                    }}>
                        Data & Settings
                    </div>
                )}

                <NavItem id="sources" label="Data Connectors" icon={<Database size={19} />}
                    isActive={currentView === 'sources'} collapsed={collapsed}
                    hovered={hoveredItem === 'sources'} onHover={setHoveredItem}
                    onClick={() => onViewChange('sources')} />

                <NavItem id="migration" label="Data Migration" icon={<ArrowRightLeft size={19} />}
                    isActive={currentView === 'migration'} collapsed={collapsed}
                    hovered={hoveredItem === 'migration'} onHover={setHoveredItem}
                    onClick={() => onViewChange('migration')} />

                <NavItem id="organization" label="Organization & RBAC" icon={<Building2 size={19} />}
                    isActive={currentView === 'organization'} collapsed={collapsed}
                    hovered={hoveredItem === 'organization'} onHover={setHoveredItem}
                    onClick={() => onViewChange('organization')} />

                <NavItem id="settings" label={t('nav.settings')} icon={<Settings size={19} />}
                    isActive={currentView === 'settings'} collapsed={collapsed}
                    hovered={hoveredItem === 'settings'} onHover={setHoveredItem}
                    onClick={() => onViewChange('settings')} />

                <NavItem id="docs" label="Work Instructions" icon={<FileCheck size={19} />}
                    isActive={false} collapsed={collapsed}
                    hovered={hoveredItem === 'docs'} onHover={setHoveredItem}
                    onClick={() => window.open('/NALYSE_WORK_INSTRUCTIONS.html', '_blank')} />
            </nav>

            {/* Upgrade Card */}
            {!isPro && (
                <div style={{ padding: '12px' }}>
                    <motion.div
                        whileHover={{ y: -3, scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        style={{
                            position: 'relative',
                            overflow: 'hidden',
                            padding: collapsed ? '12px' : '16px',
                            borderRadius: '14px',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08))',
                            cursor: 'pointer',
                            animation: 'border-glow-pulse 4s infinite ease-in-out',
                        }}
                        onClick={() => onViewChange({ id: 'settings', data: { initialTab: 'subscription' } })}
                    >
                        {/* Decorative gradient */}
                        <div style={{
                            position: 'absolute', top: '-20px', right: '-20px',
                            width: '80px', height: '80px',
                            background: 'radial-gradient(circle, var(--primary-glow), transparent)',
                            opacity: 0.3, pointerEvents: 'none',
                        }} />

                        {!collapsed ? (
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px',
                                }}>
                                    <div style={{
                                        width: '5px', height: '5px', borderRadius: '50%',
                                        background: 'var(--primary)', animation: 'glow-pulse 2s infinite',
                                    }} />
                                    <span style={{
                                        fontSize: '9px', fontWeight: 900, textTransform: 'uppercase',
                                        letterSpacing: '0.15em', color: 'var(--primary)',
                                    }}>Upgrade</span>
                                </div>
                                <h4 style={{
                                    fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)',
                                    lineHeight: 1.3, marginBottom: '4px',
                                }}>Unlock Neural Pro</h4>
                                <p style={{
                                    fontSize: '11px', color: 'var(--text-muted)',
                                    fontWeight: 500, lineHeight: 1.4,
                                }}>50GB storage & unlimited datasets</p>
                                <button style={{
                                    width: '100%', marginTop: '10px', padding: '7px',
                                    background: 'var(--primary)',
                                    color: 'white', border: 'none',
                                    fontSize: '10px', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    borderRadius: '8px', cursor: 'pointer',
                                    boxShadow: '0 4px 12px var(--primary-glow)',
                                    transition: 'all 0.25s',
                                }}>
                                    <span className="shimmer-text">Upgrade Now</span>
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </aside>
    );
};

/* ===========================================
   NavItem — Reusable Navigation Button
   =========================================== */

interface NavItemProps {
    id: string;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    collapsed: boolean;
    hovered: boolean;
    onHover: (id: string | null) => void;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, label, icon, isActive, collapsed, hovered, onHover, onClick }) => {
    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={onClick}
                onMouseEnter={() => onHover(id)}
                onMouseLeave={() => onHover(null)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px' : '9px 12px',
                    gap: '12px',
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    position: 'relative',
                    fontFamily: 'var(--font-main)',
                    fontSize: '13.5px',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: isActive
                        ? 'linear-gradient(135deg, var(--primary-subtle), rgba(139, 92, 246, 0.06))'
                        : hovered
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'transparent',
                    color: isActive ? 'var(--primary)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 0 0 1px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.03)' : 'none',
                }}
                title={collapsed ? label : ''}
            >
                {/* Active indicator line */}
                {isActive && (
                    <div style={{
                        position: 'absolute',
                        left: '0',
                        top: '25%',
                        bottom: '25%',
                        width: '3px',
                        background: 'var(--primary)',
                        borderRadius: '0 4px 4px 0',
                        boxShadow: '0 0 12px var(--primary-glow)',
                        animation: 'glow-pulse 2.5s infinite ease-in-out',
                    }} />
                )}

                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isActive ? 'scale(1.08)' : hovered ? 'scale(1.04)' : 'scale(1)',
                }}>
                    {icon}
                </span>

                {!collapsed && (
                    <span className="sidebar-label" style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {label}
                    </span>
                )}

                {/* Hover arrow indicator */}
                {!collapsed && hovered && !isActive && (
                    <ChevronRight size={14} style={{
                        marginLeft: 'auto',
                        opacity: 0.4,
                        transition: 'opacity 0.2s',
                    }} />
                )}
            </button>

            {/* Tooltip for collapsed mode */}
            {collapsed && hovered && (
                <div style={{
                    position: 'absolute',
                    left: 'calc(100% + 8px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '6px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.4)',
                    animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: 'none',
                }}>
                    {label}
                    <div style={{
                        position: 'absolute',
                        left: '-4px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(45deg)',
                        width: '8px',
                        height: '8px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderTop: 'none',
                        borderRight: 'none',
                    }} />
                </div>
            )}
        </div>
    );
};
