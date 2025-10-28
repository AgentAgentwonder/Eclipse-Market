use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime};
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopCoin {
    pub rank: usize,
    pub address: String,
    pub symbol: String,
    pub name: String,
    pub price: f64,
    pub price_change_24h: f64,
    pub market_cap: f64,
    pub volume_24h: f64,
    pub liquidity: Option<f64>,
    pub circulating_supply: Option<f64>,
    pub sparkline: Vec<f64>,
}

#[derive(Debug)]
struct CacheEntry {
    data: Vec<TopCoin>,
    timestamp: SystemTime,
}

pub struct TopCoinsCache {
    cache: RwLock<Option<CacheEntry>>,
    ttl: Duration,
    page_size: usize,
}

impl TopCoinsCache {
    pub fn new() -> Self {
        Self {
            cache: RwLock::new(None),
            ttl: Duration::from_secs(300),
            page_size: 100,
        }
    }

    pub async fn get_top_coins(
        &self,
        limit: Option<usize>,
        offset: Option<usize>,
        api_key: Option<String>,
    ) -> Result<Vec<TopCoin>, String> {
        let cache = self.cache.read().await;
        if let Some(entry) = &*cache {
            if entry.timestamp.elapsed().unwrap_or(Duration::MAX) < self.ttl {
                let data = self.slice_data(&entry.data, limit, offset);
                return Ok(data);
            }
        }
        drop(cache);

        let full_data = if let Some(key) = api_key.clone() {
            if !key.is_empty() {
                match self.fetch_from_birdeye(&key).await {
                    Ok(data) => data,
                    Err(_) => self.generate_mock_top_coins(),
                }
            } else {
                self.generate_mock_top_coins()
            }
        } else {
            self.generate_mock_top_coins()
        };

        let mut cache = self.cache.write().await;
        *cache = Some(CacheEntry {
            data: full_data.clone(),
            timestamp: SystemTime::now(),
        });

        Ok(self.slice_data(&full_data, limit, offset))
    }

    fn slice_data(
        &self,
        data: &[TopCoin],
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Vec<TopCoin> {
        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(self.page_size);
        data.iter().skip(offset).take(limit).cloned().collect()
    }

    async fn fetch_from_birdeye(&self, api_key: &str) -> Result<Vec<TopCoin>, String> {
        let client = reqwest::Client::new();
        let url = format!(
            "https://public-api.birdeye.so/defi/market-cap?limit={}",
            self.page_size
        );

        let response = client
            .get(&url)
            .header("X-API-KEY", api_key)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        #[derive(Deserialize)]
        struct BirdeyeResponse {
            data: Vec<BirdeyeCoin>,
        }

        #[derive(Deserialize)]
        struct BirdeyeCoin {
            address: String,
            symbol: String,
            name: String,
            price: f64,
            #[serde(rename = "priceChange24h")]
            price_change_24h: f64,
            #[serde(rename = "marketCap")]
            market_cap: f64,
            #[serde(rename = "volume24h")]
            volume_24h: f64,
            #[serde(rename = "liquidity")]
            liquidity: Option<f64>,
            #[serde(rename = "circulatingSupply")]
            circulating_supply: Option<f64>,
        }

        let data: BirdeyeResponse = response
            .json()
            .await
            .map_err(|e| format!("Parse failed: {}", e))?;

        let coins = data
            .data
            .into_iter()
            .enumerate()
            .map(|(idx, item)| TopCoin {
                rank: idx + 1,
                address: item.address,
                symbol: item.symbol,
                name: item.name,
                price: item.price,
                price_change_24h: item.price_change_24h,
                market_cap: item.market_cap,
                volume_24h: item.volume_24h,
                liquidity: item.liquidity,
                circulating_supply: item.circulating_supply,
                sparkline: Self::generate_sparkline(item.price),
            })
            .collect();

        Ok(coins)
    }

    fn generate_mock_top_coins(&self) -> Vec<TopCoin> {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        let base_coins = vec![
            (
                "Solana",
                "SOL",
                "So11111111111111111111111111111111111111112",
                100.0,
                45_000_000_000.0,
            ),
            (
                "Jupiter",
                "JUP",
                "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
                1.23,
                1_500_000_000.0,
            ),
            (
                "Bonk",
                "BONK",
                "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                0.000023,
                1_000_000_000.0,
            ),
            (
                "dogwifhat",
                "WIF",
                "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
                2.45,
                3_500_000_000.0,
            ),
            (
                "Pyth Network",
                "PYTH",
                "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
                0.87,
                2_800_000_000.0,
            ),
            (
                "Jito",
                "JTO",
                "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
                3.21,
                4_100_000_000.0,
            ),
            (
                "Orca",
                "ORCA",
                "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
                4.56,
                3_600_000_000.0,
            ),
            (
                "Raydium",
                "RAY",
                "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
                2.89,
                2_950_000_000.0,
            ),
            (
                "UXD Stablecoin",
                "UXD",
                "7XSjzSPQJ49z6VvPF41ytsYEy8Z9KdwdHFuDeRh4Vj2U",
                1.00,
                120_000_000.0,
            ),
            (
                "Helium",
                "HNT",
                "hntyVPJ6xzKpzpF3pXMda35r9x6pqqKG9okaD7th2wL",
                4.20,
                600_000_000.0,
            ),
        ];

        (0..self.page_size)
            .map(|idx| {
                let (name, symbol, address, base_price, base_cap) =
                    base_coins[idx % base_coins.len()];
                let price = base_price * (1.0 + rng.gen_range(-0.1..0.1));
                TopCoin {
                    rank: idx + 1,
                    address: address.to_string(),
                    symbol: symbol.to_string(),
                    name: name.to_string(),
                    price,
                    price_change_24h: rng.gen_range(-15.0..20.0),
                    market_cap: base_cap * (1.0 + rng.gen_range(-0.1..0.1)),
                    volume_24h: rng.gen_range(5_000_000.0..800_000_000.0),
                    liquidity: Some(rng.gen_range(1_000_000.0..50_000_000.0)),
                    circulating_supply: Some(rng.gen_range(1_000_000.0..100_000_000.0)),
                    sparkline: Self::generate_sparkline(price),
                }
            })
            .collect()
    }

    fn generate_sparkline(base_price: f64) -> Vec<f64> {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let mut sparkline = Vec::with_capacity(24);
        let mut price = base_price;
        for _ in 0..24 {
            price *= 1.0 + rng.gen_range(-0.03..0.03);
            sparkline.push((price * 100.0).round() / 100.0);
        }
        sparkline
    }

    pub async fn invalidate_cache(&self) {
        let mut cache = self.cache.write().await;
        *cache = None;
    }
}
