use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, WebviewUrl};
use tauri::webview::WebviewBuilder;

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

    let combined_init = format!("{CONTEXT_MENU_SCRIPT}
{device_script}");

    let mut builder = WebviewBuilder::new(&label, WebviewUrl::External(parsed_url))
        .data_directory(data_dir)
        .initialization_script(&combined_init);

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
