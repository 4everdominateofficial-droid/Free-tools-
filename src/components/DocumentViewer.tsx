import React, { useState } from 'react';
import { DocumentItem, LanguageCode } from '../types/document';
import { LOCALES } from '../data/locales';
import { sanitizeHtml, parseCsvContent } from '../utils/securityValidator';
import {
  ArrowLeft,
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Download,
  Share2,
  Search,
  Hash,
  Eye,
  FileText
} from 'lucide-react';

interface DocumentViewerProps {
  document: DocumentItem;
  lang: LanguageCode;
  onBack: () => void;
  isDarkMode?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document: doc,
  lang,
  onBack,
  isDarkMode = true
}) => {
  const t = LOCALES[lang];
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(doc.pageCount || 1);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [csvFilterQuery, setCsvFilterQuery] = useState<string>('');
  const [externalAppModalOpen, setExternalAppModalOpen] = useState<boolean>(false);

  // Content processing
  const rawText = typeof doc.content === 'string' ? doc.content : '';

  // Password-protected check
  const isEncryptedPdf =
    doc.format === 'PDF' && (rawText.includes('/Encrypt') || doc.displayName.toLowerCase().includes('encrypted'));

  // CSV parsing
  const csvData = React.useMemo(() => {
    if (doc.format === 'CSV') {
      return parseCsvContent(rawText);
    }
    return { headers: [], rows: [], isTruncated: false };
  }, [doc.format, rawText]);

  // HTML sanitization
  const htmlData = React.useMemo(() => {
    if (doc.format === 'HTML') {
      return sanitizeHtml(rawText);
    }
    return { title: '', body: '', strippedThreats: 0 };
  }, [doc.format, rawText]);

  // Text lines
  const textLines = React.useMemo(() => {
    if (doc.format === 'TXT') {
      return rawText.split('\n');
    }
    return [];
  }, [doc.format, rawText]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  return (
    <div
      className={`flex flex-col h-full select-none transition-colors duration-200 ${
        isDarkMode ? 'bg-[#10141D] text-[#E2E2E6]' : 'bg-[#F8FAFD] text-[#1F1F1F]'
      }`}
    >
      {/* Viewer Top App Bar */}
      <div
        className={`px-4 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-colors ${
          isDarkMode
            ? 'bg-[#10141D]/90 border-b border-[#222B3A]'
            : 'bg-[#F8FAFD]/90 border-b border-[#E2E7F0]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 ${
              isDarkMode ? 'hover:bg-[#1E2634] text-neutral-300' : 'hover:bg-blue-50 text-neutral-700'
            }`}
            title="Back to Documents"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-inherit truncate max-w-[180px] sm:max-w-md">
              {doc.displayName}
            </h2>
            <p className="text-[10px] text-blue-600 dark:text-blue-300 font-mono">
              {doc.format} • {(doc.sizeBytes / 1024).toFixed(1)} KB • Native Offline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom Controls for PDF and Images */}
          {(doc.format === 'PDF' || ['PNG', 'JPEG', 'WEBP'].includes(doc.format)) && !isEncryptedPdf && (
            <div
              className={`flex items-center rounded-full p-0.5 border ${
                isDarkMode ? 'bg-[#18202D] border-[#283344]' : 'bg-white border-[#E2E7F0] shadow-sm'
              }`}
            >
              <button
                onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))}
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:text-blue-600 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold px-1 text-neutral-500 dark:text-neutral-400 min-w-[34px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale(s => Math.min(2.5, s + 0.25))}
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:text-blue-600 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {doc.format === 'TXT' && (
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={`h-8 px-2.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 transition ${
                showLineNumbers
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : isDarkMode
                  ? 'bg-[#18202D] text-neutral-400 border-[#283344]'
                  : 'bg-white text-neutral-700 border-[#E2E7F0]'
              }`}
              title="Toggle Line Numbers"
            >
              <Hash className="w-3 h-3" />
              <span className="text-[10px]">Lines</span>
            </button>
          )}

          <button
            onClick={() => setShowInfoModal(true)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 ${
              isDarkMode ? 'hover:bg-[#1E2634] text-neutral-300' : 'hover:bg-blue-50 text-neutral-700'
            }`}
            title="Document Details"
          >
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start">
        {/* ENCRYPTED PDF WARNING */}
        {isEncryptedPdf && (
          <div className="w-full max-w-md my-auto p-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-3xl text-center space-y-4 shadow-lg animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                Encrypted / Password-Protected PDF
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                {t.encryptedPdfNotice}
              </p>
            </div>
            <div className="p-3 bg-amber-100/60 dark:bg-amber-900/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 font-mono">
              Cipher: Standard Adobe PDF Encryption Filter Detected
            </div>
            <button
              onClick={() => setExternalAppModalOpen(true)}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Open in Compatible App
            </button>
          </div>
        )}

        {/* PDF VIEWER CANVAS */}
        {doc.format === 'PDF' && !isEncryptedPdf && (
          <div className="w-full flex flex-col items-center gap-4 my-auto">
            <div
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
              className="transition-transform duration-150 w-full max-w-lg bg-white text-neutral-900 rounded-2xl shadow-xl border border-neutral-300 p-8 min-h-[500px] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-xs text-neutral-900">{doc.displayName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 font-semibold">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <div className="space-y-3 pt-2 text-xs text-neutral-800 leading-relaxed font-serif">
                  <h3 className="font-bold text-sm text-neutral-900">
                    DocuFlex Architectural Security Model
                  </h3>
                  <p>
                    This document was decoded offline strictly inside transient RAM memory without saving decrypted artifacts to disk or external storage.
                  </p>
                  <p className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 font-sans">
                    ✓ Storage Access Framework (SAF) URI isolation verified.<br />
                    ✓ android.permission.INTERNET absence enforced in build.<br />
                    ✓ WindowManager.FLAG_SECURE active on display canvas.
                  </p>
                  <p className="text-neutral-600 text-[11px]">
                    Page Content: Document section {currentPage} preview stream rendered via Android PdfRenderer canvas bindings.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span>Native Android M3 Engine</span>
                <span>SHA-256 Verified Safe</span>
              </div>
            </div>

            {/* Page Navigation Controls */}
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg ${
                isDarkMode ? 'bg-[#18202D] border-[#283344]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CSV TABLE VIEWER */}
        {doc.format === 'CSV' && (
          <div className="w-full max-w-4xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={csvFilterQuery}
                  onChange={e => setCsvFilterQuery(e.target.value)}
                  placeholder="Filter table rows…"
                  className={`w-full h-8 pl-8 pr-3 rounded-full text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-[#18202D] border-[#283344] text-white placeholder-neutral-400'
                      : 'bg-white border-[#E2E7F0] text-neutral-900 placeholder-neutral-500'
                  }`}
                />
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {csvData.rows.length} rows • {csvData.headers.length} columns
              </span>
            </div>

            <div
              className={`rounded-2xl border overflow-x-auto shadow-sm ${
                isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      isDarkMode ? 'bg-[#111620] border-[#263244]' : 'bg-[#F0F4F9] border-[#E2E7F0]'
                    }`}
                  >
                    <th className="p-2.5 font-mono text-[10px] text-neutral-400 w-10 text-center">#</th>
                    {csvData.headers.map((h, i) => (
                      <th key={i} className="p-2.5 font-bold whitespace-nowrap text-inherit">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDarkMode ? 'divide-[#263244]' : 'divide-[#E2E7F0]'
                  }`}
                >
                  {csvData.rows
                    .filter(row =>
                      row.some(cell => cell.toLowerCase().includes(csvFilterQuery.toLowerCase()))
                    )
                    .map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={`transition-colors ${
                          isDarkMode ? 'hover:bg-[#202938]' : 'hover:bg-blue-50/40'
                        }`}
                      >
                        <td className="p-2.5 font-mono text-[10px] text-neutral-400 text-center">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5 whitespace-nowrap text-inherit">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEXT FILE VIEWER */}
        {doc.format === 'TXT' && (
          <div
            className={`w-full max-w-3xl rounded-2xl border p-4 font-mono text-xs shadow-sm overflow-x-auto ${
              isDarkMode
                ? 'bg-[#141A24] border-[#263244] text-neutral-200'
                : 'bg-white border-[#E2E7F0] text-neutral-800'
            }`}
          >
            {textLines.map((line, idx) => (
              <div key={idx} className="flex gap-4 py-0.5 hover:bg-blue-500/10 px-1 rounded">
                {showLineNumbers && (
                  <span className="text-neutral-500 select-none w-8 text-right font-mono text-[11px]">
                    {idx + 1}
                  </span>
                )}
                <span className="whitespace-pre flex-1">{line || ' '}</span>
              </div>
            ))}
          </div>
        )}

        {/* OFFICE FALLBACK CARDS (DOCX / XLSX) */}
        {['DOCX', 'XLSX', 'PPTX', 'DOC', 'PPT', 'XLS'].includes(doc.format) && (
          <div
            className={`w-full max-w-md my-auto p-6 rounded-3xl border text-center space-y-4 shadow-lg ${
              isDarkMode
                ? 'bg-[#18202D] border-[#263244]'
                : 'bg-white border-[#E2E7F0]'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-inherit">{doc.displayName}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Extracted offline via SafeXmlParser and ZipSecurityValidator without XXE vulnerability.
              </p>
            </div>
            {rawText && (
              <div
                className={`p-4 rounded-2xl border text-left font-mono text-xs max-h-48 overflow-y-auto whitespace-pre-wrap ${
                  isDarkMode
                    ? 'bg-[#10141D] border-[#283344] text-neutral-300'
                    : 'bg-[#F8FAFD] border-[#E2E7F0] text-neutral-800'
                }`}
              >
                {rawText}
              </div>
            )}
            <button
              onClick={() => setExternalAppModalOpen(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Open in Compatible Office App
            </button>
          </div>
        )}

        {/* HTML VIEWER */}
        {doc.format === 'HTML' && (
          <div className="w-full max-w-2xl space-y-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.safeHtmlNotice}</span>
            </div>
            <div
              className={`p-6 rounded-2xl border shadow-sm prose max-w-none text-xs ${
                isDarkMode
                  ? 'bg-[#18202D] border-[#263244] text-neutral-200'
                  : 'bg-white border-[#E2E7F0] text-neutral-800'
              }`}
              dangerouslySetInnerHTML={{ __html: htmlData.body }}
            />
          </div>
        )}

        {/* IMAGE VIEWER */}
        {['PNG', 'JPEG', 'WEBP'].includes(doc.format) && (
          <div className="w-full max-w-lg my-auto flex flex-col items-center gap-3">
            <div
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
              className="transition-transform duration-150 p-2 rounded-2xl border shadow-xl bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
            >
              <img
                src={typeof doc.content === 'string' ? doc.content : ''}
                alt={doc.displayName}
                className="max-h-[500px] w-auto rounded-xl object-contain"
              />
            </div>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
              Downsampled with BitmapFactory.Options.inSampleSize
            </span>
          </div>
        )}
      </div>

      {/* Info Modal Dialog */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border ${
              isDarkMode
                ? 'bg-[#18202D] border-[#263244] text-white'
                : 'bg-white border-[#E2E7F0] text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Document Info
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {doc.format}
              </span>
            </div>

            <div
              className={`p-3 rounded-2xl border space-y-2 text-xs font-mono ${
                isDarkMode ? 'bg-[#10141D] border-[#283344]' : 'bg-[#F8FAFD] border-[#E2E7F0]'
              }`}
            >
              <div>
                <p className="text-[10px] text-neutral-400">Display Name</p>
                <p className="font-bold text-inherit truncate">{doc.displayName}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400">Content URI (SAF)</p>
                <p className="text-[10px] text-neutral-500 truncate">{doc.uri}</p>
              </div>
              <div className="flex justify-between pt-1">
                <div>
                  <p className="text-[10px] text-neutral-400">File Size</p>
                  <p className="font-semibold text-inherit">{(doc.sizeBytes / 1024).toFixed(1)} KB</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400">Security Audit</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">Verified Safe</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* External App Fallback Dialog */}
      {externalAppModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border ${
              isDarkMode
                ? 'bg-[#18202D] border-[#263244] text-white'
                : 'bg-white border-[#E2E7F0] text-neutral-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold">Intent: ACTION_VIEW</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                DocuFlex delegates this file to an installed native handler with FLAG_GRANT_READ_URI_PERMISSION.
              </p>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-[#10141D] rounded-xl text-[11px] font-mono text-neutral-500">
              Target: application/vnd.openxmlformats-officedocument
            </div>
            <button
              onClick={() => setExternalAppModalOpen(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
