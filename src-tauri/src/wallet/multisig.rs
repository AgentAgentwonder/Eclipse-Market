use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

const DB_NAME: &str = "multisig.db";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultisigWallet {
    pub wallet_id: String,
    pub name: String,
    pub threshold: u32,
    pub members: Vec<String>,
    pub created_at: String,
    pub squad_address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultisigProposal {
    pub proposal_id: String,
    pub wallet_id: String,
    pub transaction_data: String,
    pub status: ProposalStatus,
    pub created_by: String,
    pub created_at: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProposalStatus {
    Pending,
    Approved,
    Executed,
    Rejected,
    Cancelled,
}

impl ProposalStatus {
    pub fn as_str(&self) -> &str {
        match self {
            ProposalStatus::Pending => "pending",
            ProposalStatus::Approved => "approved",
            ProposalStatus::Executed => "executed",
            ProposalStatus::Rejected => "rejected",
            ProposalStatus::Cancelled => "cancelled",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultisigSignature {
    pub signature_id: String,
    pub proposal_id: String,
    pub signer: String,
    pub signature: String,
    pub signed_at: String,
}

pub struct MultisigDB {
    pool: sqlx::SqlitePool,
}

impl MultisigDB {
    pub async fn initialize(app_handle: &AppHandle) -> Result<Self, String> {
        let app_dir = app_handle
            .path_resolver()
            .app_data_dir()
            .ok_or_else(|| "Failed to get app data directory".to_string())?;

        std::fs::create_dir_all(&app_dir)
            .map_err(|e| format!("Failed to create app directory: {}", e))?;

        let db_path = app_dir.join(DB_NAME);
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

        let pool = sqlx::SqlitePool::connect(&db_url)
            .await
            .map_err(|e| format!("Failed to connect to database: {}", e))?;

        let db = Self { pool };

        db.init_tables().await?;
        Ok(db)
    }

    async fn init_tables(&self) -> Result<(), String> {
        let pool = &self.pool;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS multisig_wallets (
                wallet_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                threshold INTEGER NOT NULL,
                members TEXT NOT NULL,
                squad_address TEXT,
                created_at TEXT NOT NULL
            )",
        )
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create multisig_wallets table: {}", e))?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS multisig_proposals (
                proposal_id TEXT PRIMARY KEY,
                wallet_id TEXT NOT NULL,
                transaction_data TEXT NOT NULL,
                status TEXT NOT NULL,
                created_by TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(wallet_id) REFERENCES multisig_wallets(wallet_id)
            )",
        )
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create multisig_proposals table: {}", e))?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS multisig_signatures (
                signature_id TEXT PRIMARY KEY,
                proposal_id TEXT NOT NULL,
                signer TEXT NOT NULL,
                signature TEXT NOT NULL,
                signed_at TEXT NOT NULL,
                FOREIGN KEY(proposal_id) REFERENCES multisig_proposals(proposal_id)
            )",
        )
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create multisig_signatures table: {}", e))?;

        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_proposals_wallet ON multisig_proposals(wallet_id)")
            .execute(&pool)
            .await
            .ok();

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_proposals_status ON multisig_proposals(status)")
            .execute(&pool)
            .await
            .ok();

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_signatures_proposal ON multisig_signatures(proposal_id)")
            .execute(&pool)
            .await
            .ok();

        Ok(())
    }

    pub async fn create_wallet(
        &self,
        wallet_id: String,
        name: String,
        threshold: u32,
        members: Vec<String>,
    ) -> Result<MultisigWallet, String> {
        let pool = &self.pool;
        let created_at = Utc::now().to_rfc3339();
        let members_json = serde_json::to_string(&members)
            .map_err(|e| format!("Failed to serialize members: {}", e))?;

        // Validate threshold
        if threshold == 0 || threshold > members.len() as u32 {
            return Err(format!(
                "Invalid threshold: must be between 1 and {}",
                members.len()
            ));
        }

        sqlx::query(
            "INSERT INTO multisig_wallets (wallet_id, name, threshold, members, created_at, squad_address)
             VALUES (?, ?, ?, ?, ?, NULL)",
        )
        .bind(&wallet_id)
        .bind(&name)
        .bind(threshold as i64)
        .bind(&members_json)
        .bind(&created_at)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create multisig wallet: {}", e))?;

        Ok(MultisigWallet {
            wallet_id,
            name,
            threshold,
            members,
            created_at,
            squad_address: None,
        })
    }

    pub async fn list_wallets(&self) -> Result<Vec<MultisigWallet>, String> {
        let pool = &self.pool;

        let rows = sqlx::query_as::<_, (String, String, i64, String, String, Option<String>)>(
            "SELECT wallet_id, name, threshold, members, created_at, squad_address FROM multisig_wallets ORDER BY created_at DESC",
        )
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to list wallets: {}", e))?;

        let wallets = rows
            .into_iter()
            .filter_map(|(wallet_id, name, threshold, members_json, created_at, squad_address)| {
                let members: Vec<String> = serde_json::from_str(&members_json).ok()?;
                Some(MultisigWallet {
                    wallet_id,
                    name,
                    threshold: threshold as u32,
                    members,
                    created_at,
                    squad_address,
                })
            })
            .collect();

        Ok(wallets)
    }

    pub async fn get_wallet(&self, wallet_id: &str) -> Result<Option<MultisigWallet>, String> {
        let pool = &self.pool;

        let row = sqlx::query_as::<_, (String, String, i64, String, String, Option<String>)>(
            "SELECT wallet_id, name, threshold, members, created_at, squad_address FROM multisig_wallets WHERE wallet_id = ?",
        )
        .bind(wallet_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Failed to get wallet: {}", e))?;

        if let Some((wallet_id, name, threshold, members_json, created_at, squad_address)) = row {
            let members: Vec<String> = serde_json::from_str(&members_json)
                .map_err(|e| format!("Failed to parse members: {}", e))?;

            Ok(Some(MultisigWallet {
                wallet_id,
                name,
                threshold: threshold as u32,
                members,
                created_at,
                squad_address,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn create_proposal(
        &self,
        proposal_id: String,
        wallet_id: String,
        transaction_data: String,
        created_by: String,
        description: Option<String>,
    ) -> Result<MultisigProposal, String> {
        let pool = &self.pool;
        let created_at = Utc::now().to_rfc3339();

        // Verify wallet exists
        let wallet = self.get_wallet(&wallet_id).await?;
        if wallet.is_none() {
            return Err("Wallet not found".to_string());
        }

        sqlx::query(
            "INSERT INTO multisig_proposals (proposal_id, wallet_id, transaction_data, status, created_by, description, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&proposal_id)
        .bind(&wallet_id)
        .bind(&transaction_data)
        .bind(ProposalStatus::Pending.as_str())
        .bind(&created_by)
        .bind(&description)
        .bind(&created_at)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create proposal: {}", e))?;

        Ok(MultisigProposal {
            proposal_id,
            wallet_id,
            transaction_data,
            status: ProposalStatus::Pending,
            created_by,
            created_at,
            description,
        })
    }

    pub async fn list_proposals(
        &self,
        wallet_id: Option<String>,
        status: Option<ProposalStatus>,
    ) -> Result<Vec<MultisigProposal>, String> {
        let pool = &self.pool;

        let mut query = "SELECT proposal_id, wallet_id, transaction_data, status, created_by, description, created_at FROM multisig_proposals WHERE 1=1".to_string();
        
        if wallet_id.is_some() {
            query.push_str(" AND wallet_id = ?");
        }
        if status.is_some() {
            query.push_str(" AND status = ?");
        }
        query.push_str(" ORDER BY created_at DESC");

        let mut q = sqlx::query_as::<_, (String, String, String, String, String, Option<String>, String)>(&query);

        if let Some(wid) = &wallet_id {
            q = q.bind(wid);
        }
        if let Some(s) = &status {
            q = q.bind(s.as_str());
        }

        let rows = q
            .fetch_all(&pool)
            .await
            .map_err(|e| format!("Failed to list proposals: {}", e))?;

        let proposals = rows
            .into_iter()
            .map(
                |(proposal_id, wallet_id, transaction_data, status_str, created_by, description, created_at)| {
                    let status = match status_str.as_str() {
                        "pending" => ProposalStatus::Pending,
                        "approved" => ProposalStatus::Approved,
                        "executed" => ProposalStatus::Executed,
                        "rejected" => ProposalStatus::Rejected,
                        "cancelled" => ProposalStatus::Cancelled,
                        _ => ProposalStatus::Pending,
                    };

                    MultisigProposal {
                        proposal_id,
                        wallet_id,
                        transaction_data,
                        status,
                        created_by,
                        created_at,
                        description,
                    }
                },
            )
            .collect();

        Ok(proposals)
    }

    pub async fn get_proposal(&self, proposal_id: &str) -> Result<Option<MultisigProposal>, String> {
        let pool = &self.pool;

        let row = sqlx::query_as::<_, (String, String, String, String, String, Option<String>, String)>(
            "SELECT proposal_id, wallet_id, transaction_data, status, created_by, description, created_at FROM multisig_proposals WHERE proposal_id = ?",
        )
        .bind(proposal_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Failed to get proposal: {}", e))?;

        if let Some((proposal_id, wallet_id, transaction_data, status_str, created_by, description, created_at)) = row {
            let status = match status_str.as_str() {
                "pending" => ProposalStatus::Pending,
                "approved" => ProposalStatus::Approved,
                "executed" => ProposalStatus::Executed,
                "rejected" => ProposalStatus::Rejected,
                "cancelled" => ProposalStatus::Cancelled,
                _ => ProposalStatus::Pending,
            };

            Ok(Some(MultisigProposal {
                proposal_id,
                wallet_id,
                transaction_data,
                status,
                created_by,
                created_at,
                description,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn add_signature(
        &self,
        signature_id: String,
        proposal_id: String,
        signer: String,
        signature: String,
    ) -> Result<MultisigSignature, String> {
        let pool = &self.pool;
        let signed_at = Utc::now().to_rfc3339();

        // Verify proposal exists
        let proposal = self.get_proposal(&proposal_id).await?;
        if proposal.is_none() {
            return Err("Proposal not found".to_string());
        }

        let proposal = proposal.unwrap();
        if proposal.status != ProposalStatus::Pending {
            return Err("Proposal is not in pending status".to_string());
        }

        // Get wallet to check if signer is a member
        let wallet = self.get_wallet(&proposal.wallet_id).await?;
        if let Some(wallet) = wallet {
            if !wallet.members.contains(&signer) {
                return Err("Signer is not a member of this multisig wallet".to_string());
            }
        } else {
            return Err("Wallet not found".to_string());
        }

        // Check if already signed
        let existing = sqlx::query_as::<_, (i64,)>(
            "SELECT COUNT(*) FROM multisig_signatures WHERE proposal_id = ? AND signer = ?",
        )
        .bind(&proposal_id)
        .bind(&signer)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to check existing signature: {}", e))?;

        if existing.0 > 0 {
            return Err("Already signed by this member".to_string());
        }

        sqlx::query(
            "INSERT INTO multisig_signatures (signature_id, proposal_id, signer, signature, signed_at)
             VALUES (?, ?, ?, ?, ?)",
        )
        .bind(&signature_id)
        .bind(&proposal_id)
        .bind(&signer)
        .bind(&signature)
        .bind(&signed_at)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to add signature: {}", e))?;

        // Check if threshold is met
        let wallet = self.get_wallet(&proposal.wallet_id).await?.unwrap();
        let sig_count = self.get_signature_count(&proposal_id).await?;
        
        if sig_count >= wallet.threshold {
            self.update_proposal_status(&proposal_id, ProposalStatus::Approved).await?;
        }

        Ok(MultisigSignature {
            signature_id,
            proposal_id,
            signer,
            signature,
            signed_at,
        })
    }

    pub async fn get_signatures(&self, proposal_id: &str) -> Result<Vec<MultisigSignature>, String> {
        let pool = &self.pool;

        let rows = sqlx::query_as::<_, (String, String, String, String, String)>(
            "SELECT signature_id, proposal_id, signer, signature, signed_at FROM multisig_signatures WHERE proposal_id = ? ORDER BY signed_at ASC",
        )
        .bind(proposal_id)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to get signatures: {}", e))?;

        let signatures = rows
            .into_iter()
            .map(|(signature_id, proposal_id, signer, signature, signed_at)| MultisigSignature {
                signature_id,
                proposal_id,
                signer,
                signature,
                signed_at,
            })
            .collect();

        Ok(signatures)
    }

    pub async fn get_signature_count(&self, proposal_id: &str) -> Result<u32, String> {
        let pool = &self.pool;

        let count = sqlx::query_as::<_, (i64,)>(
            "SELECT COUNT(*) FROM multisig_signatures WHERE proposal_id = ?",
        )
        .bind(proposal_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to get signature count: {}", e))?;

        Ok(count.0 as u32)
    }

    pub async fn update_proposal_status(
        &self,
        proposal_id: &str,
        status: ProposalStatus,
    ) -> Result<(), String> {
        let pool = &self.pool;

        sqlx::query("UPDATE multisig_proposals SET status = ? WHERE proposal_id = ?")
            .bind(status.as_str())
            .bind(proposal_id)
            .execute(&pool)
            .await
            .map_err(|e| format!("Failed to update proposal status: {}", e))?;

        Ok(())
    }

    pub async fn cancel_proposal(&self, proposal_id: &str, user: &str) -> Result<(), String> {
        let pool = &self.pool;

        // Verify proposal exists and user is creator
        let proposal = self.get_proposal(proposal_id).await?;
        if let Some(proposal) = proposal {
            if proposal.created_by != user {
                return Err("Only the creator can cancel a proposal".to_string());
            }

            if proposal.status != ProposalStatus::Pending {
                return Err("Only pending proposals can be cancelled".to_string());
            }

            self.update_proposal_status(proposal_id, ProposalStatus::Cancelled)
                .await?;
            Ok(())
        } else {
            Err("Proposal not found".to_string())
        }
    }
}

// Tauri Commands
#[tauri::command]
pub async fn create_multisig_wallet(
    name: String,
    members: Vec<String>,
    threshold: u32,
    app_handle: AppHandle,
) -> Result<MultisigWallet, String> {
    let db = app_handle.state::<MultisigDB>();
    let wallet_id = uuid::Uuid::new_v4().to_string();
    db.create_wallet(wallet_id, name, threshold, members).await
}

#[tauri::command]
pub async fn list_multisig_wallets(app_handle: AppHandle) -> Result<Vec<MultisigWallet>, String> {
    let db = app_handle.state::<MultisigDB>();
    db.list_wallets().await
}

#[tauri::command]
pub async fn get_multisig_wallet(
    wallet_id: String,
    app_handle: AppHandle,
) -> Result<Option<MultisigWallet>, String> {
    let db = app_handle.state::<MultisigDB>();
    db.get_wallet(&wallet_id).await
}

#[tauri::command]
pub async fn create_proposal(
    wallet_id: String,
    transaction: String,
    created_by: String,
    description: Option<String>,
    app_handle: AppHandle,
) -> Result<MultisigProposal, String> {
    let db = app_handle.state::<MultisigDB>();
    let proposal_id = uuid::Uuid::new_v4().to_string();
    db.create_proposal(proposal_id, wallet_id, transaction, created_by, description)
        .await
}

#[tauri::command]
pub async fn list_proposals(
    wallet_id: Option<String>,
    status: Option<String>,
    app_handle: AppHandle,
) -> Result<Vec<MultisigProposal>, String> {
    let db = app_handle.state::<MultisigDB>();
    
    let status_enum = status.and_then(|s| match s.as_str() {
        "pending" => Some(ProposalStatus::Pending),
        "approved" => Some(ProposalStatus::Approved),
        "executed" => Some(ProposalStatus::Executed),
        "rejected" => Some(ProposalStatus::Rejected),
        "cancelled" => Some(ProposalStatus::Cancelled),
        _ => None,
    });

    db.list_proposals(wallet_id, status_enum).await
}

#[tauri::command]
pub async fn get_proposal(
    proposal_id: String,
    app_handle: AppHandle,
) -> Result<Option<MultisigProposal>, String> {
    let db = app_handle.state::<MultisigDB>();
    db.get_proposal(&proposal_id).await
}

#[tauri::command]
pub async fn sign_proposal(
    proposal_id: String,
    signer: String,
    signature: String,
    app_handle: AppHandle,
) -> Result<MultisigSignature, String> {
    let db = app_handle.state::<MultisigDB>();
    let signature_id = uuid::Uuid::new_v4().to_string();
    db.add_signature(signature_id, proposal_id, signer, signature)
        .await
}

#[tauri::command]
pub async fn get_proposal_signatures(
    proposal_id: String,
    app_handle: AppHandle,
) -> Result<Vec<MultisigSignature>, String> {
    let db = app_handle.state::<MultisigDB>();
    db.get_signatures(&proposal_id).await
}

#[tauri::command]
pub async fn get_proposal_status(
    proposal_id: String,
    app_handle: AppHandle,
) -> Result<(ProposalStatus, u32, u32), String> {
    let db = app_handle.state::<MultisigDB>();
    
    let proposal = db.get_proposal(&proposal_id).await?;
    if let Some(proposal) = proposal {
        let wallet = db.get_wallet(&proposal.wallet_id).await?;
        if let Some(wallet) = wallet {
            let sig_count = db.get_signature_count(&proposal_id).await?;
            Ok((proposal.status, sig_count, wallet.threshold))
        } else {
            Err("Wallet not found".to_string())
        }
    } else {
        Err("Proposal not found".to_string())
    }
}

#[tauri::command]
pub async fn execute_proposal(
    proposal_id: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    let db = app_handle.state::<MultisigDB>();
    
    let proposal = db.get_proposal(&proposal_id).await?;
    if let Some(proposal) = proposal {
        if proposal.status != ProposalStatus::Approved {
            return Err("Proposal is not approved".to_string());
        }

        let wallet = db.get_wallet(&proposal.wallet_id).await?;
        if let Some(wallet) = wallet {
            let sig_count = db.get_signature_count(&proposal_id).await?;
            if sig_count < wallet.threshold {
                return Err("Not enough signatures".to_string());
            }

            // Here you would execute the actual transaction
            // For now, we'll just mark it as executed
            db.update_proposal_status(&proposal_id, ProposalStatus::Executed)
                .await?;
            
            Ok(())
        } else {
            Err("Wallet not found".to_string())
        }
    } else {
        Err("Proposal not found".to_string())
    }
}

#[tauri::command]
pub async fn cancel_proposal(
    proposal_id: String,
    user: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    let db = app_handle.state::<MultisigDB>();
    db.cancel_proposal(&proposal_id, &user).await
}
