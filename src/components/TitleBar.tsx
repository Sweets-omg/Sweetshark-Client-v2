import { getCurrentWindow } from "@tauri-apps/api/window";
import "./TitleBar.css";

interface Props {
  iconSrc: string;
}

// Per official Tauri 2 docs: call getCurrentWindow() and invoke methods directly
// https://v2.tauri.app/learn/window-customization/
function minimize()        { getCurrentWindow().minimize(); }
function toggleMaximize()  { getCurrentWindow().toggleMaximize(); }
function closeWindow()     { getCurrentWindow().close(); }

export default function TitleBar({ iconSrc }: Props) {
  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-left" data-tauri-drag-region>
        <img src={iconSrc} alt="Sweetshark" className="titlebar-icon" />
        <span className="titlebar-name">Sweetshark Client</span>
      </div>
      <div className="titlebar-controls">
        <button className="wc-btn wc-min" onClick={minimize} title="Minimize">
          <svg width="10" height="2" viewBox="0 0 10 2">
            <rect width="10" height="1.5" fill="currentColor" rx="0.75"/>
          </svg>
        </button>
        <button className="wc-btn wc-max" onClick={toggleMaximize} title="Maximize">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="0.75" y="0.75" width="8.5" height="8.5" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1"/>
          </svg>
        </button>
        <button className="wc-btn wc-close" onClick={closeWindow} title="Close">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
