import { useEffect, useState } from 'react';
import type { Server } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

interface ServerViewProps {
  server: Server;
  refreshTrigger?: number;
}

export function ServerView({ server, refreshTrigger }: ServerViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    // Reset states when server changes
    setIsLoading(true);
    setHasError(false);
    setIframeKey((prev) => prev + 1);
  }, [server.id]);

  useEffect(() => {
    // Refresh iframe when refresh is triggered
    if (refreshTrigger && refreshTrigger > 0) {
      setIframeKey((prev) => prev + 1);
    }
  }, [refreshTrigger]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="flex-1 bg-[#313338] relative">
      {/* Loading overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#313338] z-10">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-[#5865F2] animate-spin mx-auto" />
            <p className="text-gray-400">
              Connecting to {server.name}...
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#313338] z-10">
          <div className="text-center space-y-4 max-w-md p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">
              Failed to Connect
            </h2>
            <p className="text-gray-400">
              Could not connect to <span className="text-white font-semibold">{server.name}</span>
            </p>
            <p className="text-sm text-gray-500">
              URL: {server.url}
            </p>
            <button
              onClick={handleRetry}
              className="bg-[#5865F2] text-white px-6 py-2 rounded hover:bg-[#4752C4] transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Server iframe */}
      <iframe
        key={iframeKey}
        src={server.url}
        className="w-full h-full border-0"
        title={server.name}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      />
    </div>
  );
}
