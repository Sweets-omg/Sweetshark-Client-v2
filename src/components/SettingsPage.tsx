import { useState, useEffect, useCallback } from "react";
import "./SettingsPage.css";

const IS_TAURI = typeof (window as any).__TAURI_INTERNALS__ !== "undefined";

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

async function loadSettings(): Promise<AppearanceSettings> {
  if (!IS_TAURI) return DEFAULTS;
  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load("config.json", { autoSave: true });
    const saved = await store.get<AppearanceSettings>("appearance");
    return saved ? { ...DEFAULTS, ...saved } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

async function saveSettings(settings: AppearanceSettings) {
  if (!IS_TAURI) return;
  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load("config.json", { autoSave: true });
    await store.set("appearance", settings);
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

interface ColorRowProps {
  label: string;
  description: string;
  value: string;
  defaultValue: string;
  onChange: (val: string) => void;
  onReset: () => void;
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
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
          <input
            type="color"
            value={value.length === 7 ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="color-input-hidden"
          />
        </label>
        <input
          type="text"
          className="settings-hex-input"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          spellCheck={false}
        />
        <button
          className={`settings-reset-btn ${isDefault ? "settings-reset-btn--dim" : ""}`}
          onClick={onReset}
          title="Reset to default"
        >
          <ResetIcon />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      applySettings(s);
      setLoaded(true);
    });
  }, []);

  const update = useCallback(
    (key: keyof AppearanceSettings, value: string) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        applySettings(next);
        saveSettings(next);
        return next;
      });
    },
    []
  );

  const resetAll = useCallback(() => {
    setSettings(DEFAULTS);
    applySettings(DEFAULTS);
    saveSettings(DEFAULTS);
  }, []);

  const reset = useCallback(
    (key: keyof AppearanceSettings) => update(key, DEFAULTS[key]),
    [update]
  );

  if (!loaded) return null;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Customize the appearance of Sweetshark Client</p>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <span className="settings-section-label">APPEARANCE</span>
          <button className="settings-reset-all-btn" onClick={resetAll}>
            <ResetIcon />
            Reset all
          </button>
        </div>

        <ColorRow
          label="Accent Color"
          description="Active states, buttons, and highlights"
          value={settings.accentColor}
          defaultValue={DEFAULTS.accentColor}
          onChange={(v) => update("accentColor", v)}
          onReset={() => reset("accentColor")}
        />
        <ColorRow
          label="Window Background"
          description="Background color of views and dialog boxes"
          value={settings.windowBg}
          defaultValue={DEFAULTS.windowBg}
          onChange={(v) => update("windowBg", v)}
          onReset={() => reset("windowBg")}
        />
        <ColorRow
          label="Sidebar Background"
          description="Background color of the server list sidebar"
          value={settings.sidebarBg}
          defaultValue={DEFAULTS.sidebarBg}
          onChange={(v) => update("sidebarBg", v)}
          onReset={() => reset("sidebarBg")}
        />
        <ColorRow
          label="Server Circle Color"
          description="Background color of server icons in the sidebar"
          value={settings.serverCircleBg}
          defaultValue={DEFAULTS.serverCircleBg}
          onChange={(v) => update("serverCircleBg", v)}
          onReset={() => reset("serverCircleBg")}
        />
      </div>

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
            <button className="preview-button" style={{ background: settings.accentColor }}>
              Button
            </button>
            <div className="preview-input">Input field</div>
          </div>
        </div>
      </div>
    </div>
  );
}
