import React, { useState } from 'react';
import { MultiFileUpload } from '../../components/MultiFileUpload';
import { CrossDatasetAnalysis } from './CrossDatasetAnalysis';
import { ArrowLeft } from 'lucide-react';

interface MultiAnalysisViewProps {
    onClose?: () => void;
}

export const MultiAnalysisView: React.FC<MultiAnalysisViewProps> = ({ onClose }) => {
    const [viewMode, setViewMode] = useState<'upload' | 'analyze'>('upload');
    const [fileIds, setFileIds] = useState<string[]>([]);

    const handleUploadComplete = (files: any[]) => {
        // Optional: could auto-analyze if configured
        console.log('Files uploaded:', files);
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
