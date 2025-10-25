use linfa::traits::Predict;
use linfa_svm::Svm;
use smartcore::svm::Kernel;
use ndarray::Array1;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct RiskModel {
    model: Svm<f32, bool>,
}

impl RiskModel {
    pub fn new() -> Self {
        // TODO: Load trained model
        Self {
            model: Svm::<f32, bool>::params()
                .kernel(Kernel::Rbf)
                .pos_vs_neg(1.0)
                .build()
                .unwrap()
        }
    }

    pub fn score_trade(&self, features: &[f32]) -> f32 {
        let features_array = Array1::from_shape_vec((features.len(),), features.to_vec()).unwrap();
        let prediction: bool = self.model.predict(features_array);
        let score = if prediction { 1.0 } else { -1.0 };
        score
    }
}

use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct RiskScore {
    pub overall: f32,
    pub liquidity: f32,
    pub volatility: f32,
    pub concentration: f32,
}

#[derive(Debug)]
pub struct WalletMetrics {
    pub win_rate: f32,
    pub total_volume: f32,
    pub trades_last_7d: u32,
    pub consistent_profits: bool,
}

pub struct RiskAnalyzer {
    api_key: Option<String>,
}

impl RiskAnalyzer {
    pub fn new() -> Self {
        Self { api_key: None }
    }

    pub fn basic_risk_score(&self, metrics: &WalletMetrics) -> RiskScore {
        RiskScore {
            overall: (metrics.win_rate * 0.4 + metrics.liquidity_score() * 0.3 + 
                     metrics.volatility_score() * 0.2 + metrics.concentration_score() * 0.1)
                     .min(1.0).max(0.0),
            liquidity: metrics.liquidity_score(),
            volatility: metrics.volatility_score(),
            concentration: metrics.concentration_score(),
        }
    }
}

impl WalletMetrics {
    pub fn liquidity_score(&self) -> f32 {
        (self.total_volume / 1000.0).min(1.0).max(0.0)
    }

    pub fn volatility_score(&self) -> f32 {
        if self.trades_last_7d > 20 { 0.8 } 
        else if self.trades_last_7d > 10 { 0.5 }
        else { 0.2 }
    }

    pub fn concentration_score(&self) -> f32 {
        if self.consistent_profits { 0.3 } else { 0.7 }
    }
}

#[tauri::command]
pub async fn assess_risk(features: Vec<f32>) -> Result<f32, String> {
    let model = RiskModel::new();
    Ok(model.score_trade(&features))
}
