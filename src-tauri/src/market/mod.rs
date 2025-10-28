pub mod new_coins_scanner;
pub mod top_coins;
pub mod trending;

use new_coins_scanner::{NewCoin, NewCoinsScanner, SafetyAnalysis};
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
use std::sync::Arc;
use tokio::sync::RwLock;
use top_coins::TopCoinsCache;
use trending::TrendingCoinsCache;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CoinPrice {
    pub address: String,
    pub symbol: String,
    pub name: String,
    pub price: f64,
    pub price_change_24h: f64,
    pub volume_24h: f64,
    pub market_cap: f64,
    pub liquidity: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PricePoint {
    pub timestamp: i64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenSearchResult {
    pub address: String,
    pub symbol: String,
    pub name: String,
    pub logo_uri: Option<String>,
}

#[derive(Debug, Clone)]
pub struct MarketState {
    pub scanner: Arc<NewCoinsScanner>,
    pub trending_cache: Arc<TrendingCoinsCache>,
    pub top_coins_cache: Arc<TopCoinsCache>,
    pub watchlist: BTreeSet<String>,
}

impl MarketState {
    pub fn new() -> Self {
        let state = Self {
            scanner: Arc::new(NewCoinsScanner::new()),
            trending_cache: Arc::new(TrendingCoinsCache::new()),
            top_coins_cache: Arc::new(TopCoinsCache::new()),
            watchlist: BTreeSet::new(),
        };

        let scanner = state.scanner.clone();
        tauri::async_runtime::spawn(async move {
            let mock_coins = vec![
                ("DOGE2", "Doge2xxxxx1111111111111111111111111"),
                ("PEPE", "PEPExxxxx22222222222222222222222222"),
                ("SHIB", "SHIBxxxxx33333333333333333333333333"),
                ("FLOKI", "FLOKIxxxx44444444444444444444444444"),
                ("SAMO2", "SAMO2xxxx55555555555555555555555555"),
            ];

            for (symbol, address) in mock_coins {
                let coin = new_coins_scanner::mock_new_coin(symbol, address);
                let _ = scanner.add_detected_coin(coin).await;
            }

            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(120)).await;
                let _ = scanner.cleanup_old_coins(24).await;
            }
        });

        state
    }
}

impl Default for MarketState {
    fn default() -> Self {
        Self::new()
    }
}

async fn fetch_birdeye_price(token: &str, api_key: &str) -> Result<CoinPrice, String> {
    let client = reqwest::Client::new();
    let url = format!("https://public-api.birdeye.so/defi/price?address={}", token);

    let response = client
        .get(&url)
        .header("X-API-KEY", api_key)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    #[derive(Deserialize)]
    struct BirdeyeResponse {
        data: BirdeyeData,
    }

    #[derive(Deserialize)]
    struct BirdeyeData {
        value: f64,
        #[serde(rename = "priceChange24h")]
        price_change_24h: Option<f64>,
    }

    let data: BirdeyeResponse = response
        .json()
        .await
        .map_err(|e| format!("Parse failed: {}", e))?;

    Ok(CoinPrice {
        address: token.to_string(),
        symbol: "UNKNOWN".to_string(),
        name: "Unknown Token".to_string(),
        price: data.data.value,
        price_change_24h: data.data.price_change_24h.unwrap_or(0.0),
        volume_24h: 0.0,
        market_cap: 0.0,
        liquidity: None,
    })
}

fn generate_mock_price(symbol: &str) -> CoinPrice {
    use rand::Rng;
    let mut rng = rand::thread_rng();

    let base_price = match symbol {
        "SOL" => 100.0,
        "BONK" => 0.000023,
        "JUP" => 1.23,
        _ => 1.0,
    };

    CoinPrice {
        address: "mock".to_string(),
        symbol: symbol.to_string(),
        name: format!("{} Token", symbol),
        price: base_price * (1.0 + rng.gen_range(-0.05..0.05)),
        price_change_24h: rng.gen_range(-20.0..20.0),
        volume_24h: rng.gen_range(100000.0..10000000.0),
        market_cap: rng.gen_range(1000000.0..100000000.0),
        liquidity: Some(rng.gen_range(50000.0..5000000.0)),
    }
}

fn generate_mock_history(hours: i64) -> Vec<PricePoint> {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let mut history = Vec::new();
    let mut price = 100.0;

    let now = chrono::Utc::now().timestamp();

    for i in (0..hours).rev() {
        let change = rng.gen_range(-2.0..2.0);
        price += change;
        let volatility = rng.gen_range(0.5..2.0);

        history.push(PricePoint {
            timestamp: now - (i * 3600),
            open: price,
            high: price + volatility,
            low: price - volatility,
            close: price + rng.gen_range(-1.0..1.0),
            volume: rng.gen_range(10000.0..100000.0),
        });
    }

    history
}

#[tauri::command]
pub async fn get_coin_price(address: String, api_key: Option<String>) -> Result<CoinPrice, String> {
    if let Some(key) = api_key {
        if !key.is_empty() {
            match fetch_birdeye_price(&address, &key).await {
                Ok(price) => return Ok(price),
                Err(_) => {}
            }
        }
    }

    Ok(generate_mock_price(&address))
}

#[tauri::command]
pub async fn get_price_history(
    address: String,
    timeframe: String,
    _api_key: Option<String>,
) -> Result<Vec<PricePoint>, String> {
    let hours = match timeframe.as_str() {
        "1H" => 1,
        "4H" => 4,
        "1D" => 24,
        "1W" => 168,
        "1M" => 720,
        _ => 24,
    };

    Ok(generate_mock_history(hours))
}

#[tauri::command]
pub async fn search_tokens(query: String) -> Result<Vec<TokenSearchResult>, String> {
    let tokens = vec![
        TokenSearchResult {
            address: "So11111111111111111111111111111111111111112".to_string(),
            symbol: "SOL".to_string(),
            name: "Solana".to_string(),
            logo_uri: None,
        },
        TokenSearchResult {
            address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263".to_string(),
            symbol: "BONK".to_string(),
            name: "Bonk".to_string(),
            logo_uri: None,
        },
        TokenSearchResult {
            address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN".to_string(),
            symbol: "JUP".to_string(),
            name: "Jupiter".to_string(),
            logo_uri: None,
        },
    ];

    let filtered: Vec<TokenSearchResult> = tokens
        .into_iter()
        .filter(|t| {
            t.symbol.to_lowercase().contains(&query.to_lowercase())
                || t.name.to_lowercase().contains(&query.to_lowercase())
        })
        .collect();

    Ok(filtered)
}

#[tauri::command]
pub async fn get_new_coins(
    state: tauri::State<'_, Arc<RwLock<MarketState>>>,
) -> Result<Vec<NewCoin>, String> {
    let market_state = state.read().await;
    market_state.scanner.scan_new_deployments().await
}

#[tauri::command]
pub async fn get_coin_safety_score(
    address: String,
    state: tauri::State<'_, Arc<RwLock<MarketState>>>,
) -> Result<SafetyAnalysis, String> {
    let market_state = state.read().await;
    match market_state.scanner.get_coin_by_address(&address).await {
        Some(coin) => Ok(market_state.scanner.calculate_safety_score(&coin)),
        None => Err("Coin not found".to_string()),
    }
}

#[tauri::command]
pub async fn get_trending_coins(
    api_key: Option<String>,
    state: tauri::State<'_, Arc<RwLock<MarketState>>>,
) -> Result<Vec<trending::TrendingCoin>, String> {
    let market_state = state.read().await;
    market_state
        .trending_cache
        .get_trending_coins(api_key)
        .await
}

#[tauri::command]
pub async fn get_top_coins(
    limit: Option<usize>,
    offset: Option<usize>,
    api_key: Option<String>,
    state: tauri::State<'_, Arc<RwLock<MarketState>>>,
) -> Result<Vec<top_coins::TopCoin>, String> {
    let market_state = state.read().await;
    market_state
        .top_coins_cache
        .get_top_coins(limit, offset, api_key)
        .await
}

#[tauri::command]
pub async fn get_coin_sparkline(
    address: String,
    _api_key: Option<String>,
) -> Result<Vec<f64>, String> {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let mut values = Vec::new();
    let mut price = 100.0;

    for _ in 0..24 {
        price += rng.gen_range(-2.0..2.0);
        values.push(price);
    }

    Ok(values)
}

#[tauri::command]
pub async fn add_to_watchlist(
    address: String,
    state: tauri::State<'_, Arc<RwLock<MarketState>>>,
) -> Result<(), String> {
    let mut market_state = state.write().await;
    market_state.watchlist.insert(address);
    Ok(())
}

#[tauri::command]
pub async fn remove_from_watchlist(
    address: String,
    state: tauri::State<'_, Arc<RwLock<MarketState>>>,
) -> Result<(), String> {
    let mut market_state = state.write().await;
    market_state.watchlist.remove(&address);
    Ok(())
}

#[tauri::command]
pub async fn get_watchlist(
    state: tauri::State<'_, Arc<RwLock<MarketState>>>,
) -> Result<Vec<String>, String> {
    let market_state = state.read().await;
    Ok(market_state.watchlist.iter().cloned().collect())
}
