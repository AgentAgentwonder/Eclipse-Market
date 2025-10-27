# Security Implementation: Keystore, Sessions & 2FA

This document describes the security features implemented for Eclipse Market Pro.

## Backend Implementation (Rust/Tauri)

### 1. Keystore (`src-tauri/src/security/keystore.rs`)

**Features:**
- AES-256-GCM encryption for all stored secrets
- OS-level secure storage via keyring crate (Keychain on macOS, Credential Manager on Windows, Secret Service on Linux)
- Argon2id key derivation for enhanced security
- Master key automatically generated and stored in OS secure storage
- Per-secret salt and nonce for encryption
- Automatic memory zeroing using zeroize crate
- Import/export functionality with password protection
- Key rotation support

**API:**
- `store_secret(key, data)` - Store encrypted secret
- `retrieve_secret(key)` - Retrieve and decrypt secret
- `remove_secret(key)` - Delete secret
- `export_backup(password)` - Export encrypted backup
- `import_backup(password, backup)` - Import from backup
- `rotate_master_key()` - Rotate encryption keys
- `list_keys()` - List all stored secret keys

### 2. Session Manager (`src-tauri/src/auth/session_manager.rs`)

**Features:**
- JWT-based session tokens
- Configurable session timeout (default: 15 minutes)
- Idle timeout tracking
- Session persistence via keystore (encrypted)
- Automatic session renewal
- Session validation

**API Commands:**
- `session_create({user_id, timeout_minutes?})` - Create new session
- `session_renew()` - Renew current session
- `session_end()` - End/logout session
- `session_status()` - Get session status including expiry
- `session_verify()` - Verify session is valid
- `session_update_activity()` - Update last activity timestamp
- `session_configure_timeout(minutes)` - Change timeout duration

**Session Warning:**
- 60-second warning threshold before expiration

### 3. Two-Factor Authentication (`src-tauri/src/auth/two_factor.rs`)

**Features:**
- TOTP implementation (RFC 6238) using HMAC-SHA1
- QR code generation as SVG for authenticator app setup
- 10 backup codes with SHA-256 hashing
- Time-window tolerance (±1 period = ±30 seconds)
- Manual entry key provided
- Backup code regeneration

**API Commands:**
- `two_factor_enroll(user_id)` - Enroll in 2FA, returns QR code and backup codes
- `two_factor_verify({code})` - Verify TOTP code or backup code
- `two_factor_disable()` - Disable 2FA
- `two_factor_status()` - Get enrollment status
- `two_factor_regenerate_backup_codes()` - Generate new backup codes

**TOTP Spec:**
- Issuer: "EclipseMarketPro"
- Digits: 6
- Period: 30 seconds
- Algorithm: SHA1

### 4. Integration

All modules are initialized in `src-tauri/src/lib.rs`:
- Keystore initialized on app startup
- Session manager hydrates from keystore
- 2FA manager hydrates configuration
- All managed as Tauri state for command access

## Frontend Implementation (React/TypeScript)

### Required Components

1. **Session Monitoring Hook** (`src/hooks/useSessionMonitor.ts`)
   - Track user activity (mouse/keyboard events)
   - Auto-refresh session token on activity
   - Display warning UI when session near expiry
   - Auto-logout on expiration
   - Debounce activity updates

2. **Session Context** (`src/providers/SessionProvider.tsx`)
   - Global session state management
   - Countdown display
   - Lock screen trigger

3. **Settings UI Updates** (`src/pages/Settings.tsx`)
   - Keystore backup/restore section
   - Session timeout configuration (5, 15, 30, 60 minutes)
   - 2FA enrollment section with QR code display
   - Backup codes display and download
   - 2FA verification test

4. **2FA Enrollment Component** (`src/components/auth/TwoFactorEnrollment.tsx`)
   - Display QR code (SVG from backend)
   - Show manual entry key
   - Display backup codes for printing/saving
   - Verification step

5. **Session Warning Modal** (`src/components/auth/SessionWarning.tsx`)
   - Countdown timer
   - "Extend Session" button
   - "Logout" button

## Security Best Practices

1. **Memory Safety:**
   - All sensitive data zeroed on drop using zeroize
   - Secrets wrapped in `Zeroizing<T>`
   - No plaintext secrets in logs

2. **Encryption:**
   - AES-256-GCM authenticated encryption
   - Unique salt and nonce per encryption
   - Argon2id for key derivation (19 MiB memory, 2 iterations)

3. **Storage:**
   - Master key in OS secure storage only
   - No plaintext secrets on disk
   - Session state encrypted in keystore

4. **2FA:**
   - Backup codes hashed (SHA-256)
   - One-time use backup codes
   - Time-window tolerance to handle clock skew

5. **Sessions:**
   - JWT signed with 64-byte secret
   - Activity tracking to prevent idle sessions
   - Auto-expiration and renewal

## Testing

### Manual Testing Checklist:

- [ ] Keystore stores and retrieves secrets correctly
- [ ] Keystore export/import with password works
- [ ] Session creates and persists across app restarts (within timeout)
- [ ] Session expires after timeout period
- [ ] Session renews on activity
- [ ] 2FA enrollment generates valid QR code
- [ ] Authenticator app (Google Authenticator, Authy) accepts QR code
- [ ] TOTP verification works
- [ ] Backup codes work
- [ ] Backup codes are one-time use
- [ ] Settings UI allows all operations

### Automated Test Coverage:
- Unit tests for encryption/decryption
- TOTP generation validation
- Session expiration logic
- Backup code hashing

## Usage Examples

### Backend (Rust):

```rust
// Store a secret
keystore.store_secret("api-key", b"secret-value")?;

// Retrieve a secret
let secret = keystore.retrieve_secret("api-key")?;

// Create session
let session = session_manager.create_session("user123".to_string(), Some(30), &keystore)?;

// Enroll 2FA
let enrollment = two_factor_manager.enroll("user@example.com", &keystore)?;
println!("QR Code: {}", enrollment.qr_code);
println!("Backup Codes: {:?}", enrollment.backup_codes);

// Verify 2FA
let valid = two_factor_manager.verify("123456", &keystore)?;
```

### Frontend (TypeScript):

```typescript
// Create session
await invoke('session_create', { user_id: 'user123', timeout_minutes: 15 });

// Check session status
const status = await invoke<SessionStatus>('session_status');

// Enroll 2FA
const enrollment = await invoke<TwoFactorEnrollment>('two_factor_enroll', { 
  user_id: 'user@example.com' 
});

// Verify code
const valid = await invoke<boolean>('two_factor_verify', { 
  code: '123456' 
});
```

## Future Enhancements

1. Per-trade 2FA enforcement thresholds
2. Hardware security key support (WebAuthn/FIDO2)
3. Session device tracking
4. Audit log for security events
5. Rate limiting for 2FA attempts
6. Emergency contact recovery
