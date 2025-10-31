use tauri::State;

use crate::security::keystore::Keystore;

use super::cache::{MentionAggregate, TrendSnapshot};
use super::models::{SocialFetchResult, SocialPost};
use super::service::SharedSocialDataService;

#[tauri::command]
pub async fn social_fetch_reddit(
    subreddit: String,
    query: Option<String>,
    limit: Option<u32>,
    token: Option<String>,
    service: State<'_, SharedSocialDataService>,
) -> Result<SocialFetchResult, String> {
    let srv = service.read().await;
    srv.fetch_reddit(&subreddit, query.as_deref(), limit, token.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn social_search_reddit_mentions(
    subreddits: Vec<String>,
    keyword: String,
    limit: Option<u32>,
    token: Option<String>,
    service: State<'_, SharedSocialDataService>,
) -> Result<Vec<SocialFetchResult>, String> {
    let srv = service.read().await;
    let subreddit_refs: Vec<&str> = subreddits.iter().map(|s| s.as_str()).collect();
    srv.search_reddit_mentions(&subreddit_refs, &keyword, limit, token.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn social_fetch_twitter(
    query: String,
    max_results: Option<u32>,
    token: Option<String>,
    bearer_token_override: Option<String>,
    service: State<'_, SharedSocialDataService>,
    keystore: State<'_, Keystore>,
) -> Result<SocialFetchResult, String> {
    let srv = service.read().await;
    srv.fetch_twitter(
            &query,
            max_results,
            token.as_deref(),
            bearer_token_override.as_deref(),
            Some(&keystore)
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn social_fetch_twitter_user(
    username: String,
    max_results: Option<u32>,
    token: Option<String>,
    bearer_token_override: Option<String>,
    service: State<'_, SharedSocialDataService>,
    keystore: State<'_, Keystore>,
) -> Result<SocialFetchResult, String> {
    let srv = service.read().await;
    srv.fetch_twitter_user(
            &username,
            max_results,
            token.as_deref(),
            bearer_token_override.as_deref(),
            Some(&keystore)
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn social_get_cached_mentions(
    source: Option<String>,
    token: Option<String>,
    limit: Option<i32>,
    service: State<'_, SharedSocialDataService>,
) -> Result<Vec<SocialPost>, String> {
    let srv = service.read().await;
    srv.get_cached_posts(source.as_deref(), token.as_deref(), limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn social_get_mention_aggregates(
    token: Option<String>,
    service: State<'_, SharedSocialDataService>,
) -> Result<Vec<MentionAggregate>, String> {
    let srv = service.read().await;
    srv.get_mention_aggregates(token.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn social_get_trend_snapshots(
    token: String,
    hours: Option<i64>,
    service: State<'_, SharedSocialDataService>,
) -> Result<Vec<TrendSnapshot>, String> {
    let srv = service.read().await;
    srv.get_trend_snapshots(&token, hours)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn social_create_trend_snapshot(
    token: String,
    source: String,
    service: State<'_, SharedSocialDataService>,
) -> Result<(), String> {
    let srv = service.read().await;
    srv.create_trend_snapshot(&token, &source)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn social_set_twitter_bearer_token(
    bearer_token: String,
    service: State<'_, SharedSocialDataService>,
    keystore: State<'_, Keystore>,
) -> Result<(), String> {
    let srv = service.read().await;
    srv.set_twitter_bearer_token(&keystore, &bearer_token)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn social_cleanup_old_posts(
    days: i64,
    service: State<'_, SharedSocialDataService>,
) -> Result<i64, String> {
    let srv = service.read().await;
    srv.cleanup_old_posts(days)
        .await
        .map_err(|e| e.to_string())
}
