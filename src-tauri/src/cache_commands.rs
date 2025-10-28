use crate::core::cache_manager::{CacheManager, CacheStatistics, CacheType, SharedCacheManager, WarmProgress};
use serde_json::json;
use tauri::State;

#[tauri::command]
pub async fn get_cache_statistics(
    cache_manager: State<'_, SharedCacheManager>,
) -> Result<CacheStatistics, String> {
    let manager = cache_manager.read().await;
    Ok(manager.get_statistics().await)
}

#[tauri::command]
pub async fn clear_cache(
    cache_manager: State<'_, SharedCacheManager>,
) -> Result<(), String> {
    let manager = cache_manager.read().await;
    manager.clear().await;
    Ok(())
}

#[tauri::command]
pub async fn warm_cache(
    cache_manager: State<'_, SharedCacheManager>,
    keys: Vec<String>,
) -> Result<WarmProgress, String> {
    let manager = cache_manager.read().await;
    
    // Define a simple fetcher that returns mock data for now
    // In a real implementation, this would fetch actual data
    let result = manager.warm_cache(keys, |key| async move {
        // Determine cache type based on key prefix
        let cache_type = if key.starts_with("token_price_") {
            CacheType::TokenPrice
        } else if key.starts_with("token_info_") {
            CacheType::TokenInfo
        } else if key.starts_with("market_") {
            CacheType::MarketData
        } else if key.starts_with("top_") {
            CacheType::TopCoins
        } else if key.starts_with("trending_") {
            CacheType::TrendingCoins
        } else {
            CacheType::UserData
        };

        // Return mock data for now
        Ok((json!({ "key": key, "timestamp": chrono::Utc::now().timestamp() }), cache_type))
    }).await?;

    Ok(result)
}

#[tauri::command]
pub async fn get_cache_item(
    cache_manager: State<'_, SharedCacheManager>,
    key: String,
    cache_type_str: String,
) -> Result<Option<serde_json::Value>, String> {
    let cache_type = match cache_type_str.as_str() {
        "TokenPrice" => CacheType::TokenPrice,
        "TokenInfo" => CacheType::TokenInfo,
        "MarketData" => CacheType::MarketData,
        "TopCoins" => CacheType::TopCoins,
        "TrendingCoins" => CacheType::TrendingCoins,
        "UserData" => CacheType::UserData,
        _ => return Err("Invalid cache type".to_string()),
    };

    let manager = cache_manager.read().await;
    Ok(manager.get(&key, cache_type).await)
}

#[tauri::command]
pub async fn set_cache_item(
    cache_manager: State<'_, SharedCacheManager>,
    key: String,
    data: serde_json::Value,
    cache_type_str: String,
) -> Result<(), String> {
    let cache_type = match cache_type_str.as_str() {
        "TokenPrice" => CacheType::TokenPrice,
        "TokenInfo" => CacheType::TokenInfo,
        "MarketData" => CacheType::MarketData,
        "TopCoins" => CacheType::TopCoins,
        "TrendingCoins" => CacheType::TrendingCoins,
        "UserData" => CacheType::UserData,
        _ => return Err("Invalid cache type".to_string()),
    };

    let manager = cache_manager.read().await;
    manager.set(key, data, cache_type).await
}
