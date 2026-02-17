import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import type { Server } from '../types';
import { serverApi, generateServerId } from '../utils';

interface AddServerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onServerAdded: () => void;
}

export function AddServerDialog({ isOpen, onClose, onServerAdded }: AddServerDialogProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setIcon(result);
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!name.trim()) {
        throw new Error('Server name is required');
      }
      if (!url.trim()) {
        throw new Error('Server URL is required');
      }

      // Clean up URL (remove trailing slash, add protocol if missing)
      let cleanUrl = url.trim();
      if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
      }
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `http://${cleanUrl}`;
      }

      const newServer: Server = {
        id: generateServerId(),
        name: name.trim(),
        url: cleanUrl,
        icon: icon || undefined,
        keepLoaded: true, // Default to true
      };

      await serverApi.addServer(newServer);
      
      // Reset form
      setName('');
      setUrl('');
      setIcon(null);
      
      onServerAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setUrl('');
      setIcon(null);
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--window-bg)] rounded-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-2">Add a Server</h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter the details of your Sharkord server
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Server Icon (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-2">
              Server Icon <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--window-bg-secondary)] flex items-center justify-center overflow-hidden">
                {icon ? (
                  <img src={icon} alt="Server icon" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {name ? name.substring(0, 2).toUpperCase() : '??'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleFileSelect}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[var(--window-bg-secondary)] text-gray-300 rounded hover:bg-[var(--window-bg-secondary)] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {icon ? 'Change' : 'Upload'} Icon
              </button>
              {icon && (
                <button
                  type="button"
                  onClick={() => setIcon(null)}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Server Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-gray-300 uppercase mb-2">
              Server Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Server"
              disabled={isSubmitting}
              className="w-full bg-[var(--window-bg-secondary)] text-white px-3 py-2 rounded border border-transparent focus:border-[var(--accent)] outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* Server URL */}
          <div>
            <label htmlFor="url" className="block text-xs font-semibold text-gray-300 uppercase mb-2">
              Server URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="localhost:4991 or https://sharkord.example.com"
              disabled={isSubmitting}
              className="w-full bg-[var(--window-bg-secondary)] text-white px-3 py-2 rounded border border-transparent focus:border-[var(--accent)] outline-none transition-colors disabled:opacity-50"
            />
          </div>


          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-white hover:underline transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
