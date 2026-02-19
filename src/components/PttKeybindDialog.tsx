import { useState, useEffect, useRef } from "react";
import "./PttKeybindDialog.css";

// Keys that are modifiers — shown first in combos
const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"]);

// Map key identifier → display label
const KEY_DISPLAY: Record<string, string> = {
  Control: "Ctrl",
  Shift: "Shift",
  Alt: "Alt",
  Meta: "⌘",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  " ": "Space",
  Escape: "Esc",
  Delete: "Del",
  Insert: "Ins",
  PageUp: "PgUp",
  PageDown: "PgDn",
  MouseMiddle: "Mouse3",
  MouseRight: "Mouse4",
  Mouse4: "Mouse4",
  Mouse5: "Mouse5",
};

// Map key identifier → token sent to Rust backend
// These must match the token_to_vk() arms in lib.rs exactly.
const KEY_TO_TOKEN: Record<string, string> = {
  Control: "ctrl",
  Shift: "shift",
  Alt: "alt",
  Meta: "super",
  " ": "space",
  Enter: "enter",
  Escape: "escape",
  Backspace: "backspace",
  Delete: "delete",
  Tab: "tab",
  Insert: "insert",
  Home: "home",
  End: "end",
  PageUp: "pageup",
  PageDown: "pagedown",
  ArrowUp: "arrowup",
  ArrowDown: "arrowdown",
  ArrowLeft: "arrowleft",
  ArrowRight: "arrowright",
  F1: "f1", F2: "f2", F3: "f3", F4: "f4", F5: "f5", F6: "f6",
  F7: "f7", F8: "f8", F9: "f9", F10: "f10", F11: "f11", F12: "f12",
  CapsLock: "capslock",
  PrintScreen: "print",
  ScrollLock: "scrolllock",
  Pause: "pause",
  NumLock: "numlock",
  // Mouse buttons
  MouseMiddle: "mouse3",
  MouseRight:  "mouse2",
  Mouse4:      "mouse4",
  Mouse5:      "mouse5",
};

function keyToToken(key: string): string {
  if (KEY_TO_TOKEN[key]) return KEY_TO_TOKEN[key];
  if (key.length === 1) return key.toLowerCase();
  return key.toLowerCase();
}

function keyDisplay(key: string): string {
  return KEY_DISPLAY[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}

function orderKeys(keys: string[]): string[] {
  const mods = keys.filter(k => MODIFIER_KEYS.has(k));
  const main = keys.filter(k => !MODIFIER_KEYS.has(k));
  return [...mods, ...main];
}

interface Props {
  currentKeys: string[];   // stored key identifiers
  onDone: (keys: string[], tokenKeys: string[]) => void;
  onCancel: () => void;
}

export default function PttKeybindDialog({ currentKeys, onDone, onCancel }: Props) {
  const [heldKeys, setHeldKeys] = useState<string[]>([]);
  const [captured, setCaptured] = useState<string[]>(currentKeys);
  const heldSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const key = e.key;
      if (!key || key === "Unidentified") return;
      heldSet.current.add(key);
      const ordered = orderKeys(Array.from(heldSet.current));
      setHeldKeys([...ordered]);
      setCaptured([...ordered]);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      heldSet.current.delete(e.key);
      setHeldKeys(orderKeys(Array.from(heldSet.current)));
    };

    const onMouseDown = (e: MouseEvent) => {
      // Ignore left click (button 0) — it would close things accidentally
      if (e.button === 0) return;
      const name =
        e.button === 1 ? "MouseMiddle" :
        e.button === 2 ? "MouseRight"  :
        e.button === 3 ? "Mouse4"      :
        e.button === 4 ? "Mouse5"      : `Mouse${e.button}`;
      heldSet.current.add(name);
      const ordered = orderKeys(Array.from(heldSet.current));
      setHeldKeys([...ordered]);
      setCaptured([...ordered]);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) return;
      const name =
        e.button === 1 ? "MouseMiddle" :
        e.button === 2 ? "MouseRight"  :
        e.button === 3 ? "Mouse4"      :
        e.button === 4 ? "Mouse5"      : `Mouse${e.button}`;
      heldSet.current.delete(name);
      setHeldKeys(orderKeys(Array.from(heldSet.current)));
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup",   onKeyUp,   true);
    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("mouseup",   onMouseUp,   true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup",   onKeyUp,   true);
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("mouseup",   onMouseUp,   true);
    };
  }, []);

  const handleClear = () => {
    heldSet.current.clear();
    setHeldKeys([]);
    setCaptured([]);
  };

  const handleDone = () => {
    const tokenKeys = captured.map(keyToToken);
    onDone(captured, tokenKeys);
  };

  const isEmpty = captured.length === 0;

  return (
    <div className="pkd-overlay">
      <div className="pkd-dialog">
        <div className="pkd-header">
          <span className="pkd-title">Set Push-to-Talk Key</span>
        </div>

        <div className="pkd-body">
          <p className="pkd-hint">Press and hold any key or mouse button combination</p>

          <div className="pkd-capture-area">
            {isEmpty ? (
              <span className="pkd-placeholder">Waiting for input…</span>
            ) : (
              <div className="pkd-keys">
                {captured.map((k, i) => (
                  <span key={k} className="pkd-key-chip">
                    {keyDisplay(k)}
                    {i < captured.length - 1 && <span className="pkd-plus">+</span>}
                  </span>
                ))}
              </div>
            )}
            {heldKeys.length > 0 && heldKeys.join(",") !== captured.join(",") && (
              <div className="pkd-keys pkd-keys--live">
                {heldKeys.map((k, i) => (
                  <span key={k} className="pkd-key-chip pkd-key-chip--live">
                    {keyDisplay(k)}
                    {i < heldKeys.length - 1 && <span className="pkd-plus">+</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pkd-footer">
          <button className="pkd-btn pkd-btn--ghost" onClick={handleClear} disabled={isEmpty}>
            Clear
          </button>
          <div className="pkd-footer-right">
            <button className="pkd-btn pkd-btn--ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="pkd-btn pkd-btn--primary" onClick={handleDone}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
