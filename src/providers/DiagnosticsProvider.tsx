import { ReactNode, useEffect, useRef } from 'react';
import { record } from 'rrweb';
import { useDiagnosticsStore } from '../store/diagnosticsStore';

interface DiagnosticsProviderProps {
  children: ReactNode;
}

export function DiagnosticsProvider({ children }: DiagnosticsProviderProps) {
  const {
    sessionRecordingEnabled,
    sessionRecordingConsented,
    privacyMaskingEnabled,
    isRecording,
    startRecording,
    stopRecording,
    addRecordingEvent,
    addConsoleLog,
    addErrorLog,
    setSessionRecordingEnabled,
  } = useDiagnosticsStore(state => ({
    sessionRecordingEnabled: state.sessionRecordingEnabled,
    sessionRecordingConsented: state.sessionRecordingConsented,
    privacyMaskingEnabled: state.privacyMaskingEnabled,
    isRecording: state.isRecording,
    startRecording: state.startRecording,
    stopRecording: state.stopRecording,
    addRecordingEvent: state.addRecordingEvent,
    addConsoleLog: state.addConsoleLog,
    addErrorLog: state.addErrorLog,
    setSessionRecordingEnabled: state.setSessionRecordingEnabled,
  }));

  const stopRef = useRef<(() => void) | null>(null);
  const consoleOriginals = useRef<Partial<Record<'log' | 'warn' | 'error' | 'info' | 'debug', (...args: any[]) => void>>>({});

  // Manage rrweb recording lifecycle
  useEffect(() => {
    if (sessionRecordingEnabled && sessionRecordingConsented && !stopRef.current) {
      try {
        startRecording();
        stopRef.current = record({
          emit: (event) => {
            addRecordingEvent(event);
          },
          maskAllInputs: privacyMaskingEnabled,
          maskAllText: privacyMaskingEnabled,
          blockClass: 'rrweb-mask',
          inlineStylesheet: true,
          maskTextClass: 'rrweb-mask-text',
        });
      } catch (error) {
        console.error('Failed to start session recording', error);
        setSessionRecordingEnabled(false);
      }
    }

    if ((!sessionRecordingEnabled || !sessionRecordingConsented) && stopRef.current) {
      stopRef.current();
      stopRef.current = null;
      stopRecording();
    }

    return () => {
      if (stopRef.current) {
        stopRef.current();
        stopRef.current = null;
      }
      stopRecording();
    };
  }, [sessionRecordingEnabled, sessionRecordingConsented, privacyMaskingEnabled, startRecording, stopRecording, addRecordingEvent, setSessionRecordingEnabled]);

  // Capture console logs while recording
  useEffect(() => {
    if (!sessionRecordingEnabled || !sessionRecordingConsented) return;

    const levels: Array<'log' | 'warn' | 'error' | 'info' | 'debug'> = ['log', 'warn', 'error', 'info', 'debug'];
    levels.forEach(level => {
      const original = console[level];
      consoleOriginals.current[level] = original;
      console[level] = (...args: any[]) => {
        addConsoleLog({
          timestamp: Date.now(),
          level,
          message: String(args[0]),
          args,
        });
        original(...args);
      };
    });

    return () => {
      levels.forEach(level => {
        const original = consoleOriginals.current[level];
        if (original) {
          console[level] = original;
        }
      });
    };
  }, [sessionRecordingEnabled, sessionRecordingConsented, addConsoleLog]);

  // Capture window errors while recording
  useEffect(() => {
    if (!sessionRecordingEnabled || !sessionRecordingConsented) return;

    const handleError = (event: ErrorEvent) => {
      addErrorLog({
        timestamp: Date.now(),
        message: event.message,
        stack: event.error?.stack,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      addErrorLog({
        timestamp: Date.now(),
        message: String(event.reason),
        stack: event.reason?.stack,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [sessionRecordingEnabled, sessionRecordingConsented, addErrorLog]);

  return <>{children}</>;
}
