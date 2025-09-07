import React from 'react';

interface DuplicateFileModalProps {
  isOpen: boolean;
  fileName: string;
  onOverwrite: () => void;
  onSaveAsCopy: () => void;
  onCancel: () => void;
}

export const DuplicateFileModal: React.FC<DuplicateFileModalProps> = ({
  isOpen,
  fileName,
  onOverwrite,
  onSaveAsCopy,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={onCancel}>
      <div
        className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold">Duplicate File</h2>
        <p className="mt-2 text-slate-300">
          A file named "<strong className="text-white">{fileName}</strong>" already exists in this project. What would you like to do?
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-slate-600 rounded-lg font-semibold hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onOverwrite}
            className="w-full px-4 py-2 bg-amber-600 rounded-lg font-semibold hover:bg-amber-500 transition-colors"
          >
            Overwrite
          </button>
          <button
            onClick={onSaveAsCopy}
            className="w-full px-4 py-2 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-500 transition-colors"
          >
            Save as Copy
          </button>
        </div>
      </div>
    </div>
  );
};
