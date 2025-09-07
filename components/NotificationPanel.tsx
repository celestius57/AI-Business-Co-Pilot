import React from 'react';
import type { Notification } from '../types';
import { formatTimestamp } from '../utils';
import { BellIcon } from './icons/BellIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { useAuth } from '../contexts/GoogleAuthContext';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onClose
}) => {
  const { user } = useAuth();
  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="absolute top-16 right-0 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 text-white">
      <div className="flex justify-between items-center p-3 border-b border-slate-700">
        <h3 className="font-bold">Notifications</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {sortedNotifications.length > 0 ? (
          sortedNotifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => onMarkAsRead(notif.id)}
              className={`p-3 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50 ${notif.read ? 'opacity-60' : ''}`}
            >
              <p className="text-sm">{notif.message}</p>
              <p className="text-xs text-slate-400 mt-1">{formatTimestamp(notif.timestamp, user?.settings)}</p>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500">
            <BellIcon className="w-10 h-10 mx-auto mb-2" />
            <p>No notifications yet.</p>
          </div>
        )}
      </div>
      {sortedNotifications.length > 0 && (
        <div className="p-2 flex justify-between text-xs font-semibold">
          <button onClick={onMarkAllAsRead} className="text-indigo-400 hover:underline">Mark all as read</button>
          <button onClick={onClearAll} className="text-red-400 hover:underline">Clear all</button>
        </div>
      )}
    </div>
  );
};
