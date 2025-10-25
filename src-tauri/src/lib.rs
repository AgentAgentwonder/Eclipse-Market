mod auth;
mod db;
mod jupiter;
mod realtime;
mod automation;
mod ai;
mod sentiment;

pub use auth::*;
pub use db::*;
pub use jupiter::*;
pub use realtime::*;
pub use automation::*;
pub use ai::*;
pub use sentiment::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| Ok(()))
        .invoke_handler(tauri::generate_handler![
            connect_phantom,
            quote_swap,
            subscribe_price_feed,
            create_automation,
            assess_risk,
            analyze_text_sentiment,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}