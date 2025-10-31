use app_lib::social::*;
use chrono::Utc;

#[test]
fn test_influencer_manager_add_remove() {
    let mut manager = InfluencerManager::new();
    
    let influencer = Influencer {
        id: "test-1".to_string(),
        name: "Test Influencer".to_string(),
        platform: SocialPlatform::Twitter,
        handle: "@testinfluencer".to_string(),
        follower_count: 50000,
        verified: true,
        influence_score: 0.75,
        active: true,
        tags: vec!["test".to_string()],
        added_at: Utc::now().timestamp(),
    };
    
    assert!(manager.add_influencer(influencer.clone()).is_ok());
    assert!(manager.get_influencer("test-1").is_some());
    assert!(manager.remove_influencer("test-1").is_ok());
    assert!(manager.get_influencer("test-1").is_none());
}

#[test]
fn test_whale_tracker_follow() {
    let mut tracker = WhaleTracker::new();
    let address = "TestWhale111".to_string();
    
    assert!(tracker.follow_wallet(address.clone()).is_ok());
    assert!(tracker.followed_wallets.contains(&address));
    assert!(tracker.unfollow_wallet(&address).is_ok());
    assert!(!tracker.followed_wallets.contains(&address));
}

#[test]
fn test_sentiment_analyzer_aggregate() {
    let analyzer = EnhancedSentimentAnalyzer::new();
    let now = Utc::now().timestamp();
    
    let mentions = vec![
        SocialMention {
            id: "1".to_string(),
            platform: SocialPlatform::Twitter,
            author: "user1".to_string(),
            author_id: "uid1".to_string(),
            content: "Great project!".to_string(),
            token_address: Some("SOL".to_string()),
            token_symbol: Some("SOL".to_string()),
            timestamp: now,
            engagement: EngagementMetrics {
                likes: 100,
                retweets: 20,
                replies: 5,
                views: 1000,
            },
            sentiment_score: 0.7,
            sentiment_label: "positive".to_string(),
            influencer_id: None,
            url: "https://twitter.com/test".to_string(),
        },
        SocialMention {
            id: "2".to_string(),
            platform: SocialPlatform::Reddit,
            author: "user2".to_string(),
            author_id: "uid2".to_string(),
            content: "Not sure about this...".to_string(),
            token_address: Some("SOL".to_string()),
            token_symbol: Some("SOL".to_string()),
            timestamp: now,
            engagement: EngagementMetrics {
                likes: 50,
                retweets: 5,
                replies: 10,
                views: 500,
            },
            sentiment_score: -0.2,
            sentiment_label: "negative".to_string(),
            influencer_id: None,
            url: "https://reddit.com/test".to_string(),
        },
    ];
    
    let agg_score = analyzer.aggregate_mentions(&mentions);
    assert!(agg_score > -1.0 && agg_score < 1.0);
}

#[test]
fn test_fomo_fud_gauge() {
    let analyzer = EnhancedSentimentAnalyzer::new();
    let now = Utc::now().timestamp();
    
    let mentions = vec![
        SocialMention {
            id: "1".to_string(),
            platform: SocialPlatform::Twitter,
            author: "user1".to_string(),
            author_id: "uid1".to_string(),
            content: "To the moon!".to_string(),
            token_address: Some("SOL".to_string()),
            token_symbol: Some("SOL".to_string()),
            timestamp: now,
            engagement: EngagementMetrics {
                likes: 1000,
                retweets: 200,
                replies: 50,
                views: 10000,
            },
            sentiment_score: 0.8,
            sentiment_label: "positive".to_string(),
            influencer_id: None,
            url: "https://twitter.com/test".to_string(),
        },
    ];
    
    let gauge = analyzer.calculate_fomo_fud_gauge("SOL", "SOL", &mentions);
    assert!(gauge.fomo_score > 0.0);
    assert_eq!(gauge.token_symbol, "SOL");
}

#[test]
fn test_trend_detector() {
    let mut detector = TrendDetector::new();
    let now = Utc::now().timestamp();
    
    let mentions = vec![
        SocialMention {
            id: "1".to_string(),
            platform: SocialPlatform::Twitter,
            author: "user1".to_string(),
            author_id: "uid1".to_string(),
            content: "Test token trending".to_string(),
            token_address: Some("TEST".to_string()),
            token_symbol: Some("TEST".to_string()),
            timestamp: now,
            engagement: EngagementMetrics {
                likes: 100,
                retweets: 20,
                replies: 5,
                views: 1000,
            },
            sentiment_score: 0.5,
            sentiment_label: "positive".to_string(),
            influencer_id: None,
            url: "https://twitter.com/test".to_string(),
        },
    ];
    
    let trends = detector.update_trends(&mentions, None);
    assert_eq!(trends.len(), 1);
    assert_eq!(trends[0].token_symbol, "TEST");
    assert_eq!(trends[0].mention_count, 1);
}

#[test]
fn test_momentum_scoring() {
    let engine = SocialScoringEngine::new();
    let now = Utc::now().timestamp();
    
    let mentions = vec![
        SocialMention {
            id: "1".to_string(),
            platform: SocialPlatform::Twitter,
            author: "user1".to_string(),
            author_id: "uid1".to_string(),
            content: "Bullish!".to_string(),
            token_address: Some("SOL".to_string()),
            token_symbol: Some("SOL".to_string()),
            timestamp: now,
            engagement: EngagementMetrics {
                likes: 500,
                retweets: 100,
                replies: 20,
                views: 5000,
            },
            sentiment_score: 0.8,
            sentiment_label: "positive".to_string(),
            influencer_id: Some("inf1".to_string()),
            url: "https://twitter.com/test".to_string(),
        },
    ];
    
    let whale_movements = vec![];
    let influencer_mentions = mentions.clone();
    
    let momentum = engine.compute_momentum(
        "SOL",
        "SOL",
        &mentions,
        &whale_movements,
        &influencer_mentions,
    );
    
    assert_eq!(momentum.token_symbol, "SOL");
    assert!(momentum.momentum_score >= 0.0 && momentum.momentum_score <= 1.0);
    assert!(momentum.sentiment_score >= 0.0 && momentum.sentiment_score <= 1.0);
}
