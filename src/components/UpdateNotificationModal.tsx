import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useUpdateStore } from '../store/updateStore';

export function UpdateNotificationModal() {
  const {
    availableUpdate,
    showUpdateModal,
    downloadProgress,
    isDownloading,
    isInstalling,
    setShowUpdateModal,
    downloadAndInstall,
    dismissUpdate,
  } = useUpdateStore();

  if (!availableUpdate || !showUpdateModal) {
    return null;
  }

  const handleInstallNow = async () => {
    await downloadAndInstall();
  };

  const handleInstallLater = () => {
    setShowUpdateModal(false);
  };

  const handleDismiss = async () => {
    await dismissUpdate(availableUpdate.version);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => !isDownloading && !isInstalling && setShowUpdateModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 rounded-3xl border border-purple-500/20 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-purple-500/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Update Available</h2>
                  <p className="text-white/60 text-sm">
                    Version {availableUpdate.version} is ready to install
                  </p>
                </div>
              </div>
              {!isDownloading && !isInstalling && (
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Current: {availableUpdate.currentVersion}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>New: {availableUpdate.version}</span>
              </div>
              {availableUpdate.date && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(availableUpdate.date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[400px]">
            {/* Download Progress */}
            {downloadProgress && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Downloading update...</span>
                  <span className="text-sm text-white/60">{downloadProgress.percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${downloadProgress.percentage}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Installing Status */}
            {isInstalling && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-green-400">
                  Installing update... The application will restart shortly.
                </span>
              </div>
            )}

            {/* Changelog */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What's New</h3>
              
              {availableUpdate.body ? (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-purple-500/10 text-white/80 whitespace-pre-wrap text-sm">
                  {availableUpdate.body}
                </div>
              ) : (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-purple-500/10 text-white/60 text-sm">
                  No changelog available for this version.
                </div>
              )}
            </div>

            {/* Delta Update Notice */}
            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-400/80">
                <p className="font-medium mb-1">Delta Update</p>
                <p>
                  This update uses delta patching to reduce download size. Only the changed files will be downloaded.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isDownloading && !isInstalling && (
            <div className="p-6 border-t border-purple-500/10 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleInstallNow}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Install Now
                </button>

                <button
                  onClick={handleInstallLater}
                  className="flex-1 px-6 py-3 bg-slate-800/50 border border-purple-500/20 rounded-xl font-medium hover:border-purple-500/40 transition-colors"
                >
                  Install Later
                </button>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full px-6 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Skip this version
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
