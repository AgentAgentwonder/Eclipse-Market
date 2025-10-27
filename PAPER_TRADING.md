# Paper Trading Sandbox - Implementation Documentation

## Overview
The Paper Trading Sandbox is a comprehensive simulation environment that allows users to practice trading strategies with virtual funds before risking real capital. This feature provides realistic slippage, fee modeling, and complete P&L tracking while ensuring complete separation from live trading operations.

## Features Implemented

### 1. Backend (Rust) - `src-tauri/src/trading/paper_trading.rs`

#### Core Engine
- **PaperTradingEngine**: Main simulation engine with SQLite persistence
- Configurable virtual balances with multi-currency support
- Realistic slippage and fee simulation
- Position tracking with average entry prices
- P&L calculation (both realized and unrealized)
- Trade history with full audit trail
- Optional failure simulation for testing error handling
- Anonymous leaderboard system

#### Data Structures
- `PaperAccount`: Account state with balances, P&L, and performance metrics
- `PaperTrade`: Individual trade records with execution details
- `PaperPosition`: Current positions with unrealized P&L
- `PaperBalance`: Multi-currency balance tracking
- `PaperTradingConfig`: Configurable simulation parameters
- `LeaderboardEntry`: Competitive ranking system

#### Features
- **Balance Management**: Track multiple token balances (SOL, USDC, etc.)
- **Trade Execution**: Simulated swaps with realistic slippage (0.1% default) and fees (0.05% default)
- **Slippage Model**: Random variation up to max tolerance with realistic impact
- **Fee Structure**: Configurable percentage-based fees applied to output
- **Position Tracking**: Automatically tracks entry prices and calculates P&L
- **Trade History**: Full audit trail with timestamps and execution details
- **Account Reset**: Clean slate functionality with configurable initial balance
- **Leaderboard**: Submit and view performance rankings
- **Price Updates**: Real-time price tracking for P&L calculations

### 2. Frontend Store - `src/store/paperTradingStore.ts`

#### State Management (Zustand)
- Paper mode toggle state
- Account information and balances
- Active positions with P&L
- Trade history
- Leaderboard data
- Configuration settings
- Loading and error states

#### Actions
- `checkStatus()`: Check if paper mode is enabled
- `setEnabled(enabled)`: Toggle paper trading mode
- `loadAccount()`: Fetch account details
- `loadBalances()`: Fetch all token balances
- `loadPositions()`: Fetch open positions
- `loadTradeHistory(limit)`: Fetch recent trades
- `executeTrade()`: Execute a simulated trade
- `resetAccount(initialBalance)`: Reset account to clean state
- `updateConfig(config)`: Update simulation parameters
- `submitToLeaderboard()`: Share performance anonymously
- `updatePrice(symbol, price)`: Update token prices for P&L

### 3. Paper Trading Dashboard - `src/pages/PaperTrading.tsx`

#### Dashboard Components
- **Performance Summary Cards**:
  - Total virtual balance
  - Total P&L ($ and %)
  - Trade count and win/loss ratio
  - Win rate percentage

- **P&L Chart**: Interactive area chart showing cumulative P&L over time (using Recharts)

- **Balances Panel**: Display all token balances

- **Positions Panel**: Show open positions with unrealized P&L

- **Trade History Table**: Detailed trade log with:
  - Timestamp
  - Trade type (buy/sell)
  - Trading pair
  - Amount and price
  - Fees applied
  - Realized P&L

- **Leaderboard**: Top performers ranked by total P&L

- **Reset Functionality**: Modal dialog to reset account with confirmation

### 4. Settings Integration - `src/pages/Settings.tsx`

#### Paper Trading Settings Section
- **Mode Toggle**: Switch between live and paper trading
  - Confirmation prompts for mode changes
  - Visual status indicators
  - Warning messages about blockchain interactions

- **Performance Snapshot** (when enabled):
  - Virtual balance display
  - Current P&L
  - Total trades count
  - Win rate

- **Clear Instructions**: Helpful text explaining paper mode

### 5. App-Wide Visual Indicators - `src/App.tsx`

#### Status Indicators
- **Header Badge**: Prominent "Paper Mode" indicator in top navigation
- **Alert Banner**: Warning banner when in paper mode explaining simulated nature
- **Navigation**: Paper Trading page added to sidebar menu with Gamepad2 icon
- **Persistent State**: Paper mode status checked on app startup

### 6. Tauri Commands - `src-tauri/src/trading/paper_commands.rs`

#### Available Commands
- `paper_get_status`: Check if paper mode is enabled
- `paper_set_enabled`: Toggle paper mode
- `paper_get_account`: Get account details
- `paper_get_balances`: Fetch all balances
- `paper_get_balance`: Fetch specific token balance
- `paper_execute_trade`: Execute simulated trade
- `paper_get_positions`: Get open positions
- `paper_get_trade_history`: Fetch trade history
- `paper_reset_account`: Reset account
- `paper_update_config`: Update configuration
- `paper_get_config`: Get current configuration
- `paper_update_price`: Update token price
- `paper_submit_to_leaderboard`: Submit score
- `paper_get_leaderboard`: Get top performers

### 7. Testing

#### Backend Tests - `src-tauri/tests/paper_trading_tests.rs`
- Engine initialization
- Enable/disable functionality
- Account state management
- Balance tracking
- Trade execution (success and failure cases)
- Insufficient balance validation
- Trade history
- Account reset
- Configuration updates
- Price updates
- Position tracking
- Leaderboard functionality
- Fee and slippage application

#### Frontend Tests - `src/__tests__/paperTradingStore.test.ts`
- Store initialization
- Status checking
- Mode toggling
- Account loading
- Trade execution
- Account reset
- Configuration updates
- Error handling

## Configuration

### Default Settings
```rust
PaperTradingConfig {
    slippage_percent: 0.1,      // 0.1% slippage
    fee_percent: 0.05,           // 0.05% fee
    max_slippage_percent: 1.0,   // Max 1% slippage
    simulate_failures: false,    // Failure simulation off
    failure_rate: 0.01,          // 1% failure rate when enabled
}
```

### Initial Balance
- Default: 10,000 SOL equivalent
- Customizable on reset

## Data Separation

### Database Schema
- **Separate SQLite Database**: `paper_trading.db` (isolated from `orders.db`)
- **Tables**:
  - `paper_account`: Single account record
  - `paper_balances`: Token balances
  - `paper_trades`: Trade history
  - `paper_positions`: Open positions
  - `paper_leaderboard`: Performance rankings

### State Isolation
- Paper trades never touch live wallet
- No blockchain transactions when in paper mode
- Completely isolated from live order system
- Clear visual indicators prevent confusion

## User Flow

### Enabling Paper Mode
1. Navigate to Settings
2. Find "Paper Trading Sandbox" section
3. Click "Enable Paper Trading"
4. Confirm switch from live to paper mode
5. Paper mode badge appears in header
6. Warning banner displayed

### Trading in Paper Mode
1. Navigate to Trading or Paper Trading page
2. Create orders as normal
3. Orders execute against virtual balances
4. Realistic slippage and fees applied
5. P&L tracked automatically
6. View performance in Paper Trading dashboard

### Disabling Paper Mode
1. Return to Settings
2. Click "Switch to Live Trading"
3. Confirm switch from paper to live mode
4. Resume normal blockchain operations

### Resetting Paper Account
1. Navigate to Paper Trading dashboard
2. Click "Reset Account"
3. Enter desired initial balance
4. Confirm reset
5. Account cleared and reset

## Security & Safety

### Safeguards
- **Explicit Confirmations**: Required when switching modes
- **Visual Indicators**: Always-visible paper mode badge
- **Warning Banners**: Persistent reminders when in simulation
- **Database Isolation**: Separate storage prevents data mixing
- **No Blockchain Access**: Paper mode prevents real transactions
- **State Checking**: Each operation verifies mode before execution

### Data Privacy
- Leaderboard submissions are optional
- User IDs and usernames can be pseudonymous
- Trade data stored locally
- No sharing without explicit user action

## Performance Metrics Tracked

### Account Level
- Initial balance
- Current balance/value
- Total P&L ($ and %)
- Total trades
- Winning trades
- Losing trades
- Win rate
- Reset count

### Trade Level
- Execution timestamp
- Trade type (buy/sell)
- Input/output tokens and amounts
- Execution price
- Slippage applied
- Fees charged
- Realized P&L
- Order ID reference

### Position Level
- Token symbol
- Position size
- Average entry price
- Current price
- Unrealized P&L
- Realized P&L

## Future Enhancements (Not Implemented)

Potential improvements for future iterations:
- Advanced order types in paper mode
- Strategy backtesting integration
- Export performance reports
- Social features (sharing strategies)
- Paper trading competitions
- Historical data replay
- Risk metrics and analytics
- Portfolio optimization suggestions
- Paper vs. live performance comparison

## Technical Notes

### Dependencies Added
- No new npm dependencies (uses existing Recharts)
- Rust: `tempfile = "3.10.1"` for testing

### Files Created/Modified

#### Created:
- `src-tauri/src/trading/paper_trading.rs`
- `src-tauri/src/trading/paper_commands.rs`
- `src/store/paperTradingStore.ts`
- `src/pages/PaperTrading.tsx`
- `src-tauri/tests/paper_trading_tests.rs`
- `src/__tests__/paperTradingStore.test.ts`
- `PAPER_TRADING.md`

#### Modified:
- `src-tauri/src/trading/mod.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/Cargo.toml`
- `src/App.tsx`
- `src/pages/Settings.tsx`

### Build Notes
- SQLite database automatically created on first use
- Migrations handled automatically by SQLx
- State persisted across app restarts
- Configuration saved to Zustand localStorage

## Usage Examples

### TypeScript/Frontend
```typescript
import { usePaperTradingStore } from './store/paperTradingStore';

// Enable paper mode
await usePaperTradingStore.getState().setEnabled(true);

// Execute a trade
const trade = await usePaperTradingStore.getState().executeTrade(
  'buy',
  'SOL',
  'USDC',
  1.0,
  50.0
);

// Reset account
await usePaperTradingStore.getState().resetAccount(5000);
```

### Rust/Backend
```rust
use app_lib::trading::paper_trading::PaperTradingEngine;

let engine = PaperTradingEngine::new(db_path).await?;
engine.set_enabled(true).await?;

let trade = engine.execute_trade(
    "buy",
    "SOL",
    "USDC",
    1.0,
    50.0,
    None
).await?;
```

## Conclusion

The Paper Trading Sandbox provides a complete, production-ready simulation environment that allows users to practice trading safely. With realistic fee and slippage modeling, comprehensive P&L tracking, and strict data separation, users can test strategies and build confidence before committing real funds.
