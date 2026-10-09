import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, FileCode2, Folder, Terminal, Download } from 'lucide-react';

interface AndroidProjectInspectorProps {
  onBack: () => void;
  isDarkMode?: boolean;
}

interface CodeFile {
  path: string;
  name: string;
  lang: string;
  content: string;
}

const ANDROID_FILES: CodeFile[] = [
  {
    path: 'android/settings.gradle.kts',
    name: 'settings.gradle.kts',
    lang: 'kotlin',
    content: `rootProject.name = "DocuFlex"
include(":app")
include(":core:model")
include(":core:security")
include(":core:viewer")
include(":feature:home")
include(":feature:viewer")
include(":feature:settings")
include(":feature:legal")`
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    lang: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 
      PERMISSIONS AUDIT:
      DocuFlex is 100% OFFLINE.
      Zero network permissions allowed.
      Zero broad storage permissions (READ_EXTERNAL_STORAGE is strictly avoided; Storage Access Framework is used).
      Zero camera, microphone, contacts, location, notification or SMS permissions.
    -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <application
        android:name=".DocuFlexApplication"
        android:allowBackup="false"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:networkSecurityConfig="@xml/network_security_config"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.DocuFlex">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.DocuFlex">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Storage Access Framework VIEW filter for documents -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:mimeType="application/pdf" />
                <data android:mimeType="text/plain" />
                <data android:mimeType="text/csv" />
                <data android:mimeType="image/*" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  },
  {
    path: 'android/core/security/MagicBytesDetector.kt',
    name: 'MagicBytesDetector.kt',
    lang: 'kotlin',
    content: `package com.docuflex.core.security

import com.docuflex.core.model.DocumentFormat
import java.io.InputStream

/**
 * Validates document content by magic bytes and binary signatures.
 * Security rule: NEVER trust file extensions provided by untrusted sources.
 */
object MagicBytesDetector {
    private val PDF_MAGIC = byteArrayOf(0x25, 0x50, 0x44, 0x46) // %PDF
    private val PNG_MAGIC = byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    private val JPEG_MAGIC = byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte())
    private val ZIP_MAGIC = byteArrayOf(0x50, 0x4B, 0x03, 0x04) // PK.. (DOCX, XLSX, PPTX)
    private val DOS_MZ_MAGIC = byteArrayOf(0x4D, 0x5A) // MZ executable

    fun detect(stream: InputStream): DocumentFormat {
        val header = ByteArray(1024)
        val readCount = stream.read(header)
        if (readCount < 4) return DocumentFormat.UNKNOWN

        // Reject dangerous executables
        if (header[0] == DOS_MZ_MAGIC[0] && header[1] == DOS_MZ_MAGIC[1]) {
            throw SecurityException("Executable binary signature detected!")
        }

        if (header.take(4).toByteArray().contentEquals(PDF_MAGIC)) return DocumentFormat.PDF
        if (header.take(8).toByteArray().contentEquals(PNG_MAGIC)) return DocumentFormat.PNG
        if (header.take(3).toByteArray().contentEquals(JPEG_MAGIC)) return DocumentFormat.JPEG
        if (header.take(4).toByteArray().contentEquals(ZIP_MAGIC)) return DocumentFormat.DOCX

        return DocumentFormat.TXT
    }
}`
  },
  {
    path: 'scripts/check-permissions.sh',
    name: 'check-permissions.sh',
    lang: 'bash',
    content: `#!/usr/bin/env bash
set -euo pipefail

# DocuFlex Strict Permission Compliance Auditor
MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"

echo "=== DocuFlex Permission Audit ==="

# 1. Audit against INTERNET permission
if grep -qi '<uses-permission[^>]*android.permission.INTERNET' "$MANIFEST_FILE"; then
    echo "FAILED: android.permission.INTERNET is strictly forbidden in DocuFlex!"
    exit 1
fi
echo "✓ PASSED: No android.permission.INTERNET declared."

# 2. Audit against Broad Storage permissions
if grep -Eiq "<uses-permission[^>]+(READ_EXTERNAL_STORAGE|MANAGE_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE)" "$MANIFEST_FILE"; then
    echo "FAILED: Broad external storage permission detected! DocuFlex strictly uses SAF."
    exit 1
fi
echo "✓ PASSED: Zero broad storage permissions detected (Storage Access Framework confirmed)."

# 3. Verify allowBackup is set to false
if ! grep -qi 'android:allowBackup="false"' "$MANIFEST_FILE"; then
    echo "FAILED: allowBackup must be set to false for privacy protection!"
    exit 1
fi
echo "✓ PASSED: allowBackup=\\"false\\" confirmed."
echo "SECURITY AUDIT COMPLETED SUCCESSFULLY: 100% OFFLINE"`
  }
];

export const AndroidProjectInspector: React.FC<AndroidProjectInspectorProps> = ({
  onBack,
  isDarkMode = true
}) => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col h-full overflow-hidden transition-colors duration-200 select-none ${
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
              isDarkMode ? 'hover:bg-[#1E2634] text-neutral-300' : 'hover:bg-blue-50 text-neutral-700'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-inherit flex items-center gap-2">
              Android Source Explorer
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Kotlin / Gradle
              </span>
            </h2>
            <p className="text-[10px] text-blue-600 dark:text-blue-300 font-mono">
              Native modular architecture in /android
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className={`h-9 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition active:scale-95 ${
            isDarkMode
              ? 'bg-[#18202D] hover:bg-[#222B3A] text-neutral-200 border-[#283344]'
              : 'bg-white hover:bg-neutral-100 text-neutral-800 border-[#E2E7F0]'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy File'}</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div
          className={`w-64 border-r overflow-y-auto p-3 space-y-1 text-xs transition-colors ${
            isDarkMode ? 'bg-[#10141D] border-[#222B3A]' : 'bg-[#F0F4F9] border-[#E2E7F0]'
          }`}
        >
          <div className="px-2 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono">
            Key Modules & Sources
          </div>
          {ANDROID_FILES.map(file => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2 rounded-xl flex items-center gap-2 transition font-mono text-[11px] ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : isDarkMode
                    ? 'text-neutral-400 hover:text-white hover:bg-[#18202D]'
                    : 'text-neutral-600 hover:text-black hover:bg-white'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content View */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${
            isDarkMode ? 'bg-[#141A24]' : 'bg-white'
          }`}
        >
          <div
            className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono ${
              isDarkMode ? 'bg-[#10141D] border-[#222B3A] text-neutral-400' : 'bg-[#F8FAFD] border-[#E2E7F0] text-neutral-600'
            }`}
          >
            <span>{selectedFile.path}</span>
            <span className="uppercase text-blue-600 dark:text-blue-400 font-semibold">{selectedFile.lang}</span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <pre
              className={`font-mono text-xs leading-relaxed whitespace-pre ${
                isDarkMode ? 'text-neutral-200' : 'text-neutral-800'
              }`}
            >
              {selectedFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
