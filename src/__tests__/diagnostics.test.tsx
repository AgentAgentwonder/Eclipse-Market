import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiagnosticsStore } from '../store/diagnosticsStore';

describe('DiagnosticsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useDiagnosticsStore.setState({
      sessionRecordingEnabled: false,
      sessionRecordingConsented: false,
      privacyMaskingEnabled: true,
      maxRecordingDuration: 30,
      isRecording: false,
      currentRecordingId: null,
      currentRecordingStart: null,
      recordingEvents: [],
      consoleLogs: [],
      errorLogs: [],
      recordings: [],
      crashReportingEnabled: false,
      crashReportingConsented: false,
      autoRestartEnabled: true,
      includeEnvironmentInfo: true,
      crashes: [],
      totalCrashes: 0,
      lastCrashTimestamp: null,
    });
  });

  describe('Session Recording', () => {
    it('should not start recording without consent', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setSessionRecordingEnabled(true);
      });

      expect(result.current.isRecording).toBe(false);
    });

    it('should start recording when both enabled and consented', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setSessionRecordingConsent(true);
        result.current.setSessionRecordingEnabled(true);
      });

      expect(result.current.isRecording).toBe(true);
      expect(result.current.currentRecordingId).toBeTruthy();
    });

    it('should stop recording when consent is revoked', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setSessionRecordingConsent(true);
        result.current.setSessionRecordingEnabled(true);
      });

      expect(result.current.isRecording).toBe(true);

      act(() => {
        result.current.setSessionRecordingConsent(false);
      });

      expect(result.current.isRecording).toBe(false);
      expect(result.current.sessionRecordingEnabled).toBe(false);
    });

    it('should toggle privacy masking', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      expect(result.current.privacyMaskingEnabled).toBe(true);

      act(() => {
        result.current.setPrivacyMaskingEnabled(false);
      });

      expect(result.current.privacyMaskingEnabled).toBe(false);
    });

    it('should add recording events', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setSessionRecordingConsent(true);
        result.current.startRecording();
      });

      const testEvent = { type: 'test', timestamp: Date.now() };

      act(() => {
        result.current.addRecordingEvent(testEvent);
      });

      expect(result.current.recordingEvents).toContain(testEvent);
    });

    it('should save recording when stopped', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setSessionRecordingConsent(true);
        result.current.startRecording();
        result.current.addRecordingEvent({ type: 'test' });
        result.current.stopRecording();
      });

      expect(result.current.recordings.length).toBeGreaterThan(0);
      expect(result.current.isRecording).toBe(false);
    });

    it('should delete recording by id', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setSessionRecordingConsent(true);
        result.current.startRecording();
        result.current.addRecordingEvent({ type: 'test' });
        result.current.stopRecording();
      });

      const recordingId = result.current.recordings[0]?.id;
      expect(recordingId).toBeTruthy();

      act(() => {
        result.current.deleteRecording(recordingId!);
      });

      expect(result.current.recordings.length).toBe(0);
    });

    it('should export recording as JSON', () => {
      const { result } = renderHook(() => useDiagnosticsStore());
      const createElementSpy = vi.spyOn(document, 'createElement');
      const clickSpy = vi.fn();
      createElementSpy.mockReturnValue({
        setAttribute: vi.fn(),
        click: clickSpy,
      } as any);

      act(() => {
        result.current.setSessionRecordingConsent(true);
        result.current.startRecording();
        result.current.addRecordingEvent({ type: 'test' });
        result.current.stopRecording();
      });

      const recordingId = result.current.recordings[0]?.id;

      act(() => {
        result.current.exportRecording(recordingId!);
      });

      expect(clickSpy).toHaveBeenCalled();
      createElementSpy.mockRestore();
    });
  });

  describe('Crash Reporting', () => {
    it('should not enable crash reporting without consent', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setCrashReportingEnabled(true);
      });

      expect(result.current.crashReportingEnabled).toBe(false);
    });

    it('should add crash report', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setCrashReportingConsent(true);
        result.current.setCrashReportingEnabled(true);
      });

      const testCrash = {
        message: 'Test error',
        stack: 'Error stack',
        userAgent: 'test agent',
        url: 'http://test.com',
        environment: {
          platform: 'test',
          language: 'en',
          screenResolution: '1920x1080',
          viewport: '1024x768',
        },
      };

      act(() => {
        result.current.addCrashReport(testCrash);
      });

      expect(result.current.crashes.length).toBe(1);
      expect(result.current.crashes[0].message).toBe('Test error');
      expect(result.current.totalCrashes).toBe(1);
    });

    it('should update crash report with user comment', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setCrashReportingConsent(true);
        result.current.setCrashReportingEnabled(true);
      });

      let crashId: string;

      act(() => {
        const crash = result.current.addCrashReport({
          message: 'Test error',
          userAgent: 'test',
          url: 'http://test.com',
          environment: {
            platform: 'test',
            language: 'en',
            screenResolution: '1920x1080',
            viewport: '1024x768',
          },
        });
        crashId = crash!.id;
      });

      act(() => {
        result.current.updateCrashReport(crashId!, {
          userComment: 'This is what happened',
        });
      });

      const updatedCrash = result.current.getCrashReport(crashId!);
      expect(updatedCrash?.userComment).toBe('This is what happened');
    });

    it('should delete crash report', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      let crashId: string;

      act(() => {
        const crash = result.current.addCrashReport({
          message: 'Test error',
          userAgent: 'test',
          url: 'http://test.com',
          environment: {
            platform: 'test',
            language: 'en',
            screenResolution: '1920x1080',
            viewport: '1024x768',
          },
        });
        crashId = crash!.id;
      });

      expect(result.current.crashes.length).toBe(1);

      act(() => {
        result.current.deleteCrashReport(crashId!);
      });

      expect(result.current.crashes.length).toBe(0);
    });

    it('should calculate crash frequency', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.addCrashReport({
          message: 'Test error 1',
          userAgent: 'test',
          url: 'http://test.com',
          environment: {
            platform: 'test',
            language: 'en',
            screenResolution: '1920x1080',
            viewport: '1024x768',
          },
        });

        result.current.addCrashReport({
          message: 'Test error 2',
          userAgent: 'test',
          url: 'http://test.com',
          environment: {
            platform: 'test',
            language: 'en',
            screenResolution: '1920x1080',
            viewport: '1024x768',
          },
        });
      });

      const frequency = result.current.getCrashFrequency(24);
      expect(frequency).toBe(2);
    });

    it('should clear all crash reports', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.addCrashReport({
          message: 'Test error 1',
          userAgent: 'test',
          url: 'http://test.com',
          environment: {
            platform: 'test',
            language: 'en',
            screenResolution: '1920x1080',
            viewport: '1024x768',
          },
        });

        result.current.addCrashReport({
          message: 'Test error 2',
          userAgent: 'test',
          url: 'http://test.com',
          environment: {
            platform: 'test',
            language: 'en',
            screenResolution: '1920x1080',
            viewport: '1024x768',
          },
        });
      });

      expect(result.current.crashes.length).toBe(2);

      act(() => {
        result.current.clearCrashReports();
      });

      expect(result.current.crashes.length).toBe(0);
    });

    it('should toggle auto-restart', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      expect(result.current.autoRestartEnabled).toBe(true);

      act(() => {
        result.current.setAutoRestartEnabled(false);
      });

      expect(result.current.autoRestartEnabled).toBe(false);
    });
  });

  describe('Privacy & Consent', () => {
    it('should maintain privacy masking by default', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      expect(result.current.privacyMaskingEnabled).toBe(true);
    });

    it('should disable recording when consent is revoked', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setSessionRecordingConsent(true);
        result.current.setSessionRecordingEnabled(true);
      });

      expect(result.current.sessionRecordingEnabled).toBe(true);

      act(() => {
        result.current.setSessionRecordingConsent(false);
      });

      expect(result.current.sessionRecordingEnabled).toBe(false);
    });

    it('should disable crash reporting when consent is revoked', () => {
      const { result } = renderHook(() => useDiagnosticsStore());

      act(() => {
        result.current.setCrashReportingConsent(true);
        result.current.setCrashReportingEnabled(true);
      });

      expect(result.current.crashReportingEnabled).toBe(true);

      act(() => {
        result.current.setCrashReportingConsent(false);
      });

      expect(result.current.crashReportingEnabled).toBe(false);
    });
  });
});
