import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, Wifi, WifiOff, CloudDownload, Phone } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export const MobileView: React.FC = () => {
    const { addToast } = useToast();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            addToast('Install prompt not available. App may already be installed or browser unsupported.', 'info');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            addToast('PWA Installed successfully!', 'success');
        }
        setDeferredPrompt(null);
    };

    const enablePush = () => {
        if (!('Notification' in window)) {
            addToast('Push notifications not supported by this browser.', 'error');
            return;
        }
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                setPushEnabled(true);
                new Notification('Nalyse', {
                    body: 'Push notifications are enabled. Sprint 9 feature active!',
                });
                addToast('Push notifications enabled.', 'success');
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-app)] text-[var(--text-primary)]">
            <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Smartphone className="text-pink-500" />
                            Mobile & PWA Settings
                        </h1>
                        <p className="text-secondary mt-1 max-w-2xl">
                            Configure progressive web app capabilities, offline support, and native-like experiences.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Network Status */}
                    <div className="card p-6 border border-[var(--border-subtle)]">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            {isOnline ? <Wifi className="text-emerald-500" /> : <WifiOff className="text-rose-500" />}
                            Network Status
                        </h3>
                        <div className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)]">
                            <p className="font-bold flex items-center justify-between">
                                Connection: {isOnline ? <span className="text-emerald-500">Online</span> : <span className="text-rose-500">Offline</span>}
                            </p>
                            <p className="text-xs text-secondary mt-2">
                                PWA service worker caches UI shell for offline interaction. Data syncs when online.
                            </p>
                        </div>
                    </div>

                    {/* Push Notifications */}
                    <div className="card p-6 border border-[var(--border-subtle)]">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Bell className="text-amber-500" />
                            Web Push
                        </h3>
                        <div className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)]">
                            <button
                                onClick={enablePush}
                                disabled={pushEnabled}
                                className={`btn w-full justify-center ${pushEnabled ? 'btn-secondary text-emerald-500 border-emerald-500/30' : 'bg-primary text-white hover:bg-primary/90'}`}
                            >
                                {pushEnabled ? 'Push Notifications Active' : 'Enable Push Notifications'}
                            </button>
                            <p className="text-xs text-secondary mt-3">
                                Native browser notifications for job completion and critical alerts.
                            </p>
                        </div>
                    </div>

                    {/* Native Install */}
                    <div className="card p-6 border border-[var(--border-subtle)] md:col-span-2">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CloudDownload className="text-cyan-500" />
                            Install Nalyse App
                        </h3>
                        <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 rounded-xl border border-[var(--border-default)] flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl">
                                <Phone size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Add to Home Screen</h4>
                                <p className="text-secondary text-sm max-w-lg mb-4">
                                    Install Nalyse directly to your device for a 100% native feel. Sprint 9 introduces touch-optimized routing and gestural navigation.
                                </p>
                                <button
                                    className="btn bg-white text-black font-bold hover:bg-white/90"
                                    onClick={handleInstallClick}
                                    disabled={!deferredPrompt}
                                >
                                    {deferredPrompt ? 'Install App' : 'Already Installed / Unavailable'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
