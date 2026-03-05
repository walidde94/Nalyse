import React, { useState } from 'react';
import { MultiFileUpload } from '../../components/MultiFileUpload';
import { CrossDatasetAnalysis } from './CrossDatasetAnalysis';
import { ArrowLeft, Layers, Lock } from 'lucide-react';

interface MultiAnalysisViewProps {
    onClose?: () => void;
    userPlan?: string;
}

export const MultiAnalysisView: React.FC<MultiAnalysisViewProps> = ({ onClose, userPlan }) => {
    const [viewMode, setViewMode] = useState<'upload' | 'analyze'>('upload');
    const [fileIds, setFileIds] = useState<string[]>([]);

    if (userPlan !== 'enterprise') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="card text-center flex-col items-center gap-6" style={{ maxWidth: '440px', padding: '48px', position: 'relative', overflow: 'hidden' }}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--primary)]"></div>
                    <div className="inner-highlight" style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <Layers size={40} />
                    </div>
                    <div className="flex-col gap-2">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="badge" style={{ background: 'var(--accent)', color: 'white' }}>ENTERPRISE</span>
                        </div>
                        <h2 className="text-h1">Multi-Dataset Mesh</h2>
                        <p className="text-sec">Advanced cross-dataset analysis, relationship discovery, and automated joins are Enterprise-tier features.</p>
                    </div>

                    <div className="flex-col gap-3 w-full">
                        <button className="btn btn-primary btn-lg w-full" onClick={() => (window as any).location.hash = '#settings'}>
                            Contact Sales for Enterprise
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleUploadComplete = (files: any[]) => {
        // Optional: could auto-analyze if configured
    };

    const handleAnalyzeClick = (ids: string[]) => {
        setFileIds(ids);
        setViewMode('analyze');
    };

    const handleBack = () => {
        setViewMode('upload');
        setFileIds([]);
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-[var(--bg-app)] text-[var(--text-primary)]">
            <div className="p-6">
                {viewMode === 'analyze' && (
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 mb-4 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Upload
                    </button>
                )}

                {viewMode === 'upload' ? (
                    <div className="flex justify-center pt-8">
                        <MultiFileUpload
                            onUploadComplete={handleUploadComplete}
                            onAnalyzeClick={handleAnalyzeClick}
                        />
                    </div>
                ) : (
                    <CrossDatasetAnalysis fileIds={fileIds} />
                )}
            </div>
        </div>
    );
};
