// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Server {
    id: String,
    name: String,
    url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    token: Option<String>,
    color: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    icon: Option<String>,
    #[serde(rename = "keepLoaded", skip_serializing_if = "Option::is_none")]
    keep_loaded: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ServersConfig {
    servers: Vec<Server>,
    active_server_id: Option<String>,
}

fn get_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    // Use AppData/Roaming/sweetshark-client-v2 for data storage
    let mut path = app.path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    // Replace the default directory name with our custom one
    path.pop(); // Remove the default app name directory
    path.push("sweetshark-client-v2");
    path.push("servers.json");
    
    Ok(path)
}

fn load_servers(app: &AppHandle) -> Result<ServersConfig, String> {
    let config_path = get_config_path(app)?;
    
    if !config_path.exists() {
        return Ok(ServersConfig {
            servers: Vec::new(),
            active_server_id: None,
        });
    }
    
    let contents = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse config: {}", e))
}

fn save_servers(app: &AppHandle, config: &ServersConfig) -> Result<(), String> {
    let config_path = get_config_path(app)?;
    
    // Ensure the parent directory exists
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }
    
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn get_servers(app: AppHandle) -> Result<Vec<Server>, String> {
    let config = load_servers(&app)?;
    Ok(config.servers)
}

#[tauri::command]
fn add_server(app: AppHandle, server: Server) -> Result<Server, String> {
    let mut config = load_servers(&app)?;
    
    // Check if server with same ID already exists
    if config.servers.iter().any(|s| s.id == server.id) {
        return Err("Server with this ID already exists".to_string());
    }
    
    config.servers.push(server.clone());
    save_servers(&app, &config)?;
    
    Ok(server)
}

#[tauri::command]
fn update_server(app: AppHandle, server: Server) -> Result<Server, String> {
    let mut config = load_servers(&app)?;
    
    let position = config.servers.iter().position(|s| s.id == server.id)
        .ok_or_else(|| "Server not found".to_string())?;
    
    config.servers[position] = server.clone();
    save_servers(&app, &config)?;
    
    Ok(server)
}

#[tauri::command]
fn delete_server(app: AppHandle, server_id: String) -> Result<(), String> {
    let mut config = load_servers(&app)?;
    
    config.servers.retain(|s| s.id != server_id);
    
    // If the deleted server was active, clear active server
    if config.active_server_id.as_ref() == Some(&server_id) {
        config.active_server_id = None;
    }
    
    save_servers(&app, &config)?;
    
    Ok(())
}

#[tauri::command]
fn set_active_server(app: AppHandle, server_id: String) -> Result<(), String> {
    let mut config = load_servers(&app)?;
    
    // Verify server exists
    if !config.servers.iter().any(|s| s.id == server_id) {
        return Err("Server not found".to_string());
    }
    
    config.active_server_id = Some(server_id);
    save_servers(&app, &config)?;
    
    Ok(())
}

#[tauri::command]
fn get_active_server(app: AppHandle) -> Result<Option<Server>, String> {
    let config = load_servers(&app)?;
    
    Ok(config.active_server_id.and_then(|id| {
        config.servers.iter().find(|s| s.id == id).cloned()
    }))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_servers,
            add_server,
            update_server,
            delete_server,
            set_active_server,
            get_active_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
