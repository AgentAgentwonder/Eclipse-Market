# Whale Social Tracking Documentation

## Overview

The Whale Social Tracking system extends Eclipse Market Pro's social intelligence capabilities to monitor and correlate whale wallet behavior with social media sentiment. This system helps identify high-impact wallets whose social activity reliably predicts on-chain movements.

## Features

### 1. Wallet Clustering
Automatically groups whale wallets based on:
- **Transaction Overlap**: Wallets trading similar tokens
- **Shared Labels**: Wallets with related identifiers
- **Clustering Algorithm**: Uses >30% token overlap heuristic to form clusters
- **Cluster Scoring**: Calculates strength based on shared tokens and member count

### 2. Followed Wallet Feed
- **Wallet Following**: CRUD operations to manage your watched wallets
- **Activity Feed**: Chronological stream of social mentions and on-chain activity
- **Priority Ordering**: Rank followed wallets by importance
- **Real-time Updates**: Auto-refresh feed every 30 seconds

### 3. Behavioral Insights & Correlation
- **Social-to-Onchain Correlation**: Detects when wallets discuss tokens before trading them
- **Time Lag Analysis**: Measures average delay between social mention and on-chain activity
- **Correlation Scoring**: Higher scores indicate more reliable signal strength
- **Influencer Impact**: Combines follower count, engagement, and correlation strength

### 4. Sentiment Tracking
- **Trend Analysis**: Identifies bullish, bearish, or neutral sentiment patterns
- **Token Context**: Links sentiment to specific tokens mentioned
- **Historical Tracking**: Stores sentiment data for trend analysis

## Architecture

### Backend (Rust/Tauri)

#### Database Schema

**`whale_clusters`** - Stores wallet cluster information
```sql
CREATE TABLE whale_clusters (
    id TEXT PRIMARY KEY,
    cluster_name TEXT NOT NULL,
    wallet_addresses TEXT NOT NULL,  -- JSON array
    shared_tokens TEXT NOT NULL,     -- JSON array
    cluster_score REAL NOT NULL,
    member_count INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

**`followed_wallets`** - User's followed wallets
```sql
CREATE TABLE followed_wallets (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    label TEXT,
    cluster_id TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    followed_at TEXT NOT NULL,
    FOREIGN KEY (cluster_id) REFERENCES whale_clusters(id)
);
```

**`whale_social_mentions`** - Links social posts to wallets
```sql
CREATE TABLE whale_social_mentions (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    post_id TEXT NOT NULL,
    token TEXT NOT NULL,
    source TEXT NOT NULL,
    sentiment_score REAL NOT NULL,
    mentioned_at TEXT NOT NULL
);
```

**`whale_correlations`** - Social-onchain correlation data
```sql
CREATE TABLE whale_correlations (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    token TEXT NOT NULL,
    social_mentions_count INTEGER NOT NULL,
    avg_sentiment REAL NOT NULL,
    onchain_activity_count INTEGER NOT NULL,
    time_lag_seconds INTEGER NOT NULL,
    correlation_score REAL NOT NULL,
    created_at TEXT NOT NULL
);
```

#### Tauri Commands

**`social_get_whale_clusters()`**
- Returns all identified whale clusters
- Output: Array of `WhaleCluster` objects

**`social_get_whale_feed(limit: i32)`**
- Returns chronological feed of whale activity
- Combines social mentions and on-chain events
- Output: Array of `WhaleFeedEntry` objects

**`social_list_followed_wallets()`**
- Lists all wallets user is following
- Output: Array of `FollowedWallet` objects

**`social_follow_wallet(wallet_address, label?, cluster_id?, priority?)`**
- Adds a wallet to followed list
- Returns: `FollowedWallet` object

**`social_unfollow_wallet(wallet_address)`**
- Removes a wallet from followed list
- Returns: Success confirmation

**`social_get_whale_insights(wallet_address)`**
- Provides behavioral analysis for a specific wallet
- Returns: `WhaleInsight` object with metrics and trends

### Frontend (React/TypeScript)

#### Components

**`FollowedWalletFeed`** (`src/components/social/FollowedWalletFeed.tsx`)
- Displays activity feed for followed wallets
- Follow/unfollow interface
- Real-time updates
- Sentiment visualization

**`WhaleInsightsPanel`** (`src/components/social/WhaleInsightsPanel.tsx`)
- Shows whale clusters
- Displays behavioral metrics
- Correlation scoring
- Sentiment trends
- Token associations

**`SocialIntelligence`** (Page) (`src/pages/SocialIntelligence.tsx`)
- Main interface for whale tracking
- Tabs for feed and insights
- Integrated documentation

## Usage Guide

### Following a Wallet

1. Navigate to **Social Intelligence** page
2. Click **Followed Wallets Feed** tab
3. Enter wallet address in the input field
4. Optionally add a label for easier identification
5. Click **Follow** button

The wallet will now appear in your feed whenever:
- It's mentioned in social media posts
- It executes on-chain transactions
- Correlation events are detected

### Understanding Correlation Scores

Correlation scores indicate the reliability of social-to-onchain signals:

- **≥ 2.0**: High correlation - Reliable early warning indicator
- **1.0 - 2.0**: Moderate correlation - Worth monitoring
- **< 1.0**: Low correlation - Weak or inconsistent signal

**Formula:**
```
correlation_score = sqrt(mention_count * |avg_sentiment| * activity_count)
```

### Interpreting Whale Insights

#### Metrics Explained

- **Social Activity Score**: Number of social mentions linked to this wallet
- **On-chain Momentum**: Count of correlated on-chain activities
- **Correlation Score**: Strength of social-to-onchain signal
- **Influence Index**: Composite score: `sqrt(mention_count * correlation_score)`

#### Sentiment Trends

- **Bullish**: Average sentiment > 0.5, expect potential buys
- **Neutral**: Average sentiment between -0.5 and 0.5
- **Bearish**: Average sentiment < -0.5, expect potential sells

#### Time Lag Analysis

Average time between social mention and on-chain activity:
- **< 6 hours**: Fast-acting whale
- **6-24 hours**: Standard timing
- **> 24 hours**: Slower or less correlated

## Clustering Heuristics

The system uses transaction overlap to cluster wallets:

1. **Extract Token Sets**: For each wallet, collect all tokens traded
2. **Calculate Overlap**: For each pair of wallets, compute intersection ratio
3. **Group Formation**: Wallets with >30% overlap are clustered together
4. **Score Calculation**: `cluster_score = sqrt(shared_tokens_count * member_count)`

### Example

```
Wallet A trades: [TOKEN_X, TOKEN_Y, TOKEN_Z]
Wallet B trades: [TOKEN_Y, TOKEN_Z, TOKEN_W]

Overlap: {TOKEN_Y, TOKEN_Z} = 2 tokens
Ratio: 2 / min(3, 4) = 2/3 = 66.7% > 30%
Result: A and B are clustered together
```

## Integration with Existing Systems

### Insiders Module
- Leverages `wallet_monitor` for on-chain activity data
- Uses `smart_money.rs` for wallet classification
- Shares `WalletActivity` types and database structures

### Social Analysis
- Extends `social::models::SocialPost` with wallet mentions
- Integrates sentiment analysis from `SocialAnalysisService`
- Shares SQLite database via `SocialCache.pool()`

## Best Practices

### For Operators

1. **Start with High-Impact Wallets**: Focus on wallets with known influence
2. **Monitor Multiple Tokens**: Follow wallets trading your target assets
3. **Set Priority Levels**: Use priority field to rank most important wallets
4. **Review Correlations Weekly**: Update followed list based on correlation scores
5. **Combine with Other Signals**: Use whale tracking alongside technical analysis

### For Developers

1. **Rate Limiting**: Implement throttling for social API calls
2. **Caching**: Store cluster calculations to avoid recomputation
3. **Batch Operations**: Process correlation calculations in background jobs
4. **Index Optimization**: Ensure database indexes cover common query patterns
5. **Error Handling**: Gracefully handle missing or incomplete social data

## Troubleshooting

### No Clusters Appearing

**Cause**: Insufficient whale activity data
**Solution**: 
- Ensure wallet monitor is running
- Check that wallets are marked as `is_whale = true`
- Verify transaction data is being recorded

### Feed Not Updating

**Cause**: No followed wallets or no social mentions
**Solution**:
- Follow at least one active wallet
- Check social data ingestion is functioning
- Verify wallet addresses are correct

### Low Correlation Scores

**Cause**: Wallet behavior doesn't match social activity
**Solution**:
- This is expected - not all wallets have predictive social signals
- Focus on wallets with scores ≥ 2.0
- Consider unfollowing low-correlation wallets

## Performance Considerations

- **Clustering**: O(n²) where n = number of whale wallets. Run periodically, not real-time.
- **Correlation Calculation**: O(m * p) where m = mentions, p = activities. Cache results.
- **Feed Generation**: O(w * l) where w = followed wallets, l = limit. Fast with proper indexing.

## Future Enhancements

1. **Machine Learning**: Train models to predict optimal entry/exit based on historical correlations
2. **Advanced Clustering**: Use graph algorithms (community detection) for more sophisticated grouping
3. **Alert System**: Notify when high-correlation wallets show unusual activity
4. **Historical Backtesting**: Test correlation strategies against past data
5. **Multi-Chain Support**: Extend whale tracking beyond Solana

## API Reference

See `src-tauri/src/social/commands.rs` for full command signatures and `src-tauri/src/social/whales.rs` for service implementation details.

## Testing

Run tests with:
```bash
cargo test --package eclipse-market-pro --test social_whales_tests
```

Test coverage includes:
- Clustering algorithm correctness
- Follow/unfollow operations
- Correlation calculation
- Insights generation
- Feed assembly

## Support

For issues or questions:
- Check existing insiders/social tests for examples
- Review `SOCIAL_INTELLIGENCE_GUIDE.md` for context
- Examine database schema in `social/cache.rs`

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Module**: `social::whales`
