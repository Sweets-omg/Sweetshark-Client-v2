import { useState } from "react";
import "./UpdateDialog.css";

interface Props {
  currentVersion: string;
  latestVersion: string;
  onUpdate: () => void;
  onIgnore: () => void;
  onNeverAskAgain: () => void;
}

type Screen = "update" | "confirm-never";

export default function UpdateDialog({
  currentVersion,
  latestVersion,
  onUpdate,
  onIgnore,
  onNeverAskAgain,
}: Props) {
  const [screen, setScreen] = useState<Screen>("update");

  if (screen === "confirm-never") {
    return (
      <div className="upd-overlay">
        <div className="upd-modal">
          <div className="upd-icon-wrap">
            <div className="upd-icon upd-icon--warn">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
          <div className="upd-body">
            <h2 className="upd-title">Are you sure?</h2>
            <p className="upd-sub">
              You will <strong>never</strong> be notified about updates again.
              You'll need to check for updates manually.
            </p>
            <div className="upd-actions upd-actions--col">
              <button className="upd-btn upd-btn--danger" onClick={onNeverAskAgain}>
                Yes, never notify me
              </button>
              <button className="upd-btn upd-btn--ghost" onClick={() => setScreen("update")}>
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upd-overlay">
      <div className="upd-modal">
        <div className="upd-icon-wrap">
          <div className="upd-icon upd-icon--update">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </div>
        </div>
        <div className="upd-body">
          <h2 className="upd-title">Update Available</h2>
          <p className="upd-sub">
            There's a new release available <strong>{latestVersion}</strong>
            <br />
            You are running <strong>{currentVersion}</strong>
            <br /><br />
            Would you like to update?
          </p>
          <div className="upd-actions">
            <button className="upd-btn upd-btn--primary" onClick={onUpdate}>
              Yes
            </button>
            <button className="upd-btn upd-btn--secondary" onClick={onIgnore}>
              No
            </button>
          </div>
          <button
            className="upd-never-link"
            onClick={() => setScreen("confirm-never")}
          >
            Never ask me again
          </button>
        </div>
      </div>
    </div>
  );
}
