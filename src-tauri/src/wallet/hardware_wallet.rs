use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DeviceType {
    Ledger,
    Trezor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareDevice {
    pub id: String,
    pub device_type: DeviceType,
    pub model: String,
    pub firmware_version: Option<String>,
    pub connected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareWalletSession {
    pub device: HardwareDevice,
    pub public_key: Option<String>,
    pub derivation_path: String,
    pub connected_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub device_type: DeviceType,
    pub model: String,
    pub firmware_version: Option<String>,
    pub supports_solana: bool,
    pub min_firmware_required: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignRequest {
    pub message: String,
    pub derivation_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignResponse {
    pub signature: String,
    pub public_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareWalletError {
    pub code: HardwareWalletErrorCode,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HardwareWalletErrorCode {
    DeviceNotFound,
    ConnectionFailed,
    DeviceDisconnected,
    UnsupportedDevice,
    FirmwareOutdated,
    UserRejected,
    SigningFailed,
    InvalidDerivationPath,
    Internal,
}

impl HardwareWalletError {
    fn new(code: HardwareWalletErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }

    fn device_not_found(message: impl Into<String>) -> Self {
        Self::new(HardwareWalletErrorCode::DeviceNotFound, message)
    }

    fn connection_failed(message: impl Into<String>) -> Self {
        Self::new(HardwareWalletErrorCode::ConnectionFailed, message)
    }

    fn device_disconnected(message: impl Into<String>) -> Self {
        Self::new(HardwareWalletErrorCode::DeviceDisconnected, message)
    }

    fn user_rejected(message: impl Into<String>) -> Self {
        Self::new(HardwareWalletErrorCode::UserRejected, message)
    }

    fn signing_failed(message: impl Into<String>) -> Self {
        Self::new(HardwareWalletErrorCode::SigningFailed, message)
    }

    fn internal(message: impl Into<String>) -> Self {
        Self::new(HardwareWalletErrorCode::Internal, message)
    }
}

impl std::fmt::Display for HardwareWalletError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}: {}",
            serde_json::to_string(&self.code).unwrap_or_else(|_| "unknown".to_string()),
            self.message
        )
    }
}

impl std::error::Error for HardwareWalletError {}

#[derive(Default)]
pub struct HardwareWalletState {
    session: Arc<Mutex<Option<HardwareWalletSession>>>,
}

impl HardwareWalletState {
    pub fn new() -> Self {
        Self::default()
    }
}

const DEFAULT_DERIVATION_PATH: &str = "44'/501'/0'/0'";

#[tauri::command]
pub async fn hw_discover_devices() -> Result<Vec<HardwareDevice>, HardwareWalletError> {
    let mut devices = Vec::new();

    devices.push(HardwareDevice {
        id: "ledger-mock-001".to_string(),
        device_type: DeviceType::Ledger,
        model: "Nano S Plus".to_string(),
        firmware_version: Some("1.0.4".to_string()),
        connected: false,
    });

    devices.push(HardwareDevice {
        id: "trezor-mock-001".to_string(),
        device_type: DeviceType::Trezor,
        model: "Model T".to_string(),
        firmware_version: Some("2.5.3".to_string()),
        connected: false,
    });

    Ok(devices)
}

#[tauri::command]
pub async fn hw_connect_device(
    device_id: String,
    derivation_path: Option<String>,
    state: State<'_, HardwareWalletState>,
    _app: AppHandle,
) -> Result<HardwareWalletSession, HardwareWalletError> {
    let path = derivation_path.unwrap_or_else(|| DEFAULT_DERIVATION_PATH.to_string());

    if !validate_derivation_path(&path) {
        return Err(HardwareWalletError::new(
            HardwareWalletErrorCode::InvalidDerivationPath,
            "Invalid derivation path format",
        ));
    }

    let device_type = if device_id.contains("ledger") {
        DeviceType::Ledger
    } else if device_id.contains("trezor") {
        DeviceType::Trezor
    } else {
        return Err(HardwareWalletError::device_not_found(
            "Unknown device type",
        ));
    };

    let model = match device_type {
        DeviceType::Ledger => "Nano S Plus",
        DeviceType::Trezor => "Model T",
    };

    let device = HardwareDevice {
        id: device_id,
        device_type,
        model: model.to_string(),
        firmware_version: Some("1.0.0".to_string()),
        connected: true,
    };

    let mock_pubkey = "7vP9Z9YdNXYxKJW4sKgW2QGzW9FnZp3dZqL4v3FcKVxy".to_string();

    let session = HardwareWalletSession {
        device,
        public_key: Some(mock_pubkey),
        derivation_path: path,
        connected_at: chrono::Utc::now().to_rfc3339(),
    };

    let mut guard = state
        .session
        .lock()
        .map_err(|_| HardwareWalletError::internal("Failed to acquire session lock"))?;
    *guard = Some(session.clone());

    Ok(session)
}

#[tauri::command]
pub async fn hw_disconnect_device(
    state: State<'_, HardwareWalletState>,
) -> Result<(), HardwareWalletError> {
    let mut guard = state
        .session
        .lock()
        .map_err(|_| HardwareWalletError::internal("Failed to acquire session lock"))?;
    *guard = None;
    Ok(())
}

#[tauri::command]
pub async fn hw_get_session(
    state: State<'_, HardwareWalletState>,
) -> Result<Option<HardwareWalletSession>, HardwareWalletError> {
    let guard = state
        .session
        .lock()
        .map_err(|_| HardwareWalletError::internal("Failed to acquire session lock"))?;
    Ok(guard.clone())
}

#[tauri::command]
pub async fn hw_get_device_info(
    device_type: DeviceType,
) -> Result<DeviceInfo, HardwareWalletError> {
    let (model, min_firmware, supports_solana) = match device_type {
        DeviceType::Ledger => ("Ledger Nano S Plus", Some("1.0.0"), true),
        DeviceType::Trezor => ("Trezor Model T", Some("2.4.0"), true),
    };

    Ok(DeviceInfo {
        device_type,
        model: model.to_string(),
        firmware_version: None,
        supports_solana,
        min_firmware_required: min_firmware.map(String::from),
    })
}

#[tauri::command]
pub async fn hw_sign_message(
    request: SignRequest,
    state: State<'_, HardwareWalletState>,
) -> Result<SignResponse, HardwareWalletError> {
    let guard = state
        .session
        .lock()
        .map_err(|_| HardwareWalletError::internal("Failed to acquire session lock"))?;

    let session = guard.as_ref().ok_or_else(|| {
        HardwareWalletError::device_disconnected("No hardware wallet connected")
    })?;

    let public_key = session.public_key.clone().ok_or_else(|| {
        HardwareWalletError::internal("No public key available in session")
    })?;

    let mock_signature = format!(
        "{}{}",
        "5" .repeat(64),
        hex::encode(request.message.as_bytes()).chars().take(24).collect::<String>()
    );

    Ok(SignResponse {
        signature: mock_signature,
        public_key,
    })
}

#[tauri::command]
pub async fn hw_sign_transaction(
    transaction: String,
    derivation_path: Option<String>,
    state: State<'_, HardwareWalletState>,
) -> Result<SignResponse, HardwareWalletError> {
    let guard = state
        .session
        .lock()
        .map_err(|_| HardwareWalletError::internal("Failed to acquire session lock"))?;

    let session = guard.as_ref().ok_or_else(|| {
        HardwareWalletError::device_disconnected("No hardware wallet connected")
    })?;

    let _path = derivation_path.unwrap_or_else(|| session.derivation_path.clone());

    let public_key = session.public_key.clone().ok_or_else(|| {
        HardwareWalletError::internal("No public key available in session")
    })?;

    let mock_signature = format!(
        "{}{}",
        "4" .repeat(64),
        hex::encode(transaction.as_bytes()).chars().take(24).collect::<String>()
    );

    Ok(SignResponse {
        signature: mock_signature,
        public_key,
    })
}

#[tauri::command]
pub async fn hw_get_public_key(
    derivation_path: Option<String>,
    state: State<'_, HardwareWalletState>,
) -> Result<String, HardwareWalletError> {
    let guard = state
        .session
        .lock()
        .map_err(|_| HardwareWalletError::internal("Failed to acquire session lock"))?;

    let session = guard.as_ref().ok_or_else(|| {
        HardwareWalletError::device_disconnected("No hardware wallet connected")
    })?;

    let _path = derivation_path.unwrap_or_else(|| DEFAULT_DERIVATION_PATH.to_string());

    session
        .public_key
        .clone()
        .ok_or_else(|| HardwareWalletError::internal("No public key available"))
}

fn validate_derivation_path(path: &str) -> bool {
    if path.is_empty() {
        return false;
    }

    let parts: Vec<&str> = path.split('/').collect();
    if parts.is_empty() {
        return false;
    }

    for part in parts.iter().skip(1) {
        let clean = part.trim_end_matches('\'');
        if clean.parse::<u32>().is_err() {
            return false;
        }
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_derivation_path() {
        assert!(validate_derivation_path("44'/501'/0'/0'"));
        assert!(validate_derivation_path("44'/501'/0'"));
        assert!(validate_derivation_path("44'/501'"));
        assert!(!validate_derivation_path(""));
        assert!(!validate_derivation_path("invalid"));
        assert!(!validate_derivation_path("44'/abc'/0'"));
    }

    #[test]
    fn test_device_type_serialization() {
        let ledger = DeviceType::Ledger;
        let json = serde_json::to_string(&ledger).unwrap();
        assert_eq!(json, r#""ledger""#);

        let trezor = DeviceType::Trezor;
        let json = serde_json::to_string(&trezor).unwrap();
        assert_eq!(json, r#""trezor""#);
    }

    #[tokio::test]
    async fn test_hw_get_device_info_returns_supported_device() {
        let info = hw_get_device_info(DeviceType::Ledger).await.unwrap();
        assert_eq!(info.device_type, DeviceType::Ledger);
        assert!(info.supports_solana);
        assert_eq!(info.model, "Ledger Nano S Plus");
        assert_eq!(info.min_firmware_required.as_deref(), Some("1.0.0"));
    }

    #[tokio::test]
    async fn test_hw_discover_devices_returns_mock_list() {
        let devices = hw_discover_devices().await.unwrap();
        assert!(!devices.is_empty());
        assert!(devices.iter().any(|d| matches!(d.device_type, DeviceType::Ledger)));
        assert!(devices.iter().any(|d| matches!(d.device_type, DeviceType::Trezor)));
    }
}
