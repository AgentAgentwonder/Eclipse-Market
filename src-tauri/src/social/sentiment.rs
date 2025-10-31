use crate::sentiment::analyze_sentiment;
use super::storage::{SentimentHistory, SocialMention};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct PeriodSentiment {
    pub period: String,
    pub score: f32,
    pub change: f32,
    pub mention_count: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct KeywordScore {
    pub keyword: String,
    pub sentiment: String,
    pub occurrences: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct SentimentBreakdown {
    pub positive_count: i32,
    pub neutral_count: i32,
    pub negative_count: i32,
    pub platform_scores: HashMap<String, f32>,
    pub top_positive_keywords: Vec<KeywordScore>,
    pub top_negative_keywords: Vec<KeywordScore>,
    pub engagement_total: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct FomoFudScores {
    pub token: String,
    pub token_address: String,
    pub fomo_score: f32,
    pub fud_score: f32,
    pub contrarian_signal: Option<String>,
    pub extreme: bool,
    pub sample_fomo_messages: Vec<String>,
    pub sample_fud_messages: Vec<String>,
    pub last_updated: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct SentimentSummary {
    pub token: String,
    pub token_address: String,
    pub current_score: f32,
    pub label: String,
    pub confidence: f32,
    pub change_24h: f32,
    pub multi_timeframe: Vec<PeriodSentiment>,
    pub breakdown: SentimentBreakdown,
    pub history: Vec<SentimentHistory>,
    pub fomo_fud: FomoFudScores,
}

pub struct SentimentEngine;

impl SentimentEngine {
    pub fn new() -> Self {
        Self
    }

    pub fn analyze_mentions(
        &self,
        token: &str,
        token_address: &str,
        mentions: &[SocialMention],
        history: &[SentimentHistory],
    ) -> SentimentSummary {
        let (score, label, confidence) = self.calculate_current_score(mentions, history);
        let change_24h = self.calculate_24h_change(history, score);
        let multi_timeframe = self.calculate_multi_timeframe(history);
        let breakdown = self.calculate_breakdown(mentions);
        let fomo_fud = self.calculate_fomo_fud(token, token_address, mentions, history);

        SentimentSummary {
            token: token.to_string(),
            token_address: token_address.to_string(),
            current_score: score,
            label,
            confidence,
            change_24h,
            multi_timeframe,
            breakdown,
            history: history.to_vec(),
            fomo_fud,
        }
    }

    pub fn calculate_fomo_fud(
        &self,
        token: &str,
        token_address: &str,
        mentions: &[SocialMention],
        history: &[SentimentHistory],
    ) -> FomoFudScores {
        let fomo_keywords = [
            "rocket", "moon", "pump", "now", "instant", "ape", "100x", "don't miss",
            "urgent", "last chance", "fire", "🚀", "📈", "🔥", "parabolic",
        ];
        let fud_keywords = [
            "dump", "crash", "rug", "exit", "sell", "scam", "bearish", "panic",
            "fear", "concern", "warning", "risk", "📉", "💀", "rekt", "collapse",
        ];

        let mut fomo_score = 0.0;
        let mut fud_score = 0.0;
        let mut fomo_messages = Vec::new();
        let mut fud_messages = Vec::new();

        for mention in mentions.iter().take(50) {
            let text = mention.content.to_lowercase();
            let mut mention_fomo = 0.0;
            let mut mention_fud = 0.0;

            for keyword in fomo_keywords.iter() {
                if text.contains(keyword) {
                    mention_fomo += 5.0;
                }
            }
            for keyword in fud_keywords.iter() {
                if text.contains(keyword) {
                    mention_fud += 5.0;
                }
            }

            if mention_fomo > 0.0 {
                fomo_messages.push(mention.content.clone());
            }
            if mention_fud > 0.0 {
                fud_messages.push(mention.content.clone());
            }

            fomo_score += mention_fomo * (1.0 + (mention.engagement as f32 / 1000.0));
            fud_score += mention_fud * (1.0 + (mention.engagement as f32 / 1000.0));
        }

        // normalize scores to 0-100 range
        let fomo_score = (fomo_score / 10.0).min(100.0);
        let fud_score = (fud_score / 10.0).min(100.0);

        let contrarian_signal = if fomo_score > 80.0 && fud_score < 20.0 {
            Some("Extreme FOMO - Consider taking profits".to_string())
        } else if fud_score > 80.0 && fomo_score < 20.0 {
            Some("Extreme FUD - Potential buying opportunity".to_string())
        } else if fomo_score > 60.0 && fud_score > 60.0 {
            Some("Mixed signals - likely bot-driven or conflicting narratives".to_string())
        } else {
            None
        };

        let last_updated = history
            .first()
            .map(|h| h.timestamp)
            .unwrap_or_else(|| Utc::now().timestamp());

        FomoFudScores {
            token: token.to_string(),
            token_address: token_address.to_string(),
            fomo_score,
            fud_score,
            contrarian_signal,
            extreme: fomo_score > 80.0 || fud_score > 80.0,
            sample_fomo_messages: fomo_messages.into_iter().take(3).collect(),
            sample_fud_messages: fud_messages.into_iter().take(3).collect(),
            last_updated,
        }
    }

    pub fn calculate_current_score(
        &self,
        mentions: &[SocialMention],
        history: &[SentimentHistory],
    ) -> (f32, String, f32) {
        if mentions.is_empty() && history.is_empty() {
            return (0.0, "neutral".to_string(), 0.0);
        }

        let mut total_score = 0.0;
        let mut total_weight = 0.0;

        for mention in mentions.iter().take(100) {
            // combine existing sentiment score with fallback analyze
            let sentiment_score = if mention.sentiment_score.abs() > 0.01 {
                mention.sentiment_score
            } else {
                analyze_sentiment(&mention.content).score
            };

            let credibility_bonus = if mention.author_verified { 0.2 } else { 0.0 };
            let follower_weight = (mention.author_followers as f32 / 1_000_000.0).min(0.5);
            let engagement_weight = (mention.engagement as f32 / 10_000.0).min(1.0);

            let weight = 1.0 + credibility_bonus + follower_weight + engagement_weight;
            total_score += sentiment_score * weight;
            total_weight += weight;
        }

        if total_weight == 0.0 {
            if let Some(latest) = history.first() {
                let label = Self::label_from_score(latest.sentiment_score);
                return (latest.sentiment_score, label, latest.sentiment_score.abs().min(1.0));
            }
            return (0.0, "neutral".to_string(), 0.0);
        }

        let score = (total_score / total_weight).max(-1.0).min(1.0);
        let label = Self::label_from_score(score);
        let confidence = score.abs().min(1.0);
        (score, label, confidence)
    }

    fn calculate_breakdown(&self, mentions: &[SocialMention]) -> SentimentBreakdown {
        if mentions.is_empty() {
            return SentimentBreakdown::default();
        }

        let mut breakdown = SentimentBreakdown::default();
        let mut positive_keywords: HashMap<String, i32> = HashMap::new();
        let mut negative_keywords: HashMap<String, i32> = HashMap::new();

        for mention in mentions {
            let label = Self::label_from_score(mention.sentiment_score);
            match label.as_str() {
                "positive" => breakdown.positive_count += 1,
                "negative" => breakdown.negative_count += 1,
                _ => breakdown.neutral_count += 1,
            }

            *breakdown
                .platform_scores
                .entry(mention.platform.clone())
                .or_insert(0.0) += mention.sentiment_score;

            breakdown.engagement_total += mention.engagement;

            let words = mention
                .content
                .split_whitespace()
                .filter_map(|word| {
                    let clean = word
                        .trim_matches(|c: char| !c.is_alphanumeric())
                        .to_lowercase();
                    if clean.len() > 2 { Some(clean) } else { None }
                })
                .collect::<Vec<_>>();

            for word in words {
                if mention.sentiment_score >= 0.2 {
                    *positive_keywords.entry(word).or_insert(0) += 1;
                } else if mention.sentiment_score <= -0.2 {
                    *negative_keywords.entry(word).or_insert(0) += 1;
                }
            }
        }

        for (platform, score) in breakdown.platform_scores.iter_mut() {
            let total = breakdown.positive_count + breakdown.neutral_count + breakdown.negative_count;
            if total > 0 {
                *score /= total as f32;
            }
        }

        breakdown.top_positive_keywords = positive_keywords
            .into_iter()
            .map(|(keyword, occurrences)| KeywordScore {
                keyword,
                sentiment: "positive".to_string(),
                occurrences,
            })
            .collect::<Vec<_>>();

        breakdown.top_negative_keywords = negative_keywords
            .into_iter()
            .map(|(keyword, occurrences)| KeywordScore {
                keyword,
                sentiment: "negative".to_string(),
                occurrences,
            })
            .collect::<Vec<_>>();

        breakdown.top_positive_keywords.sort_by(|a, b| b.occurrences.cmp(&a.occurrences));
        breakdown.top_negative_keywords.sort_by(|a, b| b.occurrences.cmp(&a.occurrences));

        breakdown.top_positive_keywords.truncate(10);
        breakdown.top_negative_keywords.truncate(10);

        breakdown
    }

    fn calculate_multi_timeframe(&self, history: &[SentimentHistory]) -> Vec<PeriodSentiment> {
        let periods = vec![
            ("1H", Duration::hours(1)),
            ("24H", Duration::hours(24)),
            ("7D", Duration::days(7)),
        ];

        periods
            .into_iter()
            .map(|(label, duration)| {
                let now = Utc::now();
                let start = now - duration;
                let end = start - duration;

                let (current_score, current_mentions) = self.average_for_range(history, start.timestamp(), now.timestamp());
                let (previous_score, _) = self.average_for_range(history, end.timestamp(), start.timestamp());

                PeriodSentiment {
                    period: label.to_string(),
                    score: current_score,
                    change: current_score - previous_score,
                    mention_count: current_mentions,
                }
            })
            .collect()
    }

    fn average_for_range(
        &self,
        history: &[SentimentHistory],
        start: i64,
        end: i64,
    ) -> (f32, i32) {
        let mut total_score = 0.0;
        let mut total_mentions = 0;

        for entry in history {
            if entry.timestamp >= start && entry.timestamp <= end {
                total_score += entry.sentiment_score * entry.mention_count as f32;
                total_mentions += entry.mention_count;
            }
        }

        if total_mentions == 0 {
            (0.0, 0)
        } else {
            (total_score / total_mentions as f32, total_mentions)
        }
    }

    fn calculate_24h_change(&self, history: &[SentimentHistory], latest_score: f32) -> f32 {
        if history.is_empty() {
            return 0.0;
        }

        let now = Utc::now().timestamp();
        let day_ago = now - 24 * 60 * 60;

        let (score, _) = self.average_for_range(history, day_ago - 24 * 60 * 60, day_ago);
        latest_score - score
    }

    fn label_from_score(score: f32) -> String {
        if score > 0.2 {
            "positive".to_string()
        } else if score < -0.2 {
            "negative".to_string()
        } else {
            "neutral".to_string()
        }
    }
}
