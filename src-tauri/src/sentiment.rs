use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct SentimentResult {
    pub score: f32,
    pub label: String,
    pub confidence: f32,
}

#[tauri::command]
pub fn analyze_sentiment(text: &str) -> SentimentResult {
    let positive_words = ["good", "great", "excellent", "bullish", "moon", "pump", "profit", "gain", "win", "rocket"];
    let negative_words = ["bad", "terrible", "bearish", "dump", "crash", "loss", "scam", "rug", "fail", "dead"];

    let text_lower = text.to_lowercase();
    let mut score: f32 = 0.0;
    
    for word in positive_words.iter() {
        if text_lower.contains(word) { score += 0.15; }
    }
    for word in negative_words.iter() {
        if text_lower.contains(word) { score -= 0.15; }
    }

    SentimentResult {
        score: score.max(-1.0).min(1.0),
        label: if score > 0.2 {
            "positive".to_string()
        } else if score < -0.2 {
            "negative".to_string()
        } else {
            "neutral".to_string()
        },
        confidence: score.abs(),
    }
}

#[tauri::command]
pub async fn analyze_text_sentiment(text: String) -> Result<SentimentResult, String> {
    Ok(analyze_sentiment(&text))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_positive_sentiment() {
        let result = analyze_sentiment("This coin is great! Bullish and going to the moon!");
        assert!(result.score > 0.0);
        assert_eq!(result.label, "positive");
    }

    #[test]
    fn test_negative_sentiment() {
        let result = analyze_sentiment("This is a terrible scam. Avoid at all costs!");
        assert!(result.score < 0.0);
        assert_eq!(result.label, "negative");
    }

    #[test]
    fn test_neutral_sentiment() {
        let result = analyze_sentiment("The price is stable today.");
        assert_eq!(result.label, "neutral");
    }
}