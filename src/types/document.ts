export type DocumentFormat =
  | 'PDF'
  | 'PNG'
  | 'JPEG'
  | 'WEBP'
  | 'TXT'
  | 'CSV'
  | 'HTML'
  | 'DOCX'
  | 'XLSX'
  | 'PPTX'
  | 'DOC'
  | 'PPT'
  | 'XLS'
  | 'UNKNOWN';

export interface DocumentItem {
  id: string;
  uri: string;
  displayName: string;
  format: DocumentFormat;
  sizeBytes: number;
  lastAccessedTimestamp: number;
  isFavorite: boolean;
  isStale?: boolean;
  content?: string | ArrayBuffer;
  pageCount?: number;
}

export type DocumentFilterType = 'ALL' | 'PDF' | 'IMAGES' | 'TEXT' | 'OFFICE' | 'HTML';

export interface FileValidationResult {
  isValid: boolean;
  detectedFormat: DocumentFormat;
  sizeBytes: number;
  errorMessage?: string;
  technicalReason?: string;
  isPasswordProtected?: boolean;
}

export type DeviceFormFactor = 'phone' | 'foldable' | 'tablet' | 'responsive';
export type AppScreen =
  | 'home'
  | 'recents'
  | 'favorites'
  | 'viewer'
  | 'settings'
  | 'legal'
  | 'test_corpus'
  | 'code_inspector'
  | 'audit_report';
export type LegalTab = 'privacy' | 'terms' | 'security' | 'licenses';
export type LanguageCode = 'en' | 'hi';
