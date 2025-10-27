use crate::core::websocket_manager::{ConnectionStateInternal, StreamConnection};
use crate::websocket::types::*;
use futures_util::{SinkExt, StreamExt};
use serde_json::json;
use std::time::Instant;
use tauri::{AppHandle, Manager};
use tokio::net::TcpStream;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

const HELIUS_WS_URL: &str = "wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY";

pub struct HeliusStream {
    connection: StreamConnection,
    app_handle: AppHandle,
}

impl HeliusStream {
    pub fn new(connection: StreamConnection, app_handle: AppHandle) -> Self {
        Self {
            connection,
            app_handle,
        }
    }

    pub async fn start(&self) -> anyhow::Result<()> {
        let url = url::Url::parse(HELIUS_WS_URL)?;
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

        self.handle_stream(ws_stream).await
    }

    async fn handle_stream(&self, ws_stream: WebSocketStream<MaybeTlsStream<TcpStream>>) -> anyhow::Result<()> {
        let (mut write, mut read) = ws_stream.split();

        // Resubscribe to existing addresses
        let addresses = self.connection.subscriptions.read().await.wallets.clone();
        if !addresses.is_empty() {
            let msg = json!({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "subscribeWallets",
                "params": { "addresses": addresses }
            });
            write.send(Message::Text(msg.to_string())).await?;
        }

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
        if let Some(method) = value.get("method").and_then(|v| v.as_str()) {
            if method == "notification" {
                if let Ok(tx) = self.parse_transaction(&value) {
                    let event = StreamEvent::TransactionUpdate(tx);
                    let _ = self.connection.event_tx.send(event.clone());
                    let _ = self.app_handle.emit_all("transaction_update", &event);
                }
            }
        }
    }

    fn parse_transaction(&self, value: &serde_json::Value) -> anyhow::Result<TransactionUpdate> {
        let params = value
            .get("params")
            .and_then(|v| v.get("result"))
            .ok_or_else(|| anyhow::anyhow!("Missing params"))?;

        Ok(TransactionUpdate {
            signature: params
                .get("signature")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string(),
            slot: params.get("slot").and_then(|v| v.as_u64()).unwrap_or_default(),
            timestamp: params.get("timestamp").and_then(|v| v.as_i64()).unwrap_or_else(|| chrono::Utc::now().timestamp()),
            typ: params.get("type").and_then(|v| v.as_str()).map(|s| s.to_string()),
            amount: params.get("amount").and_then(|v| v.as_f64()),
            symbol: params.get("symbol").and_then(|v| v.as_str()).map(|s| s.to_string()),
            from: params.get("from").and_then(|v| v.as_str()).map(|s| s.to_string()),
            to: params.get("to").and_then(|v| v.as_str()).map(|s| s.to_string()),
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

    pub async fn subscribe(connection: StreamConnection, addresses: Vec<String>) -> anyhow::Result<()> {
        // Actual subscription logic must send a message to the WebSocket stream
        // Requires connection to have access to the writer handle - omitted for brevity
        let mut subs = connection.subscriptions.write().await;
        for address in addresses {
            if !subs.wallets.contains(&address) {
                subs.wallets.push(address);
            }
        }
        Ok(())
    }

    pub async fn unsubscribe(connection: StreamConnection, addresses: Vec<String>) -> anyhow::Result<()> {
        let mut subs = connection.subscriptions.write().await;
        subs.wallets.retain(|a| !addresses.contains(a));
        Ok(())
    }
}
