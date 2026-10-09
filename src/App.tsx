import React, { useState } from 'react';
import {
  AppScreen,
  DeviceFormFactor,
  DocumentFilterType,
  DocumentItem,
  LanguageCode
} from './types/document';
import { AndroidFrame } from './components/AndroidFrame';
import { HomeScreen } from './components/HomeScreen';
import { RecentFilesScreen } from './components/RecentFilesScreen';
import { FavoritesScreen } from './components/FavoritesScreen';
import { DocumentViewer } from './components/DocumentViewer';
import { SettingsScreen } from './components/SettingsScreen';
import { LegalScreens } from './components/LegalScreens';
import { TestCorpusRunner } from './components/TestCorpusRunner';
import { AndroidProjectInspector } from './components/AndroidProjectInspector';
import { VerificationReport } from './components/VerificationReport';
import { validateDocumentFile } from './utils/securityValidator';
import { Home, History, Star, Settings } from 'lucide-react';

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-pdf-guide',
    uri: 'content://com.android.providers.media.documents/document/pdf_101',
    displayName: 'Android_Architecture_Guide.pdf',
    format: 'PDF',
    sizeBytes: 142500,
    lastAccessedTimestamp: Date.now() - 3600000 * 2,
    isFavorite: true,
    pageCount: 3,
    content: '%PDF-1.7\nAndroid Architecture Guide\nPage 1 Content\n'
  },
  {
    id: 'doc-docx-memo',
    uri: 'content://com.android.providers.media.documents/document/docx_102',
    displayName: 'Project_Specification_Memo.docx',
    format: 'DOCX',
    sizeBytes: 24500,
    lastAccessedTimestamp: Date.now() - 3600000 * 3,
    isFavorite: false,
    content: `DOCX Text Preview (Extracted offline via SafeXmlParser)
-----------------------------------------------------
DocuFlex Architectural Security Requirements:
1. Storage Access Framework (SAF) only.
2. 100% Offline execution with zero network permissions.
3. Strict XML parsing with external entities disabled.
4. Automated permission audit task in Gradle.`
  },
  {
    id: 'doc-xlsx-sheet',
    uri: 'content://com.android.providers.media.documents/document/xlsx_103',
    displayName: 'Q3_Global_Audit_Ledger.xlsx',
    format: 'XLSX',
    sizeBytes: 18200,
    lastAccessedTimestamp: Date.now() - 3600000 * 4,
    isFavorite: true,
    content: `ID,Date,Dept,Vendor,Item Description,Amount,Currency,Status
TX-801,2026-09-01,Engineering,JetBrains,"Kotlin Multiplatform Enterprise License",3200.00,USD,Approved
TX-802,2026-09-02,DevOps,Canonical,"Ubuntu Pro Support Tier 3",1450.00,USD,Approved
TX-803,2026-09-05,Security,Trail of Bits,"Independent Mobile Audit",12500.00,USD,Verified`
  },
  {
    id: 'doc-csv-ledger',
    uri: 'content://com.android.providers.media.documents/document/csv_104',
    displayName: 'Transaction_Ledger.csv',
    format: 'CSV',
    sizeBytes: 4200,
    lastAccessedTimestamp: Date.now() - 3600000 * 5,
    isFavorite: false,
    content: `ID,Date,Dept,Vendor,Item Description,Amount,Currency,Status
TX-801,2026-09-01,Engineering,JetBrains,"Kotlin Multiplatform Enterprise License, Team Pack",3200.00,USD,Approved
TX-802,2026-09-02,DevOps,Canonical,"Ubuntu Pro Support, Tier 3",1450.00,USD,Approved
TX-803,2026-09-05,Security,Trail of Bits,"Independent Mobile Cryptographic Audit, Milestone 1",12500.00,USD,Verified
TX-804,2026-09-12,Product,Figma,"Organization Design Seats, Annual",2400.00,USD,Approved
TX-805,2026-09-18,QA,Firebase Test Lab,"Automated Real Device Farm Matrix, 500 hrs",890.50,USD,Settled`
  },
  {
    id: 'doc-txt-release',
    uri: 'content://com.android.providers.media.documents/document/txt_105',
    displayName: 'RELEASE_NOTES_v1.1.txt',
    format: 'TXT',
    sizeBytes: 1850,
    lastAccessedTimestamp: Date.now() - 3600000 * 12,
    isFavorite: false,
    content: `=====================================================
DocuFlex — Privacy-First Document Viewer v1.1.0
Build: TargetSDK 35 (Android 15) • Google Play Compliant
=====================================================

Key Principles:
1. Zero Network Access (No android.permission.INTERNET).
2. Strict Storage Access Framework (SAF) integration.
3. No tracking, telemetry, accounts, or background workers.
4. WindowManager.FLAG_SECURE screenshot prevention.
5. BiometricPrompt authentication.
6. Room persistence for Recents & Favorites with Stale URI detection.`
  },
  {
    id: 'doc-encrypted-pdf',
    uri: 'content://com.android.providers.media.documents/document/pdf_106',
    displayName: 'Confidential_Financials_Encrypted.pdf',
    format: 'PDF',
    sizeBytes: 98400,
    lastAccessedTimestamp: Date.now() - 3600000 * 24,
    isFavorite: false,
    content: '%PDF-1.7\n<< /Encrypt 4 0 R /Filter /Standard >>'
  },
  {
    id: 'doc-stale-sample',
    uri: 'content://com.android.providers.media.documents/document/deleted_file_99',
    displayName: 'Revoked_Permission_Doc.pdf',
    format: 'PDF',
    sizeBytes: 52000,
    lastAccessedTimestamp: Date.now() - 3600000 * 48,
    isFavorite: false,
    isStale: true,
    content: ''
  }
];

export default function App() {
  const [formFactor, setFormFactor] = useState<DeviceFormFactor>('phone');
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Security and Settings State
  const [isFlagSecure, setIsFlagSecure] = useState<boolean>(true);
  const [isBiometricLock, setIsBiometricLock] = useState<boolean>(false);
  const [isHistoryEnabled, setIsHistoryEnabled] = useState<boolean>(true);
  const [isBiometricPromptActive, setIsBiometricPromptActive] = useState<boolean>(false);
  const [pendingDocToOpen, setPendingDocToOpen] = useState<DocumentItem | null>(null);

  // Document Management State (Room / DataStore simulation)
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<DocumentFilterType>('ALL');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Handle Opening a Document
  const handleOpenDocument = (doc: DocumentItem) => {
    if (isBiometricLock) {
      setPendingDocToOpen(doc);
      setIsBiometricPromptActive(true);
    } else {
      setActiveDocument(doc);
      setCurrentScreen('viewer');
    }
  };

  const handleBiometricSuccess = () => {
    setIsBiometricPromptActive(false);
    if (pendingDocToOpen) {
      setActiveDocument(pendingDocToOpen);
      setPendingDocToOpen(null);
      setCurrentScreen('viewer');
    }
  };

  // User Local File Selection via SAF Simulator
  const handlePickLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = await validateDocumentFile(file);
      if (!validation.isValid) {
        setValidationError(validation.errorMessage || 'Invalid or untrusted file format.');
        return;
      }

      setValidationError(null);

      // Read text or binary content
      let contentString = '';
      if (validation.detectedFormat === 'TXT' || validation.detectedFormat === 'CSV' || validation.detectedFormat === 'HTML') {
        contentString = await file.text();
      } else if (validation.detectedFormat === 'DOCX') {
        contentString = `DOCX Text Preview\nExtracted from ${file.name} offline via SafeXmlParser.`;
      } else if (validation.detectedFormat === 'XLSX') {
        contentString = `Sheet1\nRow 1,Column A,Column B\nRow 2,Data 1,Data 2`;
      } else if (validation.detectedFormat === 'PDF') {
        const buf = await file.arrayBuffer();
        contentString = new TextDecoder('latin1').decode(buf.slice(0, 16384));
      }

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        uri: `content://com.android.providers.media.documents/document/${encodeURIComponent(file.name)}`,
        displayName: file.name,
        format: validation.detectedFormat,
        sizeBytes: validation.sizeBytes,
        lastAccessedTimestamp: Date.now(),
        isFavorite: false,
        content: contentString,
        pageCount: validation.detectedFormat === 'PDF' ? 2 : 1
      };

      if (isHistoryEnabled) {
        setDocuments(prev => [newDoc, ...prev.filter(d => d.displayName !== newDoc.displayName)]);
      }

      handleOpenDocument(newDoc);
    } catch (err: any) {
      setValidationError(`Failed to load file: ${err.message || 'Unknown error'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleToggleFavorite = (id: string) => {
    setDocuments(prev =>
      prev.map(d => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d))
    );
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleClearHistory = () => {
    setDocuments([]);
  };

  const handleClearFavorites = () => {
    setDocuments(prev => prev.map(d => ({ ...d, isFavorite: false })));
  };

  const isMainTab = ['home', 'recents', 'favorites', 'settings'].includes(currentScreen);

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center font-sans antialiased transition-colors duration-200 ${
        isDarkMode ? 'bg-[#0B0E14]' : 'bg-[#EBF1FA]'
      }`}
    >
      <AndroidFrame
        formFactor={formFactor}
        setFormFactor={setFormFactor}
        isFlagSecure={isFlagSecure}
        isBiometricRequired={isBiometricPromptActive}
        onBiometricSuccess={handleBiometricSuccess}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      >
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-hidden flex flex-col">
            {currentScreen === 'home' && (
              <HomeScreen
                documents={documents}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                lang={lang}
                setLang={setLang}
                validationError={validationError}
                clearValidationError={() => setValidationError(null)}
                onOpenDocument={handleOpenDocument}
                onToggleFavorite={handleToggleFavorite}
                onDeleteDocument={handleDeleteDocument}
                onPickLocalFile={handlePickLocalFile}
                onNavigateToSettings={() => setCurrentScreen('settings')}
                onNavigateToLegal={() => setCurrentScreen('legal')}
                isDarkMode={isDarkMode}
                onToggleTheme={handleToggleTheme}
              />
            )}

            {currentScreen === 'recents' && (
              <RecentFilesScreen
                documents={documents}
                lang={lang}
                onOpenDocument={handleOpenDocument}
                onToggleFavorite={handleToggleFavorite}
                onRemoveDocument={handleDeleteDocument}
                isDarkMode={isDarkMode}
              />
            )}

            {currentScreen === 'favorites' && (
              <FavoritesScreen
                documents={documents}
                lang={lang}
                onOpenDocument={handleOpenDocument}
                onToggleFavorite={handleToggleFavorite}
                isDarkMode={isDarkMode}
              />
            )}

            {currentScreen === 'viewer' && activeDocument && (
              <DocumentViewer
                document={activeDocument}
                lang={lang}
                onBack={() => setCurrentScreen('home')}
                isDarkMode={isDarkMode}
              />
            )}

            {currentScreen === 'settings' && (
              <SettingsScreen
                lang={lang}
                setLang={setLang}
                isFlagSecure={isFlagSecure}
                setIsFlagSecure={setIsFlagSecure}
                isBiometricLock={isBiometricLock}
                setIsBiometricLock={setIsBiometricLock}
                isHistoryEnabled={isHistoryEnabled}
                setIsHistoryEnabled={setIsHistoryEnabled}
                onClearHistory={handleClearHistory}
                onClearFavorites={handleClearFavorites}
                onBack={() => setCurrentScreen('home')}
                onNavigateToTestCorpus={() => setCurrentScreen('test_corpus')}
                onNavigateToCodeInspector={() => setCurrentScreen('code_inspector')}
                onNavigateToAuditReport={() => setCurrentScreen('audit_report')}
                isDarkMode={isDarkMode}
                onToggleTheme={handleToggleTheme}
              />
            )}

            {currentScreen === 'legal' && (
              <LegalScreens
                lang={lang}
                onBack={() => setCurrentScreen('home')}
                isDarkMode={isDarkMode}
              />
            )}

            {currentScreen === 'test_corpus' && (
              <TestCorpusRunner
                onBack={() => setCurrentScreen('settings')}
                onOpenTestDocument={doc => {
                  handleOpenDocument(doc);
                }}
                isDarkMode={isDarkMode}
              />
            )}

            {currentScreen === 'code_inspector' && (
              <AndroidProjectInspector
                onBack={() => setCurrentScreen('settings')}
                isDarkMode={isDarkMode}
              />
            )}

            {currentScreen === 'audit_report' && (
              <VerificationReport
                onBack={() => setCurrentScreen('settings')}
                isDarkMode={isDarkMode}
              />
            )}
          </div>

          {/* Android Material 3 Navigation Bar with Pill Active Indicators */}
          {isMainTab && (
            <nav
              className={`h-16 flex items-center justify-around px-3 z-30 select-none transition-colors border-t ${
                isDarkMode
                  ? 'bg-[#10141D] border-[#222B3A]'
                  : 'bg-[#F8FAFD] border-[#E2E7F0] shadow-sm'
              }`}
            >
              {/* Home Tab */}
              <button
                onClick={() => setCurrentScreen('home')}
                className="flex-1 py-1 flex flex-col items-center justify-center gap-1 group active:scale-95 transition cursor-pointer"
              >
                <div
                  className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    currentScreen === 'home'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-bold scale-100'
                      : isDarkMode
                      ? 'text-neutral-400 group-hover:text-white'
                      : 'text-neutral-500 group-hover:text-neutral-900'
                  }`}
                >
                  <Home className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] transition-colors leading-none ${
                    currentScreen === 'home'
                      ? 'font-bold text-blue-700 dark:text-blue-300'
                      : 'font-medium text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Home
                </span>
              </button>

              {/* Recent Tab */}
              <button
                onClick={() => setCurrentScreen('recents')}
                className="flex-1 py-1 flex flex-col items-center justify-center gap-1 group active:scale-95 transition cursor-pointer"
              >
                <div
                  className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    currentScreen === 'recents'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-bold scale-100'
                      : isDarkMode
                      ? 'text-neutral-400 group-hover:text-white'
                      : 'text-neutral-500 group-hover:text-neutral-900'
                  }`}
                >
                  <History className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] transition-colors leading-none ${
                    currentScreen === 'recents'
                      ? 'font-bold text-blue-700 dark:text-blue-300'
                      : 'font-medium text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Recent
                </span>
              </button>

              {/* Favorites Tab */}
              <button
                onClick={() => setCurrentScreen('favorites')}
                className="flex-1 py-1 flex flex-col items-center justify-center gap-1 group active:scale-95 transition cursor-pointer"
              >
                <div
                  className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    currentScreen === 'favorites'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-bold scale-100'
                      : isDarkMode
                      ? 'text-neutral-400 group-hover:text-white'
                      : 'text-neutral-500 group-hover:text-neutral-900'
                  }`}
                >
                  <Star className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] transition-colors leading-none ${
                    currentScreen === 'favorites'
                      ? 'font-bold text-blue-700 dark:text-blue-300'
                      : 'font-medium text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Favorites
                </span>
              </button>

              {/* Settings Tab */}
              <button
                onClick={() => setCurrentScreen('settings')}
                className="flex-1 py-1 flex flex-col items-center justify-center gap-1 group active:scale-95 transition cursor-pointer"
              >
                <div
                  className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    currentScreen === 'settings'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-bold scale-100'
                      : isDarkMode
                      ? 'text-neutral-400 group-hover:text-white'
                      : 'text-neutral-500 group-hover:text-neutral-900'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] transition-colors leading-none ${
                    currentScreen === 'settings'
                      ? 'font-bold text-blue-700 dark:text-blue-300'
                      : 'font-medium text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Settings
                </span>
              </button>
            </nav>
          )}
        </div>
      </AndroidFrame>
    </div>
  );
}
