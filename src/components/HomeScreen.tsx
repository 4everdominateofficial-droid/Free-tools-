import React, { useRef } from 'react';
import {
  DocumentFilterType,
  DocumentFormat,
  DocumentItem,
  LanguageCode
} from '../types/document';
import { LOCALES } from '../data/locales';
import {
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Globe,
  FolderOpen,
  Search,
  X,
  Star,
  Trash2,
  Shield,
  Settings as SettingsIcon,
  AlertTriangle,
  Sun,
  Moon,
  Files,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface HomeScreenProps {
  documents: DocumentItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: DocumentFilterType;
  setActiveFilter: (f: DocumentFilterType) => void;
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  validationError: string | null;
  clearValidationError: () => void;
  onOpenDocument: (doc: DocumentItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onPickLocalFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNavigateToSettings: () => void;
  onNavigateToLegal: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  documents,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  lang,
  setLang,
  validationError,
  clearValidationError,
  onOpenDocument,
  onToggleFavorite,
  onDeleteDocument,
  onPickLocalFile,
  onNavigateToSettings,
  onNavigateToLegal,
  isDarkMode = true,
  onToggleTheme
}) => {
  const t = LOCALES[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group counts for organized document cards
  const pdfCount = documents.filter(d => d.format === 'PDF').length;
  const officeCount = documents.filter(d => ['DOCX', 'XLSX', 'PPTX', 'DOC', 'PPT', 'XLS'].includes(d.format)).length;
  const sheetCount = documents.filter(d => ['CSV', 'XLSX', 'XLS'].includes(d.format)).length;
  const imageCount = documents.filter(d => ['PNG', 'JPEG', 'WEBP'].includes(d.format)).length;
  const textCount = documents.filter(d => d.format === 'TXT').length;

  const getFormatBadge = (format: DocumentFormat) => {
    switch (format) {
      case 'PDF':
        return {
          icon: <FileText className="w-5 h-5 text-red-500 dark:text-red-400" />,
          bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60',
          badgeText: 'PDF'
        };
      case 'PNG':
      case 'JPEG':
      case 'WEBP':
        return {
          icon: <ImageIcon className="w-5 h-5 text-sky-500 dark:text-sky-400" />,
          bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/60',
          badgeText: format
        };
      case 'CSV':
      case 'XLSX':
      case 'XLS':
        return {
          icon: <TableIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
          badgeText: format
        };
      case 'DOCX':
      case 'DOC':
      case 'PPTX':
      case 'PPT':
        return {
          icon: <Files className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60',
          badgeText: format
        };
      case 'TXT':
        return {
          icon: <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
          badgeText: 'TXT'
        };
      case 'HTML':
        return {
          icon: <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
          bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60',
          badgeText: 'HTML'
        };
      default:
        return {
          icon: <FileText className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />,
          bg: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
          badgeText: format
        };
    }
  };

  const filteredDocs = documents.filter(doc => {
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

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto transition-colors duration-200 ${
        isDarkMode ? 'bg-[#10141D] text-[#E2E2E6]' : 'bg-[#F8FAFD] text-[#1F1F1F]'
      }`}
    >
      {/* Hidden native input for SAF file picking */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onPickLocalFile}
        className="hidden"
        accept="*/*"
      />

      {/* Material 3 Top App Bar */}
      <header
        className={`px-5 pt-3.5 pb-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-colors ${
          isDarkMode
            ? 'bg-[#10141D]/90 border-b border-[#222B3A]'
            : 'bg-[#F8FAFD]/90 border-b border-[#E2E7F0]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-inherit">
                {t.appName}
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                OFFLINE
              </span>
            </div>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-300/80 font-medium">
              Material Design 3 • Blue Edition
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Theme Switcher */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 ${
                isDarkMode
                  ? 'text-amber-300 hover:bg-[#1E2634]'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="Toggle Light / Dark Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className={`h-9 px-2.5 rounded-full text-xs font-semibold transition flex items-center gap-1 active:scale-95 ${
              isDarkMode
                ? 'text-neutral-300 hover:bg-[#1E2634]'
                : 'text-neutral-700 hover:bg-blue-50'
            }`}
            title="Toggle English / Hindi Localization"
          >
            {lang === 'en' ? '🇮🇳 HI' : '🇺🇸 EN'}
          </button>

          {/* Legal / Privacy Button */}
          <button
            onClick={onNavigateToLegal}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 ${
              isDarkMode
                ? 'text-blue-400 hover:bg-[#1E2634]'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            title="Legal & Security Policies"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onNavigateToSettings}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 ${
              isDarkMode
                ? 'text-neutral-300 hover:bg-[#1E2634]'
                : 'text-neutral-700 hover:bg-blue-50'
            }`}
            title="Settings & Privacy"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="p-4 space-y-4 pb-28">
        {/* Security / Validation Alert Banner */}
        {validationError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-2xl flex items-start gap-3 text-rose-900 dark:text-rose-200 shadow-sm animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-rose-800 dark:text-rose-300 mb-0.5">
                Security Check Intercepted
              </p>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {validationError}
              </p>
            </div>
            <button
              onClick={clearValidationError}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg text-rose-600 dark:text-rose-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Material 3 Search Bar */}
        <div className="relative">
          <Search
            className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full h-12 pl-11 pr-11 rounded-full text-xs font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
              isDarkMode
                ? 'bg-[#18202D] text-white placeholder-neutral-400 border border-[#283344] focus:border-blue-400 focus:bg-[#1E2634]'
                : 'bg-white text-neutral-900 placeholder-neutral-500 border border-[#E2E7F0] focus:border-blue-600 focus:bg-white shadow-sm'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full transition ${
                isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section 1: Organized Document Categories (Material You Rounded Cards) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 font-mono">
              Document Categories
            </h2>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {documents.length} Total Files
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* PDF Category Card */}
            <div
              onClick={() => setActiveFilter(activeFilter === 'PDF' ? 'ALL' : 'PDF')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 select-none active:scale-[0.98] ${
                activeFilter === 'PDF'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-red-500 ring-2 ring-red-500/30'
                  : isDarkMode
                  ? 'bg-[#18202D] border-[#263244] hover:bg-[#1E2634] hover:border-red-900/50'
                  : 'bg-white border-[#E2E7F0] hover:bg-red-50/40 hover:border-red-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                  {pdfCount}
                </span>
              </div>
              <p className="text-xs font-bold text-inherit">PDF Files</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Native PdfRenderer
              </p>
            </div>

            {/* Spreadsheets Category Card */}
            <div
              onClick={() => setActiveFilter(activeFilter === 'TEXT' ? 'ALL' : 'TEXT')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 select-none active:scale-[0.98] ${
                activeFilter === 'TEXT'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-500/30'
                  : isDarkMode
                  ? 'bg-[#18202D] border-[#263244] hover:bg-[#1E2634] hover:border-emerald-900/50'
                  : 'bg-white border-[#E2E7F0] hover:bg-emerald-50/40 hover:border-emerald-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  {sheetCount}
                </span>
              </div>
              <p className="text-xs font-bold text-inherit">Sheets & CSV</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Streaming Tables
              </p>
            </div>

            {/* Office Docs Category Card */}
            <div
              onClick={() => setActiveFilter(activeFilter === 'OFFICE' ? 'ALL' : 'OFFICE')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 select-none active:scale-[0.98] ${
                activeFilter === 'OFFICE'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 ring-2 ring-blue-500/30'
                  : isDarkMode
                  ? 'bg-[#18202D] border-[#263244] hover:bg-[#1E2634] hover:border-blue-900/50'
                  : 'bg-white border-[#E2E7F0] hover:bg-blue-50/40 hover:border-blue-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Files className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {officeCount}
                </span>
              </div>
              <p className="text-xs font-bold text-inherit">Office Docs</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                DOCX • XLSX • SafeXml
              </p>
            </div>

            {/* Text & Notes Category Card */}
            <div
              onClick={() => setActiveFilter(activeFilter === 'TEXT' ? 'ALL' : 'TEXT')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 select-none active:scale-[0.98] ${
                activeFilter === 'TEXT'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 ring-2 ring-amber-500/30'
                  : isDarkMode
                  ? 'bg-[#18202D] border-[#263244] hover:bg-[#1E2634] hover:border-amber-900/50'
                  : 'bg-white border-[#E2E7F0] hover:bg-amber-50/40 hover:border-amber-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  {textCount}
                </span>
              </div>
              <p className="text-xs font-bold text-inherit">Text & Notes</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Plain Text Logs
              </p>
            </div>

            {/* Images Category Card */}
            <div
              onClick={() => setActiveFilter(activeFilter === 'IMAGES' ? 'ALL' : 'IMAGES')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 select-none active:scale-[0.98] col-span-2 sm:col-span-1 ${
                activeFilter === 'IMAGES'
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 ring-2 ring-sky-500/30'
                  : isDarkMode
                  ? 'bg-[#18202D] border-[#263244] hover:bg-[#1E2634] hover:border-sky-900/50'
                  : 'bg-white border-[#E2E7F0] hover:bg-sky-50/40 hover:border-sky-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                  {imageCount}
                </span>
              </div>
              <p className="text-xs font-bold text-inherit">Photos & Images</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Subsampled Bitmaps
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Material 3 Filter Chips Row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
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
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all duration-150 min-h-[36px] flex items-center gap-1.5 font-medium text-xs select-none active:scale-95 ${
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

        {/* Section 3: Recent Documents Header */}
        <div className="flex items-center justify-between pt-1 px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-inherit font-mono">
              {t.recentFiles} ({filteredDocs.length})
            </h2>
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-300 font-mono bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/60">
            SAF Sandboxed
          </span>
        </div>

        {/* Section 4: Recent Documents List */}
        {filteredDocs.length === 0 ? (
          <div
            className={`py-12 px-6 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed transition-colors ${
              isDarkMode
                ? 'border-[#283344] bg-[#141A24]/60'
                : 'border-[#D8E2EE] bg-white/70 shadow-sm'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <FolderOpen className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold mb-1 text-inherit">{t.emptyRecentTitle}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed mb-4">
              {t.emptyRecentDesc}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition flex items-center gap-2 active:scale-95"
            >
              <FolderOpen className="w-4 h-4" /> Pick File from Storage
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDocs.map(doc => {
              const badge = getFormatBadge(doc.format);
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenDocument(doc)}
                  className={`group p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3 cursor-pointer select-none active:scale-[0.99] shadow-sm ${
                    isDarkMode
                      ? 'bg-[#18202D] hover:bg-[#1E2634] border-[#263244] hover:border-blue-500/40'
                      : 'bg-white hover:bg-blue-50/30 border-[#E2E7F0] hover:border-blue-300'
                  }`}
                >
                  {/* Format Squircle Icon */}
                  <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-[#111620] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {badge.icon}
                  </div>

                  {/* Document Details */}
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
                      <span
                        className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[9px] border ${badge.bg}`}
                      >
                        {badge.badgeText}
                      </span>
                      <span>•</span>
                      <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{new Date(doc.lastAccessedTimestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Star and Delete Actions */}
                  <div
                    className="flex items-center gap-1"
                    onClick={e => e.stopPropagation()}
                  >
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
                        className={`w-4 h-4 ${
                          doc.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
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

      {/* Material 3 Extended Floating Action Button (FAB) */}
      <div className="fixed bottom-12 right-6 z-30">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-14 px-5 rounded-[20px] bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 flex items-center gap-2.5 transition-all duration-200 active:scale-95 border border-white/20 select-none cursor-pointer"
          title="Open Document via Storage Access Framework"
        >
          <FolderOpen className="w-5 h-5 text-white" />
          <span className="tracking-wide">{t.openDocument}</span>
        </button>
      </div>
    </div>
  );
};
