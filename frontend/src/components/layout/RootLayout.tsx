import React from 'react';
import { Sidebar } from './Sidebar';

interface RootLayoutProps {
    children: React.ReactNode;
    currentView: string;
    onViewChange: (view: any) => void;
    tabBar?: React.ReactNode;
    isMobileMenuOpen?: boolean;
    onCloseMobileMenu?: () => void;
}

export const RootLayout: React.FC<RootLayoutProps> = ({
    children,
    currentView,
    onViewChange,
    tabBar,
    isMobileMenuOpen,
    onCloseMobileMenu
}) => {
    return (
        <div className="flex w-full" style={{
            height: 'calc(100vh - 64px)',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Subtle mesh gradient background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.25,
                background:
                    'radial-gradient(ellipse at 0% 20%, var(--primary-subtle) 0px, transparent 50%),' +
                    'radial-gradient(ellipse at 100% 80%, var(--accent-glow) 0px, transparent 50%)',
                filter: 'blur(100px)',
            }} />

            {/* Desktop Sidebar */}
            <div
                className={`${isMobileMenuOpen ? 'mobile-sidebar-open' : 'sidebar-mobile-hidden'} desktop-visible`}
                style={{ height: '100%', zIndex: 1000, position: 'relative' }}
            >
                <Sidebar
                    currentView={currentView}
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
            <main className="flex-col w-full mobile-full-width" style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 0,
                position: 'relative',
                zIndex: 1,
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
            </main>
        </div>
    );
};
