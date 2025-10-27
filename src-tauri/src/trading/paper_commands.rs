use super::paper_trading::{
    LeaderboardEntry, PaperAccount, PaperBalance, PaperPosition, PaperTrade, PaperTradingConfig,
    PaperTradingEngine, SharedPaperTradingEngine,
};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use tokio::sync::{OnceCell, RwLock};

static PAPER_ENGINE: OnceCell<SharedPaperTradingEngine> = OnceCell::const_new();

async fn get_engine(handle: &AppHandle) -> Result<SharedPaperTradingEngine, String> {
    if let Some(engine) = PAPER_ENGINE.get() {
        return Ok(engine.clone());
    }

    let app_dir = handle
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Failed to resolve app data directory".to_string())?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    let mut db_path = PathBuf::from(app_dir);
    db_path.push("paper_trading.db");

    let engine = PaperTradingEngine::new(db_path)
        .await
        .map_err(|e| format!("Failed to initialize paper trading engine: {}", e))?;

    let shared = Arc::new(RwLock::new(engine));
    PAPER_ENGINE
        .set(shared.clone())
        .map_err(|_| "Paper trading engine already initialized".to_string())?;

    Ok(shared)
}

#[tauri::command]
pub async fn paper_get_status(handle: AppHandle) -> Result<bool, String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.is_enabled().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn paper_set_enabled(handle: AppHandle, enabled: bool) -> Result<(), String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.set_enabled(enabled).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn paper_get_account(handle: AppHandle) -> Result<PaperAccount, String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.get_account().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn paper_get_balances(handle: AppHandle) -> Result<Vec<PaperBalance>, String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.get_balances().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn paper_get_balance(handle: AppHandle, currency: String) -> Result<f64, String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.get_balance(&currency).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn paper_execute_trade(
    handle: AppHandle,
    trade_type: String,
    input_symbol: String,
    output_symbol: String,
    input_amount: f64,
    expected_output_amount: f64,
    order_id: Option<String>,
) -> Result<PaperTrade, String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.execute_trade(
        &trade_type,
        &input_symbol,
        &output_symbol,
        input_amount,
        expected_output_amount,
        order_id,
    )
    .await
}

#[tauri::command]
pub async fn paper_get_positions(handle: AppHandle) -> Result<Vec<PaperPosition>, String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.get_positions().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn paper_get_trade_history(
    handle: AppHandle,
    limit: Option<usize>,
) -> Result<Vec<PaperTrade>, String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.get_trade_history(limit.unwrap_or(100))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn paper_reset_account(
    handle: AppHandle,
    initial_balance: f64,
) -> Result<(), String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.reset_account(initial_balance)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn paper_update_config(
    handle: AppHandle,
    config: PaperTradingConfig,
) -> Result<(), String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.update_config(config).await
}

#[tauri::command]
pub async fn paper_get_config(handle: AppHandle) -> Result<PaperTradingConfig, String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    Ok(eng.get_config().await)
}

#[tauri::command]
pub async fn paper_update_price(handle: AppHandle, symbol: String, price: f64) -> Result<(), String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.update_price(&symbol, price).await;
    Ok(())
}

#[tauri::command]
pub async fn paper_submit_to_leaderboard(
    handle: AppHandle,
    user_id: String,
    username: String,
) -> Result<(), String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.submit_to_leaderboard(&user_id, &username)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn paper_get_leaderboard(
    handle: AppHandle,
    limit: Option<usize>,
) -> Result<Vec<LeaderboardEntry>, String> {
    let engine = get_engine(&handle).await?;
    let eng = engine.read().await;
    eng.get_leaderboard(limit.unwrap_or(100))
        .await
        .map_err(|e| e.to_string())
}
