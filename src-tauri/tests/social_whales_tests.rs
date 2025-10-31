#[cfg(test)]
mod whale_tests {
    use chrono::Utc;
    use sqlx::SqlitePool;
    use serde_json;

    use crate::insiders::WalletActivity;
    use crate::social::whales::WhaleService;

    async fn create_test_pool() -> SqlitePool {
        SqlitePool::connect("sqlite::memory:").await.unwrap()
    }

    async fn setup_whale_service() -> WhaleService {
        let pool = create_test_pool().await;
        let service = WhaleService::new(pool);
        service.initialize().await.unwrap();
        service
    }

    fn create_test_activities() -> Vec<WalletActivity> {
        vec![
            WalletActivity {
                id: "1".to_string(),
                wallet_address: "wallet1".to_string(),
                wallet_label: Some("Whale 1".to_string()),
                tx_signature: "sig1".to_string(),
                action_type: "buy".to_string(),
                input_mint: Some("SOL".to_string()),
                output_mint: Some("TOKEN_A".to_string()),
                input_symbol: Some("SOL".to_string()),
                output_symbol: Some("TOKEN_A".to_string()),
                amount: Some(100.0),
                amount_usd: Some(100000.0),
                price: Some(1000.0),
                is_whale: true,
                timestamp: Utc::now(),
            },
            WalletActivity {
                id: "2".to_string(),
                wallet_address: "wallet2".to_string(),
                wallet_label: Some("Whale 2".to_string()),
                tx_signature: "sig2".to_string(),
                action_type: "buy".to_string(),
                input_mint: Some("SOL".to_string()),
                output_mint: Some("TOKEN_A".to_string()),
                input_symbol: Some("SOL".to_string()),
                output_symbol: Some("TOKEN_A".to_string()),
                amount: Some(200.0),
                amount_usd: Some(200000.0),
                price: Some(1000.0),
                is_whale: true,
                timestamp: Utc::now(),
            },
            WalletActivity {
                id: "3".to_string(),
                wallet_address: "wallet3".to_string(),
                wallet_label: Some("Whale 3".to_string()),
                tx_signature: "sig3".to_string(),
                action_type: "buy".to_string(),
                input_mint: Some("SOL".to_string()),
                output_mint: Some("TOKEN_B".to_string()),
                input_symbol: Some("SOL".to_string()),
                output_symbol: Some("TOKEN_B".to_string()),
                amount: Some(50.0),
                amount_usd: Some(50000.0),
                price: Some(1000.0),
                is_whale: true,
                timestamp: Utc::now(),
            },
        ]
    }

    #[tokio::test]
    async fn test_whale_clustering() {
        let service = setup_whale_service().await;
        let activities = create_test_activities();

        let clusters = service.cluster_whales(&activities).await.unwrap();

        // Should have at least one cluster
        assert!(!clusters.is_empty());

        // Wallets trading same token should be in same cluster
        let first_cluster = &clusters[0];
        let wallet_addresses: Vec<String> = serde_json::from_str(&first_cluster.wallet_addresses).unwrap();
        
        assert!(wallet_addresses.contains(&"wallet1".to_string()) || wallet_addresses.contains(&"wallet2".to_string()));
    }

    #[tokio::test]
    async fn test_follow_unfollow_wallet() {
        let service = setup_whale_service().await;

        // Follow a wallet
        let followed = service
            .follow_wallet(
                "test_wallet".to_string(),
                Some("Test Whale".to_string()),
                None,
                5,
            )
            .await
            .unwrap();

        assert_eq!(followed.wallet_address, "test_wallet");
        assert_eq!(followed.label, Some("Test Whale".to_string()));
        assert_eq!(followed.priority, 5);

        // List followed wallets
        let wallets = service.get_followed_wallets().await.unwrap();
        assert_eq!(wallets.len(), 1);
        assert_eq!(wallets[0].wallet_address, "test_wallet");

        // Unfollow wallet
        service.unfollow_wallet("test_wallet").await.unwrap();

        let wallets_after = service.get_followed_wallets().await.unwrap();
        assert_eq!(wallets_after.len(), 0);
    }

    #[tokio::test]
    async fn test_whale_correlation_calculation() {
        let service = setup_whale_service().await;
        
        // Create test wallet with activities
        let wallet = "correlation_test_wallet";
        let activities = vec![
            WalletActivity {
                id: "1".to_string(),
                wallet_address: wallet.to_string(),
                wallet_label: None,
                tx_signature: "sig1".to_string(),
                action_type: "buy".to_string(),
                input_mint: None,
                output_mint: Some("TOKEN_X".to_string()),
                input_symbol: None,
                output_symbol: Some("TOKEN_X".to_string()),
                amount: Some(1000.0),
                amount_usd: Some(1000000.0),
                price: Some(1000.0),
                is_whale: true,
                timestamp: Utc::now(),
            },
        ];

        let correlation = service
            .calculate_whale_correlations(wallet, &activities)
            .await
            .unwrap();

        // Should have a valid correlation object
        assert_eq!(correlation.wallet_address, wallet);
        assert!(correlation.correlation_score >= 0.0);
    }

    #[tokio::test]
    async fn test_get_whale_insights() {
        let service = setup_whale_service().await;

        // Follow a wallet first
        service
            .follow_wallet(
                "insight_test_wallet".to_string(),
                Some("Insight Test".to_string()),
                None,
                0,
            )
            .await
            .unwrap();

        // Get insights
        let insights = service
            .get_whale_insights("insight_test_wallet")
            .await
            .unwrap();

        assert_eq!(insights.wallet_address, "insight_test_wallet");
        assert_eq!(insights.wallet_label, Some("Insight Test".to_string()));
        assert!(insights.social_activity_score >= 0.0);
        assert!(insights.onchain_activity_score >= 0.0);
    }

    #[tokio::test]
    async fn test_whale_feed_generation() {
        let service = setup_whale_service().await;

        // Follow some wallets
        service
            .follow_wallet("feed_wallet_1".to_string(), None, None, 0)
            .await
            .unwrap();

        service
            .follow_wallet("feed_wallet_2".to_string(), None, None, 0)
            .await
            .unwrap();

        // Get feed
        let feed = service.get_whale_feed(50).await.unwrap();

        // Feed should be initially empty (no activity yet)
        assert_eq!(feed.len(), 0);
    }

    #[tokio::test]
    async fn test_cluster_score_calculation() {
        let service = setup_whale_service().await;
        let activities = create_test_activities();

        let clusters = service.cluster_whales(&activities).await.unwrap();

        for cluster in clusters {
            // Cluster score should be positive
            assert!(cluster.cluster_score > 0.0);
            
            // Member count should match wallet count
            let wallets: Vec<String> = serde_json::from_str(&cluster.wallet_addresses).unwrap();
            assert_eq!(cluster.member_count as usize, wallets.len());
        }
    }
}
