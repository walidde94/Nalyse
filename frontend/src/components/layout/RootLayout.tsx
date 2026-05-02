import React from 'react';
import { Sidebar } from './Sidebar';
import { ArchitectNode } from './ArchitectNode';
import { ArchitectPanel } from './ArchitectPanel';
import { useArchitect } from '../../contexts/ArchitectContext';
import { useAuth } from '../../contexts/AuthContext';
import { loadLayoutPreferences, LAYOUT_PREFS_EVENT } from '../../preferences/layoutPreferences';
import { useState, useEffect } from 'react';

interface RootLayoutProps {
    children: React.ReactNode;
    currentView: string;
    onViewChange: (view: any) => void;
    tabBar?: React.ReactNode;
    isMobileMenuOpen?: boolean;
    onCloseMobileMenu?: () => void;
    openedViews?: string[];
}

export const RootLayout: React.FC<RootLayoutProps> = ({
    children,
    currentView,
    onViewChange,
    tabBar,
    isMobileMenuOpen,
    onCloseMobileMenu,
    openedViews
}) => {
    const { isArchitectMode } = useArchitect();
    const { user } = useAuth();
    const userId = user?.id;
    const [prefs, setPrefs] = useState(() => loadLayoutPreferences(userId));

    useEffect(() => {
        const sync = () => setPrefs(loadLayoutPreferences(userId));
        sync();
        window.addEventListener(LAYOUT_PREFS_EVENT, sync);
        return () => window.removeEventListener(LAYOUT_PREFS_EVENT, sync);
    }, [userId]);

    const pos = prefs.sidebarPosition || 'left';
    let flexDirection: any = 'row';
    if (pos === 'right') flexDirection = 'row-reverse';
    else if (pos === 'top') flexDirection = 'column';
    else if (pos === 'bottom') flexDirection = 'column-reverse';

    return (
        <div className={`flex w-full sidebar-pos-${pos}`} style={{
            height: 'calc(100vh - 52px)',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            position: 'relative',
            flexDirection
        }}>
            {/* Desktop Sidebar */}
            <div className={isMobileMenuOpen ? 'mobile-sidebar-open' : 'sidebar-mobile-hidden desktop-visible'} style={{ 
                height: pos === 'top' || pos === 'bottom' ? 'auto' : '100%', 
                width: pos === 'top' || pos === 'bottom' ? '100%' : 'auto',
                zIndex: 1000 
            }}>
                <Sidebar
                    currentView={currentView}
                    openedViews={openedViews}
                    onViewChange={(view) => {
                        onViewChange(view);
                        onCloseMobileMenu?.();
                    }}
                />
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-overlay" onClick={onCloseMobileMenu} />
            )}

            {/* Main Content */}
            <div className="flex-col w-full mobile-full-width" style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 0,
                position: 'relative',
                overflow: 'hidden',
            }}>
                {tabBar}
                <div style={{
                    width: '100%',
                    flex: 1,
                    overflow: 'auto',
                    scrollBehavior: 'smooth',
                    position: 'relative',
                }}
                    className="custom-scrollbar"
                >
                    {children}
                </div>
                <ArchitectPanel />
            </div>
        </div>
    );
};
