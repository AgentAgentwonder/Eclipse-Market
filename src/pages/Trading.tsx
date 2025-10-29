import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AlertCircle } from 'lucide-react';
import { OrderBook } from '../components/OrderBook';
import { SwapForm } from '../components/SwapForm';
import { EnhancedTradeHistory } from '../components/trading/EnhancedTradeHistory';
import { QuickTradeButton } from '../components/trading/QuickTradeButton';
import { OrderForm } from '../components/trading/OrderForm';
import { ActiveOrders } from '../components/trading/ActiveOrders';
import { OrderHistory } from '../components/trading/OrderHistory';
import { PositionSizeCalculator } from '../components/trading/PositionSizeCalculator';
import { RiskRewardCalculator } from '../components/trading/RiskRewardCalculator';
import { useJupiter } from '../hooks/useJupiter';
import { useWallet } from '../hooks/useWallet';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import { usePaperTradingStore } from '../store/paperTradingStore';

const COMMON_TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
];

function Trading() {
  const jupiter = useJupiter();
  const wallet = useWallet();
  const { isPaperMode } = usePaperTradingStore();

  useOrderNotifications();

  useEffect(() => {
    const initTrading = async () => {
      try {
        await invoke('trading_init');
      } catch (err) {
        console.error('Failed to initialize trading module:', err);
      }
    };

    initTrading();
  }, []);

  return (
    <div className="space-y-4 p-4">
      {isPaperMode && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-400">
              <p className="font-medium mb-1">Live Trading Disabled in Paper Mode</p>
              <p className="text-orange-400/80">
                You are currently in paper trading mode. Live trading functions are disabled. Switch
                to live mode in Settings to execute real trades.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <QuickTradeButton
          fromToken={COMMON_TOKENS[0]}
          toToken={COMMON_TOKENS[1]}
          side="buy"
          walletAddress={wallet.wallet || undefined}
        />
        <QuickTradeButton
          fromToken={COMMON_TOKENS[1]}
          toToken={COMMON_TOKENS[0]}
          side="sell"
          walletAddress={wallet.wallet || undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <OrderBook />
        </div>
        <div className="order-1 lg:order-2 space-y-4">
          <SwapForm jupiter={jupiter} wallet={wallet} />
          <OrderForm
            fromToken={COMMON_TOKENS[0]}
            toToken={COMMON_TOKENS[1]}
            walletAddress={wallet.wallet || undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActiveOrders walletAddress={wallet.wallet || undefined} />
        <OrderHistory walletAddress={wallet.wallet || undefined} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PositionSizeCalculator />
        <RiskRewardCalculator />
      </div>

      <EnhancedTradeHistory />
    </div>
  );
}

export default Trading;
