'use client';

import { useLocale } from 'next-intl';
import { Download, Trash2, File, Image, FileText, FileSpreadsheet, Archive, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { formatFileSize, getFileIcon } from './FileUpload';

export interface FilePreviewItem {
  id: string;
  file_url: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  created_at?: string;
}

export interface FilePreviewProps {
  files: FilePreviewItem[];
  onDelete?: (fileId: string) => void;
  onDownload?: (file: FilePreviewItem) => void;
  isDeleting?: string | null;
  showDelete?: boolean;
  showDownload?: boolean;
  compact?: boolean;
  className?: string;
}

export function FilePreview({
  files,
  onDelete,
  onDownload,
  isDeleting,
  showDelete = true,
  showDownload = true,
  compact = false,
  className,
}: FilePreviewProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const translations = {
    en: {
      download: 'Download',
      delete: 'Delete',
      deleting: 'Deleting...',
      noFiles: 'No files uploaded',
      openInNewTab: 'Open in new tab',
    },
    ar: {
      download: 'تحميل',
      delete: 'حذف',
      deleting: 'جاري الحذف...',
      noFiles: 'لا توجد ملفات',
      openInNewTab: 'فتح في تبويب جديد',
    },
  };

  const t = translations[isRTL ? 'ar' : 'en'];

  if (files.length === 0) {
    return (
      <p className="text-sm text-brand-gray/60 text-center py-4">
        {t.noFiles}
      </p>
    );
  }

  const handleDownload = (file: FilePreviewItem) => {
    if (onDownload) {
      onDownload(file);
    } else {
      // Default download behavior
      window.open(file.file_url, '_blank');
    }
  };

  const getIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) return FileSpreadsheet;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return Archive;
    return File;
  };

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {files.map((file) => {
          const FileIcon = getIcon(file.file_type);
          const isImage = file.file_type.startsWith('image/');

          return (
            <div
              key={file.id}
              className="group relative flex items-center gap-2 px-3 py-2 bg-brand-yellow/5 border border-brand-yellow/30 rounded-lg hover:bg-brand-yellow/10 transition-colors"
            >
              {isImage ? (
                <img
                  src={file.file_url}
                  alt={file.original_filename}
                  className="w-6 h-6 object-cover rounded"
                />
              ) : (
                <FileIcon className="h-4 w-4 text-brand-blue" />
              )}
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-gray hover:text-brand-blue truncate max-w-[150px]"
                title={file.original_filename}
              >
                {file.original_filename}
              </a>
              {showDelete && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(file.id)}
                  disabled={isDeleting === file.id}
                  className="opacity-0 group-hover:opacity-100 text-brand-gray/50 hover:text-brand-red transition-opacity"
                  title={t.delete}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {files.map((file) => {
        const FileIcon = getIcon(file.file_type);
        const isImage = file.file_type.startsWith('image/');

        return (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3 bg-brand-yellow/5 border border-brand-yellow/30 rounded-lg hover:bg-brand-yellow/10 transition-colors"
          >
            {/* Preview or Icon */}
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded border border-brand-yellow/20">
              {isImage ? (
                <img
                  src={file.file_url}
                  alt={file.original_filename}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <FileIcon className="h-6 w-6 text-brand-blue" />
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-brand-gray hover:text-brand-blue truncate block"
                title={file.original_filename}
              >
                {file.original_filename}
              </a>
              <p className="text-xs text-brand-gray/60">
                {formatFileSize(file.file_size)}
                {file.created_at && (
                  <span className={cn('mx-1', isRTL ? 'mr-1' : 'ml-1')}>
                    • {new Date(file.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                  </span>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {showDownload && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-brand-gray/50 hover:text-brand-blue"
                  onClick={() => handleDownload(file)}
                  title={t.download}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-brand-gray/50 hover:text-brand-blue"
                onClick={() => window.open(file.file_url, '_blank')}
                title={t.openInNewTab}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              {showDelete && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-brand-gray/50 hover:text-brand-red"
                  onClick={() => onDelete(file.id)}
                  disabled={isDeleting === file.id}
                  title={t.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FilePreview;
