'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useLocale } from 'next-intl';
import { Upload, X, File, Image, FileText, FileSpreadsheet, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

// File type categories
export const ALLOWED_FILE_TYPES = {
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ],
  },
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    mimeTypes: ['image/jpeg', '.image/png', 'image/gif', 'image/bmp', 'image/webp'],
  },
  archives: {
    extensions: ['.zip', '.rar', '.7z'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  },
  engineering: {
    extensions: ['.dwg', '.dxf'],
    mimeTypes: ['application/acad', 'image/vnd.dxf'],
  },
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Get all allowed extensions
const getAllowedExtensions = (): string[] => {
  return Object.values(ALLOWED_FILE_TYPES).flatMap((type) => type.extensions);
};

// Get all allowed MIME types
const getAllowedMimeTypes = (): Record<string, string[]> => {
  const accept: Record<string, string[]> = {};
  Object.values(ALLOWED_FILE_TYPES).forEach((type) => {
    type.mimeTypes.forEach((mime) => {
      accept[mime] = type.extensions;
    });
  });
  return accept;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on type
export const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return Archive;
  return File;
};

export interface SelectedFile {
  file: File;
  preview?: string;
  id: string;
}

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  accept?: string[];
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  showPreview?: boolean;
  disabled?: boolean;
  className?: string;
  selectedFiles?: SelectedFile[];
}

export function FileUpload({
  onFilesSelected,
  onFileRemove,
  accept,
  maxSize = MAX_FILE_SIZE,
  maxFiles = 10,
  multiple = true,
  showPreview = true,
  disabled = false,
  className,
  selectedFiles = [],
}: FileUploadProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [error, setError] = useState<string | null>(null);

  const translations = {
    en: {
      dragDrop: 'Drag and drop files here, or click to browse',
      dragActive: 'Drop the files here...',
      maxSize: `Max file size: ${formatFileSize(maxSize)}`,
      allowedTypes: 'Allowed: PDF, DOC, XLS, Images, ZIP',
      fileRejected: 'File rejected',
      fileTooLarge: 'File is too large',
      invalidType: 'Invalid file type',
      maxFilesExceeded: `Maximum ${maxFiles} files allowed`,
      removeFile: 'Remove file',
    },
    ar: {
      dragDrop: 'اسحب الملفات وأفلتها هنا، أو انقر للاستعراض',
      dragActive: 'أفلت الملفات هنا...',
      maxSize: `الحجم الأقصى: ${formatFileSize(maxSize)}`,
      allowedTypes: 'المسموح: PDF، DOC، XLS، صور، ZIP',
      fileRejected: 'تم رفض الملف',
      fileTooLarge: 'الملف كبير جداً',
      invalidType: 'نوع الملف غير صالح',
      maxFilesExceeded: `الحد الأقصى ${maxFiles} ملفات`,
      removeFile: 'إزالة الملف',
    },
  };

  const t = translations[isRTL ? 'ar' : 'en'];

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);

      // Check max files limit
      if (selectedFiles.length + acceptedFiles.length > maxFiles) {
        setError(t.maxFilesExceeded);
        return;
      }

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(t.fileTooLarge);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError(t.invalidType);
        } else {
          setError(t.fileRejected);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected, selectedFiles.length, maxFiles, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? undefined : getAllowedMimeTypes(),
    maxSize,
    multiple,
    disabled,
  });

  const handleRemove = (fileId: string) => {
    if (onFileRemove) {
      onFileRemove(fileId);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-brand-blue bg-brand-blue/5'
            : 'border-brand-yellow/50 hover:border-brand-yellow hover:bg-brand-yellow/5',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-brand-red'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload
            className={cn(
              'h-10 w-10',
              isDragActive ? 'text-brand-blue' : 'text-brand-gray/50'
            )}
          />
          <p className="text-sm text-brand-gray">
            {isDragActive ? t.dragActive : t.dragDrop}
          </p>
          <p className="text-xs text-brand-gray/60">{t.maxSize}</p>
          <p className="text-xs text-brand-gray/60">{t.allowedTypes}</p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-brand-red">{error}</p>
      )}

      {/* Selected files preview */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((selectedFile) => {
            const FileIcon = getFileIcon(selectedFile.file.type);
            const isImage = selectedFile.file.type.startsWith('image/');

            return (
              <div
                key={selectedFile.id}
                className="flex items-center gap-3 p-3 bg-brand-yellow/5 border border-brand-yellow/30 rounded-lg"
              >
                {/* Preview or Icon */}
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  {isImage && selectedFile.preview ? (
                    <img
                      src={selectedFile.preview}
                      alt={selectedFile.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <FileIcon className="h-6 w-6 text-brand-blue" />
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-gray truncate">
                    {selectedFile.file.name}
                  </p>
                  <p className="text-xs text-brand-gray/60">
                    {formatFileSize(selectedFile.file.size)}
                  </p>
                </div>

                {/* Remove button */}
                {onFileRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8 text-brand-gray/50 hover:text-brand-red"
                    onClick={() => handleRemove(selectedFile.id)}
                    title={t.removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
