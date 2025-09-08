import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import type { ProjectPhase, ProjectPhaseStatus } from '../types';
// FIX: Corrected import path for useAuth
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './ConfirmationModal';


const PhaseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ProjectPhase, 'id' | 'projectId'>) => void;
    phase?: ProjectPhase | null;
}> = ({ isOpen, onClose, onSave, phase }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<ProjectPhaseStatus>('Not Started');

    useEffect(() => {
        if (isOpen) {
            if (phase) {
                setName(phase.name || '');
                setDescription(phase.description || '');
                setStartDate(phase.startDate ? phase.startDate.split('T')[0] : '');
                setEndDate(phase.endDate ? phase.endDate.split('T')[0] : '');
                setStatus(phase.status || 'Not Started');
            } else {
                // Reset for new phase
                setName('');
                setDescription('');
                setStartDate('');
                setEndDate('');
                setStatus('Not Started');
            }
        }
    }, [isOpen, phase]);


    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !startDate || !endDate) return;
        if (new Date(startDate) > new Date(endDate)) {
            alert('Start date cannot be after end date.');
            return;
        }
        onSave({ name, description, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), status });
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-slate-800 p-6 w-full max-w-lg" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">{phase ? 'Edit' : 'New'} Project Phase</h3>
                <div className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Phase Name" required className="w-full bg-slate-700 p-2"/>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full bg-slate-700 p-2"/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full bg-slate-700 p-2"/>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full bg-slate-700 p-2"/>
                    </div>
                    <select value={status} onChange={e => setStatus(e.target.value as ProjectPhaseStatus)} className="w-full bg-slate-700 p-2">
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                <div className="flex gap-4 mt-6 justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]">Save Phase</button>
                </div>
            </form>
        </div>
    );
};


export const ProjectPlanningView: React.FC = () => {
    const { phases, onAddPhase, onUpdatePhase, onDeletePhase } = useProject();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);
    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => {},
    });

    const sortedPhases = useMemo(() => 
        [...phases].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), 
    [phases]);

    const ganttData = useMemo(() => {
        if (sortedPhases.length === 0) {
            const today = new Date();
            const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
             maxDate.setDate(maxDate.getDate() + 1);
            const totalDays = 30;
            return { minDate, maxDate, totalDays, monthMarkers: [{ name: minDate.toLocaleString('default', { month: 'long' }), year: minDate.getFullYear(), left: 0, width: 100 }] };
        }

        const allDates = sortedPhases.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
        let minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        let maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        
        // Add padding
        minDate.setDate(minDate.getDate() - 7);
        maxDate.setDate(maxDate.getDate() + 7);

        const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

        const monthMarkers = [];
        let cursorDate = new Date(minDate);
        while (cursorDate <= maxDate) {
            const startOfMonth = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
            const endOfMonth = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 0);
            
            const start = cursorDate.getMonth() === minDate.getMonth() && cursorDate.getFullYear() === minDate.getFullYear() ? minDate : startOfMonth;
            const end = cursorDate.getMonth() === maxDate.getMonth() && cursorDate.getFullYear() === maxDate.getFullYear() ? maxDate : endOfMonth;

            const daysInView = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
            const offsetDays = (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

            monthMarkers.push({
                name: cursorDate.toLocaleString('default', { month: 'short' }),
                year: cursorDate.getFullYear(),
                left: (offsetDays / totalDays) * 100,
                width: (daysInView / totalDays) * 100,
            });
            cursorDate.setMonth(cursorDate.getMonth() + 1);
            cursorDate.setDate(1);
        }

        return { minDate, maxDate, totalDays, monthMarkers };
    }, [sortedPhases]);

    const handleSavePhase = (data: Omit<ProjectPhase, 'id' | 'projectId'>) => {
        if (editingPhase) {
            onUpdatePhase(editingPhase.id, data);
        } else {
            onAddPhase(data);
        }
    };
    
    const openEditModal = (phase: ProjectPhase) => {
        setEditingPhase(phase);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingPhase(null);
        setIsModalOpen(true);
    };
    
    const handleDeletePhase = (phase: ProjectPhase) => {
        setConfirmModalState({
            isOpen: true,
            title: `Delete Phase "${phase.name}"`,
            message: 'Are you sure you want to delete this phase? This action cannot be undone.',
            onConfirm: () => onDeletePhase(phase.id),
        });
    };

    const today = new Date();
    const todayOffsetDays = (today.getTime() - ganttData.minDate.getTime()) / (1000 * 60 * 60 * 24);
    const todayPosition = (todayOffsetDays / ganttData.totalDays) * 100;

    const statusConfig: Record<ProjectPhaseStatus, { bg: string, border: string }> = {
        'Not Started': { bg: 'bg-slate-600/50', border: 'border-slate-500' },
        'In Progress': { bg: 'bg-blue-600/50', border: 'border-blue-500' },
        'Completed': { bg: 'bg-green-600/50', border: 'border-green-500' },
    };

    return (
        <div>
            <ConfirmationModal
                isOpen={confirmModalState.isOpen}
                title={confirmModalState.title}
                message={confirmModalState.message}
                onConfirm={() => {
                    confirmModalState.onConfirm();
                    setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                }}
                onClose={() => setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
            />
            <PhaseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePhase}
                phase={editingPhase}
            />
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Project Timeline</h3>
                <button onClick={openAddModal} className="flex items-center gap-1 bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold">
                    <PlusIcon className="w-4 h-4"/>
                    Add Phase
                </button>
            </div>
            
             {sortedPhases.length === 0 ? (
                <p className="text-center py-10 text-slate-500">No phases have been planned for this project yet.</p>
            ) : (
                <div className="grid grid-cols-[300px_1fr] gap-0 bg-slate-800 p-2 rounded-lg">
                    {/* Header Left */}
                    <div className="font-semibold text-sm text-slate-300 p-2 border-b border-r border-slate-700">Phase Name</div>
                    {/* Header Right */}
                    <div className="relative border-b border-slate-700 overflow-hidden">
                        <div className="flex h-full">
                        {ganttData.monthMarkers.map((marker, index) => (
                            <div key={index} style={{ left: `${marker.left}%`, width: `${marker.width}%`}} className="absolute top-0 h-full text-center text-xs text-slate-400 font-semibold border-r border-slate-700/50 flex items-center justify-center">
                                {marker.name} '{marker.year.toString().slice(-2)}
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Phase List */}
                    <div className="border-r border-slate-700">
                        {sortedPhases.map(phase => (
                            <div key={phase.id} className="h-12 border-b border-slate-700/50 flex items-center p-2 justify-between group">
                                <div>
                                    <p className="font-semibold text-sm truncate">{phase.name}</p>
                                    <p className="text-xs text-slate-400">{formatDate(phase.startDate)} - {formatDate(phase.endDate)}</p>
                                </div>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(phase)} className="p-1 text-slate-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeletePhase(phase)} className="p-1 text-slate-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Gantt Bars */}
                    <div className="relative">
                        {todayPosition >= 0 && todayPosition <= 100 && (
                            <div style={{ left: `${todayPosition}%` }} className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" title="Today">
                                <div className="absolute -top-2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-1 rounded-sm">TODAY</div>
                            </div>
                        )}
                        {sortedPhases.map(phase => {
                            const phaseStart = new Date(phase.startDate);
                            const phaseEnd = new Date(phase.endDate);

                            const startOffsetDays = (phaseStart.getTime() - ganttData.minDate.getTime()) / (1000 * 60 * 60 * 24);
                            const durationDays = (phaseEnd.getTime() - phaseStart.getTime()) / (1000 * 60 * 60 * 24) + 1;

                            const left = (startOffsetDays / ganttData.totalDays) * 100;
                            const width = (durationDays / ganttData.totalDays) * 100;
                            
                            const statusStyle = statusConfig[phase.status];

                            return (
                                <div key={phase.id} className="h-12 border-b border-slate-700/50 p-2 relative">
                                    <div 
                                        style={{ left: `${left}%`, width: `${width}%` }} 
                                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md flex items-center px-2 text-xs font-semibold overflow-hidden border ${statusStyle.bg} ${statusStyle.border}`}
                                        title={`${phase.name} (${phase.status})`}
                                    >
                                       <span className="truncate text-white">{phase.name}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};