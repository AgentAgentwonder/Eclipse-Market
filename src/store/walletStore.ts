import { create } from 'zustand'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware'

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface PhantomSession {
  publicKey: string
  network: string
  connected: boolean
  lastConnected?: string | null
  label?: string
}

interface WalletStoreState {
  status: WalletStatus
  publicKey: string | null
  balance: number
  network: WalletAdapterNetwork
  endpoint: string | null
  error: string | null
  autoReconnect: boolean
  attemptedAutoConnect: boolean
  lastConnected: string | null
  session: PhantomSession | null

  setStatus: (status: WalletStatus) => void
  setPublicKey: (publicKey: string | null) => void
  setBalance: (balance: number) => void
  setError: (error: string | null) => void
  setNetwork: (network: WalletAdapterNetwork) => void
  setEndpoint: (endpoint: string | null) => void
  setAutoReconnect: (autoReconnect: boolean) => void
  setAttemptedAutoConnect: (attempted: boolean) => void
  setLastConnected: (timestamp: string | null) => void
  setSession: (session: PhantomSession | null) => void
  reset: () => void
}

const memoryStorage = (): StateStorage => {
  const store = new Map<string, string | null>()

  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value)
    },
    removeItem: (name) => {
      store.delete(name)
    },
  }
}

const getEnv = () => (typeof import.meta !== 'undefined' ? import.meta.env : undefined)

const normalizeNetwork = (value?: string): WalletAdapterNetwork => {
  const normalized = value?.toLowerCase()
  switch (normalized) {
    case 'mainnet-beta':
    case 'mainnet':
      return WalletAdapterNetwork.Mainnet
    case 'testnet':
      return WalletAdapterNetwork.Testnet
    case 'devnet':
    default:
      return WalletAdapterNetwork.Devnet
  }
}

const env = getEnv()
const defaultNetwork = normalizeNetwork(env?.VITE_SOLANA_NETWORK)
const defaultEndpoint = env?.VITE_SOLANA_RPC_ENDPOINT ?? null

export const useWalletStore = create<WalletStoreState>()(
  persist(
    (set, _get) => ({
      status: 'disconnected',
      publicKey: null,
      balance: 0,
      network: defaultNetwork,
      endpoint: defaultEndpoint,
      error: null,
      autoReconnect: true,
      attemptedAutoConnect: false,
      lastConnected: null,
      session: null,

      setStatus: (status) => set({ status }),
      setPublicKey: (publicKey) => set({ publicKey }),
      setBalance: (balance) => set({ balance }),
      setError: (error) => set({ error }),
      setNetwork: (network) => set({ network }),
      setEndpoint: (endpoint) => set({ endpoint }),
      setAutoReconnect: (autoReconnect) => set({ autoReconnect }),
      setAttemptedAutoConnect: (attempted) => set({ attemptedAutoConnect: attempted }),
      setLastConnected: (timestamp) => set({ lastConnected: timestamp }),
      setSession: (session) => set({ session }),
      reset: () =>
        set({
          status: 'disconnected',
          publicKey: null,
          balance: 0,
          error: null,
          session: null,
          lastConnected: null,
        }),
    }),
    {
      name: 'phantom-wallet-store',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return memoryStorage()
        }
        return window.localStorage
      }),
      partialize: (state) => ({
        publicKey: state.publicKey,
        network: state.network,
        endpoint: state.endpoint,
        autoReconnect: state.autoReconnect,
        lastConnected: state.lastConnected,
        session: state.session,
      }),
    },
  ),
)
