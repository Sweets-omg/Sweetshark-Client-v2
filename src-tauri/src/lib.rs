use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, WebviewUrl};
use tauri::webview::WebviewBuilder;

fn uuid_to_bytes(uuid_str: &str) -> [u8; 16] {
    let hex: String = uuid_str.chars().filter(|c| *c != '-').collect();
    let mut bytes = [0u8; 16];
    for i in 0..16 {
        let slice = hex.get(i * 2..i * 2 + 2).unwrap_or("00");
        bytes[i] = u8::from_str_radix(slice, 16).unwrap_or(0);
    }
    bytes
}

#[tauri::command]
async fn create_server_webview(
    app: AppHandle,
    label: String,
    url: String,
    server_id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if let Some(existing) = app.get_webview(&label) {
        existing.close().map_err(|e: tauri::Error| e.to_string())?;
    }

    let parsed_url: url::Url = url.parse().map_err(|e: url::ParseError| e.to_string())?;

    // Each server gets its own subdirectory under the app data dir:
    //   Windows: %APPDATA%\Sweetshark-client-v2\servers\<uuid>\
    //   macOS:   ~/Library/Application Support/Sweetshark-client-v2/servers/<uuid>/
    //   Linux:   ~/.local/share/Sweetshark-client-v2/servers/<uuid>/
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e: tauri::Error| e.to_string())?
        .join("servers")
        .join(&server_id);

    // Tauri never auto-creates directories — we must do it ourselves.
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data dir: {e}"))?;

    let window = app
        .get_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    let mut builder = WebviewBuilder::new(&label, WebviewUrl::External(parsed_url))
        .data_directory(data_dir);

    // data_store_identifier adds WebView2-level environment isolation on Windows,
    // on top of the separate data_directory above.
    #[cfg(target_os = "windows")]
    {
        builder = builder.data_store_identifier(uuid_to_bytes(&server_id));
    }

    window
        .add_child(
            builder,
            LogicalPosition::new(x, y),
            LogicalSize::new(width, height),
        )
        .map_err(|e: tauri::Error| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn reload_server_webview(app: AppHandle, label: String) -> Result<(), String> {
    let webview = app
        .get_webview(&label)
        .ok_or_else(|| format!("Webview not found: {label}"))?;
    webview
        .eval("window.location.reload()")
        .map_err(|e: tauri::Error| e.to_string())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Sweetshark Client.", name)
}

#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, open_url, create_server_webview, reload_server_webview])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
