import React, { useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface TaskClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (closureComment: string) => void;
}

export const TaskClosureModal: React.FC<TaskClosureModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('A closure comment is required to complete the task.');
      return;
    }
    onConfirm(comment);
    setComment('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 w-full max-w-lg border border-slate-700" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Complete Task</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <p className="text-slate-400 mb-4">Please provide a brief closure comment for this task before marking it as "Done".</p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="e.g., Deployed feature to production, client has approved the final designs, etc."
          required
          rows={5}
          className="w-full bg-slate-700 border border-slate-600 p-2"
          style={{ borderRadius: 'var(--radius-md)' }}
        />
        <div className="flex gap-4 mt-4 justify-end pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-md)' }}>Complete Task</button>
        </div>
      </form>
    </div>
  );
};
