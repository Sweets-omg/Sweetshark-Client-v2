import { useState, useEffect, useRef, useCallback } from "react";
import "./AddServerDialog.css";

interface Props {
  onConfirm: (name: string, url: string, iconUrl?: string) => void;
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

export default function AddServerDialog({ onConfirm, onCancel }: Props) {
  const [name, setName]       = useState("");
  const [url, setUrl]         = useState("");
  const [error, setError]     = useState("");
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const nameRef    = useRef<HTMLInputElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
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
    // Reset input so the same file can be re-selected after removal
    e.target.value = "";
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) { setError("Server name is required."); return; }
    if (!url.trim())  { setError("Server URL is required."); return; }
    onConfirm(name.trim(), url.trim(), iconUrl ?? undefined);
  };

  const previewLetter = name.trim()[0]?.toUpperCase() ?? null;

  return (
    <div className="asd-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="asd-modal">

        {/* Gradient band */}
        <div className="asd-band" />

        {/* Icon + name preview row */}
        <div className="asd-preview-wrap">
          <div className="asd-icon-slot" onClick={() => fileRef.current?.click()} title="Click to upload icon">
            {iconUrl ? (
              <img src={iconUrl} className="asd-preview-img" alt="Server icon" />
            ) : (
              <div className="asd-preview-icon" style={{ background: previewLetter ? "var(--accent)" : "var(--bg-hover)" }}>
                {previewLetter ?? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                    <path d="M9 21V12h6v9"/>
                  </svg>
                )}
              </div>
            )}
            <div className="asd-icon-overlay">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
          </div>

          <div className="asd-preview-info">
            {name.trim()
              ? <span className="asd-preview-name">{name.trim()}</span>
              : <span className="asd-preview-placeholder">Server name…</span>
            }
            <button
              className="asd-upload-hint"
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              {iconUrl ? "Change icon" : "Upload icon"}
            </button>
            {iconUrl && (
              <button
                className="asd-remove-icon"
                onClick={() => setIconUrl(null)}
                type="button"
              >
                Remove icon
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="asd-file-hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Body */}
        <div className="asd-body">
          <h2 className="asd-title">Add a Server</h2>
          <p className="asd-sub">
            Sweetshark loads the full Sharkord interface in a native window.
            Paste your server's address below.
          </p>

          {error && (
            <div className="asd-error">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 7a.875.875 0 110-1.75.875.875 0 010 1.75z"/>
              </svg>
              {error}
            </div>
          )}

          <div className="asd-fields">
            <div className="asd-field">
              <label className="asd-label">Server Name</label>
              <input
                ref={nameRef}
                className="asd-input"
                type="text"
                placeholder="My Sharkord Server"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                maxLength={40}
              />
            </div>

            <div className="asd-field">
              <label className="asd-label">Server URL</label>
              <div className="asd-input-wrap">
                <span className="asd-prefix">https://</span>
                <input
                  className="asd-input asd-input-prefixed"
                  type="text"
                  placeholder="demo.sharkord.com"
                  value={url.replace(/^https?:\/\//i, "")}
                  onChange={e => { setUrl(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>
              <p className="asd-hint">
                Default Sharkord port is <code>4991</code>. Type <code>http://</code> explicitly for non-HTTPS servers.
              </p>
            </div>
          </div>

          <div className="asd-actions">
            <button className="asd-btn-cancel" onClick={onCancel}>Cancel</button>
            <button
              className="asd-btn-add"
              onClick={handleSubmit}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="7" y1="1" x2="7" y2="13"/>
                <line x1="1" y1="7" x2="13" y2="7"/>
              </svg>
              Add Server
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
