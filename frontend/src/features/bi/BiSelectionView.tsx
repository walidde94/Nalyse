import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, TrendingUp, Users, PackageSearch, 
    Megaphone, Cpu, Briefcase, ChevronRight, Upload, Play, Beaker, Star
} from 'lucide-react';

interface BiSelectionViewProps {
    onLoadDemo: (type: string) => void;
    onUploadFile: (file: File, type: string) => void;
}

export const BiSelectionView = ({ onLoadDemo, onUploadFile }: BiSelectionViewProps) => {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedType) {
            onUploadFile(e.target.files[0], selectedType);
            setSelectedType(null);
        }
    };

    const TEMPLATES = [
        { 
            id: 'sales', 
            icon: <TrendingUp size={24} />, 
            title: 'Sales & Revenue', 
            desc: 'Analyze financial performance, pipeline velocity, and regional sales distribution.', 
            columns: ['Date', 'Product', 'Revenue', 'Units Sold'],
            color: '#34d399', 
            gradient: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.1))',
            glow: 'rgba(52,211,153,0.2)'
        },
        { 
            id: 'retention', 
            icon: <Users size={24} />, 
            title: 'Customer Retention', 
            desc: 'Track churn rates, cohort survival, and user engagement over time.', 
            columns: ['User ID', 'Plan', 'Retention Score', 'Last Login'],
            color: '#60a5fa', 
            gradient: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(59,130,246,0.1))',
            glow: 'rgba(96,165,250,0.2)'
        },
        { 
            id: 'supply', 
            icon: <PackageSearch size={24} />, 
            title: 'Supply Chain', 
            desc: 'Monitor inventory levels, supplier performance, and reorder alerts.', 
            columns: ['SKU', 'Stock Level', 'Reorder Point', 'Supplier ID'],
            color: '#f59e0b', 
            gradient: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.1))',
            glow: 'rgba(245,158,11,0.2)'
        },
        { 
            id: 'marketing', 
            icon: <Megaphone size={24} />, 
            title: 'Marketing ROI', 
            desc: 'Evaluate campaign spend, conversion funnels, and cost per acquisition.', 
            columns: ['Campaign', 'Channel', 'Spend', 'Cost Per Lead'],
            color: '#ec4899', 
            gradient: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(219,39,119,0.1))',
            glow: 'rgba(236,72,153,0.2)'
        },
        { 
            id: 'product', 
            icon: <Cpu size={24} />, 
            title: 'Product Analytics', 
            desc: 'Understand feature usage, session duration, and user pathways.', 
            columns: ['Session ID', 'Feature', 'Active Users', 'Avg Duration'],
            color: '#8b5cf6', 
            gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(124,58,237,0.1))',
            glow: 'rgba(139,92,246,0.2)'
        },
        { 
            id: 'executive', 
            icon: <Briefcase size={24} />, 
            title: 'Executive Summary', 
            desc: 'High-level macroscopic view of business health, P&L, and strategic targets.', 
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
                            BI Intelligence Dashboards
                        </h1>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
                            Select an analytical vector to instantiate your AI-powered visualization canvas.
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
                {TEMPLATES.map((t, i) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onMouseEnter={() => setHoveredCard(t.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => setSelectedType(t.id)}
                        style={{ 
                            padding: '32px', 
                            borderRadius: '20px', 
                            background: 'var(--bg-secondary)', 
                            border: `1px solid ${hoveredCard === t.id ? t.color : 'var(--border-default)'}`, 
                            position: 'relative', 
                            overflow: 'hidden', 
                            cursor: 'pointer',
                            boxShadow: hoveredCard === t.id ? `0 20px 40px -12px ${t.glow}` : '0 10px 30px -10px rgba(0,0,0,0.3)',
                            transition: 'border 0.3s ease, box-shadow 0.3s ease'
                        }}
                    >
                        {/* Dynamic Top Border */}
                        <div style={{ 
                            position: 'absolute', top: 0, left: 0, right: 0, height: '3px', 
                            background: t.color,
                            opacity: hoveredCard === t.id ? 1 : 0.4,
                            transition: 'opacity 0.3s ease' 
                        }} />
                        
                        {/* Subtle Background Icon */}
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.03, transform: 'scale(4)' }}>
                            {t.icon}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ 
                                width: '48px', height: '48px', borderRadius: '14px', 
                                background: t.gradient, border: `1px solid ${t.glow}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: t.color
                            }}>
                                {t.icon}
                            </div>
                            <div style={{ 
                                width: '32px', height: '32px', borderRadius: '50%', 
                                background: hoveredCard === t.id ? t.glow : 'var(--bg-elevated)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: hoveredCard === t.id ? t.color : 'var(--text-tertiary)',
                                transition: 'all 0.3s ease'
                            }}>
                                <ChevronRight size={16} />
                            </div>
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                            {t.title}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                            {t.desc}
                        </p>

                        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                                Required Schema
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {t.columns.map(col => (
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
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: TEMPLATES.find(t => t.id === selectedType)?.color }} />
                                
                                <div style={{ 
                                    width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto 20px',
                                    background: TEMPLATES.find(t => t.id === selectedType)?.gradient, 
                                    border: `1px solid ${TEMPLATES.find(t => t.id === selectedType)?.glow}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: TEMPLATES.find(t => t.id === selectedType)?.color,
                                    boxShadow: `0 8px 32px ${TEMPLATES.find(t => t.id === selectedType)?.glow}`
                                }}>
                                    {TEMPLATES.find(t => t.id === selectedType)?.icon}
                                </div>
                                
                                <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                                    Initialize {TEMPLATES.find(t => t.id === selectedType)?.title}
                                </h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    Provide a dataset matching the required schema to generate your intelligence dashboard instantly.
                                </p>
                            </div>

                            <div style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ 
                                        width: '100%', height: '56px', borderRadius: '14px', border: 'none',
                                        background: 'var(--primary)', color: '#fff', fontSize: '15px', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        cursor: 'pointer', boxShadow: '0 8px 24px var(--primary-glow)'
                                    }}
                                >
                                    <Upload size={18} /> Upload Dataset
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => { onLoadDemo(selectedType); setSelectedType(null); }}
                                    style={{ 
                                        width: '100%', height: '56px', borderRadius: '14px', 
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', 
                                        color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        cursor: 'pointer', transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                >
                                    <Beaker size={18} style={{ color: '#8b5cf6' }} /> Populate Demo Data
                                </motion.button>

                                <button 
                                    onClick={() => setSelectedType(null)} 
                                    style={{ 
                                        width: '100%', padding: '12px', background: 'transparent', border: 'none',
                                        color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600,
                                        cursor: 'pointer', marginTop: '8px'
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
