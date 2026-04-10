import React, { useState, memo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

import {
    Home,
    TrendingUp,
    BrainCircuit,
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
    Layers
} from 'lucide-react';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: any) => void;
}

/** Chromatic identity per sector — “neural lanes” through the command rail */
const SECTOR_THEMES = [
    { accent: '#6366f1', glow: 'rgba(99, 102, 241, 0.45)', name: 'Engine' },
    { accent: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.45)', name: 'Studio' },
    { accent: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', name: 'Predict' },
    { accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)', name: 'Intel' },
    { accent: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', name: 'Service' },
] as const;

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
                { id: 'simulation', label: 'Simulation Engine', icon: <FlaskConical size={18} strokeWidth={2} /> },
            ]
        },
        {
            title: 'Analytics Studio',
            items: [
                { id: 'dashboard', label: t('nav.workspace'), icon: <LayoutDashboard size={18} strokeWidth={2} /> },
                { id: 'lens', label: 'Smart Lens', icon: <Sparkles size={18} strokeWidth={2} /> },
                { id: 'correlate', label: t('nav.correlation'), icon: <Link2 size={18} strokeWidth={2} /> },
                { id: 'diff', label: 'Version Diff', icon: <GitCompareArrows size={18} strokeWidth={2} /> },
                { id: 'anomaly', label: 'Anomaly Detection', icon: <ShieldAlert size={18} strokeWidth={2} /> },
                { id: 'financial', label: 'Financial Risk', icon: <Landmark size={18} strokeWidth={2} /> },
            ]
        },
        {
            title: 'Predictive Models',
            items: [
                { id: 'forecast', label: 'Forecasting Engine', icon: <TrendingUp size={18} strokeWidth={2} /> },
                { id: 'spatial', label: 'Geospatial Intelligence', icon: <Map size={18} strokeWidth={2} /> },
                { id: 'automl', label: 'AutoML Intelligence', icon: <BrainCircuit size={18} strokeWidth={2} /> },
                { id: 'developer', label: 'Developer API', icon: <Code2 size={18} strokeWidth={2} /> },
                { id: 'webhooks', label: 'Webhooks & API', icon: <Webhook size={18} strokeWidth={2} /> },
                { id: 'embed', label: 'Embed SDK', icon: <Boxes size={18} strokeWidth={2} /> },
            ]
        },
        {
            title: 'Business Intelligence',
            items: [
                { id: 'canvas', label: 'Dashboard Canvas', icon: <Layers size={18} strokeWidth={2} /> },
                { id: 'bi', label: t('nav.bi'), icon: <BarChart3 size={18} strokeWidth={2} /> },
                { id: 'projects', label: 'Strategic Board', icon: <Briefcase size={18} strokeWidth={2} /> },
            ]
        },
        {
            title: 'Self-Service',
            items: [
                { id: 'democracy', label: 'Self-Service Studio', icon: <Sparkles size={18} strokeWidth={2} /> },
                { id: 'automation', label: 'Automated Reports', icon: <Activity size={18} strokeWidth={2} /> },
                { id: 'collaboration', label: 'Collaboration', icon: <MessageSquare size={18} strokeWidth={2} /> },
            ]
        },
    ];

    const expandedWidth = 280;
    const collapsedWidth = 76;

    return (
        <aside
            className={`sidebar-responsive sidebar-neural-rail ${collapsed ? 'sidebar-neural-rail--collapsed' : ''} ${isPro ? 'pro-sidebar-glow' : ''}`}
            style={{
                width: collapsed ? collapsedWidth : expandedWidth,
                height: '100%',
                transition: 'width 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 20,
                position: 'relative',
                backdropFilter: 'blur(10px) saturate(1.1)',
                WebkitBackdropFilter: 'blur(10px) saturate(1.1)',
                overflowX: 'visible',
                overflowY: 'hidden',
            }}
        >
            {isPro && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '280px',
                        background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '220px',
                        background: 'linear-gradient(0deg, rgba(217,70,239,0.06) 0%, transparent 100%)',
                    }} />
                </div>
            )}

            {/* Animated vertical “signal spine” */}
            <div className="sidebar-neural-spine" aria-hidden>
                <div className="sidebar-neural-spine__core" />
                <div className="sidebar-neural-spine__packet" />
            </div>

            {/* Brand + collapse */}
            <div className="sidebar-neural-brand">
                {!collapsed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div className="sidebar-neural-mark">
                            N
                        </div>
                        <div className="sidebar-neural-title-stack">
                            <span className="sidebar-neural-title">Nalyse</span>
                            <span className="sidebar-neural-tag">Neural Command Rail</span>
                        </div>
                    </div>
                ) : (
                    <div className="sidebar-neural-mark" style={{ margin: '0 auto' }}>
                        N
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                    className="desktop-only btn btn-icon btn-ghost btn-sm"
                    title={collapsed ? 'Expand rail' : 'Collapse rail'}
                    style={{
                        borderRadius: 10,
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            <nav
                className="custom-scrollbar sidebar-neural-nav-scroll"
                style={{
                    padding: '8px 10px 12px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                <NavItem
                    id="landing"
                    label={t('nav.home')}
                    icon={<Home size={18} strokeWidth={2} />}
                    isActive={currentView === 'landing'}
                    collapsed={collapsed}
                    hovered={hoveredItem === 'landing'}
                    sectorAccent="#94a3b8"
                    sectorGlow="rgba(148, 163, 184, 0.35)"
                    onHover={setHoveredItem}
                    onClick={() => onViewChange('landing')}
                />

                {NAV_GROUPS.map((group, gIdx) => {
                    const theme = SECTOR_THEMES[gIdx] ?? SECTOR_THEMES[0];
                    return (
                        <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <SectorHeader title={group.title} theme={theme} collapsed={collapsed} />
                            {group.items.map((item) => (
                                <NavItem
                                    key={item.id}
                                    id={item.id}
                                    label={item.label}
                                    icon={item.icon}
                                    isActive={currentView === item.id}
                                    collapsed={collapsed}
                                    hovered={hoveredItem === item.id}
                                    sectorAccent={theme.accent}
                                    sectorGlow={theme.glow}
                                    onHover={setHoveredItem}
                                    onClick={() => onViewChange(item.id)}
                                />
                            ))}
                        </div>
                    );
                })}

                <div style={{ flex: 1, minHeight: 8 }} />

                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--border-subtle), transparent)', margin: '8px 8px', opacity: 0.5 }} />

                {!collapsed && (
                    <div className="sidebar-sector-header" style={{ paddingTop: 4 }}>
                        <span className="sidebar-sector-node" style={{ color: '#64748b' }} />
                        <span className="sidebar-sector-line" style={{ background: 'linear-gradient(90deg, #64748b, transparent)' }} />
                        <span className="sidebar-sector-title" style={{ color: 'var(--text-muted)' }}>Data & Settings</span>
                    </div>
                )}
                {collapsed && <div className="sidebar-sector-rung" style={{ background: '#64748b' }} />}

                <NavItem id="sources" label="Data Connectors" icon={<Database size={18} strokeWidth={2} />}
                    isActive={currentView === 'sources'} collapsed={collapsed}
                    hovered={hoveredItem === 'sources'} sectorAccent="#38bdf8" sectorGlow="rgba(56, 189, 248, 0.35)"
                    onHover={setHoveredItem} onClick={() => onViewChange('sources')} />

                <NavItem id="migration" label="Data Migration" icon={<ArrowRightLeft size={18} strokeWidth={2} />}
                    isActive={currentView === 'migration'} collapsed={collapsed}
                    hovered={hoveredItem === 'migration'} sectorAccent="#a78bfa" sectorGlow="rgba(167, 139, 250, 0.35)"
                    onHover={setHoveredItem} onClick={() => onViewChange('migration')} />

                <NavItem id="organization" label="Organization & RBAC" icon={<Building2 size={18} strokeWidth={2} />}
                    isActive={currentView === 'organization'} collapsed={collapsed}
                    hovered={hoveredItem === 'organization'} sectorAccent="#f472b6" sectorGlow="rgba(244, 114, 182, 0.35)"
                    onHover={setHoveredItem} onClick={() => onViewChange('organization')} />

                <NavItem id="settings" label={t('nav.settings')} icon={<Settings size={18} strokeWidth={2} />}
                    isActive={currentView === 'settings'} collapsed={collapsed}
                    hovered={hoveredItem === 'settings'} sectorAccent="#94a3b8" sectorGlow="rgba(148, 163, 184, 0.35)"
                    onHover={setHoveredItem} onClick={() => onViewChange('settings')} />

                <NavItem id="docs" label="Work Instructions" icon={<FileCheck size={18} strokeWidth={2} />}
                    isActive={false} collapsed={collapsed}
                    hovered={hoveredItem === 'docs'} sectorAccent="#64748b" sectorGlow="rgba(100, 116, 139, 0.25)"
                    onHover={setHoveredItem}
                    onClick={() => window.open('/NALYSE_WORK_INSTRUCTIONS.html', '_blank')} />
            </nav>

            {!collapsed && (
                <div className="sidebar-presence-strip">
                    <span className="sidebar-presence-dot" />
                    <span>Live mesh · Synced</span>
                </div>
            )}

            {!isPro && (
                <div style={{ padding: '10px 12px 14px', position: 'relative', zIndex: 2 }}>
                    <div
                        className="sidebar-upgrade-holo"
                        style={{ cursor: 'pointer', padding: collapsed ? 12 : 16 }}
                        onClick={() => onViewChange({ id: 'settings', data: { initialTab: 'subscription' } })}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onViewChange({ id: 'settings', data: { initialTab: 'subscription' } });
                            }
                        }}
                    >
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            {!collapsed ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Sparkles size={14} className="text-[var(--primary)]" />
                                        <span style={{
                                            fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase',
                                            color: 'var(--primary)',
                                        }}>Neural Pro</span>
                                    </div>
                                    <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-heading)' }}>
                                        Unlock full stack
                                    </h4>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                                        50GB storage & unlimited datasets
                                    </p>
                                    <button
                                        type="button"
                                        style={{
                                            width: '100%', marginTop: 12, padding: '8px 12px',
                                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                            color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer',
                                            fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                                            boxShadow: '0 6px 20px var(--primary-glow)',
                                        }}
                                    >
                                        Upgrade now
                                    </button>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
                                    <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

function SectorHeader({
    title,
    theme,
    collapsed,
}: {
    title: string;
    theme: (typeof SECTOR_THEMES)[number];
    collapsed: boolean;
}) {
    if (collapsed) {
        return <div className="sidebar-sector-rung" style={{ background: theme.accent }} />;
    }
    return (
        <div className="sidebar-sector-header" style={{ color: theme.accent }}>
            <span className="sidebar-sector-node" style={{ color: theme.accent, boxShadow: `0 0 10px ${theme.glow}` }} />
            <span
                className="sidebar-sector-line"
                style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }}
            />
            <span className="sidebar-sector-title">{title}</span>
        </div>
    );
}

interface NavItemProps {
    id: string;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    collapsed: boolean;
    hovered: boolean;
    sectorAccent: string;
    sectorGlow: string;
    onHover: (id: string | null) => void;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = memo(function NavItem({
    id,
    label,
    icon,
    isActive,
    collapsed,
    hovered,
    sectorAccent,
    sectorGlow,
    onHover,
    onClick,
}) {
    return (
        <div className="sidebar-nav-rail-wrap" style={{ position: 'relative' }}>
            <div
                className="sidebar-nav-rail-item__glow"
                style={{ ['--item-glow' as string]: sectorGlow } as React.CSSProperties}
            />
            <button
                type="button"
                onClick={onClick}
                onMouseEnter={() => onHover(id)}
                onMouseLeave={() => onHover(null)}
                className={`sidebar-nav-rail-item ${isActive ? 'sidebar-nav-rail-item--active' : ''}`}
                title={collapsed ? label : undefined}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '11px 10px' : '10px 12px',
                    gap: 12,
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 12,
                    position: 'relative',
                    fontFamily: 'var(--font-main)',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    background: isActive
                        ? `linear-gradient(105deg, ${sectorAccent}18 0%, rgba(0,0,0,0.15) 55%, transparent 100%)`
                        : hovered
                            ? 'rgba(255,255,255,0.04)'
                            : 'transparent',
                    color: isActive ? sectorAccent : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: isActive
                        ? `inset 0 0 0 1px ${sectorAccent}35, 0 4px 24px -8px ${sectorGlow}`
                        : 'none',
                }}
            >
                <span
                    className="sidebar-nav-rail-item__pip"
                    style={{
                        background: sectorAccent,
                        boxShadow: `0 0 12px ${sectorGlow}`,
                    }}
                    aria-hidden
                />

                <span
                    className="sidebar-nav-rail-item__icon-wrap"
                    style={{
                        width: collapsed ? undefined : 34,
                        height: collapsed ? undefined : 34,
                        background: isActive ? `${sectorAccent}22` : 'transparent',
                        boxShadow: isActive ? `0 0 20px -4px ${sectorGlow}` : 'none',
                    }}
                >
                    {icon}
                </span>

                {!collapsed && (
                    <>
                        <span
                            className="sidebar-label"
                            style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1,
                                textAlign: 'left',
                            }}
                        >
                            {label}
                        </span>
                        {!isActive && (
                            <span className="sidebar-nav-rail-item__chevron" aria-hidden>
                                <ChevronRight size={14} />
                            </span>
                        )}
                    </>
                )}
            </button>

            {collapsed && (
                <div
                    className={`sidebar-nav-rail-tooltip${hovered ? ' sidebar-nav-rail-tooltip--open' : ''}`}
                >
                    {label}
                </div>
            )}
        </div>
    );
});
