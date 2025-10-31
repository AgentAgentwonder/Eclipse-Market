use super::airdrop::{AirdropManager, AirdropMetrics};
use super::compliance::ComplianceChecker;
use super::liquidity::LiquidityLocker;
use super::security::LaunchpadKeyManager;
use super::token::TokenManager;
use super::types::*;
use super::vesting::VestingManager;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::AppHandle;
use uuid::Uuid;

pub type SharedLaunchpadState = Arc<RwLock<LaunchpadState>>;

pub struct LaunchpadState {
    pub launches: HashMap<String, TokenLaunchConfig>,
    pub token_manager: TokenManager,
    pub liquidity_locker: LiquidityLocker,
    pub vesting_manager: VestingManager,
    pub airdrop_manager: AirdropManager,
    pub key_manager: LaunchpadKeyManager,
}

impl LaunchpadState {
    pub fn new(rpc_url: String) -> Self {
        Self {
            launches: HashMap::new(),
            token_manager: TokenManager::new(rpc_url),
            liquidity_locker: LiquidityLocker::new(),
            vesting_manager: VestingManager::new(),
            airdrop_manager: AirdropManager::new(),
            key_manager: LaunchpadKeyManager::new(),
        }
    }
}

pub fn create_launchpad_state(rpc_url: String) -> SharedLaunchpadState {
    Arc::new(RwLock::new(LaunchpadState::new(rpc_url)))
}

// Token Creation Commands

#[tauri::command]
pub async fn create_launch_config(
    state: tauri::State<'_, SharedLaunchpadState>,
    name: String,
    symbol: String,
    decimals: u8,
    total_supply: u64,
    description: String,
    metadata: TokenMetadata,
) -> Result<TokenLaunchConfig, String> {
    let launch_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    let config = TokenLaunchConfig {
        id: launch_id.clone(),
        name,
        symbol,
        decimals,
        total_supply,
        description,
        image_url: metadata.image_url.clone(),
        website: metadata.website.clone(),
        twitter: metadata.twitter.clone(),
        telegram: metadata.telegram.clone(),
        discord: metadata.discord.clone(),
        creator_address: "".to_string(),
        mint_authority_enabled: false,
        freeze_authority_enabled: false,
        created_at: now,
        updated_at: now,
        status: LaunchStatus::Draft,
    };

    state.write().launches.insert(launch_id, config.clone());

    Ok(config)
}

#[tauri::command]
pub async fn update_launch_config(
    state: tauri::State<'_, SharedLaunchpadState>,
    launch_id: String,
    config: TokenLaunchConfig,
) -> Result<TokenLaunchConfig, String> {
    let mut state = state.write();
    let mut updated_config = config;
    updated_config.updated_at = chrono::Utc::now();

    state.launches.insert(launch_id, updated_config.clone());

    Ok(updated_config)
}

#[tauri::command]
pub async fn get_launch_config(
    state: tauri::State<'_, SharedLaunchpadState>,
    launch_id: String,
) -> Result<TokenLaunchConfig, String> {
    state
        .read()
        .launches
        .get(&launch_id)
        .cloned()
        .ok_or_else(|| "Launch config not found".to_string())
}

#[tauri::command]
pub async fn list_launches(
    state: tauri::State<'_, SharedLaunchpadState>,
) -> Result<Vec<TokenLaunchConfig>, String> {
    let launches: Vec<_> = state.read().launches.values().cloned().collect();
    Ok(launches)
}

#[tauri::command]
pub async fn simulate_token_creation(
    state: tauri::State<'_, SharedLaunchpadState>,
    request: CreateTokenRequest,
) -> Result<TransactionSimulation, String> {
    state
        .read()
        .token_manager
        .simulate_token_creation(&request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn launchpad_create_token(
    state: tauri::State<'_, SharedLaunchpadState>,
    request: CreateTokenRequest,
    app: AppHandle,
) -> Result<CreateTokenResponse, String> {
    state
        .read()
        .token_manager
        .create_token(request, &app)
        .await
        .map_err(|e| e.to_string())
}

// Safety & Compliance Commands

#[tauri::command]
pub async fn check_launch_safety(
    config: TokenLaunchConfig,
) -> Result<LaunchSafetyCheck, String> {
    ComplianceChecker::check_launch_safety(&config)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_vesting_compliance(
    request: CreateVestingRequest,
) -> Result<SafetyCheckResult, String> {
    ComplianceChecker::check_vesting_compliance(&request).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_liquidity_lock_compliance(
    request: LockLiquidityRequest,
) -> Result<SafetyCheckResult, String> {
    ComplianceChecker::check_liquidity_lock_compliance(&request).map_err(|e| e.to_string())
}

// Liquidity Locking Commands

#[tauri::command]
pub async fn create_liquidity_lock(
    state: tauri::State<'_, SharedLaunchpadState>,
    request: LockLiquidityRequest,
    app: AppHandle,
) -> Result<LiquidityLockConfig, String> {
    state
        .read()
        .liquidity_locker
        .create_lock(request, &app)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn unlock_liquidity(
    state: tauri::State<'_, SharedLaunchpadState>,
    lock_id: String,
    app: AppHandle,
) -> Result<String, String> {
    state
        .read()
        .liquidity_locker
        .unlock_liquidity(&lock_id, &app)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_liquidity_lock(
    state: tauri::State<'_, SharedLaunchpadState>,
    lock_id: String,
) -> Result<LiquidityLockConfig, String> {
    state
        .read()
        .liquidity_locker
        .get_lock(&lock_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_liquidity_locks(
    state: tauri::State<'_, SharedLaunchpadState>,
) -> Result<Vec<LiquidityLockConfig>, String> {
    Ok(state.read().liquidity_locker.get_all_locks())
}

// Vesting Commands

#[tauri::command]
pub async fn create_vesting_schedule(
    state: tauri::State<'_, SharedLaunchpadState>,
    request: CreateVestingRequest,
) -> Result<VestingSchedule, String> {
    state
        .read()
        .vesting_manager
        .create_schedule(request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn release_vested_tokens(
    state: tauri::State<'_, SharedLaunchpadState>,
    schedule_id: String,
    amount: u64,
) -> Result<VestingSchedule, String> {
    state
        .read()
        .vesting_manager
        .release_tokens(&schedule_id, amount)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_vesting_schedule(
    state: tauri::State<'_, SharedLaunchpadState>,
    schedule_id: String,
) -> Result<VestingSchedule, String> {
    state
        .read()
        .vesting_manager
        .get_schedule(&schedule_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_vesting_schedules(
    state: tauri::State<'_, SharedLaunchpadState>,
    token_mint: Option<String>,
    beneficiary: Option<String>,
) -> Result<Vec<VestingSchedule>, String> {
    let manager = &state.read().vesting_manager;

    Ok(if let Some(mint) = token_mint {
        manager.get_schedules_for_mint(&mint)
    } else if let Some(addr) = beneficiary {
        manager.get_schedules_for_beneficiary(&addr)
    } else {
        Vec::new()
    })
}

// Airdrop Commands

#[tauri::command]
pub async fn create_airdrop(
    state: tauri::State<'_, SharedLaunchpadState>,
    request: CreateAirdropRequest,
) -> Result<AirdropConfig, String> {
    state
        .read()
        .airdrop_manager
        .create_airdrop(request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn activate_airdrop(
    state: tauri::State<'_, SharedLaunchpadState>,
    airdrop_id: String,
) -> Result<AirdropConfig, String> {
    state
        .read()
        .airdrop_manager
        .activate_airdrop(&airdrop_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn claim_airdrop_tokens(
    state: tauri::State<'_, SharedLaunchpadState>,
    airdrop_id: String,
    recipient_address: String,
) -> Result<AirdropRecipient, String> {
    state
        .read()
        .airdrop_manager
        .claim_airdrop(&airdrop_id, &recipient_address)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_airdrop(
    state: tauri::State<'_, SharedLaunchpadState>,
    airdrop_id: String,
) -> Result<AirdropConfig, String> {
    state
        .read()
        .airdrop_manager
        .get_airdrop(&airdrop_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_airdrop_metrics(
    state: tauri::State<'_, SharedLaunchpadState>,
    airdrop_id: String,
) -> Result<AirdropMetrics, String> {
    state
        .read()
        .airdrop_manager
        .get_airdrop_metrics(&airdrop_id)
        .map_err(|e| e.to_string())
}

// Distribution Monitoring Commands

#[tauri::command]
pub async fn get_distribution_metrics(
    state: tauri::State<'_, SharedLaunchpadState>,
    token_mint: String,
) -> Result<DistributionMetrics, String> {
    let state = state.read();

    let airdrops = state.airdrop_manager.get_airdrops_for_mint(&token_mint);
    let vesting = state.vesting_manager.get_schedules_for_mint(&token_mint);

    let total_distributed: u64 = airdrops
        .iter()
        .flat_map(|a| &a.recipients)
        .filter(|r| r.claimed)
        .map(|r| r.amount)
        .sum();

    let total_recipients = airdrops
        .iter()
        .map(|a| a.total_recipients)
        .sum::<u32>();

    let successful_transfers = airdrops
        .iter()
        .flat_map(|a| &a.recipients)
        .filter(|r| r.claimed)
        .count() as u32;

    let vesting_active = vesting.iter().filter(|v| !v.revoked).count() as u32;
    let vesting_completed = vesting
        .iter()
        .filter(|v| v.released_amount >= v.total_amount)
        .count() as u32;

    let liquidity_locked_amount = state
        .liquidity_locker
        .get_active_locks()
        .iter()
        .map(|l| l.lock_amount)
        .sum();

    Ok(DistributionMetrics {
        token_mint,
        total_distributed,
        total_recipients,
        successful_transfers,
        failed_transfers: total_recipients - successful_transfers,
        vesting_active,
        vesting_completed,
        liquidity_locked_amount,
        timestamp: chrono::Utc::now(),
    })
}
