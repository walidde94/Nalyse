import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, TrendingUp, Users, PackageSearch, 
    Megaphone, Cpu, Briefcase, ChevronRight, Upload, Play, Beaker, Star
} from 'lucide-react';

import { Database } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface FileData {
    id: string;
    filename: string;
    originalName?: string;
}

interface BiSelectionViewProps {
    files?: FileData[];
    onSelectExistingFile?: (fileId: string, type: string) => void;
    onUploadFile: (file: File, type: string) => void;
}

export const BiSelectionView = ({ files = [], onSelectExistingFile, onUploadFile }: BiSelectionViewProps) => {
    const { t } = useLanguage();
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<string>('');
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedType) {
            onUploadFile(e.target.files[0], selectedType);
            setSelectedType(null);
            setSelectedFileId('');
        }
    };

    const handleExistingFileConfirm = () => {
        if (selectedFileId && selectedType && onSelectExistingFile) {
            onSelectExistingFile(selectedFileId, selectedType);
            setSelectedType(null);
            setSelectedFileId('');
        }
    };

    const TEMPLATES = [
        { 
            id: 'sales', 
            icon: <TrendingUp size={24} />, 
            titleKey: 'bi.sales.title', 
            descKey: 'bi.sales.desc', 
            columns: ['Date', 'Product', 'Revenue', 'Units Sold'],
            color: '#34d399', 
            gradient: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.1))',
            glow: 'rgba(52,211,153,0.2)'
        },
        { 
            id: 'retention', 
            icon: <Users size={24} />, 
            titleKey: 'bi.retention.title', 
            descKey: 'bi.retention.desc', 
            columns: ['User ID', 'Plan', 'Retention Score', 'Last Login'],
            color: '#60a5fa', 
            gradient: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(59,130,246,0.1))',
            glow: 'rgba(96,165,250,0.2)'
        },
        { 
            id: 'supply', 
            icon: <PackageSearch size={24} />, 
            titleKey: 'bi.supply.title', 
            descKey: 'bi.supply.desc', 
            columns: ['SKU', 'Stock Level', 'Reorder Point', 'Supplier ID'],
            color: '#f59e0b', 
            gradient: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.1))',
            glow: 'rgba(245,158,11,0.2)'
        },
        { 
            id: 'marketing', 
            icon: <Megaphone size={24} />, 
            titleKey: 'bi.marketing.title', 
            descKey: 'bi.marketing.desc', 
            columns: ['Campaign', 'Channel', 'Spend', 'Cost Per Lead'],
            color: '#ec4899', 
            gradient: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(219,39,119,0.1))',
            glow: 'rgba(236,72,153,0.2)'
        },
        { 
            id: 'product', 
            icon: <Cpu size={24} />, 
            titleKey: 'bi.product.title', 
            descKey: 'bi.product.desc', 
            columns: ['Session ID', 'Feature', 'Active Users', 'Avg Duration'],
            color: '#8b5cf6', 
            gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(124,58,237,0.1))',
            glow: 'rgba(139,92,246,0.2)'
        },
        { 
            id: 'executive', 
            icon: <Briefcase size={24} />, 
            titleKey: 'bi.executive.title', 
            descKey: 'bi.executive.desc', 
            columns: ['Month', 'Total Revenue', 'Net Profit', 'OpEx'],
            color: '#eab308', 
            gradient: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(202,138,4,0.1))',
            glow: 'rgba(234,179,8,0.2)'
        },
    ];

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 40px)', position: 'relative' }}>
            
            {/* Background Ambient Glows */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ marginBottom: '40px', position: 'relative', zIndex: 10 }}>
                <div className="flex items-center gap-4" style={{ marginBottom: '12px' }}>
                    <div style={{ 
                        width: '56px', height: '56px', borderRadius: '18px', 
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', 
                        border: '1px solid rgba(139,92,246,0.3)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(139,92,246,0.15)'
                    }}>
                        <LayoutDashboard size={28} style={{ color: '#8b5cf6' }} />
                    </div>
                    <div>
                        <h1 style={{ 
                            fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', 
                            background: 'linear-gradient(135deg, #60a5fa 0%, #8b5cf6 50%, #ec4899 100%)', 
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' 
                        }}>
                            {t('bi.select.title')}
                        </h1>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
                            {t('bi.select.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
                gap: '24px',
                position: 'relative',
                zIndex: 10
            }}>
                {TEMPLATES.map((tmpl, i) => (
                    <motion.div
                        key={tmpl.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onMouseEnter={() => setHoveredCard(tmpl.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => setSelectedType(tmpl.id)}
                        style={{ 
                            padding: '32px', 
                            borderRadius: '20px', 
                            background: 'var(--bg-secondary)', 
                            border: `1px solid ${hoveredCard === tmpl.id ? tmpl.color : 'var(--border-default)'}`, 
                            position: 'relative', 
                            overflow: 'hidden', 
                            cursor: 'pointer',
                            boxShadow: hoveredCard === tmpl.id ? `0 20px 40px -12px ${tmpl.glow}` : '0 10px 30px -10px rgba(0,0,0,0.3)',
                            transition: 'border 0.3s ease, box-shadow 0.3s ease'
                        }}
                    >
                        {/* Dynamic Top Border */}
                        <div style={{ 
                            position: 'absolute', top: 0, left: 0, right: 0, height: '3px', 
                            background: tmpl.color,
                            opacity: hoveredCard === tmpl.id ? 1 : 0.4,
                            transition: 'opacity 0.3s ease' 
                        }} />
                        
                        {/* Subtle Background Icon */}
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.03, transform: 'scale(4)' }}>
                            {tmpl.icon}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ 
                                width: '48px', height: '48px', borderRadius: '14px', 
                                background: tmpl.gradient, border: `1px solid ${tmpl.glow}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: tmpl.color
                            }}>
                                {tmpl.icon}
                            </div>
                            <div style={{ 
                                width: '32px', height: '32px', borderRadius: '50%', 
                                background: hoveredCard === tmpl.id ? tmpl.glow : 'var(--bg-elevated)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: hoveredCard === tmpl.id ? tmpl.color : 'var(--text-tertiary)',
                                transition: 'all 0.3s ease'
                            }}>
                                <ChevronRight size={16} />
                            </div>
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                            {t(tmpl.titleKey)}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                            {t(tmpl.descKey)}
                        </p>

                        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                                {t('bi.expectedColumns')}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {tmpl.columns.map(col => (
                                    <span key={col} style={{ 
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                        background: 'var(--bg-main)', border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".csv,.xlsx,.json"
                onChange={handleFileChange}
            />

            {/* Selection Modal */}
            <AnimatePresence>
                {selectedType && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
                            backdropFilter: 'blur(12px)'
                        }} 
                        onClick={() => setSelectedType(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            style={{ 
                                width: '440px', padding: '0', borderRadius: '24px', 
                                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', 
                                boxShadow: '0 32px 64px -16px rgba(0,0,0,0.8)', overflow: 'hidden'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ position: 'relative', padding: '32px 32px 24px', textAlign: 'center' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: TEMPLATES.find(tmpl => tmpl.id === selectedType)?.color }} />
                                
                                <div style={{ 
                                    width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto 20px',
                                    background: TEMPLATES.find(tmpl => tmpl.id === selectedType)?.gradient, 
                                    border: `1px solid ${TEMPLATES.find(tmpl => tmpl.id === selectedType)?.glow}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: TEMPLATES.find(tmpl => tmpl.id === selectedType)?.color,
                                    boxShadow: `0 8px 32px ${TEMPLATES.find(tmpl => tmpl.id === selectedType)?.glow}`
                                }}>
                                    {TEMPLATES.find(tmpl => tmpl.id === selectedType)?.icon}
                                </div>
                                
                                <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                                    {(() => { const found = TEMPLATES.find(tmpl => tmpl.id === selectedType); return found ? t(found.titleKey) : ''; })()}
                                </h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    Provide a dataset matching the required schema to generate your intelligence dashboard instantly.
                                </p>
                            </div>

                            <div style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                
                                {/* Existing File Selector */}
                                {files.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: '4px' }}>
                                            Select Workspace Dataset
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <Database size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                                <select 
                                                    value={selectedFileId} 
                                                    onChange={e => setSelectedFileId(e.target.value)}
                                                    style={{ 
                                                        width: '100%', height: '48px', padding: '0 16px 0 40px', borderRadius: '12px',
                                                        background: 'var(--bg-main)', border: '1px solid var(--border-default)', 
                                                        color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500,
                                                        appearance: 'none', cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="" disabled>{t('bi.chooseFile')}</option>
                                                    {files.map(f => (
                                                        <option key={f.id} value={f.id}>{f.originalName || f.filename}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight size={14} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                onClick={handleExistingFileConfirm}
                                                disabled={!selectedFileId}
                                                style={{ 
                                                    height: '48px', padding: '0 24px', borderRadius: '12px', border: 'none',
                                                    background: 'var(--primary)', color: '#fff', fontSize: '14px', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                    cursor: selectedFileId ? 'pointer' : 'not-allowed', 
                                                    opacity: selectedFileId ? 1 : 0.5,
                                                    boxShadow: selectedFileId ? '0 8px 20px var(--primary-glow)' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {t('bi.launchDashboard')}
                                            </motion.button>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '4px 0' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('bi.uploadNew')}</span>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ 
                                        width: '100%', height: '56px', borderRadius: '14px', 
                                        background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', 
                                        color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-default)'; e.currentTarget.style.borderColor = 'var(--text-tertiary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                                >
                                    <Upload size={18} style={{ color: 'var(--text-tertiary)' }} /> Upload External CSV / JSON
                                </motion.button>
                                
                                <button 
                                    onClick={() => { setSelectedType(null); setSelectedFileId(''); }} 
                                    style={{ 
                                        width: '100%', padding: '12px', background: 'transparent', border: 'none',
                                        color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600,
                                        cursor: 'pointer', marginTop: '4px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BiSelectionView;
