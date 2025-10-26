import { describe, expect, beforeEach, it } from 'vitest'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

import { useWalletStore, PhantomSession, HardwareWalletSession, HardwareDevice } from './walletStore'

const resetStore = () => {
  const state = useWalletStore.getState()
  state.reset()
  state.resetHardware()
  state.setNetwork(WalletAdapterNetwork.Devnet)
  state.setEndpoint(null)
  state.setAutoReconnect(true)
  state.setAttemptedAutoConnect(false)
  state.setSession(null)
  state.setError(null)
  state.setStatus('disconnected')
  state.setBalance(0)
}

describe('walletStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('initialises with disconnected state', () => {
    const state = useWalletStore.getState()
    expect(state.status).toBe('disconnected')
    expect(state.publicKey).toBeNull()
    expect(state.balance).toBe(0)
    expect(state.autoReconnect).toBe(true)
  })

  it('sets public key and status', () => {
    const state = useWalletStore.getState()
    state.setPublicKey('abc123')
    state.setStatus('connected')

    const next = useWalletStore.getState()
    expect(next.publicKey).toBe('abc123')
    expect(next.status).toBe('connected')
  })

  it('persists session details', () => {
    const session: PhantomSession = {
      publicKey: 'key123',
      network: 'devnet',
      connected: true,
      lastConnected: '2024-01-01T00:00:00Z',
      label: 'Phantom',
    }

    useWalletStore.getState().setSession(session)

    const next = useWalletStore.getState()
    expect(next.session).toEqual(session)
    expect(next.session?.label).toBe('Phantom')
  })

  it('resets to disconnected state', () => {
    const state = useWalletStore.getState()
    state.setPublicKey('connected')
    state.setBalance(1.5)
    state.setStatus('connected')
    state.setError('error')

    state.reset()

    const next = useWalletStore.getState()
    expect(next.publicKey).toBeNull()
    expect(next.balance).toBe(0)
    expect(next.status).toBe('disconnected')
    expect(next.error).toBeNull()
  })

  it('manages hardware wallet state', () => {
    const device: HardwareDevice = {
      id: 'ledger-1',
      deviceType: 'ledger',
      model: 'Nano X',
      firmwareVersion: '1.0.0',
      connected: false,
    }

    const session: HardwareWalletSession = {
      device: { ...device, connected: true },
      publicKey: 'abc123',
      derivationPath: "44'/501'/0'/0'",
      connectedAt: '2024-01-01T00:00:00Z',
    }

    const state = useWalletStore.getState()
    state.setHardwareDevices([device])
    state.setHardwareStatus('connecting')
    state.setHardwareSession(session)
    state.setHardwareError('test-error')
    state.setWalletType('ledger')

    const next = useWalletStore.getState()
    expect(next.hardwareDevices).toHaveLength(1)
    expect(next.hardwareDevices[0].model).toBe('Nano X')
    expect(next.hardwareStatus).toBe('connecting')
    expect(next.hardwareSession?.publicKey).toBe('abc123')
    expect(next.hardwareError).toBe('test-error')
    expect(next.walletType).toBe('ledger')

    state.resetHardware()
    const resetState = useWalletStore.getState()
    expect(resetState.hardwareDevices).toHaveLength(0)
    expect(resetState.hardwareSession).toBeNull()
    expect(resetState.hardwareStatus).toBe('disconnected')
    expect(resetState.hardwareError).toBeNull()
    expect(resetState.walletType).toBeNull()
  })
})
