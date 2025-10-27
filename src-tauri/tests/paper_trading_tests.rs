#[cfg(test)]
mod paper_trading_tests {
    use app_lib::trading::paper_trading::{PaperTradingConfig, PaperTradingEngine};
    use std::path::PathBuf;
    use tempfile::tempdir;

    async fn create_test_engine() -> PaperTradingEngine {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test_paper_trading.db");
        PaperTradingEngine::new(db_path).await.unwrap()
    }

    #[tokio::test]
    async fn test_engine_initialization() {
        let engine = create_test_engine().await;
        assert!(!engine.is_enabled().await.unwrap());
    }

    #[tokio::test]
    async fn test_enable_disable() {
        let engine = create_test_engine().await;
        
        engine.set_enabled(true).await.unwrap();
        assert!(engine.is_enabled().await.unwrap());
        
        engine.set_enabled(false).await.unwrap();
        assert!(!engine.is_enabled().await.unwrap());
    }

    #[tokio::test]
    async fn test_initial_account() {
        let engine = create_test_engine().await;
        let account = engine.get_account().await.unwrap();
        
        assert_eq!(account.enabled, false);
        assert_eq!(account.initial_balance, 10000.0);
        assert_eq!(account.current_value, 10000.0);
        assert_eq!(account.total_pnl, 0.0);
        assert_eq!(account.total_trades, 0);
    }

    #[tokio::test]
    async fn test_initial_balances() {
        let engine = create_test_engine().await;
        let balances = engine.get_balances().await.unwrap();
        
        assert_eq!(balances.len(), 1);
        assert_eq!(balances[0].currency, "SOL");
        assert_eq!(balances[0].amount, 10000.0);
    }

    #[tokio::test]
    async fn test_execute_trade_disabled() {
        let engine = create_test_engine().await;
        
        let result = engine.execute_trade(
            "buy",
            "SOL",
            "USDC",
            1.0,
            50.0,
            None
        ).await;
        
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not enabled"));
    }

    #[tokio::test]
    async fn test_execute_trade_success() {
        let engine = create_test_engine().await;
        engine.set_enabled(true).await.unwrap();
        
        // Execute a trade
        let trade = engine.execute_trade(
            "buy",
            "SOL",
            "USDC",
            1.0,
            50.0,
            None
        ).await.unwrap();
        
        assert_eq!(trade.trade_type, "buy");
        assert_eq!(trade.input_symbol, "SOL");
        assert_eq!(trade.output_symbol, "USDC");
        assert_eq!(trade.input_amount, 1.0);
        assert!(trade.output_amount > 0.0);
        assert!(trade.fee > 0.0);
        
        // Check balances were updated
        let sol_balance = engine.get_balance("SOL").await.unwrap();
        assert_eq!(sol_balance, 9999.0); // 10000 - 1
        
        let usdc_balance = engine.get_balance("USDC").await.unwrap();
        assert!(usdc_balance > 0.0);
    }

    #[tokio::test]
    async fn test_execute_trade_insufficient_balance() {
        let engine = create_test_engine().await;
        engine.set_enabled(true).await.unwrap();
        
        let result = engine.execute_trade(
            "buy",
            "SOL",
            "USDC",
            20000.0, // More than initial balance
            1000.0,
            None
        ).await;
        
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Insufficient balance"));
    }

    #[tokio::test]
    async fn test_trade_history() {
        let engine = create_test_engine().await;
        engine.set_enabled(true).await.unwrap();
        
        // Execute multiple trades
        engine.execute_trade("buy", "SOL", "USDC", 1.0, 50.0, None).await.unwrap();
        engine.execute_trade("buy", "SOL", "BONK", 2.0, 100.0, None).await.unwrap();
        
        let history = engine.get_trade_history(100).await.unwrap();
        assert_eq!(history.len(), 2);
        
        // Most recent trade should be first
        assert_eq!(history[0].input_symbol, "SOL");
        assert_eq!(history[0].output_symbol, "BONK");
    }

    #[tokio::test]
    async fn test_reset_account() {
        let engine = create_test_engine().await;
        engine.set_enabled(true).await.unwrap();
        
        // Execute a trade
        engine.execute_trade("buy", "SOL", "USDC", 1.0, 50.0, None).await.unwrap();
        
        // Reset with new balance
        engine.reset_account(5000.0).await.unwrap();
        
        let account = engine.get_account().await.unwrap();
        assert_eq!(account.initial_balance, 5000.0);
        assert_eq!(account.current_value, 5000.0);
        assert_eq!(account.total_pnl, 0.0);
        assert_eq!(account.total_trades, 0);
        
        let balances = engine.get_balances().await.unwrap();
        assert_eq!(balances.len(), 1);
        assert_eq!(balances[0].amount, 5000.0);
        
        let history = engine.get_trade_history(100).await.unwrap();
        assert_eq!(history.len(), 0);
    }

    #[tokio::test]
    async fn test_config_update() {
        let engine = create_test_engine().await;
        
        let config = PaperTradingConfig {
            slippage_percent: 0.2,
            fee_percent: 0.1,
            max_slippage_percent: 2.0,
            simulate_failures: true,
            failure_rate: 0.05,
        };
        
        engine.update_config(config.clone()).await.unwrap();
        
        let loaded_config = engine.get_config().await;
        assert_eq!(loaded_config.slippage_percent, 0.2);
        assert_eq!(loaded_config.fee_percent, 0.1);
        assert_eq!(loaded_config.max_slippage_percent, 2.0);
        assert_eq!(loaded_config.simulate_failures, true);
        assert_eq!(loaded_config.failure_rate, 0.05);
    }

    #[tokio::test]
    async fn test_price_updates() {
        let engine = create_test_engine().await;
        
        engine.update_price("SOL", 100.0).await;
        let price = engine.get_price("SOL").await;
        assert_eq!(price, Some(100.0));
        
        engine.update_price("SOL", 105.5).await;
        let price = engine.get_price("SOL").await;
        assert_eq!(price, Some(105.5));
        
        let price = engine.get_price("NONEXISTENT").await;
        assert_eq!(price, None);
    }

    #[tokio::test]
    async fn test_positions() {
        let engine = create_test_engine().await;
        engine.set_enabled(true).await.unwrap();
        
        // Update prices
        engine.update_price("USDC", 1.0).await;
        
        // Execute a trade
        engine.execute_trade("buy", "SOL", "USDC", 1.0, 50.0, None).await.unwrap();
        
        let positions = engine.get_positions().await.unwrap();
        assert!(positions.len() > 0);
        
        let usdc_position = positions.iter().find(|p| p.symbol == "USDC");
        assert!(usdc_position.is_some());
    }

    #[tokio::test]
    async fn test_leaderboard() {
        let engine = create_test_engine().await;
        engine.set_enabled(true).await.unwrap();
        
        // Execute some trades
        engine.execute_trade("buy", "SOL", "USDC", 1.0, 50.0, None).await.unwrap();
        
        // Submit to leaderboard
        engine.submit_to_leaderboard("user1", "TestUser").await.unwrap();
        
        let leaderboard = engine.get_leaderboard(10).await.unwrap();
        assert_eq!(leaderboard.len(), 1);
        assert_eq!(leaderboard[0].username, "TestUser");
        assert_eq!(leaderboard[0].rank, 1);
    }

    #[tokio::test]
    async fn test_fee_and_slippage_applied() {
        let engine = create_test_engine().await;
        engine.set_enabled(true).await.unwrap();
        
        let trade = engine.execute_trade(
            "buy",
            "SOL",
            "USDC",
            1.0,
            50.0,
            None
        ).await.unwrap();
        
        // Output should be less than expected due to slippage and fees
        assert!(trade.output_amount < 50.0);
        assert!(trade.fee > 0.0);
        assert!(trade.slippage >= 0.0);
        
        // The difference should roughly match fee + slippage
        let expected_loss_percent = trade.slippage + (trade.fee / trade.output_amount * 100.0);
        assert!(expected_loss_percent > 0.0);
    }
}
