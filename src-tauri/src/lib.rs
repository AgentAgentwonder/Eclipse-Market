mod ai;
mod api;
mod auth;
mod core;
mod market;
mod portfolio;
mod security;
mod sentiment;
mod trading;
mod wallet;
mod websocket;
mod stream_commands;

pub use ai::*;
pub use api::*;
pub use auth::*;
pub use core::*;
pub use market::*;
pub use portfolio::*;
pub use sentiment::*;
pub use trading::*;
pub use wallet::hardware_wallet::*;
pub use wallet::phantom::*;

use wallet::hardware_wallet::HardwareWalletState;
use wallet::phantom::{hydrate_wallet_state, WalletState};
use security::keystore::Keystore;
use auth::session_manager::SessionManager;
use auth::two_factor::TwoFactorManager;
use std::error::Error;
use stream_commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(WalletState::new())
        .manage(HardwareWalletState::new())
        .setup(|app| {
            if let Err(e) = hydrate_wallet_state(&app.handle()) {
                eprintln!("Failed to hydrate wallet state: {e}");
            }

            let keystore = Keystore::initialize(&app.handle()).map_err(|e| {
                eprintln!("Failed to initialize keystore: {e}");
                Box::new(e) as Box<dyn Error>
            })?;

            let session_manager = SessionManager::new();
            if let Err(e) = session_manager.hydrate(&keystore) {
                eprintln!("Failed to hydrate session manager: {e}");
            }

            let two_factor_manager = TwoFactorManager::new();
            if let Err(e) = two_factor_manager.hydrate(&keystore) {
                eprintln!("Failed to hydrate 2FA manager: {e}");
            }

            let ws_manager = WebSocketManager::new(app.handle());

            app.manage(keystore);
            app.manage(session_manager);
            app.manage(two_factor_manager);
            app.manage(ws_manager);

            trading::register_trading_state(app);

            let portfolio_data = portfolio::PortfolioDataState::new();
            let rebalancer_state = portfolio::RebalancerState::default();
            let tax_lots_state = portfolio::TaxLotsState::default();

            app.manage(std::sync::Mutex::new(portfolio_data));
            app.manage(std::sync::Mutex::new(rebalancer_state));
            app.manage(std::sync::Mutex::new(tax_lots_state));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Wallet
            phantom_connect,
            phantom_disconnect,
            phantom_session,
            phantom_sign_message,
            phantom_sign_transaction,
            phantom_balance,
            list_hardware_wallets,
            connect_hardware_wallet,
            disconnect_hardware_wallet,
            get_hardware_wallet_address,
            sign_with_hardware_wallet,
            get_firmware_version,
            
            // Auth
            biometric_get_status,
            biometric_enroll,
            biometric_verify,
            biometric_disable,
            biometric_verify_fallback,
            connect_phantom,

            // Session Management
            session_create,
            session_renew,
            session_end,
            session_status,
            session_verify,
            session_update_activity,
            session_configure_timeout,

            // 2FA
            two_factor_enroll,
            two_factor_verify,
            two_factor_disable,
            two_factor_status,
            two_factor_regenerate_backup_codes,
            
            // AI & Sentiment
            assess_risk,
            analyze_text_sentiment,
            
            // Market Data
            get_coin_price,
            get_price_history,
            search_tokens,
            
            // Portfolio & Analytics
            get_portfolio_metrics,
            get_positions,
            list_rebalance_profiles,
            save_rebalance_profile,
            delete_rebalance_profile,
            preview_rebalance,
            execute_rebalance,
            get_rebalance_history,
            check_rebalance_triggers,
            get_tax_lots,
            get_open_tax_lots,
            set_tax_lot_strategy,
            get_tax_lot_strategy,
            dispose_tax_lot,
            generate_tax_report,
            export_tax_report,
            get_tax_loss_harvesting_suggestions,
            
            // WebSocket Streams
            subscribe_price_stream,
            unsubscribe_price_stream,
            subscribe_wallet_stream,
            unsubscribe_wallet_stream,
            get_stream_status,
            reconnect_stream,
            
            // Jupiter v6 & execution safeguards
            jupiter_quote,
            jupiter_swap,
            get_network_congestion,
            get_priority_fee_estimates,
            submit_with_mev_protection,
            validate_trade_thresholds,
            
            // Trading & Orders
            trading_init,
            create_order,
            cancel_order,
            get_active_orders,
            get_order_history,
            get_order,
            acknowledge_order,
            update_order_prices,

            // Paper Trading
            paper_get_status,
            paper_set_enabled,
            paper_get_account,
            paper_get_balances,
            paper_get_balance,
            paper_execute_trade,
            paper_get_positions,
            paper_get_trade_history,
            paper_reset_account,
            paper_update_config,
            paper_get_config,
            paper_update_price,
            paper_submit_to_leaderboard,
            paper_get_leaderboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}