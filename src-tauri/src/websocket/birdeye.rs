use crate::core::websocket_manager::{ConnectionStateInternal, StreamConnection};
use crate::websocket::types::*;
use futures_util::{SinkExt, StreamExt};
use serde_json::json;
use std::time::Instant;
use tauri::{AppHandle, Manager};
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};
use tokio::net::TcpStream;

const BIRDEYE_WS_URL: &str = "wss://public-api.birdeye.so/socket";

pub struct BirdeyeStream {
    connection: StreamConnection,
    app_handle: AppHandle,
}

impl BirdeyeStream {
    pub fn new(connection: StreamConnection, app_handle: AppHandle) -> Self {
        Self {
            connection,
            app_handle,
        }
    }

    pub async fn start(&self) -> anyhow::Result<()> {
        let url = url::Url::parse(BIRDEYE_WS_URL)?;
        let (ws_stream, _) = connect_async(url).await?;

        {
            let mut state = self.connection.state.write().await;
            *state = ConnectionStateInternal::Connected;
        }
        {
            let mut fallback = self.connection.fallback.write().await;
            fallback.active = false;
            fallback.reason = None;
        }

        self.emit_status().await;
        self.handle_stream(ws_stream).await
    }

    async fn handle_stream(&self, ws_stream: WebSocketStream<MaybeTlsStream<TcpStream>>) -> anyhow::Result<()> {
        let (mut write, mut read) = ws_stream.split();

        while let Some(msg) = read.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    self.update_last_message().await;
                    self.increment_stats(text.len()).await;

                    if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                        self.process_message(value).await;
                    }
                }
                Ok(Message::Ping(_)) => {
                    if let Err(e) = write.send(Message::Pong(vec![])).await {
                        return Err(anyhow::anyhow!("Failed to send pong: {}", e));
                    }
                }
                Ok(Message::Close(_)) => {
                    break;
                }
                Err(e) => {
                    return Err(anyhow::anyhow!("WebSocket error: {}", e));
                }
                _ => {}
            }
        }

        Ok(())
    }

    async fn process_message(&self, value: serde_json::Value) {
        if let Some(typ) = value.get("type").and_then(|v| v.as_str()) {
            match typ {
                "price" => {
                    if let Ok(delta) = self.parse_price_update(&value) {
                        let mut delta_state = self.connection.delta_prices.lock().await;
                        let now = Instant::now();
                        if delta_state.should_emit(&delta.symbol, now) {
                            delta_state.mark_emitted(delta.symbol.clone(), now);
                            drop(delta_state);
                            let event = StreamEvent::PriceUpdate(delta);
                            self.enqueue_event(event).await;
                        }
                    }
                }
                _ => {}
            }
        }
    }

    fn parse_price_update(&self, value: &serde_json::Value) -> anyhow::Result<PriceDelta> {
        let symbol = value
            .get("symbol")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing symbol"))?
            .to_string();
        let price = value
            .get("price")
            .and_then(|v| v.as_f64())
            .ok_or_else(|| anyhow::anyhow!("Missing price"))?;
        let change = value.get("change_24h").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let volume = value.get("volume_24h").and_then(|v| v.as_f64());

        Ok(PriceDelta {
            symbol,
            price,
            change,
            volume,
            ts: chrono::Utc::now().timestamp(),
        })
    }

    async fn update_last_message(&self) {
        let mut last = self.connection.last_message.write().await;
        *last = Some(Instant::now());
    }

    async fn increment_stats(&self, bytes: usize) {
        let mut stats = self.connection.statistics.write().await;
        stats.messages_received += 1;
        stats.bytes_received += bytes as u64;
    }

    async fn emit_status(&self) {
        // Status emission handled by manager
    }

    async fn enqueue_event(&self, event: StreamEvent) {
        let mut queue = self.connection.queue.lock().await;
        queue.push(event.clone());
        drop(queue);

        match &event {
            StreamEvent::PriceUpdate(delta) => {
                let _ = self.app_handle.emit_all("price_update", delta);
            }
            _ => {}
        }

        let _ = self.connection.event_tx.send(event);
    }

    pub async fn subscribe(connection: StreamConnection, symbols: Vec<String>) -> anyhow::Result<()> {
        let mut subs = connection.subscriptions.write().await;
        subs.prices.extend(symbols.clone());
        drop(subs);

        // Birdeye subscription message format:
        // {"type": "subscribe", "symbols": ["SOL", "BONK", ...]}
        // This is a placeholder - actual implementation depends on Birdeye API docs
        Ok(())
    }

    pub async fn unsubscribe(connection: StreamConnection, symbols: Vec<String>) -> anyhow::Result<()> {
        let mut subs = connection.subscriptions.write().await;
        subs.prices.retain(|s| !symbols.contains(s));
        drop(subs);

        // Birdeye unsubscribe message format:
        // {"type": "unsubscribe", "symbols": ["SOL", "BONK", ...]}
        // This is a placeholder - actual implementation depends on Birdeye API docs
        Ok(())
    }
}
