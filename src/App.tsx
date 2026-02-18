import { useState, useEffect } from 'react';
import { ServerSidebar } from './components/ServerSidebar';
import { AddServerDialog } from './components/AddServerDialog';
import { WelcomeView } from './components/WelcomeView';
import { ServerView } from './components/ServerView';
import { SettingsView } from './components/SettingsView';
import type { Server } from './types';
import { loadSettings, saveSettings, applySettings } from './useSettings';
import type { AppSettings } from './useSettings';
import './index.css';

function App() {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [serverRefreshTrigger, setServerRefreshTrigger] = useState<Record<string, number>>({});
  const [keptServers, setKeptServers] = useState<Record<string, Server>>({});
  const [settings, setSettings] = useState<AppSettings>(() => {
    const s = loadSettings();
    applySettings(s);
    return s;
  });

  // Persist and apply any settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleServerSelect = (server: Server | null) => {
    setShowSettings(false);
    if (server) {
      const keepLoaded = server.keepLoaded !== false;
      if (keepLoaded) {
        setKeptServers(prev => ({ ...prev, [server.id]: server }));
      } else {
        setKeptServers(prev => {
          const next = { ...prev };
          delete next[server.id];
          return next;
        });
      }
    }
    setSelectedServer(server);
  };

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

  const handleSettingsOpen = () => {
    setShowSettings(true);
    setSelectedServer(null);
  };

  const handleAddServer = () => setIsAddDialogOpen(true);
  const handleServerAdded = () => setRefreshTrigger(prev => prev + 1);

  const handleServerRemoved = (serverId: string) => {
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
  const renderedServers: Server[] = Object.values(keptServers);
  if (selectedServer && !keptServers[selectedServer.id]) {
    renderedServers.push(selectedServer);
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[var(--window-bg)]">
      <ServerSidebar
        onServerSelect={handleServerSelect}
        onAddServer={handleAddServer}
        onRefreshServer={handleRefreshServer}
        onServerRemoved={handleServerRemoved}
        onSettingsOpen={handleSettingsOpen}
        isSettingsOpen={showSettings}
        refreshTrigger={refreshTrigger}
      />

      <div className="flex-1 relative overflow-hidden">
        {/* Settings view */}
        {showSettings && (
          <div className="absolute inset-0 z-10">
            <SettingsView settings={settings} onSettingsChange={setSettings} />
          </div>
        )}

        {/* Welcome screen */}
        {!activeId && !showSettings && (
          <div className="absolute inset-0">
            <WelcomeView onAddServer={handleAddServer} />
          </div>
        )}

        {/* Kept-alive server views */}
        {renderedServers.map(server => (
          <div
            key={server.id}
            className="absolute inset-0"
            style={{ display: server.id === activeId && !showSettings ? 'block' : 'none' }}
          >
            <ServerView
              server={server}
              refreshTrigger={serverRefreshTrigger[server.id] || 0}
            />
          </div>
        ))}
      </div>

      <AddServerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onServerAdded={handleServerAdded}
      />
    </div>
  );
}

export default App;
