pub mod types;
pub mod database;
pub mod escrow;
pub mod compliance;
pub mod matching;
pub mod commands;

pub use types::*;
pub use database::P2PDatabase;
pub use escrow::{EscrowStateMachine, EscrowSmartContract};
pub use compliance::ComplianceChecker;
pub use matching::LocalMatcher;
pub use commands::*;

use std::sync::Arc;
use tauri::AppHandle;
use tokio::sync::RwLock;

pub type SharedP2PDatabase = Arc<RwLock<P2PDatabase>>;

pub async fn init_p2p_system(app_handle: &AppHandle) -> Result<SharedP2PDatabase, Box<dyn std::error::Error>> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Unable to resolve app data directory")?;

    std::fs::create_dir_all(&app_dir)?;
    let db_path = app_dir.join("p2p.db");

    let db = P2PDatabase::new(db_path).await?;
    Ok(Arc::new(RwLock::new(db)))
}
