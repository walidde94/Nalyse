import React, { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface RootLayoutProps {
    children: ReactNode;
    currentView: string;
    onViewChange: (view: any) => void;
    title?: string;
    tabBar?: ReactNode;
    isMobileMenuOpen?: boolean;
    onCloseMobileMenu?: () => void;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children, currentView, onViewChange, tabBar, isMobileMenuOpen, onCloseMobileMenu }) => {
    return (
        <div className="flex w-full" style={{ height: 'calc(100vh - 64px)', background: 'var(--bg-app)', color: 'var(--text-primary)', overflow: 'hidden' }}>
            <div className={`${isMobileMenuOpen ? 'mobile-sidebar-open' : 'sidebar-mobile-hidden'} desktop-visible`} style={{ height: '100%', zIndex: 1000 }}>
                <Sidebar currentView={currentView} onViewChange={(view) => {
                    onViewChange(view);
                    onCloseMobileMenu?.();
                }} />
            </div>

            {isMobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={onCloseMobileMenu}
                />
            )}

            <main className="flex-col w-full mobile-full-width" style={{
                overflow: 'hidden',
                height: '100%',
                background: 'var(--bg-app)'
            }}>
                {tabBar}
                <div className="flex-col w-full h-full main-content-mobile" style={{
                    overflowY: 'auto',
                    position: 'relative',
                    padding: '0',
                    display: 'flex',
                    flex: 1
                }}>
                    <div style={{ width: '100%', height: '100%' }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
