import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface BiometricLoginProps {
  deviceId: string;
  onAuthenticated: (sessionToken: string) => void;
}

interface BiometricChallenge {
  challenge_id: string;
  device_id: string;
  created_at: number;
  expires_at: number;
}

interface MobileAuthResponse {
  session_token: string;
  refresh_token: string;
  expires_in: number;
  device_id: string;
}

export const BiometricLogin: React.FC<BiometricLoginProps> = ({
  deviceId,
  onAuthenticated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBiometricAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      const challenge = await invoke<BiometricChallenge>(
        'mobile_create_biometric_challenge',
        { device_id: deviceId }
      );

      const signature = 'mock_signature_' + Date.now();

      const authResponse = await invoke<MobileAuthResponse>('mobile_verify_biometric', {
        challenge_id: challenge.challenge_id,
        signature,
      });

      onAuthenticated(authResponse.session_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-8 h-20 w-20 rounded-3xl bg-blue-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-3">Eclipse Market Pro</h1>
        <p className="text-gray-400 mb-8">
          Authenticate with biometrics to access your mobile companion
        </p>

        {error && (
          <div className="rounded-xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-6">
            {error}
          </div>
        )}

        <button
          onClick={handleBiometricAuth}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold transition-colors hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Authenticate with Biometrics</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 mt-6">
          Secured with Face ID, Touch ID, or fingerprint authentication
        </p>
      </div>
    </div>
  );
};
