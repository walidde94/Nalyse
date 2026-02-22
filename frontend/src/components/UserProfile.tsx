import React, { useState, useRef } from 'react';
import { User, LogOut, Settings, Bell, Shield, Camera, X } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
    onClose: () => void;
}



export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
    const { user, logout, refreshProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');

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
                setMessage('Profile updated successfully!');
                setIsEditing(false);
            } else {
                setMessage('Failed to update profile');
            }
        } catch (error) {
            setMessage('Error updating profile');
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
            // Upload
            const uploadRes = await fetch(`${API_URL}/api/files/upload?type=avatar`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const { file: newFile } = await uploadRes.json();
            const newAvatarUrl = `${API_URL}/uploads/${newFile.filename}`;

            // Update Profile
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
                setMessage('Profile picture updated!');
            }
        } catch (error) {
            console.error(error);
            setMessage('Failed to upload picture');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card" style={{
                maxWidth: '500px',
                width: '90%',
                padding: '32px',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        opacity: 0.6,
                        color: 'var(--text-primary)'
                    }}
                >
                    ✕
                </button>

                {/* Header with Avatar */}
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            margin: '0 auto 16px',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '4px solid var(--bg-surface)',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}
                        title="Click to upload profile picture"
                    >
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
                        )}

                        {/* Hover Overlay */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '24px',
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: 'white'
                        }}>
                            📷
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleAvatarUpload}
                    />

                    <h2 className="text-h2" style={{ marginBottom: '8px' }}>User Profile</h2>
                    <p className="text-secondary">{user?.email}</p>
                </div>

                {/* Message */}
                {message && (
                    <div className="fade-in" style={{
                        padding: '12px 16px',
                        background: message.includes('Success') || message.includes('successfully') || message.includes('updated') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${message.includes('success') || message.includes('updated') ? 'var(--success)' : 'var(--danger)'}`,
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '24px',
                        color: message.includes('success') || message.includes('updated') ? 'var(--success)' : 'var(--danger)',
                        fontSize: '14px'
                    }}>
                        {message}
                    </div>
                )}

                {/* Profile Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                    <div>
                        <label className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            First Name
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={!isEditing}
                        />
                    </div>

                    <div>
                        <label className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            Last Name
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={!isEditing}
                        />
                    </div>

                    <div>
                        <label className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            className="input"
                            value={formData.email}
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        />
                        <p className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                            Email cannot be changed
                        </p>
                    </div>

                    <div>
                        <label className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            Organization
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={user?.organization?.name || 'N/A'}
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        />
                    </div>

                    <div>
                        <label className="text-sm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            Plan
                        </label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {((user as any)?.organization?.plan === 'pro' || (user as any)?.plan === 'pro') ? (
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                    color: '#000',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                    Neural Pro
                                </span>
                            ) : (
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    Standard Tier
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn-primary"
                                style={{ width: '100%' }}
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={logout}
                                className="btn-secondary"
                                style={{ width: '100%' }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                className="btn-primary"
                                disabled={isSaving}
                                style={{ width: '100%' }}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        firstName: user?.firstName || '',
                                        lastName: user?.lastName || '',
                                        email: user?.email || ''
                                    });
                                }}
                                className="btn-secondary"
                                style={{ width: '100%' }}
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
