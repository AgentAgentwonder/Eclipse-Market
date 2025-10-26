import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'

export function useWallet() {
  const [wallet, setWallet] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadWallet()
  }, [])

  useEffect(() => {
    if (wallet) {
      loadBalance()
      const interval = setInterval(loadBalance, 10000)
      return () => clearInterval(interval)
    }
  }, [wallet])

  const loadWallet = async () => {
    try {
      const address = await invoke<string | null>('get_wallet')
      if (address) {
        setWallet(address)
      }
    } catch (e) {
      console.error('Failed to load wallet:', e)
    }
  }

  const loadBalance = async () => {
    if (!wallet) return
    try {
      const bal = await invoke<number>('get_balance', { address: wallet })
      setBalance(bal)
    } catch (e) {
      console.error('Failed to load balance:', e)
    }
  }

  const connectWallet = async () => {
    const address = prompt('Enter your Solana wallet address:')
    if (!address) return

    setLoading(true)
    try {
      await invoke('connect_wallet', { address })
      setWallet(address)
      await loadBalance()
    } catch (e: any) {
      alert('Failed to connect wallet: ' + e)
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      await invoke('disconnect_wallet')
      setWallet(null)
      setBalance(0)
    } catch (e) {
      console.error('Failed to disconnect:', e)
    }
  }

  return {
    wallet,
    balance,
    loading,
    connectWallet,
    disconnectWallet,
    refresh: loadBalance,
  }
}
