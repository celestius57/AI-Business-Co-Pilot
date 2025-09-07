import React, { useState, useEffect } from 'react';

interface DeleteCompanyModalProps {
  isOpen: boolean;
  companyName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({ isOpen, companyName, onClose, onConfirm }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(''); // Reset input when modal opens
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isConfirmed = inputValue.toLowerCase() === 'delete';

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 border border-slate-700">
        <h2 className="text-2xl font-bold text-red-400">Delete Company</h2>
        <p className="mt-2 text-slate-300">
          This action is irreversible. All departments and employees associated with <strong className="text-white">{companyName}</strong> will be permanently deleted.
        </p>
        <p className="mt-4 text-slate-300">
          To confirm, please type "<strong className="text-white">delete</strong>" in the box below.
        </p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 mt-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
          placeholder="delete"
        />
        <div className="mt-6 flex gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 p-2 bg-slate-600 rounded-lg font-semibold hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed}
            className="flex-1 p-2 bg-red-600 rounded-lg font-semibold hover:bg-red-500 transition-colors disabled:bg-red-900/50 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            Confirm Deletion
          </button>
        </div>
      </div>
    </div>
  );
};
