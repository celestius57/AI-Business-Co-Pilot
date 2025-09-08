import React from 'react';
import type { Task, Employee, Project } from '../types';
import { calculateTaskPriority, formatDate } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';

interface TaskCardProps {
  task: Task;
  assignee?: Employee;
  project?: Project;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}

const priorityConfig = {
    'Urgent': { card: 'border-red-500 bg-red-900/50', badge: 'bg-red-500/20 text-red-300' },
    'High': { card: 'border-orange-500 bg-orange-900/50', badge: 'bg-orange-500/20 text-orange-300' },
    'Medium': { card: 'border-sky-500 bg-sky-900/50', badge: 'bg-sky-500/20 text-sky-300' },
    'Low': { card: 'border-slate-600 bg-slate-800/50', badge: 'bg-slate-700 text-slate-300' },
};

const completedConfig = {
    card: 'border-green-500 bg-green-500/10',
    badge: 'bg-green-500/20 text-green-300',
};


export const TaskCard: React.FC<TaskCardProps> = ({ task, assignee, project, onClick, onDragStart }) => {
    const { user } = useAuth();
    const isCompleted = task.status === 'Done';
    const currentPriority = calculateTaskPriority(task);
    
    const styles = isCompleted ? completedConfig : priorityConfig[currentPriority];

    return (
        <div
            onClick={onClick}
            onDragStart={(e) => onDragStart(e, task.id)}
            draggable
            className={`cursor-grab active:cursor-grabbing w-full text-left p-3 border-l-4 rounded-r-md transition-shadow hover:shadow-lg hover:shadow-slate-900/50 ${styles.card}`}
            style={{ borderRadius: 'var(--radius-md)' }}
        >
            <p className={`font-bold mb-2 ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>{task.title}</p>
            
            {isCompleted && task.completionTimestamp && (
                <p className="text-xs text-slate-500 mb-2">
                    Completed: {formatDate(task.completionTimestamp, user?.settings)}
                </p>
            )}

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {isCompleted ? (
                        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${styles.badge}`}>
                            <CheckBadgeIcon className="w-4 h-4" />
                            Completed
                        </span>
                    ) : (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles.badge}`}>{currentPriority}</span>
                    )}
                    {project && (
                        <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full truncate max-w-28">{project.name}</span>
                    )}
                </div>
                {assignee ? (
                    <img
                        src={assignee.avatarUrl}
                        alt={assignee.name}
                        title={`Assigned to ${assignee.name}`}
                        className="w-7 h-7 rounded-full ring-2 ring-slate-800"
                    />
                ) : (
                    <div className="w-7 h-7 rounded-full ring-2 ring-slate-800 bg-slate-700 text-slate-500 flex items-center justify-center text-xs font-bold" title="Unassigned">?</div>
                )}
            </div>
        </div>
    );
};