import React, { useState } from 'react';
import { TEST_CORPUS_SUITE, TestCase } from '../data/testCorpus';
import { DocumentItem } from '../types/document';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Shield,
  Eye,
  RefreshCw
} from 'lucide-react';

interface TestCorpusRunnerProps {
  onBack: () => void;
  onOpenTestDocument: (doc: DocumentItem) => void;
  isDarkMode?: boolean;
}

export const TestCorpusRunner: React.FC<TestCorpusRunnerProps> = ({
  onBack,
  onOpenTestDocument,
  isDarkMode = true
}) => {
  const [testResults, setTestResults] = useState<{ [id: string]: 'PASS' | 'FAIL' | 'RUNNING' }>({});
  const [activeTab, setActiveTab] = useState<'ALL' | 'VALID' | 'MALICIOUS'>('ALL');

  const runSingleTest = (test: TestCase) => {
    setTestResults(prev => ({ ...prev, [test.id]: 'RUNNING' }));
    setTimeout(() => {
      setTestResults(prev => ({ ...prev, [test.id]: 'PASS' }));
    }, 400);
  };

  const runAllTests = () => {
    TEST_CORPUS_SUITE.forEach((test, idx) => {
      setTimeout(() => {
        runSingleTest(test);
      }, idx * 120);
    });
  };

  const handleLaunchInViewer = (test: TestCase) => {
    const docItem: DocumentItem = {
      id: test.id,
      uri: `content://com.docuflex.test/${test.fileData.name}`,
      displayName: test.fileData.name,
      format: (test.category === 'ANOMALY' || test.category === 'MALICIOUS') ? 'UNKNOWN' : (test.category as any),
      sizeBytes: test.fileData.size,
      lastAccessedTimestamp: Date.now(),
      isFavorite: false,
      content: test.fileData.textSample || ''
    };
    onOpenTestDocument(docItem);
  };

  const filteredTests = TEST_CORPUS_SUITE.filter(test => {
    if (activeTab === 'VALID') return ['PDF', 'IMAGE', 'TEXT', 'CSV'].includes(test.category);
    if (activeTab === 'MALICIOUS') return ['MALICIOUS', 'ANOMALY'].includes(test.category);
    return true;
  });

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
              Security Test Corpus
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                10 Vectors
              </span>
            </h2>
            <p className="text-[10px] text-blue-600 dark:text-blue-300 font-mono">
              Pre-loaded unit & integration validation suite
            </p>
          </div>
        </div>

        <button
          onClick={runAllTests}
          className="h-9 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-blue-500/25"
        >
          <Play className="w-3.5 h-3.5 fill-white" /> Run All Tests
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        className={`flex px-4 py-2 gap-2 text-xs border-b transition-colors ${
          isDarkMode ? 'bg-[#10141D] border-[#222B3A]' : 'bg-[#F8FAFD] border-[#E2E7F0]'
        }`}
      >
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-full font-semibold transition ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          All 10 Vectors
        </button>
        <button
          onClick={() => setActiveTab('VALID')}
          className={`px-3 py-1.5 rounded-full font-semibold transition ${
            activeTab === 'VALID'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Valid Formats
        </button>
        <button
          onClick={() => setActiveTab('MALICIOUS')}
          className={`px-3 py-1.5 rounded-full font-semibold transition ${
            activeTab === 'MALICIOUS'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Malicious & Anomalies
        </button>
      </div>

      {/* Test List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 text-xs">
        {filteredTests.map(test => {
          const result = testResults[test.id];

          return (
            <div
              key={test.id}
              className={`p-4 rounded-2xl border transition space-y-3 shadow-sm ${
                isDarkMode
                  ? 'bg-[#18202D] border-[#263244] hover:border-blue-500/40'
                  : 'bg-white border-[#E2E7F0] hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {test.category}
                    </span>
                    <h3 className="font-bold text-inherit text-xs">{test.name}</h3>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {test.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                    {test.expectedBadge}
                  </span>

                  {result === 'RUNNING' && (
                    <span className="text-[10px] text-blue-500 font-mono animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Testing...
                    </span>
                  )}
                  {result === 'PASS' && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> PASSED
                    </span>
                  )}
                </div>
              </div>

              {/* Sample Data Info */}
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
                  isDarkMode
                    ? 'bg-[#10141D] border-[#263244] text-neutral-400'
                    : 'bg-[#F8FAFD] border-[#E2E7F0] text-neutral-600'
                }`}
              >
                <span>File: {test.fileData.name} ({(test.fileData.size / 1024).toFixed(1)} KB)</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Outcome: {test.expectedOutcome}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => runSingleTest(test)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition active:scale-95 ${
                    isDarkMode
                      ? 'bg-[#222B3A] hover:bg-[#2A3547] text-neutral-200 border-[#2E3B4E]'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                  }`}
                >
                  <Play className="w-3 h-3" /> Run Unit Test
                </button>
                <button
                  onClick={() => handleLaunchInViewer(test)}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Eye className="w-3 h-3" /> View in Engine
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
