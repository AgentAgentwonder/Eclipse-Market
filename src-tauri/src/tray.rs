use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::cmp::min;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::api::notification::Notification;
use tauri::{AppHandle, CustomMenuItem, GlobalShortcutManager, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem, WindowEvent};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum TrayIconStyle {
    Default,
    Bullish,
    Bearish,
    Minimal,
}

impl Default for TrayIconStyle {
    fn default() -> Self {
        TrayIconStyle::Default
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraySettings {
    pub enabled: bool,
    pub minimize_to_tray: bool,
    pub close_to_tray: bool,
    pub show_badge: bool,
    pub show_stats: bool,
    pub show_alerts: bool,
    pub show_notifications: bool,
    pub icon_style: TrayIconStyle,
    pub restore_shortcut: Option<String>,
}

impl Default for TraySettings {
    fn default() -> Self {
        Self {
            enabled: true,
            minimize_to_tray: true,
            close_to_tray: true,
            show_badge: true,
            show_stats: true,
            show_alerts: true,
            show_notifications: true,
            icon_style: TrayIconStyle::Default,
            restore_shortcut: Some("CmdOrControl+Shift+M".to_string()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrayAlertPreview {
    pub id: String,
    pub title: String,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrayStats {
    pub portfolio_value: f64,
    pub pnl_percentage: f64,
    pub pnl_value: f64,
    pub alert_count: u32,
    pub recent_alerts: Vec<TrayAlertPreview>,
}

impl Default for TrayStats {
    fn default() -> Self {
        Self {
            portfolio_value: 0.0,
            pnl_percentage: 0.0,
            pnl_value: 0.0,
            alert_count: 0,
            recent_alerts: Vec::new(),
        }
    }
}

pub struct TrayManager {
    settings: RwLock<TraySettings>,
    stats: RwLock<TrayStats>,
    shortcut: RwLock<Option<String>>,
    settings_path: RwLock<Option<PathBuf>>,
}

impl TrayManager {
    pub fn new() -> Self {
        Self {
            settings: RwLock::new(TraySettings::default()),
            stats: RwLock::new(TrayStats::default()),
            shortcut: RwLock::new(None),
            settings_path: RwLock::new(None),
        }
    }

    pub fn create_tray() -> SystemTray {
        let open = CustomMenuItem::new("open".to_string(), "Open");
        let settings = CustomMenuItem::new("settings".to_string(), "Settings");
        let quit = CustomMenuItem::new("quit".to_string(), "Exit");

        let tray_menu = SystemTrayMenu::new()
            .add_item(open)
            .add_native_item(SystemTrayMenuItem::Separator)
            .add_item(settings)
            .add_native_item(SystemTrayMenuItem::Separator)
            .add_item(quit);

        SystemTray::new().with_menu(tray_menu)
    }

    pub fn initialize(&self, app_handle: &AppHandle) {
        if let Some(mut data_dir) = app_handle.path_resolver().app_data_dir() {
            if let Err(err) = fs::create_dir_all(&data_dir) {
                eprintln!("Failed to ensure tray settings directory: {err}");
            } else {
                data_dir.push("tray_settings.json");
                let mut settings_guard = self.settings.write();
                self.settings_path.write().replace(data_dir.clone());

                if let Ok(contents) = fs::read_to_string(&data_dir) {
                    if let Ok(parsed) = serde_json::from_str::<TraySettings>(&contents) {
                        *settings_guard = parsed;
                    }
                }
            }
        }

        if let Err(err) = self.apply_icon_style(app_handle) {
            eprintln!("Failed to apply tray icon style: {err}");
        }

        if let Err(err) = self.register_shortcut(app_handle) {
            eprintln!("Failed to register tray restore shortcut: {err}");
        }

        if let Err(err) = self.refresh_tray_menu(app_handle) {
            eprintln!("Failed to initialize tray menu: {err}");
        }
    }

    fn save_settings(&self) -> Result<(), String> {
        let path = {
            let path_guard = self.settings_path.read();
            path_guard.clone()
        };

        if let Some(path) = path {
            let settings = self.settings.read().clone();
            let contents = serde_json::to_string_pretty(&settings)
                .map_err(|e| format!("Failed to serialize tray settings: {e}"))?;
            fs::write(&path, contents)
                .map_err(|e| format!("Failed to persist tray settings: {e}"))?;
        }

        Ok(())
    }

    fn register_shortcut(&self, app_handle: &AppHandle) -> Result<(), String> {
        let mut registered = self.shortcut.write();
        if let Some(existing) = registered.clone() {
            if let Err(err) = app_handle.global_shortcut_manager().unregister(existing.as_str()) {
                eprintln!("Failed to unregister previous tray shortcut: {err}");
            }
            registered.take();
        }

        let shortcut = self.settings.read().restore_shortcut.clone();
        if let Some(shortcut) = shortcut {
            let app_clone = app_handle.clone();
            app_handle
                .global_shortcut_manager()
                .register(shortcut.as_str(), move || {
                    if let Some(window) = app_clone.get_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                })
                .map_err(|e| format!("Failed to register tray restore shortcut: {e}"))?;
            registered.replace(shortcut);
        }

        Ok(())
    }

    fn icon_label(style: &TrayIconStyle) -> &'static str {
        match style {
            TrayIconStyle::Default => "Eclipse",
            TrayIconStyle::Bullish => "🐂 Eclipse",
            TrayIconStyle::Bearish => "🐻 Eclipse",
            TrayIconStyle::Minimal => "EMP",
        }
    }

    fn apply_icon_style(&self, app_handle: &AppHandle) -> Result<(), String> {
        let settings = self.settings.read();
        let stats = self.stats.read();

        let mut title = Self::icon_label(&settings.icon_style).to_string();
        if settings.show_badge && stats.alert_count > 0 {
            title = format!("{} ({})", title, stats.alert_count);
        }

        app_handle
            .tray_handle()
            .set_title(Some(title))
            .map_err(|e| format!("Failed to set tray title: {e}"))
    }

    fn build_menu(&self) -> SystemTrayMenu {
        let settings = self.settings.read().clone();
        let stats = self.stats.read().clone();

        let mut menu = SystemTrayMenu::new();
        menu = menu.add_item(CustomMenuItem::new("open".to_string(), "Open"));

        if settings.show_stats {
            menu = menu.add_native_item(SystemTrayMenuItem::Separator);
            menu = menu.add_item(
                CustomMenuItem::new(
                    "portfolio".to_string(),
                    format!("Portfolio: ${:.2}", stats.portfolio_value),
                )
                .disabled(),
            );
            menu = menu.add_item(
                CustomMenuItem::new(
                    "pnl".to_string(),
                    format!("P&L: ${:.2} ({:.2}%)", stats.pnl_value, stats.pnl_percentage),
                )
                .disabled(),
            );
        }

        if settings.show_alerts && (!stats.recent_alerts.is_empty() || stats.alert_count > 0) {
            menu = menu.add_native_item(SystemTrayMenuItem::Separator);
            if stats.alert_count > 0 {
                menu = menu.add_item(
                    CustomMenuItem::new(
                        "alerts".to_string(),
                        format!("🔔 {} Alerts", stats.alert_count),
                    ),
                );
            }

            let limit = min(3, stats.recent_alerts.len());
            for preview in stats.recent_alerts.iter().take(limit) {
                menu = menu.add_item(
                    CustomMenuItem::new(
                        format!("alert-preview-{}", preview.id),
                        format!("{} — {}", preview.title, preview.summary),
                    )
                    .disabled(),
                );
            }
        }

        menu = menu.add_native_item(SystemTrayMenuItem::Separator);
        menu = menu.add_item(CustomMenuItem::new("settings".to_string(), "Settings"));
        menu = menu.add_native_item(SystemTrayMenuItem::Separator);
        menu = menu.add_item(CustomMenuItem::new("quit".to_string(), "Exit"));

        menu
    }

    pub fn refresh_tray_menu(&self, app_handle: &AppHandle) -> Result<(), String> {
        let menu = self.build_menu();
        app_handle
            .tray_handle()
            .set_menu(menu)
            .map_err(|e| format!("Failed to update tray menu: {e}"))
    }

    pub fn get_settings(&self) -> TraySettings {
        self.settings.read().clone()
    }

    pub fn update_settings(&self, app_handle: &AppHandle, new_settings: TraySettings) -> Result<(), String> {
        {
            let mut settings = self.settings.write();
            *settings = new_settings;
        }

        self.save_settings()?;
        self.apply_icon_style(app_handle)?;
        self.register_shortcut(app_handle)?;
        self.refresh_tray_menu(app_handle)?;
        Ok(())
    }

    pub fn update_stats(&self, app_handle: &AppHandle, new_stats: TrayStats) -> Result<(), String> {
        {
            let mut stats = self.stats.write();
            *stats = new_stats;
        }

        self.apply_icon_style(app_handle)?;
        self.refresh_tray_menu(app_handle)?;
        Ok(())
    }

    pub fn update_badge(&self, app_handle: &AppHandle, count: u32) -> Result<(), String> {
        {
            let mut stats = self.stats.write();
            stats.alert_count = count;
        }

        self.apply_icon_style(app_handle)?;
        self.refresh_tray_menu(app_handle)?
    }

    pub fn should_minimize_to_tray(&self) -> bool {
        let settings = self.settings.read();
        settings.enabled && settings.minimize_to_tray
    }

    pub fn should_close_to_tray(&self) -> bool {
        let settings = self.settings.read();
        settings.enabled && settings.close_to_tray
    }

    pub fn should_show_notifications(&self) -> bool {
        self.settings.read().show_notifications
    }

    pub fn notify_minimized(&self, app_handle: &AppHandle) {
        if !self.should_show_notifications() {
            return;
        }

        let identifier = app_handle.config().tauri.bundle.identifier.clone();
        let _ = Notification::new(identifier)
            .title("Eclipse Market Pro")
            .body("Application minimized to system tray. Press CmdOrControl+Shift+M to restore.")
            .show();
    }
}

pub type SharedTrayManager = Arc<TrayManager>;

pub fn handle_tray_event(app_handle: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            if let Some(window) = app_handle.get_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "open" => {
                if let Some(window) = app_handle.get_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "settings" => {
                if let Some(window) = app_handle.get_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                    let _ = window.emit("navigate-to-settings", ());
                }
            }
            "quit" => {
                std::process::exit(0);
            }
            "alerts" => {
                if let Some(window) = app_handle.get_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                    let _ = window.emit("show-alerts", ());
                }
            }
            _ => {}
        },
        _ => {}
    }
}

pub fn attach_window_listeners(window: &tauri::Window, tray_manager: SharedTrayManager) {
    let app_handle = window.app_handle();
    let handle_clone = app_handle.clone();
    let tray_manager_clone = tray_manager.clone();

    window.on_window_event(move |event| {
        match event {
            WindowEvent::CloseRequested { api, .. } => {
                if tray_manager_clone.should_close_to_tray() {
                    api.prevent_close();
                    if let Some(window) = handle_clone.get_window("main") {
                        let _ = window.hide();
                    }
                    tray_manager_clone.notify_minimized(&handle_clone);
                }
            }
            WindowEvent::Destroyed => {
                if let Some(shortcut) = tray_manager_clone.shortcut.read().clone() {
                    if let Err(err) = handle_clone.global_shortcut_manager().unregister(shortcut.as_str()) {
                        eprintln!("Failed to unregister tray shortcut on destroy: {err}");
                    }
                }
            }
            _ => {}
        }
    });
}

// Tauri commands

#[tauri::command]
pub fn get_tray_settings(tray_manager: tauri::State<'_, SharedTrayManager>) -> Result<TraySettings, String> {
    Ok(tray_manager.get_settings())
}

#[tauri::command]
pub fn update_tray_settings(
    settings: TraySettings,
    tray_manager: tauri::State<'_, SharedTrayManager>,
    app: AppHandle,
) -> Result<(), String> {
    tray_manager.update_settings(&app, settings)
}

#[tauri::command]
pub fn update_tray_stats(
    stats: TrayStats,
    tray_manager: tauri::State<'_, SharedTrayManager>,
    app: AppHandle,
) -> Result<(), String> {
    tray_manager.update_stats(&app, stats)
}

#[tauri::command]
pub fn update_tray_badge(
    count: u32,
    tray_manager: tauri::State<'_, SharedTrayManager>,
    app: AppHandle,
) -> Result<(), String> {
    tray_manager.update_badge(&app, count)
}

#[tauri::command]
pub fn minimize_to_tray(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        window.hide().map_err(|e| format!("Failed to hide window: {e}"))?;
    }
    if let Some(tray_manager) = app.try_state::<SharedTrayManager>() {
        tray_manager.notify_minimized(&app);
    }
    Ok(())
}

#[tauri::command]
pub fn restore_from_tray(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        window.show().map_err(|e| format!("Failed to show window: {e}"))?;
        window.unminimize().map_err(|e| format!("Failed to unminimize window: {e}"))?;
        window.set_focus().map_err(|e| format!("Failed to focus window: {e}"))?;
    }
    Ok(())
}
