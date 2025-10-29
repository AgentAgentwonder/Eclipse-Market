import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import Solana from '@ledgerhq/hw-app-solana';
import { invoke } from '@tauri-apps/api/tauri';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export interface LedgerDevice {
  deviceId: string;
  productName: string;
  manufacturer: string;
  connected: boolean;
  firmwareVersion?: string;
  address?: string;
  publicKey?: string;
}

export interface LedgerDeviceInfo {
  targetId: string;
  seVersion: string;
  mcuVersion: string;
}

export class LedgerError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'LedgerError';
  }
}

export class LedgerWalletService {
  private transport: TransportWebHID | null = null;
  private solanaApp: Solana | null = null;
  private currentDeviceId: string | null = null;

  async isSupported(): Promise<boolean> {
    return TransportWebHID.isSupported();
  }

  async requestDevice(): Promise<LedgerDevice> {
    try {
      if (!(await this.isSupported())) {
        throw new LedgerError('WebHID is not supported in this browser', 'WEBHID_NOT_SUPPORTED');
      }

      this.transport = await TransportWebHID.create();

      const deviceInfo = this.transport.device;
      const deviceId = deviceInfo.productId.toString(16).padStart(4, '0');

      this.solanaApp = new Solana(this.transport);

      const appConfig = await this.solanaApp.getAppConfiguration();

      this.currentDeviceId = deviceId;

      const device: LedgerDevice = {
        deviceId: deviceId,
        productName: deviceInfo.productName || 'Ledger Device',
        manufacturer: deviceInfo.manufacturerName || 'Ledger',
        connected: true,
        firmwareVersion: `${appConfig.version}`,
      };

      await invoke('ledger_register_device', { device });

      return device;
    } catch (error: any) {
      if (error?.name === 'TransportOpenUserCancelled') {
        throw new LedgerError('User cancelled device selection', 'USER_CANCELLED');
      }
      if (error?.statusCode === 0x6511) {
        throw new LedgerError('Solana app is not opened on the device', 'APP_NOT_OPENED');
      }
      if (error?.statusCode === 0x6700) {
        throw new LedgerError(
          'Wrong app opened on device. Please open the Solana app.',
          'WRONG_APP'
        );
      }
      throw new LedgerError(
        error?.message || 'Failed to connect to Ledger device',
        'CONNECTION_FAILED'
      );
    }
  }

  async getAddress(
    derivationPath: string = "44'/501'/0'/0'",
    display: boolean = false
  ): Promise<{ address: string; publicKey: string }> {
    if (!this.solanaApp) {
      throw new LedgerError('No Ledger device connected', 'NOT_CONNECTED');
    }

    try {
      const result = await this.solanaApp.getAddress(derivationPath, display);

      const address = result.address.toString();
      const publicKey = new PublicKey(result.address).toBase58();

      if (this.currentDeviceId) {
        await invoke('ledger_update_device_address', {
          deviceId: this.currentDeviceId,
          address,
          publicKey,
        });
      }

      return { address, publicKey };
    } catch (error: any) {
      if (error?.statusCode === 0x6985) {
        throw new LedgerError('User rejected on device', 'USER_REJECTED');
      }
      if (error?.statusCode === 0x6511) {
        throw new LedgerError('Solana app is not opened on the device', 'APP_NOT_OPENED');
      }
      throw new LedgerError(
        error?.message || 'Failed to get address from Ledger',
        'GET_ADDRESS_FAILED'
      );
    }
  }

  async signTransaction(
    transaction: Transaction | VersionedTransaction,
    derivationPath: string = "44'/501'/0'/0'"
  ): Promise<Buffer> {
    if (!this.solanaApp) {
      throw new LedgerError('No Ledger device connected', 'NOT_CONNECTED');
    }

    try {
      let serialized: Buffer;

      if (transaction instanceof VersionedTransaction) {
        serialized = Buffer.from(transaction.message.serialize());
      } else {
        serialized = transaction.serializeMessage();
      }

      const transactionBase64 = serialized.toString('base64');

      if (this.currentDeviceId) {
        await invoke('ledger_validate_transaction', {
          request: {
            deviceId: this.currentDeviceId,
            transaction: transactionBase64,
            derivationPath,
          },
        });
      }

      const result = await this.solanaApp.signTransaction(derivationPath, serialized);

      return result.signature;
    } catch (error: any) {
      if (error?.statusCode === 0x6985) {
        throw new LedgerError('User rejected transaction on device', 'USER_REJECTED');
      }
      if (error?.statusCode === 0x6511) {
        throw new LedgerError('Solana app is not opened on the device', 'APP_NOT_OPENED');
      }
      if (error?.statusCode === 0x6a80) {
        throw new LedgerError('Invalid transaction data', 'INVALID_DATA');
      }
      throw new LedgerError(error?.message || 'Failed to sign transaction', 'SIGN_FAILED');
    }
  }

  async signMessage(
    message: Uint8Array,
    derivationPath: string = "44'/501'/0'/0'"
  ): Promise<Buffer> {
    if (!this.solanaApp) {
      throw new LedgerError('No Ledger device connected', 'NOT_CONNECTED');
    }

    try {
      const result = await this.solanaApp.signOffchainMessage(derivationPath, message);
      return result.signature;
    } catch (error: any) {
      if (error?.statusCode === 0x6985) {
        throw new LedgerError('User rejected message signing on device', 'USER_REJECTED');
      }
      if (error?.statusCode === 0x6511) {
        throw new LedgerError('Solana app is not opened on the device', 'APP_NOT_OPENED');
      }
      throw new LedgerError(error?.message || 'Failed to sign message', 'SIGN_MESSAGE_FAILED');
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.currentDeviceId) {
        await invoke('ledger_disconnect_device', { deviceId: this.currentDeviceId });
      }

      if (this.transport) {
        await this.transport.close();
      }
    } catch (error) {
      console.error('Error disconnecting Ledger:', error);
    } finally {
      this.transport = null;
      this.solanaApp = null;
      this.currentDeviceId = null;
    }
  }

  isConnected(): boolean {
    return this.transport !== null && this.solanaApp !== null;
  }

  getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  async getDeviceInfo(): Promise<LedgerDeviceInfo | null> {
    if (!this.solanaApp) {
      return null;
    }

    try {
      const config = await this.solanaApp.getAppConfiguration();
      return {
        targetId: '0',
        seVersion: config.version,
        mcuVersion: '0',
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }
}

export async function listLedgerDevices(): Promise<LedgerDevice[]> {
  try {
    return await invoke<LedgerDevice[]>('ledger_list_devices');
  } catch (error) {
    console.error('Error listing Ledger devices:', error);
    return [];
  }
}

export async function getLedgerDevice(deviceId: string): Promise<LedgerDevice | null> {
  try {
    return await invoke<LedgerDevice>('ledger_get_device', { deviceId });
  } catch (error) {
    console.error('Error getting Ledger device:', error);
    return null;
  }
}

export async function getActiveLedgerDevice(): Promise<LedgerDevice | null> {
  try {
    return await invoke<LedgerDevice | null>('ledger_get_active_device');
  } catch (error) {
    console.error('Error getting active Ledger device:', error);
    return null;
  }
}

export async function removeLedgerDevice(deviceId: string): Promise<void> {
  try {
    await invoke('ledger_remove_device', { deviceId });
  } catch (error) {
    console.error('Error removing Ledger device:', error);
    throw error;
  }
}

export async function clearAllLedgerDevices(): Promise<void> {
  try {
    await invoke('ledger_clear_devices');
  } catch (error) {
    console.error('Error clearing Ledger devices:', error);
    throw error;
  }
}
