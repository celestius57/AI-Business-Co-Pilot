import React, { useState } from 'react';
import type { Project, MeetingMinute } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { getLondonTimestamp } from '../utils';

interface ManualMinuteModalProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
  onAddMinute: (minuteData: Omit<MeetingMinute, 'id'>) => void;
}

export const ManualMinuteModal: React.FC<ManualMinuteModalProps> = ({ isOpen, project, onClose, onAddMinute }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Title and Content are required.');
      return;
    }
    onAddMinute({
      companyId: project.companyId,
      projectId: project.id,
      title,
      content,
      timestamp: new Date(timestamp).toISOString(),
    });
    onClose();
    // Reset form for next time
    setTitle('');
    setContent('');
    setTimestamp(getLondonTimestamp().slice(0, 16));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 w-full max-w-lg border border-slate-700 flex flex-col" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add Manual Meeting Minute</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Minute Title"
            required
            className="w-full bg-slate-700 border border-slate-600 p-2"
            style={{ borderRadius: 'var(--radius-md)' }}
          />
           <div>
              <label className="text-sm font-medium text-slate-400">Meeting Date & Time</label>
              <input 
                type="datetime-local" 
                value={timestamp} 
                onChange={e => setTimestamp(e.target.value)} 
                required 
                className="w-full bg-slate-700 border border-slate-600 p-2 mt-1" 
                style={{ borderRadius: 'var(--radius-md)' }} 
              />
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Minute Content (Markdown is supported)"
            required
            rows={10}
            className="w-full bg-slate-700 border border-slate-600 p-2"
            style={{ borderRadius: 'var(--radius-md)' }}
          ></textarea>
        </div>
        <div className="flex gap-4 mt-4 justify-end pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-md)' }}>Save Minute</button>
        </div>
      </form>
    </div>
  );
};