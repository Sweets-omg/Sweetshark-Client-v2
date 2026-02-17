import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

interface ServerContextMenuProps {
  x: number;
  y: number;
  serverName: string;
  keepLoaded: boolean;
  onClose: () => void;
  onRename: () => void;
  onChangeIcon: () => void;
  onRefresh: () => void;
  onToggleKeepLoaded: () => void;
  onRemove: () => void;
}

export function ServerContextMenu({
  x,
  y,
  serverName,
  keepLoaded,
  onClose,
  onRename,
  onChangeIcon,
  onRefresh,
  onToggleKeepLoaded,
  onRemove,
}: ServerContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-[#111214] rounded-md shadow-lg py-2 min-w-[200px] z-50 border border-[#1e1f22]"
      style={{
        top: `${y}px`,
        left: `${x}px`,
      }}
    >
      {/* Server name header */}
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase border-b border-[#1e1f22]">
        {serverName}
      </div>

      {/* Menu items */}
      <button
        onClick={onRename}
        className="w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#5865F2] text-left transition-colors"
      >
        Rename Server
      </button>

      <button
        onClick={onChangeIcon}
        className="w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#5865F2] text-left transition-colors"
      >
        Change Icon
      </button>

      <button
        onClick={onRefresh}
        className="w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#5865F2] text-left transition-colors"
      >
        Refresh
      </button>

      {/* Keep Server Loaded with checkmark */}
      <button
        onClick={onToggleKeepLoaded}
        className="w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#5865F2] text-left transition-colors flex items-center justify-between"
      >
        <span>Keep Server Loaded</span>
        {keepLoaded && <Check className="w-4 h-4" />}
      </button>

      {/* Separator */}
      <div className="my-1 border-t border-[#1e1f22]" />

      {/* Remove Server - danger color */}
      <button
        onClick={onRemove}
        className="w-full px-3 py-2 text-sm text-red-400 hover:text-white hover:bg-red-600 text-left transition-colors"
      >
        Remove Server
      </button>
    </div>
  );
}
