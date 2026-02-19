use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, WebviewUrl};
use tauri::webview::WebviewBuilder;
use std::sync::{Arc, Mutex};

const CONTEXT_MENU_SCRIPT: &str = r#"
(function () {
  /* Styles are injected lazily on first _show() call — DO NOT touch the DOM
     at the top level because initialization_script runs before <head> exists. */
  var _stylesInjected = false;
  var _menu = null;

  function _injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    var s = document.createElement('style');
    s.id = '__ss_ctx_styles__';
    s.textContent =
      '#__ss_ctx__{position:fixed;z-index:2147483647;background:#1e1e21;' +
      'border:1px solid #2e2e33;border-radius:9px;padding:4px;min-width:190px;' +
      'box-shadow:0 8px 32px rgba(0,0,0,.65),0 2px 8px rgba(0,0,0,.4);' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;' +
      'font-size:13px;color:#d8d8e0;user-select:none;' +
      'animation:__ss_ctx_in .08s ease}' +
      '@keyframes __ss_ctx_in{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}' +
      '#__ss_ctx__ .ss-item{display:flex;align-items:center;padding:6px 11px;' +
      'border-radius:6px;cursor:pointer;white-space:nowrap;gap:9px;transition:background .1s}' +
      '#__ss_ctx__ .ss-item:hover{background:rgba(255,255,255,.09)}' +
      '#__ss_ctx__ .ss-item:active{background:rgba(255,255,255,.14)}' +
      '#__ss_ctx__ .ss-item.ss-disabled{opacity:.35;cursor:default;pointer-events:none}' +
      '#__ss_ctx__ .ss-sep{height:1px;background:#2e2e33;margin:3px 6px}' +
      '#__ss_ctx__ .ss-icon{width:16px;height:16px;display:flex;align-items:center;' +
      'justify-content:center;opacity:.65;flex-shrink:0}' +
      '#__ss_ctx__ .ss-shortcut{margin-left:auto;font-size:11px;opacity:.35;padding-left:20px}';
    (document.head || document.documentElement).appendChild(s);
  }

  function _remove() {
    if (_menu) { _menu.remove(); _menu = null; }
  }

  function _icon(svg) {
    var s = document.createElement('span');
    s.className = 'ss-icon';
    s.innerHTML = svg;
    return s;
  }

  var ICONS = {
    save:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    copy:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    cut:       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="20" r="2"/><circle cx="6" cy="4" r="2"/><line x1="14.5" y1="14.5" x2="6" y2="18"/><line x1="6" y1="6" x2="14.5" y2="9.5"/><polyline points="21 3 16 8 21 13"/></svg>',
    paste:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
    selectall: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>',
    link:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    open:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    img:       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
  };

  function _show(items, x, y) {
    _remove();
    if (!items.length) return;
    _injectStyles();

    _menu = document.createElement('div');
    _menu.id = '__ss_ctx__';

    items.forEach(function(item) {
      if (item === 'sep') {
        var s = document.createElement('div');
        s.className = 'ss-sep';
        _menu.appendChild(s);
      } else {
        var el = document.createElement('div');
        el.className = 'ss-item' + (item.disabled ? ' ss-disabled' : '');
        el.appendChild(_icon(ICONS[item.icon] || ''));
        var lbl = document.createElement('span');
        lbl.textContent = item.label;
        el.appendChild(lbl);
        if (item.shortcut) {
          var sc = document.createElement('span');
          sc.className = 'ss-shortcut';
          sc.textContent = item.shortcut;
          el.appendChild(sc);
        }
        el.addEventListener('mousedown', function(ev) { ev.stopPropagation(); });
        if (!item.disabled) {
          el.addEventListener('click', function() { item.action(); _remove(); });
        }
        _menu.appendChild(el);
      }
    });

    (document.body || document.documentElement).appendChild(_menu);

    var mw = _menu.offsetWidth, mh = _menu.offsetHeight;
    var left = (x + mw > window.innerWidth)  ? x - mw : x;
    var top  = (y + mh > window.innerHeight) ? y - mh : y;
    _menu.style.left = Math.max(0, left) + 'px';
    _menu.style.top  = Math.max(0, top)  + 'px';
  }

  function _handle(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var t = e.target;
    var items = [];

    /* Input / Textarea */
    var isInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA';
    var ceEl    = !isInput && t.closest && t.closest('[contenteditable="true"]');
    var isCE    = !isInput && (t.isContentEditable || !!ceEl);

    if (isInput || isCE) {
      var isEditable = isInput ? (!t.readOnly && !t.disabled) : true;
      var hasSelection = false;
      if (isInput) {
        hasSelection = typeof t.selectionStart === 'number' && t.selectionStart !== t.selectionEnd;
      } else {
        var ws = window.getSelection();
        hasSelection = ws && ws.toString().trim().length > 0;
      }

      if (hasSelection && isEditable) {
        items.push({ icon: 'cut', label: 'Cut', shortcut: 'Ctrl+X', action: function() { document.execCommand('cut'); }});
      }
      if (hasSelection) {
        items.push({ icon: 'copy', label: 'Copy', shortcut: 'Ctrl+C', action: function() { document.execCommand('copy'); }});
      }
      if (isEditable) {
        items.push({ icon: 'paste', label: 'Paste', shortcut: 'Ctrl+V', action: function() {
          navigator.clipboard.readText().then(function(text) {
            document.execCommand('insertText', false, text);
          }).catch(function() { document.execCommand('paste'); });
        }});
      }
      if (items.length) items.push('sep');
      items.push({ icon: 'selectall', label: 'Select All', shortcut: 'Ctrl+A', action: function() {
        if (isInput) { t.select(); } else { document.execCommand('selectAll'); }
      }});

      _show(items, e.clientX, e.clientY);
      return;
    }

    /* Image */
    var img = (t.tagName === 'IMG') ? t : (t.closest ? t.closest('img') : null);
    if (img && img.src) {
      items.push({ icon: 'save', label: 'Save Image As\u2026', action: function() {
        var a = document.createElement('a');
        a.href = img.src;
        a.download = img.src.split('/').pop().split('?')[0] || 'image';
        document.body.appendChild(a); a.click(); a.remove();
      }});
      items.push({ icon: 'copy', label: 'Copy Image Address', action: function() {
        navigator.clipboard.writeText(img.src).catch(function(){});
      }});
    }

    /* Link */
    var anchor = (t.tagName === 'A') ? t : (t.closest ? t.closest('a') : null);
    if (anchor && anchor.href) {
      if (items.length) items.push('sep');
      items.push({ icon: 'open', label: 'Open Link', action: function() { window.open(anchor.href, '_blank'); }});
      items.push({ icon: 'link', label: 'Copy Link Address', action: function() {
        navigator.clipboard.writeText(anchor.href).catch(function(){});
      }});
    }

    /* Text selection */
    var sel = window.getSelection && window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      var selText = sel.toString();
      if (items.length) items.push('sep');
      items.push({ icon: 'copy', label: 'Copy', shortcut: 'Ctrl+C', action: function() {
        navigator.clipboard.writeText(selText).catch(function(){});
      }});
    }

    _show(items, e.clientX, e.clientY);
  }

  document.addEventListener('contextmenu', _handle, true);
  document.oncontextmenu = function(e) { e.preventDefault(); return false; };

  document.addEventListener('mousedown', function(e) {
    if (_menu && !_menu.contains(e.target)) _remove();
  }, true);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') _remove();
  });
  window.addEventListener('scroll', _remove, { passive: true, capture: true });
})();
"#;


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
    mic_id: Option<String>,
    cam_id: Option<String>,
    speaker_id: Option<String>,
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

    // Build the device-preference override script with the chosen device IDs
    // baked in at webview creation time. It patches getUserMedia, enumerateDevices,
    // and auto-applies setSinkId on audio/video elements so the Sharkord server
    // can only ever see / use the devices the user has selected.
    let mic_js    = mic_id    .as_deref().unwrap_or("");
    let cam_js    = cam_id    .as_deref().unwrap_or("");
    let speaker_js = speaker_id.as_deref().unwrap_or("");
    let device_script = format!(r#"
(function(){{
  var MIC_ID     = {mic_json};
  var CAM_ID     = {cam_json};
  var SPEAKER_ID = {speaker_json};

  /* ── Helpers: resolve a stored device label to a live deviceId ─────── */
  // Device IDs are not stable across isolated WebView2 contexts (each server
  // webview has its own data directory, so the browser assigns different IDs
  // to the same physical device). Labels ARE stable — we use those instead.
  function _resolveId(kind, label) {{
    // Returns a Promise<string|null>
    var _e = navigator.mediaDevices.enumerateDevices.__ss_orig ||
             navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    return _e().then(function(all) {{
      var match = all.find(function(d) {{ return d.kind === kind && d.label === label; }});
      return match ? match.deviceId : null;
    }});
  }}

  /* ── getUserMedia: force selected device by label ───────────────────── */
  var _gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = function(c) {{
    c = c ? JSON.parse(JSON.stringify(c)) : {{}};
    var promises = [];
    if (MIC_ID && c.audio) {{
      promises.push(_resolveId('audioinput', MIC_ID).then(function(id) {{
        if (id) c.audio = typeof c.audio === 'object'
          ? Object.assign({{}}, c.audio, {{ deviceId: {{ exact: id }} }})
          : {{ deviceId: {{ exact: id }} }};
      }}));
    }}
    if (CAM_ID && c.video) {{
      promises.push(_resolveId('videoinput', CAM_ID).then(function(id) {{
        if (id) c.video = typeof c.video === 'object'
          ? Object.assign({{}}, c.video, {{ deviceId: {{ exact: id }} }})
          : {{ deviceId: {{ exact: id }} }};
      }}));
    }}
    return Promise.all(promises).then(function() {{ return _gum(c); }});
  }};

  /* ── enumerateDevices: hide unselected devices (filter by label) ─────── */
  var _enum = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
  // Store original so _resolveId can bypass our override
  navigator.mediaDevices.enumerateDevices.__ss_orig = _enum;
  navigator.mediaDevices.enumerateDevices = function() {{
    return _enum().then(function(all) {{
      return all.filter(function(d) {{
        // Always pass through devices with empty deviceId or label — these are
        // returned before permission is granted (browser privacy masking).
        if (!d.deviceId || !d.label) return true;
        if (d.kind === 'audioinput')  return !MIC_ID     || d.deviceId === 'default' || d.label === MIC_ID;
        if (d.kind === 'videoinput')  return !CAM_ID     || d.label === CAM_ID;
        if (d.kind === 'audiooutput') return !SPEAKER_ID || d.deviceId === 'default' || d.label === SPEAKER_ID;
        return true;
      }});
    }});
  }};

  /* ── setSinkId: auto-apply speaker to all audio/video elements ──────── */
  if (SPEAKER_ID) {{
    // Resolve speaker label to actual deviceId for setSinkId
    var _resolvedSpeakerId = null;
    _resolveId('audiooutput', SPEAKER_ID).then(function(id) {{ _resolvedSpeakerId = id; }});
    function _sink(el) {{
      if (el.setSinkId && !el.__ssSink) {{
        el.__ssSink = true;
        var sid = _resolvedSpeakerId || SPEAKER_ID;
        el.setSinkId(sid).catch(function(){{}});
      }}
    }}
    var _obs = new MutationObserver(function(ms) {{
      ms.forEach(function(m) {{
        m.addedNodes.forEach(function(n) {{
          if (n.nodeType !== 1) return;
          if (n.tagName === 'AUDIO' || n.tagName === 'VIDEO') _sink(n);
          if (n.querySelectorAll) n.querySelectorAll('audio,video').forEach(_sink);
        }});
      }});
    }});
    _obs.observe(document.documentElement, {{ subtree: true, childList: true }});
    document.addEventListener('DOMContentLoaded', function() {{
      document.querySelectorAll('audio,video').forEach(_sink);
    }});
  }}
}})();
"#,
        mic_json     = serde_json::to_string(mic_js)    .unwrap_or_default(),
        cam_json     = serde_json::to_string(cam_js)    .unwrap_or_default(),
        speaker_json = serde_json::to_string(speaker_js).unwrap_or_default(),
    );


    // PTT is now handled at the OS level via IAudioEndpointVolume (Windows Core
    // Audio API). No JavaScript injection needed for mute control.
    const PTT_SCRIPT: &str = "";

    let combined_init = format!("{CONTEXT_MENU_SCRIPT}
{device_script}
{PTT_SCRIPT}");

    let mut builder = WebviewBuilder::new(&label, WebviewUrl::External(parsed_url))
        .data_directory(data_dir)
        .initialization_script(&combined_init)
        // Tauri intercepts drag-and-drop at the OS level by default, which
        // prevents the browser's native DataTransfer / drop events from firing
        // inside the webview. Disabling it lets Sharkord's file upload handler
        // receive drag-and-drop events exactly as it would in a normal browser.
        .disable_drag_drop_handler();

    // data_store_identifier adds WebView2-level environment isolation on Windows,
    // on top of the separate data_directory above.
    #[cfg(target_os = "windows")]
    {
        builder = builder.data_store_identifier(uuid_to_bytes(&server_id));
    }

    let wv = window
        .add_child(
            builder,
            LogicalPosition::new(x, y),
            LogicalSize::new(width, height),
        )
        .map_err(|e: tauri::Error| e.to_string())?;

    // On Windows: disable the native WebView2 context menu entirely at the OS
    // level via ICoreWebView2Settings. This is the only reliable way to prevent
    // the native edit/image/inspect menus from appearing alongside our custom JS
    // menu.  Our initialization_script still shows the custom JS menu because
    // the JS `contextmenu` event fires independently of AreDefaultContextMenusEnabled.
    // We also disable DevTools (F12 / Ctrl+Shift+I) since this is a production client.
    #[cfg(windows)]
    {
        let wv_clone = wv.clone();
        // spawn_blocking so we don't deadlock the async command's thread —
        // with_webview dispatches the closure to the main thread synchronously.
        tauri::async_runtime::spawn(async move {
            wv_clone.with_webview(|webview| {
                unsafe {
                    // Settings() already returns ICoreWebView2Settings — no cast needed
                    let settings = webview
                        .controller()
                        .CoreWebView2()
                        .expect("get CoreWebView2")
                        .Settings()
                        .expect("get ICoreWebView2Settings");

                    // webview2-com 0.38 wraps these methods to take plain Rust bool
                    settings
                        .SetAreDefaultContextMenusEnabled(false)
                        .expect("SetAreDefaultContextMenusEnabled");
                    settings
                        .SetAreDevToolsEnabled(false)
                        .expect("SetAreDevToolsEnabled");
                }
            }).ok();
        });
    }

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
/// Delete the on-disk data directory for a server that has been removed.
/// Called by the frontend after destroying the webview so all cached cookies,
/// IndexedDB, localStorage, and WebView2 profile data are fully wiped.
///
/// On Windows, WebView2 holds an exclusive lock on its data directory until
/// the browser process fully exits. We retry deletion for up to ~3 seconds
/// to give the process time to release the lock after wv.close() returns.
async fn delete_server_data(app: AppHandle, server_id: String) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e: tauri::Error| e.to_string())?
        .join("servers")
        .join(&server_id);

    if !data_dir.exists() {
        return Ok(()); // already gone
    }

    // Retry loop: WebView2 on Windows keeps files locked for a short time after
    // the webview is closed. Retry every 200 ms for up to 3 seconds.
    let max_attempts = 15u32;
    let mut last_err = String::new();
    for attempt in 0..max_attempts {
        match std::fs::remove_dir_all(&data_dir) {
            Ok(_) => return Ok(()),
            Err(e) => {
                last_err = e.to_string();
                // Only sleep between retries, not after the last attempt
                if attempt + 1 < max_attempts {
                    std::thread::sleep(std::time::Duration::from_millis(200));
                }
            }
        }
    }

    Err(format!("Failed to delete server data for {server_id} after {max_attempts} attempts: {last_err}"))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Sweetshark Client.", name)
}

/// Returns the current app version string from the compiled-in Cargo.toml version.
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Checks the GitHub releases API for the latest release tag on the
/// Sweets-omg/Sweetshark-Client-v2 repo and returns it as a string,
/// or an empty string if the check fails (network unavailable, etc.).
/// Tags are expected in the format "V.X.X.X" (e.g. "V.2.0.1").
#[tauri::command]
async fn check_for_update() -> String {
    let client = match reqwest::Client::builder()
        .user_agent("Sweetshark-Client-v2-updater")
        .timeout(std::time::Duration::from_secs(8))
        .build()
    {
        Ok(c) => c,
        Err(_) => return String::new(),
    };

    let res = client
        .get("https://api.github.com/repos/Sweets-omg/Sweetshark-Client-v2/releases/latest")
        .send()
        .await;

    let body = match res {
        Ok(r) => match r.json::<serde_json::Value>().await {
            Ok(j) => j,
            Err(_) => return String::new(),
        },
        Err(_) => return String::new(),
    };

    // GitHub returns { "tag_name": "V.2.0.1", ... }
    body["tag_name"]
        .as_str()
        .unwrap_or("")
        .to_string()
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


// ── Push-to-talk ─────────────────────────────────────────────────────────────
//
// Uses GetAsyncKeyState polling on a dedicated thread so that PTT works
// regardless of which window has focus — including when the Tauri/WebView2
// window itself is focused.
//
// WH_KEYBOARD_LL was tried first but WebView2 consumes keyboard events before
// they reach a low-level hook's message pump when the webview has focus.
// GetAsyncKeyState reads key state directly from the keyboard driver and is
// completely unaffected by focus or message routing.
//
// Mouse buttons (right, middle, XButton1/2) also have real Win32 VK codes
// that GetAsyncKeyState understands, so we use one unified approach for
// everything — no hooks, no message loop, no unsafe pointer juggling.
//
// Poll interval: 5 ms  (~200 Hz) — imperceptible latency for PTT.

#[derive(Clone, serde::Serialize, serde::Deserialize, Default)]
pub struct PttConfig {
    pub enabled: bool,
    /// Normalised key tokens sent from the frontend, e.g. ["alt", "mouse4"]
    pub keys: Vec<String>,
}

pub struct PttState {
    pub config: PttConfig,
    /// Send () here to stop the current poll thread.
    pub stop_tx: Option<std::sync::mpsc::Sender<()>>,
}

type SharedPttState = Arc<Mutex<PttState>>;

#[tauri::command]
fn get_ptt_config(state: tauri::State<SharedPttState>) -> PttConfig {
    state.lock().unwrap().config.clone()
}

/// Convert a frontend key token to a Win32 virtual-key code.
///
/// Accepts browser KeyboardEvent.code style ("ShiftLeft", "AltLeft"),
/// common short names ("shift", "alt", "mouse4"), and single characters.
/// Case-insensitive.
///
/// Mouse buttons map to their real Win32 VK codes:
///   VK_RBUTTON  = 0x02  (right)
///   VK_MBUTTON  = 0x04  (middle / mouse3)
///   VK_XBUTTON1 = 0x05  (mouse4 / side-back)
///   VK_XBUTTON2 = 0x06  (mouse5 / side-forward)
#[cfg(windows)]
fn token_to_vk(token: &str) -> Option<u32> {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
    let t = token.to_ascii_lowercase();
    let t = t.trim();
    Some(match t {
        // ── Ctrl ──────────────────────────────────────────────────────────────
        "ctrl" | "control" | "lctrl" | "lcontrol" | "controlleft" => VK_LCONTROL as u32,
        "rctrl" | "rcontrol" | "controlright"                      => VK_RCONTROL as u32,
        // ── Shift ─────────────────────────────────────────────────────────────
        "shift" | "lshift" | "shiftleft"                           => VK_LSHIFT as u32,
        "rshift" | "shiftright"                                    => VK_RSHIFT as u32,
        // ── Alt ───────────────────────────────────────────────────────────────
        "alt" | "lalt" | "lmenu" | "altleft" | "menu"             => VK_LMENU as u32,
        "ralt" | "rmenu" | "altright" | "altgr"                    => VK_RMENU as u32,
        // ── Win / Super ───────────────────────────────────────────────────────
        "super" | "meta" | "win" | "metaleft" | "osleft"           => VK_LWIN as u32,
        "metaright" | "osright"                                    => VK_RWIN as u32,
        // ── Common keys ───────────────────────────────────────────────────────
        "space"                                                    => VK_SPACE as u32,
        "enter" | "return" | "numpadenter"                         => VK_RETURN as u32,
        "escape" | "esc"                                           => VK_ESCAPE as u32,
        "backspace"                                                => VK_BACK as u32,
        "tab"                                                      => VK_TAB as u32,
        "delete" | "del"                                           => VK_DELETE as u32,
        "insert" | "ins"                                           => VK_INSERT as u32,
        "home"                                                     => VK_HOME as u32,
        "end"                                                      => VK_END as u32,
        "pageup"                                                   => VK_PRIOR as u32,
        "pagedown"                                                 => VK_NEXT as u32,
        "arrowup"    | "up"                                        => VK_UP as u32,
        "arrowdown"  | "down"                                      => VK_DOWN as u32,
        "arrowleft"  | "left"                                      => VK_LEFT as u32,
        "arrowright" | "right"                                     => VK_RIGHT as u32,
        "capslock"                                                 => VK_CAPITAL as u32,
        // ── Function keys ─────────────────────────────────────────────────────
        "f1"  => VK_F1  as u32, "f2"  => VK_F2  as u32,
        "f3"  => VK_F3  as u32, "f4"  => VK_F4  as u32,
        "f5"  => VK_F5  as u32, "f6"  => VK_F6  as u32,
        "f7"  => VK_F7  as u32, "f8"  => VK_F8  as u32,
        "f9"  => VK_F9  as u32, "f10" => VK_F10 as u32,
        "f11" => VK_F11 as u32, "f12" => VK_F12 as u32,
        // ── Misc ──────────────────────────────────────────────────────────────
        "print" | "printscreen"                                    => VK_SNAPSHOT as u32,
        "scrolllock"                                               => VK_SCROLL as u32,
        "pause"                                                    => VK_PAUSE as u32,
        "numlock"                                                  => VK_NUMLOCK as u32,
        // ── Mouse buttons (real Win32 VK codes) ───────────────────────────────
        "mouse2" | "mouseright"  | "rightbutton"                   => VK_RBUTTON  as u32,
        "mouse3" | "mousemiddle" | "middlebutton"                  => VK_MBUTTON  as u32,
        "mouse4" | "xbutton1"                                      => VK_XBUTTON1 as u32,
        "mouse5" | "xbutton2"                                      => VK_XBUTTON2 as u32,
        // ── Single-character fallback via VkKeyScanW ──────────────────────────
        other => {
            let chars: Vec<char> = other.chars().collect();
            if chars.len() == 1 {
                let scan = unsafe {
                    windows_sys::Win32::UI::Input::KeyboardAndMouse::VkKeyScanW(chars[0] as u16)
                };
                if scan != -1i16 {
                    (scan & 0xFF) as u32
                } else {
                    return None;
                }
            } else {
                return None;
            }
        }
    })
}

#[cfg(not(windows))]
fn token_to_vk(_token: &str) -> Option<u32> { None }

/// Spawn a dedicated poll thread that watches ONLY the exact VK codes in
/// `vk_set` — nothing else is ever read.
///
/// Privacy guarantee:
///   • This thread is started ONLY when PTT is enabled by the user.
///   • It calls GetAsyncKeyState for the assigned key(s) only — no other
///     keys, no text, no clipboard, no window titles.
///   • Sending () on the returned channel stops the thread immediately.
///     The thread is also the only thing that owns the VK list; when it
///     exits the list is dropped and no key state is ever read again.
///   • No data leaves the process: the only output is a boolean
///     "ptt://pressed" / "ptt://released" Tauri event.
/// Mute or unmute the default Windows microphone at the OS/driver level using
/// the Core Audio API (IAudioEndpointVolume). This is reliable regardless of
/// how the web app (mediasoup/WebRTC) manages its audio pipeline internally.
#[cfg(windows)]
fn ptt_set_mic_mute(muted: bool) {
    use windows::{
        Win32::Media::Audio::{eCapture, eConsole, IMMDeviceEnumerator, MMDeviceEnumerator, Endpoints::IAudioEndpointVolume},
        Win32::System::Com::{CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_ALL, COINIT_APARTMENTTHREADED},
        Win32::Foundation::BOOL,
    };

    unsafe {
        let hr_init = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
        let com_inited = hr_init.is_ok() || hr_init.0 == 1; // S_OK or S_FALSE

        let enumerator: Result<IMMDeviceEnumerator, _> =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL);
        let Ok(enumerator) = enumerator else {
            if com_inited { CoUninitialize(); }
            return;
        };

        let Ok(device) = enumerator.GetDefaultAudioEndpoint(eCapture, eConsole) else {
            if com_inited { CoUninitialize(); }
            return;
        };

        let Ok(vol) = device.Activate::<IAudioEndpointVolume>(CLSCTX_ALL, None) else {
            if com_inited { CoUninitialize(); }
            return;
        };

        let mute_val = BOOL::from(muted);
        let _ = vol.SetMute(mute_val, std::ptr::null());

        if com_inited { CoUninitialize(); }
    }
}

#[cfg(not(windows))]
fn ptt_set_mic_mute(_muted: bool) {}

#[cfg(windows)]
fn start_ptt_hook(
    app: AppHandle,
    vk_set: Vec<u32>,
) -> std::sync::mpsc::Sender<()> {
    use std::sync::mpsc;

    let (stop_tx, stop_rx) = mpsc::channel::<()>();

    // Move the VK list into the thread — nothing outside the thread can
    // access it once we hand it over.
    let vks: Vec<i32> = vk_set.into_iter().map(|v| v as i32).collect();

    std::thread::Builder::new()
        // Named so it's identifiable in debuggers / task managers.
        .name("sweetshark-ptt-poll".into())
        .spawn(move || {
            let mut was_active = false;

            loop {
                // Exit as soon as the stop signal arrives.
                if stop_rx.try_recv().is_ok() {
                    if was_active {
                        // Re-mute on disable so audio doesn't stay open.
                        ptt_set_mic_mute(true);
                        let _ = app.emit("ptt://released", ());
                    }
                    // vks is dropped here — no key state is read after this point.
                    break;
                }

                // GetAsyncKeyState reads raw hardware key state.
                // We call it ONLY for the keys in vks — the user-assigned PTT
                // keys — and we do nothing with the result except check whether
                // ALL of them are simultaneously held (bit 15 set = down).
                // No keystroke data is stored, logged, or transmitted.
                let all_down = vks.iter().all(|&vk| {
                    (unsafe {
                        windows_sys::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState(vk)
                    } as u16) & 0x8000 != 0
                });

                if all_down && !was_active {
                    was_active = true;
                    // Unmute: PTT key pressed → allow microphone audio through.
                    ptt_set_mic_mute(false);
                    let _ = app.emit("ptt://pressed", ());
                } else if !all_down && was_active {
                    was_active = false;
                    // Mute: PTT key released → silence microphone.
                    ptt_set_mic_mute(true);
                    let _ = app.emit("ptt://released", ());
                }

                std::thread::sleep(std::time::Duration::from_millis(5));
            }
        })
        .expect("failed to spawn PTT poll thread");

    stop_tx
}

#[cfg(not(windows))]
fn start_ptt_hook(
    _app: AppHandle,
    _vk_set: Vec<u32>,
) -> std::sync::mpsc::Sender<()> {
    let (tx, _rx) = std::sync::mpsc::channel();
    tx
}

/// Enable or disable PTT.
///
/// When `enabled` is false (or `keys` is empty) any running poll thread is
/// stopped immediately and no key state is read until the user explicitly
/// re-enables PTT. This is the sole entry-point that controls whether the
/// poll thread exists at all.
#[tauri::command]
async fn set_ptt_config(
    app: AppHandle,
    state: tauri::State<'_, SharedPttState>,
    keys: Vec<String>,
    enabled: bool,
) -> Result<(), String> {
    // Always stop the existing thread first — whether we're disabling, changing
    // keys, or re-enabling. This guarantees only one poll thread ever exists.
    {
        let mut locked = state.lock().unwrap();
        if let Some(tx) = locked.stop_tx.take() {
            let _ = tx.send(());
            // stop_tx is now None — thread will exit on its next iteration.
        }
        locked.config.keys    = keys.clone();
        locked.config.enabled = enabled;
    }

    // Only start a new thread when PTT is explicitly enabled with a valid keybind.
    // If disabled or no keys are set, nothing runs — no key state is ever polled.
    if enabled && !keys.is_empty() {
        let vk_set: Vec<u32> = keys.iter()
            .filter_map(|k| token_to_vk(k))
            .collect();

        if vk_set.is_empty() {
            return Err(format!("No recognisable keys in: {:?}", keys));
        }

        // PTT starting: webviews begin in muted state (the init script already
        // does this, but ensure any already-running webviews are muted too).
        ptt_set_mic_mute(true);

        let stop_tx = start_ptt_hook(app, vk_set);
        state.lock().unwrap().stop_tx = Some(stop_tx);
    } else {
        // PTT disabled: restore normal open-mic behaviour in all webviews.
        ptt_set_mic_mute(false);
    }

    Ok(())
}

/// Returns true if the PTT poll thread is currently running.
/// The frontend can expose this to users as proof that no key polling
/// is happening when PTT is disabled.
#[tauri::command]
fn get_ptt_active(state: tauri::State<'_, SharedPttState>) -> bool {
    state.lock().unwrap().stop_tx.is_some()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let ptt_state: SharedPttState = Arc::new(Mutex::new(PttState {
        config: PttConfig::default(),
        stop_tx: None,
    }));

    tauri::Builder::default()
        .manage(ptt_state)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_version,
            check_for_update,
            open_url,
            create_server_webview,
            reload_server_webview,
            delete_server_data,
            get_ptt_config,
            set_ptt_config,
            get_ptt_active,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
