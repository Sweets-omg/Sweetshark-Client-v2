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
    <div className="flex-1 bg-[#313338] flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="w-24 h-24 bg-[#5865F2] rounded-full flex items-center justify-center mx-auto">
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
          className="bg-[#5865F2] text-white px-8 py-3 rounded-lg hover:bg-[#4752C4] transition-colors text-lg font-semibold"
        >
          Add Your First Server
        </button>

        {/* Help text */}
        <div className="pt-8 border-t border-gray-700 space-y-2">
          <p className="text-gray-500 text-sm">
            Unofficial client for{' '}
            <button
              onClick={handleSharkordLink}
              className="text-[#5865F2] hover:underline cursor-pointer bg-transparent border-none"
            >
              Sharkord
            </button>
          </p>
          <p className="text-gray-500 text-sm">
            Don't have a server yet?{' '}
            <button
              onClick={handleDocsLink}
              className="text-[#5865F2] hover:underline cursor-pointer bg-transparent border-none"
            >
              Learn how to set one up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
