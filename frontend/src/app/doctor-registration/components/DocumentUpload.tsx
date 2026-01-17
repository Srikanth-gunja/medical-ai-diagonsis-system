'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt: Date;
}

interface DocumentUploadProps {
    label: string;
    description: string;
    acceptedFormats: string[];
    maxSize: number;
    value: UploadedFile | null;
    onChange: (file: UploadedFile | null) => void;
    error?: string;
    required?: boolean;
}

const DocumentUpload = ({
    label,
    description,
    acceptedFormats,
    maxSize,
    value,
    onChange,
    error,
    required = false,
}: DocumentUploadProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const validateFile = (file: File): string | null => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedFormats.includes(fileExtension)) {
            return `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`;
        }
        if (file.size > maxSize) {
            return `File size exceeds ${formatFileSize(maxSize)} limit`;
        }
        return null;
    };

    const handleFileSelect = (file: File) => {
        setUploadError('');
        const validationError = validateFile(file);

        if (validationError) {
            setUploadError(validationError);
            return;
        }

        const uploadedFile: UploadedFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
        };

        onChange(uploadedFile);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemove = () => {
        onChange(null);
        setUploadError('');
    };

    return (
        <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
                {label} {required && <span className="text-error">*</span>}
            </label>
            <p className="text-xs text-text-secondary mb-3">{description}</p>

            {!value ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-base ${isDragging
                        ? 'border-primary bg-primary/5'
                        : error || uploadError
                            ? 'border-error bg-error/5' : 'border-input hover:border-primary'
                        }`}
                >
                    <input
                        type="file"
                        accept={acceptedFormats.join(',')}
                        onChange={handleFileInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="flex flex-col items-center space-y-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDragging ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                            <Icon
                                name="CloudArrowUpIcon"
                                size={24}
                                className={isDragging ? 'text-primary' : 'text-text-secondary'}
                            />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-text-primary mb-1">
                                {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-text-secondary">
                                {acceptedFormats.join(', ').toUpperCase()} (Max {formatFileSize(maxSize)})
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                                <Icon name="DocumentTextIcon" size={20} className="text-success" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate">{value.name}</p>
                                <p className="text-xs text-text-secondary mt-1">
                                    {formatFileSize(value.size)} • Uploaded successfully
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRemove}
                            className="ml-2 p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-base flex-shrink-0"
                            aria-label="Remove file"
                        >
                            <Icon name="XMarkIcon" size={20} />
                        </button>
                    </div>
                </div>
            )}

            {(error || uploadError) && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                    <Icon name="ExclamationCircleIcon" size={16} />
                    <span>{error || uploadError}</span>
                </p>
            )}
        </div>
    );
};

export default DocumentUpload;