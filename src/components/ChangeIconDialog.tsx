import { useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';

interface ChangeIconDialogProps {
  isOpen: boolean;
  currentIcon?: string;
  serverName: string;
  onClose: () => void;
  onChange: (iconPath: string | null) => void;
}

export function ChangeIconDialog({
  isOpen,
  currentIcon,
  serverName,
  onClose,
  onChange,
}: ChangeIconDialogProps) {
  const [previewIcon, setPreviewIcon] = useState<string | null>(currentIcon || null);

  if (!isOpen) return null;

  const handleFileSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Read file as data URL for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewIcon(result);
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleRemoveIcon = () => {
    setPreviewIcon(null);
  };

  const handleSave = () => {
    onChange(previewIcon);
    onClose();
  };

  const handleClose = () => {
    setPreviewIcon(currentIcon || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--window-bg)] rounded-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-2">Change Server Icon</h2>
        <p className="text-gray-400 text-sm mb-6">
          Upload a custom icon for {serverName}
        </p>

        {/* Icon Preview */}
        <div className="flex flex-col items-center space-y-4 mb-6">
          <div className="w-32 h-32 rounded-full bg-[var(--window-bg-secondary)] flex items-center justify-center overflow-hidden">
            {previewIcon ? (
              <img src={previewIcon} alt="Server icon" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-white">
                {serverName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleFileSelect}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {previewIcon ? 'Change' : 'Upload'} Icon
            </button>

            {previewIcon && (
              <button
                onClick={handleRemoveIcon}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center mb-6">
          Recommended: Square image, at least 256x256px
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-white hover:underline transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
