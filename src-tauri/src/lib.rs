#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  use tauri::generate_handler;
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        analyze_sentiment,
        analyze_risk,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

use tauri_plugin_log::Target as LogTarget;

pub mod auth;
pub mod db;
pub mod jupiter;
pub mod realtime;
pub mod ai;
pub mod sentiment;
pub mod integrations;
pub mod automation;

#[tauri::command]
fn analyze_sentiment(text: String) -> crate::sentiment::SentimentResult {
    crate::sentiment::analyze_sentiment(text)
}

#[tauri::command]
async fn analyze_risk(
    win_rate: f32,
    total_volume: f32,
    trades_last_7d: u32,
    consistent_profits: bool,
) -> Result<crate::ai::RiskScore, String> {
    let metrics = crate::ai::WalletMetrics {
        win_rate,
        total_volume,
        trades_last_7d,
        consistent_profits,
    };
    
    let analyzer = crate::ai::RiskAnalyzer::new();
    Ok(analyzer.basic_risk_score(&metrics))
}
