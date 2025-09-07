import React, { useState, useMemo, useEffect } from 'react';
import type { Event, Employee, Project, Client } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { SearchIcon } from './icons/SearchIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ProjectsIcon } from './icons/ProjectsIcon';
import { UsersIcon } from './icons/UsersIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { JobProfile } from '../constants';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './ConfirmationModal';

interface EventCreatorProps {
  companyId: string;
  employees: Employee[];
  projects: Project[];
  clients: Client[];
  onAddEvent: (eventData: Omit<Event, 'id'>) => void;
  onUpdateEvent: (eventId: string, eventData: Partial<Omit<Event, 'id'>>) => void;
  onDeleteEvent: (eventId: string) => void;
  onBack: () => void;
  initialDate?: Date;
  eventToEdit?: Event | null;
}

const DURATION_OPTIONS = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
];

const EVENT_COLORS = [
    { name: 'Indigo', value: 'bg-indigo-500' },
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Green', value: 'bg-green-500' },
    { name: 'Yellow', value: 'bg-yellow-500' },
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Purple', value: 'bg-purple-500' },
];

const toLocalISOString = (isoString: string): string => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        return new Date().toISOString().slice(0, 16);
    }
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
};

export const EventCreator: React.FC<EventCreatorProps> = ({ companyId, employees, projects, clients, onAddEvent, onUpdateEvent, onDeleteEvent, onBack, initialDate, eventToEdit }) => {
    const isEditMode = !!eventToEdit;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [duration, setDuration] = useState(60);
    const [endDate, setEndDate] = useState('');
    const [context, setContext] = useState(''); // "project_{id}" or "client_{id}"
    const [participantIds, setParticipantIds] = useState<string[]>([]);
    const [color, setColor] = useState(EVENT_COLORS[0].value);
    const [attendeeSearch, setAttendeeSearch] = useState('');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        if (isEditMode && eventToEdit) {
            setTitle(eventToEdit.title);
            setDescription(eventToEdit.description);
            setStartDate(toLocalISOString(eventToEdit.start));
            setParticipantIds(eventToEdit.participantIds);
            setColor(eventToEdit.color);

            if (eventToEdit.projectId) {
                setContext(`project_${eventToEdit.projectId}`);
            } else if (eventToEdit.clientId) {
                setContext(`client_${eventToEdit.clientId}`);
            } else {
                setContext('');
            }

            const start = new Date(eventToEdit.start);
            const end = new Date(eventToEdit.end);
            const durationMinutes = (end.getTime() - start.getTime()) / 60000;
            setDuration(durationMinutes);
        } else {
            const date = initialDate ? new Date(initialDate) : new Date();
            date.setHours(9, 0, 0, 0); // Default to 9 AM
            setStartDate(toLocalISOString(date.toISOString()));
            setTitle('');
            setDescription('');
            setParticipantIds([]);
            setColor(EVENT_COLORS[0].value);
            setDuration(60);
            setContext('');
        }
    }, [eventToEdit, isEditMode, initialDate]);

    useEffect(() => {
        if (startDate && duration) {
            const start = new Date(startDate);
            const end = new Date(start.getTime() + duration * 60000);
            setEndDate(end.toISOString());
        }
    }, [startDate, duration]);

    const availableAttendees = useMemo(() => {
        let potentialAttendees = employees.filter(e => e.jobProfile !== JobProfile.PersonalAssistant);
        
        if (context) {
            const parts = context.split('_');
            const type = parts[0];
            const id = parts.slice(1).join('_');
            if (type === 'project') {
                const project = projects.find(p => p.id === id);
                if (project) {
                    const memberIds = new Set(project.employeeIds);
                    potentialAttendees = potentialAttendees.filter(e => memberIds.has(e.id));
                }
            } else if (type === 'client') {
                const clientProjects = projects.filter(p => p.clientId === id);
                const memberIds = new Set(clientProjects.flatMap(p => p.employeeIds));
                potentialAttendees = potentialAttendees.filter(e => memberIds.has(e.id));
            }
        }
        
        if (!attendeeSearch) return potentialAttendees;

        const searchTerm = attendeeSearch.toLowerCase();
        return potentialAttendees.filter(emp => 
            emp.name.toLowerCase().includes(searchTerm) || 
            emp.jobProfile.toLowerCase().includes(searchTerm)
        );

    }, [context, employees, projects, attendeeSearch]);
    
    // Deselect participants if they are no longer in the available list
    useEffect(() => {
        setParticipantIds(prev => prev.filter(id => availableAttendees.some(e => e.id === id)));
    }, [availableAttendees]);

    const handleParticipantToggle = (employeeId: string) => {
        setParticipantIds(prev => {
            const newParticipants = new Set(prev);
            if (newParticipants.has(employeeId)) {
                newParticipants.delete(employeeId);
            } else {
                newParticipants.add(employeeId);
            }
            return Array.from(newParticipants);
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let projectId: string | undefined;
        let clientId: string | undefined;

        if (context) {
            const parts = context.split('_');
            const type = parts[0];
            const id = parts.slice(1).join('_');
            
            if (type === 'project') {
                projectId = id;
            } else if (type === 'client') {
                clientId = id;
            }
        }

        const eventData = {
            title,
            description,
            start: new Date(startDate).toISOString(),
            end: endDate,
            participantIds,
            color,
            type: 'meeting' as const,
            projectId,
            clientId,
        };

        if (isEditMode && eventToEdit) {
            onUpdateEvent(eventToEdit.id, eventData);
        } else {
            onAddEvent({ ...eventData, companyId });
        }
        onBack();
    };

    const handleDelete = () => {
        if (isEditMode && eventToEdit) {
            onDeleteEvent(eventToEdit.id);
        }
        setIsDeleteConfirmOpen(false);
        onBack();
    };


    return (
        <>
            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                title={`Delete Event`}
                message={`Are you sure you want to delete the event "${eventToEdit?.title}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                onClose={() => setIsDeleteConfirmOpen(false)}
            />
            <div className="w-full max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
                <button onClick={onBack} className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] mb-6 font-semibold">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back to Calendar
                </button>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-3xl font-bold">{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                            <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-slate-700 p-2 rounded-md"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1"><CalendarIcon className="w-4 h-4" /> Start Date & Time</label>
                                <input id="startDate" type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full bg-slate-700 p-2 rounded-md"/>
                            </div>
                            <div>
                                <label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1"><ClockIcon className="w-4 h-4" /> Duration</label>
                                <select id="duration" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md">
                                    {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="context" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1"><ProjectsIcon className="w-4 h-4"/> Project / Client (Optional)</label>
                            <select id="context" value={context} onChange={e => setContext(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md">
                                <option value="">None</option>
                                <optgroup label="Clients">
                                    {clients.map(c => <option key={c.id} value={`client_${c.id}`}>{c.name}</option>)}
                                </optgroup>
                                <optgroup label="Projects">
                                    {projects.filter(p => p.status === 'Active').map(p => <option key={p.id} value={`project_${p.id}`}>{p.name}</option>)}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1"><UsersIcon className="w-4 h-4"/> Attendees ({participantIds.length})</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-slate-400"/></span>
                                <input type="text" value={attendeeSearch} onChange={e => setAttendeeSearch(e.target.value)} placeholder="Search by name or job profile..." className="w-full bg-slate-900 p-2 pl-10 rounded-t-md"/>
                            </div>
                            <div className="max-h-60 overflow-y-auto bg-slate-900/50 p-2 space-y-2 rounded-b-md">
                                {availableAttendees.map(emp => (
                                    <label key={emp.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-slate-700 rounded-md">
                                        <input type="checkbox" checked={participantIds.includes(emp.id)} onChange={() => handleParticipantToggle(emp.id)} className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"/>
                                        <img src={emp.avatarUrl} alt={emp.name} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="font-semibold text-sm">{emp.name}</p>
                                            <p className="text-xs text-slate-400">{emp.jobProfile}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1"><DocumentTextIcon className="w-4 h-4"/> Description</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-slate-700 p-2 rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Event Color</label>
                            <div className="flex gap-2">
                                {EVENT_COLORS.map(c => (
                                    <button type="button" key={c.value} onClick={() => setColor(c.value)} className={`w-8 h-8 rounded-full ${c.value} ${color === c.value ? 'ring-2 ring-white' : ''}`}></button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                             {isEditMode ? (
                                <button type="button" onClick={() => setIsDeleteConfirmOpen(true)} className="px-4 py-2 bg-red-800/80 hover:bg-red-700/80 flex items-center gap-2 rounded-md">
                                    <TrashIcon className="w-5 h-5"/> Delete
                                </button>
                            ) : <div></div>}
                            <div className="flex gap-4">
                                <button type="button" onClick={onBack} className="px-6 py-2 bg-slate-600 font-semibold rounded-md hover:bg-slate-500">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-[var(--color-primary)] font-semibold rounded-md hover:bg-[var(--color-primary-hover)]">{isEditMode ? 'Update Event' : 'Create Event'}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};