import { useEffect, useRef } from "react";
import "./ContextMenu.css";

interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  checked?: boolean; // if defined, renders as a toggle row
  closeOnClick?: boolean; // default true
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Use capture so we get the event before other handlers
    document.addEventListener("mousedown", handleDown, true);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown, true);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Keep menu inside window bounds
  const style: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - items.length * 36 - 16),
    left: Math.min(x, window.innerWidth - 180),
  };

  return (
    <div className="ctx-menu" ref={menuRef} style={style}>
      {items.map((item, i) => (
        <button
          key={i}
          className={`ctx-item ${item.danger ? "ctx-item-danger" : ""} ${item.checked !== undefined ? "ctx-item-toggle" : ""}`}
          onClick={() => {
            item.onClick();
            if (item.closeOnClick !== false) onClose();
          }}
        >
          <span className="ctx-icon">{item.icon}</span>
          {item.label}
          {item.checked !== undefined && (
            <span className={`ctx-checkmark ${item.checked ? "ctx-checkmark-on" : ""}`}>
              {item.checked ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : null}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
