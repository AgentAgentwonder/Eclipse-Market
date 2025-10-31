mod ai;
mod ai_chat;
mod alerts;
mod anomalies;
mod api;
mod api_analytics;
mod api_config;
mod auth;
mod auto_start;
mod backup;
mod bots;
mod cache_commands;
mod chains;
mod bridges;
mod chart_stream;
mod collab;
mod compiler;
mod config;
mod core;
mod diagnostics;
mod data;
mod defi;
mod dev_tools;
mod drawings;
mod errors;
mod fixer;
mod indicators;
mod insiders;
mod launchpad;
mod logger;
mod market;
mod mobile;
mod monitor;
mod notifications;
mod portfolio;
mod recovery;
mod security;
mod sentiment;
mod stocks;
mod stream_commands;
mod tax;
mod token_flow;
mod trading;
mod tray;
mod ui;
mod updater;
mod voice;
pub mod voice;
mod wallet;
mod websocket;
mod webhooks;
mod windowing;
mod academy;
mod governance;

pub use academy::*;
pub use governance::*;
pub use ai::*;
pub use ai_chat::*;
pub use alerts::*;
pub use anomalies::*;
pub use api::*;
pub use api_analytics::*;
pub use api_config::*;
pub use auth::*;
pub use auto_start::*;
pub use backup::*;
pub use bots::*;
pub use chains::*;
pub use bridges::*;
pub use chart_stream::*;
pub use collab::*;
pub use compiler::*;
pub use config::*;
pub use core::*;
pub use data::*;
pub use defi::*;
pub use dev_tools::*;
pub use drawings::*;
pub use errors::*;
pub use fixer::*;
pub use indicators::*;
pub use insiders::*;
pub use launchpad::*;
pub use logger::*;
pub use market::*;
pub use mobile::*;
pub use monitor::*;
pub use notifications::*;
pub use portfolio::*;
pub use recovery::*;
pub use sentiment::*;
pub use stocks::*;
pub use tax::*;
pub use token_flow::*;
pub use trading::*;
pub use tray::*;
pub use ui::theme_engine::*;
pub use updater::*;
pub use voice::*;
pub use wallet::hardware_wallet::*;
pub use wallet::ledger::*;
pub use wallet::multi_wallet::*;
pub use wallet::operations::*;
pub use wallet::phantom::*;
pub use webhooks::*;

pub use wallet::multisig::*;
pub use wallet::performance::*;
pub use windowing::*;

use ai::launch_predictor::{
    add_launch_training_data,
    extract_token_features,
    get_launch_bias_report,
    get_launch_prediction_history,
    load_latest_launch_model,
    predict_launch_success,
    retrain_launch_model,
    LaunchPredictor,
    SharedLaunchPredictor,
};
use ai::SharedAIAssistant;
use alerts::{AlertManager, SharedAlertManager, SharedSmartAlertManager, SmartAlertManager};
use api::{ApiHealthMonitor, SharedApiHealthMonitor};
use collab::state::CollabState;
use drawings::{DrawingManager, SharedDrawingManager};
use indicators::{IndicatorManager, SharedIndicatorManager};
use notifications::router::{NotificationRouter, SharedNotificationRouter};
use portfolio::{AIPortfolioAdvisor, SharedAIPortfolioAdvisor, SharedWatchlistManager, WatchlistManager};
use webhooks::{WebhookManager, SharedWebhookManager};
use wallet::hardware_wallet::HardwareWalletState;
use wallet::ledger::LedgerState;
use wallet::phantom::{hydrate_wallet_state, WalletState};
use wallet::multi_wallet::MultiWalletManager;
use wallet::operations::WalletOperationsManager;
use wallet::multisig::{MultisigDatabase, SharedMultisigDatabase};
use wallet::performance::{PerformanceDatabase, SharedPerformanceDatabase};
use security::keystore::Keystore;
use security::activity_log::ActivityLogger;
use security::audit::AuditCache;
use security::reputation::{ReputationEngine, SharedReputationEngine};
use data::event_store::{EventStore, SharedEventStore};
use data::historical::{HistoricalReplayManager, SharedHistoricalReplayManager};
use auth::session_manager::SessionManager;
use auth::two_factor::TwoFactorManager;
use std::error::Error;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tokio::sync::RwLock;
use stream_commands::*;
use tokio::sync::RwLock;
use wallet::hardware_wallet::HardwareWalletState;
use wallet::multi_wallet::MultiWalletManager;
use wallet::phantom::{hydrate_wallet_state, WalletState};
use auto_start::{AutoStartManager, SharedAutoStartManager};
use tray::{attach_window_listeners, handle_tray_event, SharedTrayManager, TrayManager};
use core::cache_manager::{CacheType, SharedCacheManager};
use market::{HolderAnalyzer, SharedHolderAnalyzer};
use chains::{ChainManager, SharedChainManager};
use bridges::{BridgeManager, SharedBridgeManager};
use mobile::{
    MobileAuthManager,
    MobileSyncManager,
    MobileTradeEngine,
    PushNotificationManager,
    WidgetManager,
    SharedMobileAuthManager,
    SharedMobileSyncManager,
    SharedPushNotificationManager,
};
use voice::commands::{SharedVoiceState, VoiceState};
use config::settings_manager::{SettingsManager, SharedSettingsManager};
use governance::commands::*;

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
        .system_tray(TrayManager::create_tray())
        .on_system_tray_event(|app, event| {
            handle_tray_event(app, event);
        })
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

            let tax_engine = tax::initialize_tax_engine(&keystore);

            let audit_cache = AuditCache::new();
            app.manage(audit_cache);

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

            let wallet_operations_manager = WalletOperationsManager::initialize(&keystore).map_err(|e| {
               eprintln!("Failed to initialize wallet operations manager: {e}");
               Box::new(e) as Box<dyn Error>
            })?;

            let activity_logger = tauri::async_runtime::block_on(async {
                ActivityLogger::new(&app.handle()).await
            }).map_err(|e| {
                eprintln!("Failed to initialize activity logger: {e}");
                Box::new(e) as Box<dyn Error>
            })?;

            let cleanup_logger = activity_logger.clone();

            // Initialize reputation engine
            let reputation_engine = tauri::async_runtime::block_on(async {
                ReputationEngine::new(&app.handle()).await
            }).map_err(|e| {
                eprintln!("Failed to initialize reputation engine: {e}");
                Box::new(e) as Box<dyn Error>
            })?;

            let shared_reputation_engine: SharedReputationEngine = Arc::new(RwLock::new(reputation_engine));
            app.manage(shared_reputation_engine.clone());

            // Initialize academy engine
            let academy_engine = tauri::async_runtime::block_on(async {
                academy::AcademyEngine::new(&app.handle()).await
            }).map_err(|e| {
                eprintln!("Failed to initialize academy engine: {e}");
                Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
            })?;

            let shared_academy_engine: academy::SharedAcademyEngine = Arc::new(RwLock::new(academy_engine));
            app.manage(shared_academy_engine.clone());

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
            app.manage(wallet_operations_manager);
            app.manage(session_manager);
            app.manage(two_factor_manager);
            app.manage(ws_manager);
            app.manage(activity_logger);
            app.manage(api_config_manager);
            app.manage(api_health_state.clone());

            let chain_manager: SharedChainManager = Arc::new(RwLock::new(ChainManager::new()));
            app.manage(chain_manager.clone());

            let bridge_manager: SharedBridgeManager = Arc::new(RwLock::new(BridgeManager::new()));
            app.manage(bridge_manager.clone());

            let usage_tracker = api_analytics::initialize_usage_tracker(&app.handle()).map_err(|e| {
                eprintln!("Failed to initialize API usage tracker: {e}");
                Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
            })?;
            app.manage(usage_tracker);

            // Initialize universal settings manager
            let settings_manager = SettingsManager::new(&app.handle()).map_err(|e| {
                eprintln!("Failed to initialize settings manager: {e}");
                Box::new(e) as Box<dyn Error>
            })?;
            let settings_state: SharedSettingsManager = Arc::new(RwLock::new(settings_manager));
            app.manage(settings_state.clone());

            // Initialize launchpad state
            let rpc_url = "https://api.mainnet-beta.solana.com".to_string();
            let launchpad_state = launchpad::commands::create_launchpad_state(rpc_url);
            app.manage(launchpad_state);

            // Initialize collaborative rooms state
            let collab_websocket = collab::websocket::CollabWebSocketManager::new(app.handle());
            let collab_state = CollabState::new(collab_websocket);
            app.manage(collab_state);

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
            trading::register_auto_trading_state(app);
            trading::register_optimizer_state(app);

            // Initialize safety engine
            let default_policy = trading::safety::policy::SafetyPolicy::default();
            let safety_engine = trading::SafetyEngine::new(default_policy, 30);
            let safety_state: trading::SharedSafetyEngine = Arc::new(RwLock::new(safety_engine));
            app.manage(safety_state.clone());

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

            // Initialize performance database
            let mut performance_db_path = app
                .path_resolver()
                .app_data_dir()
                .ok_or_else(|| "Unable to resolve app data directory".to_string())?;

            std::fs::create_dir_all(&performance_db_path)
                .map_err(|e| format!("Failed to create app data directory: {e}"))?;

            performance_db_path.push("performance.db");

            let performance_db = tauri::async_runtime::block_on(PerformanceDatabase::new(performance_db_path))
                .map_err(|e| {
                    eprintln!("Failed to initialize performance database: {e}");
                    Box::new(e) as Box<dyn Error>
                })?;

            let performance_state: SharedPerformanceDatabase = Arc::new(RwLock::new(performance_db));
            app.manage(performance_state.clone());

            // Initialize backup service and scheduler
            let backup_service = backup::service::BackupService::new(&app.handle());
            let backup_service_state: backup::service::SharedBackupService = Arc::new(RwLock::new(backup_service));
            app.manage(backup_service_state.clone());

            let backup_scheduler = backup::scheduler::BackupScheduler::new(&app.handle()).map_err(|e| {
                eprintln!("Failed to initialize backup scheduler: {e}");
                Box::new(e) as Box<dyn Error>
            })?;
            let backup_scheduler_state: backup::scheduler::SharedBackupScheduler = Arc::new(RwLock::new(backup_scheduler));
            app.manage(backup_scheduler_state.clone());

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
             app.manage(tax_engine.clone());

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

             let token_flow_state = token_flow::commands::create_token_flow_state();
             app.manage(token_flow_state.clone());

             // Initialize alert manager
             let alert_manager = tauri::async_runtime::block_on(async {
                 AlertManager::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize alert manager: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let alert_state: SharedAlertManager = Arc::new(RwLock::new(alert_manager));
             app.manage(alert_state.clone());

             let smart_alert_manager = tauri::async_runtime::block_on(async {
                 SmartAlertManager::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize smart alert manager: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let smart_alert_state: SharedSmartAlertManager = Arc::new(RwLock::new(smart_alert_manager));
             app.manage(smart_alert_state.clone());

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

                 NotificationRouter::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize notification router: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let notification_state: SharedNotificationRouter = Arc::new(RwLock::new(notification_router));
             app.manage(notification_state.clone());

             // Initialize indicator manager
             let app_data_dir = app
                 .path_resolver()
                 .app_data_dir()
                 .ok_or_else(|| "Unable to resolve app data directory".to_string())?;
             
             let indicator_manager = IndicatorManager::new(app_data_dir.clone());
             let indicator_state: SharedIndicatorManager = Arc::new(RwLock::new(indicator_manager));
             app.manage(indicator_state.clone());

             // Initialize drawing manager
             let drawing_manager = DrawingManager::new(app_data_dir.clone());
             let drawing_state: SharedDrawingManager = Arc::new(RwLock::new(drawing_manager));
             app.manage(drawing_state.clone());

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

             // Initialize sentiment manager
             let sentiment_manager = sentiment::SentimentManager::new();
             let sentiment_state: sentiment::SharedSentimentManager = Arc::new(RwLock::new(sentiment_manager));
             app.manage(sentiment_state.clone());

             // Initialize anomaly detector
             let anomaly_detector = anomalies::AnomalyDetector::new();
             let anomaly_state: anomalies::SharedAnomalyDetector = Arc::new(RwLock::new(anomaly_detector));
             app.manage(anomaly_state.clone());

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

             // Initialize stock cache state
             let stock_cache: stocks::SharedStockCache = Arc::new(RwLock::new(stocks::StockCache::default()));
             app.manage(stock_cache.clone());
             // Initialize risk analyzer
             let risk_analyzer = tauri::async_runtime::block_on(async {
                 ai::RiskAnalyzer::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize risk analyzer: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let shared_risk_analyzer: ai::SharedRiskAnalyzer = Arc::new(RwLock::new(risk_analyzer));
             app.manage(shared_risk_analyzer.clone());

             // Initialize AI portfolio advisor
             let ai_advisor = tauri::async_runtime::block_on(async {
                 AIPortfolioAdvisor::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize AI portfolio advisor: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let shared_ai_advisor: SharedAIPortfolioAdvisor = Arc::new(RwLock::new(ai_advisor));
             app.manage(shared_ai_advisor.clone());

             // Initialize AI Assistant
             let ai_assistant = tauri::async_runtime::block_on(async {
                 ai::AIAssistant::new(&app.handle(), &keystore).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize AI assistant: {e}");
                 Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
             })?;

             let shared_ai_assistant: ai::SharedAIAssistant = Arc::new(RwLock::new(ai_assistant));
             app.manage(shared_ai_assistant.clone());

             // Initialize launch predictor
             let launch_predictor = tauri::async_runtime::block_on(async {
                 LaunchPredictor::new(&app.handle()).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize launch predictor: {e}");
                 Box::new(e) as Box<dyn Error>
             })?;

             let shared_launch_predictor: SharedLaunchPredictor = Arc::new(RwLock::new(launch_predictor));
             app.manage(shared_launch_predictor.clone());

             // Initialize updater state
             let updater_state = UpdaterState::new(&app.handle()).map_err(|e| {
                 eprintln!("Failed to initialize updater state: {e}");
                 Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
             })?;

             let shared_updater_state: SharedUpdaterState = Arc::new(updater_state);
             app.manage(shared_updater_state.clone());

             // Initialize system tray manager
             let tray_manager = TrayManager::new();
             tray_manager.initialize(&app.handle());
             let shared_tray_manager: SharedTrayManager = Arc::new(tray_manager);
             app.manage(shared_tray_manager.clone());

             // Initialize auto-start manager
             let app_name = "Eclipse Market Pro";
             let app_path = std::env::current_exe()
                 .ok()
                 .and_then(|p| p.to_str().map(|s| s.to_string()))
                 .unwrap_or_else(|| "eclipse-market-pro".to_string());
             
             let auto_start_manager = AutoStartManager::new(app_name, &app_path)
                 .map_err(|e| {
                     eprintln!("Failed to initialize auto-start manager: {e}");
                     Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
                 })?;
             auto_start_manager.initialize(&app.handle());
             let shared_auto_start_manager: SharedAutoStartManager = Arc::new(auto_start_manager);
             app.manage(shared_auto_start_manager.clone());

             // Initialize historical replay manager
             let historical_replay_manager = tauri::async_runtime::block_on(async {
                 HistoricalReplayManager::new(&app.handle(), None).await
             }).map_err(|e| {
                 eprintln!("Failed to initialize historical replay manager: {e}");
                 Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
             })?;

             let shared_historical_manager: SharedHistoricalReplayManager = Arc::new(RwLock::new(historical_replay_manager));
             app.manage(shared_historical_manager.clone());

             // Initialize voice state
             let voice_state = VoiceState::new();
             let shared_voice_state: SharedVoiceState = Arc::new(RwLock::new(voice_state));
             app.manage(shared_voice_state.clone());

             // Initialize theme engine
             let theme_engine = ui::theme_engine::ThemeEngine::initialize(&app.handle()).map_err(|e| {
                 eprintln!("Failed to initialize theme engine: {e}");
                 Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
             })?;
             let shared_theme_engine: ui::theme_engine::SharedThemeEngine = Arc::new(std::sync::Mutex::new(theme_engine));
             app.manage(shared_theme_engine.clone());

             // Attach tray window listeners
             if let Some(window) = app.get_window("main") {
                 attach_window_listeners(&window, shared_tray_manager.clone());
             }

             // Handle auto-start behavior
             let auto_settings = shared_auto_start_manager.get_settings();
             let launched_from_auto_start = std::env::args().any(|arg| arg == "--auto-start");
             if launched_from_auto_start {
                 if auto_settings.start_minimized {
                     if let Some(window) = app.get_window("main") {
                         let _ = window.hide();
                     }
                     shared_tray_manager.notify_minimized(&app.handle());
                 } else if auto_settings.delay_seconds > 0 {
                     if let Some(window) = app.get_window("main") {
                         let _ = window.hide();
                     }
                     let app_handle = app.handle();
                     let delay = auto_settings.delay_seconds;
                     tauri::async_runtime::spawn(async move {
                         use tokio::time::{sleep, Duration};
                         sleep(Duration::from_secs(delay as u64)).await;
                         if let Some(window) = app_handle.get_window("main") {
                             let _ = window.show();
                             let _ = window.unminimize();
                             let _ = window.set_focus();
                         }
                     });
                 }
             }

             // Start background compression job (runs daily at 3 AM)
              let compression_job = shared_compression_manager.clone();
              tauri::async_runtime::spawn(async move {

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

              // Initialize prediction market service
              let prediction_service = market::PredictionMarketService::new();
              let shared_prediction_service: market::SharedPredictionMarketService = Arc::new(RwLock::new(prediction_service));
              app.manage(shared_prediction_service.clone());

              // Initialize diagnostics engine
              let diagnostics_engine = diagnostics::tauri_commands::initialize_diagnostics_engine(&app.handle())
                  .map_err(|e| {
                      eprintln!("Failed to initialize diagnostics engine: {e}");
                      Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
                  })?;
              app.manage(diagnostics_engine.clone());

              let diagnostics_state = diagnostics_engine.clone();
              tauri::async_runtime::spawn(async move {
                  use tokio::time::{sleep, Duration};
                  loop {
                      {
                          let mut engine = diagnostics_state.write().await;
                          let _ = engine.run_full_diagnostics().await;
                      }
                      sleep(Duration::from_secs(60 * 60)).await;
                  }
              });
              // Initialize dev tools
              let logger = logger::ComprehensiveLogger::new(&app.handle())
                  .map_err(|e| {
                      eprintln!("Failed to initialize logger: {e}");
                      Box::new(e) as Box<dyn Error>
                  })?;
              let shared_logger: logger::SharedLogger = Arc::new(logger);
              app.manage(shared_logger.clone());

              let crash_reporter = errors::CrashReporter::new(&app.handle(), shared_logger.clone())
                  .map_err(|e| {
                      eprintln!("Failed to initialize crash reporter: {e}");
                      Box::new(e) as Box<dyn Error>
                  })?;
              let shared_crash_reporter: errors::SharedCrashReporter = Arc::new(crash_reporter);
              app.manage(shared_crash_reporter.clone());

              let runtime_handler = errors::RuntimeHandler::new(shared_logger.clone());
              let shared_runtime_handler: errors::SharedRuntimeHandler = Arc::new(runtime_handler);
              app.manage(shared_runtime_handler.clone());

              let performance_monitor = monitor::PerformanceMonitor::new();
              let shared_performance_monitor: monitor::SharedPerformanceMonitor = Arc::new(performance_monitor);
              app.manage(shared_performance_monitor.clone());
              shared_performance_monitor.start();

              let auto_compiler = compiler::AutoCompiler::new();
              let shared_auto_compiler = Arc::new(auto_compiler);
              app.manage(shared_auto_compiler.clone());

              let auto_fixer = fixer::AutoFixer::new(3);
              let shared_auto_fixer = Arc::new(auto_fixer);
              app.manage(shared_auto_fixer.clone());

              shared_logger.info("Dev tools initialized successfully", None);

              // Initialize mobile managers
              let mut mobile_data_dir = app
                  .path_resolver()
                  .app_data_dir()
                  .ok_or_else(|| "Unable to resolve app data directory".to_string())?;
              mobile_data_dir.push("mobile");
              std::fs::create_dir_all(&mobile_data_dir)
                  .map_err(|e| format!("Failed to create mobile directory: {e}"))?;

              let mut mobile_auth_manager = MobileAuthManager::new(mobile_data_dir.clone());
              tauri::async_runtime::block_on(mobile_auth_manager.load())
                  .map_err(|e| {
                      eprintln!("Failed to load mobile auth manager: {e}");
                      Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error>
                  })?;
              let mobile_auth_state: SharedMobileAuthManager = Arc::new(RwLock::new(mobile_auth_manager));
              app.manage(mobile_auth_state.clone());

              let push_notification_manager = PushNotificationManager::new(1000);
              let push_notification_state: SharedPushNotificationManager = Arc::new(RwLock::new(push_notification_manager));
              app.manage(push_notification_state.clone());

              let mobile_sync_manager = MobileSyncManager::new();
              let mobile_sync_state: SharedMobileSyncManager = Arc::new(RwLock::new(mobile_sync_manager));
              app.manage(mobile_sync_state.clone());

              let mobile_trade_engine = MobileTradeEngine::new();
              let mobile_trade_state: Arc<RwLock<MobileTradeEngine>> = Arc::new(RwLock::new(mobile_trade_engine));
              app.manage(mobile_trade_state.clone());

              let widget_manager = WidgetManager::new();
              let widget_state: Arc<RwLock<WidgetManager>> = Arc::new(RwLock::new(widget_manager));
              app.manage(widget_state.clone());

              // Initialize governance manager
              let governance_manager = governance::GovernanceManager::new();
              let governance_state: governance::SharedGovernanceManager = Arc::new(RwLock::new(governance_manager));
              app.manage(governance_state.clone());

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
            
            // Wallet Operations
            wallet_get_token_balances,
            wallet_estimate_fee,
            wallet_send_transaction,
            wallet_generate_qr,
            wallet_generate_solana_pay_qr,
            address_book_add_contact,
            address_book_update_contact,
            address_book_delete_contact,
            address_book_list_contacts,
            address_book_search_contacts,
            address_book_export,
            address_book_import,
            swap_history_add_entry,
            swap_history_get_recent,
            wallet_get_bridge_providers,
            
            // Wallet Performance
            record_trade,
            calculate_wallet_performance,
            get_wallet_performance_data,
            get_performance_score_history,
            get_token_performance_breakdown,
            get_timing_analysis_data,
            get_best_worst_trades_data,
            get_benchmark_comparison_data,
            get_performance_alerts,
            
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
            get_token_sentiment,
            get_all_token_sentiments,
            ingest_social_data,
            get_sentiment_alerts,
            update_sentiment_alert_config,
            get_sentiment_alert_config,
            dismiss_sentiment_alert,
            fetch_social_mentions,
            get_token_risk_score,
            get_risk_history,
            get_latest_risk_score,
            // Launch Predictor
            extract_token_features,
            predict_launch_success,
            get_launch_prediction_history,
            add_launch_training_data,
            retrain_launch_model,
            load_latest_launch_model,
            get_launch_bias_report,
            // AI Assistant
            ai_chat,
            ai_get_conversations,
            ai_delete_conversation,
            ai_get_usage_stats,
            ai_set_api_key,
            ai_is_configured,
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
            get_tax_center_summary,
            update_tax_settings,
            export_tax_center_report,
            calculate_portfolio_analytics,
            get_concentration_alerts,
            get_sector_allocation,
            clear_portfolio_cache,
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
            // AI Portfolio Advisor
            save_risk_profile,
            get_risk_profile,
            generate_portfolio_recommendation,
            get_portfolio_recommendations,
            apply_portfolio_recommendation,
            track_recommendation_performance,
            generate_weekly_portfolio_update,
            get_weekly_portfolio_updates,
            get_performance_history,
            // Alerts & Notifications
            alert_create,
            alert_list,
            alert_get,
            alert_update,
            alert_delete,
            alert_test,
            alert_check_triggers,
            alert_reset_cooldowns,
            smart_alert_create_rule,
            smart_alert_update_rule,
            smart_alert_delete_rule,
            smart_alert_list_rules,
            smart_alert_get_rule,
            smart_alert_dry_run,
            smart_alert_execute,
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
            
            // Auto Trading Engine
            auto_trading_create_strategy,
            auto_trading_update_strategy,
            auto_trading_delete_strategy,
            auto_trading_start_strategy,
            auto_trading_stop_strategy,
            auto_trading_pause_strategy,
            auto_trading_activate_kill_switch,
            auto_trading_deactivate_kill_switch,
            auto_trading_get_strategies,
            auto_trading_get_strategy,
            auto_trading_get_executions,
            auto_trading_apply_parameters,
            
            // Backtesting & Optimization
            backtest_run,
            optimizer_start,
            optimizer_cancel,
            optimizer_get_runs,
            optimizer_get_run,
            
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
            
            // Smart Money & Whale Alerts
            classify_smart_money_wallet,
            get_smart_money_wallets,
            get_smart_money_consensus,
            get_sentiment_comparison,
            get_alert_configs,
            update_alert_config,
            get_recent_whale_alerts,
            scan_wallets_for_smart_money,
            
            // Activity Logging
            security::activity_log::get_activity_logs,
            security::activity_log::export_activity_logs,
            security::activity_log::get_activity_stats,
            security::activity_log::check_suspicious_activity,
            security::activity_log::cleanup_activity_logs,
            security::activity_log::get_activity_retention,
            security::activity_log::set_activity_retention,

            // Smart Contract Security
            security::audit::scan_contract,
            security::audit::get_cached_audit,
            security::audit::clear_audit_cache,
            security::audit::check_risk_threshold,

            // Reputation System
            security::reputation::get_wallet_reputation,
            security::reputation::get_token_reputation,
            security::reputation::update_wallet_behavior,
            security::reputation::initialize_token_reputation,
            security::reputation::update_token_metrics,
            security::reputation::add_vouch,
            security::reputation::remove_vouch,
            security::reputation::get_vouches,
            security::reputation::add_to_blacklist,
            security::reputation::remove_from_blacklist,
            security::reputation::get_blacklist,
            security::reputation::submit_reputation_report,
            security::reputation::get_reputation_history,
            security::reputation::get_reputation_stats,
            security::reputation::get_reputation_settings,
            security::reputation::update_reputation_settings,

            // Academy System
            academy::create_course,
            academy::get_course,
            academy::list_courses,
            academy::create_lesson,
            academy::get_course_lessons,
            academy::create_quiz,
            academy::get_quiz,
            academy::create_challenge,
            academy::list_challenges,
            academy::create_webinar,
            academy::list_webinars,
            academy::create_mentor,
            academy::list_mentors,
            academy::get_content_stats,
            academy::start_course,
            academy::get_user_progress,
            academy::complete_course,
            academy::start_lesson,
            academy::get_lesson_progress,
            academy::update_lesson_progress,
            academy::complete_lesson,
            academy::submit_quiz,
            academy::get_quiz_attempts,
            academy::submit_challenge,
            academy::get_challenge_submissions,
            academy::record_webinar_attendance,
            academy::create_mentor_session,
            academy::get_user_mentor_sessions,
            academy::get_user_stats,
            academy::get_leaderboard,
            academy::create_badge,
            academy::get_badge,
            academy::list_badges,
            academy::award_badge,
            academy::get_user_badges,
            academy::issue_certificate,
            academy::get_user_certificates,
            academy::verify_certificate,
            academy::get_user_rewards,
            academy::claim_reward,
            academy::claim_all_rewards,
            academy::get_reward_stats,

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

            // Market Surveillance & Anomaly Detection
            add_price_data,
            add_transaction_data,
            get_anomalies,
            get_active_anomalies,
            dismiss_anomaly,
            update_anomaly_detection_config,
            get_anomaly_detection_config,
            get_anomaly_statistics,
            generate_mock_anomaly_data,

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

            // Token Flow Intelligence
            token_flow::commands::analyze_token_flows,
            token_flow::commands::export_flow_analysis,
            token_flow::commands::list_cluster_subscriptions,
            token_flow::commands::upsert_cluster_subscription,
            token_flow::commands::remove_cluster_subscription,
            // Holder Analysis & Metadata
            market::holders::get_holder_distribution,
            market::holders::get_holder_trends,
            market::holders::get_large_transfers,
            market::holders::get_token_metadata,
            market::holders::get_verification_status,
            market::holders::export_holder_data,
            market::holders::export_metadata_snapshot,

            // Prediction Markets
            market::get_prediction_markets,
            market::search_prediction_markets,
            market::create_custom_prediction,
            market::get_custom_predictions,
            market::update_custom_prediction,
            market::get_portfolio_comparison,
            market::get_consensus_data,
            market::record_prediction_performance,

            // Indicator & drawing commands
            indicator_save_state,

            indicator_list_presets,
            indicator_save_preset,
            indicator_delete_preset,
            indicator_update_preset,
            indicator_list_alerts,
            indicator_create_alert,
            indicator_delete_alert,
            indicator_update_alert,
            drawing_list,
            drawing_save,
            drawing_sync,
            drawing_list_templates,
            drawing_save_templates,

            // Chain management
            chain_get_active,
            chain_set_active,
            chain_list_chains,
            chain_list_enabled,
            chain_update_config,
            chain_get_balance,
            chain_get_fee_estimate,
            chain_get_status,
            chain_get_cross_chain_portfolio,

            // Bridge integrations
            bridge_get_quote,
            bridge_create_transaction,
            bridge_get_transaction,
            bridge_list_transactions,
            bridge_list_transactions_by_status,
            bridge_update_transaction_status,
            bridge_update_transaction_hash,
            bridge_poll_status,

            // Launchpad commands
            create_launch_config,
            update_launch_config,
            get_launch_config,
            list_launches,
            simulate_token_creation,
            launchpad_create_token,
            check_launch_safety,
            check_vesting_compliance,
            check_liquidity_lock_compliance,
            create_liquidity_lock,
            unlock_liquidity,
            get_liquidity_lock,
            list_liquidity_locks,
            create_vesting_schedule,
            release_vested_tokens,
            get_vesting_schedule,
            list_vesting_schedules,
            create_airdrop,
            activate_airdrop,
            claim_airdrop_tokens,
            get_airdrop,
            get_airdrop_metrics,
            get_distribution_metrics,

            // Stock commands
            stocks::get_trending_stocks,
            stocks::get_top_movers,
            stocks::get_new_ipos,
            stocks::get_earnings_calendar,
            stocks::get_stock_news,
            stocks::get_institutional_holdings,
            stocks::get_insider_activity,
            stocks::create_stock_alert,
            stocks::get_stock_alerts,

            // DeFi commands
            get_solend_reserves,
            get_solend_pools,
            get_solend_positions,
            get_marginfi_banks,
            get_marginfi_positions,
            get_kamino_vaults,
            get_kamino_positions,
            get_kamino_farms,
            get_staking_pools,
            get_staking_positions,
            get_staking_schedule,
            get_yield_farms,
            get_farming_opportunities,
            get_farming_positions,
            get_defi_portfolio_summary,
            get_defi_risk_metrics,
            get_defi_snapshot,
            get_auto_compound_recommendations,
            configure_auto_compound,
            get_auto_compound_config,
            get_compound_history,
            estimate_compound_apy_boost,
            get_governance_proposals,
            vote_on_proposal,
            get_governance_participation,

            // Updater commands
            get_update_settings,
            save_update_settings,
            dismiss_update,
            get_rollback_info,
            rollback_update,
            // Windowing & Multi-monitor commands
            get_monitors,
            create_floating_window,
            close_floating_window,
            set_window_position,
            set_window_size,
            set_window_always_on_top,
            get_window_position,
            get_window_size,
            snap_window_to_edge,
            maximize_window,
            minimize_window,

            // Backup & Settings Management
            backup::service::create_backup,
            backup::service::restore_backup,
            backup::service::list_backups,
            backup::service::delete_backup,
            backup::service::verify_backup_integrity,
            backup::service::export_settings,
            backup::service::import_settings,
            backup::service::reset_settings,
            backup::service::get_settings_template,
            backup::service::get_backup_schedule,
            backup::service::update_backup_schedule,
            backup::service::get_backup_status,
            backup::service::trigger_manual_backup,

            // Universal Settings
            config::commands::get_all_settings,
            config::commands::update_setting,
            config::commands::bulk_update_settings,
            config::commands::reset_settings,
            config::commands::export_settings,
            config::commands::import_settings,
            config::commands::get_setting_schema,
            config::commands::create_settings_profile,
            config::commands::load_settings_profile,
            config::commands::delete_settings_profile,
            config::commands::list_settings_profiles,
            config::commands::get_settings_change_history,
            config::commands::get_settings_template,

            // System Tray
            get_tray_settings,
            update_tray_settings,
            update_tray_stats,
            update_tray_badge,
            minimize_to_tray,
            restore_from_tray,

            // Auto-start
            get_auto_start_settings,
            update_auto_start_settings,
            check_auto_start_enabled,
            enable_auto_start,
            disable_auto_start,

            // Historical Replay
            historical_fetch_dataset,
            historical_fetch_orderbooks,
            historical_run_simulation,
            historical_compute_counterfactual,
            historical_get_cache_stats,
            historical_clear_old_data,
            historical_set_api_key,

            // Voice Interaction
            voice_request_permissions,
            voice_revoke_permissions,
            voice_start_microphone,
            voice_stop_microphone,
            voice_get_audio_status,
            voice_start_wake_word,
            voice_stop_wake_word,
            voice_get_wake_word_config,
            voice_update_wake_word_config,
            voice_process_audio_for_wake_word,
            voice_start_recognition,
            voice_stop_recognition,
            voice_get_stt_config,
            voice_update_stt_config,
            voice_get_supported_languages,
            voice_set_stt_language,
            voice_simulate_transcription,
            voice_speak,
            voice_stop_speaking,
            voice_pause_speaking,
            voice_resume_speaking,
            voice_get_tts_status,
            voice_get_tts_config,
            voice_update_tts_config,
            voice_get_available_voices,
            voice_set_voice,
            voice_set_rate,
            voice_set_pitch,
            voice_set_volume,

            // AI Chat
            ai_chat_message,
            ai_chat_message_stream,
            ai_submit_feedback,
            ai_execute_quick_action,
            ai_optimize_portfolio,
            ai_apply_optimization,
            ai_get_pattern_warnings,
            ai_dismiss_pattern_warning,

            // Voice Trading
            execute_voice_trade,
            get_portfolio_data,
            get_current_price,
            create_price_alert,
            list_alerts,
            get_market_summary,
            synthesize_speech,
            validate_voice_mfa,
            check_voice_permission,
            get_voice_capabilities,

            // Safety Mode Engine
            check_trade_safety,
            approve_trade,
            get_safety_policy,
            update_safety_policy,
            get_cooldown_status,
            reset_daily_limits,
            get_insurance_quote,
            select_insurance,
            list_insurance_providers,

            // Theme Engine
            theme_get_presets,
            theme_get_settings,
            theme_update_settings,
            theme_save_custom,
            theme_delete_custom,
            theme_export,
            theme_import,
            theme_get_os_preference,

            // Mobile companion commands
            mobile_register_device,
            mobile_create_biometric_challenge,
            mobile_verify_biometric,
            mobile_authenticate_session,
            mobile_revoke_session,
            mobile_update_push_token,
            mobile_get_devices,
            mobile_remove_device,
            mobile_queue_notification,
            mobile_get_pending_notifications,
            mobile_dequeue_notification,
            mobile_sync_data,
            mobile_get_last_sync,
            mobile_get_cached_sync_data,
            mobile_execute_quick_trade,
            mobile_safety_checks,
            mobile_get_widget_data,
            mobile_get_all_widgets,

            // Collaborative Rooms
            collab::commands::collab_create_room,
            collab::commands::collab_list_rooms,
            collab::commands::collab_get_room,
            collab::commands::collab_delete_room,
            collab::commands::collab_join_room,
            collab::commands::collab_leave_room,
            collab::commands::collab_get_participants,
            collab::commands::collab_update_permissions,
            collab::commands::collab_send_message,
            collab::commands::collab_get_messages,
            collab::commands::collab_share_watchlist,
            collab::commands::collab_get_watchlists,
            collab::commands::collab_share_order,
            collab::commands::collab_get_orders,
            collab::commands::collab_update_order,
            collab::commands::collab_share_strategy,
            collab::commands::collab_send_webrtc_signal,
            collab::commands::collab_get_webrtc_signals,
            collab::commands::collab_moderate_user,
            collab::commands::collab_get_room_state,
            collab::commands::collab_set_competition,
            collab::commands::collab_get_competition,
            collab::commands::collab_update_leaderboard,

            // Diagnostics & Troubleshooter
            diagnostics::tauri_commands::run_diagnostics,
            diagnostics::tauri_commands::get_health_report,
            diagnostics::tauri_commands::auto_repair_issue,
            diagnostics::tauri_commands::auto_repair,
            diagnostics::tauri_commands::verify_integrity,
            diagnostics::tauri_commands::manual_repair,
            diagnostics::tauri_commands::download_missing,
            diagnostics::tauri_commands::restore_defaults,
            diagnostics::tauri_commands::get_repair_history,
            diagnostics::tauri_commands::get_diagnostics_settings,
            diagnostics::tauri_commands::save_diagnostics_settings,
            diagnostics::tauri_commands::backup_before_repair,
            diagnostics::tauri_commands::rollback_repair,
            diagnostics::tauri_commands::export_diagnostics_report,

            // Governance
            sync_governance_memberships,
            get_governance_memberships,
            sync_governance_proposals,
            get_governance_proposals,
            get_all_active_governance_proposals,
            get_wallet_voting_power,
            submit_signed_vote,
            delegate_governance_votes,
            revoke_governance_delegation,
            get_governance_delegations,
            analyze_governance_proposal,
            create_governance_reminder,
            get_governance_summary,
            get_governance_deadlines,
            prepare_vote_signature,
            verify_vote_signature,
            prepare_vote_transaction,

            // Dev Tools
            compile_now,
            get_build_status,
            get_compile_errors,
            auto_fix_errors,
            get_fix_stats,
            get_fix_attempts,
            clear_fix_history,
            get_logs,
            clear_logs,
            export_logs,
            log_message,
            get_logger_config,
            set_logger_config,
            get_performance_metrics,
            get_error_stats,
            report_crash,
            get_crash_report,
            list_crash_reports,
            force_gc,
            restart_service,
            get_dev_settings,
            update_dev_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
