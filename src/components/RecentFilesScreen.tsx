import React, { useState } from 'react';
import { DocumentFilterType, DocumentFormat, DocumentItem, LanguageCode } from '../types/document';
import { LOCALES } from '../data/locales';
import {
  Search,
  X,
  Star,
  Trash2,
  History,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Globe,
  Files,
  FileSpreadsheet,
  FolderOpen
} from 'lucide-react';

interface RecentFilesScreenProps {
  documents: DocumentItem[];
  lang: LanguageCode;
  onOpenDocument: (doc: DocumentItem) => void;
  onToggleFavorite: (id: string) => void;
  onRemoveDocument: (id: string) => void;
  isDarkMode?: boolean;
}

export const RecentFilesScreen: React.FC<RecentFilesScreenProps> = ({
  documents,
  lang,
  onOpenDocument,
  onToggleFavorite,
  onRemoveDocument,
  isDarkMode = true
}) => {
  const t = LOCALES[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<DocumentFilterType>('ALL');
  const [staleDocAlert, setStaleDocAlert] = useState<DocumentItem | null>(null);

  const getFormatBadge = (format: DocumentFormat) => {
    switch (format) {
      case 'PDF':
        return {
          icon: <FileText className="w-5 h-5 text-red-500 dark:text-red-400" />,
          bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60'
        };
      case 'PNG':
      case 'JPEG':
      case 'WEBP':
        return {
          icon: <ImageIcon className="w-5 h-5 text-sky-500 dark:text-sky-400" />,
          bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/60'
        };
      case 'CSV':
      case 'XLSX':
      case 'XLS':
        return {
          icon: <TableIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
        };
      case 'DOCX':
      case 'DOC':
      case 'PPTX':
      case 'PPT':
        return {
          icon: <Files className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
        };
      case 'HTML':
        return {
          icon: <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
          bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
        };
      default:
        return {
          icon: <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
        };
    }
  };

  const filtered = documents.filter(doc => {
    const matchesSearch = doc.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'ALL' ||
      (activeFilter === 'PDF' && doc.format === 'PDF') ||
      (activeFilter === 'IMAGES' && ['PNG', 'JPEG', 'WEBP'].includes(doc.format)) ||
      (activeFilter === 'TEXT' && ['TXT', 'CSV'].includes(doc.format)) ||
      (activeFilter === 'OFFICE' && ['DOCX', 'XLSX', 'PPTX', 'DOC', 'PPT', 'XLS'].includes(doc.format)) ||
      (activeFilter === 'HTML' && doc.format === 'HTML');
    return matchesSearch && matchesFilter;
  });

  const handleItemClick = (doc: DocumentItem) => {
    if (doc.isStale) {
      setStaleDocAlert(doc);
    } else {
      onOpenDocument(doc);
    }
  };

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto transition-colors duration-200 select-none ${
        isDarkMode ? 'bg-[#10141D] text-[#E2E2E6]' : 'bg-[#F8FAFD] text-[#1F1F1F]'
      }`}
    >
      {/* Top App Bar */}
      <div
        className={`px-5 pt-3.5 pb-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-colors ${
          isDarkMode
            ? 'bg-[#10141D]/90 border-b border-[#222B3A]'
            : 'bg-[#F8FAFD]/90 border-b border-[#E2E7F0]'
        }`}
      >
        <div>
          <h2 className="text-base font-bold text-inherit flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Recent Files
          </h2>
          <p className="text-[10px] text-blue-600 dark:text-blue-300 font-mono">
            Room DataStore • Minimal Metadata Only
          </p>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
          {filtered.length} items
        </span>
      </div>

      <div className="p-4 space-y-3.5 pb-28">
        {/* Search */}
        <div className="relative">
          <Search
            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full h-11 pl-10 pr-10 rounded-full text-xs font-medium transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
              isDarkMode
                ? 'bg-[#18202D] text-white placeholder-neutral-400 border border-[#283344] focus:border-blue-400'
                : 'bg-white text-neutral-900 placeholder-neutral-500 border border-[#E2E7F0] focus:border-blue-600'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full ${
                isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {(
            [
              { key: 'ALL', label: t.filterAll },
              { key: 'PDF', label: t.filterPdf },
              { key: 'OFFICE', label: t.filterOffice },
              { key: 'TEXT', label: t.filterText },
              { key: 'IMAGES', label: t.filterImages },
              { key: 'HTML', label: t.filterHtml }
            ] as const
          ).map(filter => {
            const isSelected = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition min-h-[34px] flex items-center font-medium text-xs active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white dark:bg-blue-400 dark:text-blue-950 font-bold shadow-sm'
                    : isDarkMode
                    ? 'bg-[#18202D] text-neutral-300 border border-[#283344] hover:bg-[#222B3A]'
                    : 'bg-white text-neutral-700 border border-[#E2E7F0] hover:bg-blue-50/60 shadow-sm'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Stale URI Alert Dialog */}
        {staleDocAlert && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col gap-2.5 text-amber-900 dark:text-amber-200 shadow-sm animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-amber-800 dark:text-amber-300">
                  File moved, deleted or access revoked
                </p>
                <p className="text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                  The persistent Storage Access Framework permission for &quot;{staleDocAlert.displayName}&quot; is no longer accessible by the operating system.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setStaleDocAlert(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveDocument(staleDocAlert.id);
                  setStaleDocAlert(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                Remove from History
              </button>
            </div>
          </div>
        )}

        {/* List of Recent Items */}
        {filtered.length === 0 ? (
          <div
            className={`py-12 px-6 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed ${
              isDarkMode ? 'border-[#283344] bg-[#141A24]/60' : 'border-[#D8E2EE] bg-white/70'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold mb-1 text-inherit">No recent documents match</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs">
              Clear your search query or pick a document from storage.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(doc => {
              const badge = getFormatBadge(doc.format);
              return (
                <div
                  key={doc.id}
                  onClick={() => handleItemClick(doc)}
                  className={`group p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3 cursor-pointer active:scale-[0.99] shadow-sm ${
                    isDarkMode
                      ? 'bg-[#18202D] hover:bg-[#1E2634] border-[#263244] hover:border-blue-500/40'
                      : 'bg-white hover:bg-blue-50/30 border-[#E2E7F0] hover:border-blue-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-[#111620] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-inherit truncate">
                        {doc.displayName}
                      </p>
                      {doc.isStale && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded font-medium">
                          REVOKED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                      <span className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[9px] border ${badge.bg}`}>
                        {doc.format}
                      </span>
                      <span>•</span>
                      <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{new Date(doc.lastAccessedTimestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleFavorite(doc.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-90 ${
                        doc.isFavorite
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      title="Toggle Favorite"
                    >
                      <Star
                        className={`w-4 h-4 ${doc.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => onRemoveDocument(doc.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-90"
                      title="Remove from Recents"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
