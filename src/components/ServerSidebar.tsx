import { Plus, Home, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Server } from '../types';
import { serverApi, cn } from '../utils';
import { ServerContextMenu } from './ServerContextMenu';
import { RenameServerDialog } from './RenameServerDialog';
import { ChangeIconDialog } from './ChangeIconDialog';
import { RemoveServerDialog } from './RemoveServerDialog';

interface ServerSidebarProps {
  onServerSelect: (server: Server | null) => void;
  onAddServer: () => void;
  onRefreshServer: (serverId: string) => void;
  onServerRemoved: (serverId: string) => void;
  onSettingsOpen: () => void;
  isSettingsOpen: boolean;
  refreshTrigger?: number;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  server: Server | null;
}

export function ServerSidebar({ onServerSelect, onAddServer, onRefreshServer, onServerRemoved, onSettingsOpen, isSettingsOpen, refreshTrigger }: ServerSidebarProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    server: null,
  });
  const [renameDialog, setRenameDialog] = useState<{ isOpen: boolean; server: Server | null }>({
    isOpen: false,
    server: null,
  });
  const [iconDialog, setIconDialog] = useState<{ isOpen: boolean; server: Server | null }>({
    isOpen: false,
    server: null,
  });
  const [removeDialog, setRemoveDialog] = useState<{ isOpen: boolean; server: Server | null }>({
    isOpen: false,
    server: null,
  });

  useEffect(() => {
    loadServers();
    loadActiveServer();
  }, [refreshTrigger]);

  const loadServers = async () => {
    try {
      const loadedServers = await serverApi.getServers();
      setServers(loadedServers);
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadActiveServer = async () => {
    try {
      const activeServer = await serverApi.getActiveServer();
      if (activeServer) {
        setActiveServerId(activeServer.id);
        onServerSelect(activeServer);
      }
    } catch (error) {
      console.error('Failed to load active server:', error);
    }
  };

  const handleServerClick = async (server: Server) => {
    try {
      await serverApi.setActiveServer(server.id);
      setActiveServerId(server.id);
      onServerSelect(server);
    } catch (error) {
      console.error('Failed to set active server:', error);
    }
  };

  const handleServerRightClick = (e: React.MouseEvent, server: Server) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      server,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0, server: null });
  };

  const handleRename = async (newName: string) => {
    if (!renameDialog.server) return;
    
    try {
      const updatedServer = { ...renameDialog.server, name: newName };
      await serverApi.updateServer(updatedServer);
      await loadServers();
    } catch (error) {
      console.error('Failed to rename server:', error);
    }
  };

  const handleChangeIcon = async (iconPath: string | null) => {
    if (!iconDialog.server) return;
    
    try {
      const updatedServer = { ...iconDialog.server, icon: iconPath || undefined };
      await serverApi.updateServer(updatedServer);
      await loadServers();
    } catch (error) {
      console.error('Failed to change icon:', error);
    }
  };

  const handleRefresh = () => {
    if (!contextMenu.server) return;
    onRefreshServer(contextMenu.server.id);
    closeContextMenu();
  };

  const handleToggleKeepLoaded = async () => {
    if (!contextMenu.server) return;
    
    try {
      // keepLoaded defaults to true when undefined, so use !== false as current value
      const currentlyEnabled = contextMenu.server.keepLoaded !== false;
      const updatedServer = {
        ...contextMenu.server,
        keepLoaded: !currentlyEnabled,
      };
      await serverApi.updateServer(updatedServer);
      await loadServers();
      // Update context menu state to reflect the new value
      setContextMenu(prev => ({
        ...prev,
        server: prev.server ? { ...prev.server, keepLoaded: updatedServer.keepLoaded } : null
      }));
      // If this is the currently-active server, notify the parent so App.tsx
      // can immediately add/remove it from the kept-alive pool
      if (updatedServer.id === activeServerId) {
        onServerSelect(updatedServer);
      }
    } catch (error) {
      console.error('Failed to toggle keep loaded:', error);
    }
  };

  const handleRemove = () => {
    if (!contextMenu.server) return;
    setRemoveDialog({ isOpen: true, server: contextMenu.server });
    closeContextMenu();
  };

  const handleConfirmRemove = async () => {
    if (!removeDialog.server) return;
    try {
      const removedId = removeDialog.server.id;
      await serverApi.deleteServer(removedId);
      await loadServers();
      onServerRemoved(removedId);
      if (activeServerId === removedId) {
        setActiveServerId(null);
        onServerSelect(null);
      }
      setRemoveDialog({ isOpen: false, server: null });
    } catch (error) {
      console.error('Failed to remove server:', error);
    }
  };

  const handleAddClick = () => {
    onAddServer();
  };

  const handleHomeClick = () => {
    setActiveServerId(null);
    onServerSelect(null);
  };

  return (
    <>
      <div className="w-18 bg-[var(--sidebar-bg)] flex flex-col items-center py-3 gap-2">
        {/* Home button at top */}
        <button
          onClick={handleHomeClick}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
            'hover:rounded-2xl',
            activeServerId === null && !isSettingsOpen ? 'bg-[var(--accent)] rounded-2xl' : 'bg-[var(--server-circle)] hover:bg-[var(--accent)]'
          )}
          title="Home"
        >
          <Home className="w-6 h-6 text-white" />
        </button>

        {/* Server separator */}
        <div className="w-8 h-0.5 bg-[var(--server-circle)] rounded-full my-1" />

        {/* Server list */}
        <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto w-full px-2">
          {servers.map((server) => (
            <button
              key={server.id}
              onClick={() => handleServerClick(server)}
              onContextMenu={(e) => handleServerRightClick(e, server)}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
                'hover:rounded-2xl relative group',
                activeServerId === server.id ? 'rounded-2xl' : ''
              )}
              style={{ backgroundColor: server.icon ? 'transparent' : 'var(--server-circle)' }}
              title={server.name}
            >
              {server.icon ? (
                <img 
                  src={server.icon} 
                  alt={server.name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {server.name.substring(0, 2).toUpperCase()}
                </span>
              )}
              
              {/* Active indicator */}
              {activeServerId === server.id && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r" />
              )}
              
              {/* Hover indicator */}
              <div
                className={cn(
                  'absolute -left-2 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r transition-all',
                  'opacity-0 group-hover:opacity-100 h-5 group-hover:h-6',
                  activeServerId === server.id && 'opacity-0'
                )}
              />
            </button>
          ))}

          {/* Add server button */}
          <button
            onClick={handleAddClick}
            className={cn(
              'w-12 h-12 rounded-full bg-[var(--server-circle)] flex items-center justify-center',
              'transition-all duration-200 hover:rounded-2xl hover:bg-[#23a559]'
            )}
            title="Add Server"
          >
            <Plus className="w-6 h-6 text-[#23a559] hover:text-white transition-colors" />
          </button>
        </div>

        {/* Settings button at bottom */}
        <div className="w-8 h-0.5 bg-[var(--server-circle)] rounded-full my-1" />
        
        <button
          onClick={onSettingsOpen}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            isSettingsOpen ? 'bg-[var(--accent)] rounded-2xl' : 'bg-[var(--server-circle)] hover:bg-[var(--accent)] transition-all duration-200 hover:rounded-2xl'
          )}
          title="Settings"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu.isOpen && contextMenu.server && (
        <ServerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          serverName={contextMenu.server.name}
          keepLoaded={contextMenu.server.keepLoaded ?? true}
          onClose={closeContextMenu}
          onRename={() => {
            setRenameDialog({ isOpen: true, server: contextMenu.server });
            closeContextMenu();
          }}
          onChangeIcon={() => {
            setIconDialog({ isOpen: true, server: contextMenu.server });
            closeContextMenu();
          }}
          onRefresh={handleRefresh}
          onToggleKeepLoaded={handleToggleKeepLoaded}
          onRemove={handleRemove}
        />
      )}

      {/* Rename Dialog */}
      <RenameServerDialog
        isOpen={renameDialog.isOpen}
        currentName={renameDialog.server?.name || ''}
        onClose={() => setRenameDialog({ isOpen: false, server: null })}
        onRename={handleRename}
      />

      {/* Change Icon Dialog */}
      <ChangeIconDialog
        isOpen={iconDialog.isOpen}
        currentIcon={iconDialog.server?.icon}
        serverName={iconDialog.server?.name || ''}
        onClose={() => setIconDialog({ isOpen: false, server: null })}
        onChange={handleChangeIcon}
      />

      {/* Remove Server Dialog */}
      <RemoveServerDialog
        isOpen={removeDialog.isOpen}
        serverName={removeDialog.server?.name || ''}
        onClose={() => setRemoveDialog({ isOpen: false, server: null })}
        onConfirm={handleConfirmRemove}
      />
    </>
  );
}
