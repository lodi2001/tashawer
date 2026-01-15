/**
 * File validation utilities for Tashawer platform
 */

// Allowed file types by category
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
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
  },
  archives: {
    extensions: ['.zip', '.rar', '.7z'],
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ],
  },
  engineering: {
    extensions: ['.dwg', '.dxf'],
    mimeTypes: ['application/acad', 'application/x-autocad', 'image/vnd.dxf', 'image/x-dxf'],
  },
};

// File size limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total per upload batch

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'TOTAL_SIZE_EXCEEDED' | 'MAX_FILES_EXCEEDED';
}

// Error messages
export const ERROR_MESSAGES = {
  en: {
    FILE_TOO_LARGE: 'File size exceeds the maximum allowed size',
    INVALID_TYPE: 'File type is not allowed',
    TOTAL_SIZE_EXCEEDED: 'Total file size exceeds the maximum allowed',
    MAX_FILES_EXCEEDED: 'Maximum number of files exceeded',
    EMPTY_FILE: 'File is empty',
  },
  ar: {
    FILE_TOO_LARGE: 'حجم الملف يتجاوز الحد المسموح',
    INVALID_TYPE: 'نوع الملف غير مسموح به',
    TOTAL_SIZE_EXCEEDED: 'الحجم الإجمالي للملفات يتجاوز الحد المسموح',
    MAX_FILES_EXCEEDED: 'تم تجاوز الحد الأقصى لعدد الملفات',
    EMPTY_FILE: 'الملف فارغ',
  },
};

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : '';
}

/**
 * Check if file extension is allowed
 */
export function isExtensionAllowed(
  extension: string,
  categories?: (keyof typeof ALLOWED_FILE_TYPES)[]
): boolean {
  const categoriesToCheck = categories || Object.keys(ALLOWED_FILE_TYPES) as (keyof typeof ALLOWED_FILE_TYPES)[];

  return categoriesToCheck.some((category) =>
    ALLOWED_FILE_TYPES[category].extensions.includes(extension.toLowerCase())
  );
}

/**
 * Check if MIME type is allowed
 */
export function isMimeTypeAllowed(
  mimeType: string,
  categories?: (keyof typeof ALLOWED_FILE_TYPES)[]
): boolean {
  const categoriesToCheck = categories || Object.keys(ALLOWED_FILE_TYPES) as (keyof typeof ALLOWED_FILE_TYPES)[];

  return categoriesToCheck.some((category) =>
    ALLOWED_FILE_TYPES[category].mimeTypes.includes(mimeType)
  );
}

/**
 * Validate a single file
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedCategories?: (keyof typeof ALLOWED_FILE_TYPES)[];
    locale?: 'en' | 'ar';
  } = {}
): ValidationResult {
  const { maxSize = MAX_FILE_SIZE, allowedCategories, locale = 'en' } = options;
  const messages = ERROR_MESSAGES[locale];

  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: messages.EMPTY_FILE,
      errorCode: 'INVALID_TYPE',
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: messages.FILE_TOO_LARGE,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  // Check file extension
  const extension = getFileExtension(file.name);
  if (!isExtensionAllowed(extension, allowedCategories)) {
    return {
      isValid: false,
      error: messages.INVALID_TYPE,
      errorCode: 'INVALID_TYPE',
    };
  }

  // Check MIME type
  if (file.type && !isMimeTypeAllowed(file.type, allowedCategories)) {
    // Some browsers don't set MIME type correctly, so we rely on extension check primarily
    // Only fail if MIME type is set but not allowed
    if (file.type !== '' && !file.type.includes('octet-stream')) {
      return {
        isValid: false,
        error: messages.INVALID_TYPE,
        errorCode: 'INVALID_TYPE',
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  options: {
    maxFiles?: number;
    maxSize?: number;
    maxTotalSize?: number;
    allowedCategories?: (keyof typeof ALLOWED_FILE_TYPES)[];
    locale?: 'en' | 'ar';
  } = {}
): ValidationResult {
  const {
    maxFiles = 10,
    maxTotalSize = MAX_TOTAL_SIZE,
    locale = 'en',
    ...fileOptions
  } = options;
  const messages = ERROR_MESSAGES[locale];

  // Check number of files
  if (files.length > maxFiles) {
    return {
      isValid: false,
      error: messages.MAX_FILES_EXCEEDED,
      errorCode: 'MAX_FILES_EXCEEDED',
    };
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSize) {
    return {
      isValid: false,
      error: messages.TOTAL_SIZE_EXCEEDED,
      errorCode: 'TOTAL_SIZE_EXCEEDED',
    };
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file, { ...fileOptions, locale });
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get accept string for file input
 */
export function getAcceptString(categories?: (keyof typeof ALLOWED_FILE_TYPES)[]): string {
  const categoriesToInclude = categories || Object.keys(ALLOWED_FILE_TYPES) as (keyof typeof ALLOWED_FILE_TYPES)[];

  const extensions = categoriesToInclude.flatMap(
    (category) => ALLOWED_FILE_TYPES[category].extensions
  );

  return extensions.join(',');
}

/**
 * Get accept object for react-dropzone
 */
export function getAcceptObject(
  categories?: (keyof typeof ALLOWED_FILE_TYPES)[]
): Record<string, string[]> {
  const categoriesToInclude = categories || Object.keys(ALLOWED_FILE_TYPES) as (keyof typeof ALLOWED_FILE_TYPES)[];

  const accept: Record<string, string[]> = {};

  categoriesToInclude.forEach((category) => {
    ALLOWED_FILE_TYPES[category].mimeTypes.forEach((mimeType) => {
      accept[mimeType] = ALLOWED_FILE_TYPES[category].extensions;
    });
  });

  return accept;
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') ||
    ALLOWED_FILE_TYPES.images.extensions.includes(getFileExtension(file.name));
}

/**
 * Create a preview URL for a file
 */
export function createPreviewUrl(file: File): string | null {
  if (isImageFile(file)) {
    return URL.createObjectURL(file);
  }
  return null;
}

/**
 * Revoke a preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
