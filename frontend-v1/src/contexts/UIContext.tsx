import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface UIContextType {
    isSettingsOpen: boolean;
    openSettings: (tab?: string) => void;
    closeSettings: () => void;
    settingsTab: string;
    setSettingsTab: (tab: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState('profile');

    const openSettings = (tab?: string) => {
        if (tab) setSettingsTab(tab);
        setIsSettingsOpen(true);
    };

    const closeSettings = () => {
        setIsSettingsOpen(false);
    };

    return (
        <UIContext.Provider value={{
            isSettingsOpen,
            openSettings,
            closeSettings,
            settingsTab,
            setSettingsTab
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within UIProvider');
    return context;
};
