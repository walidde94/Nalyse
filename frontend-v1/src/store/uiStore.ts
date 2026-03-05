import { create } from 'zustand';

export type TabType = { id: string; title: string; type: string; data?: any };

interface UIState {
    // Navigation
    tabs: TabType[];
    activeTabId: string;
    openTab: (type: string, title?: string, data?: any) => void;
    closeTab: (id: string) => void;
    setActiveTabId: (id: string) => void;

    // Modals & Overlays
    isSettingsOpen: boolean;
    settingsInitialTab: string;
    openSettings: (initialTab?: string) => void;
    closeSettings: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    tabs: [{ id: 'landing', title: 'Home', type: 'landing' }],
    activeTabId: 'landing',

    openTab: (type: string, title?: string, data?: any) => set((state) => {
        const id = type === 'settings' || type === 'dashboard' || type === 'landing' ? type : `${type}_${Date.now()}`;

        // Singletons
        if (['settings', 'dashboard', 'landing'].includes(type) || type.startsWith('settings')) {
            const existing = state.tabs.find(t => t.type === type);
            if (existing) {
                // Return updated state activating the existing tab
                return {
                    activeTabId: existing.id,
                    tabs: state.tabs.map(t => t.id === existing.id ? { ...t, data: data || t.data } : t)
                };
            }
        }

        const newTab = { id, title: title || type, type, data };
        return {
            tabs: [...state.tabs, newTab],
            activeTabId: id,
        };
    }),

    closeTab: (id: string) => set((state) => {
        const newTabs = state.tabs.filter((t) => t.id !== id);
        if (newTabs.length === 0) {
            newTabs.push({ id: 'landing', title: 'Home', type: 'landing' });
        }

        return {
            tabs: newTabs,
            activeTabId: state.activeTabId === id ? newTabs[newTabs.length - 1].id : state.activeTabId,
        };
    }),

    setActiveTabId: (id: string) => set({ activeTabId: id }),

    isSettingsOpen: false,
    settingsInitialTab: 'profile',
    openSettings: (initialTab = 'profile') => set({ isSettingsOpen: true, settingsInitialTab: initialTab }),
    closeSettings: () => set({ isSettingsOpen: false }),
}));
