import React from 'react';
import type { Event, Employee } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { formatTimestamp } from '../utils';
import { useAuth } from '../contexts/GoogleAuthContext';
import { PencilIcon } from './icons/PencilIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  employees: Employee[];
  onEdit: (event: Event) => void;
  onJoinMeeting: (event: Event) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event, employees, onEdit, onJoinMeeting }) => {
  const { user } = useAuth();

  if (!isOpen || !event) return null;

  const participants = employees.filter(e => event.participantIds.includes(e.id));

  const handleEdit = () => {
    onEdit(event);
    onClose();
  };
  
  const now = new Date();
  const start = new Date(event.start);
  const end = new Date(event.end);
  const isMeetingInProgress = event.type === 'meeting' && start <= now && now <= end;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 p-6 w-full max-w-lg mx-4 border border-slate-700 relative animate-slide-up"
        style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white">
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <div className={`border-l-4 ${event.color.replace('bg-', 'border-')} pl-4 mb-4`}>
            <h2 className="text-2xl font-bold">{event.title}</h2>
            <p className="text-slate-400">{formatTimestamp(event.start, user?.settings)} - {formatTimestamp(event.end, user?.settings)}</p>
        </div>

        {event.description && (
          <div className="bg-slate-900/50 p-3 my-4" style={{ borderRadius: 'var(--radius-md)' }}>
            <h3 className="font-semibold text-slate-300 mb-1">Details</h3>
            <p className="text-slate-400 text-sm">{event.description}</p>
          </div>
        )}

        {participants.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5" />
              Participants ({participants.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-slate-700/50" style={{ borderRadius: 'var(--radius-sm)' }}>
                  <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.jobProfile}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end gap-4">
            <button onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-lg font-semibold hover:bg-slate-500 transition-colors">Close</button>
            {isMeetingInProgress && (
                <button
                    onClick={() => onJoinMeeting(event)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg font-semibold hover:bg-green-500 transition-colors"
                >
                    <VideoCameraIcon className="w-5 h-5" />
                    Join Meeting
                </button>
            )}
            <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-500 transition-colors">
                <PencilIcon className="w-4 h-4"/>
                Edit
            </button>
        </div>
      </div>
    </div>
  );
};