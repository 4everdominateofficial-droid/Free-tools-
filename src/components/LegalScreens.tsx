import React, { useState } from 'react';
import { LanguageCode, LegalTab } from '../types/document';
import { LOCALES } from '../data/locales';
import { ArrowLeft, Shield, FileText, Lock, Award, Check } from 'lucide-react';

interface LegalScreensProps {
  lang: LanguageCode;
  onBack: () => void;
  isDarkMode?: boolean;
}

export const LegalScreens: React.FC<LegalScreensProps> = ({
  lang,
  onBack,
  isDarkMode = true
}) => {
  const t = LOCALES[lang];
  const [activeTab, setActiveTab] = useState<LegalTab>('privacy');

  return (
    <div
      className={`flex flex-col h-full overflow-hidden transition-colors duration-200 select-none ${
        isDarkMode ? 'bg-[#10141D] text-[#E2E2E6]' : 'bg-[#F8FAFD] text-[#1F1F1F]'
      }`}
    >
      {/* Top App Bar */}
      <div
        className={`px-4 py-3 flex items-center gap-3 sticky top-0 z-20 backdrop-blur-md transition-colors ${
          isDarkMode
            ? 'bg-[#10141D]/90 border-b border-[#222B3A]'
            : 'bg-[#F8FAFD]/90 border-b border-[#E2E7F0]'
        }`}
      >
        <button
          onClick={onBack}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 ${
            isDarkMode ? 'hover:bg-[#1E2634] text-neutral-300' : 'hover:bg-blue-50 text-neutral-700'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-inherit">{t.legalHubTitle}</h2>
          <p className="text-[10px] text-blue-600 dark:text-blue-300 font-mono">
            Compliance & Licensing
          </p>
        </div>
      </div>

      {/* Material 3 Tabs */}
      <div
        className={`flex px-2 overflow-x-auto scrollbar-none text-xs transition-colors border-b ${
          isDarkMode
            ? 'bg-[#10141D] border-[#222B3A]'
            : 'bg-[#F8FAFD] border-[#E2E7F0]'
        }`}
      >
        {(
          [
            { key: 'privacy', label: t.privacyTab, icon: Shield },
            { key: 'terms', label: t.termsTab, icon: FileText },
            { key: 'security', label: t.securityTab, icon: Lock },
            { key: 'licenses', label: t.licensesTab, icon: Award }
          ] as const
        ).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 font-medium transition whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 text-xs">
        {/* TAB 1: Privacy Policy */}
        {activeTab === 'privacy' && (
          <div className="space-y-3.5 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-inherit">Privacy Policy</h3>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                Effective Date: October 2026 • DocuFlex v1.1.0
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2 shadow-sm ${
                isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <h4 className="font-bold text-blue-600 dark:text-blue-400">
                1. Zero Data Collection & 100% Offline
              </h4>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                DocuFlex does not contain the{' '}
                <code className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded font-mono">
                  android.permission.INTERNET
                </code>{' '}
                permission in its AndroidManifest.xml. The application cannot communicate over the network, cannot perform background sync, and cannot upload document contents or analytics to any remote server.
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2 shadow-sm ${
                isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <h4 className="font-bold text-blue-600 dark:text-blue-400">
                2. Local Storage of Metadata
              </h4>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                To maintain your Recent Files and Favorites, DocuFlex stores strictly minimal metadata (Storage Access Framework content URI, user-facing file name, size, timestamp) in private application storage. No document bodies or rendered pages are written to persistent disk.
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2 shadow-sm ${
                isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <h4 className="font-bold text-blue-600 dark:text-blue-400">
                3. Transient Memory & Cache Lifecycle
              </h4>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Temporary bitmap allocations or transient file descriptors are stored exclusively in the app-private cache directory (
                <code className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded font-mono">
                  context.cacheDir
                </code>
                ). These files are purged on document exit, on application cold-start, and on system low-memory triggers. Android cloud backup is disabled via{' '}
                <code className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded font-mono">
                  android:allowBackup=&quot;false&quot;
                </code>
                .
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2 shadow-sm ${
                isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <h4 className="font-bold text-blue-600 dark:text-blue-400">
                4. Developer Contact
              </h4>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                For security inquiries or bug reports, please contact: <code className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded font-mono">security@docuflex-app.internal</code>.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Terms & Conditions */}
        {activeTab === 'terms' && (
          <div className="space-y-3.5 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-inherit">Terms & Conditions</h3>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Scope of License & Service</p>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2 shadow-sm ${
                isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <h4 className="font-bold text-blue-600 dark:text-blue-400">
                1. Intended Use & Viewer-Only Scope
              </h4>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                DocuFlex is strictly a viewer utility. The application does not provide document editing, conversion, or file alteration capabilities. You remain solely responsible for maintaining backups of your documents.
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2 shadow-sm ${
                isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <h4 className="font-bold text-blue-600 dark:text-blue-400">
                2. Rendering Limitations & Compatibility
              </h4>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Internal rendering is supported for standard PDF, TXT, CSV, PNG, JPEG, WEBP, and sanitized HTML. Password-protected PDFs and complex Office documents (DOC, DOCX, PPT, PPTX, XLS, XLSX) require external viewers.
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2 shadow-sm ${
                isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <h4 className="font-bold text-blue-600 dark:text-blue-400">
                3. Consumer Rights Clause
              </h4>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Nothing in these Terms and Conditions limits, excludes, or modifies any mandatory statutory consumer guarantees or rights under applicable local laws that cannot be lawfully excluded.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Security & Safety Architecture */}
        {activeTab === 'security' && (
          <div className="space-y-3.5 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-inherit">Security Architecture</h3>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Defensive Parsing Matrix</p>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-3 shadow-sm ${
                isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
              }`}
            >
              <h4 className="font-bold text-blue-600 dark:text-blue-400">
                Implemented Security Controls:
              </h4>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-300 list-disc list-inside leading-relaxed">
                <li>
                  <span className="font-bold text-inherit">Storage Access Framework:</span> Access scoped to user-selected URIs with zero broad storage permissions.
                </li>
                <li>
                  <span className="font-bold text-inherit">Magic Byte Verification:</span> Strict binary header inspection before attempting file decode.
                </li>
                <li>
                  <span className="font-bold text-inherit">ZipSlip & ZipBomb Protection:</span> Rejects traversal patterns (<code className="font-mono">../</code>) and caps decompression size.
                </li>
                <li>
                  <span className="font-bold text-inherit">XML Hardening:</span> Disallows DTD declarations and external entities (XXE-safe).
                </li>
                <li>
                  <span className="font-bold text-inherit">HTML Sanitization:</span> Strips scripts and isolates all web markup inside an offline sandbox.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: Open Source Licenses */}
        {activeTab === 'licenses' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-inherit">Open Source Licenses</h3>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Permissive Open Source Components</p>
            </div>

            {[
              { name: 'AndroidX Core KTX', version: '1.13.1', license: 'Apache License 2.0', org: 'Google LLC' },
              { name: 'Jetpack Compose UI & Material 3', version: '1.2.1 / 2024.06.00', license: 'Apache License 2.0', org: 'Google LLC' },
              { name: 'Kotlinx Coroutines Android', version: '1.8.1', license: 'Apache License 2.0', org: 'JetBrains s.r.o.' },
              { name: 'AndroidX Biometric', version: '1.2.0-alpha05', license: 'Apache License 2.0', org: 'Google LLC' },
              { name: 'AndroidX DataStore Preferences', version: '1.1.1', license: 'Apache License 2.0', org: 'Google LLC' },
              { name: 'JUnit Testing Framework', version: '4.13.2', license: 'Eclipse Public License 1.0', org: 'JUnit Team' }
            ].map((lib, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm ${
                  isDarkMode ? 'bg-[#18202D] border-[#263244]' : 'bg-white border-[#E2E7F0]'
                }`}
              >
                <div>
                  <p className="font-bold text-inherit text-xs">{lib.name}</p>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    {lib.version} • {lib.org}
                  </p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                  {lib.license}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
