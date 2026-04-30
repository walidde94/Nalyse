/** Persisted workspace shell preferences (sidebar order, visibility, tab density). */

/** @deprecated Use `getLayoutPrefsKey(userId)` for per-user scoping. Kept for backward compatibility. */
export const LAYOUT_PREFS_STORAGE_KEY = 'nalyse-layout-preferences';
export const LAYOUT_PREFS_EVENT = 'layout-preferences-change';

/** Build a user-scoped localStorage key. Falls back to the shared key when no userId is provided. */
export function getLayoutPrefsKey(userId?: string): string {
    return userId ? `nalyse-layout-preferences-${userId}` : LAYOUT_PREFS_STORAGE_KEY;
}

export const DEFAULT_GROUP_ORDER = ['social', 'decision', 'analytics', 'predictive', 'bi', 'selfservice'] as const;
export type SidebarGroupKey = (typeof DEFAULT_GROUP_ORDER)[number];

export const DEFAULT_ITEMS: Record<SidebarGroupKey, readonly string[]> = {
    social: ['private-chat'],
    decision: ['simulation'],
    analytics: ['dashboard', 'lens', 'correlate', 'diff', 'anomaly', 'financial'],
    predictive: ['forecast', 'spatial', 'automl', 'developer', 'webhooks', 'embed'],
    bi: ['canvas', 'bi'],
    selfservice: ['democracy', 'automation', 'shared-workspaces'],
};

export const DEFAULT_FOOTER_ORDER = ['sources', 'migration', 'organization', 'settings', 'docs'] as const;
export type FooterNavId = (typeof DEFAULT_FOOTER_ORDER)[number];

/** Cannot be hidden (user must reach Settings to restore hidden items). */
export const PROTECTED_NAV_IDS = new Set<string>(['landing', 'settings']);

export const GROUP_TITLES: Record<SidebarGroupKey, string> = {
    social: 'Neural Bridge',
    decision: 'Decision Engine',
    analytics: 'Analytics Studio',
    predictive: 'Predictive Models',
    bi: 'Business Intelligence',
    selfservice: 'Self-Service',
};

/** Tab strip sizing; `compactTabBar` is kept in sync for older readers. */
export type TabBarDensity = 'spacious' | 'comfortable' | 'compact' | 'minimal';

export function getTabBarMetrics(density: TabBarDensity) {
    switch (density) {
        case 'spacious':
            return { barH: 42, tabHActive: 36, tabHIdle: 32, tabFs: 13, tabPadX: 16, tabMinW: 112, tabMaxW: 220, tabGap: 8, iconSize: 14 };
        case 'comfortable':
            return { barH: 38, tabHActive: 32, tabHIdle: 30, tabFs: 12, tabPadX: 14, tabMinW: 100, tabMaxW: 200, tabGap: 7, iconSize: 13 };
        case 'compact':
            return { barH: 32, tabHActive: 28, tabHIdle: 26, tabFs: 11, tabPadX: 10, tabMinW: 72, tabMaxW: 160, tabGap: 5, iconSize: 12 };
        case 'minimal':
        default:
            return { barH: 28, tabHActive: 24, tabHIdle: 22, tabFs: 10, tabPadX: 8, tabMinW: 64, tabMaxW: 140, tabGap: 4, iconSize: 11 };
    }
}

function normalizeTabBarDensity(parsed: Partial<LayoutPreferencesV1>): TabBarDensity {
    const d = parsed.tabBarDensity;
    if (d === 'spacious' || d === 'comfortable' || d === 'compact' || d === 'minimal') return d;
    if (parsed.compactTabBar) return 'compact';
    return 'comfortable';
}

export type LayoutPreferencesV1 = {
    version: 1;
    groupOrder: string[];
    /** Per-group ordered nav ids; missing ids are appended from defaults */
    itemOrder: Partial<Record<SidebarGroupKey, string[]>>;
    footerOrder: string[];
    hiddenNavIds: string[];
    sidebarCollapsedDefault: boolean;
    /** @deprecated use tabBarDensity; still written for compatibility */
    compactTabBar: boolean;
    tabBarDensity: TabBarDensity;
    blur: number;
    opacity: number;
};

const DEFAULT_PREFS: LayoutPreferencesV1 = {
    version: 1,
    groupOrder: [...DEFAULT_GROUP_ORDER],
    itemOrder: {},
    footerOrder: [...DEFAULT_FOOTER_ORDER],
    hiddenNavIds: [],
    sidebarCollapsedDefault: false,
    compactTabBar: false,
    tabBarDensity: 'comfortable',
    blur: 16,
    opacity: 0.85,
};

function normalizeGroupOrder(raw: unknown): string[] {
    const valid = new Set<string>(DEFAULT_GROUP_ORDER);
    const arr = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string' && valid.has(x)) : null;
    
    // If we have a saved order, respect it exactly (don't add back missing items automatically)
    // unless it's empty, in which case we use defaults.
    if (arr && arr.length > 0) return arr;
    
    return [...DEFAULT_GROUP_ORDER];
}

function normalizeItemOrder(group: SidebarGroupKey, raw: unknown): string[] {
    const defaults = [...DEFAULT_ITEMS[group]];
    const valid = new Set(defaults);
    const arr = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string' && valid.has(x)) : null;
    
    if (arr && arr.length > 0) return arr;
    
    return defaults;
}

function normalizeFooterOrder(raw: unknown): string[] {
    const valid = new Set<string>(DEFAULT_FOOTER_ORDER);
    const arr = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string' && valid.has(x)) : [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of arr) {
        if (!seen.has(id)) {
            seen.add(id);
            out.push(id);
        }
    }
    for (const id of DEFAULT_FOOTER_ORDER) {
        if (!seen.has(id)) out.push(id);
    }
    return out;
}

function normalizeHidden(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const allKnown = new Set<string>([
        ...Object.values(DEFAULT_ITEMS).flat(),
        ...DEFAULT_FOOTER_ORDER,
    ]);
    return raw.filter((x): x is string => typeof x === 'string' && allKnown.has(x) && !PROTECTED_NAV_IDS.has(x));
}

export function loadLayoutPreferences(userId?: string): LayoutPreferencesV1 {
    try {
        const key = getLayoutPrefsKey(userId);
        const stored = localStorage.getItem(key);
        if (!stored) return { ...DEFAULT_PREFS };
        const parsed = JSON.parse(stored) as Partial<LayoutPreferencesV1>;
        const itemOrder: Partial<Record<SidebarGroupKey, string[]>> = {};
        if (parsed.itemOrder && typeof parsed.itemOrder === 'object') {
            for (const g of DEFAULT_GROUP_ORDER) {
                if (parsed.itemOrder[g]) {
                    itemOrder[g] = normalizeItemOrder(g, parsed.itemOrder[g]);
                }
            }
        }
        const tabBarDensity = normalizeTabBarDensity(parsed);
        return {
            version: 1,
            groupOrder: normalizeGroupOrder(parsed.groupOrder),
            itemOrder,
            footerOrder: normalizeFooterOrder(parsed.footerOrder),
            hiddenNavIds: normalizeHidden(parsed.hiddenNavIds),
            sidebarCollapsedDefault: !!parsed.sidebarCollapsedDefault,
            tabBarDensity,
            compactTabBar: tabBarDensity === 'compact' || tabBarDensity === 'minimal',
            blur: typeof parsed.blur === 'number' ? parsed.blur : 16,
            opacity: typeof parsed.opacity === 'number' ? parsed.opacity : 0.85,
        };
    } catch {
        return { ...DEFAULT_PREFS };
    }
}

export function saveLayoutPreferences(next: LayoutPreferencesV1, userId?: string): void {
    const compactTabBar = next.tabBarDensity === 'compact' || next.tabBarDensity === 'minimal';
    const payload = { ...next, compactTabBar };
    const key = getLayoutPrefsKey(userId);
    localStorage.setItem(key, JSON.stringify(payload));
    window.dispatchEvent(new Event(LAYOUT_PREFS_EVENT));
}

export function getInitialSidebarCollapsed(userId?: string): boolean {
    return loadLayoutPreferences(userId).sidebarCollapsedDefault;
}

export function isNavHidden(prefs: LayoutPreferencesV1, id: string): boolean {
    return prefs.hiddenNavIds.includes(id);
}
