import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { Webview } from "@tauri-apps/api/webview";

const TITLEBAR_H = 36;
const SIDEBAR_W  = 72;

// serverId → Webview handle
const pool = new Map<string, Webview>();

function webviewLabel(serverId: string): string {
  return `srv-${serverId}`;
}

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

async function contentBounds() {
  const win = getCurrentWindow();
  const physSize = await win.innerSize();
  const scale    = await win.scaleFactor();
  const lw = Math.round(physSize.width  / scale);
  const lh = Math.round(physSize.height / scale);
  return {
    x:      SIDEBAR_W,
    y:      TITLEBAR_H,
    width:  lw - SIDEBAR_W,
    height: lh - TITLEBAR_H,
  };
}

export interface DevicePrefs {
  micId?: string;
  camId?: string;
  speakerId?: string;
}

export async function createServerWebview(serverId: string, url: string, devicePrefs?: DevicePrefs): Promise<Webview> {
  const lbl = webviewLabel(serverId);

  if (pool.has(serverId)) {
    try { await pool.get(serverId)!.close(); } catch (_) {}
    pool.delete(serverId);
  }

  const bounds = await contentBounds();

  await invoke<void>("create_server_webview", {
    label:    lbl,
    url:      normalizeUrl(url),
    serverId,
    x:        bounds.x,
    y:        bounds.y,
    width:    bounds.width,
    height:   bounds.height,
    micId:      devicePrefs?.micId     ?? null,
    camId:      devicePrefs?.camId     ?? null,
    speakerId:  devicePrefs?.speakerId ?? null,
  });

  // getByLabel is ASYNC — it queries the Tauri backend to find the webview.
  // Missing this await was the bug causing the pool to always be empty,
  // which meant hide/show calls were silently no-ops.
  const wv = await Webview.getByLabel(lbl);
  if (!wv) throw new Error(`Webview not found after creation: ${lbl}`);

  pool.set(serverId, wv);
  return wv;
}

export async function showServerWebview(serverId: string): Promise<void> {
  const target = pool.get(serverId);
  if (!target) return;

  const bounds = await contentBounds();

  for (const [id, wv] of pool) {
    if (id === serverId) {
      await wv.setPosition(new LogicalPosition(bounds.x, bounds.y));
      await wv.setSize(new LogicalSize(bounds.width, bounds.height));
      await wv.show();
      await wv.setFocus();
    } else {
      await wv.hide();
    }
  }
}

export async function hideAllServerWebviews(): Promise<void> {
  for (const wv of pool.values()) {
    try { await wv.hide(); } catch (_) {}
  }
}

export async function destroyServerWebview(serverId: string): Promise<void> {
  const wv = pool.get(serverId);
  if (wv) {
    try { await wv.close(); } catch (_) {}
    pool.delete(serverId);
  }
}

export async function refreshServerWebview(serverId: string): Promise<void> {
  if (!pool.has(serverId)) return;
  const label = webviewLabel(serverId);
  try {
    await invoke<void>("reload_server_webview", { label });
  } catch (e) {
    console.error("Failed to reload webview:", e);
  }
}

export async function resizeAllServerWebviews(): Promise<void> {
  const bounds = await contentBounds();
  for (const wv of pool.values()) {
    try {
      await wv.setPosition(new LogicalPosition(bounds.x, bounds.y));
      await wv.setSize(new LogicalSize(bounds.width, bounds.height));
    } catch (_) {}
  }
}

export async function updateServerWebviewDevices(
  serverId: string,
  url: string,
  devicePrefs: DevicePrefs
): Promise<void> {
  // Recreate the webview so the new initialization_script (with updated device
  // IDs) fires on the next page load. createServerWebview handles closing the
  // old one and re-adding it to the pool.
  await createServerWebview(serverId, url, devicePrefs);
}
