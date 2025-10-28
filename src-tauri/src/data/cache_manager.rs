use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use moka::future::Cache;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sled::Tree;
use tokio::sync::RwLock;

const DEFAULT_MAX_ENTRIES: u64 = 10_000;
const DEFAULT_MAX_BYTES: u64 = 100 * 1024 * 1024;
const DEFAULT_TTL_CONFIG_JSON: &str = include_str!("../../config/cache_ttl.json");

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum CacheType {
    Price,
    TokenMetadata,
    Historical,
    UserSettings,
}

impl CacheType {
    pub const ALL: [CacheType; 4] = [
        CacheType::Price,
        CacheType::TokenMetadata,
        CacheType::Historical,
        CacheType::UserSettings,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            CacheType::Price => "price",
            CacheType::TokenMetadata => "token_metadata",
            CacheType::Historical => "historical",
            CacheType::UserSettings => "user_settings",
        }
    }

    pub fn from_str(value: &str) -> Option<Self> {
        match value {
            "price" => Some(CacheType::Price),
            "token_metadata" => Some(CacheType::TokenMetadata),
            "historical" => Some(CacheType::Historical),
            "user_settings" => Some(CacheType::UserSettings),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct CacheTTLConfig {
    pub price: Option<u64>,
    pub token_metadata: Option<u64>,
    pub historical: Option<u64>,
    pub user_settings: Option<u64>,
}

impl Default for CacheTTLConfig {
    fn default() -> Self {
        serde_json::from_str(DEFAULT_TTL_CONFIG_JSON).unwrap_or(Self {
            price: Some(1),
            token_metadata: Some(3600),
            historical: Some(86_400),
            user_settings: None,
        })
    }
}

impl CacheTTLConfig {
    pub fn ttl_for(&self, cache_type: CacheType) -> Option<Duration> {
        let seconds = match cache_type {
            CacheType::Price => self.price,
            CacheType::TokenMetadata => self.token_metadata,
            CacheType::Historical => self.historical,
            CacheType::UserSettings => self.user_settings,
        };

        seconds.map(Duration::from_secs)
    }
}

#[derive(Default)]
struct CacheTypeStats {
    hits: AtomicU64,
    misses: AtomicU64,
    evictions: AtomicU64,
    bytes: AtomicU64,
}

impl CacheTypeStats {
    fn reset(&self) {
        self.hits.store(0, Ordering::Relaxed);
        self.misses.store(0, Ordering::Relaxed);
        self.evictions.store(0, Ordering::Relaxed);
        self.bytes.store(0, Ordering::Relaxed);
    }
}

#[derive(Clone)]
struct CacheValue {
    data: Arc<Vec<u8>>,
    size: u64,
}

impl CacheValue {
    fn new(bytes: Vec<u8>) -> Self {
        let size = bytes.len() as u64;
        Self {
            data: Arc::new(bytes),
            size,
        }
    }
}

#[derive(Serialize, Deserialize)]
struct DiskRecord {
    value: Vec<u8>,
    expires_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CacheTypeSummary {
    #[serde(rename = "type")]
    pub cache_type: String,
    pub hits: u64,
    pub misses: u64,
    pub hit_rate: f64,
    pub evictions: u64,
    pub entries: u64,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CacheWarmingProgress {
    pub started_at: Option<u64>,
    pub completed_at: Option<u64>,
    pub total_items: usize,
    pub processed_items: usize,
    pub in_progress: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CacheStatistics {
    pub total_entries: u64,
    pub total_size_bytes: u64,
    pub total_hits: u64,
    pub total_misses: u64,
    pub total_hit_rate: f64,
    pub total_evictions: u64,
    pub per_type: Vec<CacheTypeSummary>,
    pub warming: CacheWarmingProgress,
    pub ttl_config: CacheTTLConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarmRequest {
    pub key: String,
    #[serde(rename = "type")]
    pub cache_type: CacheType,
    #[serde(default)]
    pub value: Option<Value>,
}

struct CacheLayer {
    cache: Cache<String, Arc<CacheValue>>,
    disk_tree: Option<Tree>,
    stats: Arc<CacheTypeStats>,
    keys: Arc<Mutex<HashSet<String>>>,
    sizes: Arc<Mutex<HashMap<String, u64>>>,
}

impl CacheLayer {
    fn new(cache_type: CacheType, max_entries: u64, max_bytes: u64, disk_tree: Option<Tree>) -> Self {
        let stats = Arc::new(CacheTypeStats::default());
        let keys = Arc::new(Mutex::new(HashSet::new()));
        let sizes = Arc::new(Mutex::new(HashMap::new()));

        let stats_for_eviction = stats.clone();
        let keys_for_eviction = keys.clone();
        let sizes_for_eviction = sizes.clone();

        let cache = Cache::builder()
            .max_capacity(max_entries)
            .max_weight(max_bytes)
            .weigher(|_, value: &Arc<CacheValue>| {
                let size = value.size.min(u32::MAX as u64) as u32;
                size.max(1)
            })
            .eviction_listener(move |key, value, _cause| {
                stats_for_eviction.evictions.fetch_add(1, Ordering::Relaxed);

                let removed = value.size;
                saturating_sub_atomic(&stats_for_eviction.bytes, removed);

                if let Ok(mut guard) = keys_for_eviction.lock() {
                    guard.remove(key);
                }

                if let Ok(mut guard) = sizes_for_eviction.lock() {
                    guard.remove(key);
                }
            })
            .build();

        // Warm caches should respect per-type characteristics.
        // To avoid unused variable warning for cache_type when L2 disabled.
        let _ = cache_type;

        Self {
            cache,
            disk_tree,
            stats,
            keys,
            sizes,
        }
    }

    async fn insert(&self, key: &str, value: Arc<CacheValue>, ttl: Option<Duration>) {
        let cache_key = key.to_string();

        if let Some(ttl) = ttl {
            self.cache
                .insert_with_ttl(cache_key.clone(), value.clone(), ttl)
                .await;
        } else {
            self.cache.insert(cache_key.clone(), value.clone()).await;
        }

        if let Ok(mut guard) = self.keys.lock() {
            guard.insert(cache_key.clone());
        }

        let mut delta: i128 = value.size as i128;
        if let Ok(mut guard) = self.sizes.lock() {
            if let Some(previous) = guard.insert(cache_key, value.size) {
                delta = value.size as i128 - previous as i128;
            }
        }

        if delta > 0 {
            self.stats
                .bytes
                .fetch_add(delta as u64, Ordering::Relaxed);
        } else if delta < 0 {
            self.stats
                .bytes
                .fetch_sub((-delta) as u64, Ordering::Relaxed);
        }
    }

    async fn get(&self, key: &str) -> Option<Arc<CacheValue>> {
        self.cache.get(key).await
    }

    async fn invalidate(&self, key: &str) {
        let removed_bytes = if let Ok(mut guard) = self.sizes.lock() {
            guard.remove(key).unwrap_or(0)
        } else {
            0
        };

        if removed_bytes > 0 {
            saturating_sub_atomic(&self.stats.bytes, removed_bytes);
        }

        if let Ok(mut guard) = self.keys.lock() {
            guard.remove(key);
        }

        self.cache.invalidate(key.to_string()).await;

        if let Some(tree) = &self.disk_tree {
            let tree_clone = tree.clone();
            let key_bytes = key.as_bytes().to_vec();
            let _ = tokio::task::spawn_blocking(move || tree_clone.remove(key_bytes)).await;
        }
    }

    async fn clear(&self) {
        self.cache.invalidate_all().await;

        if let Ok(mut guard) = self.keys.lock() {
            guard.clear();
        }

        if let Ok(mut guard) = self.sizes.lock() {
            guard.clear();
        }

        self.stats.reset();

        if let Some(tree) = &self.disk_tree {
            let tree_clone = tree.clone();
            let _ = tokio::task::spawn_blocking(move || tree_clone.clear()).await;
        }
    }

    fn entry_count(&self) -> u64 {
        self.cache.entry_count()
    }

    fn snapshot(&self, cache_type: CacheType) -> CacheTypeSummary {
        let hits = self.stats.hits.load(Ordering::Relaxed);
        let misses = self.stats.misses.load(Ordering::Relaxed);
        let evictions = self.stats.evictions.load(Ordering::Relaxed);
        let size_bytes = self.stats.bytes.load(Ordering::Relaxed);
        let entries = self.entry_count();
        let total = hits + misses;
        let hit_rate = if total > 0 {
            (hits as f64 / total as f64) * 100.0
        } else {
            0.0
        };

        CacheTypeSummary {
            cache_type: cache_type.as_str().to_string(),
            hits,
            misses,
            hit_rate,
            evictions,
            entries,
            size_bytes,
        }
    }

    fn disk_tree(&self) -> Option<Tree> {
        self.disk_tree.as_ref().cloned()
    }

    fn keys_with_prefix(&self, prefix: &str) -> Vec<String> {
        if let Ok(guard) = self.keys.lock() {
            guard
                .iter()
                .filter(|key| key.starts_with(prefix))
                .cloned()
                .collect()
        } else {
            Vec::new()
        }
    }
}

pub struct CacheManager {
    layers: HashMap<CacheType, CacheLayer>,
    ttl_config: RwLock<CacheTTLConfig>,
    ttl_config_path: PathBuf,
    warming_state: RwLock<CacheWarmingProgress>,
    usage_counts: RwLock<HashMap<CacheType, HashMap<String, u64>>>,
}

impl CacheManager {
    pub fn new(
        app_handle: &tauri::AppHandle,
        max_entries: u64,
        max_bytes: u64,
        enable_l2: bool,
    ) -> Result<Self, String> {
        let mut cache_dir = app_handle
            .path_resolver()
            .app_data_dir()
            .ok_or_else(|| "Unable to resolve app data directory".to_string())?;
        cache_dir.push("cache");

        std::fs::create_dir_all(&cache_dir)
            .map_err(|e| format!("Failed to create cache directory: {e}"))?;

        let ttl_config_path = cache_dir.join("cache_ttl.json");
        let ttl_config = load_or_initialize_config(&ttl_config_path)?;

        let mut sled_db = if enable_l2 {
            let db_path = cache_dir.join("disk_layer");
            Some(
                sled::open(&db_path)
                    .map_err(|e| format!("Failed to open disk cache at {:?}: {e}", db_path))?,
            )
        } else {
            None
        };

        let mut layers = HashMap::new();

        for cache_type in CacheType::ALL.iter().copied() {
            let tree = match &mut sled_db {
                Some(db) => Some(
                    db.open_tree(cache_type.as_str())
                        .map_err(|e| format!("Failed to open disk tree for {}: {e}", cache_type.as_str()))?,
                ),
                None => None,
            };

            layers.insert(
                cache_type,
                CacheLayer::new(
                    cache_type,
                    if max_entries == 0 { DEFAULT_MAX_ENTRIES } else { max_entries },
                    if max_bytes == 0 { DEFAULT_MAX_BYTES } else { max_bytes },
                    tree,
                ),
            );
        }

        Ok(Self {
            layers,
            ttl_config: RwLock::new(ttl_config),
            ttl_config_path,
            warming_state: RwLock::new(CacheWarmingProgress::default()),
            usage_counts: RwLock::new(HashMap::new()),
        })
    }

    pub async fn get<T>(&self, cache_type: CacheType, key: &str) -> Result<Option<T>, String>
    where
        T: DeserializeOwned,
    {
        let layer = self
            .layers
            .get(&cache_type)
            .ok_or_else(|| format!("Cache type {} is not configured", cache_type.as_str()))?;

        if let Some(value) = layer.get(key).await {
            layer.stats.hits.fetch_add(1, Ordering::Relaxed);
            self.record_usage(cache_type, key).await;

            let parsed = serde_json::from_slice::<T>(&value.data)
                .map_err(|e| format!("Failed to deserialize cached value: {e}"))?;
            return Ok(Some(parsed));
        }

        layer.stats.misses.fetch_add(1, Ordering::Relaxed);

        if let Some(tree) = layer.disk_tree() {
            let key_bytes = key.as_bytes().to_vec();
            let tree_clone = tree.clone();
            let maybe_record = tokio::task::spawn_blocking(move || -> Result<Option<Vec<u8>>, String> {
                tree_clone
                    .get(&key_bytes)
                    .map_err(|e| format!("Disk cache read error: {e}"))
                    .map(|opt| opt.map(|ivec| ivec.to_vec()))
            })
            .await
            .map_err(|e| format!("Disk cache read task failed: {e}"))??;

            if let Some(record_bytes) = maybe_record {
                let record: DiskRecord =
                    bincode::deserialize(&record_bytes).map_err(|e| format!("Disk cache decode error: {e}"))?;

                if let Some(expiry) = record.expires_at {
                    if expiry <= now_secs() {
                        let tree_clone = tree.clone();
                        let key_bytes = key.as_bytes().to_vec();
                        let _ = tokio::task::spawn_blocking(move || tree_clone.remove(key_bytes)).await;
                        return Ok(None);
                    }
                }

                let cache_value = Arc::new(CacheValue::new(record.value.clone()));
                let ttl = self.ttl_for(cache_type).await;
                layer.insert(key, cache_value.clone(), ttl).await;
                layer.stats.hits.fetch_add(1, Ordering::Relaxed);
                self.record_usage(cache_type, key).await;

                let parsed = serde_json::from_slice::<T>(&record.value)
                    .map_err(|e| format!("Failed to deserialize disk cached value: {e}"))?;
                return Ok(Some(parsed));
            }
        }

        Ok(None)
    }

    pub async fn set<T>(&self, cache_type: CacheType, key: String, value: &T) -> Result<(), String>
    where
        T: Serialize,
    {
        let layer = self
            .layers
            .get(&cache_type)
            .ok_or_else(|| format!("Cache type {} is not configured", cache_type.as_str()))?;

        let bytes = serde_json::to_vec(value)
            .map_err(|e| format!("Failed to serialize cache value: {e}"))?;
        let cache_value = Arc::new(CacheValue::new(bytes.clone()));

        let ttl = self.ttl_for(cache_type).await;
        layer.insert(&key, cache_value, ttl).await;
        self.record_usage(cache_type, &key).await;

        if let Some(tree) = layer.disk_tree() {
            let expires_at = ttl.map(|duration| now_secs() + duration.as_secs());
            let record = DiskRecord {
                value: bytes,
                expires_at,
            };

            let tree_clone = tree.clone();
            let key_bytes = key.into_bytes();
            let record_bytes = bincode::serialize(&record)
                .map_err(|e| format!("Failed to encode disk record: {e}"))?;

            tokio::task::spawn_blocking(move || -> Result<(), String> {
                tree_clone
                    .insert(key_bytes, record_bytes)
                    .map_err(|e| format!("Disk cache write error: {e}"))?;
                Ok(())
            })
            .await
            .map_err(|e| format!("Disk cache write task failed: {e}"))??;
        }

        Ok(())
    }

    pub async fn invalidate(&self, cache_type: CacheType, key: &str) -> Result<(), String> {
        if let Some(layer) = self.layers.get(&cache_type) {
            layer.invalidate(key).await;
        }
        Ok(())
    }

    pub async fn invalidate_many(
        &self,
        cache_type: CacheType,
        keys: &[String],
    ) -> Result<(), String> {
        if let Some(layer) = self.layers.get(&cache_type) {
            for key in keys {
                layer.invalidate(key).await;
            }
        }
        Ok(())
    }

    pub async fn invalidate_by_prefix(
        &self,
        cache_type: CacheType,
        prefix: &str,
    ) -> Result<(), String> {
        if let Some(layer) = self.layers.get(&cache_type) {
            let keys = layer.keys_with_prefix(prefix);
            for key in keys {
                layer.invalidate(&key).await;
            }
        }
        Ok(())
    }

    pub async fn clear_cache_type(&self, cache_type: CacheType) -> Result<(), String> {
        if let Some(layer) = self.layers.get(&cache_type) {
            layer.clear().await;
        }

        let mut usage = self.usage_counts.write().await;
        usage.remove(&cache_type);

        Ok(())
    }

    pub async fn clear_all(&self) -> Result<(), String> {
        for layer in self.layers.values() {
            layer.clear().await;
        }

        let mut usage = self.usage_counts.write().await;
        usage.clear();

        Ok(())
    }

    pub async fn statistics(&self) -> CacheStatistics {
        let mut total_hits = 0;
        let mut total_misses = 0;
        let mut total_evictions = 0;
        let mut total_entries = 0;
        let mut total_size = 0;

        let mut per_type = Vec::new();

        for cache_type in CacheType::ALL.iter().copied() {
            if let Some(layer) = self.layers.get(&cache_type) {
                let snapshot = layer.snapshot(cache_type);

                total_hits += snapshot.hits;
                total_misses += snapshot.misses;
                total_evictions += snapshot.evictions;
                total_entries += snapshot.entries;
                total_size += snapshot.size_bytes;

                per_type.push(snapshot);
            }
        }

        let total_hit_rate = if total_hits + total_misses > 0 {
            (total_hits as f64 / (total_hits + total_misses) as f64) * 100.0
        } else {
            0.0
        };

        let warming = self.warming_state.read().await.clone();
        let ttl_config = self.ttl_config.read().await.clone();

        CacheStatistics {
            total_entries,
            total_size_bytes: total_size,
            total_hits,
            total_misses,
            total_hit_rate,
            total_evictions,
            per_type,
            warming,
            ttl_config,
        }
    }

    pub async fn warm_cache(&self, requests: Vec<WarmRequest>) -> Result<(), String> {
        if requests.is_empty() {
            return Ok(());
        }

        {
            let mut state = self.warming_state.write().await;
            state.in_progress = true;
            state.total_items = requests.len();
            state.processed_items = 0;
            state.started_at = Some(now_secs());
            state.completed_at = None;
        }

        for (idx, request) in requests.into_iter().enumerate() {
            let payload = request.value.unwrap_or_else(|| {
                json!({
                    "prewarmed": true,
                    "key": request.key,
                    "type": request.cache_type.as_str(),
                })
            });

            self.set(request.cache_type, request.key.clone(), &payload)
                .await?;

            let mut state = self.warming_state.write().await;
            state.processed_items = idx + 1;
        }

        {
            let mut state = self.warming_state.write().await;
            state.in_progress = false;
            state.completed_at = Some(now_secs());
        }

        Ok(())
    }

    pub async fn warming_progress(&self) -> CacheWarmingProgress {
        self.warming_state.read().await.clone()
    }

    pub async fn ttl_config(&self) -> CacheTTLConfig {
        self.ttl_config.read().await.clone()
    }

    pub async fn update_ttl_config(&self, config: CacheTTLConfig) -> Result<(), String> {
        {
            let mut current = self.ttl_config.write().await;
            *current = config.clone();
        }

        let serialized = serde_json::to_string_pretty(&config)
            .map_err(|e| format!("Failed to serialize TTL configuration: {e}"))?;

        std::fs::write(&self.ttl_config_path, serialized)
            .map_err(|e| format!("Failed to persist TTL configuration: {e}"))?;

        Ok(())
    }

    pub async fn top_usage_keys(&self, cache_type: CacheType, limit: usize) -> Vec<String> {
        let usage = self.usage_counts.read().await;
        if let Some(map) = usage.get(&cache_type) {
            let mut pairs: Vec<_> = map.iter().collect();
            pairs.sort_by(|a, b| b.1.cmp(a.1));
            pairs
                .into_iter()
                .take(limit)
                .map(|(key, _)| key.clone())
                .collect()
        } else {
            Vec::new()
        }
    }

    async fn ttl_for(&self, cache_type: CacheType) -> Option<Duration> {
        self.ttl_config.read().await.ttl_for(cache_type)
    }

    async fn record_usage(&self, cache_type: CacheType, key: &str) {
        let mut usage = self.usage_counts.write().await;
        let entry = usage
            .entry(cache_type)
            .or_insert_with(HashMap::new)
            .entry(key.to_string())
            .or_insert(0);
        *entry += 1;
    }
}

fn load_or_initialize_config(path: &Path) -> Result<CacheTTLConfig, String> {
    if path.exists() {
        let contents = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read TTL config: {e}"))?;
        serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse TTL config: {e}"))
    } else {
        let config = CacheTTLConfig::default();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {e}"))?;
        }
        let contents = serde_json::to_string_pretty(&config)
            .map_err(|e| format!("Failed to serialize TTL config: {e}"))?;
        std::fs::write(path, contents)
            .map_err(|e| format!("Failed to write TTL config: {e}"))?;
        Ok(config)
    }
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_else(|_| Duration::from_secs(0))
        .as_secs()
}

fn saturating_sub_atomic(target: &AtomicU64, amount: u64) {
    if amount == 0 {
        return;
    }

    let mut current = target.load(Ordering::Relaxed);
    loop {
        if current == 0 {
            return;
        }

        let new_value = current.saturating_sub(amount);
        match target.compare_exchange(current, new_value, Ordering::Relaxed, Ordering::Relaxed) {
            Ok(_) => return,
            Err(actual) => current = actual,
        }
    }
}

pub type SharedCacheManager = Arc<CacheManager>;
