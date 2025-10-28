mod ai;
mod api;
mod auth;
mod bots;
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
pub use bots::*;
pub use core::*;
pub use market::*;
pub use portfolio::*;
pub use sentiment::*;
pub use trading::*;
pub use wallet::hardware_wallet::*;
pub use wallet::phantom::*;
pub use wallet::multi_wallet::*;
pub use wallet::multisig::*;

use wallet::hardware_wallet::HardwareWalletState;
use wallet::phantom::{hydrate_wallet_state, WalletState};
use wallet::multi_wallet::MultiWalletManager;
use wallet::multisig::{MultisigDatabase, SharedMultisigDatabase};
use security::keystore::Keystore;
use security::activity_log::ActivityLogger;
use auth::session_manager::SessionManager;
use auth::two_factor::TwoFactorManager;
use std::error::Error;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
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

            let multi_wallet_manager = MultiWalletManager::initialize(&keystore).map_err(|e| {
               eprintln!("Failed to initialize multi-wallet manager: {e}");
               Box::new(e) as Box<dyn Error>
            })?;

            let activity_logger = tauri::async_runtime::block_on(async {
                ActivityLogger::new(&app.handle()).await
            }).map_err(|e| {
                eprintln!("Failed to initialize activity logger: {e}");
                Box::new(e) as Box<dyn Error>
            })?;

            let cleanup_logger = activity_logger.clone();

            app.manage(keystore);
            app.manage(multi_wallet_manager);
            app.manage(session_manager);
            app.manage(two_factor_manager);
            app.manage(ws_manager);
            app.manage(activity_logger);

            tauri::async_runtime::spawn(async move {
                use tokio::time::{sleep, Duration};

                if let Err(err) = cleanup_logger.cleanup_old_logs(None).await {
                    eprintln!("Failed to run initial activity log cleanup: {err}");
                }

                loop {
                    sleep(Duration::from_secs(24 * 60 * 60)).await;
                    if let Err(err) = cleanup_logger.cleanup_old_logs(None).await {
                        eprintln!("Failed to run scheduled activity log cleanup: {err}");
                    }
                }
            });

            trading::register_trading_state(app);

            // Initialize multisig database
            let mut multisig_db_path = app
                .path_resolver()
                .app_data_dir()
                .ok_or_else(|| "Unable to resolve app data directory".to_string())?;

            std::fs::create_dir_all(&multisig_db_path)
                .map_err(|e| format!("Failed to create app data directory: {e}"))?;

            multisig_db_path.push("multisig.db");

            let multisig_db = tauri::async_runtime::block_on(MultisigDatabase::new(multisig_db_path))
                .map_err(|e| {
                    eprintln!("Failed to initialize multisig database: {e}");
                    Box::new(e) as Box<dyn Error>
                })?;

            let multisig_state: SharedMultisigDatabase = Arc::new(RwLock::new(multisig_db));
            app.manage(multisig_state.clone());

             let automation_handle = app.handle();
             tauri::async_runtime::spawn(async move {
                 if let Err(err) = bots::init_dca(&automation_handle).await {
                     eprintln!("Failed to initialize DCA bots: {err}");
                 }
                 if let Err(err) = trading::init_copy_trading(&automation_handle).await {
                     eprintln!("Failed to initialize copy trading: {err}");
                 }
             });

             let portfolio_data = portfolio::PortfolioDataState::new();
             let rebalancer_state = portfolio::RebalancerState::default();
             let tax_lots_state = portfolio::TaxLotsState::default();

             app.manage(std::sync::Mutex::new(portfolio_data));
             app.manage(std::sync::Mutex::new(rebalancer_state));
             app.manage(std::sync::Mutex::new(tax_lots_state));

             Ok(())
            })

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
            
            // Multi-Wallet
            multi_wallet_add,
            multi_wallet_update,
            multi_wallet_remove,
            multi_wallet_set_active,
            multi_wallet_get_active,
            multi_wallet_list,
            multi_wallet_update_balance,
            multi_wallet_update_performance,
            multi_wallet_create_group,
            multi_wallet_update_group,
            multi_wallet_delete_group,
            multi_wallet_list_groups,
            multi_wallet_get_aggregated,
            
            // Multisig
            create_multisig_wallet,
            list_multisig_wallets,
            get_multisig_wallet,
            create_proposal,
            list_proposals,
            sign_proposal,
            execute_proposal,
            cancel_proposal,
            
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
            
            // DCA Bots
            dca_init,
            dca_create,
            dca_list,
            dca_get,
            dca_pause,
            dca_resume,
            dca_delete,
            dca_history,
            dca_performance,
            
            // Copy Trading
            copy_trading_init,
            copy_trading_create,
            copy_trading_list,
            copy_trading_get,
            copy_trading_pause,
            copy_trading_resume,
            copy_trading_delete,
            copy_trading_history,
            copy_trading_performance,
            copy_trading_process_activity,
            copy_trading_followed_wallets,
            
            // Activity Logging
            security::activity_log::get_activity_logs,
            security::activity_log::export_activity_logs,
            security::activity_log::get_activity_stats,
            security::activity_log::check_suspicious_activity,
            security::activity_log::cleanup_activity_logs,
            security::activity_log::get_activity_retention,
            security::activity_log::set_activity_retention,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}