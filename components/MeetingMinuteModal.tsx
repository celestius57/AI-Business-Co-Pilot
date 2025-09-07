import React from 'react';
import type { MeetingMinute } from '../types';
// FIX: Corrected import path for useAuth
import { useAuth } from '../contexts/GoogleAuthContext';
import { formatTimestamp } from '../utils';
import { XMarkIcon } from './icons/XMarkIcon';

interface MeetingMinuteModalProps {
  isOpen: boolean;
  minute: MeetingMinute | null;
  onClose: () => void;
}

export const MeetingMinuteModal: React.FC<MeetingMinuteModalProps> = ({ isOpen, minute, onClose }) => {
  const { user } = useAuth();

  if (!isOpen || !minute) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 p-6 w-full max-w-2xl border border-slate-700 flex flex-col" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{minute.title}</h3>
            <p className="text-sm text-slate-400">Meeting held on {formatTimestamp(minute.timestamp, user?.settings)}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div 
          className="prose prose-invert prose-sm bg-slate-900/50 p-4 max-h-[60vh] overflow-y-auto" 
          style={{ borderRadius: 'var(--radius-md)' }}
          dangerouslySetInnerHTML={{ __html: minute.content.replace(/\n/g, '<br />') }}
        >
        </div>
      </div>
    </div>
  );
};