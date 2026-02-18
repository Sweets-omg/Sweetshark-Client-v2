import { useEffect } from "react";
import "./ConfirmRemoveDialog.css";
import { Server } from "../App";

interface Props {
  server: Server;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmRemoveDialog({ server, onConfirm, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="crd-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="crd-modal">

        <div className="crd-icon-wrap">
          <div className="crd-server-icon" style={{ background: server.iconUrl ? "transparent" : server.iconColor }}>
            {server.iconUrl
              ? <img src={server.iconUrl} alt={server.name} className="crd-server-img" />
              : server.iconLetter
            }
          </div>
          <div className="crd-warning-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm-.75 5.75a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 8.5a.875.875 0 110-1.75.875.875 0 010 1.75z"/>
            </svg>
          </div>
        </div>

        <div className="crd-body">
          <h2 className="crd-title">Remove Server</h2>
          <p className="crd-sub">
            Are you sure you want to remove <strong>{server.name}</strong>?
            All local session data for this server will be permanently deleted.
          </p>

          <div className="crd-actions">
            <button className="crd-btn-cancel" onClick={onCancel}>Cancel</button>
            <button className="crd-btn-remove" onClick={onConfirm}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
              Remove Server
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
