import { useState, useEffect, useRef } from "react";
import "./RenameServerDialog.css";
import { Server } from "../App";

interface Props {
  server: Server;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export default function RenameServerDialog({ server, onConfirm, onCancel }: Props) {
  const [name, setName] = useState(server.name);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const handleSubmit = () => {
    if (!name.trim()) { setError("Server name cannot be empty."); return; }
    onConfirm(name.trim());
  };

  const previewLetter = name.trim()[0]?.toUpperCase() ?? server.iconLetter;

  return (
    <div className="rsd-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="rsd-modal">
        <div className="rsd-band" />

        <div className="rsd-preview-wrap">
          <div className="rsd-preview-icon" style={{ background: server.iconUrl ? "transparent" : server.iconColor }}>
            {server.iconUrl
              ? <img src={server.iconUrl} alt={server.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
              : previewLetter
            }
          </div>
        </div>

        <div className="rsd-body">
          <h2 className="rsd-title">Rename Server</h2>
          <p className="rsd-sub">Give this server a new display name. The circle letter will update automatically.</p>

          {error && (
            <div className="rsd-error">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 7a.875.875 0 110-1.75.875.875 0 010 1.75z"/>
              </svg>
              {error}
            </div>
          )}

          <div className="rsd-field">
            <label className="rsd-label">Server Name</label>
            <input
              ref={inputRef}
              className="rsd-input"
              type="text"
              placeholder="My Sharkord Server"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              maxLength={40}
            />
          </div>

          <div className="rsd-actions">
            <button className="rsd-btn-cancel" onClick={onCancel}>Cancel</button>
            <button
              className="rsd-btn-confirm"
              onClick={handleSubmit}
                          >
              Rename
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
