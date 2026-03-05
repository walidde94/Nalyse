import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './MultiFileUpload.css';

interface UploadedFile {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
}

interface MultiFileUploadProps {
    onUploadComplete?: (files: UploadedFile[]) => void;
    onAnalyzeClick?: (fileIds: string[]) => void;
}

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({ onUploadComplete, onAnalyzeClick }) => {
    const { token } = useAuth();
    const [files, setFiles] = useState<File[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
        setError(null);
        setSuccess(false);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/json': ['.json'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        multiple: true
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        if (files.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await axios.post('/api/files/upload-multiple', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setUploadProgress({ overall: percentCompleted });
                }
            });

            setUploadedFiles(response.data.files);
            setSuccess(true);
            setFiles([]);

            if (onUploadComplete) {
                onUploadComplete(response.data.files);
            }

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress({});
        }
    };

    const handleAnalyze = () => {
        if (uploadedFiles.length < 2) {
            setError('Please upload at least 2 files to analyze relationships');
            return;
        }

        const fileIds = uploadedFiles.map(f => f.id);
        if (onAnalyzeClick) {
            onAnalyzeClick(fileIds);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="multi-file-upload">
            <div className="upload-header">
                <h2>Multi-File Upload & Analysis</h2>
                <p>Upload multiple datasets to analyze relationships and get comprehensive insights</p>
            </div>

            {/* Dropzone */}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <Upload size={48} />
                <p className="dropzone-text">
                    {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
                </p>
                <p className="dropzone-hint">Supports CSV, JSON, Excel files (up to 20 files)</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="file-list">
                    <h3>Selected Files ({files.length})</h3>
                    {files.map((file, index) => (
                        <div key={index} className="file-item">
                            <FileText size={20} />
                            <div className="file-info">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="remove-btn"
                                disabled={uploading}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Progress */}
            {uploading && uploadProgress.overall !== undefined && (
                <div className="upload-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${uploadProgress.overall}%` }}
                        />
                    </div>
                    <span className="progress-text">{uploadProgress.overall}% uploaded</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="message error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="message success">
                    <CheckCircle2 size={20} />
                    <span>{uploadedFiles.length} file(s) uploaded successfully!</span>
                </div>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                    <h3>Uploaded Files ({uploadedFiles.length})</h3>
                    {uploadedFiles.map((file) => (
                        <div key={file.id} className="uploaded-file-item">
                            <CheckCircle2 size={20} className="success-icon" />
                            <div className="file-info">
                                <span className="file-name">{file.originalName}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
                <button
                    onClick={uploadFiles}
                    disabled={files.length === 0 || uploading}
                    className="btn btn-primary"
                >
                    {uploading ? (
                        <>
                            <Loader2 size={20} className="spinner" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload size={20} />
                            Upload {files.length > 0 ? `${files.length} File(s)` : 'Files'}
                        </>
                    )}
                </button>

                {uploadedFiles.length >= 2 && (
                    <button
                        onClick={handleAnalyze}
                        className="btn btn-secondary"
                    >
                        Analyze Relationships
                    </button>
                )}
            </div>
        </div>
    );
};
