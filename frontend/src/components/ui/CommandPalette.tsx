import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface Command {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: () => void;
    category?: string;
}

export const CommandPalette = ({ isOpen, onClose, commands }: { isOpen: boolean; onClose: () => void; commands: Command[] }) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [history, setHistory] = useState<string[]>(() => JSON.parse(localStorage.getItem('command_history') || '[]'));

    const addToHistory = (id: string) => {
        const newHistory = [id, ...history.filter(h => h !== id)].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('command_history', JSON.stringify(newHistory));
    };

    const filteredCommands = commands.filter(c => {
        const terms = search.toLowerCase().split(' ').filter(Boolean);
        if (terms.length === 0) return true;
        const target = `${c.label.toLowerCase()} ${c.category?.toLowerCase() || ''}`;
        return terms.every(term => target.includes(term));
    });

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    addToHistory(filteredCommands[selectedIndex].id);
                    filteredCommands[selectedIndex].action();
                    onClose();
                }
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="smart-backdrop"
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh'
            }}
            onClick={onClose}
        >
            <div
                className="glass-morphism inner-highlight shadow-hover fade-in"
                style={{
                    width: '640px', padding: 0,
                    borderRadius: '16px', overflow: 'hidden',
                    border: '1px solid var(--glass-border)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 p-4 border-bottom">
                    <span style={{ fontSize: '20px', opacity: 0.5 }}><Search size={20} /></span>
                    <input
                        className="input"
                        autoFocus
                        placeholder="Type a command or search..."
                        style={{ border: 'none', background: 'transparent', fontSize: '18px', height: 'auto', padding: 0 }}
                        value={search}
                        onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
                    />
                    <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>ESC</kbd>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredCommands.length === 0 ? (
                        <div className="p-8 text-center text-secondary">No matching commands found.</div>
                    ) : (
                        filteredCommands.map((cmd, i) => (
                            <div
                                key={cmd.id}
                                onClick={() => { addToHistory(cmd.id); cmd.action(); onClose(); }}
                                style={{
                                    padding: '14px 20px',
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    cursor: 'pointer',
                                    background: i === selectedIndex ? 'var(--primary)' : 'transparent',
                                    color: i === selectedIndex ? '#fff' : 'var(--text-primary)',
                                    transition: 'background 0.15s ease'
                                }}
                            >
                                <span style={{
                                    fontSize: '20px',
                                    background: i === selectedIndex ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                                    padding: '8px',
                                    borderRadius: '10px',
                                    display: 'flex'
                                }}>{cmd.icon}</span>
                                <div className="flex-col" style={{ gap: 2 }}>
                                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{cmd.label}</span>
                                    {cmd.category && (
                                        <span className="badge" style={{
                                            background: i === selectedIndex ? 'rgba(255,255,255,0.15)' : 'var(--bg-surface)',
                                            color: i === selectedIndex ? 'white' : 'var(--text-secondary)',
                                            width: 'fit-content'
                                        }}>
                                            {cmd.category}
                                        </span>
                                    )}
                                </div>
                                {history.includes(cmd.id) && !search && (
                                    <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.5 }}>RECENT</span>
                                )}
                                {i === selectedIndex && <span style={{ marginLeft: 'auto', fontSize: '14px', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>⏎</span>}
                            </div>
                        ))
                    )}
                </div>
                <div className="p-2 border-top bg-surface flex justify-between px-4 text-xs text-secondary">
                    <span>ProTip: Use arrows to navigate</span>
                    <span>Nalyse OS v2.0</span>
                </div>
            </div>
        </div>
    );
};
