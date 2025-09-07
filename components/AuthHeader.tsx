import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/GoogleAuthContext';
import { BuildingIcon } from './icons/BuildingIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { UserProfileModal } from './UserProfileModal';
import { BellIcon } from './icons/BellIcon';
import { NotificationPanel } from './NotificationPanel';
import type { Notification } from '../types';

interface AuthHeaderProps {
    onNavigateToApiSettings: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClearAll: () => void;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
    onNavigateToApiSettings,
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClearAll,
}) => {
    const { user } = useAuth();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifPanelOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notifRef]);

    if (!user) return null;

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2 text-lg font-bold text-slate-300">
                            <BuildingIcon className="w-6 h-6 text-indigo-400" />
                            <span>AI Business Co-Pilot</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                            <span className="text-sm font-semibold text-slate-300 hidden sm:block">{user.name}</span>
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setIsNotifPanelOpen(prev => !prev)}
                                    className="p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors relative"
                                    aria-label="Open Notifications"
                                >
                                    <BellIcon className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {isNotifPanelOpen && (
                                    <NotificationPanel
                                        notifications={notifications}
                                        onMarkAsRead={onMarkAsRead}
                                        onMarkAllAsRead={onMarkAllAsRead}
                                        onClearAll={onClearAll}
                                        onClose={() => setIsNotifPanelOpen(false)}
                                    />
                                )}
                            </div>
                            <button
                                onClick={() => setIsProfileModalOpen(true)}
                                className="p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                                aria-label="Open User Settings"
                            >
                                <SettingsIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <UserProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
                onNavigateToApiSettings={onNavigateToApiSettings}
            />
        </>
    );
};
