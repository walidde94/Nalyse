import { useState } from 'react';
import {
    LayoutList,
    LayoutGrid,
    Folder,
    Trash2,
    FileText,
    FileSpreadsheet,
    Star,
    CloudUpload,
    BrainCircuit,
    BarChart3,
    Zap,
    ShieldCheck
} from 'lucide-react';

export const DashboardView = ({
    userEmail,
    firstName,
    userPlan,
    files,
    groups,
    onUpload,
    onUpgrade,
    dragActive,
    handleDrag,
    handleDrop,
    onFileSelect,
    onDeleteFile,
    onToggleFavorite,
    onUpdateFileGroup,
    onCreateGroup,
    onDeleteGroup
}: any) => {

    const maxStorageMB = userPlan === 'pro' ? 10240 : userPlan === 'enterprise' ? 1000000 : 100;
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const safeFiles = Array.isArray(files) ? files : [];
    const safeGroups = Array.isArray(groups) ? groups : [];

    const filteredFiles = safeFiles.filter((f: any) => {
        return f.filename.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalStorage = (safeFiles.reduce((acc: number, f: any) => acc + Number(f.size), 0) / 1024 / 1024).toFixed(2);
    const fileCount = safeFiles.length;

    const totalStorageNum = Number(totalStorage);
    const isOverLimit = totalStorageNum >= maxStorageMB;
    const usagePercent = Math.min((totalStorageNum / maxStorageMB) * 100, 100);

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;
        onCreateGroup(newGroupName, '');
        setNewGroupName('');
        setShowCreateGroup(false);
    };

    // Group files for rendering
    const groupedFiles: Record<string, any[]> = { 'ungrouped': [] };
    safeGroups.forEach((g: any) => { groupedFiles[g.id] = []; });
    filteredFiles.forEach((f: any) => {
        if (f.groupId && groupedFiles[f.groupId]) {
            groupedFiles[f.groupId].push(f);
        } else {
            groupedFiles['ungrouped'].push(f);
        }
    });

    // ... (previous code)

    return (
        <div className="flex-col gap-6 fade-in main-content-mobile" style={{
            padding: 'clamp(16px, 5vw, 32px)',
            maxWidth: '1600px',
            margin: '0 auto',
            width: '100%',
            fontFamily: 'Dubai, sans-serif',
            position: 'relative'
        }}>
            <div className="bg-mesh"></div>

            <header className="mb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <span className="text-xs font-black tracking-[0.2em] text-[var(--primary)] uppercase mb-2 block">Enterprise Workspace</span>
                        <h1 className="text-h1" style={{ fontSize: 'clamp(28px, 5vw, 38px)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                            Welcome, <span className="text-gradient font-black">{firstName || userEmail?.split('@')[0]}</span>
                        </h1>
                        <p className="text-secondary mt-1">Orchestrating intelligence across {fileCount} core datasets.</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="card glass-morphism py-2 px-4 flex items-center gap-3 w-full md:w-auto">
                            <ShieldCheck size={16} className="text-success" />
                            <span className="text-xs font-bold">Node Security Level: <span className="text-success">Maximum</span></span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Stats cards - naturally responsive with grid */}
                    <div className="card hover-glow p-4 md:p-6 border-l-4 border-l-[var(--primary)]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-[var(--primary-subtle)] rounded-lg text-[var(--primary)]"><LayoutGrid size={20} /></div>
                            <span className="text-[10px] font-black opacity-30 uppercase">Analysis</span>
                        </div>
                        <h4 className="text-h4 text-secondary mb-1">Total Datasets</h4>
                        <div className="text-h2 font-black">{fileCount}</div>
                    </div>

                    <div className="card hover-glow p-4 md:p-6 border-l-4 border-l-[#8b5cf6]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-[#8b5cf61a] rounded-lg text-[#8b5cf6]"><BrainCircuit size={20} /></div>
                            <span className="text-[10px] font-black opacity-30 uppercase">Science</span>
                        </div>
                        <h4 className="text-h4 text-secondary mb-1">Active Insights</h4>
                        <div className="text-h2 font-black">24</div>
                    </div>

                    <div className="card hover-glow p-4 md:p-6 border-l-4 border-l-[#ec4899]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-[#ec48991a] rounded-lg text-[#ec4899]"><BarChart3 size={20} /></div>
                            <span className="text-[10px] font-black opacity-30 uppercase">Business BI</span>
                        </div>
                        <h4 className="text-h4 text-secondary mb-1">Live Boards</h4>
                        <div className="text-h2 font-black">12</div>
                    </div>

                    <div className="card hover-glow p-4 md:p-6 border-l-4 border-l-[#fbbf24]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-[#fbbf241a] rounded-lg text-[#fbbf24]"><Zap size={20} /></div>
                            <span className="text-[10px] font-black opacity-30 uppercase">Data Mesh</span>
                        </div>
                        <h4 className="text-h4 text-secondary mb-1">Storage Usage</h4>
                        <div className="flex items-center gap-2">
                            <div className="text-h2 font-black">{usagePercent.toFixed(0)}%</div>
                            <div className="text-xs text-tertiary mt-2">of {maxStorageMB >= 1024 ? (maxStorageMB / 1024).toFixed(0) + 'GB' : maxStorageMB + 'MB'}</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                    <div className="flex p-0.5 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg shadow-inner">
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <LayoutList size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    <div className="relative flex-1 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Filter datasets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input h-10 w-full md:w-64 text-sm"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {isOverLimit && <button className="btn btn-ghost btn-sm text-[var(--danger)]" onClick={onUpgrade}>Upgrade Plan</button>}
                    <button className="btn btn-secondary h-10 flex-1 md:flex-initial" onClick={() => setShowCreateGroup(true)}>
                        <Folder size={16} /> <span className="whitespace-nowrap">New Group</span>
                    </button>
                    <button
                        id="tour-upload-btn"
                        className={`btn btn-primary shimmer-effect h-10 gap-2 flex-1 md:flex-initial ${dragActive ? 'scale-105 ring-2 ring-[var(--primary)]' : ''}`}
                        onClick={() => document.getElementById('file-input')?.click()}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        disabled={isOverLimit}
                    >
                        <CloudUpload size={18} />
                        <span className="whitespace-nowrap">{dragActive ? 'Drop File' : 'Upload Data'}</span>
                    </button>
                </div>
            </div>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="card fade-in mb-6" style={{ border: '1px solid var(--primary)', padding: '24px' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-h3">Create Dataset Group</h3>
                        <button className="btn btn-icon btn-ghost" onClick={() => setShowCreateGroup(false)}>✕</button>
                    </div>
                    <div className="flex gap-4">
                        <input
                            className="input"
                            style={{ flex: 1 }}
                            placeholder="Group Name (e.g. Sales Q1, Marketing...)"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            autoFocus
                        />
                        <button className="btn btn-primary" onClick={handleCreateGroup}>Create Group</button>
                    </div>
                </div>
            )}

            <input type="file" id="file-input" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />

            {/* Content Area */}
            <div className="flex-col gap-8">
                {groups.map((group: any) => {
                    const groupFiles = groupedFiles[group.id] || [];
                    if (groupFiles.length === 0 && searchTerm) return null;

                    return (
                        <div key={group.id} className="flex-col gap-4">
                            <div className="flex justify-between items-center px-2">
                                <div className="flex items-center gap-3">
                                    <Folder size={20} className="text-primary" />
                                    <h3 className="text-h3" style={{ fontSize: '18px' }}>{group.name}</h3>
                                    <span className="text-sm text-tertiary">({groupFiles.length} files)</span>
                                </div>
                                <button className="btn btn-icon btn-ghost btn-sm" onClick={() => confirm('Delete group?') && onDeleteGroup(group.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {viewMode === 'list' ? (
                                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    {groupFiles.length === 0 ? (
                                        <div style={{ padding: '32px', textAlign: 'center', opacity: 0.5, fontSize: '14px' }}>
                                            No files in this group. Move files here using the dropdown below.
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: 'auto', width: '100%' }}>
                                            <div style={{ minWidth: '600px' }}>
                                                <FileTable
                                                    files={groupFiles}
                                                    groups={groups}
                                                    onFileSelect={onFileSelect}
                                                    onToggleFavorite={onToggleFavorite}
                                                    onDeleteFile={onDeleteFile}
                                                    onUpdateFileGroup={onUpdateFileGroup}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <FileGrid
                                    files={groupFiles}
                                    onFileSelect={onFileSelect}
                                    onDeleteFile={onDeleteFile}
                                    onToggleFavorite={onToggleFavorite}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Ungrouped Section */}
                <div className="flex-col gap-4">
                    <div className="flex items-center gap-3 px-2">
                        <FileText size={20} className="text-tertiary" />
                        <h3 className="text-h3" style={{ fontSize: '18px' }}>Ungrouped Datasets</h3>
                        <span className="text-sm text-tertiary">({groupedFiles['ungrouped'].length} files)</span>
                    </div>

                    {viewMode === 'list' ? (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {groupedFiles['ungrouped'].length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', opacity: 0.5, fontSize: '14px' }}>
                                    All files are organized!
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', width: '100%' }}>
                                    <div style={{ minWidth: '600px' }}>
                                        <FileTable
                                            files={groupedFiles['ungrouped']}
                                            groups={groups}
                                            onFileSelect={onFileSelect}
                                            onToggleFavorite={onToggleFavorite}
                                            onDeleteFile={onDeleteFile}
                                            onUpdateFileGroup={onUpdateFileGroup}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <FileGrid
                            files={groupedFiles['ungrouped']}
                            onFileSelect={onFileSelect}
                            onDeleteFile={onDeleteFile}
                            onToggleFavorite={onToggleFavorite}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

const FileGrid = ({ files, onFileSelect, onDeleteFile, onToggleFavorite }: any) => {
    if (files.length === 0) {
        return (
            <div className="card" style={{ padding: '32px', textAlign: 'center', opacity: 0.5, fontSize: '14px' }}>
                No files to display.
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {files.map((f: any) => (
                <div
                    key={f.id}
                    className="card group"
                    onClick={() => onFileSelect(f)}
                    style={{
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        position: 'relative'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                    <div className="flex justify-between items-start">
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: 'var(--bg-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)'
                        }}>
                            {f.filename.endsWith('.csv') ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                        </div>
                        <button
                            className="btn btn-icon btn-ghost btn-sm"
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(f); }}
                            style={{ color: f.isFavorite ? '#fbbf24' : 'var(--text-tertiary)' }}
                        >
                            <Star size={16} fill={f.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                    </div>

                    <div>
                        <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.filename}>
                            {f.filename}
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {(f.size / 1024).toFixed(1)} KB • {new Date(f.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="btn btn-primary btn-sm w-full" onClick={(e) => { e.stopPropagation(); onFileSelect(f); }}>Analyze</button>
                        <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onDeleteFile(f); }}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const FileTable = ({ files, groups, onFileSelect, onToggleFavorite, onDeleteFile, onUpdateFileGroup }: any) => (
    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
            <tr style={{ height: '48px', color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'left', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                <th style={{ width: '50px', paddingLeft: '24px' }}><Star size={14} /></th>
                <th style={{ paddingLeft: '12px' }}>DATASET NAME</th>
                <th>SIZE</th>
                <th>CREATED</th>
                <th>MOVE TO GROUP</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACTIONS</th>
            </tr>
        </thead>
        <tbody>
            {files.map((f: any) => (
                <tr key={f.id} className="table-row group" style={{ height: '64px', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => onFileSelect(f)}>
                    <td onClick={e => { e.stopPropagation(); onToggleFavorite(f); }} style={{ paddingLeft: '24px', cursor: 'pointer', fontSize: '18px', color: f.isFavorite ? '#fbbf24' : 'var(--text-disabled)' }}>
                        <Star size={16} fill={f.isFavorite ? 'currentColor' : 'none'} stroke={f.isFavorite ? 'none' : 'currentColor'} />
                    </td>
                    <td style={{ paddingLeft: '12px' }}>
                        <div className="flex items-center gap-3">
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                {f.filename.endsWith('.csv') ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{f.filename}</span>
                        </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>{(f.size / 1024).toFixed(1)} KB</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td onClick={e => e.stopPropagation()}>
                        <select
                            className="input"
                            style={{ height: '30px', fontSize: '12px', width: '140px', padding: '0 8px' }}
                            value={f.groupId || ''}
                            onChange={(e) => onUpdateFileGroup(f.id, e.target.value || null)}
                        >
                            <option value="">Ungrouped</option>
                            {groups.map((g: any) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div className="flex justify-end gap-2">
                            {/* Keep opacity transition for desktop but make visible on hover/focus or always if needed. For now keeping as is but ensuring touch triggers hover on mobile often work differently. 
                                Actually, let's remove the opacity-0 group-hover:opacity-100 for mobile so buttons are always visible on touch devices? 
                                A better way is to use a media query or just make them always visible. 
                                For now, I'll remove the opacity class to ensure user sees actions. 
                             */}
                            <button className="btn btn-primary btn-sm shimmer-effect" onClick={(e) => { e.stopPropagation(); onFileSelect(f); }}>Analyze</button>
                            <button className="btn btn-danger btn-sm" style={{ width: '32px' }} onClick={(e) => { e.stopPropagation(); onDeleteFile(f); }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);
