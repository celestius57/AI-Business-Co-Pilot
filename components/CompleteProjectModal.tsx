import React, { useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface CompleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (generateReport: boolean) => void;
  projectName: string;
}

export const CompleteProjectModal: React.FC<CompleteProjectModalProps> = ({ isOpen, onClose, onConfirm, projectName }) => {
  const [generateReport, setGenerateReport] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(generateReport);
    // No need to call onClose here, parent component will do it
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 p-6 w-full max-w-lg mx-4 border border-slate-700 relative transform transition-all animate-slide-up"
        style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white">
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold">Complete Project: {projectName}</h2>
        <p className="text-slate-400 mt-2">
          Completing a project will mark it as read-only. You will still be able to view all its data, but you won't be able to make any changes unless you re-open it.
        </p>

        <label className="flex items-start gap-3 mt-6 p-4 bg-slate-900/50 rounded-lg cursor-pointer border-2 border-transparent has-[:checked]:border-indigo-500">
            <input 
                type="checkbox"
                checked={generateReport}
                onChange={(e) => setGenerateReport(e.target.checked)}
                className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500 mt-1"
            />
            <div>
                <div className="font-semibold text-white flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-indigo-400"/>
                    <span>Generate Final AI Project Report</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                    Let an AI Project Manager analyze the project's phases, budget, and outcomes to generate a comprehensive completion report and save it to the project's files.
                </p>
            </div>
        </label>

        <div className="mt-6 flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 rounded-lg font-semibold hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-500 transition-colors"
          >
            Confirm & Complete
          </button>
        </div>
      </div>
    </div>
  );
};
