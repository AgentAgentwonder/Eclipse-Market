use super::aggregator::{AlertConfiguration, AlertRule, SocialSearchResult, SocialSentimentResponse};
use super::community::{CommunityHealthMetrics, HolderAnalysis};
use super::sentiment::FomoFudScores;
use super::influencer_tracker::InfluencerLeaderboard;
use super::storage::{Influencer, InfluencerMention, SentimentHistory, WhaleWallet};
use super::trends::TrendingToken;
use super::whale_tracker::{WhaleActivity, WhaleProfile};
use super::SharedSocialIntelEngine;

#[tauri::command]
pub async fn get_social_sentiment(
    token_address: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Option<SocialSentimentResponse>, String> {
    let eng = engine.read().await;
    Ok(eng.get_social_sentiment(&token_address))
}

#[tauri::command]
pub async fn get_social_trending_tokens(
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Vec<TrendingToken>, String> {
    let eng = engine.read().await;
    Ok(eng.get_trending_tokens())
}

#[tauri::command]
pub async fn get_influencer_mentions(
    token_address: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Vec<InfluencerMention>, String> {
    let eng = engine.read().await;
    Ok(eng.get_influencer_mentions(&token_address))
}

#[tauri::command]
pub async fn get_influencer_profiles(
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Vec<Influencer>, String> {
    let eng = engine.read().await;
    Ok(eng.get_influencer_profiles())
}

#[tauri::command]
pub async fn get_influencer_leaderboard(
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<InfluencerLeaderboard, String> {
    let eng = engine.read().await;
    Ok(eng.get_influencer_leaderboard())
}

#[tauri::command]
pub async fn track_influencer(
    handle: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Option<Influencer>, String> {
    let mut eng = engine.write().await;
    Ok(eng.track_influencer(&handle))
}

#[tauri::command]
pub async fn get_whale_activity(
    token_address: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Option<WhaleActivity>, String> {
    let eng = engine.read().await;
    Ok(eng.get_whale_activity(&token_address))
}

#[tauri::command]
pub async fn track_whale_wallet(
    address: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Option<WhaleWallet>, String> {
    let mut eng = engine.write().await;
    Ok(eng.track_whale_wallet(&address))
}

#[tauri::command]
pub async fn get_whale_profile(
    address: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Option<WhaleProfile>, String> {
    let eng = engine.read().await;
    Ok(eng.get_whale_profile(&address))
}

#[tauri::command]
pub async fn get_fomo_fud_scores(
    token_address: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Option<FomoFudScores>, String> {
    let eng = engine.read().await;
    Ok(eng.get_fomo_fud(&token_address))
}

#[tauri::command]
pub async fn get_social_sentiment_history(
    token_address: String,
    period: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Vec<SentimentHistory>, String> {
    let eng = engine.read().await;
    Ok(eng.get_sentiment_history(&token_address, &period))
}

#[tauri::command]
pub async fn search_social(
    query: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<SocialSearchResult, String> {
    let eng = engine.read().await;
    Ok(eng.search_social(&query))
}

#[tauri::command]
pub async fn get_community_stats(
    token_address: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Option<CommunityHealthMetrics>, String> {
    let eng = engine.read().await;
    Ok(eng.get_community_stats(&token_address))
}

#[tauri::command]
pub async fn get_holder_analysis(
    token_address: String,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<Option<HolderAnalysis>, String> {
    let eng = engine.read().await;
    Ok(eng.get_holder_analysis(&token_address))
}

#[tauri::command]
pub async fn configure_social_alerts(
    rules: Vec<AlertRule>,
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<AlertConfiguration, String> {
    let mut eng = engine.write().await;
    Ok(eng.configure_alerts(rules))
}

#[tauri::command]
pub async fn get_social_alert_configuration(
    engine: tauri::State<'_, SharedSocialIntelEngine>,
) -> Result<AlertConfiguration, String> {
    let eng = engine.read().await;
    Ok(eng.get_alert_configuration())
}
