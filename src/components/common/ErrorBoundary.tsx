import { Component, ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';
import { relaunch } from '@tauri-apps/api/process';
import { AlertCircle, RotateCcw, Send } from 'lucide-react';
import { useDiagnosticsStore } from '../../store/diagnosticsStore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showCommentDialog: boolean;
  userComment: string;
  commentSubmitted: boolean;
  crashId?: string;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showCommentDialog: false,
      userComment: '',
      commentSubmitted: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({ errorInfo });

    const store = useDiagnosticsStore.getState();

    // Add crash report to local store
    if (store.crashReportingEnabled && store.crashReportingConsented) {
      const crash = store.addCrashReport({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        environment: {
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        },
        sessionId: store.currentRecordingId || undefined,
      });
      
      if (crash) {
        this.setState({ crashId: crash.id });
      }

      // Report to Sentry if enabled
      Sentry.withScope(scope => {
        scope.setContext('errorInfo', {
          componentStack: errorInfo.componentStack,
        });
        scope.setContext('environment', {
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        });
        if (store.currentRecordingId) {
          scope.setTag('sessionId', store.currentRecordingId);
        }
        Sentry.captureException(error);
      });
    }
  }

  handleRestart = async () => {
    const store = useDiagnosticsStore.getState();
    if (store.autoRestartEnabled) {
      try {
        await relaunch();
      } catch (error) {
        console.error('Failed to relaunch app, falling back to window.location.reload', error);
        window.location.reload();
      }
    } else {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showCommentDialog: false,
        userComment: '',
        commentSubmitted: false,
      });
    }
  };

  handleShowCommentDialog = () => {
    this.setState({ showCommentDialog: true });
  };

  handleSubmitComment = () => {
    const { userComment, error, errorInfo, crashId } = this.state;
    const store = useDiagnosticsStore.getState();

    if (store.crashReportingEnabled && store.crashReportingConsented && userComment) {
      if (crashId) {
        store.updateCrashReport(crashId, { userComment });
      }

      // Add comment to Sentry
      Sentry.captureMessage(`User feedback: ${userComment}`, {
        level: 'info',
        contexts: {
          crash: {
            message: error?.message,
            stack: error?.stack,
            componentStack: errorInfo?.componentStack,
          },
        },
      });

      this.setState({ commentSubmitted: true });
    }
  };

  render() {
    const { hasError, error, showCommentDialog, userComment, commentSubmitted } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Application Error</h1>
                <p className="text-white/60">Something went wrong</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="font-mono text-sm text-red-400 mb-2">{error.message}</p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-sm text-white/60 cursor-pointer hover:text-white/80 transition-colors">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-white/40 overflow-x-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {!showCommentDialog && !commentSubmitted && (
              <div className="space-y-3">
                <button
                  onClick={this.handleRestart}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restart Application
                </button>
                <button
                  onClick={this.handleShowCommentDialog}
                  className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Report Issue
                </button>
              </div>
            )}

            {showCommentDialog && !commentSubmitted && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Help us fix this (optional)
                  </label>
                  <textarea
                    value={userComment}
                    onChange={e => this.setState({ userComment: e.target.value })}
                    placeholder="Describe what you were doing when the error occurred..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={this.handleSubmitComment}
                    disabled={!userComment.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Feedback
                  </button>
                  <button
                    onClick={this.handleRestart}
                    className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-semibold text-white transition-all"
                  >
                    Skip & Restart
                  </button>
                </div>
              </div>
            )}

            {commentSubmitted && (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                  <p className="text-green-400 font-medium">Thank you for your feedback!</p>
                  <p className="text-white/60 text-sm mt-1">
                    Your report will help us improve the application.
                  </p>
                </div>
                <button
                  onClick={this.handleRestart}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restart Application
                </button>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-blue-400 text-sm">
                <strong>Note:</strong> If crash reporting is enabled, technical details have been
                automatically sent to help us diagnose the issue.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export const ErrorBoundary = Sentry.withErrorBoundary(ErrorBoundaryClass, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-2xl text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Critical Error</h1>
        <p className="text-white/60 mb-6">{error?.message || 'An unexpected error occurred'}</p>
        <button
          onClick={resetError}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    </div>
  ),
});
