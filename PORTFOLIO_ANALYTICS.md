# Portfolio Analytics Documentation

## Overview

The Portfolio Analytics module provides comprehensive portfolio management, rebalancing, tax lot tracking, and trading calculators as specified in Phase 2 Tasks 2.13-2.17.

## Features

### 1. Portfolio Overview (`/portfolio`)

The portfolio page displays:

- **Total Portfolio Value**: Current market value of all positions
- **Realized P&L**: Cumulative profits/losses from closed positions
- **Unrealized P&L**: Current paper profits/losses from open positions
- **Time-based P&L**: Daily, weekly, monthly, and all-time performance metrics
- **Allocation Charts**: Visual breakdown of portfolio distribution (pie chart)
- **P&L by Position**: Bar chart showing profit/loss for each asset
- **Position Table**: Sortable table with:
  - Symbol and contract address
  - Amount held
  - Current price and average entry price
  - Position value
  - Unrealized P&L (dollar amount and percentage)
  - Portfolio allocation percentage

**Refresh Timestamp**: Automatically updates every 30 seconds or manually via refresh button.

### 2. Trading Calculators

#### Position Size Calculator

Located in the Trading page, this calculator helps determine optimal position sizing based on risk parameters.

**Features**:
- **Risk Profiles**: Pre-configured conservative, moderate, and aggressive profiles
- **Custom Configuration**: Account size, risk percentage, entry/stop loss prices, leverage
- **Kelly Criterion**: Optional optimization based on win rate and risk/reward ratio
- **Results**:
  - Position size (units)
  - Position value (USD)
  - Risk amount (USD)
  - Kelly fraction (when enabled)
- **Integration**: One-click "Apply to Order Form" button

**Formulas**:
```
Position Size = (Account Size × Risk%) / (Entry Price - Stop Loss Price) × Leverage
Kelly Fraction = (Win Rate × Avg Win/Loss - (1 - Win Rate)) / Avg Win/Loss
```

#### Risk/Reward Calculator

Evaluates trade quality and expected profitability.

**Features**:
- Entry price, stop loss, take profit, and position size inputs
- Win rate percentage for expected value calculation
- **Results**:
  - Risk amount (potential loss)
  - Reward amount (potential profit)
  - Risk/reward ratio
  - Break-even win rate
  - Expected value
- **Integration**: One-click "Apply to Order Form" button

**Formulas**:
```
Risk/Reward Ratio = (Take Profit - Entry) / (Entry - Stop Loss)
Break-even Win Rate = 1 / (Risk/Reward Ratio + 1)
Expected Value = Win Rate × Reward - (1 - Win Rate) × Risk
```

### 3. Auto-Rebalancer

The rebalancer automatically maintains target allocations across your portfolio.

**Features**:
- **Rebalance Profiles**: Create multiple profiles with different allocation targets
- **Trigger Types**:
  - **Deviation-based**: Triggers when allocation deviates beyond threshold (e.g., 5%)
  - **Time-based**: Triggers at regular intervals (e.g., weekly)
- **Dry-run Mode**: Preview rebalancing actions before execution
- **Action History**: Log of all rebalancing events with timestamps
- **Notifications**: Alerts when rebalancing is recommended

**Tauri Commands**:
```typescript
// List all rebalance profiles
list_rebalance_profiles()

// Save a rebalance profile
save_rebalance_profile({
  id?: string,
  name: string,
  targets: Array<{ symbol: string, targetPercent: number }>,
  deviationTriggerPercent: number,
  timeIntervalHours?: number,
  enabled: boolean
})

// Preview rebalance actions
preview_rebalance(profileId: string)

// Execute rebalance (dry_run = true for preview)
execute_rebalance(profileId: string, dry_run: boolean)

// Get rebalance history
get_rebalance_history()

// Check if any triggers are met
check_rebalance_triggers()
```

### 4. Tax Lot Tracking

Comprehensive tax reporting and optimization features.

**Features**:
- **Lot Strategies**: FIFO, LIFO, HIFO, or specific lot identification
- **Cost Basis Tracking**: Accurate per-lot cost basis calculation
- **Realized Gains**: Automatic calculation on lot disposal
- **Short-term vs Long-term**: 365-day threshold for capital gains classification
- **Tax Loss Harvesting**: AI-powered suggestions for realizing losses
  - Potential tax savings calculation
  - Days held information
  - Sorted by tax benefit
- **Export Formats**:
  - TurboTax (CSV)
  - CoinTracker (CSV)
  - Generic CSV

**Tauri Commands**:
```typescript
// Get all tax lots (including disposed)
get_tax_lots()

// Get open (undisposed) tax lots
get_open_tax_lots()

// Set lot selection strategy
set_tax_lot_strategy(strategy: 'FIFO' | 'LIFO' | 'HIFO' | 'SPECIFIC')

// Get current strategy
get_tax_lot_strategy()

// Dispose a lot
dispose_tax_lot({
  lotId: string,
  amount: number,
  salePrice: number
})

// Generate tax report for a year
generate_tax_report({ taxYear: number })

// Export tax report
export_tax_report({ taxYear: number }, format: 'turbotax' | 'cointracker' | 'csv')

// Get tax loss harvesting suggestions
get_tax_loss_harvesting_suggestions()
```

### 5. Order Form Integration

Calculators integrate seamlessly with the order form:

1. Configure calculator parameters
2. Click "Apply to Order Form"
3. Order form auto-populates with calculated values
4. Visual notification shows calculator suggestion applied
5. Review and submit order

**Store Integration**:
Uses `useOrderFormSuggestionStore` to communicate between calculators and order form.

## Testing

### Unit Tests (TypeScript)

Located in `src/__tests__/calculators.test.ts`:

```bash
npm run test
```

Tests cover:
- Position size calculation
- Kelly Criterion formula
- Leverage handling
- Risk/reward ratio calculation
- Break-even win rate
- Expected value (positive and negative)
- Rebalancing deviation detection
- Rebalance amount calculation
- Tax lot cost basis (FIFO)
- Realized gain calculation
- Short-term vs long-term classification
- Tax loss harvesting savings

### Integration Tests (Rust)

Located in `src-tauri/src/portfolio/`:

```bash
cd src-tauri && cargo test --lib
```

Tests cover:
- Rebalancer action detection
- Portfolio allocation adjustment
- Deviation trigger detection
- Tax lot disposal
- Tax report generation (short/long-term separation)
- Tax loss harvesting detection

## Data Models

### Position
```typescript
{
  symbol: string
  mint: string
  amount: number
  currentPrice: number
  avgEntryPrice: number
  totalValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  allocation: number
}
```

### PortfolioMetrics
```typescript
{
  totalValue: number
  dailyPnl: number
  dailyPnlPercent: number
  weeklyPnl: number
  weeklyPnlPercent: number
  monthlyPnl: number
  monthlyPnlPercent: number
  allTimePnl: number
  allTimePnlPercent: number
  realizedPnl: number
  unrealizedPnl: number
  lastUpdated: string
}
```

### TaxLot
```typescript
{
  id: string
  symbol: string
  mint: string
  amount: number
  costBasis: number
  pricePerUnit: number
  acquiredAt: string
  disposedAmount?: number
  disposedAt?: string
  realizedGain?: number
}
```

### TaxReport
```typescript
{
  taxYear: number
  lots: TaxLot[]
  totalRealizedGains: number
  totalRealizedLosses: number
  netGainLoss: number
  shortTermGains: number
  longTermGains: number
  strategy: 'FIFO' | 'LIFO' | 'HIFO' | 'SPECIFIC'
  generatedAt: string
}
```

## Architecture

### Frontend Structure
```
src/
├── pages/
│   └── Portfolio.tsx           # Main portfolio dashboard
├── components/
│   └── trading/
│       ├── PositionSizeCalculator.tsx
│       ├── RiskRewardCalculator.tsx
│       └── OrderForm.tsx       # Enhanced with calculator integration
├── store/
│   └── orderFormSuggestionStore.ts  # Calculator-to-form communication
└── types/
    └── portfolio.ts            # TypeScript types
```

### Backend Structure
```
src-tauri/src/
└── portfolio/
    ├── mod.rs                  # Module exports
    ├── types.rs                # Rust types
    ├── rebalancer.rs           # Auto-rebalancing logic
    └── tax_lots.rs             # Tax tracking and reporting
```

## Usage Examples

### 1. Checking Rebalance Triggers
```typescript
const triggers = await invoke('check_rebalance_triggers');
if (triggers.length > 0) {
  // Show notification: "Rebalancing recommended"
}
```

### 2. Creating a Rebalance Profile
```typescript
await invoke('save_rebalance_profile', {
  input: {
    name: "60/30/10 Strategy",
    targets: [
      { symbol: "SOL", targetPercent: 60 },
      { symbol: "BTC", targetPercent: 30 },
      { symbol: "USDC", targetPercent: 10 }
    ],
    deviationTriggerPercent: 5,
    timeIntervalHours: 168, // Weekly
    enabled: true
  }
});
```

### 3. Generating Tax Report
```typescript
const report = await invoke('generate_tax_report', {
  params: { taxYear: 2024 }
});

console.log(`Net Gain/Loss: $${report.netGainLoss}`);
console.log(`Short-term: $${report.shortTermGains}`);
console.log(`Long-term: $${report.longTermGains}`);
```

### 4. Exporting for TurboTax
```typescript
const csv = await invoke('export_tax_report', {
  params: { taxYear: 2024 },
  format: 'turbotax'
});

// Save to file or copy to clipboard
downloadFile('tax_report_2024.csv', csv);
```

### 5. Tax Loss Harvesting
```typescript
const suggestions = await invoke('get_tax_loss_harvesting_suggestions');

suggestions.forEach(s => {
  console.log(`${s.symbol}: Realize $${s.unrealizedLoss} loss`);
  console.log(`  Potential savings: $${s.potentialTaxSavings}`);
  console.log(`  Days held: ${s.daysHeld}`);
});
```

## Performance Considerations

- Portfolio metrics recalculate automatically when positions change
- Allocation percentages are computed in real-time
- Rebalance trigger checks are optimized to run every 10 minutes (configurable)
- Tax lot queries use efficient filtering to avoid full table scans
- History logs are limited to the most recent 100 entries

## Future Enhancements

- Real-time price updates via WebSocket integration
- Advanced analytics: Sharpe ratio, max drawdown, volatility
- Backtesting rebalance strategies
- Multi-account portfolio consolidation
- Integration with external portfolio trackers
- Mobile-responsive portfolio dashboard
- CSV import for historical transactions

## Support

For issues or feature requests, please refer to the project's issue tracker.
