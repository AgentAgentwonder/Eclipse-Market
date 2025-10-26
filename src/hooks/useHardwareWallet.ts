import { invoke } from '@tauri-apps/api/tauri'
import { useCallback } from 'react'
import { useWalletStore } from '../store/walletStore'

interface SignMessageRequest {
  message: string
  derivationPath?: string
}

interface SignTransactionRequest {
  transaction: string
  derivationPath?: string
}

interface SignResponse {
  signature: string
  publicKey: string
}

export function useHardwareWallet() {
  const { hardwareSession, hardwareStatus, setHardwareError } = useWalletStore((state) => ({
    hardwareSession: state.hardwareSession,
    hardwareStatus: state.hardwareStatus,
    setHardwareError: state.setHardwareError,
  }))

  const isHardwareWalletConnected = hardwareSession !== null && hardwareStatus === 'connected'

  const signMessage = useCallback(
    async (message: string, derivationPath?: string): Promise<SignResponse | null> => {
      if (!isHardwareWalletConnected) {
        setHardwareError('Hardware wallet is not connected')
        return null
      }

      try {
        const request: SignMessageRequest = { message, derivationPath }
        const response = await invoke<SignResponse>('hw_sign_message', { request })
        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setHardwareError(errorMessage)
        return null
      }
    },
    [isHardwareWalletConnected, setHardwareError]
  )

  const signTransaction = useCallback(
    async (transaction: string, derivationPath?: string): Promise<SignResponse | null> => {
      if (!isHardwareWalletConnected) {
        setHardwareError('Hardware wallet is not connected')
        return null
      }

      try {
        const response = await invoke<SignResponse>('hw_sign_transaction', {
          transaction,
          derivationPath,
        })
        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setHardwareError(errorMessage)
        return null
      }
    },
    [isHardwareWalletConnected, setHardwareError]
  )

  const getPublicKey = useCallback(
    async (derivationPath?: string): Promise<string | null> => {
      if (!isHardwareWalletConnected) {
        setHardwareError('Hardware wallet is not connected')
        return null
      }

      try {
        const publicKey = await invoke<string>('hw_get_public_key', { derivationPath })
        return publicKey
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setHardwareError(errorMessage)
        return null
      }
    },
    [isHardwareWalletConnected, setHardwareError]
  )

  return {
    isHardwareWalletConnected,
    hardwareSession,
    signMessage,
    signTransaction,
    getPublicKey,
  }
}
