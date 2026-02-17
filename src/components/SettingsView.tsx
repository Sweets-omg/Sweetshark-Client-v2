import { RotateCcw } from 'lucide-react';
import type { AppSettings } from '../useSettings';
import { SETTING_DEFAULTS } from '../useSettings';

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
}

interface ColorRowProps {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
}

function ColorRow({ label, description, value, onChange, onReset }: ColorRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0 mr-6">
        <p className="text-white font-medium text-sm">{label}</p>
        <p className="text-gray-400 text-xs mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Color swatch — click to open native picker */}
        <label className="relative cursor-pointer group">
          <div
            className="w-9 h-9 rounded-lg border-2 border-white/20 group-hover:border-white/50 transition-colors shadow-inner"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        {/* Hex input */}
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={e => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          className="w-24 text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-white/30 outline-none font-mono transition-colors"
          style={{ backgroundColor: 'var(--window-bg-secondary)' }}
        />
        {/* Reset to default */}
        <button
          onClick={onReset}
          title="Reset to default"
          className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function SettingsView({ settings, onSettingsChange }: SettingsViewProps) {
  const update = (key: keyof AppSettings) => (value: string) =>
    onSettingsChange({ ...settings, [key]: value });

  const reset = (key: keyof AppSettings) => () =>
    onSettingsChange({ ...settings, [key]: SETTING_DEFAULTS[key] });

  const resetAll = () => onSettingsChange({ ...SETTING_DEFAULTS });

  return (
    <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: 'var(--window-bg)' }}>
      <div className="max-w-2xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Customize the appearance of Sweetshark Client</p>
        </div>

        {/* Appearance card */}
        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--window-bg-secondary)' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Appearance</h2>
            <button
              onClick={resetAll}
              className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all
            </button>
          </div>

          <ColorRow
            label="Accent Color"
            description="Active states, buttons, and highlights"
            value={settings.accentColor}
            onChange={update('accentColor')}
            onReset={reset('accentColor')}
          />
          <ColorRow
            label="Window Background"
            description="Background color of views and dialog boxes"
            value={settings.windowBg}
            onChange={update('windowBg')}
            onReset={reset('windowBg')}
          />
          <ColorRow
            label="Sidebar Background"
            description="Background color of the server list sidebar"
            value={settings.sidebarBg}
            onChange={update('sidebarBg')}
            onReset={reset('sidebarBg')}
          />
          <ColorRow
            label="Server Circle Color"
            description="Background color of server icons in the sidebar"
            value={settings.serverCircle}
            onChange={update('serverCircle')}
            onReset={reset('serverCircle')}
          />
        </div>

        {/* Live preview card */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--window-bg-secondary)' }}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Preview</h2>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Sidebar strip */}
            <div className="flex flex-col items-center gap-2 p-2 rounded-lg w-12"
              style={{ backgroundColor: settings.sidebarBg }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: settings.serverCircle }}>AB</div>
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: settings.accentColor }}>CD</div>
            </div>
            {/* Window surface */}
            <div className="flex flex-col gap-2 p-3 rounded-lg flex-1 min-w-[140px]"
              style={{ backgroundColor: settings.windowBg }}>
              <div className="text-white text-xs font-medium">Window</div>
              <button className="px-3 py-1.5 rounded text-white text-xs font-medium w-fit"
                style={{ backgroundColor: settings.accentColor }}>
                Button
              </button>
              <div className="px-2 py-1 rounded text-xs text-gray-400"
                style={{ backgroundColor: settings.sidebarBg }}>
                Input field
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
