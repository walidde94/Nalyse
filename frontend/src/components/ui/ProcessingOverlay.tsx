import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CloudUpload,
    ShieldCheck,
    BrainCircuit,
    Zap,
    BarChart3,
    CheckCircle2,
    Loader2,
    Activity,
    Lock,
    XCircle,
    ArrowRight,
    RefreshCw
} from 'lucide-react';

interface ProcessingOverlayProps {
    isVisible: boolean;
    stage: number; // 0 to 4
    status?: 'processing' | 'completed' | 'error';
    errorDetails?: string;
    onViewResults?: () => void;
    onRetry?: () => void;
    onClose?: () => void;
}

const STAGES = [
    {
        id: 0,
        label: "Uploading Assets",
        desc: "Transmitting encrypted knowledge vectors to the secure elastic vault.",
        icon: CloudUpload,
        color: "#3b82f6",
        audit: "AES-256 Protocol // Active"
    },
    {
        id: 1,
        label: "Validating Schema",
        desc: "Normalizing dimensions and purifying dataset entities for analysis.",
        icon: ShieldCheck,
        color: "#10b981",
        audit: "Dimensional Integrity // Verified"
    },
    {
        id: 2,
        label: "Neural Processing",
        desc: "Synthesizing causality patterns and identifying institutional trends.",
        icon: BrainCircuit,
        color: "#8b5cf6",
        audit: "Cognitive Engine // Processing"
    },
    {
        id: 3,
        label: "Strategy Generation",
        desc: "Manifesting executive findings and strategic ROI frameworks.",
        icon: Zap,
        color: "#f59e0b",
        audit: "Reasoning Phase // 88% Complete"
    },
    {
        id: 4,
        label: "Knowledge Manifest",
        desc: "Neural synthesis complete. The strategic surface is now available.",
        icon: BarChart3,
        color: "#ec4899",
        audit: "Surface Ready // Manifested"
    }
];

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
    isVisible,
    stage,
    status = 'processing',
    errorDetails,
    onViewResults,
    onRetry,
    onClose
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        };
    }, []);

    const currentStage = STAGES[Math.min(stage, STAGES.length - 1)];

    if (!mounted) {
        return null;
    }

    const modalContent = (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center p-6"
                    style={{
                        zIndex: 2147483647,
                        backgroundColor: 'rgba(2, 6, 23, 0.98)',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'auto'
                    }}
                >
                    {/* Background Visual Enhancements */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[200px] rounded-full opacity-30 animate-pulse" />
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 1.1, y: -30, opacity: 0 }}
                        className="relative w-full max-w-lg bg-[#0a0f1e] border border-white/10 shadow-2xl overflow-hidden"
                        style={{ borderRadius: '32px', display: 'flex', flexDirection: 'column' }}
                    >
                        {/* Header Section */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${status === 'error' ? 'bg-danger' : 'bg-success'} shadow-[0_0_15px] ${status === 'error' ? 'shadow-danger/50' : 'shadow-success/50'} animate-pulse`} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                                    {status === 'error' ? 'Neural Link Error' : 'Neural Core Processing'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 opacity-30">
                                <Activity size={14} className="text-primary" />
                                <Lock size={14} className="text-secondary" />
                            </div>
                        </div>

                        {/* Main Body - Centered Layout */}
                        <div className="p-8 md:p-10 flex flex-col items-center gap-8 overflow-y-auto max-h-[80vh]">

                            {/* Central Visual Orb - Container to prevent overlap */}
                            <div className="flex-shrink-0 relative w-44 h-44 flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border border-primary/20"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 rounded-full border border-dashed border-accent/20"
                                />

                                <div className={`relative z-10 p-8 rounded-[36px] bg-gradient-to-br ${status === 'error' ? 'from-danger to-orange-700' : status === 'completed' ? 'from-emerald-500 to-success shadow-xl shadow-success/20' : 'from-primary via-blue-600 to-purple-600'} text-white`}>
                                    {status === 'error' ? <XCircle size={48} /> : status === 'completed' ? <CheckCircle2 size={48} /> : <currentStage.icon size={48} />}
                                </div>
                            </div>

                            {/* Descriptive Text Section */}
                            <div className="text-center space-y-3 w-full">
                                <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${status === 'completed' ? 'text-emerald-400' : 'text-white'}`}>
                                    {status === 'error' ? 'System Interruption' : status === 'completed' ? 'Process Complete' : currentStage.label}
                                </h2>
                                <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-[340px] mx-auto">
                                    {status === 'error' ? (errorDetails || 'A structural anomaly was detected in the data stream.') : status === 'completed' ? 'Knowledge map is finalized. Your strategic dashboard is ready.' : currentStage.desc}
                                </p>
                            </div>

                            {/* Sequential Steps List */}
                            {status !== 'completed' && (
                                <div className="w-full flex flex-col gap-3">
                                    {STAGES.map((s, idx) => {
                                        const isCurrent = idx === stage && status === 'processing';
                                        const isFinished = idx < stage;
                                        const isErrorLine = idx === stage && status === 'error';

                                        return (
                                            <div
                                                key={s.id}
                                                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all duration-500 ${isCurrent ? 'bg-primary/10 border-primary/30' : 'bg-white/[0.02] border-white/5'} ${idx > stage ? 'opacity-20' : 'opacity-100'}`}
                                            >
                                                <div className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center border ${isFinished ? 'bg-success border-success text-white' : isCurrent ? 'border-primary text-primary' : isErrorLine ? 'bg-danger border-danger text-white' : 'border-white/10'}`}>
                                                    {isFinished ? <CheckCircle2 size={16} strokeWidth={3} /> : isCurrent ? <Loader2 size={14} className="animate-spin" /> : isErrorLine ? <XCircle size={16} /> : null}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-bold truncate ${isCurrent ? 'text-white' : 'text-white/40'}`}>
                                                        {s.label}
                                                    </div>
                                                    {isCurrent && <div className="text-[10px] font-mono text-primary uppercase tracking-tighter">{s.audit}</div>}
                                                </div>
                                                {isCurrent && <span className="flex-shrink-0 text-[10px] font-black text-primary animate-pulse uppercase tracking-widest hidden sm:inline">Active</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Bottom Strategy Actions */}
                            <div className="w-full flex flex-col gap-4">
                                {status === 'completed' ? (
                                    <>
                                        <button
                                            onClick={onViewResults}
                                            className="w-full py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-success/20 active:scale-[0.98] flex items-center justify-center gap-3"
                                        >
                                            View Strategic Surface <ArrowRight size={20} />
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="w-full py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
                                        >
                                            Dismiss Control Panel
                                        </button>
                                    </>
                                ) : status === 'error' ? (
                                    <>
                                        <button
                                            onClick={onRetry}
                                            className="w-full py-5 rounded-2xl bg-danger text-white font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-danger/20 active:scale-[0.98] flex items-center justify-center gap-3"
                                        >
                                            <RefreshCw size={18} /> Initiate Emergency Pulse
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="w-full py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
                                        >
                                            Cancel Operation
                                        </button>
                                    </>
                                ) : (
                                    <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40">Core Integrity</span>
                                            <span className="text-2xl font-black text-primary font-mono">{Math.round((stage + 1) / STAGES.length * 100)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(stage + 1) / STAGES.length * 100}%` }}
                                                className="h-full bg-gradient-to-r from-primary to-blue-400"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Institutional Footer */}
                        <div className="bg-black/40 px-8 py-5 border-t border-white/5 flex justify-between items-center">
                            <div className="flex gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-white/30 uppercase font-black">System ID</span>
                                    <span className="text-[10px] font-mono text-white/60">NALYSE-800-X</span>
                                </div>
                                <div className="flex-col hidden xs:flex">
                                    <span className="text-[8px] text-white/30 uppercase font-black">Security</span>
                                    <span className="text-[10px] font-mono text-white/60">ACTIVE</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                <span className="text-[9px] font-black text-success uppercase tracking-widest">Neural Link SECURE</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
