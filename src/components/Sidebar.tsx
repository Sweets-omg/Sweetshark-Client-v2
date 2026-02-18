import { useState, useCallback } from "react";
import { ActiveView, Server } from "../App";
import "./Sidebar.css";
import ContextMenu from "./ContextMenu";

interface Props {
  servers: Server[];
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onAddServer: () => void;
  onRenameServer: (id: string) => void;
  onRefreshServer: (id: string) => void;
  onRemoveServer: (id: string) => void;
  onChangeServerIcon: (id: string) => void;
  onToggleKeepLoaded: (id: string) => void;
  onContextMenuOpenChange: (open: boolean) => void;
}

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

const LayersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);

interface ContextState {
  serverId: string;
  x: number;
  y: number;
}

export default function Sidebar({
  servers,
  activeView,
  onSelectView,
  onAddServer,
  onRenameServer,
  onRefreshServer,
  onRemoveServer,
  onChangeServerIcon,
  onToggleKeepLoaded,
  onContextMenuOpenChange,
}: Props) {
  const [contextMenu, setContextMenu] = useState<ContextState | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, serverId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ serverId, x: e.clientX, y: e.clientY });
    onContextMenuOpenChange(true);
  }, [onContextMenuOpenChange]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    onContextMenuOpenChange(false);
  }, [onContextMenuOpenChange]);

  return (
    <>
      <nav className="sidebar">
        <div className="sidebar-top">
          <SidebarBtn
            active={activeView === "home"}
            onClick={() => onSelectView("home")}
            tooltip="Home"
          >
            <HomeIcon />
          </SidebarBtn>
          <div className="sidebar-divider" />
        </div>

        <div className="sidebar-servers">
          {servers.map(server => (
            <SidebarBtn
              key={server.id}
              active={activeView === server.id}
              onClick={() => onSelectView(server.id)}
              onContextMenu={e => handleContextMenu(e, server.id)}
              tooltip={server.name}
            >
              {server.iconUrl ? (
                <img src={server.iconUrl} alt={server.name} className="server-icon-img" />
              ) : (
                <span className="server-letter">{server.iconLetter}</span>
              )}
            </SidebarBtn>
          ))}

          <SidebarBtn
            active={false}
            onClick={onAddServer}
            tooltip="Add Server"
            variant="add"
          >
            <PlusIcon />
          </SidebarBtn>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <SidebarBtn
            active={activeView === "settings"}
            onClick={() => onSelectView("settings")}
            tooltip="Settings"
          >
            <GearIcon />
          </SidebarBtn>
        </div>
      </nav>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          items={[
            {
              label: "Rename",
              icon: <PencilIcon />,
              onClick: () => onRenameServer(contextMenu.serverId),
            },
            {
              label: "Change Icon",
              icon: <ImageIcon />,
              onClick: () => onChangeServerIcon(contextMenu.serverId),
            },
            {
              label: "Refresh",
              icon: <RefreshIcon />,
              onClick: () => onRefreshServer(contextMenu.serverId),
            },
            {
              label: "Keep server loaded",
              icon: <LayersIcon />,
              checked: servers.find(s => s.id === contextMenu.serverId)?.keepLoaded ?? true,
              closeOnClick: false,
              onClick: () => onToggleKeepLoaded(contextMenu.serverId),
            },
            {
              label: "Remove Server",
              icon: <TrashIcon />,
              onClick: () => onRemoveServer(contextMenu.serverId),
              danger: true,
            },
          ]}
        />
      )}
    </>
  );
}

interface BtnProps {
  active: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  tooltip: string;
  variant?: "default" | "add";
}

function SidebarBtn({ active, onClick, onContextMenu, children, tooltip, variant = "default" }: BtnProps) {
  return (
    <div className={`sidebar-btn-wrap ${active ? "active" : ""}`}>
      {active && <div className="active-indicator" />}
      <button
        className={`sidebar-btn ${active ? "active" : ""} ${variant === "add" ? "add-btn" : ""}`}
        onClick={onClick}
        onContextMenu={onContextMenu}
        title={tooltip}
      >
        {children}
      </button>
    </div>
  );
}
