import React, { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface RootLayoutProps {
    children: ReactNode;
    currentView: string;
    onViewChange: (view: any) => void;
    title?: string;
    tabBar?: ReactNode;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children, currentView, onViewChange, tabBar }) => {
    return (
        <div className="flex w-full" style={{ height: 'calc(100vh - 64px)', background: 'var(--bg-app)', color: 'var(--text-primary)', overflow: 'hidden' }}>
            <Sidebar currentView={currentView} onViewChange={onViewChange} />

            <main className="flex-col w-full" style={{ overflow: 'hidden' }}>
                {tabBar}
                <div className="flex-col w-full h-full" style={{
                    overflowY: 'auto',
                    position: 'relative'
                }}>
                    <div style={{ width: '100%', height: '100%' }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
