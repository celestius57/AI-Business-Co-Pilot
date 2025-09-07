import React, { useState, useEffect } from 'react';
import type { Project } from '../types';

interface AddToProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    onConfirm: (projectId: string) => void;
}

export const AddToProjectModal: React.FC<AddToProjectModalProps> = ({ isOpen, onClose, projects, onConfirm }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    useEffect(() => {
        if (isOpen && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        } else {
            setSelectedProjectId('');
        }
    }, [isOpen, projects]);


    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedProjectId) {
            onConfirm(selectedProjectId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 p-6 w-full max-w-sm" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Add Document to Project</h3>
                <select 
                    value={selectedProjectId} 
                    onChange={e => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-700 p-2 border border-slate-600"
                >
                    <option value="" disabled>Select a project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="flex gap-4 mt-6 justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md">Cancel</button>
                    <button onClick={handleConfirm} disabled={!selectedProjectId} className="px-4 py-2 bg-[var(--color-primary)] disabled:bg-slate-500 rounded-md">Confirm</button>
                </div>
            </div>
        </div>
    );
};
