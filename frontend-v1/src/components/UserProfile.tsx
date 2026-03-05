import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, LogOut, Settings, Bell, Shield, Camera, X,
    Sparkles, Crown, Zap, Activity, Calendar, Clock,
    MapPin, Globe, Mail, Edit3, Check, TrendingUp,
    BarChart3, Award, Star, ChevronRight, Copy
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/Toast';

interface UserProfileProps {
    onClose: () => void;
    onOpenSettings?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED AVATAR RING — Rotating gradient border
// ═══════════════════════════════════════════════════════════════
const AvatarRing: React.FC<{ avatarUrl?: string; initials: string; size?: number; onClick?: () => void }> = ({ avatarUrl, initials, size = 120, onClick }) => {
    return (
        <div
            role="button"
            tabIndex={onClick ? 0 : -1}
            aria-label={onClick ? "Change profile picture" : "Avatar"}
            onClick={onClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
            style={{
                position: 'relative',
                width: size,
                height: size,
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            {/* Outer animated glow */}
            <div style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #6366f1, #ec4899, #f59e0b, #10b981, #3b82f6, #8b5cf6, #6366f1)',
                animation: 'avatar-ring-spin 4s linear infinite',
                opacity: 0.8,
                filter: 'blur(2px)',
            }} />
            {/* Inner ring */}
            <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #6366f1, #ec4899, #f59e0b, #10b981, #3b82f6, #8b5cf6, #6366f1)',
                animation: 'avatar-ring-spin 4s linear infinite',
                padding: 3,
            }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'var(--bg-card)',
                    padding: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: size * 0.35,
                            fontWeight: 800,
                            color: 'white',
                            fontFamily: 'var(--font-heading)',
                            letterSpacing: '-0.02em',
                        }}>
                            {initials}
                        </div>
                    )}
                </div>
            </div>
            {/* Camera overlay on hover */}
            {onClick && (
                <div style={{
                    position: 'absolute',
                    inset: 3,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    cursor: 'pointer',
                    zIndex: 2,
                }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                    <Camera size={24} color="white" />
                </div>
            )}
            {/* Online status dot */}
            <div style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#10b981',
                border: '3px solid var(--bg-card)',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                zIndex: 3,
            }} />
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// ACTIVITY HEATMAP — GitHub-style contribution visualization
// ═══════════════════════════════════════════════════════════════
const ActivityHeatmap: React.FC = () => {
    const weeks = 12;
    const days = 7;
    const dayLabels = ['M', '', 'W', '', 'F', '', ''];

    // Generate deterministic but realistic-looking data
    const getCellIntensity = useCallback((week: number, day: number) => {
        const seed = (week * 7 + day) * 2654435761;
        const val = ((seed >>> 0) % 100);
        if (val < 30) return 0;
        if (val < 55) return 1;
        if (val < 75) return 2;
        if (val < 90) return 3;
        return 4;
    }, []);

    const intensityColors = [
        'rgba(255,255,255,0.04)',
        'rgba(99, 102, 241, 0.2)',
        'rgba(99, 102, 241, 0.4)',
        'rgba(99, 102, 241, 0.65)',
        'rgba(99, 102, 241, 0.9)',
    ];

    return (
        <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4, paddingTop: 0 }}>
                {dayLabels.map((l, i) => (
                    <div key={i} style={{ height: 12, fontSize: 9, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                        {l}
                    </div>
                ))}
            </div>
            {Array.from({ length: weeks }).map((_, w) => (
                <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {Array.from({ length: days }).map((_, d) => {
                        const intensity = getCellIntensity(w, d);
                        return (
                            <div
                                key={d}
                                style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 3,
                                    background: intensityColors[intensity],
                                    transition: 'transform 0.2s, background 0.2s',
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'scale(1.4)';
                                    e.currentTarget.style.background = 'var(--primary)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.background = intensityColors[intensity];
                                }}
                                title={`${intensity} analyses`}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// STAT ORBS — Animated metric displays
// ═══════════════════════════════════════════════════════════════
const StatOrb: React.FC<{ icon: React.ReactNode; value: string; label: string; color: string; delay?: number }> = ({ icon, value, label, color, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay }}
        style={{
            flex: 1,
            padding: '16px 12px',
            borderRadius: 16,
            background: `linear-gradient(135deg, ${color}08, ${color}04)`,
            border: `1px solid ${color}20`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
        }}
        whileHover={{ y: -4, scale: 1.02 }}
    >
        <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color,
        }}>
            {icon}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            {value}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
            {label}
        </div>
    </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENT BADGES
// ═══════════════════════════════════════════════════════════════
const AchievementBadge: React.FC<{ icon: React.ReactNode; title: string; color: string; unlocked: boolean }> = ({ icon, title, color, unlocked }) => (
    <div
        title={title}
        style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: unlocked ? `${color}15` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${unlocked ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: unlocked ? color : 'var(--text-disabled)',
            opacity: unlocked ? 1 : 0.4,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
        }}
        onMouseEnter={e => {
            if (unlocked) {
                e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)';
                e.currentTarget.style.boxShadow = `0 4px 20px ${color}30`;
            }
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        {icon}
    </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN PROFILE COMPONENT
// ═══════════════════════════════════════════════════════════════
export const UserProfile: React.FC<UserProfileProps> = ({ onClose, onOpenSettings }) => {
    const { user, logout, refreshProfile } = useAuth();
    const { addToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        bio: user?.bio || '',
        displayName: user?.displayName || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'overview' | 'activity' | 'achievements'>('overview');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await refreshProfile();
                addToast('Neural identity updated', 'success');
                setIsEditing(false);
            } else {
                addToast('Failed to update profile', 'error');
            }
        } catch (error) {
            addToast('Error updating profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('accessToken');

        try {
            const uploadRes = await fetch(`${API_URL}/api/files/upload?type=avatar`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const { file: newFile } = await uploadRes.json();
            const newAvatarUrl = `${API_URL}/uploads/${newFile.filename}`;

            const updateRes = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ avatarUrl: newAvatarUrl })
            });

            if (updateRes.ok) {
                await refreshProfile();
                addToast('Avatar evolved successfully', 'success');
            }
        } catch (error) {
            console.error(error);
            addToast('Failed to upload picture', 'error');
        }
    };

    const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}`;
    const isPro = (user as any)?.organization?.plan === 'pro' || (user as any)?.plan === 'pro';
    const memberSince = user?.organization?.subscriptionStartedAt
        ? new Date(user.organization.subscriptionStartedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Jan 2026';

    const sectionTabs = [
        { id: 'overview', label: 'Overview', icon: <User size={14} /> },
        { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
        { id: 'achievements', label: 'Badges', icon: <Award size={14} /> },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(20px)',
                    padding: 20,
                }}
                onClick={onClose}
            >
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="profile-title"
                    initial={{ scale: 0.92, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.92, y: 30, opacity: 0 }}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.25 }}
                    onClick={e => e.stopPropagation()}
                    className="card glass-modal"
                    style={{
                        maxWidth: 520,
                        width: '100%',
                        padding: 0,
                        position: 'relative',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        borderRadius: 24,
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5), 0 0 80px -20px rgba(99, 102, 241, 0.15)',
                    }}
                >
                    {/* ─── HERO HEADER ─── */}
                    <div style={{
                        position: 'relative',
                        padding: '32px 32px 24px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.06) 50%, rgba(245, 158, 11, 0.04) 100%)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        {/* Ambient mesh gradient behind avatar */}
                        <div style={{
                            position: 'absolute',
                            top: -30,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 250,
                            height: 250,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                            filter: 'blur(40px)',
                            pointerEvents: 'none',
                        }} />

                        {/* Close button */}
                        <motion.button
                            aria-label="Close profile"
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: 16, right: 16,
                                width: 32, height: 32,
                                borderRadius: 10,
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <X size={16} />
                        </motion.button>

                        {/* Avatar + Identity */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
                            <AvatarRing
                                avatarUrl={user?.avatarUrl}
                                initials={userInitials}
                                size={110}
                                onClick={() => fileInputRef.current?.click()}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleAvatarUpload}
                            />

                            <div style={{ textAlign: 'center' }}>
                                {!isEditing ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                                            <h2 id="profile-title" style={{
                                                fontSize: 22,
                                                fontWeight: 800,
                                                fontFamily: 'var(--font-heading)',
                                                color: 'var(--text-primary)',
                                                letterSpacing: '-0.02em',
                                                margin: 0,
                                            }}>
                                                {user?.firstName} {user?.lastName}
                                            </h2>
                                            {isPro && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    padding: '3px 10px',
                                                    borderRadius: 8,
                                                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                                    boxShadow: '0 2px 12px rgba(255, 215, 0, 0.3)',
                                                }}>
                                                    <Crown size={10} color="#000" />
                                                    <span style={{ fontSize: 9, fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PRO</span>
                                                </div>
                                            )}
                                        </div>
                                        <p style={{
                                            fontSize: 13,
                                            color: 'var(--text-secondary)',
                                            margin: '4px 0 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                        }}>
                                            <Mail size={12} />
                                            {user?.email}
                                        </p>
                                        {user?.bio && (
                                            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '8px 0 0', maxWidth: 320, lineHeight: 1.5 }}>
                                                {user.bio}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360, margin: '0 auto' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <input
                                                type="text"
                                                className="input"
                                                aria-label="First Name"
                                                value={formData.firstName}
                                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                placeholder="First Name"
                                                style={{ fontSize: 13, padding: '10px 14px', borderRadius: 12 }}
                                            />
                                            <input
                                                type="text"
                                                className="input"
                                                aria-label="Last Name"
                                                value={formData.lastName}
                                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                placeholder="Last Name"
                                                style={{ fontSize: 13, padding: '10px 14px', borderRadius: 12 }}
                                            />
                                        </div>
                                        <textarea
                                            className="input"
                                            aria-label="Bio"
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                            maxLength={240}
                                            style={{ fontSize: 13, padding: '10px 14px', borderRadius: 12, height: 70, resize: 'none' }}
                                        />
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="btn btn-primary btn-sm"
                                                style={{ borderRadius: 10, padding: '8px 24px', gap: 6 }}
                                            >
                                                <Check size={14} />
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setFormData({
                                                        firstName: user?.firstName || '',
                                                        lastName: user?.lastName || '',
                                                        email: user?.email || '',
                                                        bio: user?.bio || '',
                                                        displayName: user?.displayName || '',
                                                    });
                                                }}
                                                className="btn btn-ghost btn-sm"
                                                style={{ borderRadius: 10, padding: '8px 16px' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick tags */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '5px 12px', borderRadius: 20,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500,
                                }}>
                                    <Globe size={11} />
                                    {user?.organization?.name || 'Personal'}
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '5px 12px', borderRadius: 20,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500,
                                }}>
                                    <Calendar size={11} />
                                    Since {memberSince}
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '5px 12px', borderRadius: 20,
                                    background: 'rgba(16, 185, 129, 0.08)',
                                    border: '1px solid rgba(16, 185, 129, 0.15)',
                                    fontSize: 11, color: '#10b981', fontWeight: 600,
                                }}>
                                    <Zap size={11} />
                                    Active Now
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── SECTION TABS ─── */}
                    <div style={{
                        display: 'flex',
                        padding: '0 24px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                    }}>
                        {sectionTabs.map(tab => {
                            const isActive = activeSection === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActiveSection(tab.id as any)}
                                    style={{
                                        flex: 1,
                                        padding: '14px 12px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                                        color: isActive ? 'var(--primary)' : 'var(--text-tertiary)',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        transition: 'all 0.2s ease',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ─── SECTION CONTENT ─── */}
                    <div style={{ padding: '20px 24px 24px' }}>
                        <AnimatePresence mode="wait">
                            {/* --- OVERVIEW TAB --- */}
                            {activeSection === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                                >
                                    {/* Quick Stats */}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <StatOrb icon={<BarChart3 size={18} />} value="142" label="Analyses" color="#6366f1" delay={0.1} />
                                        <StatOrb icon={<TrendingUp size={18} />} value="89%" label="Accuracy" color="#10b981" delay={0.2} />
                                        <StatOrb icon={<Zap size={18} />} value="7.2h" label="Avg / Week" color="#f59e0b" delay={0.3} />
                                    </div>

                                    {/* Info Cards */}
                                    <div style={{
                                        borderRadius: 14,
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        overflow: 'hidden',
                                    }}>
                                        {[
                                            { icon: <Mail size={15} />, label: 'Email', value: user?.email || '', copyable: true },
                                            { icon: <Shield size={15} />, label: 'Role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User' },
                                            { icon: <Globe size={15} />, label: 'Organization', value: user?.organization?.name || 'Personal Account' },
                                            { icon: <Star size={15} />, label: 'Plan', value: isPro ? 'Neural Pro' : 'Standard', highlight: isPro },
                                        ].map((item, i, arr) => (
                                            <div
                                                key={item.label}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '14px 16px',
                                                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                    transition: 'background 0.2s',
                                                    cursor: item.copyable ? 'pointer' : 'default',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                onClick={() => {
                                                    if (item.copyable) {
                                                        navigator.clipboard.writeText(item.value);
                                                        addToast('Copied to clipboard', 'success');
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
                                                    <div style={{ opacity: 0.5 }}>{item.icon}</div>
                                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                                                </div>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    color: item.highlight ? '#FFD700' : 'var(--text-primary)',
                                                }}>
                                                    {item.highlight && <Crown size={12} color="#FFD700" />}
                                                    {item.value}
                                                    {item.copyable && <Copy size={11} style={{ opacity: 0.3 }} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* --- ACTIVITY TAB --- */}
                            {activeSection === 'activity' && (
                                <motion.div
                                    key="activity"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                                >
                                    {/* Heatmap */}
                                    <div style={{
                                        padding: 20,
                                        borderRadius: 14,
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        background: 'rgba(255,255,255,0.02)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Analysis Activity</span>
                                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Last 12 weeks</span>
                                        </div>
                                        <ActivityHeatmap />
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 }}>
                                            <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Less</span>
                                            {['rgba(255,255,255,0.04)', 'rgba(99, 102, 241, 0.2)', 'rgba(99, 102, 241, 0.4)', 'rgba(99, 102, 241, 0.65)', 'rgba(99, 102, 241, 0.9)'].map((c, i) => (
                                                <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                                            ))}
                                            <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>More</span>
                                        </div>
                                    </div>

                                    {/* Recent Activity Timeline */}
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Recent Activity</div>
                                        {[
                                            { time: '2 hours ago', action: 'Analyzed financial_report.csv', icon: <BarChart3 size={13} />, color: '#6366f1' },
                                            { time: '5 hours ago', action: 'Generated anomaly detection report', icon: <Shield size={13} />, color: '#f43f5e' },
                                            { time: 'Yesterday', action: 'Shared analysis with team', icon: <Globe size={13} />, color: '#3b82f6' },
                                            { time: '2 days ago', action: 'Uploaded 3 new datasets', icon: <TrendingUp size={13} />, color: '#10b981' },
                                        ].map((item, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: '12px 0',
                                                    borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                }}
                                            >
                                                <div style={{
                                                    width: 30, height: 30, borderRadius: 8,
                                                    background: `${item.color}12`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: item.color,
                                                    flexShrink: 0,
                                                }}>
                                                    {item.icon}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.action}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.time}</div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* --- ACHIEVEMENTS TAB --- */}
                            {activeSection === 'achievements' && (
                                <motion.div
                                    key="achievements"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                                >
                                    {/* Level Progress */}
                                    <div style={{
                                        padding: 20,
                                        borderRadius: 14,
                                        border: '1px solid rgba(99, 102, 241, 0.15)',
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(236, 72, 153, 0.04))',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Sparkles size={16} color="#6366f1" />
                                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Level 12</span>
                                            </div>
                                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>2,450 / 3,000 XP</span>
                                        </div>
                                        <div style={{
                                            height: 8,
                                            borderRadius: 4,
                                            background: 'rgba(255,255,255,0.06)',
                                            overflow: 'hidden',
                                        }}>
                                            <motion.div
                                                initial={{ width: '0%' }}
                                                animate={{ width: '82%' }}
                                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                                                style={{
                                                    height: '100%',
                                                    borderRadius: 4,
                                                    background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                                                    boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
                                                }}
                                            />
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
                                            550 XP until <strong style={{ color: 'var(--text-secondary)' }}>Data Architect</strong>
                                        </div>
                                    </div>

                                    {/* Badge Grid */}
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Unlocked Badges</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                            <AchievementBadge icon={<Zap size={18} />} title="First Analysis" color="#f59e0b" unlocked={true} />
                                            <AchievementBadge icon={<BarChart3 size={18} />} title="10 Analyses" color="#6366f1" unlocked={true} />
                                            <AchievementBadge icon={<TrendingUp size={18} />} title="Trend Spotter" color="#10b981" unlocked={true} />
                                            <AchievementBadge icon={<Shield size={18} />} title="Security Pro" color="#f43f5e" unlocked={true} />
                                            <AchievementBadge icon={<Award size={18} />} title="100 Analyses" color="#ec4899" unlocked={true} />
                                            <AchievementBadge icon={<Star size={18} />} title="Star Analyst" color="#FFD700" unlocked={true} />
                                            <AchievementBadge icon={<Crown size={18} />} title="Data King" color="#8b5cf6" unlocked={false} />
                                            <AchievementBadge icon={<Sparkles size={18} />} title="AI Master" color="#06b6d4" unlocked={false} />
                                            <AchievementBadge icon={<Globe size={18} />} title="Sharing Hero" color="#3b82f6" unlocked={false} />
                                        </div>
                                    </div>

                                    {/* Recent Achievements */}
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Latest Unlocks</div>
                                        {[
                                            { badge: '⚡', title: 'Speed Demon', desc: 'Completed analysis in under 5 seconds', time: 'Today' },
                                            { badge: '🎯', title: 'Precision Master', desc: '95%+ accuracy on 10 consecutive analyses', time: '3 days ago' },
                                            { badge: '🏆', title: 'Century Club', desc: 'Reached 100 total analyses', time: '1 week ago' },
                                        ].map((item, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: '12px 14px',
                                                    borderRadius: 12,
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(255,255,255,0.04)',
                                                    marginBottom: 8,
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                                                }}
                                            >
                                                <div style={{ fontSize: 22 }}>{item.badge}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{item.time}</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ─── ACTION BAR ─── */}
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        gap: 8,
                        background: 'rgba(255,255,255,0.01)',
                    }}>
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ flex: 1, borderRadius: 12, padding: '10px', gap: 6 }}
                                >
                                    <Edit3 size={14} />
                                    Edit Profile
                                </button>
                                {onOpenSettings && (
                                    <button
                                        onClick={onOpenSettings}
                                        className="btn btn-ghost btn-sm"
                                        style={{ borderRadius: 12, padding: '10px 14px' }}
                                    >
                                        <Settings size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={logout}
                                    className="btn btn-ghost btn-sm"
                                    style={{ borderRadius: 12, padding: '10px 14px', color: 'var(--danger)' }}
                                >
                                    <LogOut size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Keyframe injection */}
            <style>{`
        @keyframes avatar-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </AnimatePresence>
    );
};
