import React, { useState, useMemo } from 'react';
import type { Task, Employee, Project, TaskStatus, User } from '../types';
import { TaskCard } from './TaskCard';
import { NewTaskModal } from './NewTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { PlusIcon } from './icons/PlusIcon';
import { TaskBoardIcon } from './icons/TaskBoardIcon';
import { JobProfile } from '../constants';
import { TaskClosureModal } from './TaskClosureModal';
import { getLondonTimestamp } from '../utils';

const COLUMNS: { id: TaskStatus; title: string }[] = [
    { id: 'To Do', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Done', title: 'Done' },
];

interface TaskBoardProps {
  user: User;
  companyId: string;
  tasks: Task[];
  employees: Employee[];
  projects: Project[];
  onAddTask: (taskData: Omit<Task, 'id' | 'companyId' | 'status' | 'priority'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'companyId' | 'priority'>>) => void;
  onDeleteTask: (taskId: string) => void;
  isEmbedded?: boolean;
  projectId?: string;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ user, companyId, tasks, employees, projects, onAddTask, onUpdateTask, onDeleteTask, isEmbedded = false, projectId }) => {
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
    const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);


    const assigneeMap = useMemo(() => {
        const map = new Map<string, Employee>(employees.map(e => [e.id, e]));
        if (user) {
            const userAsEmployee: Employee = {
                id: user.id,
                name: user.name,
                avatarUrl: user.picture,
                jobProfile: "User",
                systemInstruction: '',
                gender: 'Male',
                oceanProfile: { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 },
                chatHistories: {},
                morale: 100,
            };
            map.set(user.id, userAsEmployee);
        }
        return map;
    }, [employees, user]);

    const displayedTasks = useMemo(() => {
        return projectId ? tasks.filter(task => task.projectId === projectId) : tasks;
    }, [tasks, projectId]);

    const tasksByColumn = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = { 'To Do': [], 'In Progress': [], 'Done': [] };
        displayedTasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        });
        return grouped;
    }, [displayedTasks]);

    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        if (draggedTaskId) {
            const task = tasks.find(t => t.id === draggedTaskId);
            if (task && task.status !== status) {
                if (status === 'Done') {
                    setTaskToComplete(task);
                    setIsClosureModalOpen(true);
                } else {
                    onUpdateTask(draggedTaskId, { status, closureComment: undefined, completionTimestamp: undefined });
                }
            }
        }
        setDraggedTaskId(null);
        setDragOverColumn(null);
    };

    const handleConfirmClosure = (closureComment: string) => {
        if (taskToComplete) {
            onUpdateTask(taskToComplete.id, {
                status: 'Done',
                closureComment,
                completionTimestamp: getLondonTimestamp(),
            });
        }
        setIsClosureModalOpen(false);
        setTaskToComplete(null);
    };


    return (
        <div>
            <NewTaskModal
                isOpen={isNewModalOpen}
                user={user}
                onClose={() => setIsNewModalOpen(false)}
                onAddTask={onAddTask}
                projects={isEmbedded ? projects.filter(p => p.id === projectId) : projects}
                employees={employees.filter(e => e.jobProfile !== JobProfile.PersonalAssistant)}
                projectId={projectId}
            />
            <EditTaskModal
                isOpen={!!editingTask}
                user={user}
                onClose={() => setEditingTask(null)}
                task={editingTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                projects={projects}
                employees={employees.filter(e => e.jobProfile !== JobProfile.PersonalAssistant)}
            />
            <TaskClosureModal
                isOpen={isClosureModalOpen}
                onClose={() => {
                    setIsClosureModalOpen(false);
                    setTaskToComplete(null);
                }}
                onConfirm={handleConfirmClosure}
            />
            <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-y-3 gap-x-6 mb-6">
                {!isEmbedded && (
                    <div className="flex items-center gap-3">
                        <TaskBoardIcon className="w-8 h-8 text-slate-400" />
                        <h2 className="text-3xl font-bold">Task Board</h2>
                    </div>
                )}
                <div className={`flex-grow ${isEmbedded ? '' : 'text-right'}`}>
                    <button onClick={() => setIsNewModalOpen(true)} className="inline-flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>
                        <PlusIcon className="w-5 h-5" />
                        New Task
                    </button>
                </div>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-4">
                {COLUMNS.map(column => (
                    <div 
                        key={column.id} 
                        className={`w-80 flex-shrink-0 bg-slate-800 p-3 transition-colors ${dragOverColumn === column.id ? 'bg-slate-700/50' : ''}`} 
                        style={{ borderRadius: 'var(--radius-lg)' }}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        <h3 className="text-lg font-bold px-2 mb-4 flex justify-between items-center">
                            <span>{column.title}</span>
                            <span className="text-sm font-normal bg-slate-700 text-slate-300 rounded-full w-6 h-6 flex items-center justify-center">{tasksByColumn[column.id].length}</span>
                        </h3>
                        <div className="space-y-3 h-full overflow-y-auto min-h-[100px]">
                            {tasksByColumn[column.id].map(task => (
                                <TaskCard 
                                    key={task.id}
                                    task={task}
                                    assignee={assigneeMap.get(task.assigneeId)}
                                    project={projectMap.get(task.projectId)}
                                    onClick={() => setEditingTask(task)}
                                    onDragStart={handleDragStart}
                                />
                            ))}
                            {tasksByColumn[column.id].length === 0 && (
                                <div className="text-center text-slate-500 text-sm py-10">
                                    No tasks here.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};