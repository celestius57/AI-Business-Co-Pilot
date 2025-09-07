
import React, { useState } from 'react';
import { Client, Project, AppFile, Employee } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ProjectsIcon } from './icons/ProjectsIcon';
import { FileIcon } from './icons/FileIcon';
import { FileEditorModal } from './FileEditorModal';
import { useAuth } from '../contexts/GoogleAuthContext';
import { FileBrowser } from './FileBrowser';

interface ClientDetailViewProps {
    client: Client;
    projects: Project[];
    files: AppFile[];
    employees: Employee[];
    onBack: () => void;
    onSelectProject: (project: Project) => void;
    onAddProject: (companyId: string, name: string, description: string, clientId?: string) => void;
    onAddFile: (fileData: Omit<AppFile, 'id'>) => AppFile;
    onUpdateFile: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
    onDeleteFile: (fileId: string) => void;
    onRequestReview: (fileId: string, reviewerId: string) => void;
}

type Tab = 'projects' | 'files';

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
    client, projects, files, employees, onBack, onSelectProject, onAddProject,
    onAddFile, onUpdateFile, onDeleteFile, onRequestReview
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('projects');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<AppFile | null>(null);

    // New state for creating a project
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim() || !newProjectDesc.trim()) return;
        onAddProject(client.companyId, newProjectName, newProjectDesc, client.id);
        setIsCreatingProject(false);
        setNewProjectName('');
        setNewProjectDesc('');
    };

    const handleOpenFileEditor = (file: AppFile | null) => {
        setEditingFile(file);
        setIsEditorOpen(true);
    };

    const handleSaveFile = ({ fileId, name, content, mimeType }: { fileId: string | null; name: string; content: string; mimeType: string; }) => {
        if (fileId) {
            onUpdateFile(fileId, { name, content, mimeType });
        } else {
            onAddFile({
                companyId: client.companyId,
                parentId: client.id,
                parentType: 'client',
                type: 'file',
                name,
                content,
                mimeType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
    };

    const TabButton: React.FC<{ tab: Tab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${
                activeTab === tab ? 'border-b-2 border-[var(--color-primary)] text-white' : 'text-slate-400 hover:text-white'
            }`}
        >
            {icon} {label}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'files':
                return (
                    <FileBrowser
                        rootId={client.id}
                        rootName={client.name}
                        companyId={client.companyId}
                        allFiles={files}
                        employees={employees}
                        onAddFile={onAddFile}
                        onUpdateFile={onUpdateFile}
                        onDeleteFile={onDeleteFile}
                        onOpenFileEditor={handleOpenFileEditor}
                        isReadOnly={false}
                        onRequestReview={onRequestReview}
                    />
                );
            case 'projects':
            default:
                return (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setIsCreatingProject(true)} className="flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>
                                <PlusIcon className="w-5 h-5" />
                                New Project
                            </button>
                        </div>
                        <div className="space-y-4">
                            {projects.length > 0 ? projects.map(project => {
                                const projectMembers = employees.filter(e => project.employeeIds.includes(e.id));
                                return (
                                    <div key={project.id} onClick={() => onSelectProject(project)} className="bg-slate-800 p-4 cursor-pointer hover:ring-2 ring-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-md)' }}>
                                        <h4 className="font-bold text-lg">{project.name}</h4>
                                        <p className="text-sm text-slate-400 mt-1 mb-3">{project.description}</p>
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {projectMembers.map(emp => (
                                                <img key={emp.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-800" src={emp.avatarUrl} alt={emp.name} title={emp.name} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            }) : <p className="text-center text-slate-500 py-10">No projects for this client yet.</p>}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div>
            {isCreatingProject && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setIsCreatingProject(false)}>
                    <form onSubmit={handleCreateProject} className="bg-slate-800 p-6 w-full max-w-lg border border-slate-700" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">New Project for {client.name}</h3>
                        <div className="space-y-4">
                            <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project Name" required className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }} />
                            <textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Project Description" required rows={4} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}></textarea>
                        </div>
                        <div className="flex gap-4 mt-4 justify-end">
                            <button type="button" onClick={() => setIsCreatingProject(false)} className="px-4 py-2 bg-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-md)' }}>Create Project</button>
                        </div>
                    </form>
                </div>
            )}
            <FileEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveFile}
                file={editingFile}
                employees={employees}
                onUpdateFile={onUpdateFile}
                onRequestReview={onRequestReview}
            />
            <button onClick={onBack} className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] mb-4 font-semibold">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to All Clients
            </button>
            <div className="bg-slate-800 p-6 mb-6" style={{ borderRadius: 'var(--radius-lg)' }}>
                <h2 className="text-3xl font-bold">{client.name}</h2>
                <p className="text-slate-400 mt-1">{client.contactPerson} - {client.contactEmail}</p>
            </div>
            <div className="border-b border-slate-700 mb-6 flex items-center gap-4">
                <TabButton tab="projects" label="Projects" icon={<ProjectsIcon className="w-5 h-5" />} />
                <TabButton tab="files" label="Files" icon={<FileIcon className="w-5 h-5" />} />
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};
