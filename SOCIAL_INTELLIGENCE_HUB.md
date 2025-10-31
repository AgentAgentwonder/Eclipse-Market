# Social Intelligence Hub

## Overview

The Social Intelligence Hub provides real-time social sentiment analysis, influencer tracking, whale wallet monitoring, and trend detection for Solana tokens. It aggregates data from multiple social platforms and provides actionable insights through FOMO/FUD gauges, momentum scoring, and behavioral analysis.

## Features

### 1. Influencer Tracking
- Track key crypto influencers across Twitter and Reddit
- User-configurable influencer lists with tags
- Real-time mention aggregation with engagement metrics
- Influence scoring based on follower count and verification status

### 2. Social Sentiment Analysis
- Multi-platform sentiment aggregation (Twitter, Reddit)
- Advanced sentiment scoring with engagement weighting
- FOMO/FUD gauge calculation
- Sentiment shift detection with alerts

### 3. Trend Detection
- Real-time trend tracking for tokens
- Velocity and acceleration metrics
- Trending rank calculation
- Peak detection and timing analysis

### 4. Whale Wallet Monitoring
- Track large wallet movements
- Wallet clustering using Louvain algorithm
- Behavioral pattern recognition (Accumulator, Distributor, Trader, Hodler, Manipulator)
- "Wallets you follow" feed for personalized alerts

### 5. Whale Behavioral Insights
- Automated pattern detection
- Risk level assessment
- Position changes and opportunities
- Impact scoring for movements

### 6. Social Momentum Dashboard
- Unified view of social metrics
- Token-specific momentum scores
- Alert notifications
- Rate limit status monitoring

## Architecture

### Backend (Rust)

#### Module Structure
```
src-tauri/src/social/
├── mod.rs              # Module exports
├── types.rs            # Type definitions
├── influencers.rs      # Influencer management
├── api_clients.rs      # Twitter/Reddit API clients
├── sentiment.rs        # Sentiment analysis
├── trends.rs           # Trend detection
├── whales.rs           # Whale tracking
├── scoring.rs          # Momentum scoring
└── commands.rs         # Tauri commands
```

#### Key Components

**SocialIntelligenceManager**: Central orchestrator that coordinates all social intelligence features
- Manages API clients
- Coordinates data refresh
- Generates dashboard snapshots
- Handles configuration

**InfluencerManager**: Manages influencer lists
- Add/remove/update influencers
- Track active influencers
- Calculate influence scores

**WhaleTracker**: Monitors whale wallets
- Track wallet holdings
- Record movements
- Cluster analysis
- Behavioral insights generation

**TrendDetector**: Detects and tracks trends
- Volume/velocity analysis
- Acceleration calculation
- Ranking system

**EnhancedSentimentAnalyzer**: Advanced sentiment analysis
- Aggregates mentions with weighting
- FOMO/FUD gauge calculation
- Sentiment shift detection

**SocialScoringEngine**: Computes momentum scores
- Multi-factor scoring (sentiment, volume, whale activity, influencer mentions)
- Alert generation based on thresholds

### API Integration

#### Twitter API
- **Endpoint**: `https://api.twitter.com/2/tweets/search/recent`
- **Authentication**: Bearer Token (OAuth 2.0)
- **Rate Limit**: 15 requests per 15-minute window (basic tier)
- **Required Scopes**: `tweet.read`, `users.read`

**Setup Steps:**
1. Create a Twitter Developer account at https://developer.twitter.com
2. Create a new app and generate a Bearer Token
3. Set environment variable: `TWITTER_BEARER_TOKEN=your_token_here`
4. Or configure via UI settings

#### Reddit API
- **Endpoint**: `https://oauth.reddit.com/search`
- **Authentication**: OAuth 2.0 client credentials
- **Rate Limit**: 60 requests per minute
- **Required Credentials**: Client ID + Client Secret

**Setup Steps:**
1. Create a Reddit app at https://www.reddit.com/prefs/apps
2. Select "script" app type
3. Note the client ID and client secret
4. Set environment variables:
   - `REDDIT_CLIENT_ID=your_client_id`
   - `REDDIT_CLIENT_SECRET=your_client_secret`
5. Or configure via UI settings

### Rate Limiting

The system implements client-side rate limiting to prevent API quota exhaustion:

**Twitter**:
- Default: 15 requests/minute
- Tracks requests per 60-second window
- Returns fallback data when limit reached

**Reddit**:
- Default: 60 requests/minute
- Tracks requests per 60-second window
- Returns fallback data when limit reached

**Fallback Behavior**:
When API limits are reached or errors occur, the system generates mock data based on tracked influencers to maintain UI functionality. The dashboard displays rate limit status for transparency.

### Configuration

#### Default Settings
```rust
SocialConfig {
    enabled_platforms: vec![Twitter, Reddit],
    twitter_bearer_token: None,  // Load from env
    reddit_client_id: None,      // Load from env
    reddit_client_secret: None,  // Load from env
    update_interval_seconds: 300, // 5 minutes
    alert_thresholds: {
        sentiment_spike: 0.5,
        volume_spike: 2.0,
        whale_movement_usd: 100000.0,
        fomo_threshold: 0.7,
        fud_threshold: -0.7,
    },
    rate_limits: {
        twitter_requests_per_minute: 15,
        reddit_requests_per_minute: 60,
        max_mentions_per_token: 100,
    },
}
```

#### Updating Configuration
Use the `social_update_config` command to modify settings at runtime.

## Frontend Integration

### Available Commands

#### Get Dashboard Snapshot
```typescript
import { invoke } from '@tauri-apps/api';

const snapshot = await invoke<SocialDashboardSnapshot>(
  'social_get_dashboard_snapshot'
);
```

Returns:
- Recent social mentions
- Top influencers
- FOMO/FUD gauges
- Momentum scores
- Trend data
- Whale movements
- Whale insights
- Followed wallet events
- Active alerts
- Rate limit status

#### Refresh Social Data
```typescript
await invoke('social_refresh_data');
```

Manually triggers a refresh of social data from all enabled platforms.

#### Manage Influencers
```typescript
// Add influencer
await invoke('social_add_influencer', {
  influencer: {
    id: 'uuid',
    name: 'Crypto Analyst',
    platform: 'twitter',
    handle: '@cryptoanalyst',
    followerCount: 100000,
    verified: true,
    influenceScore: 0.8,
    active: true,
    tags: ['analyst', 'solana'],
    addedAt: Date.now() / 1000
  }
});

// Get all influencers
const influencers = await invoke<Influencer[]>('social_get_influencers');

// Update influencer
await invoke('social_update_influencer', { influencer });

// Remove influencer
await invoke('social_remove_influencer', { id: 'uuid' });
```

#### Follow Whale Wallets
```typescript
// Follow a whale
await invoke('social_follow_whale', {
  address: 'WhaleAddr111...'
});

// Unfollow whale
await invoke('social_unfollow_whale', {
  address: 'WhaleAddr111...'
});

// Get followed whales
const whales = await invoke<WhaleWallet[]>('social_get_followed_whales');

// Get all tracked whales
const allWhales = await invoke<WhaleWallet[]>('social_get_all_whales');
```

#### Whale Analysis
```typescript
// Cluster whales based on transaction patterns
const clusterIds = await invoke<string[]>('social_cluster_whales', {
  edges: tokenFlowEdges
});

// Analyze whale behavior
const behavior = await invoke<BehaviorPattern>(
  'social_analyze_whale_behavior',
  { address: 'WhaleAddr111...' }
);
```

#### Configuration
```typescript
// Get config
const config = await invoke<SocialConfig>('social_get_config');

// Update config
await invoke('social_update_config', {
  config: {
    ...config,
    updateIntervalSeconds: 600, // 10 minutes
    alertThresholds: {
      sentimentSpike: 0.6,
      volumeSpike: 3.0,
      whaleMovementUsd: 50000.0,
      fomoThreshold: 0.8,
      fudThreshold: -0.8,
    }
  }
});
```

## Data Pipeline

### Update Flow
1. **Scheduled Refresh**: Background task runs every `update_interval_seconds`
2. **API Calls**: Parallel requests to enabled platforms (Twitter, Reddit)
3. **Rate Limiting**: Client-side enforcement with fallback
4. **Sentiment Analysis**: Process all mentions through enhanced analyzer
5. **Trend Detection**: Update velocity, acceleration, and rankings
6. **Momentum Calculation**: Compute multi-factor scores
7. **Gauge Generation**: Create FOMO/FUD gauges per token
8. **Alert Generation**: Check thresholds and create alerts
9. **Dashboard Update**: Cache snapshot for instant UI access

### Data Retention
- **Mentions**: Latest 1000 cached in memory
- **Momentum**: Latest values per token
- **Whale Movements**: Latest 1000 movements
- **Insights**: Latest 500 insights
- **Alerts**: Latest 100 alerts

## Testing

### Backend Tests
Located in `src-tauri/tests/social_tests.rs`:

```bash
cd src-tauri
cargo test --test social_tests
```

Test Coverage:
- Influencer management
- Sentiment scoring accuracy
- Trend detection
- Whale clustering
- API client fallbacks
- Rate limiting
- Alert generation

### Frontend Tests
Located in `src/__tests__/social.test.ts`:

```bash
npm test src/__tests__/social.test.ts
```

Test Coverage:
- Component rendering
- Dashboard snapshot display
- Influencer list management
- Whale following UI
- Alert notifications
- Gauge visualization

## Performance Considerations

### Memory Usage
- Lightweight in-memory caching
- Automatic cleanup of old data
- Configurable limits for mentions and movements

### Network Efficiency
- Parallel API requests
- Rate limit compliance
- Graceful degradation with fallbacks
- Configurable update intervals

### CPU Usage
- Efficient clustering algorithms (Louvain)
- Incremental trend updates
- Lazy gauge calculation
- Background processing

## Troubleshooting

### API Errors
**Issue**: "Missing TWITTER_BEARER_TOKEN"
**Solution**: Set environment variable or configure via settings

**Issue**: Rate limit exceeded
**Solution**: Increase `update_interval_seconds` or upgrade API tier

### Empty Data
**Issue**: No mentions appearing
**Solution**: Verify API credentials, check influencer list, ensure active platforms

### Clustering Failures
**Issue**: Whale clustering returns empty
**Solution**: Ensure sufficient transaction data (TokenFlowEdges) is provided

## Best Practices

1. **API Keys**: Store in environment variables, not in code
2. **Rate Limits**: Start with longer intervals (5-10 minutes) and adjust based on needs
3. **Influencer Lists**: Focus on quality over quantity; track 10-20 key influencers
4. **Whale Following**: Follow 5-10 high-impact wallets for actionable alerts
5. **Alert Thresholds**: Tune based on your risk tolerance and market conditions
6. **Testing**: Use fallback data for development; test with real APIs before production

## Future Enhancements

- Telegram and Discord integration
- Machine learning sentiment models
- Coordinated activity detection
- Bot detection and filtering
- Historical trend analysis
- Influencer reputation scoring
- Custom alert conditions
- Export and reporting features
