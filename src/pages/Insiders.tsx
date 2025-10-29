import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { WalletActivityFeed } from '../components/insiders/WalletActivityFeed';
import { SmartMoneyDashboard } from '../components/insiders/SmartMoneyDashboard';
import { WhaleAlertsPanel } from '../components/insiders/WhaleAlertsPanel';
import { Activity, Brain, AlertTriangle } from 'lucide-react';

export default function Insiders() {
  const [activeTab, setActiveTab] = useState<'feed' | 'smart-money' | 'alerts'>('feed');

  useEffect(() => {
    const initMonitor = async () => {
      try {
        await invoke('wallet_monitor_init');
      } catch (err) {
        console.error('Failed to initialize wallet monitor:', err);
      }
    };

    initMonitor();
  }, []);

  const tabs = [
    { id: 'feed' as const, label: 'Activity Feed', icon: Activity },
    { id: 'smart-money' as const, label: 'Smart Money', icon: Brain },
    { id: 'alerts' as const, label: 'Whale Alerts', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-700 pb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-400 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'feed' && <WalletActivityFeed />}
      {activeTab === 'smart-money' && <SmartMoneyDashboard />}
      {activeTab === 'alerts' && <WhaleAlertsPanel />}
    </div>
  );
}
