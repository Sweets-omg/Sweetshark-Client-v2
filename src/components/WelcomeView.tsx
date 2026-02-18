import { Server as ServerIcon } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';

interface WelcomeViewProps {
  onAddServer: () => void;
}

export function WelcomeView({ onAddServer }: WelcomeViewProps) {
  const handleSharkordLink = async () => {
    await open('https://sharkord.com/');
  };

  const handleDocsLink = async () => {
    await open('https://sharkord.com/docs/introduction/quick-start');
  };

  return (
    <div className="flex-1 bg-[var(--window-bg)] flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="w-24 h-24 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto">
          <ServerIcon className="w-12 h-12 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white">
          Welcome to Sweetshark Client
        </h1>

        {/* Description */}
        <p className="text-gray-400 text-lg">
          Get started by adding your first Sharkord server. Connect to your self-hosted
          communication platform and start chatting!
        </p>

        {/* Add server button */}
        <button
          onClick={onAddServer}
          className="bg-[var(--accent)] text-white px-8 py-3 rounded-lg hover:bg-[var(--accent-hover)] transition-colors text-lg font-semibold"
        >
          Add Your First Server
        </button>

        {/* Help text */}
        <div className="pt-8 border-t border-gray-700 space-y-2">
          <p className="text-gray-500 text-sm">
            Unofficial client for{' '}
            <button
              onClick={handleSharkordLink}
              className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer bg-transparent border-none transition-colors"
            >
              Sharkord
            </button>
          </p>
          <p className="text-gray-500 text-sm">
            Don't have a server yet?{' '}
            <button
              onClick={handleDocsLink}
              className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer bg-transparent border-none transition-colors"
            >
              Learn how to set one up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
