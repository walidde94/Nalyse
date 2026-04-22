import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

/* ─── Sparkline ─── */
export const Spark = ({ data, color, w = 60, h = 24 }: { data: number[]; color: string; w?: number; h?: number }) => {
    if (!data.length) return null;
    const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <polygon points={`${pts} ${w},${h} 0,${h}`} fill={`url(#sg-${color.replace('#', '')})`} />
        </svg>
    );
};

/* ─── Score Ring ─── */
export const ScoreRing = ({ value, label, size = 100, stroke = 8 }: { value: number; label: string; size?: number; stroke?: number }) => {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (Math.min(value, 100) / 100) * circ;
    const color = value >= 90 ? '#10b981' : value >= 70 ? '#6366f1' : value >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
                <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                    strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} strokeLinecap="round" />
            </svg>
            <div style={{ textAlign: 'center', zIndex: 1 }}>
                <div style={{ fontSize: size * 0.22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value}%</div>
                <div style={{ fontSize: size * 0.09, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
            </div>
        </div>
    );
};

/* ─── Status Badge ─── */
export const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
        active: { label: 'ACTIVE', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        paused: { label: 'PAUSED', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        success: { label: 'SUCCESS', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        failed: { label: 'FAILED', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        pending: { label: 'PENDING', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    };
    const s = map[status] || map.paused;
    return (
        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.color, background: s.bg, border: `1px solid ${s.color}22`, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            {s.label}
        </span>
    );
};

/* ─── Stat Card ─── */
export const StatCard = ({ label, value, trend, up, data, color }: { label: string; value: string; trend: string; up: boolean; data: number[]; color: string }) => (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
            <div style={{ fontSize: 11, fontWeight: 800, color: up ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {trend}
            </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>{value}</div>
            <Spark data={data} color={color} />
        </div>
    </div>
);

/* ─── Run Status Icon ─── */
export const RunStatusIcon = ({ status }: { status: string }) => {
    if (status === 'success') return <CheckCircle2 size={18} style={{ color: '#10b981' }} />;
    if (status === 'failed') return <AlertTriangle size={18} style={{ color: '#ef4444' }} />;
    return <Clock size={18} style={{ color: '#6366f1' }} />;
};

/* ─── CRON human readable ─── */
export const cronToHuman = (cron: string): string => {
    const map: Record<string, string> = {
        '0 9 * * *': 'Every day at 9:00 AM',
        '0 18 * * *': 'Every day at 6:00 PM',
        '0 0 * * 1': 'Every Monday at midnight',
        '0 9 1 * *': '1st of month at 9:00 AM',
        '0 6 1 * *': '1st of month at 6:00 AM',
        '0 18 * * 5': 'Every Friday at 6:00 PM',
        '0 8 * * *': 'Every day at 8:00 AM',
    };
    return map[cron] || cron;
};

/* ─── Priority Badge ─── */
export const PriorityBadge = ({ priority }: { priority?: string }) => {
    const colors: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', normal: '#6366f1', low: '#64748b' };
    const c = colors[priority || 'normal'] || colors.normal;
    return (
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: c, padding: '2px 8px', borderRadius: 4, background: `${c}15`, border: `1px solid ${c}30` }}>
            {priority || 'normal'}
        </span>
    );
};

/* ─── Shared Styles ─── */
export const AUTOMATION_STYLES = `
    .glass-panel { background: rgba(255,255,255,0.02); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
    .glass-button { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); transition: all 0.2s; cursor: pointer; }
    .glass-button:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.2); }
    .auto-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px 16px; borderRadius: 12px; color: #fff; outline: none; transition: all 0.2s; width: 100%; box-sizing: border-box; font-size: 13px; border-radius: 12px; }
    .auto-input:focus { border-color: #6366f1 !important; background: rgba(255,255,255,0.08) !important; box-shadow: 0 0 15px rgba(99,102,241,0.1); }
    .auto-tab { padding: 10px 20px; border-radius: 10px; border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
    .template-card { transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden; }
    .template-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.4); }
    .template-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; transition: height 0.3s; }
    .template-card:hover::before { height: 4px; }
    .pipeline-card { transition: all 0.25s ease; }
    .pipeline-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.15) !important; }
`;

/* ─── Template Icon Map ─── */
export const TEMPLATE_ICONS: Record<string, string> = {
    briefcase: '💼', shield: '🛡️', server: '🖥️', landmark: '🏛️', users: '👥', database: '🗃️'
};
