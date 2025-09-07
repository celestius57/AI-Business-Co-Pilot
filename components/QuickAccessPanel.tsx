import React, { useState, useMemo } from 'react';
import type { Event, Employee, Task, QuickNote } from '../types';
// FIX: Corrected import path for useAuth
import { useAuth } from '../contexts/GoogleAuthContext';
import { formatTime, formatDate, calculateTaskPriority } from '../utils';
import { ClockIcon } from './icons/ClockIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { GridViewIcon } from './icons/GridViewIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { StickyNote } from './StickyNote';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PlusIcon } from './icons/PlusIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';


interface QuickAccessPanelProps {
  events: Event[];
  employees: Employee[];
  tasks: Task[];
  quickNotes: QuickNote[];
  onViewEvent: (event: Event) => void;
  onViewTask: (task: Task) => void;
  onJoinMeeting: (event: Event) => void;
  onAddQuickNote: () => void;
  onUpdateQuickNote: (noteId: string, updates: Partial<Omit<QuickNote, 'id' | 'companyId'>>) => void;
  onDeleteQuickNote: (noteId: string) => void;
}

const priorityConfig = {
    'Urgent': { text: 'text-red-300', dot: 'bg-red-500' },
    'High': { text: 'text-orange-300', dot: 'bg-orange-500' },
    'Medium': { text: 'text-sky-300', dot: 'bg-sky-500' },
    'Low': { text: 'text-slate-400', dot: 'bg-slate-500' },
};


export const QuickAccessPanel: React.FC<QuickAccessPanelProps> = ({ events, employees, tasks, quickNotes, onViewEvent, onViewTask, onJoinMeeting, onAddQuickNote, onUpdateQuickNote, onDeleteQuickNote }) => {
    const { user } = useAuth();
    const [isMyTasksExpanded, setIsMyTasksExpanded] = useState(false);

    const upcomingMeetings = useMemo(() => {
        const now = new Date();
        // Set to the very end of the current day in the local timezone
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        return events
            .filter(e => {
                if (e.type !== 'meeting') return false;
                
                const start = new Date(e.start);
                const end = new Date(e.end);

                // A meeting is "upcoming" if it hasn't ended yet AND it starts before the end of today.
                return end > now && start < endOfToday;
            })
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
            .slice(0, 5);
    }, [events]);

    const myTasks = useMemo(() => {
        if (!user) return [];
        
        const priorityOrder: Record<Task['priority'], number> = {
            'Urgent': 1,
            'High': 2,
            'Medium': 3,
            'Low': 4,
        };

        return tasks
            .filter(task => task.assigneeId === user.id && task.status !== 'Done')
            .sort((a, b) => {
                const priorityA = calculateTaskPriority(a);
                const priorityB = calculateTaskPriority(b);
                return priorityOrder[priorityA] - priorityOrder[priorityB];
            });
    }, [tasks, user]);

    const displayedMyTasks = isMyTasksExpanded ? myTasks : myTasks.slice(0, 3);

    return (
        <aside className="hidden xl:block w-80 space-y-6 shrink-0">
            {/* Upcoming Meetings */}
            <div className="bg-slate-800 p-4" style={{ borderRadius: 'var(--radius-lg)' }}>
                <h3 className="flex items-center gap-2 font-bold text-slate-300 mb-3">
                    <ClockIcon className="w-5 h-5 text-[var(--color-primary)]" />
                    <span>Upcoming Meetings</span>
                </h3>
                <div className="space-y-3">
                    {upcomingMeetings.length > 0 ? (
                        upcomingMeetings.map(meeting => {
                            const now = new Date();
                            const start = new Date(meeting.start);
                            const end = new Date(meeting.end);
                            const isMeetingInProgress = start <= now && now <= end;

                            return (
                                <div 
                                    key={meeting.id} 
                                    className="w-full text-left bg-slate-900/50 p-3 hover:bg-slate-700/50 transition-colors rounded-md"
                                >
                                    <div onClick={() => onViewEvent(meeting)} className="cursor-pointer">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-sm flex-1">{meeting.title}</p>
                                            <div className="text-right">
                                                <span className={`block text-xs font-bold px-2 py-1 rounded-full text-white/90 ${meeting.color}`}>{formatTime(meeting.start, user?.settings)}</span>
                                                <span className="block text-xs text-slate-500 mt-1">{formatDate(meeting.start, user?.settings)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <UserGroupIcon className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs text-slate-400">{meeting.participantIds.length} participant(s)</span>
                                        </div>
                                    </div>
                                    {isMeetingInProgress && (
                                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onJoinMeeting(meeting); }}
                                                className="w-full text-center py-1.5 bg-green-600 font-semibold rounded-md text-sm hover:bg-green-500 flex items-center justify-center gap-2"
                                            >
                                                <VideoCameraIcon className="w-4 h-4"/>
                                                Join Now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-4">No upcoming meetings.</p>
                    )}
                </div>
            </div>
            
            {/* Sticky Notes */}
            <div className="bg-slate-800 p-4" style={{ borderRadius: 'var(--radius-lg)' }}>
                <h3 className="flex items-center justify-between font-bold text-slate-300 mb-3">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-[var(--color-primary)]" />
                        <span>Sticky Notes</span>
                    </div>
                    <button 
                        onClick={onAddQuickNote}
                        className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Add new note"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 -mr-2">
                    {quickNotes.length > 0 ? (
                        quickNotes.map(note => (
                            <StickyNote 
                                key={note.id} 
                                note={note} 
                                onUpdate={onUpdateQuickNote} 
                                onDelete={onDeleteQuickNote} 
                            />
                        ))
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-4">Click '+' to add a note.</p>
                    )}
                </div>
            </div>

            {/* My Tasks */}
            <div className="bg-slate-800 p-4" style={{ borderRadius: 'var(--radius-lg)' }}>
                <h3 className="flex items-center gap-2 font-bold text-slate-300 mb-3">
                    <ClipboardCheckIcon className="w-5 h-5 text-[var(--color-primary)]" />
                    <span>My Tasks</span>
                </h3>
                <div className="space-y-2">
                     {displayedMyTasks.length > 0 ? (
                        displayedMyTasks.map(task => {
                            const currentPriority = calculateTaskPriority(task);
                            const priority = priorityConfig[currentPriority];
                            return (
                                <button 
                                    key={task.id} 
                                    onClick={() => onViewTask(task)}
                                    className="w-full text-left bg-slate-900/50 p-2 flex items-center gap-3 hover:bg-slate-700/50 transition-colors" 
                                    style={{ borderRadius: 'var(--radius-md)' }}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priority.dot}`} title={`${currentPriority} priority`}></span>
                                    <span className="text-sm text-slate-300 flex-1 truncate" title={task.title}>{task.title}</span>
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${priority.text}`}>
                                        {currentPriority}
                                    </span>
                                </button>
                            );
                        })
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-4">You have no pending tasks.</p>
                    )}
                </div>
                 {myTasks.length > 3 && (
                    <button 
                        onClick={() => setIsMyTasksExpanded(!isMyTasksExpanded)}
                        className="w-full text-center text-sm font-semibold text-[var(--color-primary)] hover:underline mt-3 flex items-center justify-center gap-1"
                    >
                        <span>{isMyTasksExpanded ? 'Show less' : `Show ${myTasks.length - 3} more`}</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isMyTasksExpanded ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
        </aside>
    );
};