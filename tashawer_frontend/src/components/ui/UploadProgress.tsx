'use client';

import { useLocale } from 'next-intl';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { formatFileSize } from './FileUpload';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export interface UploadProgressProps {
  uploads: UploadItem[];
  onCancel?: (uploadId: string) => void;
  onRetry?: (uploadId: string) => void;
  onDismiss?: (uploadId: string) => void;
  className?: string;
}

export function UploadProgress({
  uploads,
  onCancel,
  onRetry,
  onDismiss,
  className,
}: UploadProgressProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const translations = {
    en: {
      uploading: 'Uploading',
      pending: 'Waiting',
      success: 'Uploaded',
      error: 'Failed',
      cancel: 'Cancel',
      retry: 'Retry',
      dismiss: 'Dismiss',
    },
    ar: {
      uploading: 'جاري الرفع',
      pending: 'في الانتظار',
      success: 'تم الرفع',
      error: 'فشل',
      cancel: 'إلغاء',
      retry: 'إعادة المحاولة',
      dismiss: 'إغلاق',
    },
  };

  const t = translations[isRTL ? 'ar' : 'en'];

  if (uploads.length === 0) {
    return null;
  }

  const getStatusColor = (status: UploadStatus) => {
    switch (status) {
      case 'uploading':
        return 'bg-brand-blue';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-brand-red';
      default:
        return 'bg-brand-gray/30';
    }
  };

  const getStatusText = (status: UploadStatus) => {
    return t[status];
  };

  return (
    <div className={cn('space-y-2', className)}>
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className={cn(
            'p-3 rounded-lg border transition-colors',
            upload.status === 'error'
              ? 'bg-brand-red/5 border-brand-red/30'
              : upload.status === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-brand-yellow/5 border-brand-yellow/30'
          )}
        >
          <div className="flex items-center gap-3">
            {/* Status icon */}
            <div className="flex-shrink-0">
              {upload.status === 'uploading' && (
                <Loader2 className="h-5 w-5 text-brand-blue animate-spin" />
              )}
              {upload.status === 'pending' && (
                <div className="h-5 w-5 rounded-full border-2 border-brand-gray/30" />
              )}
              {upload.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {upload.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-brand-red" />
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-brand-gray truncate">
                  {upload.fileName}
                </p>
                <span className="text-xs text-brand-gray/60 flex-shrink-0">
                  {formatFileSize(upload.fileSize)}
                </span>
              </div>

              {/* Progress bar */}
              {(upload.status === 'uploading' || upload.status === 'pending') && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-brand-gray/60">
                      {getStatusText(upload.status)}
                    </span>
                    <span className="text-xs text-brand-gray/60">
                      {upload.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-brand-gray/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        getStatusColor(upload.status)
                      )}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status message */}
              {upload.status === 'success' && (
                <p className="text-xs text-green-600 mt-1">{t.success}</p>
              )}
              {upload.status === 'error' && (
                <p className="text-xs text-brand-red mt-1">
                  {upload.error || t.error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-1">
              {upload.status === 'uploading' && onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-brand-gray/60 hover:text-brand-red"
                  onClick={() => onCancel(upload.id)}
                >
                  {t.cancel}
                </Button>
              )}
              {upload.status === 'error' && onRetry && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-brand-blue hover:text-brand-blue/80"
                  onClick={() => onRetry(upload.id)}
                >
                  {t.retry}
                </Button>
              )}
              {(upload.status === 'success' || upload.status === 'error') && onDismiss && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-brand-gray/40 hover:text-brand-gray"
                  onClick={() => onDismiss(upload.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UploadProgress;
