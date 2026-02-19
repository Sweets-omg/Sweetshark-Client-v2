import { useState, useEffect, useCallback, useRef } from "react";
import PttKeybindDialog from "./PttKeybindDialog";
import "./SettingsPage.css";

const IS_TAURI = typeof (window as any).__TAURI_INTERNALS__ !== "undefined";

// ── Appearance ────────────────────────────────────────────────────────────────

interface AppearanceSettings {
  accentColor: string;
  windowBg: string;
  sidebarBg: string;
  serverCircleBg: string;
}

const DEFAULTS: AppearanceSettings = {
  accentColor: "#4E0073",
  windowBg: "#262626",
  sidebarBg: "#1E1E1E",
  serverCircleBg: "#2E2E2E",
};

function lighten(hex: string, amount: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const num = parseInt(cleaned, 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function applySettings(settings: AppearanceSettings) {
  const root = document.documentElement;
  root.style.setProperty("--accent", settings.accentColor);
  root.style.setProperty("--accent-hover", lighten(settings.accentColor, 20));
  root.style.setProperty("--toggle-on", settings.accentColor);
  root.style.setProperty("--window-bg", settings.windowBg);
  root.style.setProperty("--sidebar-bg", settings.sidebarBg);
  root.style.setProperty("--server-circle-bg", settings.serverCircleBg);
}

async function getStore() {
  const { load } = await import("@tauri-apps/plugin-store");
  return load("config.json", { autoSave: true });
}

async function loadAppearance(): Promise<AppearanceSettings> {
  if (!IS_TAURI) return DEFAULTS;
  try {
    const store = await getStore();
    const saved = await store.get<AppearanceSettings>("appearance");
    return saved ? { ...DEFAULTS, ...saved } : DEFAULTS;
  } catch { return DEFAULTS; }
}

async function saveAppearance(settings: AppearanceSettings) {
  if (!IS_TAURI) return;
  try { const store = await getStore(); await store.set("appearance", settings); }
  catch (e) { console.error("Failed to save appearance:", e); }
}

// ── Device preferences ────────────────────────────────────────────────────────

interface DevicePrefs { micId?: string; camId?: string; speakerId?: string; }

async function loadDevicePrefs(): Promise<DevicePrefs> {
  if (!IS_TAURI) return {};
  try { const store = await getStore(); return (await store.get<DevicePrefs>("devicePreferences")) ?? {}; }
  catch { return {}; }
}

async function saveDevicePrefs(prefs: DevicePrefs) {
  if (!IS_TAURI) return;
  try { const store = await getStore(); await store.set("devicePreferences", prefs); }
  catch (e) { console.error("Failed to save device prefs:", e); }
}


// ── Push-to-talk config ────────────────────────────────────────────────────────

export interface PttConfig {
  enabled: boolean;
  keys: string[];        // browser key names, e.g. ["Control", "Space"]
  tauriKeys: string[];   // tauri shortcut tokens, e.g. ["ctrl", "space"]
}

const PTT_DEFAULT: PttConfig = { enabled: false, keys: [], tauriKeys: [] };

async function loadPttConfig(): Promise<PttConfig> {
  if (!IS_TAURI) return PTT_DEFAULT;
  try { const store = await getStore(); return (await store.get<PttConfig>("pttConfig")) ?? PTT_DEFAULT; }
  catch { return PTT_DEFAULT; }
}

async function savePttConfig(cfg: PttConfig) {
  if (!IS_TAURI) return;
  try { const store = await getStore(); await store.set("pttConfig", cfg); }
  catch (e) { console.error("Failed to save PTT config:", e); }
}

async function applyPttConfig(cfg: PttConfig) {
  if (!IS_TAURI) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_ptt_config", { keys: cfg.tauriKeys, enabled: cfg.enabled });
  } catch (e) { console.error("Failed to apply PTT config:", e); }
}

// Display helpers (same mapping as PttKeybindDialog)
const KEY_DISPLAY_MAP: Record<string, string> = {
  Control: "Ctrl", Meta: "⌘",
  ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
  " ": "Space", Escape: "Esc", Delete: "Del",
};
function displayKey(k: string): string {
  return KEY_DISPLAY_MAP[k] ?? (k.length === 1 ? k.toUpperCase() : k);
}

async function enumerateByKind(kind: MediaDeviceKind): Promise<MediaDeviceInfo[]> {
  try { return (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === kind); }
  catch { return []; }
}

// ── Permissions helpers ───────────────────────────────────────────────────────

type PermStatus = "granted" | "denied" | "prompt" | "unknown";

async function queryPermStatus(name: "microphone" | "camera"): Promise<PermStatus> {
  try { return (await navigator.permissions.query({ name: name as PermissionName })).state as PermStatus; }
  catch { return "unknown"; }
}

async function requestPermission(name: "microphone" | "camera"): Promise<PermStatus> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      name === "microphone" ? { audio: true, video: false } : { audio: false, video: true }
    );
    stream.getTracks().forEach(t => t.stop());
    return "granted";
  } catch { return "denied"; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function PermBadge({ status }: { status: PermStatus }) {
  const map: Record<PermStatus, { label: string; cls: string }> = {
    granted: { label: "Granted",   cls: "sp-badge--granted" },
    denied:  { label: "Denied",    cls: "sp-badge--denied"  },
    prompt:  { label: "Not asked", cls: "sp-badge--prompt"  },
    unknown: { label: "Unknown",   cls: "sp-badge--prompt"  },
  };
  const { label, cls } = map[status];
  return <span className={`sp-badge ${cls}`}>{label}</span>;
}

interface ColorRowProps {
  label: string; description: string; value: string; defaultValue: string;
  onChange: (val: string) => void; onReset: () => void;
}

function ColorRow({ label, description, value, defaultValue, onChange, onReset }: ColorRowProps) {
  const isDefault = value.toLowerCase() === defaultValue.toLowerCase();
  return (
    <div className="settings-row">
      <div className="settings-row-info">
        <span className="settings-row-label">{label}</span>
        <span className="settings-row-desc">{description}</span>
      </div>
      <div className="settings-row-controls">
        <label className="color-swatch-wrap" title="Pick color">
          <div className="color-swatch" style={{ background: value }} />
          <input type="color" value={value.length === 7 ? value : "#000000"}
            onChange={e => onChange(e.target.value)} className="color-input-hidden" />
        </label>
        <input type="text" className="settings-hex-input" value={value.toUpperCase()}
          onChange={e => { const v = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v); }}
          maxLength={7} spellCheck={false} />
        <button className={`settings-reset-btn ${isDefault ? "settings-reset-btn--dim" : ""}`}
          onClick={onReset} title="Reset to default"><ResetIcon /></button>
      </div>
    </div>
  );
}

interface DeviceSelectProps {
  label: string; description: string;
  devices: MediaDeviceInfo[]; selectedId: string | undefined;
  permStatus: PermStatus; onChange: (id: string) => void;
}

function DeviceSelect({ label, description, devices, selectedId, permStatus, onChange }: DeviceSelectProps) {
  const noPermission = permStatus !== "granted";
  return (
    <div className="settings-row">
      <div className="settings-row-info">
        <span className="settings-row-label">{label}</span>
        <span className="settings-row-desc">{description}</span>
      </div>
      <div className="settings-row-controls">
        {noPermission ? (
          <span className="sp-badge sp-badge--prompt">Grant permission first</span>
        ) : devices.length === 0 ? (
          <span className="sp-badge sp-badge--prompt">No devices found</span>
        ) : (
          <select className="sp-device-select" value={selectedId ?? ""}
            onChange={e => onChange(e.target.value)}>
            <option value="">System default</option>
            {devices.map(d => (
              <option key={d.deviceId} value={d.label}>
                {d.label || `Device ${d.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface SettingsPageProps {
  onDevicePrefsChange?: (prefs: DevicePrefs) => void;
  onPttEnabledChange?: (enabled: boolean) => void;
}

export default function SettingsPage({ onDevicePrefsChange, onPttEnabledChange }: SettingsPageProps) {
  const [settings,      setSettings]      = useState<AppearanceSettings>(DEFAULTS);
  const [loaded,        setLoaded]        = useState(false);
  const [micPerm,       setMicPerm]       = useState<PermStatus>("unknown");
  const [camPerm,       setCamPerm]       = useState<PermStatus>("unknown");
  const [requestingPerm, setRequestingPerm] = useState<"microphone" | "camera" | null>(null);
  const [micDevices,     setMicDevices]     = useState<MediaDeviceInfo[]>([]);
  const [camDevices,     setCamDevices]     = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [devicePrefs,    setDevicePrefs]    = useState<DevicePrefs>({});
  const [pttConfig,      setPttConfig]      = useState<PttConfig>(PTT_DEFAULT);
  const [showPttDialog,  setShowPttDialog]  = useState(false);

  const refreshDevices = useCallback(async () => {
    const [mics, cams, speakers] = await Promise.all([
      enumerateByKind("audioinput"),
      enumerateByKind("videoinput"),
      enumerateByKind("audiooutput"),
    ]);
    setMicDevices(mics);
    setCamDevices(cams);
    setSpeakerDevices(speakers);
  }, []);

  useEffect(() => {
    (async () => {
      const [appearance, prefs, mic, cam, ptt] = await Promise.all([
        loadAppearance(),
        loadDevicePrefs(),
        queryPermStatus("microphone"),
        queryPermStatus("camera"),
        loadPttConfig(),
      ]);
      setSettings(appearance);
      applySettings(appearance);
      setDevicePrefs(prefs);
      setMicPerm(mic);
      setCamPerm(cam);
      setPttConfig(ptt);
      // Re-register PTT shortcut on startup (in case app was restarted)
      if (ptt.enabled && ptt.tauriKeys.length > 0) {
        applyPttConfig(ptt);
        onPttEnabledChange?.(true);
      }
      setLoaded(true);
      if (mic === "granted" || cam === "granted") await refreshDevices();
    })();
  }, [refreshDevices]);

  const update = useCallback((key: keyof AppearanceSettings, value: string) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      applySettings(next);
      saveAppearance(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => { setSettings(DEFAULTS); applySettings(DEFAULTS); saveAppearance(DEFAULTS); }, []);
  const reset    = useCallback((key: keyof AppearanceSettings) => update(key, DEFAULTS[key]), [update]);

  const handleRequestPerm = async (name: "microphone" | "camera") => {
    setRequestingPerm(name);
    const result = await requestPermission(name);
    if (name === "microphone") setMicPerm(result);
    else setCamPerm(result);
    setRequestingPerm(null);
    if (result === "granted") await refreshDevices();
  };

  const updateDevicePref = useCallback((key: keyof DevicePrefs, id: string) => {
    setDevicePrefs(prev => {
      const next = { ...prev, [key]: id || undefined };
      saveDevicePrefs(next);
      onDevicePrefsChange?.(next);
      return next;
    });
  }, [onDevicePrefsChange]);

  if (!loaded) return null;

  return (
    <>
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Customize appearance and devices for Sweetshark Client</p>
      </div>

      <div className="settings-body">

        {/* Push to Talk */}
        <div className="settings-section">
          <div className="settings-section-header">
            <span className="settings-section-label">PUSH TO TALK</span>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Push to Talk</span>
              <span className="settings-row-desc">Hold your key to unmute — mic is muted otherwise</span>
            </div>
            <div className="settings-row-controls">
              <button
                className={`ptt-toggle ${pttConfig.enabled ? "ptt-toggle--on" : ""}`}
                onClick={() => {
                  const next = { ...pttConfig, enabled: !pttConfig.enabled };
                  setPttConfig(next);
                  savePttConfig(next);
                  applyPttConfig(next);
                  onPttEnabledChange?.(next.enabled);
                }}
              >
                <span className="ptt-toggle-knob" />
              </button>
              <span className={`sp-badge ${pttConfig.enabled ? "sp-badge--granted" : "sp-badge--prompt"}`}>
                {pttConfig.enabled ? "On" : "Off"}
              </span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Keybind</span>
              <span className="settings-row-desc">Key or combo to hold while speaking</span>
            </div>
            <div className="settings-row-controls">
              {pttConfig.keys.length === 0 ? (
                <span className="sp-badge sp-badge--prompt">Not set</span>
              ) : (
                <div className="ptt-keychips">
                  {pttConfig.keys.map((k, i) => (
                    <span key={k} className="ptt-chip">
                      {displayKey(k)}
                      {i < pttConfig.keys.length - 1 && <span className="ptt-chip-plus">+</span>}
                    </span>
                  ))}
                </div>
              )}
              <button className="sp-request-btn" onClick={() => setShowPttDialog(true)}>
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Devices */}
        <div className="settings-section">
          <div className="settings-section-header">
            <span className="settings-section-label">DEVICES</span>
          </div>
          <div className="settings-section-note">
            Restrict which devices Sharkord servers can use. Only the selected device will be visible to servers — all others are hidden. Applies to newly opened servers.
          </div>
          <DeviceSelect label="Microphone" description="Audio input for voice calls"
            devices={micDevices} selectedId={devicePrefs.micId} permStatus={micPerm}
            onChange={id => updateDevicePref("micId", id)} />
          <DeviceSelect label="Camera" description="Video input for video calls"
            devices={camDevices} selectedId={devicePrefs.camId} permStatus={camPerm}
            onChange={id => updateDevicePref("camId", id)} />
          <DeviceSelect label="Speaker / Headphones" description="Audio output device for incoming audio"
            devices={speakerDevices} selectedId={devicePrefs.speakerId} permStatus={micPerm}
            onChange={id => updateDevicePref("speakerId", id)} />
        </div>

        {/* Permissions */}
        <div className="settings-section">
          <div className="settings-section-header">
            <span className="settings-section-label">PERMISSIONS</span>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Microphone</span>
              <span className="settings-row-desc">Voice calls and audio input</span>
            </div>
            <div className="settings-row-controls sp-perm-controls">
              <PermBadge status={micPerm} />
              {micPerm !== "granted" && (
                <button className="sp-request-btn" disabled={requestingPerm === "microphone"}
                  onClick={() => handleRequestPerm("microphone")}>
                  {requestingPerm === "microphone" ? "Requesting…" : "Request"}
                </button>
              )}
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Camera</span>
              <span className="settings-row-desc">Video calls</span>
            </div>
            <div className="settings-row-controls sp-perm-controls">
              <PermBadge status={camPerm} />
              {camPerm !== "granted" && (
                <button className="sp-request-btn" disabled={requestingPerm === "camera"}
                  onClick={() => handleRequestPerm("camera")}>
                  {requestingPerm === "camera" ? "Requesting…" : "Request"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-section">
          <div className="settings-section-header">
            <span className="settings-section-label">APPEARANCE</span>
            <button className="settings-reset-all-btn" onClick={resetAll}><ResetIcon />Reset all</button>
          </div>
          <ColorRow label="Accent Color" description="Active states, buttons, and highlights"
            value={settings.accentColor} defaultValue={DEFAULTS.accentColor}
            onChange={v => update("accentColor", v)} onReset={() => reset("accentColor")} />
          <ColorRow label="Window Background" description="Background color of views and dialog boxes"
            value={settings.windowBg} defaultValue={DEFAULTS.windowBg}
            onChange={v => update("windowBg", v)} onReset={() => reset("windowBg")} />
          <ColorRow label="Sidebar Background" description="Background color of the server list sidebar"
            value={settings.sidebarBg} defaultValue={DEFAULTS.sidebarBg}
            onChange={v => update("sidebarBg", v)} onReset={() => reset("sidebarBg")} />
          <ColorRow label="Server Circle Color" description="Background color of server icons in the sidebar"
            value={settings.serverCircleBg} defaultValue={DEFAULTS.serverCircleBg}
            onChange={v => update("serverCircleBg", v)} onReset={() => reset("serverCircleBg")} />
        </div>

        {/* Preview */}
        <div className="settings-section">
          <div className="settings-section-header">
            <span className="settings-section-label">PREVIEW</span>
          </div>
          <div className="settings-preview" style={{ background: settings.windowBg }}>
            <div className="preview-sidebar" style={{ background: settings.sidebarBg }}>
              <div className="preview-circle" style={{ background: settings.serverCircleBg }}>AB</div>
              <div className="preview-circle" style={{ background: settings.serverCircleBg }}>CD</div>
            </div>
            <div className="preview-content">
              <span className="preview-label">Window</span>
              <button className="preview-button" style={{ background: settings.accentColor }}>Button</button>
              <div className="preview-input">Input field</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    {showPttDialog && (
      <PttKeybindDialog
        currentKeys={pttConfig.keys}
        onDone={(keys, tauriKeys) => {
          const next = { ...pttConfig, keys, tauriKeys };
          setPttConfig(next);
          savePttConfig(next);
          if (next.enabled) applyPttConfig(next);
          setShowPttDialog(false);
        }}
        onCancel={() => setShowPttDialog(false)}
      />
    )}
    </>
  );
}
