mod ai;
mod api;
mod auth;
mod market;
mod security;
mod sentiment;
mod wallet;
mod websocket_handler;

pub use ai::*;
pub use api::*;
pub use auth::*;
pub use market::*;
pub use sentiment::*;
pub use wallet::hardware_wallet::*;
pub use wallet::phantom::*;
pub use wallet::multisig::*;
pub use security::activity_log::*;
pub use websocket_handler::*;

use wallet::hardware_wallet::HardwareWalletState;
use wallet::phantom::{hydrate_wallet_state, WalletState};
use wallet::multisig::MultisigDB;
use security::keystore::Keystore;
use security::activity_log::ActivityLogDB;
use auth::session_manager::SessionManager;
use auth::two_factor::TwoFactorManager;
use std::error::Error;

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

            app.manage(keystore);
            app.manage(session_manager);
            app.manage(two_factor_manager);

            match tauri::async_runtime::block_on(MultisigDB::initialize(&app.handle())) {
                Ok(db) => app.manage(db),
                Err(e) => eprintln!("Failed to initialize multisig database: {e}"),
            }

            match tauri::async_runtime::block_on(ActivityLogDB::initialize(&app.handle())) {
                Ok(db) => app.manage(db),
                Err(e) => eprintln!("Failed to initialize activity log database: {e}"),
            }

            let cleanup_handle = app.handle();
            if let Some(activity_db) = cleanup_handle.try_state::<ActivityLogDB>() {
                if let Err(err) = tauri::async_runtime::block_on(activity_db.cleanup_old_logs()) {
                    eprintln!("Failed to cleanup old activity logs: {err}");
                }
            }

            tauri::async_runtime::spawn(async move {
                use tokio::time::{sleep, Duration};

                loop {
                    sleep(Duration::from_secs(24 * 60 * 60)).await;
                    if let Some(activity_db) = cleanup_handle.try_state::<ActivityLogDB>() {
                        if let Err(err) = activity_db.cleanup_old_logs().await {
                            eprintln!("Failed to cleanup old activity logs: {err}");
                        }
                    }
                }
            });

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
            
            // WebSocket
            start_price_stream,
            stop_price_stream,
            
            // Jupiter v6
            jupiter_quote,
            jupiter_swap,

            // Multisig
            create_multisig_wallet,
            list_multisig_wallets,
            get_multisig_wallet,
            create_proposal,
            list_proposals,
            get_proposal,
            sign_proposal,
            get_proposal_signatures,
            get_proposal_status,
            execute_proposal,
            cancel_proposal,

            // Activity Logging
            log_wallet_activity,
            get_activity_logs,
            get_activity_stats,
            check_suspicious_activity,
            export_activity_logs,
            cleanup_old_activity_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}