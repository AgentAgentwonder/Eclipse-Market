use super::cache_manager::*;
use tauri::State;

#[tauri::command]
pub async fn get_cache_stats(
    cache: State<'_, SharedCacheManager>,
) -> Result<CacheStatistics, String> {
    Ok(cache.statistics().await)
}

#[tauri::command]
pub async fn get_cache_warming_progress(
    cache: State<'_, SharedCacheManager>,
) -> Result<CacheWarmingProgress, String> {
    Ok(cache.warming_progress().await)
}

#[tauri::command]
pub async fn clear_cache(
    cache: State<'_, SharedCacheManager>,
    cache_type: String,
) -> Result<(), String> {
    let ct = CacheType::from_str(&cache_type)
        .ok_or_else(|| format!("Invalid cache type: {}", cache_type))?;
    
    cache.clear_cache_type(ct).await
}

#[tauri::command]
pub async fn clear_all_caches(
    cache: State<'_, SharedCacheManager>,
) -> Result<(), String> {
    cache.clear_all().await
}

#[tauri::command]
pub async fn warm_cache(
    cache: State<'_, SharedCacheManager>,
    requests: Vec<WarmRequest>,
) -> Result<(), String> {
    cache.warm_cache(requests).await
}

#[tauri::command]
pub async fn update_cache_ttl(
    cache: State<'_, SharedCacheManager>,
    config: CacheTTLConfig,
) -> Result<(), String> {
    cache.update_ttl_config(config).await
}

#[tauri::command]
pub async fn get_cache_ttl_config(
    cache: State<'_, SharedCacheManager>,
) -> Result<CacheTTLConfig, String> {
    Ok(cache.ttl_config().await)
}
