use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CacheEntry {
    pub key: String,
    pub data: serde_json::Value,
    pub timestamp: u64,
    pub access_count: u64,
    pub last_accessed: u64,
    pub size_bytes: usize,
    pub cache_type: CacheType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum CacheType {
    TokenPrice,
    TokenInfo,
    MarketData,
    TopCoins,
    TrendingCoins,
    UserData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CacheStatistics {
    pub total_hits: u64,
    pub total_misses: u64,
    pub hit_rate: f64,
    pub total_evictions: u64,
    pub total_entries: usize,
    pub total_size_bytes: usize,
    pub per_type_stats: HashMap<String, TypeStatistics>,
    pub last_warmed: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypeStatistics {
    pub hits: u64,
    pub misses: u64,
    pub hit_rate: f64,
    pub entries: usize,
    pub size_bytes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarmProgress {
    pub total: usize,
    pub completed: usize,
    pub percentage: f64,
    pub current_key: Option<String>,
}

pub struct CacheManager {
    cache: Arc<RwLock<HashMap<String, CacheEntry>>>,
    stats: Arc<RwLock<CacheStatistics>>,
    max_size_mb: usize,
    max_entries: usize,
}

impl CacheManager {
    pub fn new(max_size_mb: usize, max_entries: usize) -> Self {
        Self {
            cache: Arc::new(RwLock::new(HashMap::new())),
            stats: Arc::new(RwLock::new(CacheStatistics {
                total_hits: 0,
                total_misses: 0,
                hit_rate: 0.0,
                total_evictions: 0,
                total_entries: 0,
                total_size_bytes: 0,
                per_type_stats: HashMap::new(),
                last_warmed: None,
            })),
            max_size_mb,
            max_entries,
        }
    }

    pub async fn get(&self, key: &str, cache_type: CacheType) -> Option<serde_json::Value> {
        let mut cache = self.cache.write().await;
        let mut stats = self.stats.write().await;

        if let Some(entry) = cache.get_mut(key) {
            // Update access statistics
            entry.access_count += 1;
            entry.last_accessed = Self::current_timestamp();

            // Update global stats
            stats.total_hits += 1;

            // Update per-type stats
            let type_key = format!("{:?}", cache_type);
            let type_stats = stats.per_type_stats.entry(type_key).or_insert(TypeStatistics {
                hits: 0,
                misses: 0,
                hit_rate: 0.0,
                entries: 0,
                size_bytes: 0,
            });
            type_stats.hits += 1;
            type_stats.hit_rate = type_stats.hits as f64 / (type_stats.hits + type_stats.misses) as f64;

            // Update global hit rate
            stats.hit_rate = stats.total_hits as f64 / (stats.total_hits + stats.total_misses) as f64;

            return Some(entry.data.clone());
        }

        // Cache miss
        stats.total_misses += 1;
        let type_key = format!("{:?}", cache_type);
        let type_stats = stats.per_type_stats.entry(type_key).or_insert(TypeStatistics {
            hits: 0,
            misses: 0,
            hit_rate: 0.0,
            entries: 0,
            size_bytes: 0,
        });
        type_stats.misses += 1;
        if type_stats.hits + type_stats.misses > 0 {
            type_stats.hit_rate = type_stats.hits as f64 / (type_stats.hits + type_stats.misses) as f64;
        }

        // Update global hit rate
        if stats.total_hits + stats.total_misses > 0 {
            stats.hit_rate = stats.total_hits as f64 / (stats.total_hits + stats.total_misses) as f64;
        }

        None
    }

    pub async fn set(&self, key: String, data: serde_json::Value, cache_type: CacheType) -> Result<(), String> {
        let mut cache = self.cache.write().await;
        let mut stats = self.stats.write().await;

        let size_bytes = serde_json::to_vec(&data).map_err(|e| e.to_string())?.len();
        let current_time = Self::current_timestamp();

        // Check if we need to evict entries
        let max_size_bytes = self.max_size_mb * 1024 * 1024;
        if stats.total_size_bytes + size_bytes > max_size_bytes || cache.len() >= self.max_entries {
            self.evict_lru(&mut cache, &mut stats).await;
        }

        let entry = CacheEntry {
            key: key.clone(),
            data,
            timestamp: current_time,
            access_count: 0,
            last_accessed: current_time,
            size_bytes,
            cache_type: cache_type.clone(),
        };

        // If key exists, subtract old size from stats
        if let Some(old_entry) = cache.get(&key) {
            stats.total_size_bytes -= old_entry.size_bytes;
            
            let type_key = format!("{:?}", old_entry.cache_type);
            if let Some(type_stats) = stats.per_type_stats.get_mut(&type_key) {
                type_stats.size_bytes -= old_entry.size_bytes;
                type_stats.entries -= 1;
            }
        }

        cache.insert(key, entry);

        // Update stats
        stats.total_entries = cache.len();
        stats.total_size_bytes += size_bytes;

        let type_key = format!("{:?}", cache_type);
        let type_stats = stats.per_type_stats.entry(type_key).or_insert(TypeStatistics {
            hits: 0,
            misses: 0,
            hit_rate: 0.0,
            entries: 0,
            size_bytes: 0,
        });
        type_stats.entries += 1;
        type_stats.size_bytes += size_bytes;

        Ok(())
    }

    async fn evict_lru(&self, cache: &mut HashMap<String, CacheEntry>, stats: &mut CacheStatistics) {
        // Find the least recently used entry
        if let Some((lru_key, lru_entry)) = cache.iter()
            .min_by_key(|(_, entry)| entry.last_accessed)
            .map(|(k, e)| (k.clone(), e.clone()))
        {
            cache.remove(&lru_key);
            stats.total_evictions += 1;
            stats.total_size_bytes -= lru_entry.size_bytes;

            let type_key = format!("{:?}", lru_entry.cache_type);
            if let Some(type_stats) = stats.per_type_stats.get_mut(&type_key) {
                type_stats.entries = type_stats.entries.saturating_sub(1);
                type_stats.size_bytes = type_stats.size_bytes.saturating_sub(lru_entry.size_bytes);
            }
        }
    }

    pub async fn get_statistics(&self) -> CacheStatistics {
        let stats = self.stats.read().await;
        stats.clone()
    }

    pub async fn clear(&self) {
        let mut cache = self.cache.write().await;
        let mut stats = self.stats.write().await;
        
        cache.clear();
        stats.total_entries = 0;
        stats.total_size_bytes = 0;
        for type_stats in stats.per_type_stats.values_mut() {
            type_stats.entries = 0;
            type_stats.size_bytes = 0;
        }
    }

    pub async fn get_top_accessed_keys(&self, limit: usize) -> Vec<String> {
        let cache = self.cache.read().await;
        let mut entries: Vec<_> = cache.values().collect();
        entries.sort_by(|a, b| b.access_count.cmp(&a.access_count));
        entries.iter().take(limit).map(|e| e.key.clone()).collect()
    }

    pub async fn warm_cache<F, Fut>(&self, keys: Vec<String>, fetcher: F) -> Result<WarmProgress, String>
    where
        F: Fn(String) -> Fut,
        Fut: std::future::Future<Output = Result<(serde_json::Value, CacheType), String>>,
    {
        let total = keys.len();
        let mut completed = 0;

        for key in keys {
            match fetcher(key.clone()).await {
                Ok((data, cache_type)) => {
                    self.set(key.clone(), data, cache_type).await?;
                    completed += 1;
                }
                Err(e) => {
                    eprintln!("Failed to fetch key {}: {}", key, e);
                }
            }
        }

        let mut stats = self.stats.write().await;
        stats.last_warmed = Some(Self::current_timestamp());

        Ok(WarmProgress {
            total,
            completed,
            percentage: (completed as f64 / total as f64) * 100.0,
            current_key: None,
        })
    }

    fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }
}

pub type SharedCacheManager = Arc<RwLock<CacheManager>>;
