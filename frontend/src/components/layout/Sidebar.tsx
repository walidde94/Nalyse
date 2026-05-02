import React, { useState, useEffect, memo, useCallback } from 'react';
import { Reorder } from 'framer-motion';
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
import { useArchitect } from '../../contexts/ArchitectContext';
import { ArchitectNode } from './ArchitectNode';

import {
    // Home icon removed — landing nav item deprecated
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
    ChevronDown,
    Activity,
    ShieldAlert,
    Landmark,
    FlaskConical,
    Building2,
    MessageSquare,
    Webhook,
    Boxes,
    Layers,
    Users,
    Send
} from 'lucide-react';

interface SidebarProps {
    currentView: string;
    openedViews?: string[];
    onViewChange: (view: any) => void;
}

/** Color identity per group — subtle, not overpowering */
const SECTOR_THEMES = [
    { accent: '#6366f1', glow: 'rgba(99, 102, 241, 0.3)', name: 'Engine' },
    { accent: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.3)', name: 'Studio' },
    { accent: '#06b6d4', glow: 'rgba(6, 182, 212, 0.3)', name: 'Predict' },
    { accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', name: 'Intel' },
    { accent: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', name: 'Service' },
] as const;

const GROUP_THEME_INDEX: Record<SidebarGroupKey, number> = {
    social: 0,
    decision: 1,
    analytics: 2,
    predictive: 3,
    bi: 4,
    selfservice: 0, // Fallback reuse
};

const NAV_ICONS: Record<string, React.ReactNode> = {
    simulation: <FlaskConical size={16} strokeWidth={2} />,
    dashboard: <LayoutDashboard size={16} strokeWidth={2} />,
    lens: <Sparkles size={16} strokeWidth={2} />,
    correlate: <Link2 size={16} strokeWidth={2} />,
    diff: <GitCompareArrows size={16} strokeWidth={2} />,
    anomaly: <ShieldAlert size={16} strokeWidth={2} />,
    financial: <Landmark size={16} strokeWidth={2} />,
    forecast: <TrendingUp size={16} strokeWidth={2} />,
    spatial: <Map size={16} strokeWidth={2} />,
    automl: <BrainCircuit size={16} strokeWidth={2} />,
    developer: <Code2 size={16} strokeWidth={2} />,
    webhooks: <Webhook size={16} strokeWidth={2} />,
    embed: <Boxes size={16} strokeWidth={2} />,
    canvas: <Layers size={16} strokeWidth={2} />,
    bi: <BarChart3 size={16} strokeWidth={2} />,
    democracy: <Sparkles size={16} strokeWidth={2} />,
    automation: <Activity size={16} strokeWidth={2} />,
    collaboration: <MessageSquare size={16} strokeWidth={2} />,
    'shared-workspaces': <Users size={16} strokeWidth={2} />,
    'private-chat': <Send size={16} strokeWidth={2} />,
    sources: <Database size={16} strokeWidth={2} />,
    migration: <ArrowRightLeft size={16} strokeWidth={2} />,
    organization: <Building2 size={16} strokeWidth={2} />,
    settings: <Settings size={16} strokeWidth={2} />,
    docs: <FileCheck size={16} strokeWidth={2} />,
};

const TOUR_ID_MAP: Record<string, string> = {
    dashboard: 'tour-ws-link',
    sources: 'tour-connectors-link',
    democracy: 'tour-nexus-ai',
    correlate: 'tour-correlate-link',
    bi: 'tour-bi-link',
    logistics: 'tour-logistics-link',
    developer: 'tour-dev-link'
};

function sidebarNavLabel(id: string, t: (key: string) => string): string {
    const keyMap: Record<string, string> = {
        dashboard: 'nav.dashboard',
        workspace: 'nav.workspace',
        correlate: 'nav.correlation',
        bi: 'nav.bi',
        settings: 'nav.settings',
        home: 'nav.home',
        simulation: 'nav.simulation',
        lens: 'nav.lens',
        diff: 'nav.diff',
        anomaly: 'nav.anomaly',
        financial: 'nav.financial',
        forecast: 'nav.forecast',
        spatial: 'nav.spatial',
        automl: 'nav.automl',
        developer: 'nav.developer',
        webhooks: 'nav.webhooks',
        embed: 'nav.embed',
        canvas: 'nav.canvas',
        democracy: 'nav.democracy',
        automation: 'nav.automation',
        collaboration: 'nav.collaboration',
        'shared-workspaces': 'nav.sharedWorkspaces',
        'private-chat': 'nav.privateChat',
        sources: 'nav.sources',
        migration: 'nav.migration',
        organization: 'nav.organization',
        docs: 'nav.docs',
    };
    const tr = keyMap[id];
    if (tr) {
        return t(tr);
    }
    const fallbackKeyMap: Record<string, string> = {
        simulation: 'nav.simulation',
        lens: 'nav.lens',
        diff: 'nav.diff',
        anomaly: 'nav.anomaly',
        financial: 'nav.financial',
        forecast: 'nav.forecast',
        spatial: 'nav.spatial',
        automl: 'nav.automl',
        developer: 'nav.developer',
        webhooks: 'nav.webhooks',
        embed: 'nav.embed',
        canvas: 'nav.canvas',
        projects: 'nav.projects',
        democracy: 'nav.democracy',
        automation: 'nav.automation',
        collaboration: 'nav.collaboration',
        'shared-workspaces': 'nav.sharedWorkspaces',
        'private-chat': 'nav.privateChat',
        sources: 'nav.sources',
        migration: 'nav.migration',
        organization: 'nav.organization',
        docs: 'nav.docs',
    };
    const fbKey = fallbackKeyMap[id];
    if (fbKey) {
        const v = t(fbKey);
        if (v && v !== fbKey) return v;
    }
    return id;
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

export const Sidebar: React.FC<SidebarProps> = ({ currentView, openedViews = [], onViewChange }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { isArchitectMode } = useArchitect();
    const userId = user?.id;
    const isPro = user && ((user as any)?.organization?.plan === 'pro' || (user as any)?.plan === 'pro');
    const [collapsed, setCollapsed] = useState(() => getInitialSidebarCollapsed(userId));
    const [prefs, setPrefs] = useState(() => loadLayoutPreferences(userId));
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    useEffect(() => {
        const sync = () => {
            const p = loadLayoutPreferences(userId);
            setPrefs(p);
            setCollapsed(p.sidebarCollapsedDefault);
        };
        // Reload when user changes
        sync();
        window.addEventListener(LAYOUT_PREFS_EVENT, sync);
        return () => window.removeEventListener(LAYOUT_PREFS_EVENT, sync);
    }, [userId]);

    const persistCollapsed = (next: boolean) => {
        setCollapsed(next);
        const p = loadLayoutPreferences(userId);
        saveLayoutPreferences({ ...p, sidebarCollapsedDefault: next }, userId);
    };

    const toggleGroupCollapse = (groupKey: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    };

    const groupKeys = prefs.groupOrder.filter((g): g is SidebarGroupKey =>
        (DEFAULT_GROUP_ORDER as readonly string[]).includes(g)
    );

    const handleReorderGroups = (newOrder: string[]) => {
        const p = loadLayoutPreferences(userId);
        saveLayoutPreferences({ ...p, groupOrder: newOrder as SidebarGroupKey[] }, userId);
    };

    const handleHideGroup = useCallback((groupKey: SidebarGroupKey) => {
        const p = loadLayoutPreferences(userId);
        const newOrder = p.groupOrder.filter(g => g !== groupKey);
        saveLayoutPreferences({ ...p, groupOrder: newOrder }, userId);
    }, [userId]);

    const pos = prefs.sidebarPosition || 'left';
    const isHorizontal = pos === 'top' || pos === 'bottom';
    
    // Force collapse on horizontal to save vertical space if desired, but we can let it expand.
    // For now, we adapt width/height based on orientation.
    const expandedWidth = 240;
    const collapsedWidth = 64;

    return (
        <aside
            className={`sidebar-responsive sidebar-neural-rail ${collapsed ? 'sidebar-neural-rail--collapsed' : ''} ${isPro ? 'pro-sidebar-glow' : ''}`}
            style={{
                width: isHorizontal ? '100%' : (collapsed ? collapsedWidth : expandedWidth),
                height: isHorizontal ? (collapsed ? collapsedWidth : 'auto') : '100%',
                minHeight: isHorizontal ? collapsedWidth : undefined,
                transition: 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                display: 'flex',
                flexDirection: isHorizontal ? 'row' : 'column',
                zIndex: 20,
                position: 'relative',
                overflowX: isHorizontal ? 'auto' : 'visible',
                overflowY: isHorizontal ? 'hidden' : 'hidden',
                background: 'var(--bento-glass)',
                backdropFilter: 'var(--bento-blur)',
                WebkitBackdropFilter: 'var(--bento-blur)',
                borderRight: pos === 'left' ? '1px solid var(--bento-border)' : 'none',
                borderLeft: pos === 'right' ? '1px solid var(--bento-border)' : 'none',
                borderBottom: pos === 'top' ? '1px solid var(--bento-border)' : 'none',
                borderTop: pos === 'bottom' ? '1px solid var(--bento-border)' : 'none',
            }}
        >
            {/* Brand + collapse */}
            <ArchitectNode id="sb-brand" label={t('nav.id')}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isHorizontal ? 'center' : (collapsed ? 'center' : 'space-between'),
                    padding: collapsed ? '12px 8px' : '12px 14px',
                    borderBottom: isHorizontal ? 'none' : '1px solid var(--border-subtle)',
                    borderRight: isHorizontal ? '1px solid var(--border-subtle)' : 'none',
                    minHeight: '48px',
                    height: isHorizontal ? '100%' : 'auto',
                }}>
                    {!collapsed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-primary)',
                                fontWeight: 900,
                                fontSize: 13,
                                fontFamily: 'var(--font-heading)',
                                flexShrink: 0,
                            }}>N</div>
                        </div>
                    ) : (
                        <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                            fontSize: 13,
                            fontFamily: 'var(--font-heading)',
                        }}>N</div>
                    )}
                    <button
                        type="button"
                        onClick={() => persistCollapsed(!collapsed)}
                        className="desktop-only"
                        title={collapsed ? t('nav.expand') : t('nav.collapse')}
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-subtle)',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                        }}
                    >
                        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                    </button>
                </div>
            </ArchitectNode>

            <nav
                className="custom-scrollbar"
                style={{
                    padding: isHorizontal ? '0 10px' : '6px 8px 10px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: isHorizontal ? 'row' : 'column',
                    alignItems: isHorizontal ? 'center' : 'stretch',
                    gap: isHorizontal ? 8 : 1,
                    overflowY: isHorizontal ? 'hidden' : 'auto',
                    overflowX: isHorizontal ? 'auto' : 'hidden',
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                {/* Navigation Groups */}
                <Reorder.Group
                    axis={isHorizontal ? "x" : "y"}
                    values={groupKeys}
                    onReorder={handleReorderGroups}
                    style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: isHorizontal ? 'row' : 'column', gap: isHorizontal ? 8 : 1 }}
                >
                    {groupKeys.map((groupKey) => {
                        const themeIdx = GROUP_THEME_INDEX[groupKey];
                        const theme = SECTOR_THEMES[themeIdx] ?? SECTOR_THEMES[0];
                        const itemIds = orderedGroupItemIds(groupKey, prefs);
                        if (itemIds.length === 0) return null;
                        const isGroupCollapsed = collapsedGroups.has(groupKey);
                        // Auto-expand if current view is inside this group
                        const hasActiveItem = itemIds.includes(currentView);

                        return (
                            <Reorder.Item
                                key={groupKey}
                                value={groupKey}
                                dragListener={isArchitectMode}
                                style={{ position: 'relative' }}
                            >
                                <ArchitectNode
                                    id={`sb-sector-${groupKey}`}
                                    label={`${t(`nav.group.${groupKey}`)} Sector`}
                                    onRemove={() => handleHideGroup(groupKey)}
                                >
                                    <div style={{ display: 'flex', flexDirection: isHorizontal ? 'row' : 'column', alignItems: isHorizontal ? 'center' : 'stretch', gap: 1 }}>
                                        {/* Group Header — clickable to toggle */}
                                        {!collapsed ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleGroupCollapse(groupKey)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '10px 10px 4px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                <span style={{
                                                    width: 4,
                                                    height: 4,
                                                    borderRadius: '50%',
                                                    background: theme.accent,
                                                    opacity: 0.6,
                                                    flexShrink: 0,
                                                }} />
                                                <span style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                    color: 'var(--text-muted)',
                                                    flex: 1,
                                                }}>
                                                    {t(`nav.group.${groupKey}`)}
                                                </span>
                                                <span style={{
                                                    color: 'var(--text-muted)',
                                                    opacity: 0.5,
                                                    transition: 'transform 0.2s ease',
                                                    transform: isGroupCollapsed && !hasActiveItem ? 'rotate(-90deg)' : 'rotate(0deg)',
                                                    display: 'flex',
                                                }}>
                                                    <ChevronDown size={12} />
                                                </span>
                                            </button>
                                        ) : (
                                            <div style={{
                                                margin: isHorizontal ? '0 4px' : '6px auto 4px',
                                                width: isHorizontal ? 2 : 16,
                                                height: isHorizontal ? 16 : 2,
                                                borderRadius: 1,
                                                background: theme.accent,
                                                opacity: 0.25,
                                            }} />
                                        )}

                                        {/* Items — show if not collapsed, or if has active item */}
                                        <div style={{ display: 'flex', flexDirection: isHorizontal ? 'row' : 'column', gap: 1 }}>
                                        {(!isGroupCollapsed || hasActiveItem || collapsed) && itemIds.map((itemId) => (
                                            <NavItem
                                                key={itemId}
                                                id={itemId}
                                                label={sidebarNavLabel(itemId, t)}
                                                icon={NAV_ICONS[itemId] ?? <Activity size={16} strokeWidth={2} />}
                                                isActive={currentView === itemId}
                                                isOpened={openedViews.includes(itemId)}
                                                collapsed={collapsed}
                                                hovered={hoveredItem === itemId}
                                                sectorAccent={theme.accent}
                                                sectorGlow={theme.glow}
                                                onHover={setHoveredItem}
                                                onClick={() => onViewChange(itemId)}
                                                tourId={TOUR_ID_MAP[itemId]}
                                            />
                                        ))}
                                        </div>
                                    </div>
                                </ArchitectNode>
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>

                <div style={{ flex: 1, minHeight: isHorizontal ? undefined : 8, minWidth: isHorizontal ? 8 : undefined }} />

                {/* Footer separator */}
                <div style={{
                    height: isHorizontal ? '60%' : 1,
                    width: isHorizontal ? 1 : 'auto',
                    background: 'var(--border-subtle)',
                    margin: isHorizontal ? '0 8px' : '4px 8px',
                    opacity: 0.5,
                }} />

                {/* Footer nav items */}
                <div style={{ display: 'flex', flexDirection: isHorizontal ? 'row' : 'column', gap: 1 }}>
                {prefs.footerOrder
                    .filter((fid) => !prefs.hiddenNavIds.includes(fid))
                    .map((fid) => {
                        const footerAccents: Record<string, { a: string; g: string }> = {
                            sources: { a: '#38bdf8', g: 'rgba(56, 189, 248, 0.25)' },
                            migration: { a: '#a78bfa', g: 'rgba(167, 139, 250, 0.25)' },
                            organization: { a: '#f472b6', g: 'rgba(244, 114, 182, 0.25)' },
                            settings: { a: '#94a3b8', g: 'rgba(148, 163, 184, 0.25)' },
                            docs: { a: '#64748b', g: 'rgba(100, 116, 139, 0.2)' },
                        };
                        const { a, g } = footerAccents[fid] ?? footerAccents.settings;
                        return (
                            <NavItem
                                key={fid}
                                id={fid}
                                label={sidebarNavLabel(fid, t)}
                                icon={NAV_ICONS[fid] ?? <Activity size={16} strokeWidth={2} />}
                                isActive={fid === 'docs' ? false : currentView === fid}
                                isOpened={fid === 'docs' ? false : openedViews.includes(fid)}
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
                                tourId={TOUR_ID_MAP[fid]}
                            />
                        );
                    })}
                </div>
            </nav>

            {/* Upgrade CTA (non-pro users only) */}
            {!isPro && !isHorizontal && (
                <ArchitectNode id="sb-upgrade" label={t('nav.upgradePro')}>
                    <div style={{ padding: '8px', position: 'relative', zIndex: 2 }}>
                        <div
                            style={{
                                cursor: 'pointer',
                                padding: collapsed ? 10 : 14,
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(56, 189, 248, 0.05) 100%)',
                                border: '1px solid rgba(139, 92, 246, 0.15)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.05)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
                            }}
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
                            {!collapsed ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                                        <span style={{
                                            fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                                            color: 'var(--primary)',
                                        }}>{t('nav.upgradePro')}</span>
                                    </div>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                                        {t('nav.upgradeDesc')}
                                    </p>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                                </div>
                            )}
                        </div>
                    </div>
                </ArchitectNode>
            )}
        </aside>
    );
};

/* ─── Group Header component ─── */
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

/* ─── NavItem ─── */
interface NavItemProps {
    id: string;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    isOpened?: boolean;
    collapsed: boolean;
    hovered: boolean;
    sectorAccent: string;
    sectorGlow: string;
    onHover: (id: string | null) => void;
    onClick: () => void;
    tourId?: string;
}

const NavItem: React.FC<NavItemProps> = memo(function NavItem({
    id,
    label,
    icon,
    isActive,
    isOpened,
    collapsed,
    hovered,
    sectorAccent,
    sectorGlow,
    onHover,
    onClick,
    tourId,
}) {
    return (
        <div style={{ position: 'relative' }} id={tourId}>
            <button
                type="button"
                onClick={onClick}
                onMouseEnter={() => onHover(id)}
                onMouseLeave={() => onHover(null)}
                title={collapsed ? label : undefined}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '8px' : '7px 10px',
                    gap: 10,
                    width: '100%',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    borderRadius: 10,
                    position: 'relative',
                    fontFamily: 'var(--font-main)',
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 500,
                    background: isActive
                        ? `${sectorAccent}15`
                        : hovered
                            ? 'var(--bg-surface-hover)'
                            : 'transparent',
                    borderColor: isActive
                        ? `${sectorAccent}30`
                        : hovered
                            ? 'var(--bento-border-hover)'
                            : 'transparent',
                    color: isActive ? sectorAccent : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    transform: hovered && !isActive ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: isActive ? `0 4px 12px ${sectorGlow}` : 'none'
                }}
            >
                {/* Active indicator bar */}
                {isActive && (
                    <span style={{
                        position: 'absolute',
                        left: 0,
                        top: '15%',
                        bottom: '15%',
                        width: 4,
                        borderRadius: '0 4px 4px 0',
                        background: sectorAccent,
                        boxShadow: `0 0 12px ${sectorAccent}`,
                        animation: 'pulseGlow 2s infinite alternate',
                    }} />
                )}

                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: collapsed ? undefined : 28,
                    height: collapsed ? undefined : 28,
                    borderRadius: 6,
                    background: isActive ? `${sectorAccent}18` : 'transparent',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                }}>
                    {icon}
                </span>

                {!collapsed && (
                    <span
                        style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            textAlign: 'left',
                            paddingRight: 16,
                        }}
                    >
                        {label}
                    </span>
                )}

                {/* Open service indicator dot */}
                {isOpened && !isActive && (
                    <span style={{
                        position: 'absolute',
                        right: collapsed ? 10 : 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: sectorAccent,
                        boxShadow: `0 0 6px ${sectorGlow}`,
                    }} />
                )}
            </button>

            {/* Tooltip for collapsed state */}
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
