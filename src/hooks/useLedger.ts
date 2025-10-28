import { useState, useCallback, useEffect, useRef } from 'react';
import {
  LedgerWalletService,
  LedgerDevice,
  LedgerError,
  listLedgerDevices,
  getActiveLedgerDevice,
} from '../utils/ledger';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

interface UseLedgerReturn {
  device: LedgerDevice | null;
  devices: LedgerDevice[];
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<LedgerDevice | null>;
  disconnect: () => Promise<void>;
  getAddress: (derivationPath?: string, display?: boolean) => Promise<{ address: string; publicKey: string } | null>;
  signTransaction: (transaction: Transaction | VersionedTransaction, derivationPath?: string) => Promise<Buffer | null>;
  signMessage: (message: Uint8Array, derivationPath?: string) => Promise<Buffer | null>;
  refreshDevices: () => Promise<void>;
  clearError: () => void;
}

export function useLedger(): UseLedgerReturn {
  const [device, setDevice] = useState<LedgerDevice | null>(null);
  const [devices, setDevices] = useState<LedgerDevice[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef<LedgerWalletService>(new LedgerWalletService());

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const devicesList = await listLedgerDevices();
      setDevices(devicesList);
      
      const activeDevice = await getActiveLedgerDevice();
      if (activeDevice) {
        setDevice(activeDevice);
      }
    } catch (err) {
      console.error('Failed to refresh devices:', err);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  const connect = useCallback(async (): Promise<LedgerDevice | null> => {
    setIsConnecting(true);
    setError(null);

    try {
      const isSupported = await serviceRef.current.isSupported();
      if (!isSupported) {
        throw new LedgerError('WebHID is not supported in this browser. Please use Chrome, Edge, or Opera.', 'WEBHID_NOT_SUPPORTED');
      }

      const connectedDevice = await serviceRef.current.requestDevice();
      setDevice(connectedDevice);
      await refreshDevices();
      return connectedDevice;
    } catch (err: any) {
      const errorMessage = err instanceof LedgerError 
        ? err.message 
        : 'Failed to connect to Ledger device';
      setError(errorMessage);
      console.error('Ledger connection error:', err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [refreshDevices]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await serviceRef.current.disconnect();
      setDevice(null);
      await refreshDevices();
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError('Failed to disconnect from Ledger device');
    }
  }, [refreshDevices]);

  const getAddress = useCallback(async (
    derivationPath: string = "44'/501'/0'/0'",
    display: boolean = false
  ): Promise<{ address: string; publicKey: string } | null> => {
    setError(null);
    try {
      const result = await serviceRef.current.getAddress(derivationPath, display);
      await refreshDevices();
      return result;
    } catch (err: any) {
      const errorMessage = err instanceof LedgerError 
        ? err.message 
        : 'Failed to get address from Ledger';
      setError(errorMessage);
      console.error('Get address error:', err);
      return null;
    }
  }, [refreshDevices]);

  const signTransaction = useCallback(async (
    transaction: Transaction | VersionedTransaction,
    derivationPath: string = "44'/501'/0'/0'"
  ): Promise<Buffer | null> => {
    setError(null);
    try {
      const signature = await serviceRef.current.signTransaction(transaction, derivationPath);
      return signature;
    } catch (err: any) {
      const errorMessage = err instanceof LedgerError 
        ? err.message 
        : 'Failed to sign transaction';
      setError(errorMessage);
      console.error('Sign transaction error:', err);
      return null;
    }
  }, []);

  const signMessage = useCallback(async (
    message: Uint8Array,
    derivationPath: string = "44'/501'/0'/0'"
  ): Promise<Buffer | null> => {
    setError(null);
    try {
      const signature = await serviceRef.current.signMessage(message, derivationPath);
      return signature;
    } catch (err: any) {
      const errorMessage = err instanceof LedgerError 
        ? err.message 
        : 'Failed to sign message';
      setError(errorMessage);
      console.error('Sign message error:', err);
      return null;
    }
  }, []);

  const isConnected = serviceRef.current.isConnected();

  return {
    device,
    devices,
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect,
    getAddress,
    signTransaction,
    signMessage,
    refreshDevices,
    clearError,
  };
}
