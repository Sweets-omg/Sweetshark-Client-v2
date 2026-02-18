import { useState, useRef, useCallback, useEffect } from "react";
import "./ChangeIconDialog.css";
import { Server } from "../App";

interface Props {
  server: Server;
  onConfirm: (iconUrl: string | null) => void;
  onCancel: () => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChangeIconDialog({ server, onConfirm, onCancel }: Props) {
  // Start with the server's current icon state so preview is accurate
  const [iconUrl, setIconUrl] = useState<string | null>(server.iconUrl ?? null);
  const [error, setError]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be smaller than 4 MB.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setIconUrl(dataUrl);
      setError("");
    } catch {
      setError("Failed to read image.");
    }
    e.target.value = "";
  }, []);

  const hasChanged = iconUrl !== (server.iconUrl ?? null);

  return (
    <div className="cid-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="cid-modal">
        <div className="cid-band" />

        <div className="cid-body">
          <h2 className="cid-title">Change Icon</h2>
          <p className="cid-sub">Upload a custom image for <strong>{server.name}</strong>, or revert to the letter icon.</p>

          {error && (
            <div className="cid-error">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 7a.875.875 0 110-1.75.875.875 0 010 1.75z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Big centred preview */}
          <div className="cid-preview-area">
            <div
              className="cid-icon-slot"
              onClick={() => fileRef.current?.click()}
              title="Click to upload image"
            >
              {iconUrl ? (
                <img src={iconUrl} className="cid-icon-img" alt="Server icon" />
              ) : (
                <div className="cid-icon-letter" style={{ background: server.iconColor }}>
                  {server.iconLetter}
                </div>
              )}
              <div className="cid-icon-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
            </div>

            <div className="cid-icon-label">
              {iconUrl ? "Custom icon" : "Letter icon"}
            </div>
          </div>

          {/* Action buttons for icon */}
          <div className="cid-icon-actions">
            <button className="cid-btn-upload" onClick={() => fileRef.current?.click()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload image
            </button>

            {iconUrl && (
              <button className="cid-btn-remove" onClick={() => setIconUrl(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Revert to letter
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="cid-file-hidden"
            onChange={handleFileChange}
          />

          {/* Dialog actions */}
          <div className="cid-actions">
            <button className="cid-btn-cancel" onClick={onCancel}>Cancel</button>
            <button
              className="cid-btn-confirm"
              onClick={() => onConfirm(iconUrl)}
              disabled={!hasChanged}
                          >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
