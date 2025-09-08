import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Project, Employee, User } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { getLondonTimestamp, formatTimestamp } from '../utils';
import { useAuth } from '../contexts/AuthContext';

interface EditTaskModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  task: Task | null;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'companyId' | 'priority'>>) => void;
  onDeleteTask: (taskId: string) => void;
  projects: Project[];
  employees: Employee[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, user, onClose, task, onUpdateTask, onDeleteTask, projects, employees }) => {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const auth = useAuth(); // Get user for formatting dates

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        status: task.status,
        closureComment: task.closureComment,
      });
    }
  }, [task]);

  const availableAssignees = useMemo(() => {
    const selectedProjectId = formData.projectId;
    if (!selectedProjectId) {
        return employees;
    }
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) {
        return employees;
    }
    const projectMemberIds = new Set(selectedProject.employeeIds);
    return employees.filter(e => projectMemberIds.has(e.id));
  }, [formData.projectId, projects, employees]);

  // When project changes, if the current assignee is no longer a valid option, reset it.
  useEffect(() => {
      if (formData.assigneeId && !availableAssignees.some(e => e.id === formData.assigneeId) && formData.assigneeId !== user.id) {
          setFormData(prev => ({ ...prev, assigneeId: '' }));
      }
  }, [availableAssignees, formData.assigneeId, user.id]);

  if (!isOpen || !task) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert("Title is required.");
      return;
    }
    
    const updatesToSave: Partial<Omit<Task, 'id' | 'companyId' | 'priority'>> = {
      title: formData.title,
      description: formData.description,
      projectId: formData.projectId,
      assigneeId: formData.assigneeId,
      dueDate: formData.dueDate || undefined,
      status: formData.status,
      closureComment: formData.closureComment,
    };

    if (formData.status === 'Done' && task.status !== 'Done') {
        if (!formData.closureComment?.trim()) {
            alert('A closure comment is required to complete the task.');
            return;
        }
        updatesToSave.completionTimestamp = getLondonTimestamp();
    } else if (formData.status !== 'Done' && task.status === 'Done') {
        updatesToSave.closureComment = undefined;
        updatesToSave.completionTimestamp = undefined;
    }
    
    onUpdateTask(task.id, updatesToSave);
    onClose();
  };

  const handleDelete = () => {
    setConfirmModalState({
        isOpen: true,
        title: 'Delete Task',
        message: `Are you sure you want to delete the task "${task.title}"?`,
        onConfirm: () => {
            onDeleteTask(task.id);
            onClose(); // This closes the EditTaskModal
        }
    });
  };

  return (
    <>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-slate-800 p-6 w-full max-w-lg border border-slate-700 flex flex-col" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Edit Task</h3>
                    <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
                    <input type="text" name="title" value={formData.title || ''} onChange={handleChange} placeholder="Task Title" required className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }} />
                    <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Task Description" rows={4} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}></textarea>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Project</label>
                            <select name="projectId" value={formData.projectId || ''} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Assignee</label>
                            <select name="assigneeId" value={formData.assigneeId || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}>
                                <option value="">Unassigned</option>
                                {user && <option value={user.id}>{user.name} (Me)</option>}
                                {availableAssignees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-1">Status</label>
                        <select name="status" value={formData.status || 'To Do'} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}>
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-1">Due Date (Optional)</label>
                        <input type="date" name="dueDate" value={formData.dueDate?.split('T')[0] || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }} />
                    </div>

                    {formData.status === 'Done' && (
                        <div>
                            <label htmlFor="closureComment" className="text-sm font-medium text-slate-400 block mb-1">
                                {task.status === 'Done' ? 'Closure Comment' : 'Closure Comment (Required)'}
                            </label>
                            <textarea
                                id="closureComment"
                                name="closureComment"
                                value={formData.closureComment || ''}
                                onChange={handleChange}
                                placeholder="Provide a final summary of the work done..."
                                rows={4}
                                className="w-full bg-slate-700 border border-slate-600 p-2"
                                style={{ borderRadius: 'var(--radius-md)' }}
                                required={task.status !== 'Done'}
                            />
                            {task.completionTimestamp && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Completed on: {formatTimestamp(task.completionTimestamp, auth.user?.settings)}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-4 mt-4 justify-between items-center pt-4 border-t border-slate-700">
                    <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-800/80 hover:bg-red-700/80 flex items-center gap-2" style={{ borderRadius: 'var(--radius-md)' }}>
                        <TrashIcon className="w-5 h-5"/> Delete Task
                    </button>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-md)' }}>Save Changes</button>
                    </div>
                </div>
            </form>
        </div>
    </>
  );
};