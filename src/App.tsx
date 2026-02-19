import { useState, useCallback, useEffect, useRef } from "react";
import "./App.css";
import iconSrc from "./assets/icon.png";
import Sidebar from "./components/Sidebar";
import TitleBar from "./components/TitleBar";
import HomePage from "./components/HomePage";
import SettingsPage from "./components/SettingsPage";
import ServerLoadingPage from "./components/ServerLoadingPage";
import AddServerDialog from "./components/AddServerDialog";
import { load, Store } from "@tauri-apps/plugin-store";
import {
  createServerWebview,
  showServerWebview,
  hideAllServerWebviews,
  destroyServerWebview,
  refreshServerWebview,
  resizeAllServerWebviews,
} from "./lib/webviewManager";
import RenameServerDialog from "./components/RenameServerDialog";
import ChangeIconDialog from "./components/ChangeIconDialog";
import ConfirmRemoveDialog from "./components/ConfirmRemoveDialog";

export interface Server {
  id: string;
  name: string;
  url: string;
  iconLetter: string;
  iconColor: string;
  iconUrl?: string;   // base64 data URL for custom icon, absent = letter
  keepLoaded?: boolean; // if false, webview is destroyed when not active (default true)
  inviteUrl?: string;  // one-time URL used only on first load (e.g. with ?invite= param)
}

export type ActiveView = "home" | "settings" | string;

const COLORS = [
  "#5865f2", "#3ba55c", "#ed4245", "#faa61a",
  "#eb459e", "#00b0f4", "#57f287", "#ff73fa",
];

function genColor(index: number) {
  return COLORS[index % COLORS.length];
}

const IS_TAURI = typeof (window as any).__TAURI_INTERNALS__ !== "undefined";

export default function App() {
  const [servers, setServers] = useState<Server[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Server | null>(null);
  const [iconChangeTarget, setIconChangeTarget] = useState<Server | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Server | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStoreLoaded, setIsStoreLoaded] = useState(false);

  // Tracks which server IDs already have a live webview in the pool.
  // Used to lazily create webviews only on first selection.
  const createdWebviews = useRef<Set<string>>(new Set());
  const storeRef = useRef<Store | null>(null);
  const prevActiveView = useRef<ActiveView>("home");

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // ── Persistence: load saved servers + appearance on startup ──────────────
  useEffect(() => {
    if (!IS_TAURI) return;

    load("config.json", { autoSave: true })
      .then(async (store) => {
        storeRef.current = store;
        const saved = await store.get<Server[]>("servers");
        if (saved && saved.length > 0) {
          setServers(saved);
        }
        // Apply saved appearance settings
        const appearance = await store.get<Record<string, string>>("appearance");
        if (appearance) {
          const root = document.documentElement;
          if (appearance.accentColor) {
            root.style.setProperty("--accent", appearance.accentColor);
            root.style.setProperty("--toggle-on", appearance.accentColor);
          }
          if (appearance.windowBg) root.style.setProperty("--window-bg", appearance.windowBg);
          if (appearance.sidebarBg) root.style.setProperty("--sidebar-bg", appearance.sidebarBg);
          if (appearance.serverCircleBg) root.style.setProperty("--server-circle-bg", appearance.serverCircleBg);
        }
        setIsStoreLoaded(true);
      })
      .catch((e) => {
        console.error("Failed to load store:", e);
        setIsStoreLoaded(true); // still mark loaded so the app isn't stuck
      });
  }, []);

  // ── Persistence: save servers whenever the list changes ───────────────────
  // Guard on isStoreLoaded so we don't overwrite saved data with [] on first render.
  useEffect(() => {
    if (!IS_TAURI || !isStoreLoaded || !storeRef.current) return;
    storeRef.current.set("servers", servers).catch(console.error);
  }, [servers, isStoreLoaded]);

  // ── Window resize: keep all webview bounds in sync ────────────────────────
  useEffect(() => {
    if (!IS_TAURI) return;
    const onResize = () => resizeAllServerWebviews().catch(console.error);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Webview visibility: show active server webview, hide all others ────────
  // Native webviews sit above the React layer at the OS compositor level
  // regardless of CSS z-index, so we must explicitly hide them whenever ANY
  // overlay (context menu, rename/icon/remove dialog, add server dialog) is open.
  useEffect(() => {
    if (!IS_TAURI) return;
    const anyOverlayOpen = isModalOpen || !!renameTarget || !!iconChangeTarget || !!removeTarget;
    if (anyOverlayOpen) {
      hideAllServerWebviews().catch(console.error);
      return;
    }
    const isServer = servers.some((s) => s.id === activeView);
    if (isServer) {
      showServerWebview(activeView).catch(console.error);
    } else {
      hideAllServerWebviews().catch(console.error);
    }
  }, [activeView, servers, isModalOpen, renameTarget, iconChangeTarget, removeTarget]);

  // ── Server selection: lazily create webview on first visit ───────────────
  const handleSelectView = useCallback(
    async (view: ActiveView) => {
      // If leaving a server that has keepLoaded=false, destroy its webview
      if (IS_TAURI && prevActiveView.current !== view) {
        const leavingServer = servers.find((s) => s.id === prevActiveView.current);
        if (leavingServer && leavingServer.keepLoaded === false && createdWebviews.current.has(leavingServer.id)) {
          await destroyServerWebview(leavingServer.id).catch(console.error);
          createdWebviews.current.delete(leavingServer.id);
        }
      }
      prevActiveView.current = view;
      setActiveView(view);
      if (!IS_TAURI) return;

      const server = servers.find((s) => s.id === view);
      if (!server) return; // home / settings — no webview needed

      if (!createdWebviews.current.has(view)) {
        // First time this server is selected: create its webview.
        try {
          await createServerWebview(view, server.url);
          createdWebviews.current.add(view);
          await showServerWebview(view);
        } catch (e) {
          console.error("Failed to create server webview:", e);
        }
      }
      // If already created, the visibility useEffect above handles show/hide.
    },
    [servers]
  );

  // ── Add server ─────────────────────────────────────────────────────────────
  const addServer = useCallback(
    async (name: string, url: string, iconUrl?: string) => {
      const id = crypto.randomUUID();
      const iconLetter = name.trim()[0]?.toUpperCase() ?? "?";
      const iconColor = genColor(servers.length);

      // If the URL contains an invite code, store the full URL for first load only
      // and use the bare origin as the persistent server URL.
      let baseUrl = url;
      let inviteUrl: string | undefined;
      try {
        // The AddServerDialog shows "https://" as a visual prefix but may not include
        // it in the value — normalise before parsing.
        const normalised = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        const parsed = new URL(normalised);
        if (parsed.searchParams.has("invite")) {
          inviteUrl = normalised;
          parsed.search = "";
          baseUrl = parsed.toString().replace(/\/$/, "");
        } else {
          baseUrl = normalised;
        }
      } catch { /* invalid URL — leave as-is */ }

      const server: Server = { id, name, url: baseUrl, iconLetter, iconColor, ...(iconUrl ? { iconUrl } : {}) };

      setServers((prev) => [...prev, server]);
      setActiveView(id);

      if (IS_TAURI) {
        try {
          await createServerWebview(id, inviteUrl ?? baseUrl);
          createdWebviews.current.add(id);
          await showServerWebview(id);
        } catch (e) {
          console.error("Failed to create server webview:", e);
        }
      }
    },
    [servers.length]
  );

  // ── Change server icon ─────────────────────────────────────────────────────
  const openIconChangeDialog = useCallback((id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server) return;
    setIconChangeTarget(server);
    openModal();
  }, [servers, openModal]);

  const commitIconChange = useCallback((id: string, iconUrl: string | null) => {
    setServers(prev => prev.map(s =>
      s.id === id
        ? { ...s, ...(iconUrl ? { iconUrl } : { iconUrl: undefined }) }
        : s
    ));
    setIconChangeTarget(null);
    closeModal();
  }, [closeModal]);

  // ── Rename server ──────────────────────────────────────────────────────────
  const openRenameDialog = useCallback((id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server) return;
    setRenameTarget(server);
    openModal();
  }, [servers, openModal]);

  const commitRename = useCallback((id: string, newName: string) => {
    const newLetter = newName.trim()[0]?.toUpperCase() ?? "?";
    setServers(prev => prev.map(s =>
      s.id === id ? { ...s, name: newName, iconLetter: newLetter } : s
    ));
    setRenameTarget(null);
    closeModal();
  }, [closeModal]);

  // ── Toggle "keep server loaded" ───────────────────────────────────────────
  const toggleKeepLoaded = useCallback((id: string) => {
    setServers(prev => prev.map(s =>
      s.id === id ? { ...s, keepLoaded: !(s.keepLoaded ?? true) } : s
    ));
  }, []);

  // ── Refresh server webview ─────────────────────────────────────────────────
  const refreshServer = useCallback(async (id: string) => {
    if (IS_TAURI) {
      await refreshServerWebview(id).catch(console.error);
    }
  }, []);

  // ── Remove server ──────────────────────────────────────────────────────────
  const openRemoveDialog = useCallback((id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server) return;
    setRemoveTarget(server);
    openModal();
  }, [servers, openModal]);

  const confirmRemove = useCallback(async (id: string) => {
    if (IS_TAURI) {
      await destroyServerWebview(id).catch(console.error);
      createdWebviews.current.delete(id);
    }
    setServers((prev) => prev.filter((s) => s.id !== id));
    setActiveView("home");
    setRemoveTarget(null);
    closeModal();
  }, [closeModal]);

  const isServerActive = servers.some((s) => s.id === activeView);
  const activeServer = servers.find((s) => s.id === activeView);

  return (
    <div className="app-shell">
      <TitleBar iconSrc={iconSrc} />
      <div className="app-body">
        <Sidebar
          servers={servers}
          activeView={activeView}
          onSelectView={handleSelectView}
          onAddServer={() => {
            openModal();
            setShowAddDialog(true);
          }}
          onRenameServer={openRenameDialog}
          onRefreshServer={refreshServer}
          onRemoveServer={openRemoveDialog}
          onChangeServerIcon={openIconChangeDialog}
          onToggleKeepLoaded={toggleKeepLoaded}
          onContextMenuOpenChange={(open) => open ? openModal() : closeModal()}
        />

        <main
          className="main-content"
          onContextMenu={(e) => e.preventDefault()}
          style={{ visibility: IS_TAURI && isServerActive ? "hidden" : "visible" }}
        >
          {activeView === "home" && <HomePage />}
          {activeView === "settings" && <SettingsPage />}
          {isServerActive && activeServer && (
            <ServerLoadingPage server={activeServer} onRemove={openRemoveDialog} />
          )}
        </main>
      </div>

      {showAddDialog && (
        <AddServerDialog
          onConfirm={(name, url, iconUrl) => {
            addServer(name, url, iconUrl);
            setShowAddDialog(false);
            closeModal();
          }}
          onCancel={() => {
            setShowAddDialog(false);
            closeModal();
          }}
        />
      )}

      {renameTarget && (
        <RenameServerDialog
          server={renameTarget}
          onConfirm={(newName) => commitRename(renameTarget.id, newName)}
          onCancel={() => { setRenameTarget(null); closeModal(); }}
        />
      )}

      {iconChangeTarget && (
        <ChangeIconDialog
          server={iconChangeTarget}
          onConfirm={(iconUrl) => commitIconChange(iconChangeTarget.id, iconUrl)}
          onCancel={() => { setIconChangeTarget(null); closeModal(); }}
        />
      )}

      {removeTarget && (
        <ConfirmRemoveDialog
          server={removeTarget}
          onConfirm={() => confirmRemove(removeTarget.id)}
          onCancel={() => { setRemoveTarget(null); closeModal(); }}
        />
      )}
    </div>
  );
}
