use super::types::{ApiRateLimitStatus, EngagementMetrics, Influencer, SocialMention, SocialPlatform};
use async_trait::async_trait;
use chrono::Utc;
use reqwest::StatusCode;
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone)]
pub struct SourceMentions {
    pub mentions: Vec<SocialMention>,
    pub rate_limit: ApiRateLimitStatus,
}

#[async_trait]
pub trait SocialSource: Send + Sync {
    fn name(&self) -> &'static str;
    async fn fetch_mentions(&self, influencers: &[Influencer]) -> anyhow::Result<SourceMentions>;
}

#[derive(Default)]
struct RateLimitTracker {
    window_start: i64,
    request_count: u32,
    limit: u32,
}

impl RateLimitTracker {
    fn new(limit: u32) -> Self {
        Self {
            window_start: 0,
            request_count: 0,
            limit,
        }
    }

    fn check(&mut self) -> bool {
        let now = Utc::now().timestamp();
        if now - self.window_start >= 60 {
            self.window_start = now;
            self.request_count = 0;
        }
        if self.request_count < self.limit {
            self.request_count += 1;
            true
        } else {
            false
        }
    }
}

pub struct TwitterClient {
    http: reqwest::Client,
    bearer_token: Option<String>,
    rate_tracker: Mutex<RateLimitTracker>,
}

impl TwitterClient {
    pub fn new(bearer_token: Option<String>, limit: u32) -> Self {
        Self {
            http: reqwest::Client::new(),
            bearer_token,
            rate_tracker: Mutex::new(RateLimitTracker::new(limit)),
        }
    }

    async fn fetch_from_api(
        &self,
        influencers: &[Influencer],
    ) -> anyhow::Result<SourceMentions> {
        let token = self
            .bearer_token
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Missing TWITTER_BEARER_TOKEN"))?;
        let handles: Vec<String> = influencers
            .iter()
            .map(|i| i.handle.trim_start_matches('@').to_string())
            .collect();
        if handles.is_empty() {
            return Ok(SourceMentions {
                mentions: Vec::new(),
                rate_limit: ApiRateLimitStatus {
                    source: "twitter".to_string(),
                    limit: Some(0),
                    remaining: Some(0),
                    reset_at: None,
                    last_error: None,
                },
            });
        }
        let query = handles
            .iter()
            .map(|h| format!("from:{}", h))
            .collect::<Vec<_>>()
            .join(" OR ");
        let url = "https://api.twitter.com/2/tweets/search/recent";
        let mut request = self
            .http
            .get(url)
            .bearer_auth(token)
            .query(&[
                ("query", query.as_str()),
                ("tweet.fields", "created_at,public_metrics,author_id"),
                ("expansions", "author_id"),
            ]);
        let response = request.send().await?;
        let limit = response
            .headers()
            .get("x-rate-limit-limit")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.parse::<u32>().ok());
        let remaining = response
            .headers()
            .get("x-rate-limit-remaining")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.parse::<u32>().ok());
        let reset_at = response
            .headers()
            .get("x-rate-limit-reset")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.parse::<i64>().ok());

        if response.status() != StatusCode::OK {
            return Err(anyhow::anyhow!("Twitter API error: {:?}", response.status()));
        }

        let body: TwitterResponse = response.json().await.unwrap_or_default();
        let mut author_lookup = HashMap::new();
        if let Some(users) = body.includes.and_then(|i| i.users) {
            for user in users {
                author_lookup.insert(user.id, user.username);
            }
        }

        let mentions = body
            .data
            .unwrap_or_default()
            .into_iter()
            .map(|tweet| {
                let sentiment = crate::sentiment::analyze_sentiment(&tweet.text);
                SocialMention {
                    id: tweet.id,
                    platform: SocialPlatform::Twitter,
                    author: author_lookup
                        .get(&tweet.author_id)
                        .cloned()
                        .unwrap_or_else(|| tweet.author_id.clone()),
                    author_id: tweet.author_id,
                    content: tweet.text,
                    token_address: None,
                    token_symbol: None,
                    timestamp: tweet
                        .created_at
                        .and_then(|ts| chrono::DateTime::parse_from_rfc3339(&ts).ok())
                        .map(|dt| dt.timestamp())
                        .unwrap_or_else(|| Utc::now().timestamp()),
                    engagement: EngagementMetrics {
                        likes: tweet.public_metrics.like_count,
                        retweets: tweet.public_metrics.retweet_count,
                        replies: tweet.public_metrics.reply_count,
                        views: tweet.public_metrics.quote_count,
                    },
                    sentiment_score: sentiment.score,
                    sentiment_label: sentiment.label,
                    influencer_id: influencers
                        .iter()
                        .find(|i| i.handle.trim_start_matches('@')
                            == author_lookup
                                .get(&tweet.author_id)
                                .map(|s| s.as_str())
                                .unwrap_or(&tweet.author_id))
                        .map(|i| i.id.clone()),
                    url: format!("https://twitter.com/i/web/status/{}", tweet.id),
                }
            })
            .collect();

        Ok(SourceMentions {
            mentions,
            rate_limit: ApiRateLimitStatus {
                source: "twitter".to_string(),
                limit,
                remaining,
                reset_at,
                last_error: None,
            },
        })
    }

    fn generate_fallback(&self, influencers: &[Influencer]) -> SourceMentions {
        let now = Utc::now().timestamp();
        let mentions: Vec<SocialMention> = influencers
            .iter()
            .enumerate()
            .map(|(idx, influencer)| SocialMention {
                id: format!("twitter-mock-{}", idx),
                platform: SocialPlatform::Twitter,
                author: influencer.handle.clone(),
                author_id: influencer.id.clone(),
                content: format!(
                    "{} is discussing SOL's breakout potential with sentiment shift.",
                    influencer.handle
                ),
                token_address: Some("So11111111111111111111111111111111111111112".to_string()),
                token_symbol: Some("SOL".to_string()),
                timestamp: now - (idx as i64 * 120),
                engagement: EngagementMetrics {
                    likes: 1200 + idx as i64 * 23,
                    retweets: 340 + idx as i64 * 9,
                    replies: 45 + idx as i64 * 4,
                    views: 15000 + idx as i64 * 120,
                },
                sentiment_score: 0.45 + (idx as f64 * 0.05),
                sentiment_label: "positive".to_string(),
                influencer_id: Some(influencer.id.clone()),
                url: "https://twitter.com/example".to_string(),
            })
            .collect();

        SourceMentions {
            mentions,
            rate_limit: ApiRateLimitStatus {
                source: "twitter".to_string(),
                limit: Some(15),
                remaining: Some(14),
                reset_at: Some(now + 60),
                last_error: Some("Using fallback data".to_string()),
            },
        }
    }
}

#[async_trait]
impl SocialSource for TwitterClient {
    fn name(&self) -> &'static str {
        "twitter"
    }

    async fn fetch_mentions(&self, influencers: &[Influencer]) -> anyhow::Result<SourceMentions> {
        if !self.rate_tracker.lock().unwrap().check() {
            return Ok(SourceMentions {
                mentions: Vec::new(),
                rate_limit: ApiRateLimitStatus {
                    source: "twitter".to_string(),
                    limit: Some(15),
                    remaining: Some(0),
                    reset_at: Some(Utc::now().timestamp() + 30),
                    last_error: Some("Rate limit reached".to_string()),
                },
            });
        }

        match self.fetch_from_api(influencers).await {
            Ok(result) => Ok(result),
            Err(error) => {
                tracing::warn!("Twitter API fallback used: {}", error);
                Ok(self.generate_fallback(influencers))
            }
        }
    }
}

pub struct RedditClient {
    http: reqwest::Client,
    client_id: Option<String>,
    client_secret: Option<String>,
    rate_tracker: Mutex<RateLimitTracker>,
}

impl RedditClient {
    pub fn new(client_id: Option<String>, client_secret: Option<String>, limit: u32) -> Self {
        Self {
            http: reqwest::Client::new(),
            client_id,
            client_secret,
            rate_tracker: Mutex::new(RateLimitTracker::new(limit)),
        }
    }

    async fn fetch_from_api(
        &self,
        influencers: &[Influencer],
    ) -> anyhow::Result<SourceMentions> {
        let client_id = self
            .client_id
            .clone()
            .ok_or_else(|| anyhow::anyhow!("Missing REDDIT_CLIENT_ID"))?;
        let client_secret = self
            .client_secret
            .clone()
            .ok_or_else(|| anyhow::anyhow!("Missing REDDIT_CLIENT_SECRET"))?;

        let auth = format!("{}:{}", client_id, client_secret);
        let encoded = base64::encode(auth);
        let token_resp = self
            .http
            .post("https://www.reddit.com/api/v1/access_token")
            .header("Authorization", format!("Basic {}", encoded))
            .form(&[
                ("grant_type", "client_credentials"),
                ("duration", "temporary"),
            ])
            .send()
            .await?;

        if token_resp.status() != StatusCode::OK {
            return Err(anyhow::anyhow!(
                "Reddit auth failed: {:?}",
                token_resp.status()
            ));
        }

        let token: RedditTokenResponse = token_resp.json().await.unwrap_or_default();
        let mut mentions = Vec::new();
        for influencer in influencers {
            let query = influencer.handle.trim_start_matches('@');
            let response = self
                .http
                .get("https://oauth.reddit.com/search")
                .bearer_auth(&token.access_token)
                .query(&[
                    ("q", query),
                    ("limit", "10"),
                    ("sort", "new"),
                    ("restrict_sr", "false"),
                ])
                .send()
                .await?;

            if response.status() != StatusCode::OK {
                tracing::warn!("Reddit search failed: {}", response.status());
                continue;
            }

            let data: RedditSearchResponse = response.json().await.unwrap_or_default();
            mentions.extend(
                data.data
                    .children
                    .into_iter()
                    .map(|child| child.data)
                    .map(|post| {
                        let sentiment = crate::sentiment::analyze_sentiment(&post.title);
                        SocialMention {
                            id: post.id.clone(),
                            platform: SocialPlatform::Reddit,
                            author: post.author,
                            author_id: post.author_fullname.unwrap_or_default(),
                            content: post.selftext.unwrap_or(post.title.clone()),
                            token_address: None,
                            token_symbol: None,
                            timestamp: post.created_utc as i64,
                            engagement: EngagementMetrics {
                                likes: post.ups as i64,
                                retweets: post.downs as i64,
                                replies: post.num_comments as i64,
                                views: post.view_count.unwrap_or(0) as i64,
                            },
                            sentiment_score: sentiment.score,
                            sentiment_label: sentiment.label,
                            influencer_id: Some(influencer.id.clone()),
                            url: format!("https://reddit.com{}", post.permalink),
                        }
                    })
                    .collect::<Vec<_>>(),
            );
        }

        Ok(SourceMentions {
            mentions,
            rate_limit: ApiRateLimitStatus {
                source: "reddit".to_string(),
                limit: Some(60),
                remaining: None,
                reset_at: None,
                last_error: None,
            },
        })
    }

    fn generate_fallback(&self, influencers: &[Influencer]) -> SourceMentions {
        let now = Utc::now().timestamp();
        let mentions: Vec<SocialMention> = influencers
            .iter()
            .enumerate()
            .map(|(idx, influencer)| SocialMention {
                id: format!("reddit-mock-{}", idx),
                platform: SocialPlatform::Reddit,
                author: influencer.handle.clone(),
                author_id: influencer.id.clone(),
                content: format!(
                    "Discussion on r/solana about {}'s latest insights.",
                    influencer.handle
                ),
                token_address: Some("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN".to_string()),
                token_symbol: Some("JUP".to_string()),
                timestamp: now - (idx as i64 * 240),
                engagement: EngagementMetrics {
                    likes: 540 + idx as i64 * 12,
                    retweets: 80 + idx as i64 * 4,
                    replies: 120 + idx as i64 * 6,
                    views: 6000 + idx as i64 * 210,
                },
                sentiment_score: 0.2 - (idx as f64 * 0.05),
                sentiment_label: if idx % 2 == 0 {
                    "neutral".to_string()
                } else {
                    "negative".to_string()
                },
                influencer_id: Some(influencer.id.clone()),
                url: "https://reddit.com/example".to_string(),
            })
            .collect();

        SourceMentions {
            mentions,
            rate_limit: ApiRateLimitStatus {
                source: "reddit".to_string(),
                limit: Some(60),
                remaining: Some(58),
                reset_at: Some(now + 60),
                last_error: Some("Using fallback data".to_string()),
            },
        }
    }
}

#[async_trait]
impl SocialSource for RedditClient {
    fn name(&self) -> &'static str {
        "reddit"
    }

    async fn fetch_mentions(&self, influencers: &[Influencer]) -> anyhow::Result<SourceMentions> {
        if !self.rate_tracker.lock().unwrap().check() {
            return Ok(SourceMentions {
                mentions: Vec::new(),
                rate_limit: ApiRateLimitStatus {
                    source: "reddit".to_string(),
                    limit: Some(60),
                    remaining: Some(0),
                    reset_at: Some(Utc::now().timestamp() + 45),
                    last_error: Some("Rate limit reached".to_string()),
                },
            });
        }

        match self.fetch_from_api(influencers).await {
            Ok(result) => Ok(result),
            Err(error) => {
                tracing::warn!("Reddit API fallback used: {}", error);
                Ok(self.generate_fallback(influencers))
            }
        }
    }
}

#[derive(Debug, Deserialize, Default)]
struct TwitterResponse {
    #[serde(default)]
    data: Option<Vec<TwitterTweet>>,
    #[serde(default)]
    includes: Option<TwitterIncludes>,
}

#[derive(Debug, Deserialize)]
struct TwitterTweet {
    id: String,
    text: String,
    author_id: String,
    created_at: Option<String>,
    #[serde(default)]
    public_metrics: TwitterPublicMetrics,
}

#[derive(Debug, Deserialize, Default)]
struct TwitterPublicMetrics {
    #[serde(default)]
    like_count: i64,
    #[serde(default)]
    retweet_count: i64,
    #[serde(default)]
    reply_count: i64,
    #[serde(default)]
    quote_count: i64,
}

#[derive(Debug, Deserialize, Default)]
struct TwitterIncludes {
    #[serde(default)]
    users: Option<Vec<TwitterUser>>,
}

#[derive(Debug, Deserialize)]
struct TwitterUser {
    id: String,
    username: String,
}

#[derive(Debug, Deserialize, Default)]
struct RedditTokenResponse {
    access_token: String,
    token_type: Option<String>,
    expires_in: Option<i64>,
}

#[derive(Debug, Deserialize, Default)]
struct RedditSearchResponse {
    data: RedditSearchData,
}

#[derive(Debug, Deserialize, Default)]
struct RedditSearchData {
    children: Vec<RedditPostWrapper>,
}

#[derive(Debug, Deserialize, Default)]
struct RedditPostWrapper {
    data: RedditPost,
}

#[derive(Debug, Deserialize, Default)]
struct RedditPost {
    id: String,
    title: String,
    #[serde(default)]
    permalink: String,
    #[serde(default)]
    author: String,
    #[serde(default)]
    author_fullname: Option<String>,
    #[serde(default)]
    selftext: Option<String>,
    #[serde(default)]
    ups: i64,
    #[serde(default)]
    downs: i64,
    #[serde(default)]
    num_comments: i64,
    #[serde(default)]
    view_count: Option<i64>,
    #[serde(default)]
    created_utc: i64,
}
