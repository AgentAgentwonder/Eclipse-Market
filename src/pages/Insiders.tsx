import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { WalletActivityFeed } from '../components/insiders/WalletActivityFeed'

export default function Insiders() {
  useEffect(() => {
    const initMonitor = async () => {
      try {
        await invoke('wallet_monitor_init')
      } catch (err) {
        console.error('Failed to initialize wallet monitor:', err)
      }
    }

    initMonitor()
  }, [])

  return (
    <div className="space-y-6">
      <WalletActivityFeed />
    </div>
  )
}
