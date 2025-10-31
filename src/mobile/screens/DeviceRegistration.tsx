import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface DeviceRegistrationProps {
  onRegistered: (deviceId: string) => void;
}

interface MobileAuthRequest {
  device_id: string;
  device_name: string;
  platform: string;
  biometric_public_key?: string;
}

interface MobileDevice {
  device_id: string;
  device_name: string;
  platform: string;
  push_token?: string | null;
  last_sync?: number | null;
  biometric_enabled: boolean;
}

export const DeviceRegistration: React.FC<DeviceRegistrationProps> = ({ onRegistered }) => {
  const [deviceName, setDeviceName] = useState(() => navigator.userAgent.split('(')[0].trim());
  const [platform, setPlatform] = useState(() => (navigator.userAgent.includes('Android') ? 'android' : 'ios'));
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: MobileAuthRequest = {
        device_id: '',
        device_name: deviceName || 'Mobile Device',
        platform,
        biometric_public_key: biometricEnabled ? 'mock_public_key' : undefined,
      };

      const device = await invoke<MobileDevice>('mobile_register_device', { req: payload });
      onRegistered(device.device_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleRegister}
        className="bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-lg space-y-6"
      >
        <div className="text-center">
          <div className="mx-auto mb-6 h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17l-.5 1.5m5-1.5l.5 1.5M9 20.5h6M4.5 6.75l3.75-3.75h7.5l3.75 3.75M4.5 6.75V19.5A1.5 1.5 0 006 21h12a1.5 1.5 0 001.5-1.5V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Register Mobile Device</h1>
          <p className="text-sm text-gray-400 mt-2">
            Connect your mobile companion app to Eclipse Market Pro with biometric security.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Device Name</label>
            <input
              type="text"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              placeholder="My iPhone"
              className="w-full rounded-xl border border-transparent bg-gray-900/60 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Platform</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlatform('ios')}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                  platform === 'ios'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-gray-700 bg-gray-900/60 text-gray-300 hover:border-gray-500'
                }`}
              >
                iOS
              </button>
              <button
                type="button"
                onClick={() => setPlatform('android')}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                  platform === 'android'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-gray-700 bg-gray-900/60 text-gray-300 hover:border-gray-500'
                }`}
              >
                Android
              </button>
            </div>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-4 flex items-start gap-3">
            <div className="mt-1">
              <input
                id="biometric-toggle"
                type="checkbox"
                checked={biometricEnabled}
                onChange={e => setBiometricEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="biometric-toggle" className="text-sm font-semibold text-gray-200">
                Enable biometric security
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Use Face ID, Touch ID, or fingerprint to secure quick trades and authentication flows.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Registering...' : 'Register Device'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By continuing you agree to enable secure synchronization with your desktop trading environment.
        </p>
      </form>
    </div>
  );
};
