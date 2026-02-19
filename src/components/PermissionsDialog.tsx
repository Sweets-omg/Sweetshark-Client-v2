import { useState } from "react";
import "./PermissionsDialog.css";

interface PermissionState {
  microphone: "idle" | "granted" | "denied" | "requesting";
  camera: "idle" | "granted" | "denied" | "requesting";
}

interface Props {
  onDone: () => void;
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function CamIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

function StatusBadge({ state }: { state: "idle" | "granted" | "denied" | "requesting" | "info" }) {
  if (state === "granted") return <span className="perm-badge perm-badge--granted">Granted</span>;
  if (state === "denied")  return <span className="perm-badge perm-badge--denied">Denied</span>;
  if (state === "requesting") return <span className="perm-badge perm-badge--requesting">Requesting…</span>;
  if (state === "info") return <span className="perm-badge perm-badge--info">On demand</span>;
  return null;
}

export default function PermissionsDialog({ onDone }: Props) {
  const [perms, setPerms] = useState<PermissionState>({ microphone: "idle", camera: "idle" });
  const [requesting, setRequesting] = useState(false);

  async function requestAll() {
    setRequesting(true);

    // Microphone
    setPerms(p => ({ ...p, microphone: "requesting" }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach(t => t.stop());
      setPerms(p => ({ ...p, microphone: "granted" }));
    } catch {
      setPerms(p => ({ ...p, microphone: "denied" }));
    }

    // Camera
    setPerms(p => ({ ...p, camera: "requesting" }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      stream.getTracks().forEach(t => t.stop());
      setPerms(p => ({ ...p, camera: "granted" }));
    } catch {
      setPerms(p => ({ ...p, camera: "denied" }));
    }

    setRequesting(false);
  }

  const allDone = perms.microphone !== "idle" && perms.camera !== "idle";

  return (
    <div className="pd-overlay">
      <div className="pd-modal">
        <div className="pd-band" />

        <div className="pd-body">
          <div className="pd-header">
            <div className="pd-icon-wrap">
              <MicIcon />
            </div>
            <h2 className="pd-title">Device Permissions</h2>
            <p className="pd-subtitle">
              Sweetshark Client needs access to your devices for voice, video and screen sharing.
              Click <strong>Grant Permissions</strong> to allow access now.
            </p>
          </div>

          <div className="pd-list">

            <div className="pd-item">
              <div className="pd-item-icon"><MicIcon /></div>
              <div className="pd-item-info">
                <span className="pd-item-label">Microphone</span>
                <span className="pd-item-desc">Voice calls and audio input</span>
              </div>
              <StatusBadge state={perms.microphone} />
            </div>

            <div className="pd-item">
              <div className="pd-item-icon"><CamIcon /></div>
              <div className="pd-item-info">
                <span className="pd-item-label">Camera</span>
                <span className="pd-item-desc">Video calls</span>
              </div>
              <StatusBadge state={perms.camera} />
            </div>

            <div className="pd-item">
              <div className="pd-item-icon"><SpeakerIcon /></div>
              <div className="pd-item-info">
                <span className="pd-item-label">Audio Output</span>
                <span className="pd-item-desc">Speakers and headphones — unlocked with microphone access</span>
              </div>
              <StatusBadge state="info" />
            </div>

            <div className="pd-item">
              <div className="pd-item-icon"><ScreenIcon /></div>
              <div className="pd-item-info">
                <span className="pd-item-label">Screen Share</span>
                <span className="pd-item-desc">Requested by the OS picker when you start sharing</span>
              </div>
              <StatusBadge state="info" />
            </div>

            <div className="pd-item">
              <div className="pd-item-icon"><SpeakerIcon /></div>
              <div className="pd-item-info">
                <span className="pd-item-label">Screen Share Audio</span>
                <span className="pd-item-desc">System audio captured during screen share — selected in the OS picker</span>
              </div>
              <StatusBadge state="info" />
            </div>

          </div>

          <div className="pd-actions">
            {!allDone ? (
              <button
                className="pd-btn pd-btn--primary"
                onClick={requestAll}
                disabled={requesting}
              >
                {requesting ? "Requesting…" : "Grant Permissions"}
              </button>
            ) : (
              <button className="pd-btn pd-btn--primary" onClick={onDone}>
                Continue
              </button>
            )}
            <button className="pd-btn pd-btn--ghost" onClick={onDone}>
              {allDone ? "Done" : "Skip for now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
