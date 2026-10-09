import React, { useState, useEffect } from 'react';
import { DeviceFormFactor } from '../types/document';
import {
  Shield,
  WifiOff,
  BatteryCharging,
  Fingerprint,
  EyeOff,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Sun,
  Moon
} from 'lucide-react';

interface AndroidFrameProps {
  formFactor: DeviceFormFactor;
  setFormFactor: (f: DeviceFormFactor) => void;
  isFlagSecure: boolean;
  isBiometricRequired: boolean;
  onBiometricSuccess: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  formFactor,
  setFormFactor,
  isFlagSecure,
  isBiometricRequired,
  onBiometricSuccess,
  isDarkMode,
  onToggleTheme,
  children
}) => {
  const [currentTime, setCurrentTime] = useState('12:00');
  const [isBiometricPromptOpen, setIsBiometricPromptOpen] = useState(false);
  const [screenCapturedAttempt, setScreenCapturedAttempt] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isBiometricRequired) {
      setIsBiometricPromptOpen(true);
    }
  }, [isBiometricRequired]);

  const handleSimulateScreenshot = () => {
    if (isFlagSecure) {
      setScreenCapturedAttempt(true);
      setTimeout(() => setScreenCapturedAttempt(false), 2500);
    }
  };

  const getFrameDimensions = () => {
    switch (formFactor) {
      case 'phone':
        return 'w-[412px] h-[860px] rounded-[48px] border-[10px] shadow-2xl';
      case 'foldable':
        return 'w-[680px] h-[820px] rounded-[36px] border-[10px] shadow-2xl';
      case 'tablet':
        return 'w-[960px] h-[680px] rounded-[32px] border-[12px] shadow-2xl';
      case 'responsive':
      default:
        return 'w-full h-[90vh] max-w-5xl rounded-2xl border shadow-xl';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 select-none w-full">
      {/* Device Toolbar / Simulator Controls */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 w-full max-w-4xl mb-3 px-4 py-2.5 backdrop-blur-md rounded-2xl border text-xs transition-colors shadow-sm ${
          isDarkMode
            ? 'bg-[#18202D]/90 border-[#283344] text-neutral-300'
            : 'bg-white/95 border-[#E2E7F0] text-neutral-700 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-400 text-[11px] uppercase tracking-wider font-mono">
            Form Factor:
          </span>
          <div
            className={`flex p-0.5 rounded-xl border ${
              isDarkMode ? 'bg-[#10141D] border-[#283344]' : 'bg-[#F0F4F9] border-[#E2E7F0]'
            }`}
          >
            <button
              onClick={() => setFormFactor('phone')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                formFactor === 'phone'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Pixel 8
            </button>
            <button
              onClick={() => setFormFactor('foldable')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                formFactor === 'foldable'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" /> Foldable
            </button>
            <button
              onClick={() => setFormFactor('tablet')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                formFactor === 'tablet'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Tablet
            </button>
            <button
              onClick={() => setFormFactor('responsive')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                formFactor === 'responsive'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" /> Responsive
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition active:scale-95 text-xs font-semibold ${
              isDarkMode
                ? 'bg-[#10141D] hover:bg-[#202938] text-amber-300 border-[#283344]'
                : 'bg-[#F0F4F9] hover:bg-blue-50 text-blue-700 border-[#E2E7F0]'
            }`}
            title="Toggle Material You Light / Dark Theme"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button
            onClick={handleSimulateScreenshot}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition active:scale-95 text-xs ${
              isDarkMode
                ? 'bg-[#10141D] hover:bg-[#202938] text-neutral-300 border-[#283344]'
                : 'bg-[#F0F4F9] hover:bg-neutral-200 text-neutral-700 border-[#E2E7F0]'
            }`}
            title="Simulate OS Screenshot Capture"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Test FLAG_SECURE</span>
          </button>

          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/60 font-semibold">
            <WifiOff className="w-3 h-3" /> OFFLINE
          </div>
        </div>
      </div>

      {/* Android Device Body */}
      <div
        className={`relative flex flex-col overflow-hidden transition-all duration-300 ${getFrameDimensions()} ${
          isDarkMode
            ? 'bg-[#10141D] border-[#222B3A]'
            : 'bg-[#F8FAFD] border-[#D8E2EE]'
        }`}
      >
        {/* Top Punch-hole Camera */}
        {formFactor !== 'tablet' && formFactor !== 'responsive' && (
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-50 pointer-events-none flex items-center justify-center ${
              isDarkMode ? 'bg-black ring-1 ring-neutral-800' : 'bg-neutral-900 ring-1 ring-neutral-700'
            }`}
          >
            <div className="w-1.5 h-1.5 bg-neutral-950 rounded-full"></div>
          </div>
        )}

        {/* Android Status Bar */}
        <div
          className={`w-full h-8 px-6 flex items-center justify-between text-[11px] font-medium backdrop-blur-md select-none z-40 border-b transition-colors ${
            isDarkMode
              ? 'bg-[#10141D]/90 text-neutral-300 border-[#222B3A]'
              : 'bg-[#F8FAFD]/90 text-neutral-800 border-[#E2E7F0]'
          }`}
        >
          <span className="font-bold tracking-tight">{currentTime}</span>

          <div className="flex items-center gap-2.5">
            {isFlagSecure && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-[10px]" title="FLAG_SECURE Active">
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">PROTECTED</span>
              </span>
            )}
            <span className="flex items-center gap-1" title="Offline State">
              <WifiOff className={`w-3 h-3 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`} />
            </span>
            <span className="flex items-center gap-1 font-bold" title="Battery 100%">
              100%
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
            </span>
          </div>
        </div>

        {/* Android Display Viewport Content */}
        <div
          className={`relative flex-1 flex flex-col overflow-hidden transition-colors ${
            isDarkMode ? 'bg-[#10141D] text-[#E2E2E6]' : 'bg-[#F8FAFD] text-[#1F1F1F]'
          }`}
        >
          {children}

          {/* Screenshot Shield Simulation (FLAG_SECURE) */}
          {screenCapturedAttempt && (
            <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center mb-4 text-blue-400">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">FLAG_SECURE Shield Enforced</h3>
              <p className="text-xs text-neutral-300 max-w-xs leading-relaxed mb-4">
                Operating system screen capture was rejected. WindowManager.FLAG_SECURE prevented sensitive document data from leaking into screenshots or recent app thumbnails.
              </p>
              <span className="text-[11px] text-blue-400 bg-blue-950 px-3 py-1 rounded-full border border-blue-800 font-semibold">
                Screen Protected • Transient Memory Safe
              </span>
            </div>
          )}

          {/* Biometric Prompt Dialog Simulation */}
          {isBiometricPromptOpen && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end justify-center p-4">
              <div
                className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-slide-up border ${
                  isDarkMode
                    ? 'bg-[#18202D] border-[#283344] text-white'
                    : 'bg-white border-[#E2E7F0] text-neutral-900'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold mb-1">Unlock DocuFlex</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
                  Touch the fingerprint sensor or confirm your device credential PIN to open documents.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setIsBiometricPromptOpen(false);
                      onBiometricSuccess();
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-blue-500/25"
                  >
                    Authenticate with Biometric
                  </button>
                  <button
                    onClick={() => {
                      setIsBiometricPromptOpen(false);
                      onBiometricSuccess();
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isDarkMode
                        ? 'bg-[#222B3A] hover:bg-[#2A3547] text-neutral-300'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    Use PIN
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Android Gesture Navigation Bar Pill */}
        <div
          className={`w-full h-5 flex items-center justify-center z-40 select-none transition-colors ${
            isDarkMode ? 'bg-[#10141D]' : 'bg-[#F8FAFD]'
          }`}
        >
          <div
            className={`w-32 h-1 rounded-full transition cursor-pointer ${
              isDarkMode ? 'bg-neutral-600/70 hover:bg-neutral-400' : 'bg-neutral-400/80 hover:bg-neutral-600'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
};
