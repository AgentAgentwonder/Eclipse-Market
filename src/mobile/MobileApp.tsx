import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { MobileDashboard } from './components/MobileDashboard';
import { BiometricLogin } from './screens/BiometricLogin';
import { DeviceRegistration } from './screens/DeviceRegistration';

interface MobileSession {
  session_id: string;
  device_id: string;
  user_id: string;
  created_at: number;
  expires_at: number;
  is_active: boolean;
}

interface MobileAppState {
  deviceId: string | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isRegistered: boolean;
  loading: boolean;
}

export const MobileApp: React.FC = () => {
  const [state, setState] = useState<MobileAppState>({
    deviceId: null,
    sessionToken: null,
    isAuthenticated: false,
    isRegistered: false,
    loading: true,
  });

  useEffect(() => {
    const deviceId = localStorage.getItem('mobile_device_id');
    const sessionToken = localStorage.getItem('mobile_session_token');

    if (deviceId && sessionToken) {
      invoke<MobileSession>('mobile_authenticate_session', { session_token: sessionToken })
        .then(() => {
          setState({
            deviceId,
            sessionToken,
            isAuthenticated: true,
            isRegistered: true,
            loading: false,
          });
        })
        .catch(() => {
          localStorage.removeItem('mobile_session_token');
          setState(prev => ({
            ...prev,
            isRegistered: !!deviceId,
            loading: false,
          }));
        });
    } else {
      setState(prev => ({
        ...prev,
        isRegistered: !!deviceId,
        loading: false,
      }));
    }
  }, []);

  const handleRegistered = (deviceId: string) => {
    localStorage.setItem('mobile_device_id', deviceId);
    setState(prev => ({
      ...prev,
      deviceId,
      isRegistered: true,
    }));
  };

  const handleAuthenticated = (sessionToken: string) => {
    localStorage.setItem('mobile_session_token', sessionToken);
    setState(prev => ({
      ...prev,
      sessionToken,
      isAuthenticated: true,
    }));
  };

  const handleLogout = () => {
    if (state.sessionToken) {
      invoke('mobile_revoke_session', { session_token: state.sessionToken }).catch(
        console.error
      );
    }
    localStorage.removeItem('mobile_session_token');
    setState(prev => ({
      ...prev,
      sessionToken: null,
      isAuthenticated: false,
    }));
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Initializing mobile companion...</p>
        </div>
      </div>
    );
  }

  if (!state.isRegistered) {
    return <DeviceRegistration onRegistered={handleRegistered} />;
  }

  if (!state.isAuthenticated || !state.deviceId || !state.sessionToken) {
    return (
      <BiometricLogin
        deviceId={state.deviceId || ''}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <MobileDashboard
        deviceId={state.deviceId}
        sessionToken={state.sessionToken}
      />
      
      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-4 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  );
};
