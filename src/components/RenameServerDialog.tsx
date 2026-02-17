import { useState } from 'react';
import { X } from 'lucide-react';

interface RenameServerDialogProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export function RenameServerDialog({
  isOpen,
  currentName,
  onClose,
  onRename,
}: RenameServerDialogProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Server name cannot be empty');
      return;
    }

    onRename(name.trim());
    onClose();
  };

  const handleClose = () => {
    setName(currentName);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#313338] rounded-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-2">Rename Server</h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter a new name for your server
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="My Server"
              autoFocus
              className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded border border-transparent focus:border-[#5865F2] outline-none transition-colors"
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
              className="px-4 py-2 text-white hover:underline transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#5865F2] text-white rounded hover:bg-[#4752C4] transition-colors"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
