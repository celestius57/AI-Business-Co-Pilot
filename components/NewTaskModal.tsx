import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Project, Employee, User } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface NewTaskModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'companyId' | 'status' | 'priority'>) => void;
  projects: Project[];
  employees: Employee[];
  projectId?: string;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, user, onClose, onAddTask, projects, employees, projectId: propProjectId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(propProjectId || '');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) {
        setTitle('');
        setDescription('');
        setProjectId(propProjectId || '');
        setAssigneeId('');
        setDueDate('');
    }
  }, [isOpen, propProjectId]);

  const availableAssignees = useMemo(() => {
    if (!projectId) {
      // If no project is selected, show all employees.
      return employees;
    }
    const selectedProject = projects.find(p => p.id === projectId);
    if (!selectedProject) {
      // Should not happen if projectId is valid, but as a fallback
      return employees;
    }
    const projectMemberIds = new Set(selectedProject.employeeIds);
    return employees.filter(e => projectMemberIds.has(e.id));
  }, [projectId, projects, employees]);

  // When project changes, if the current assignee is no longer a valid option, reset it.
  useEffect(() => {
      if (assigneeId && !availableAssignees.some(e => e.id === assigneeId) && assigneeId !== user.id) {
          setAssigneeId('');
      }
  }, [availableAssignees, assigneeId, user.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) {
      alert("Please fill in Title and Project.");
      return;
    }
    onAddTask({ 
      title, 
      description, 
      projectId, 
      assigneeId, 
      dueDate: dueDate || undefined 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 w-full max-w-lg border border-slate-700 flex flex-col" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">New Task</h3>
                <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task Title" required className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }} />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Task Description" rows={4} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}></textarea>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-1">Project</label>
                        <select value={projectId} onChange={e => setProjectId(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 p-2 disabled:bg-slate-700/50 disabled:cursor-not-allowed" style={{ borderRadius: 'var(--radius-md)' }} disabled={!!propProjectId}>
                            <option value="" disabled>Select Project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-1">Assignee</label>
                        <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}>
                            <option value="">Unassigned</option>
                            {user && <option value={user.id}>{user.name} (Me)</option>}
                            {availableAssignees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-400 block mb-1">Due Date (Optional)</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }} />
                </div>
            </div>
            <div className="flex gap-4 mt-4 justify-end pt-4 border-t border-slate-700">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-md)' }}>Create Task</button>
            </div>
        </form>
    </div>
  );
};
