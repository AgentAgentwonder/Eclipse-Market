use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct RiskModel {
    threshold: f32,
}

impl RiskModel {
    pub fn new() -> Self {
        Self { threshold: 0.5 }
    }

    pub fn score_trade(&self, features: &[f32]) -> f32 {
        let weights = vec![0.3, 0.2, 0.15, 0.15, 0.1, 0.1];

        let score: f32 = features
            .iter()
            .zip(weights.iter())
            .take(features.len().min(weights.len()))
            .map(|(f, w)| f * w)
            .sum();

        score.max(0.0).min(1.0)
    }
}

#[tauri::command]
pub async fn assess_risk(features: Vec<f32>) -> Result<f32, String> {
    if features.is_empty() {
        return Err("Features cannot be empty".to_string());
    }

    let model = RiskModel::new();
    Ok(model.score_trade(&features))
}
