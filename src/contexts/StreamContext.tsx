import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { ConnectionStatus, useStreamStatus } from '../hooks/useWebSocketStream'

const PRICE_STORAGE_KEY = 'stream.price.subscriptions'
const WALLET_STORAGE_KEY = 'stream.wallet.subscriptions'
const PREF_STORAGE_KEY = 'stream.preferences'

export interface StreamPreferences {
  autoReconnect: boolean
  fallbackIntervalMs: number
  priceThrottleMs: number
  enablePriceStream: boolean
  enableWalletStream: boolean
}

const defaultPreferences: StreamPreferences = {
  autoReconnect: true,
  fallbackIntervalMs: 5000,
  priceThrottleMs: 100,
  enablePriceStream: true,
  enableWalletStream: true,
}

interface StreamContextValue {
  statuses: ConnectionStatus[]
  isAnyConnected: boolean
  isFallbackActive: boolean
  preferences: StreamPreferences
  updatePreferences: (update: Partial<StreamPreferences>) => void
  subscribePrices: (symbols: string[]) => Promise<void>
  unsubscribePrices: (symbols: string[]) => Promise<void>
  subscribeWallets: (addresses: string[]) => Promise<void>
  unsubscribeWallets: (addresses: string[]) => Promise<void>
  clearSubscriptionCache: () => Promise<void>
  reconnect: (providerId: string) => Promise<void>
  getProviderStatus: (providerId: string) => ConnectionStatus | undefined
}

function readStorage<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return undefined
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`Failed to parse storage for ${key}`, err)
    return undefined
  }
}

const StreamContext = createContext<StreamContextValue | undefined>(undefined)

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const liveStatuses = useStreamStatus()
  const [statusList, setStatusList] = useState<ConnectionStatus[]>([])
  const [preferences, setPreferences] = useState<StreamPreferences>(() => {
    return readStorage<StreamPreferences>(PREF_STORAGE_KEY) ?? defaultPreferences
  })
  const [priceSubscriptions, setPriceSubscriptions] = useState<string[]>(() => {
    return readStorage<string[]>(PRICE_STORAGE_KEY) ?? []
  })
  const [walletSubscriptions, setWalletSubscriptions] = useState<string[]>(() => {
    return readStorage<string[]>(WALLET_STORAGE_KEY) ?? []
  })

  const priceRefCounts = useRef<Map<string, number>>(new Map())
  const walletRefCounts = useRef<Map<string, number>>(new Map())
  const hydratedRef = useRef(false)

  useEffect(() => {
    const hydrate = async () => {
      try {
        const initial = await invoke<ConnectionStatus[]>('get_stream_status')
        setStatusList(initial)
      } catch (err) {
        console.error('Failed to hydrate stream status:', err)
      }
    }
    hydrate()
  }, [])

  useEffect(() => {
    if (liveStatuses.length > 0) {
      setStatusList(liveStatuses)
    }
  }, [liveStatuses])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(priceSubscriptions))
    }
  }, [priceSubscriptions])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletSubscriptions))
    }
  }, [walletSubscriptions])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(preferences))
    }
  }, [preferences])

  useEffect(() => {
    if (hydratedRef.current) {
      return
    }
    hydratedRef.current = true

    priceSubscriptions.forEach((symbol) => {
      priceRefCounts.current.set(symbol, 1)
    })
    walletSubscriptions.forEach((address) => {
      walletRefCounts.current.set(address, 1)
    })

    if (preferences.enablePriceStream && priceSubscriptions.length > 0) {
      invoke('subscribe_price_stream', { symbols: priceSubscriptions }).catch((err) => {
        console.error('Failed to hydrate price subscriptions:', err)
      })
    }
    if (preferences.enableWalletStream && walletSubscriptions.length > 0) {
      invoke('subscribe_wallet_stream', { addresses: walletSubscriptions }).catch((err) => {
        console.error('Failed to hydrate wallet subscriptions:', err)
      })
    }
  }, [preferences.enablePriceStream, preferences.enableWalletStream, priceSubscriptions, walletSubscriptions])

  useEffect(() => {
    if (!preferences.enablePriceStream && priceSubscriptions.length > 0) {
      invoke('unsubscribe_price_stream', { symbols: priceSubscriptions }).catch((err) => {
        console.error('Failed to disable price stream:', err)
      })
    }
    if (!preferences.enableWalletStream && walletSubscriptions.length > 0) {
      invoke('unsubscribe_wallet_stream', { addresses: walletSubscriptions }).catch((err) => {
        console.error('Failed to disable wallet stream:', err)
      })
    }
  }, [preferences.enablePriceStream, preferences.enableWalletStream])

  const subscribePrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return

    const newSymbols: string[] = []
    setPriceSubscriptions((prev) => {
      const unique = new Set(prev)
      symbols.forEach((symbol) => {
        const current = priceRefCounts.current.get(symbol) ?? 0
        priceRefCounts.current.set(symbol, current + 1)
        unique.add(symbol)
        if (current === 0 && preferences.enablePriceStream) {
          newSymbols.push(symbol)
        }
      })
      return Array.from(unique)
    })

    if (newSymbols.length > 0) {
      await invoke('subscribe_price_stream', { symbols: newSymbols })
    }
  }, [preferences.enablePriceStream])

  const unsubscribePrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return

    const toRemove: string[] = []
    setPriceSubscriptions((prev) => {
      const unique = new Set(prev)
      symbols.forEach((symbol) => {
        const current = priceRefCounts.current.get(symbol) ?? 0
        if (current <= 1) {
          priceRefCounts.current.delete(symbol)
          unique.delete(symbol)
          if (preferences.enablePriceStream) {
            toRemove.push(symbol)
          }
        } else {
          priceRefCounts.current.set(symbol, current - 1)
        }
      })
      return Array.from(unique)
    })

    if (toRemove.length > 0) {
      await invoke('unsubscribe_price_stream', { symbols: toRemove })
    }
  }, [preferences.enablePriceStream])

  const subscribeWallets = useCallback(async (addresses: string[]) => {
    if (addresses.length === 0) return

    const newAddresses: string[] = []
    setWalletSubscriptions((prev) => {
      const unique = new Set(prev)
      addresses.forEach((address) => {
        const current = walletRefCounts.current.get(address) ?? 0
        walletRefCounts.current.set(address, current + 1)
        unique.add(address)
        if (current === 0 && preferences.enableWalletStream) {
          newAddresses.push(address)
        }
      })
      return Array.from(unique)
    })

    if (newAddresses.length > 0) {
      await invoke('subscribe_wallet_stream', { addresses: newAddresses })
    }
  }, [preferences.enableWalletStream])

  const unsubscribeWallets = useCallback(async (addresses: string[]) => {
    if (addresses.length === 0) return

    const toRemove: string[] = []
    setWalletSubscriptions((prev) => {
      const unique = new Set(prev)
      addresses.forEach((address) => {
        const current = walletRefCounts.current.get(address) ?? 0
        if (current <= 1) {
          walletRefCounts.current.delete(address)
          unique.delete(address)
          if (preferences.enableWalletStream) {
            toRemove.push(address)
          }
        } else {
          walletRefCounts.current.set(address, current - 1)
        }
      })
      return Array.from(unique)
    })

    if (toRemove.length > 0) {
      await invoke('unsubscribe_wallet_stream', { addresses: toRemove })
    }
  }, [preferences.enableWalletStream])

  const clearSubscriptionCache = useCallback(async () => {
    const priceSymbols = Array.from(priceRefCounts.current.keys())
    const walletAddresses = Array.from(walletRefCounts.current.keys())

    priceRefCounts.current.clear()
    walletRefCounts.current.clear()

    setPriceSubscriptions([])
    setWalletSubscriptions([])

    if (priceSymbols.length > 0) {
      await invoke('unsubscribe_price_stream', { symbols: priceSymbols }).catch((err) => {
        console.error('Failed to clear price subscriptions:', err)
      })
    }
    if (walletAddresses.length > 0) {
      await invoke('unsubscribe_wallet_stream', { addresses: walletAddresses }).catch((err) => {
        console.error('Failed to clear wallet subscriptions:', err)
      })
    }
  }, [])

  const reconnect = useCallback(async (providerId: string) => {
    try {
      await invoke('reconnect_stream', { providerId })
    } catch (err) {
      console.error(`Failed to reconnect ${providerId}:`, err)
      throw err
    }
  }, [])

  const getProviderStatus = useCallback(
    (providerId: string) => {
      return statusList.find((s) => s.provider.toLowerCase() === providerId.toLowerCase())
    },
    [statusList]
  )

  const updatePreferences = useCallback((update: Partial<StreamPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...update }))
  }, [])

  const isAnyConnected = useMemo(() => statusList.some((s) => s.state === 'Connected'), [statusList])
  const isFallbackActive = useMemo(() => statusList.some((s) => s.fallback?.active === true), [statusList])

  const value: StreamContextValue = {
    statuses: statusList,
    isAnyConnected,
    isFallbackActive,
    preferences,
    updatePreferences,
    subscribePrices,
    unsubscribePrices,
    subscribeWallets,
    unsubscribeWallets,
    clearSubscriptionCache,
    reconnect,
    getProviderStatus,
  }

  return <StreamContext.Provider value={value}>{children}</StreamContext.Provider>
}

export function useStream() {
  const context = useContext(StreamContext)
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider')
  }
  return context
}
