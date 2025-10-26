mod auth;
mod ai;
mod sentiment;
mod market;
mod websocket_handler;

pub use auth::*;
pub use ai::*;
pub use sentiment::*;
pub use market::*;
pub use websocket_handler::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
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