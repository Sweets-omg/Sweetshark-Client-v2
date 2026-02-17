import { useState, useEffect } from 'react';
import { ServerSidebar } from './components/ServerSidebar';
import { AddServerDialog } from './components/AddServerDialog';
import { WelcomeView } from './components/WelcomeView';
import { ServerView } from './components/ServerView';
import type { Server } from './types';
import './index.css';

function App() {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [serverRefreshTrigger, setServerRefreshTrigger] = useState<Record<string, number>>({});

  // Pool of servers kept alive in the DOM (keepLoaded === true / undefined).
  // Keyed by server id so we can update metadata without remounting.
  const [keptServers, setKeptServers] = useState<Record<string, Server>>({});

  const handleServerSelect = (server: Server | null) => {
    if (server) {
      const keepLoaded = server.keepLoaded !== false; // default true
      if (keepLoaded) {
        setKeptServers(prev => ({ ...prev, [server.id]: server }));
      } else {
        // Make sure it isn't lingering in the pool from a previous state
        setKeptServers(prev => {
          const next = { ...prev };
          delete next[server.id];
          return next;
        });
      }
    }
    setSelectedServer(server);
  };

  // Re-sync the kept pool whenever the selected server's keepLoaded flag changes
  // (e.g. toggled via the context menu while the server is active).
  useEffect(() => {
    if (!selectedServer) return;
    const keepLoaded = selectedServer.keepLoaded !== false;
    if (keepLoaded) {
      setKeptServers(prev => ({ ...prev, [selectedServer.id]: selectedServer }));
    } else {
      setKeptServers(prev => {
        const next = { ...prev };
        delete next[selectedServer.id];
        return next;
      });
    }
  }, [selectedServer]);

  const handleAddServer = () => setIsAddDialogOpen(true);

  const handleServerAdded = () => setRefreshTrigger(prev => prev + 1);

  const handleServerRemoved = (serverId: string) => {
    // Evict deleted server from the kept-alive pool so its iframe is destroyed
    setKeptServers(prev => {
      const next = { ...prev };
      delete next[serverId];
      return next;
    });
  };

  const handleRefreshServer = (serverId: string) => {
    setServerRefreshTrigger(prev => ({
      ...prev,
      [serverId]: (prev[serverId] || 0) + 1,
    }));
  };

  const activeId = selectedServer?.id ?? null;

  // Build the list of server views we need to render:
  // - All kept-alive servers (shown or hidden via CSS)
  // - The active server if it has keepLoaded=false (render only while active)
  const renderedServers: Server[] = Object.values(keptServers);
  if (selectedServer && !keptServers[selectedServer.id]) {
    renderedServers.push(selectedServer);
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#313338]">
      {/* Server Sidebar */}
      <ServerSidebar
        onServerSelect={handleServerSelect}
        onAddServer={handleAddServer}
        onRefreshServer={handleRefreshServer}
        onServerRemoved={handleServerRemoved}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Welcome screen - visible when no server is active */}
        {!activeId && (
          <div className="absolute inset-0">
            <WelcomeView onAddServer={handleAddServer} />
          </div>
        )}

        {/* One ServerView per kept/active server; hidden with display:none when inactive */}
        {renderedServers.map(server => (
          <div
            key={server.id}
            className="absolute inset-0"
            style={{ display: server.id === activeId ? 'block' : 'none' }}
          >
            <ServerView
              server={server}
              refreshTrigger={serverRefreshTrigger[server.id] || 0}
            />
          </div>
        ))}
      </div>

      {/* Add Server Dialog */}
      <AddServerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onServerAdded={handleServerAdded}
      />
    </div>
  );
}

export default App;
