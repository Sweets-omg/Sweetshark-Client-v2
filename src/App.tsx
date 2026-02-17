import { useState, useRef } from 'react';
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

  const handleServerSelect = (server: Server | null) => {
    setSelectedServer(server);
  };

  const handleAddServer = () => {
    setIsAddDialogOpen(true);
  };

  const handleServerAdded = () => {
    // Trigger refresh of sidebar to show new server
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefreshServer = (serverId: string) => {
    setServerRefreshTrigger(prev => ({
      ...prev,
      [serverId]: (prev[serverId] || 0) + 1
    }));
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#313338]">
      {/* Server Sidebar */}
      <ServerSidebar
        onServerSelect={handleServerSelect}
        onAddServer={handleAddServer}
        onRefreshServer={handleRefreshServer}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Content */}
      {selectedServer ? (
        <ServerView 
          server={selectedServer} 
          refreshTrigger={serverRefreshTrigger[selectedServer.id] || 0}
        />
      ) : (
        <WelcomeView onAddServer={handleAddServer} />
      )}

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
