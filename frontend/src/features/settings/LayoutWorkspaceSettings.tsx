import React, { useState, useEffect, useCallback } from 'react';
import { GripVertical, Pencil, Check, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import {
    loadLayoutPreferences,
    saveLayoutPreferences,
    LAYOUT_PREFS_EVENT,
    DEFAULT_GROUP_ORDER,
    DEFAULT_ITEMS,
    DEFAULT_FOOTER_ORDER,
    GROUP_TITLES,
    PROTECTED_NAV_IDS,
    type LayoutPreferencesV1,
    type SidebarGroupKey,
    type TabBarDensity,
    getTabBarMetrics,
} from '../../preferences/layoutPreferences';

const DND_INDEX = 'application/x-nalyse-sort-index';

const NAV_LABEL_FALLBACK: Record<string, string> = {
    simulation: 'Simulation Engine',
    dashboard: 'Workspace',
    lens: 'Smart Lens',
    correlate: 'Correlation',
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
    bi: 'BI Dashboards',
    projects: 'Strategic Board',
    democracy: 'Self-Service Studio',
    automation: 'Automated Reports',
    collaboration: 'Collaboration',
    sources: 'Data Connectors',
    migration: 'Data Migration',
    organization: 'Organization & RBAC',
    settings: 'Settings',
    docs: 'Work Instructions',
};

const TAB_DENSITY_OPTIONS: { id: TabBarDensity; label: string; hint: string }[] = [
    { id: 'spacious', label: 'Spacious', hint: 'Largest tabs' },
    { id: 'comfortable', label: 'Comfortable', hint: 'Default' },
    { id: 'compact', label: 'Compact', hint: 'Dense' },
    { id: 'minimal', label: 'Minimal', hint: 'Maximum density' },
];

function navLabel(id: string, t: (key: string) => string): string {
    const keyMap: Record<string, string> = {
        dashboard: 'nav.workspace',
        correlate: 'nav.correlation',
        bi: 'nav.bi',
        settings: 'nav.settings',
    };
    const k = keyMap[id];
    if (k) {
        const v = t(k);
        if (v && v !== k) return v;
    }
    return NAV_LABEL_FALLBACK[id] || id;
}

function moveInPlace<T>(arr: T[], from: number, to: number): T[] {
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return [...arr];
    const next = [...arr];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    return next;
}

type ReorderRowProps = {
    editMode: boolean;
    index: number;
    count: number;
    onReorder: (from: number, to: number) => void;
    onShift: (index: number, dir: -1 | 1) => void;
    label: React.ReactNode;
    trailing?: React.ReactNode;
    rowStyle?: React.CSSProperties;
};

const ReorderRow: React.FC<ReorderRowProps> = ({
    editMode,
    index,
    count,
    onReorder,
    onShift,
    label,
    trailing,
    rowStyle,
}) => {
    const [dropOver, setDropOver] = useState(false);
    const [focused, setFocused] = useState(false);

    const onDragStartHandle = (e: React.DragEvent) => {
        e.dataTransfer.setData(DND_INDEX, String(index));
        e.dataTransfer.effectAllowed = 'move';
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!editMode) return;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            onShift(index, -1);
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            onShift(index, 1);
        }
    };

    return (
        <div
            role="listitem"
            tabIndex={editMode ? 0 : -1}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onDragOver={
                editMode
                    ? (e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDropOver(true);
                      }
                    : undefined
            }
            onDragLeave={() => setDropOver(false)}
            onDrop={
                editMode
                    ? (e) => {
                          e.preventDefault();
                          setDropOver(false);
                          const from = parseInt(e.dataTransfer.getData(DND_INDEX), 10);
                          if (!Number.isNaN(from)) onReorder(from, index);
                      }
                    : undefined
            }
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: 'var(--bg-surface)',
                borderRadius: '10px',
                border: `1px solid ${dropOver ? 'var(--primary)' : 'var(--border-subtle)'}`,
                fontSize: '13px',
                outline: editMode && focused ? '2px solid var(--primary)' : undefined,
                outlineOffset: 2,
                ...rowStyle,
            }}
        >
            {editMode ? (
                <>
                    <span
                        draggable
                        onDragStart={onDragStartHandle}
                        onDragEnd={() => setDropOver(false)}
                        title="Drag to reorder"
                        style={{
                            cursor: 'grab',
                            display: 'flex',
                            color: 'var(--text-muted)',
                            flexShrink: 0,
                            touchAction: 'none',
                        }}
                        role="button"
                        aria-label="Drag to reorder"
                    >
                        <GripVertical size={18} strokeWidth={2} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            disabled={index === 0}
                            title="Move up"
                            onClick={() => onShift(index, -1)}
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            disabled={index >= count - 1}
                            title="Move down"
                            onClick={() => onShift(index, 1)}
                        >
                            ↓
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ flex: 1, minWidth: 0 }}>{label}</div>
            )}
            {trailing}
        </div>
    );
};

const BuildInfoPanel: React.FC<{ editMode: boolean }> = ({ editMode }) => {
    const { addToast } = useToast();
    const [open, setOpen] = useState(false);
    const mode = import.meta.env.MODE;
    const version = __APP_VERSION__;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const copy = (label: string, text: string) => {
        void navigator.clipboard.writeText(text).then(
            () => addToast(`${label} copied`, 'success'),
            () => addToast('Copy failed', 'error')
        );
    };

    const summary = (
        <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-secondary)' }}>App version</span>
                <code style={{ color: 'var(--text-primary)' }}>{version}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mode</span>
                <code style={{ color: 'var(--text-primary)' }}>{mode}</code>
            </div>
        </div>
    );

    if (!editMode) {
        return (
            <div className="card" style={{ padding: '20px' }}>
                <h3 className="text-h3" style={{ marginBottom: '8px' }}>
                    Build
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Environment metadata for support.
                </p>
                {summary}
            </div>
        );
    }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

    return (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="btn btn-ghost"
                style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: 0,
                    fontWeight: 700,
                    fontSize: '15px',
                }}
            >
                <span>Build & diagnostics</span>
                {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
            {open && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0 16px' }}>
                        Copy any value for tickets or debugging. Drag-and-drop layout changes save automatically.
                    </p>
                    {summary}
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Origin</span>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <code style={{ fontSize: '12px', wordBreak: 'break-all', maxWidth: '100%' }}>{origin}</code>
                                <button type="button" className="btn btn-secondary btn-xs" onClick={() => copy('Origin', origin)}>
                                    <Copy size={12} style={{ marginRight: 4 }} /> Copy
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>User agent</span>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <code style={{ fontSize: '11px', wordBreak: 'break-all', maxWidth: '100%', opacity: 0.9 }}>
                                    {ua.slice(0, 220)}
                                    {ua.length > 220 ? '…' : ''}
                                </code>
                                <button type="button" className="btn btn-secondary btn-xs" onClick={() => copy('User agent', ua)}>
                                    <Copy size={12} style={{ marginRight: 4 }} /> Copy full
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Dev tools</span>
                            <span style={{ fontSize: '13px' }}>{import.meta.env.DEV ? 'Available (local)' : 'Production bundle'}</span>
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ alignSelf: 'flex-start', marginTop: 4 }}
                            onClick={() =>
                                copy(
                                    'Diagnostics bundle',
                                    JSON.stringify(
                                        {
                                            version,
                                            mode,
                                            origin,
                                            userAgent: ua,
                                            ts: new Date().toISOString(),
                                        },
                                        null,
                                        2
                                    )
                                )
                            }
                        >
                            <Copy size={14} style={{ marginRight: 6 }} />
                            Copy diagnostics JSON
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const LayoutWorkspaceSettings: React.FC<{ t: (key: string) => string }> = ({ t }) => {
    const [prefs, setPrefs] = useState<LayoutPreferencesV1>(() => loadLayoutPreferences());
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const sync = () => setPrefs(loadLayoutPreferences());
        window.addEventListener(LAYOUT_PREFS_EVENT, sync);
        return () => window.removeEventListener(LAYOUT_PREFS_EVENT, sync);
    }, []);

    const update = useCallback((patch: Partial<LayoutPreferencesV1>) => {
        const next = { ...loadLayoutPreferences(), ...patch, version: 1 as const };
        saveLayoutPreferences(next);
        setPrefs(next);
    }, []);

    const groupOrder = prefs.groupOrder.filter((g): g is SidebarGroupKey =>
        (DEFAULT_GROUP_ORDER as readonly string[]).includes(g)
    );

    const shiftGroup = (index: number, dir: -1 | 1) => {
        const j = index + dir;
        if (j < 0 || j >= groupOrder.length) return;
        update({ groupOrder: moveInPlace(groupOrder, index, j) });
    };

    const reorderGroups = (from: number, to: number) => {
        if (from === to) return;
        update({ groupOrder: moveInPlace(groupOrder, from, to) });
    };

    const normalizedItemIds = (group: SidebarGroupKey): string[] => {
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
        return out;
    };

    const shiftItem = (group: SidebarGroupKey, index: number, dir: -1 | 1) => {
        const ids = normalizedItemIds(group);
        const j = index + dir;
        if (j < 0 || j >= ids.length) return;
        const itemOrder = { ...prefs.itemOrder, [group]: moveInPlace(ids, index, j) };
        update({ itemOrder });
    };

    const reorderItems = (group: SidebarGroupKey, from: number, to: number) => {
        if (from === to) return;
        const ids = normalizedItemIds(group);
        update({ itemOrder: { ...prefs.itemOrder, [group]: moveInPlace(ids, from, to) } });
    };

    const shiftFooter = (index: number, dir: -1 | 1) => {
        const order = [...prefs.footerOrder];
        const j = index + dir;
        if (j < 0 || j >= order.length) return;
        update({ footerOrder: moveInPlace(order, index, j) });
    };

    const reorderFooter = (from: number, to: number) => {
        if (from === to) return;
        update({ footerOrder: moveInPlace([...prefs.footerOrder], from, to) });
    };

    const toggleHidden = (id: string) => {
        if (PROTECTED_NAV_IDS.has(id)) return;
        const hidden = new Set(prefs.hiddenNavIds);
        if (hidden.has(id)) hidden.delete(id);
        else hidden.add(id);
        update({ hiddenNavIds: [...hidden] });
    };

    const resetDefaults = () => {
        saveLayoutPreferences({
            version: 1,
            groupOrder: [...DEFAULT_GROUP_ORDER],
            itemOrder: {},
            footerOrder: [...DEFAULT_FOOTER_ORDER],
            hiddenNavIds: [],
            sidebarCollapsedDefault: false,
            compactTabBar: false,
            tabBarDensity: 'comfortable',
        });
        setPrefs(loadLayoutPreferences());
    };

    const tabMetrics = getTabBarMetrics(prefs.tabBarDensity);

    return (
        <div style={{ maxWidth: '920px' }} className="fade-in">
            <div
                style={{
                    marginBottom: '24px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                }}
            >
                <div>
                    <h3 className="text-h3">Layout & workspace</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '560px' }}>
                        {editMode
                            ? 'Edit mode: drag handles to reorder, use arrow keys on a focused row, or the shift buttons. Changes apply immediately.'
                            : 'Preview your shell and rail. Open edit mode to rearrange sectors and destinations, tune the tab strip, and expand build diagnostics.'}
                    </p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {editMode ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditMode(false)}>
                            <Check size={16} style={{ marginRight: 6 }} />
                            Done editing
                        </button>
                    ) : (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>
                            <Pencil size={16} style={{ marginRight: 6 }} />
                            Edit layout
                        </button>
                    )}
                    {editMode && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={resetDefaults}>
                            Reset all defaults
                        </button>
                    )}
                </div>
            </div>

            {!editMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div className="card" style={{ padding: '20px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>At a glance</h4>
                        <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7 }}>
                            <li>
                                Sidebar sectors:{' '}
                                <strong style={{ color: 'var(--text-primary)' }}>{groupOrder.map((k) => GROUP_TITLES[k]).join(' → ')}</strong>
                            </li>
                            <li>
                                Tab strip: <strong style={{ color: 'var(--text-primary)' }}>{prefs.tabBarDensity}</strong> ({tabMetrics.barH}
                                px bar, {tabMetrics.tabFs}px labels)
                            </li>
                            <li>
                                Shell: sidebar starts{' '}
                                <strong style={{ color: 'var(--text-primary)' }}>
                                    {prefs.sidebarCollapsedDefault ? 'collapsed' : 'expanded'}
                                </strong>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card" style={{ padding: '20px', opacity: editMode ? 1 : 0.85 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Shell</h4>
                    {!editMode && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Enter edit mode to change these.</p>
                    )}
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            padding: '12px 0',
                            borderBottom: '1px solid var(--border-default)',
                            cursor: editMode ? 'pointer' : 'default',
                            pointerEvents: editMode ? 'auto' : 'none',
                            opacity: editMode ? 1 : 0.7,
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 500, fontSize: '14px' }}>Start with sidebar collapsed</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Applies on load; expand the rail anytime.
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={prefs.sidebarCollapsedDefault}
                            disabled={!editMode}
                            onChange={(e) => update({ sidebarCollapsedDefault: e.target.checked })}
                        />
                    </label>

                    <div style={{ paddingTop: '16px' }}>
                        <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '8px' }}>Document tab strip density</div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            Pick how tall and wide tabs appear. Live preview in the main workspace tab bar.
                        </p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: '8px',
                                pointerEvents: editMode ? 'auto' : 'none',
                                opacity: editMode ? 1 : 0.7,
                            }}
                        >
                            {TAB_DENSITY_OPTIONS.map((opt) => {
                                const active = prefs.tabBarDensity === opt.id;
                                const mm = getTabBarMetrics(opt.id);
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        disabled={!editMode}
                                        onClick={() => update({ tabBarDensity: opt.id })}
                                        className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{
                                            flexDirection: 'column',
                                            alignItems: 'stretch',
                                            textAlign: 'left',
                                            height: 'auto',
                                            padding: '12px 14px',
                                            gap: 4,
                                        }}
                                    >
                                        <span style={{ fontWeight: 700 }}>{opt.label}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 400 }}>
                                            {opt.hint} · {mm.barH}px / {mm.tabFs}px
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Sidebar sector order</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Whole groups in the command rail. Home stays fixed at the top of the sidebar.
                    </p>
                    <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {groupOrder.map((key, idx) => (
                            <ReorderRow
                                key={key}
                                editMode={editMode}
                                index={idx}
                                count={groupOrder.length}
                                onReorder={reorderGroups}
                                onShift={(i, d) => shiftGroup(i, d)}
                                label={<span style={{ fontWeight: 600, fontSize: '14px' }}>{GROUP_TITLES[key]}</span>}
                            />
                        ))}
                    </div>
                </div>

                {groupOrder.map((groupKey) => {
                    const ids = normalizedItemIds(groupKey);
                    return (
                        <div key={groupKey} className="card" style={{ padding: '20px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                                {GROUP_TITLES[groupKey]} — destinations
                            </h4>
                            <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {ids.map((id, i) => (
                                    <ReorderRow
                                        key={id}
                                        editMode={editMode}
                                        index={i}
                                        count={ids.length}
                                        onReorder={(from, to) => reorderItems(groupKey, from, to)}
                                        onShift={(index, dir) => shiftItem(groupKey, index, dir)}
                                        label={<span>{navLabel(id, t)}</span>}
                                        rowStyle={{ borderRadius: '8px', padding: '8px 10px' }}
                                        trailing={
                                            <label
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    cursor: editMode && !PROTECTED_NAV_IDS.has(id) ? 'pointer' : 'not-allowed',
                                                    marginLeft: '8px',
                                                    flexShrink: 0,
                                                    opacity: editMode ? 1 : 0.85,
                                                    pointerEvents: editMode ? 'auto' : 'none',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={prefs.hiddenNavIds.includes(id)}
                                                    disabled={!editMode || PROTECTED_NAV_IDS.has(id)}
                                                    onChange={() => toggleHidden(id)}
                                                />
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Hide</span>
                                            </label>
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                <div className="card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Data & settings row</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Bottom section of the rail (connectors, migration, org, settings, docs).
                    </p>
                    <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {prefs.footerOrder.map((id, i) => (
                            <ReorderRow
                                key={id}
                                editMode={editMode}
                                index={i}
                                count={prefs.footerOrder.length}
                                onReorder={reorderFooter}
                                onShift={(index, dir) => shiftFooter(index, dir)}
                                label={<span>{navLabel(id, t)}</span>}
                                rowStyle={{ borderRadius: '8px', padding: '8px 10px' }}
                                trailing={
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: editMode && !PROTECTED_NAV_IDS.has(id) ? 'pointer' : 'not-allowed',
                                            marginLeft: '8px',
                                            flexShrink: 0,
                                            opacity: editMode ? 1 : 0.85,
                                            pointerEvents: editMode ? 'auto' : 'none',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={prefs.hiddenNavIds.includes(id)}
                                            disabled={!editMode || PROTECTED_NAV_IDS.has(id)}
                                            onChange={() => toggleHidden(id)}
                                        />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Hide</span>
                                    </label>
                                }
                            />
                        ))}
                    </div>
                </div>

                <BuildInfoPanel editMode={editMode} />
            </div>
        </div>
    );
};
