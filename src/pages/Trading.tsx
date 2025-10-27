import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { OrderBook } from '../components/OrderBook';
import { SwapForm } from '../components/SwapForm';
import { TradeHistory } from '../components/TradeHistory';
import { QuickTradeButton } from '../components/trading/QuickTradeButton';
import { OrderForm } from '../components/trading/OrderForm';
import { ActiveOrders } from '../components/trading/ActiveOrders';
import { OrderHistory } from '../components/trading/OrderHistory';
import { PositionSizeCalculator } from '../components/trading/PositionSizeCalculator';
import { RiskRewardCalculator } from '../components/trading/RiskRewardCalculator';
import { useJupiter } from '../hooks/useJupiter';
import { useWallet } from '../hooks/useWallet';
import { useOrderNotifications } from '../hooks/useOrderNotifications';

const COMMON_TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
];

function Trading() {
  const jupiter = useJupiter();
  const wallet = useWallet();
  
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

      <TradeHistory />
    </div>
  );
}

export default Trading;
