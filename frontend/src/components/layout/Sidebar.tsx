import React, { useState, useEffect, memo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
    loadLayoutPreferences,
    saveLayoutPreferences,
    LAYOUT_PREFS_EVENT,
    DEFAULT_GROUP_ORDER,
    DEFAULT_ITEMS,
    GROUP_TITLES,
    getInitialSidebarCollapsed,
    type SidebarGroupKey,
} from '../../preferences/layoutPreferences';

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

const GROUP_THEME_INDEX: Record<SidebarGroupKey, number> = {
    decision: 0,
    analytics: 1,
    predictive: 2,
    bi: 3,
    selfservice: 4,
};

const NAV_ICONS: Record<string, React.ReactNode> = {
    simulation: <FlaskConical size={18} strokeWidth={2} />,
    dashboard: <LayoutDashboard size={18} strokeWidth={2} />,
    lens: <Sparkles size={18} strokeWidth={2} />,
    correlate: <Link2 size={18} strokeWidth={2} />,
    diff: <GitCompareArrows size={18} strokeWidth={2} />,
    anomaly: <ShieldAlert size={18} strokeWidth={2} />,
    financial: <Landmark size={18} strokeWidth={2} />,
    forecast: <TrendingUp size={18} strokeWidth={2} />,
    spatial: <Map size={18} strokeWidth={2} />,
    automl: <BrainCircuit size={18} strokeWidth={2} />,
    developer: <Code2 size={18} strokeWidth={2} />,
    webhooks: <Webhook size={18} strokeWidth={2} />,
    embed: <Boxes size={18} strokeWidth={2} />,
    canvas: <Layers size={18} strokeWidth={2} />,
    bi: <BarChart3 size={18} strokeWidth={2} />,
    projects: <Briefcase size={18} strokeWidth={2} />,
    democracy: <Sparkles size={18} strokeWidth={2} />,
    automation: <Activity size={18} strokeWidth={2} />,
    collaboration: <MessageSquare size={18} strokeWidth={2} />,
    sources: <Database size={18} strokeWidth={2} />,
    migration: <ArrowRightLeft size={18} strokeWidth={2} />,
    organization: <Building2 size={18} strokeWidth={2} />,
    settings: <Settings size={18} strokeWidth={2} />,
    docs: <FileCheck size={18} strokeWidth={2} />,
};

function sidebarNavLabel(id: string, t: (key: string) => string): string {
    const keyMap: Record<string, string> = {
        dashboard: 'nav.workspace',
        correlate: 'nav.correlation',
        bi: 'nav.bi',
        settings: 'nav.settings',
    };
    const tr = keyMap[id];
    if (tr) {
        const v = t(tr);
        if (v && v !== tr) return v;
    }
    const fallbacks: Record<string, string> = {
        simulation: 'Simulation Engine',
        lens: 'Smart Lens',
        diff: 'Version Diff',
        anomaly: 'Anomaly Detection',
        financial: 'Financial Risk',
        forecast: 'Forecasting Engine',
        spatial: 'Geospatial Intelligence',
        automl: 'AutoML Intelligence',
        developer: 'Developer API',
        webhooks: 'Webhooks & API',
        embed: 'Embed SDK',
        canvas: 'Dashboard Canvas',
        projects: 'Strategic Board',
        democracy: 'Self-Service Studio',
        automation: 'Automated Reports',
        collaboration: 'Collaboration',
        sources: 'Data Connectors',
        migration: 'Data Migration',
        organization: 'Organization & RBAC',
        docs: 'Work Instructions',
    };
    return fallbacks[id] || id;
}

function orderedGroupItemIds(group: SidebarGroupKey, prefs: ReturnType<typeof loadLayoutPreferences>): string[] {
    const defaults = [...DEFAULT_ITEMS[group]];
    const raw = prefs.itemOrder[group];
    const order = raw?.length ? [...raw] : defaults;
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of order) {
        if (defaults.includes(id) && !seen.has(id)) {
            seen.add(id);
            out.push(id);
        }
    }
    for (const id of defaults) {
        if (!seen.has(id)) out.push(id);
    }
    return out.filter((id) => !prefs.hiddenNavIds.includes(id));
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
    const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);
    const [prefs, setPrefs] = useState(loadLayoutPreferences);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const { t } = useLanguage();
    const { user } = useAuth();
    const isPro = user && ((user as any)?.organization?.plan === 'pro' || (user as any)?.plan === 'pro');

    useEffect(() => {
        const sync = () => {
            const p = loadLayoutPreferences();
            setPrefs(p);
            setCollapsed(p.sidebarCollapsedDefault);
        };
        window.addEventListener(LAYOUT_PREFS_EVENT, sync);
        return () => window.removeEventListener(LAYOUT_PREFS_EVENT, sync);
    }, []);

    const persistCollapsed = (next: boolean) => {
        setCollapsed(next);
        const p = loadLayoutPreferences();
        saveLayoutPreferences({ ...p, sidebarCollapsedDefault: next });
    };

    const groupKeys = prefs.groupOrder.filter((g): g is SidebarGroupKey =>
        (DEFAULT_GROUP_ORDER as readonly string[]).includes(g)
    );

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
                    onClick={() => persistCollapsed(!collapsed)}
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

                {groupKeys.map((groupKey) => {
                    const themeIdx = GROUP_THEME_INDEX[groupKey];
                    const theme = SECTOR_THEMES[themeIdx] ?? SECTOR_THEMES[0];
                    const itemIds = orderedGroupItemIds(groupKey, prefs);
                    if (itemIds.length === 0) return null;
                    return (
                        <div key={groupKey} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <SectorHeader title={GROUP_TITLES[groupKey]} theme={theme} collapsed={collapsed} />
                            {itemIds.map((itemId) => (
                                <NavItem
                                    key={itemId}
                                    id={itemId}
                                    label={sidebarNavLabel(itemId, t)}
                                    icon={NAV_ICONS[itemId] ?? <Activity size={18} strokeWidth={2} />}
                                    isActive={currentView === itemId}
                                    collapsed={collapsed}
                                    hovered={hoveredItem === itemId}
                                    sectorAccent={theme.accent}
                                    sectorGlow={theme.glow}
                                    onHover={setHoveredItem}
                                    onClick={() => onViewChange(itemId)}
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

                {prefs.footerOrder
                    .filter((fid) => !prefs.hiddenNavIds.includes(fid))
                    .map((fid) => {
                        const footerAccents: Record<string, { a: string; g: string }> = {
                            sources: { a: '#38bdf8', g: 'rgba(56, 189, 248, 0.35)' },
                            migration: { a: '#a78bfa', g: 'rgba(167, 139, 250, 0.35)' },
                            organization: { a: '#f472b6', g: 'rgba(244, 114, 182, 0.35)' },
                            settings: { a: '#94a3b8', g: 'rgba(148, 163, 184, 0.35)' },
                            docs: { a: '#64748b', g: 'rgba(100, 116, 139, 0.25)' },
                        };
                        const { a, g } = footerAccents[fid] ?? footerAccents.settings;
                        return (
                            <NavItem
                                key={fid}
                                id={fid}
                                label={sidebarNavLabel(fid, t)}
                                icon={NAV_ICONS[fid] ?? <Activity size={18} strokeWidth={2} />}
                                isActive={fid === 'docs' ? false : currentView === fid}
                                collapsed={collapsed}
                                hovered={hoveredItem === fid}
                                sectorAccent={a}
                                sectorGlow={g}
                                onHover={setHoveredItem}
                                onClick={() =>
                                    fid === 'docs'
                                        ? window.open('/NALYSE_WORK_INSTRUCTIONS.html', '_blank')
                                        : onViewChange(fid)
                                }
                            />
                        );
                    })}
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
