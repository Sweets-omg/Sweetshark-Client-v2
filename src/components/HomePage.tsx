import { invoke } from "@tauri-apps/api/core";
import iconSrc from "../assets/icon.png";
import "./HomePage.css";

const IS_TAURI = typeof (window as any).__TAURI_INTERNALS__ !== "undefined";
const VERSION = "0.1.0";

async function openExternal(url: string) {
  if (!IS_TAURI) {
    window.open(url, "_blank");
    return;
  }
  try {
    // Try plugin-opener first (available after npm install + Cargo rebuild)
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  } catch {
    // Fallback: custom Rust command (always available)
    await invoke("open_url", { url }).catch(console.error);
  }
}

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-card">
        <img src={iconSrc} alt="Sweetshark Client" className="home-logo" />
        <h1 className="home-name">Sweetshark Client</h1>
        <span className="home-version">v{VERSION}</span>

        <div className="home-divider" />

        <p className="home-tagline">
          Unofficial multi-server client for{" "}
          <a
            href="https://sharkord.com/"
            className="home-link"
            onClick={(e) => { e.preventDefault(); openExternal("https://sharkord.com/"); }}
          >
            Sharkord
          </a>
        </p>
        <p className="home-hint">
          Use the <strong>+</strong> button in the sidebar to add a server.
        </p>
      </div>
    </div>
  );
}
