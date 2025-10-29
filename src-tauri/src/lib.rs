mod ai;
mod alerts;
mod api;
mod api_analytics;
mod api_config;
mod auth;
mod bots;
mod cache_commands;
mod chart_stream;
mod core;
mod insiders;
mod data;
mod market;
mod notifications;
mod portfolio;
mod security;
mod sentiment;
mod stream_commands;
mod trading;
mod wallet;
mod websocket;
mod webhooks;

pub use ai::*;
pub use alerts::*;
pub use api::*;
pub use api_analytics::*;
pub use api_config::*;
pub use auth::*;
pub use bots::*;
pub use chart_stream::*;
pub use core::*;
pub use insiders::*;
pub use data::*;
pub use market::*;
pub use notifications::*;
pub use portfolio::*;
pub use sentiment::*;
pub use trading::*;
pub use wallet::hardware_wallet::*;
pub use wallet::ledger::*;
pub use wallet::multi_wallet::*;
pub use wallet::phantom::*;
pub use webhooks::*;

pub use wallet::multisig::*;

use alerts::{AlertManager, SharedAlertManager};
use api::{ApiHealthMonitor, SharedApiHealthMonitor};
use notifications::router::{NotificationRouter, SharedNotificationRouter};
use portfolio::{SharedWatchlistManager, WatchlistManager};
use webhooks::{WebhookManager, SharedWebhookManager};
use wallet::hardware_wallet::HardwareWalletState;
use wallet::ledger::LedgerState;
use wallet::phantom::{hydrate_wallet_state, WalletState};
use wallet::multi_wallet::MultiWalletManager;
use wallet::multisig::{MultisigDatabase, SharedMultisigDatabase};
use security::keystore::Keystore;
use security::activity_log::ActivityLogger;
use data::event_store::{EventStore, SharedEventStore};
use auth::session_manager::SessionManager;
use auth::two_factor::TwoFactorManager;
use std::error::Error;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use stream_commands::*;
use tokio::sync::RwLock;
use wallet::hardware_wallet::HardwareWalletState;
use wallet::multi_wallet::MultiWalletManager;
use wallet::phantom::{hydrate_wallet_state, WalletState};
use core::cache_manager::{CacheType, SharedCacheManager};
use market::{HolderAnalyzer, SharedHolderAnalyzer};

async fn warm_cache_on_startup(
    _app_handle: tauri::AppHandle,
    cache_manager: SharedCacheManager,
) -> Result<(), String> {
    use serde_json::json;

    // Define top tokens to warm
    let top_tokens = vec![
        "So11111111111111111111111111111111111111112", // SOL
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
        "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
        "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // JUP
        "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs", // ETH
        "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", // mSOL
        "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj", // stSOL
        "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", // ORCA
        "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY
    ];

    let manager = cache_manager.read().await;

    // Preload frequently accessed entries from disk cache first
    let warmed_from_disk = manager.populate_from_disk(64).await;
    tracing::info!(preloaded_entries = warmed_from_disk, "cache warmup from disk");

    // Warm cache with top tokens
    let keys: Vec<String> = top_tokens
        .iter()
        .map(|addr| format!("token_price_{}", addr))
        .collect();

    let _ = manager.warm_cache(keys, |key| async move {
        // Mock data - in real implementation would fetch from API
        let data = json!({
            "price": 100.0,
            "change24h": 5.0,
            "volume": 1000000.0,
        });
        Ok((data, CacheType::TokenPrice))
    }).await;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(WalletState::new())
        .manage(HardwareWalletState::new())
        .manage(LedgerState::new())
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

            // Initialize API config manager
            let api_config_manager = api_config::ApiConfigManager::new();
            if let Err(e) = api_config_manager.initialize(&keystore) {
                eprintln!("Failed to initialize API config manager: {e}");
            }

            // Initialize API health monitor
            let api_health_monitor = tauri::async_runtime::block_on(async {
                ApiHealthMonitor::new(&app.handle()).await
            }).map_err(|e| {
                eprintln!("Failed to initialize API health monitor: {e}");
                Box::new(e) as Box<dyn Error>
            })?;

            let api_health_state: SharedApiHealthMonitor = Arc::new(RwLock::new(api_health_monitor));

            app.manage(keystore);
            app.manage(multi_wallet_manager);
            app.manage(session_manager);
            app.manage(two_factor_manager);
            app.manage(ws_manager);
            app.manage(activity_logger);
            app.manage(api_config_manager);
            app.manage(api_health_state.clone());

            let usage_tracker = api_analytics::initialize_usage_tracker(&app.handle()).map_err(|e| {
                eprintln!("Failed to initialize API usage tracker: {e}");
                Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
            })?;
            app.manage(usage_tracker);

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
            trading::register_paper_trading_state(app);

            // Initialize wallet monitor
            let monitor_handle = app.handle();
            tauri::async_runtime::spawn(async move {
               if let Err(err) = insiders::init_wallet_monitor(&monitor_handle).await {
                   eprintln!("Failed to initialize wallet monitor: {err}");
               }
            });

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

             // Initialize new coins scanner
             let new_coins_scanner = tauri::async_runtime::block_on(async {
                 market::NewCoinsScanner::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize new coins scanner: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let scanner_state: market::SharedNewCoinsScanner = Arc::new(RwLock::new(new_coins_scanner));
             app.manage(scanner_state.clone());

             // Start background scanning task
             let scanner_for_loop = scanner_state.clone();
             market::start_new_coins_scanner(scanner_for_loop);

             let top_coins_cache: market::SharedTopCoinsCache = Arc::new(RwLock::new(market::TopCoinsCache::new()));
             app.manage(top_coins_cache.clone());

             // Initialize watchlist manager
             let watchlist_manager = tauri::async_runtime::block_on(async {
                 WatchlistManager::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize watchlist manager: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let watchlist_state: SharedWatchlistManager = Arc::new(RwLock::new(watchlist_manager));
             app.manage(watchlist_state.clone());

             // Initialize alert manager
             let alert_manager = tauri::async_runtime::block_on(async {
                 AlertManager::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize alert manager: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let alert_state: SharedAlertManager = Arc::new(RwLock::new(alert_manager));
             app.manage(alert_state.clone());

             // Start alert cooldown reset task
             let alert_reset_state = alert_state.clone();
             tauri::async_runtime::spawn(async move {
                 use tokio::time::{sleep, Duration};
                 loop {
                     sleep(Duration::from_secs(60)).await; // Check every minute
                     let mgr = alert_reset_state.read().await;
                     if let Err(err) = mgr.reset_cooldowns().await {
                         eprintln!("Failed to reset alert cooldowns: {err}");
                     }
                 }
             });

             // Initialize notification router
             let notification_router = tauri::async_runtime::block_on(async {
                 NotificationRouter::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize notification router: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let notification_state: SharedNotificationRouter = Arc::new(RwLock::new(notification_router));
             app.manage(notification_state.clone());

             // Initialize webhook manager
             let webhook_manager = tauri::async_runtime::block_on(async {
                 WebhookManager::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize webhook manager: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let webhook_state: SharedWebhookManager = Arc::new(RwLock::new(webhook_manager));
             app.manage(webhook_state.clone());

             // Initialize cache manager
             let cache_manager = core::cache_manager::CacheManager::new(100, 1000);
             let shared_cache_manager = Arc::new(RwLock::new(cache_manager));
             app.manage(shared_cache_manager.clone());

             // Start background cache warming
             let app_handle = app.handle();
             let cache_manager_handle = shared_cache_manager.clone();
             tauri::async_runtime::spawn(async move {
                 if let Err(err) = warm_cache_on_startup(app_handle, cache_manager_handle).await {
                     eprintln!("Failed to warm cache on startup: {err}");
                 }
             });

             // Initialize event store
             let mut event_store_path = app
                 .path_resolver()
                 .app_data_dir()
                 .ok_or_else(|| "Unable to resolve app data directory".to_string())?;

             event_store_path.push("events.db");

             let event_store = tauri::async_runtime::block_on(EventStore::new(event_store_path))
                 .map_err(|e| {
                     eprintln!("Failed to initialize event store: {e}");
                     Box::new(e) as Box<dyn Error>
                 })?;

             let shared_event_store: SharedEventStore = Arc::new(RwLock::new(event_store));
             app.manage(shared_event_store.clone());

             // Initialize compression manager
             let mut compression_db_path = app
                 .path_resolver()
                 .app_data_dir()
                 .ok_or_else(|| "Unable to resolve app data directory".to_string())?;

             compression_db_path.push("events.db");

             let compression_manager = tauri::async_runtime::block_on(CompressionManager::new(compression_db_path))
                 .map_err(|e| {
                     eprintln!("Failed to initialize compression manager: {e}");
                     Box::new(e) as Box<dyn Error>
                 })?;

             let shared_compression_manager: SharedCompressionManager = Arc::new(RwLock::new(compression_manager));
             app.manage(shared_compression_manager.clone());

             // Initialize holder analyzer
             let holder_analyzer = tauri::async_runtime::block_on(async {
                 HolderAnalyzer::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize holder analyzer: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let shared_holder_analyzer: SharedHolderAnalyzer = Arc::new(RwLock::new(holder_analyzer));
             app.manage(shared_holder_analyzer.clone());

             // Start background compression job (runs daily at 3 AM)
             let compression_job = shared_compression_manager.clone();
             tauri::async_runtime::spawn(async move {
                 use chrono::Timelike;
                 use tokio::time::{sleep, Duration};

                 loop {
                     let now = chrono::Utc::now();
                     
                     // Calculate time until 3 AM
                     let mut next_run = now
                         .date_naive()
                         .and_hms_opt(3, 0, 0)
                         .unwrap()
                         .and_utc();
                     
                     if now.hour() >= 3 {
                         next_run = next_run + chrono::Duration::days(1);
                     }
                     
                     let duration_until_next = next_run.signed_duration_since(now);
                     let sleep_secs = duration_until_next.num_seconds().max(0) as u64;
                     
                     sleep(Duration::from_secs(sleep_secs)).await;
                     
                     // Run compression
                     let manager = compression_job.read().await;
                     let config = manager.get_config().await;
                     
                     if config.enabled && config.auto_compress {
                         if let Err(err) = manager.compress_old_events().await {
                             eprintln!("Failed to compress old events: {err}");
                         }
                         if let Err(err) = manager.compress_old_trades().await {
                             eprintln!("Failed to compress old trades: {err}");
                         }
                         manager.cleanup_cache().await;
                     }
                 }
             });

             Ok(())
             })

             // Wallet
             phantom_connect,
             phantom_disconnect,

            phantom_sign_message,
            phantom_sign_transaction,
            phantom_balance,
            list_hardware_wallets,
            connect_hardware_wallet,
            disconnect_hardware_wallet,
            get_hardware_wallet_address,
            sign_with_hardware_wallet,
            get_firmware_version,
            ledger_register_device,
            ledger_list_devices,
            ledger_get_device,
            ledger_connect_device,
            ledger_disconnect_device,
            ledger_update_device_address,
            ledger_validate_transaction,
            ledger_get_active_device,
            ledger_remove_device,
            ledger_clear_devices,
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
            // API Config
            save_api_key,
            remove_api_key,
            set_use_default_key,
            test_api_connection,
            get_api_status,
            rotate_api_key,
            check_rotation_reminders,
            export_api_keys,
            import_api_keys,
            // API Analytics
            record_api_usage,
            get_api_analytics,
            get_fair_use_status,
            // AI & Sentiment
            assess_risk,
            analyze_text_sentiment,
            // Market Data
            get_coin_price,
            get_price_history,
            search_tokens,
            get_trending_coins,
            get_coin_sentiment,
            refresh_trending,
            
            // New Coins Scanner
            get_new_coins,
            get_coin_safety_report,
            scan_for_new_coins,
            
            // Top Coins
            get_top_coins,
            refresh_top_coins,
            
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
            watchlist_create,
            watchlist_list,
            watchlist_get,
            watchlist_update,
            watchlist_delete,
            watchlist_add_item,
            watchlist_remove_item,
            watchlist_reorder_items,
            watchlist_export,
            watchlist_import,
            // Alerts & Notifications
            alert_create,
            alert_list,
            alert_get,
            alert_update,
            alert_delete,
            alert_test,
            alert_check_triggers,
            alert_reset_cooldowns,
            // Chat Integrations
            chat_integration_get_settings,
            chat_integration_save_settings,
            chat_integration_add_telegram,
            chat_integration_update_telegram,
            chat_integration_delete_telegram,
            chat_integration_add_slack,
            chat_integration_update_slack,
            chat_integration_delete_slack,
            chat_integration_add_discord,
            chat_integration_update_discord,
            chat_integration_delete_discord,
            chat_integration_test_telegram,
            chat_integration_test_slack,
            chat_integration_test_discord,
            chat_integration_get_delivery_logs,
            chat_integration_clear_delivery_logs,
            chat_integration_get_rate_limits,
            // Webhooks
            list_webhooks,
            get_webhook,
            create_webhook,
            update_webhook,
            delete_webhook,
            trigger_webhook,
            test_webhook,
            list_webhook_delivery_logs,
            // API Health
            get_api_health_dashboard,
            get_service_health_metrics,
            cleanup_health_records,
            // WebSocket Streams
            subscribe_price_stream,
            unsubscribe_price_stream,
            subscribe_wallet_stream,
            unsubscribe_wallet_stream,
            get_stream_status,
            reconnect_stream,
            // Chart Streams
            subscribe_chart_prices,
            unsubscribe_chart_prices,
            get_chart_subscriptions,
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
            
            // Paper Trading Simulation
            paper_trading_init,
            get_paper_account,
            reset_paper_account,
            execute_paper_trade,
            get_paper_positions,
            get_paper_trade_history,
            get_paper_performance,
            update_paper_position_prices,
            
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
            
            // Wallet Monitor
            wallet_monitor_init,
            wallet_monitor_add_wallet,
            wallet_monitor_update_wallet,
            wallet_monitor_remove_wallet,
            wallet_monitor_list_wallets,
            wallet_monitor_get_activities,
            wallet_monitor_get_statistics,
            
            // Activity Logging
            security::activity_log::get_activity_logs,
            security::activity_log::export_activity_logs,
            security::activity_log::get_activity_stats,
            security::activity_log::check_suspicious_activity,
            security::activity_log::cleanup_activity_logs,
            security::activity_log::get_activity_retention,
            security::activity_log::set_activity_retention,

            // Performance & Diagnostics
            get_performance_metrics,
            run_performance_test,
            reset_performance_stats,

            // Cache Management
            cache_commands::get_cache_statistics,
            cache_commands::clear_cache,
            cache_commands::warm_cache,
            cache_commands::get_ttl_config,
            cache_commands::update_ttl_config,
            cache_commands::reset_ttl_config,
            cache_commands::test_cache_performance,

            // Event Sourcing & Audit Trail
            data::event_store::get_events_command,
            data::event_store::replay_events_command,
            data::event_store::get_state_at_time_command,
            data::event_store::export_audit_trail_command,
            data::event_store::create_snapshot_command,
            data::event_store::get_event_stats,

            // Data Compression
            data::compression_commands::get_compression_stats,
            data::compression_commands::compress_old_data,
            data::compression_commands::update_compression_config,
            data::compression_commands::get_compression_config,
            data::compression_commands::decompress_data,
            data::compression_commands::get_database_size,

            // Email Notifications
            email_save_config,
            email_get_config,
            email_delete_config,
            email_test_connection,
            email_send,
            email_get_stats,
            email_get_history,

            // Twitter Integration
            twitter_save_config,
            twitter_get_config,
            twitter_delete_config,
            twitter_test_connection,
            twitter_add_keyword,
            twitter_list_keywords,
            twitter_remove_keyword,
            twitter_add_influencer,
            twitter_list_influencers,
            twitter_remove_influencer,
            twitter_fetch_sentiment,
            twitter_get_sentiment_history,
            twitter_get_stats,
            twitter_get_tweet_history,

            // Holder Analysis & Metadata
            market::holders::get_holder_distribution,
            market::holders::get_holder_trends,
            market::holders::get_large_transfers,
            market::holders::get_token_metadata,
            market::holders::get_verification_status,
            market::holders::export_holder_data,
            market::holders::export_metadata_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
