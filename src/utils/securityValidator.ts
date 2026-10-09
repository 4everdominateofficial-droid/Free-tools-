import { DocumentFormat, FileValidationResult } from '../types/document';

export const MAX_SAFE_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_TEXT_LINES = 10_000;
export const MAX_CSV_ROWS = 2_000;
export const MAX_CSV_COLS = 50;

/**
 * Validates document buffer against binary signatures & magic bytes.
 */
export async function validateDocumentFile(
  file: File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> }
): Promise<FileValidationResult> {
  const size = file.size;

  // 1. Empty file
  if (size === 0) {
    return {
      isValid: false,
      detectedFormat: 'UNKNOWN',
      sizeBytes: 0,
      errorMessage: 'The selected file is empty (0 bytes).',
      technicalReason: 'ZERO_BYTE_CONTENT'
    };
  }

  // 2. Oversized file
  if (size > MAX_SAFE_FILE_SIZE_BYTES) {
    const sizeMb = (size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      detectedFormat: 'UNKNOWN',
      sizeBytes: size,
      errorMessage: `File size (${sizeMb} MB) exceeds safe offline limit of 50 MB to prevent OutOfMemory crashes.`,
      technicalReason: 'OVERSIZED_THRESHOLD_EXCEEDED'
    };
  }

  // 3. Read header slice for magic bytes
  const buffer = await file.arrayBuffer();
  const headerBytes = new Uint8Array(buffer.slice(0, 1024));
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // Intercept executable formats disguised as documents
  if (headerBytes[0] === 0x4d && headerBytes[1] === 0x5a) {
    // "MZ" DOS executable
    return {
      isValid: false,
      detectedFormat: 'UNKNOWN',
      sizeBytes: size,
      errorMessage: 'Rejected: Dangerous binary executable header (DOS/MZ) disguised as document.',
      technicalReason: 'EXECUTABLE_SIGNATURE_DETECTED'
    };
  }

  if (headerBytes[0] === 0x7f && headerBytes[1] === 0x45 && headerBytes[2] === 0x4c && headerBytes[3] === 0x46) {
    // ELF executable
    return {
      isValid: false,
      detectedFormat: 'UNKNOWN',
      sizeBytes: size,
      errorMessage: 'Rejected: Linux/ELF executable binary header detected.',
      technicalReason: 'ELF_BINARY_DETECTED'
    };
  }

  // PDF: %PDF
  if (
    headerBytes[0] === 0x25 &&
    headerBytes[1] === 0x50 &&
    headerBytes[2] === 0x44 &&
    headerBytes[3] === 0x46
  ) {
    // Check for password protection / encryption in PDF
    const textHeader = new TextDecoder('latin1').decode(headerBytes);
    const textTail = new TextDecoder('latin1').decode(new Uint8Array(buffer.slice(-4096)));
    const isEncrypted = textHeader.includes('/Encrypt') || textTail.includes('/Encrypt');

    if (isEncrypted) {
      return {
        isValid: false,
        detectedFormat: 'PDF',
        sizeBytes: size,
        isPasswordProtected: true,
        errorMessage: 'Password-protected or encrypted PDF detected. Platform renderer cannot decrypt this file without an external viewer.',
        technicalReason: 'PDF_ENCRYPTION_FLAG'
      };
    }

    return {
      isValid: true,
      detectedFormat: 'PDF',
      sizeBytes: size
    };
  }

  // PNG: \x89PNG\r\n\x1a\n
  if (
    headerBytes[0] === 0x89 &&
    headerBytes[1] === 0x50 &&
    headerBytes[2] === 0x4e &&
    headerBytes[3] === 0x47
  ) {
    return { isValid: true, detectedFormat: 'PNG', sizeBytes: size };
  }

  // JPEG: \xFF\xD8\xFF
  if (headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff) {
    return { isValid: true, detectedFormat: 'JPEG', sizeBytes: size };
  }

  // WebP: RIFF....WEBP
  if (
    headerBytes[0] === 0x52 &&
    headerBytes[1] === 0x49 &&
    headerBytes[2] === 0x46 &&
    headerBytes[3] === 0x46 &&
    headerBytes[8] === 0x57 &&
    headerBytes[9] === 0x45 &&
    headerBytes[10] === 0x42 &&
    headerBytes[11] === 0x50
  ) {
    return { isValid: true, detectedFormat: 'WEBP', sizeBytes: size };
  }

  // ZIP / OpenXML Office: PK\x03\x04
  if (headerBytes[0] === 0x50 && headerBytes[1] === 0x4b && headerBytes[2] === 0x03 && headerBytes[3] === 0x04) {
    if (ext === 'docx') return { isValid: true, detectedFormat: 'DOCX', sizeBytes: size };
    if (ext === 'xlsx') return { isValid: true, detectedFormat: 'XLSX', sizeBytes: size };
    if (ext === 'pptx') return { isValid: true, detectedFormat: 'PPTX', sizeBytes: size };
    return {
      isValid: false,
      detectedFormat: 'UNKNOWN',
      sizeBytes: size,
      errorMessage: 'Generic ZIP archive detected. DocuFlex only accepts verified document formats.',
      technicalReason: 'GENERIC_ZIP_REJECTED'
    };
  }

  // HTML Check
  const sampleText = new TextDecoder('utf-8', { fatal: false }).decode(headerBytes).toLowerCase();
  if (sampleText.includes('<!doctype html') || sampleText.includes('<html') || sampleText.includes('<body')) {
    return { isValid: true, detectedFormat: 'HTML', sizeBytes: size };
  }

  // TXT / CSV check
  let nullBytes = 0;
  for (let i = 0; i < Math.min(headerBytes.length, 256); i++) {
    if (headerBytes[i] === 0) nullBytes++;
  }

  if (nullBytes === 0) {
    if (ext === 'csv' || (sampleText.includes(',') && sampleText.includes('\n'))) {
      return { isValid: true, detectedFormat: 'CSV', sizeBytes: size };
    }
    return { isValid: true, detectedFormat: 'TXT', sizeBytes: size };
  }

  return {
    isValid: false,
    detectedFormat: 'UNKNOWN',
    sizeBytes: size,
    errorMessage: `Unrecognized or unsupported format for '${file.name}'.`,
    technicalReason: 'NO_MATCHING_MAGIC_BYTES'
  };
}

/**
 * Sanitizes HTML content according to offline security specifications.
 */
export function sanitizeHtml(rawHtml: string): { title: string; body: string; strippedThreats: number } {
  let threatCount = 0;
  let content = rawHtml;

  // 1. Remove <script> tags
  const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const scriptMatches = content.match(scriptRegex);
  if (scriptMatches) threatCount += scriptMatches.length;
  content = content.replace(scriptRegex, '');

  // 2. Remove <iframe> tags
  const iframeRegex = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
  const iframeMatches = content.match(iframeRegex);
  if (iframeMatches) threatCount += iframeMatches.length;
  content = content.replace(iframeRegex, '');

  // 3. Remove inline on* handlers
  const handlerRegex = /\son[a-z]+="[^"]*"|\son[a-z]+='[^']*'|\son[a-z]+=[^\s>]+/gi;
  const handlerMatches = content.match(handlerRegex);
  if (handlerMatches) threatCount += handlerMatches.length;
  content = content.replace(handlerRegex, '');

  // 4. Block javascript: pseudo-protocols
  const jsProtoRegex = /href=["']javascript:[^"']*["']/gi;
  if (content.match(jsProtoRegex)) threatCount += 1;
  content = content.replace(jsProtoRegex, 'href="#blocked-js"');

  // 5. Extract document title
  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Sanitized HTML Document';

  // 6. Clean text formatting
  let cleanText = content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n### ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .trim();

  return {
    title,
    body: cleanText,
    strippedThreats: threatCount
  };
}

/**
 * Streaming parser for CSV text.
 */
export function parseCsvContent(text: string): { headers: string[]; rows: string[][]; isTruncated: boolean } {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], isTruncated: false };

  const isTruncated = lines.length > MAX_CSV_ROWS;
  const targetLines = lines.slice(0, MAX_CSV_ROWS);

  const parsed = targetLines.map(line => {
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    cells.push(cur.trim());
    return cells.slice(0, MAX_CSV_COLS);
  });

  return {
    headers: parsed[0] || [],
    rows: parsed.slice(1),
    isTruncated
  };
}
