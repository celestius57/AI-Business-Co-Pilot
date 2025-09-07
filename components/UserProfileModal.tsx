import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/GoogleAuthContext';
import { User, DateFormat, UserSettings } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { GUEST_AVATARS, TIMEZONES, DATE_FORMATS } from '../utils';
import { COUNTRIES, CURRENCIES } from '../constants';
import { CheckIcon } from './icons/CheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToApiSettings: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onNavigateToApiSettings }) => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [settings, setSettings] = useState<UserSettings>(user?.settings || { dateFormat: 'DD/MM/YYYY', timezone: 'Europe/London', country: 'GB', currency: 'USD', generatedDocsTimeframe: 30 });
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setSettings(user.settings || { dateFormat: 'DD/MM/YYYY', timezone: 'Europe/London', country: 'GB', currency: 'USD', generatedDocsTimeframe: 30 });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = () => {
    const dataToUpdate: Partial<Omit<User, 'id' | 'email'>> = {
        name,
        settings,
    };
    if (user.id === 'guest') {
        dataToUpdate.name = 'Guest User'; // Guest name is not editable
    }
    updateUser(dataToUpdate);
    setShowSaveConfirmation(true);
    setTimeout(() => {
      setShowSaveConfirmation(false);
      onClose();
    }, 1500);
  };
  
  const handleNavigate = () => {
    onNavigateToApiSettings();
    onClose();
  };


  const handleSettingsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = name === 'generatedDocsTimeframe';
    setSettings(prev => ({ ...prev, [name]: isNumeric ? parseInt(value, 10) : value }));
  };

    const handleNotificationSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            notificationSettings: {
                ...(prev.notificationSettings || { eventStart: true, reminder: true, taskDueDate: true }),
                [name]: checked,
            }
        }));
    };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 border border-slate-700 relative transform transition-all animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white">
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">User Profile</h2>
        
        <div className="space-y-6">
            {/* Avatar Section */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Avatar</label>
                <div className="flex items-center gap-3 bg-slate-700/50 p-3 rounded-lg">
                    <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                    <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-slate-400">Guest user avatar.</p>
                    </div>
                </div>
            </div>

            {/* Display Name */}
            <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
                <input 
                    id="displayName"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={user.id === 'guest'}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-700/50 disabled:cursor-not-allowed"
                />
                 {user.id === 'guest' && <p className="text-xs text-slate-500 mt-1">Display name cannot be changed in guest mode.</p>}
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="dateFormat" className="block text-sm font-medium text-slate-300 mb-1">Date Format</label>
                    <select
                        id="dateFormat"
                        name="dateFormat"
                        value={settings.dateFormat}
                        onChange={handleSettingsChange}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        {DATE_FORMATS.map(format => <option key={format} value={format}>{format}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-slate-300 mb-1">Timezone</label>
                    <select
                        id="timezone"
                        name="timezone"
                        value={settings.timezone}
                        onChange={handleSettingsChange}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="country" className="block text-sm font-medium text-slate-300 mb-1">Country</label>
                    <select
                        id="country"
                        name="country"
                        value={settings.country}
                        onChange={handleSettingsChange}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-1">Currency</label>
                    <select
                        id="currency"
                        name="currency"
                        value={settings.currency || 'USD'}
                        onChange={handleSettingsChange}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="generatedDocsTimeframe" className="block text-sm font-medium text-slate-300 mb-1">Generated Docs Timespan</label>
                    <select
                        id="generatedDocsTimeframe"
                        name="generatedDocsTimeframe"
                        value={settings.generatedDocsTimeframe || 30}
                        onChange={handleSettingsChange}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="365">Last Year</option>
                        <option value="0">All Time</option>
                    </select>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Notification Settings</h3>
                <div className="space-y-3 bg-slate-700/50 p-4 rounded-lg">
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="font-semibold">Meeting Alerts</p>
                            <p className="text-xs text-slate-400">Notify 15 minutes before a meeting starts.</p>
                        </div>
                        <input
                            type="checkbox"
                            name="eventStart"
                            checked={settings.notificationSettings?.eventStart ?? true}
                            onChange={handleNotificationSettingsChange}
                            className="h-5 w-5 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                        />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="font-semibold">Reminder Alerts</p>
                            <p className="text-xs text-slate-400">Notify 15 minutes before a reminder.</p>
                        </div>
                        <input
                            type="checkbox"
                            name="reminder"
                            checked={settings.notificationSettings?.reminder ?? true}
                            onChange={handleNotificationSettingsChange}
                            className="h-5 w-5 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                        />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="font-semibold">Task Due Date Alerts</p>
                            <p className="text-xs text-slate-400">Notify on the day a task is due.</p>
                        </div>
                        <input
                            type="checkbox"
                            name="taskDueDate"
                            checked={settings.notificationSettings?.taskDueDate ?? true}
                            onChange={handleNotificationSettingsChange}
                            className="h-5 w-5 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                        />
                    </label>
                </div>
            </div>

             <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Advanced Settings</h3>
                <button
                    onClick={handleNavigate}
                    className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg flex items-center gap-3 transition-colors"
                >
                    <SparklesIcon className="w-5 h-5 text-indigo-400" />
                    <div>
                        <p className="font-semibold">API Usage Settings</p>
                        <p className="text-xs text-slate-400">Manage daily request limits for your AI employees.</p>
                    </div>
                </button>
            </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-700 flex justify-end">
            <button
                onClick={handleSave}
                className={`min-w-[120px] p-2 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-500 transition-colors flex items-center justify-center ${showSaveConfirmation ? 'bg-green-600' : ''}`}
            >
                {showSaveConfirmation ? <CheckIcon className="w-6 h-6"/> : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
};
