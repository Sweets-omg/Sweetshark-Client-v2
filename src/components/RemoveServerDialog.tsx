import { X, Trash2 } from 'lucide-react';

interface RemoveServerDialogProps {
  isOpen: boolean;
  serverName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveServerDialog({
  isOpen,
  serverName,
  onClose,
  onConfirm,
}: RemoveServerDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
      <div className="bg-[var(--window-bg)] rounded-lg w-full max-w-md p-6 relative shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon + Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Remove Server</h2>
        </div>

        <p className="text-gray-400 text-sm mb-6 ml-[52px]">
          Are you sure you want to remove{' '}
          <span className="text-white font-semibold">"{serverName}"</span>?
          This action cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white hover:underline transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
          >
            Remove Server
          </button>
        </div>
      </div>
    </div>
  );
}
