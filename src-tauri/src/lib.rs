mod ai;
mod auth;
mod market;
mod sentiment;
mod wallet;
mod websocket_handler;

pub use ai::*;
pub use auth::*;
pub use market::*;
pub use sentiment::*;
pub use wallet::phantom::*;
pub use websocket_handler::*;

use wallet::phantom::{hydrate_wallet_state, WalletState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(WalletState::new())
        .setup(|app| {
            if let Err(e) = hydrate_wallet_state(&app.handle()) {
                eprintln!("Failed to hydrate wallet state: {e}");
            }
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
            
            // Auth (deprecated)
            connect_phantom,
            
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}