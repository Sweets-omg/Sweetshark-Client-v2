export interface AppSettings {
  accentColor: string;
  sidebarBg: string;
  serverCircle: string;
  windowBg: string;
}

export const SETTING_DEFAULTS: AppSettings = {
  accentColor: '#4E0073',
  sidebarBg: '#1e1e1e',
  serverCircle: '#2e2e2e',
  windowBg: '#262626',
};

function darken(hex: string, amount = 20): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.padEnd(6, '0'), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

export function applySettings(s: AppSettings) {
  const root = document.documentElement;
  root.style.setProperty('--accent', s.accentColor);
  root.style.setProperty('--accent-hover', darken(s.accentColor));
  root.style.setProperty('--sidebar-bg', s.sidebarBg);
  root.style.setProperty('--server-circle', s.serverCircle);
  root.style.setProperty('--window-bg', s.windowBg);
  // Secondary: slightly darker than windowBg — used for inputs, nested cards, context menus
  root.style.setProperty('--window-bg-secondary', darken(s.windowBg, 14));
}

const KEY = 'sweetshark-settings';

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? { ...SETTING_DEFAULTS, ...JSON.parse(stored) } : { ...SETTING_DEFAULTS };
  } catch {
    return { ...SETTING_DEFAULTS };
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  applySettings(s);
}
