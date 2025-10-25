use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct AuthState {
    pub connected: bool,
    pub wallet_address: Option<String>,
}

#[tauri::command]
pub async fn connect_phantom(_app: tauri::AppHandle) -> Result<AuthState, String> {
    Ok(AuthState {
        connected: false,
        wallet_address: None,
    })
}
