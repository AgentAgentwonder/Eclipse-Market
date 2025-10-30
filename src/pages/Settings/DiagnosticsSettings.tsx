import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Bug,
  Shield,
  AlertCircle,
  CheckCircle,
  Download,
  Trash2,
  Eye,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import { useDiagnosticsStore } from '../../store/diagnosticsStore';
import { SessionReplayViewer } from './SessionReplayViewer';
import { CrashDashboard } from './CrashDashboard';

export function DiagnosticsSettings() {
  const {
    sessionRecordingEnabled,
    sessionRecordingConsented,
    privacyMaskingEnabled,
    maxRecordingDuration,
    isRecording,
    recordings,
    crashReportingEnabled,
    crashReportingConsented,
    autoRestartEnabled,
    setSessionRecordingConsent,
    setSessionRecordingEnabled,
    setPrivacyMaskingEnabled,
    setCrashReportingConsent,
    setCrashReportingEnabled,
    setAutoRestartEnabled,
    deleteRecording,
    exportRecording,
    clearCrashReports,
  } = useDiagnosticsStore();

  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentType, setConsentType] = useState<'recording' | 'crash'>('recording');
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [showCrashDashboard, setShowCrashDashboard] = useState(false);

  const handleRequestConsent = (type: 'recording' | 'crash') => {
    setConsentType(type);
    setShowConsentDialog(true);
  };

  const handleAcceptConsent = () => {
    if (consentType === 'recording') {
      setSessionRecordingConsent(true);
      setSessionRecordingEnabled(true);
    } else {
      setCrashReportingConsent(true);
      setCrashReportingEnabled(true);
    }
    setShowConsentDialog(false);
  };

  const handleDeclineConsent = () => {
    setShowConsentDialog(false);
  };

  const handleRevokeRecordingConsent = () => {
    if (window.confirm('Are you sure you want to disable session recording? All stored recordings will be preserved.')) {
      setSessionRecordingConsent(false);
      setSessionRecordingEnabled(false);
    }
  };

  const handleRevokeCrashConsent = () => {
    if (window.confirm('Are you sure you want to disable crash reporting?')) {
      setCrashReportingConsent(false);
      setCrashReportingEnabled(false);
    }
  };

  if (selectedRecordingId) {
    return (
      <SessionReplayViewer
        recordingId={selectedRecordingId}
        onClose={() => setSelectedRecordingId(null)}
      />
    );
  }

  if (showCrashDashboard) {
    return <CrashDashboard onClose={() => setShowCrashDashboard(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Consent Dialog */}
      {showConsentDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full border border-purple-500/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-purple-400" />
              <h3 className="text-xl font-bold">Privacy Consent Required</h3>
            </div>

            <div className="space-y-4 mb-6">
              {consentType === 'recording' ? (
                <>
                  <p className="text-white/80">
                    Session recording captures your UI interactions to help diagnose issues and improve the application.
                  </p>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <h4 className="font-semibold text-blue-400 mb-2">What is recorded:</h4>
                    <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                      <li>Mouse movements, clicks, and scrolling</li>
                      <li>Page navigation and DOM changes</li>
                      <li>Console logs and JavaScript errors</li>
                      <li>Network request metadata (not contents)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <h4 className="font-semibold text-green-400 mb-2">Privacy protections:</h4>
                    <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                      <li>Sensitive input fields are automatically masked</li>
                      <li>Recordings stored locally for maximum 30 minutes</li>
                      <li>Data never leaves your device unless you export it</li>
                      <li>You can disable recording at any time</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-white/80">
                    Crash reporting automatically sends error information when the application encounters a critical issue.
                  </p>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <h4 className="font-semibold text-blue-400 mb-2">What is sent:</h4>
                    <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                      <li>Error messages and stack traces</li>
                      <li>Browser and operating system information</li>
                      <li>Page URL and user actions leading to the crash</li>
                      <li>Optional: Your comments about what happened</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <h4 className="font-semibold text-green-400 mb-2">Privacy protections:</h4>
                    <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                      <li>No personally identifiable information is sent</li>
                      <li>Sensitive data is filtered before transmission</li>
                      <li>Reports are anonymized and aggregated</li>
                      <li>You can disable crash reporting at any time</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAcceptConsent}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
              >
                Accept & Enable
              </button>
              <button
                onClick={handleDeclineConsent}
                className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-semibold text-white transition-all"
              >
                Decline
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Session Recording Section */}
      <div className="p-6 bg-slate-900/30 rounded-2xl border border-purple-500/10">
        <div className="flex items-center gap-3 mb-4">
          <Video className="w-6 h-6 text-purple-400" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Session Recording</h3>
            <p className="text-sm text-white/60">Record UI interactions for troubleshooting</p>
          </div>
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-400 font-medium">Recording</span>
            </div>
          )}
        </div>

        {!sessionRecordingConsented ? (
          <div className="space-y-3">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-400/90">
                Session recording is disabled. Enable it to help diagnose issues and improve your experience.
              </div>
            </div>
            <button
              onClick={() => handleRequestConsent('recording')}
              className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl font-semibold text-purple-400 transition-all"
            >
              Enable Session Recording
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-400 font-medium">Session recording is enabled</p>
                <p className="text-sm text-white/60 mt-1">
                  Recording last {maxRecordingDuration} minutes • {recordings.length} recording
                  {recordings.length !== 1 ? 's' : ''} stored
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <span className="text-sm font-medium">Privacy Masking</span>
                  <p className="text-xs text-white/60 mt-1">Mask sensitive input fields and text</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyMaskingEnabled}
                  onChange={e => setPrivacyMaskingEnabled(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-700 border-purple-500/30 text-purple-500 focus:ring-2 focus:ring-purple-500/50"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <span className="text-sm font-medium">Active Recording</span>
                  <p className="text-xs text-white/60 mt-1">Currently recording your session</p>
                </div>
                <input
                  type="checkbox"
                  checked={sessionRecordingEnabled}
                  onChange={e => setSessionRecordingEnabled(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-700 border-purple-500/30 text-purple-500 focus:ring-2 focus:ring-purple-500/50"
                />
              </label>
            </div>

            {recordings.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Recent Recordings</h4>
                <div className="space-y-2">
                  {recordings.slice(-5).reverse().map(recording => (
                    <div
                      key={recording.id}
                      className="p-3 bg-slate-800/50 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(recording.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-white/60">
                          {Math.round(recording.duration / 1000)}s • {recording.events.length} events
                          • {recording.errors.length} errors
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRecordingId(recording.id)}
                          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                          title="View recording"
                        >
                          <Eye className="w-4 h-4 text-purple-400" />
                        </button>
                        <button
                          onClick={() => exportRecording(recording.id)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                          title="Export recording"
                        >
                          <Download className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => deleteRecording(recording.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                          title="Delete recording"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleRevokeRecordingConsent}
              className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-medium text-red-400 text-sm transition-all"
            >
              Disable Session Recording
            </button>
          </div>
        )}
      </div>

      {/* Crash Reporting Section */}
      <div className="p-6 bg-slate-900/30 rounded-2xl border border-purple-500/10">
        <div className="flex items-center gap-3 mb-4">
          <Bug className="w-6 h-6 text-red-400" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Crash Reporting</h3>
            <p className="text-sm text-white/60">Automatically report application errors</p>
          </div>
        </div>

        {!crashReportingConsented ? (
          <div className="space-y-3">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-400/90">
                Crash reporting is disabled. Enable it to help us fix bugs and improve stability.
              </div>
            </div>
            <button
              onClick={() => handleRequestConsent('crash')}
              className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-semibold text-red-400 transition-all"
            >
              Enable Crash Reporting
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-400 font-medium">Crash reporting is enabled</p>
                <p className="text-sm text-white/60 mt-1">Errors will be automatically reported</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <span className="text-sm font-medium">Active Reporting</span>
                  <p className="text-xs text-white/60 mt-1">Send crash reports when errors occur</p>
                </div>
                <input
                  type="checkbox"
                  checked={crashReportingEnabled}
                  onChange={e => setCrashReportingEnabled(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-700 border-red-500/30 text-red-500 focus:ring-2 focus:ring-red-500/50"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <span className="text-sm font-medium">Auto-Restart</span>
                  <p className="text-xs text-white/60 mt-1">Automatically restart after crashes</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoRestartEnabled}
                  onChange={e => setAutoRestartEnabled(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-700 border-red-500/30 text-red-500 focus:ring-2 focus:ring-red-500/50"
                />
              </label>
            </div>

            <button
              onClick={() => setShowCrashDashboard(true)}
              className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl font-semibold text-purple-400 transition-all flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              View Crash Dashboard
            </button>

            <button
              onClick={handleRevokeCrashConsent}
              className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-medium text-red-400 text-sm transition-all"
            >
              Disable Crash Reporting
            </button>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <h4 className="font-semibold text-blue-400 mb-2">Privacy Notice</h4>
        <p className="text-sm text-white/70">
          All diagnostic data is processed in accordance with our privacy policy. Session recordings
          are stored locally on your device and only shared when you explicitly export them. Crash
          reports are anonymized and used solely for improving application stability.
        </p>
      </div>
    </div>
  );
}
