import { useState } from 'react';
import { Rocket, Coins, Lock, Clock, Gift, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';

import TokenConfig from './TokenConfig';
import LiquidityConfig from './LiquidityConfig';
import VestingSchedule from './VestingSchedule';
import AirdropManager from './AirdropManager';
import LaunchMonitor from './LaunchMonitor';

type TabType = 'token' | 'liquidity' | 'vesting' | 'airdrop' | 'monitor';

export default function LaunchpadStudio() {
  const [activeTab, setActiveTab] = useState<TabType>('token');
  const [launchId, setLaunchId] = useState<string | null>(null);

  const tabs = [
    { id: 'token' as TabType, label: 'Token Setup', icon: Coins },
    { id: 'liquidity' as TabType, label: 'Liquidity Lock', icon: Lock },
    { id: 'vesting' as TabType, label: 'Vesting', icon: Clock },
    { id: 'airdrop' as TabType, label: 'Airdrop', icon: Gift },
    { id: 'monitor' as TabType, label: 'Monitor', icon: BarChart },
  ];

  const handleLaunchCreated = (id: string) => {
    setLaunchId(id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-purple-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Token Launchpad
            </h1>
          </div>
        </div>

        <div className="flex gap-2 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium
                  transition-colors relative
                  ${
                    activeTab === tab.id
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'token' && (
          <TokenConfig onLaunchCreated={handleLaunchCreated} />
        )}
        {activeTab === 'liquidity' && (
          <LiquidityConfig launchId={launchId} />
        )}
        {activeTab === 'vesting' && (
          <VestingSchedule launchId={launchId} />
        )}
        {activeTab === 'airdrop' && (
          <AirdropManager launchId={launchId} />
        )}
        {activeTab === 'monitor' && (
          <LaunchMonitor launchId={launchId} />
        )}
      </div>
    </div>
  );
}
