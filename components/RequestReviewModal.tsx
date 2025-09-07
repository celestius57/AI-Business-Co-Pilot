
import React, { useState, useMemo } from 'react';
import type { Employee } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { SearchIcon } from './icons/SearchIcon';
import { useAuth } from '../contexts/GoogleAuthContext';
import { JobProfile } from '../constants';

interface RequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onConfirm: (reviewerId: string) => void;
  currentAuthorId?: string;
}

export const RequestReviewModal: React.FC<RequestReviewModalProps> = ({ isOpen, onClose, employees, onConfirm, currentAuthorId }) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReviewerId, setSelectedReviewerId] = useState('');

    const currentUserId = user?.id;

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp =>
            emp.id !== currentAuthorId &&
            emp.id !== currentUserId &&
            emp.jobProfile !== JobProfile.PersonalAssistant &&
            emp.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm, currentAuthorId, currentUserId]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedReviewerId) {
            onConfirm(selectedReviewerId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 p-6 w-full max-w-md border border-slate-700 flex flex-col h-[70vh]" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-xl font-bold">Request Review</h3>
                    <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
                </div>

                <div className="relative mb-4 flex-shrink-0">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-slate-400"/></span>
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Search for a reviewer..." 
                        className="w-full bg-slate-900 p-2 pl-10 rounded-md"
                    />
                </div>

                <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                    {filteredEmployees.map(emp => (
                        <label key={emp.id} className={`flex items-center gap-3 p-2 cursor-pointer rounded-md border-2 ${selectedReviewerId === emp.id ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-900/50 border-transparent hover:border-slate-600'}`}>
                            <input 
                                type="radio" 
                                name="reviewer" 
                                value={emp.id} 
                                checked={selectedReviewerId === emp.id} 
                                onChange={(e) => setSelectedReviewerId(e.target.value)}
                                className="h-5 w-5 bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                            />
                            <img src={emp.avatarUrl} alt={emp.name} className="w-8 h-8 rounded-full" />
                            <div>
                                <p className="font-semibold text-sm">{emp.name}</p>
                                <p className="text-xs text-slate-400">{emp.jobProfile}</p>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="flex gap-4 mt-4 justify-end pt-4 border-t border-slate-700 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md">Cancel</button>
                    <button onClick={handleConfirm} disabled={!selectedReviewerId} className="px-4 py-2 bg-indigo-600 disabled:bg-slate-500 rounded-md">Send Request</button>
                </div>
            </div>
        </div>
    );
};
