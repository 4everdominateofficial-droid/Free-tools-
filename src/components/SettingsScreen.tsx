import React, { useState } from 'react';
import { LanguageCode } from '../types/document';
import { LOCALES } from '../data/locales';
import {
  ArrowLeft,
  Shield,
  Fingerprint,
  History,
  Trash2,
  StarOff,
  AlertOctagon,
  Languages,
  CheckCircle2,
  Info,
  Sun,
  Moon,
  ShieldCheck,
  Code2,
  TestTube,
  FileSearch,
  UserCheck
} from 'lucide-react';

interface SettingsScreenProps {
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  isFlagSecure: boolean;
  setIsFlagSecure: (val: boolean) => void;
  isBiometricLock: boolean;
  setIsBiometricLock: (val: boolean) => void;
  isHistoryEnabled: boolean;
  setIsHistoryEnabled: (val: boolean) => void;
  onClearHistory: () => void;
  onClearFavorites: () => void;
  onBack: () => void;
  onNavigateToTestCorpus?: () => void;
  onNavigateToCodeInspector?: () => void;
  onNavigateToAuditReport?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  lang,
  setLang,
  isFlagSecure,
  setIsFlagSecure,
  isBiometricLock,
  setIsBiometricLock,
  isHistoryEnabled,
  setIsHistoryEnabled,
  onClearHistory,
  onClearFavorites,
  onBack,
  onNavigateToTestCorpus,
  onNavigateToCodeInspector,
  onNavigateToAuditReport,
  isDarkMode = true,
  onToggleTheme
}) => {
  const t = LOCALES[lang];
  const [showClearHistoryPrompt, setShowClearHistoryPrompt] = useState(false);
  const [showClearFavoritesPrompt, setShowClearFavoritesPrompt] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto transition-colors duration-200 select-none ${
        isDarkMode ? 'bg-[#10141D] text-[#E2E2E6]' : 'bg-[#F8FAFD] text-[#1F1F1F]'
      }`}
    >
      {/* Top App Bar */}
      <div
        className={`px-4 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-colors ${
          isDarkMode
            ? 'bg-[#10141D]/90 border-b border-[#222B3A]'
            : 'bg-[#F8FAFD]/90 border-b border-[#E2E7F0]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 ${
              isDarkMode
                ? 'hover:bg-[#1E2634] text-neutral-300'
                : 'hover:bg-blue-50 text-neutral-700'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-inherit">{t.settingsTitle}</h2>
            <p className="text-[10px] text-blue-600 dark:text-blue-300 font-mono">
              Privacy, Security & System Controls
            </p>
          </div>
        </div>

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
      </div>

      <div className="p-4 space-y-5 pb-28">
        {actionNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{actionNotice}</span>
          </div>
        )}

        {/* Section 1: Security Hardening */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono px-1">
            {t.securityHardening}
          </h3>

          <div
            className={`rounded-2xl border divide-y transition-colors shadow-sm overflow-hidden ${
              isDarkMode
                ? 'bg-[#18202D] border-[#263244] divide-[#263244]'
                : 'bg-white border-[#E2E7F0] divide-[#E2E7F0]'
            }`}
          >
            {/* FLAG_SECURE Switch */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-bold text-inherit">{t.flagSecureTitle}</p>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  {t.flagSecureDesc}
                </p>
              </div>
              <button
                onClick={() => setIsFlagSecure(!isFlagSecure)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  isFlagSecure
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : isDarkMode
                    ? 'bg-neutral-700'
                    : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isFlagSecure ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Biometric Lock Switch */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-bold text-inherit">{t.biometricLockTitle}</p>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  {t.biometricLockDesc}
                </p>
              </div>
              <button
                onClick={() => setIsBiometricLock(!isBiometricLock)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  isBiometricLock
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : isDarkMode
                    ? 'bg-neutral-700'
                    : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isBiometricLock ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Local Data Management */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono px-1">
            {t.localDataManagement}
          </h3>

          <div
            className={`rounded-2xl border divide-y transition-colors shadow-sm overflow-hidden ${
              isDarkMode
                ? 'bg-[#18202D] border-[#263244] divide-[#263244]'
                : 'bg-white border-[#E2E7F0] divide-[#E2E7F0]'
            }`}
          >
            {/* Record Recent Files Switch */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <p className="text-xs font-bold text-inherit">{t.recordRecentFiles}</p>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  {t.recordRecentFilesDesc}
                </p>
              </div>
              <button
                onClick={() => setIsHistoryEnabled(!isHistoryEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  isHistoryEnabled
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : isDarkMode
                    ? 'bg-neutral-700'
                    : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isHistoryEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Clear Recent History */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-inherit">{t.clearRecentHistory}</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Purge all recent SAF references from memory.
                </p>
              </div>
              <button
                onClick={() => setShowClearHistoryPrompt(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            {/* Clear Favorites */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-inherit">{t.clearFavorites}</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Remove all starred document bookmarks.
                </p>
              </div>
              <button
                onClick={() => setShowClearFavoritesPrompt(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition active:scale-95 ${
                  isDarkMode
                    ? 'bg-[#222B3A] hover:bg-[#2A3547] text-neutral-300 border-[#2E3B4E]'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                }`}
              >
                <StarOff className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Localization */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono px-1">
            Language & Region
          </h3>

          <div
            className={`p-4 rounded-2xl border flex items-center justify-between transition-colors shadow-sm ${
              isDarkMode
                ? 'bg-[#18202D] border-[#263244]'
                : 'bg-white border-[#E2E7F0]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Languages className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <div>
                <p className="text-xs font-bold text-inherit">App Interface Language</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  English or Hindi (values-hi string resources)
                </p>
              </div>
            </div>

            <div
              className={`flex p-1 rounded-full border text-xs ${
                isDarkMode
                  ? 'bg-[#10141D] border-[#283344]'
                  : 'bg-neutral-100 border-[#E2E7F0]'
              }`}
            >
              <button
                onClick={() => setLang('en')}
                className={`px-3.5 py-1 rounded-full font-semibold transition ${
                  lang === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-3.5 py-1 rounded-full font-semibold transition ${
                  lang === 'hi'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Device Security Limitations Notice */}
        <div
          className={`p-4 rounded-2xl border space-y-1.5 transition-colors ${
            isDarkMode
              ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs text-amber-600 dark:text-amber-400">
            <AlertOctagon className="w-4 h-4" />
            <h4>{t.deviceSecurityLimits}</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            {t.deviceSecurityLimitsDesc}
          </p>
        </div>

        {/* Section 5: Engineering & Security Diagnostics */}
        {(onNavigateToTestCorpus || onNavigateToCodeInspector || onNavigateToAuditReport) && (
          <div className="space-y-2.5 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono px-1">
              Engineering & Security Diagnostics
            </h3>
            <div
              className={`rounded-2xl border divide-y transition-colors shadow-sm overflow-hidden ${
                isDarkMode
                  ? 'bg-[#18202D] border-[#263244] divide-[#263244]'
                  : 'bg-white border-[#E2E7F0] divide-[#E2E7F0]'
              }`}
            >
              {onNavigateToTestCorpus && (
                <div
                  onClick={onNavigateToTestCorpus}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                    isDarkMode ? 'hover:bg-[#222B3A]' : 'hover:bg-blue-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <TestTube className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-inherit">Security Test Suite</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Run 10 defensive corpus test vectors interactively
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Test Suite
                  </span>
                </div>
              )}

              {onNavigateToCodeInspector && (
                <div
                  onClick={onNavigateToCodeInspector}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                    isDarkMode ? 'hover:bg-[#222B3A]' : 'hover:bg-blue-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-inherit">Android Kotlin Source Code</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Inspect native modules, Room, and build.gradle.kts
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Kotlin Code
                  </span>
                </div>
              )}

              {onNavigateToAuditReport && (
                <div
                  onClick={onNavigateToAuditReport}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                    isDarkMode ? 'hover:bg-[#222B3A]' : 'hover:bg-blue-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FileSearch className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-inherit">Verification & Audit Report</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Permissions review, supply chain, and release notes
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Audit Report
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 6: About Section (Simple & Professional with exact Developer text) */}
        <div className="space-y-2.5 pt-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono px-1">
            {t.aboutTitle || 'About DocuFlex'}
          </h3>

          <div
            className={`p-4 rounded-2xl border transition-colors shadow-sm space-y-3 ${
              isDarkMode
                ? 'bg-[#18202D] border-[#263244]'
                : 'bg-white border-[#E2E7F0]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-inherit">{t.appName}</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  Version 1.1.0 • Android TargetSDK 35
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Privacy-first, offline-only document viewer with native Storage Access Framework (SAF) sandboxing, Material Design 3 UI, and zero background analytics.
            </p>

            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isDarkMode
                  ? 'bg-[#10141D] border-[#283344]'
                  : 'bg-[#F8FAFD] border-[#E2E7F0]'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-inherit">
                  Developed by Shahbaz Khan.
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-semibold">
                Official
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      {showClearHistoryPrompt && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border ${
              isDarkMode
                ? 'bg-[#18202D] border-[#283344] text-white'
                : 'bg-white border-[#E2E7F0] text-neutral-900'
            }`}
          >
            <h3 className="text-sm font-bold">Clear Recent History?</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-300 leading-relaxed">
              This will permanently delete all recent file entries from local memory.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowClearHistoryPrompt(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isDarkMode
                    ? 'bg-[#222B3A] hover:bg-[#2A3547] text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearHistoryPrompt(false);
                  triggerNotice('Recent history cleared.');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearFavoritesPrompt && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border ${
              isDarkMode
                ? 'bg-[#18202D] border-[#263244] text-white'
                : 'bg-white border-[#E2E7F0] text-neutral-900'
            }`}
          >
            <h3 className="text-sm font-bold">Clear Favorites?</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-300 leading-relaxed">
              This will remove all starred documents from your favorites list.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowClearFavoritesPrompt(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isDarkMode
                    ? 'bg-[#222B3A] hover:bg-[#2A3547] text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onClearFavorites();
                  setShowClearFavoritesPrompt(false);
                  triggerNotice('Favorites cleared.');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
