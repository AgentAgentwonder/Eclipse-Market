use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AutomationRule {
    pub name: String,
    pub condition: String,
    pub action: String,
    pub enabled: bool,
    pub last_triggered: Option<DateTime<Utc>>,
}

#[derive(Debug, Default)]
pub struct AutomationEngine {
    rules: HashMap<String, AutomationRule>,
}

impl AutomationEngine {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_rule(&mut self, rule: AutomationRule) {
        self.rules.insert(rule.name.clone(), rule);
    }

    pub fn evaluate(&mut self, market_data: &super::realtime::MarketData) -> Vec<String> {
        let mut triggered = Vec::new();
        
        for rule in self.rules.values_mut().filter(|r| r.enabled) {
            // TODO: Implement actual condition evaluation
            if rule.condition.contains("bid > 100") && market_data.bid > 100.0 {
                triggered.push(rule.name.clone());
                rule.last_triggered = Some(Utc::now());
            }
        }
        
        triggered
    }
}

#[tauri::command]
pub async fn add_automation_rule(
    name: String,
    condition: String,
    action: String
) -> Result<(), String> {
    let rule = AutomationRule {
        name,
        condition,
        action,
        enabled: true,
        last_triggered: None,
    };
    
    // TODO: Store rule persistently
    Ok(())
}
