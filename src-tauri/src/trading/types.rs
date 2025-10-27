use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum OrderType {
    Market,
    Limit,
    StopLoss,
    TakeProfit,
    TrailingStop,
}

impl std::fmt::Display for OrderType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OrderType::Market => write!(f, "market"),
            OrderType::Limit => write!(f, "limit"),
            OrderType::StopLoss => write!(f, "stop_loss"),
            OrderType::TakeProfit => write!(f, "take_profit"),
            OrderType::TrailingStop => write!(f, "trailing_stop"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum OrderSide {
    Buy,
    Sell,
}

impl std::fmt::Display for OrderSide {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OrderSide::Buy => write!(f, "buy"),
            OrderSide::Sell => write!(f, "sell"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum OrderStatus {
    Pending,
    PartiallyFilled,
    Filled,
    Cancelled,
    Expired,
    Failed,
}

impl std::fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OrderStatus::Pending => write!(f, "pending"),
            OrderStatus::PartiallyFilled => write!(f, "partially_filled"),
            OrderStatus::Filled => write!(f, "filled"),
            OrderStatus::Cancelled => write!(f, "cancelled"),
            OrderStatus::Expired => write!(f, "expired"),
            OrderStatus::Failed => write!(f, "failed"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: String,
    pub order_type: OrderType,
    pub side: OrderSide,
    pub status: OrderStatus,
    pub input_mint: String,
    pub output_mint: String,
    pub input_symbol: String,
    pub output_symbol: String,
    pub amount: f64,
    pub filled_amount: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trailing_percent: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub highest_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lowest_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub linked_order_id: Option<String>,
    pub slippage_bps: i32,
    pub priority_fee_micro_lamports: i32,
    pub wallet_address: String,
    #[sqlx(try_from = "String")]
    pub created_at: DateTime<Utc>,
    #[sqlx(try_from = "String")]
    pub updated_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[sqlx(try_from = "Option<String>")]
    pub triggered_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tx_signature: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrderRequest {
    pub order_type: OrderType,
    pub side: OrderSide,
    pub input_mint: String,
    pub output_mint: String,
    pub input_symbol: String,
    pub output_symbol: String,
    pub amount: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trailing_percent: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub linked_order_id: Option<String>,
    pub slippage_bps: i32,
    pub priority_fee_micro_lamports: i32,
    pub wallet_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderFill {
    pub order_id: String,
    pub filled_amount: f64,
    pub fill_price: f64,
    pub tx_signature: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderUpdate {
    pub order_id: String,
    pub status: OrderStatus,
    pub filled_amount: Option<f64>,
    pub tx_signature: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickTradeRequest {
    pub input_mint: String,
    pub output_mint: String,
    pub input_symbol: String,
    pub output_symbol: String,
    pub amount: f64,
    pub side: OrderSide,
    pub wallet_address: String,
    pub use_max: bool,
}
