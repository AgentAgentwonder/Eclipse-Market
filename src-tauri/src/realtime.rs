use tokio::sync::broadcast;
use serde::Serialize;
use tokio_tungstenite::connect_async;
use futures_util::{StreamExt, SinkExt};
use url::Url;

#[derive(Clone, Debug, Serialize)]
pub struct MarketData {
    pub bid: f64,
    pub ask: f64,
    pub last: f64,
    pub volume: f64,
}

pub async fn start_market_data_feed(pair: String) -> broadcast::Receiver<MarketData> {
    let (tx, rx) = broadcast::channel(100);
    
    tokio::spawn(async move {
        let url = format!("wss://api.market.com/ws/{}", pair);
        let (mut ws_stream, _) = connect_async(Url::parse(&url).unwrap()).await.unwrap();
        
        while let Some(msg) = ws_stream.next().await {
            if let Ok(msg) = msg {
                // Parse message and send to subscribers
                let data = MarketData {
                    bid: 100.0, // TODO: Parse from msg
                    ask: 101.0,
                    last: 100.5,
                    volume: 1000.0,
                };
                let _ = tx.send(data);
            }
        }
    });
    
    rx
}
