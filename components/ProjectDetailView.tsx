import React, { useState } from 'react';
import type { Project, Employee, Task, MeetingMinute, User, AppFile } from '../types';
import { TaskBoard } from './TaskBoard';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TaskBoardIcon } from './icons/TaskBoardIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { useProject } from '../contexts/ProjectContext';
import { ProjectPlanningView } from './ProjectPlanningView';
import { ProjectBudgetView } from './ProjectBudgetView';
import { GanttChartIcon } from './icons/GanttChartIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { FileIcon } from './icons/FileIcon';
import { FileEditorModal } from './FileEditorModal';
import { formatDate } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { CompleteProjectModal } from './CompleteProjectModal';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { FileBrowser } from './FileBrowser';
import { PlusIcon } from './icons/PlusIcon';

interface ProjectDetailViewProps {
  user: User;
  allCompanyEmployees: Employee[];
  allCompanyTasks: Task[];
  allCompanyMeetingMinutes: MeetingMinute[];
  files: AppFile[];
  onBack: () => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'companyId' | 'status' | 'priority'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'companyId' | 'priority'>>) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenChat: (employee: Employee, project: Project) => void;
  onOpenMinute: (minute: MeetingMinute) => void;
  onAddFile: (fileData: Omit<AppFile, 'id'>) => AppFile;
  onUpdateFile: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
  onDeleteFile: (fileId: string) => void;
  onStartMeeting: (project: Project) => void;
  onManageMembers: (project: Project) => void;
  onUpdateProject: (projectId: string, data: Partial<Omit<Project, 'id' | 'companyId'>>) => void;
  onCompleteProject: (project: Project, generateReport: boolean) => void;
  onRequestReview: (fileId: string, reviewerId: string) => void;
  onAddManualMinute: (project: Project) => void;
}

type Tab = 'tasks' | 'planning' | 'budget' | 'members' | 'minutes' | 'files';

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  user,
  allCompanyEmployees,
  allCompanyTasks,
  allCompanyMeetingMinutes,
  files,
  onBack,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onOpenChat,
  onOpenMinute,
  onAddFile,
  onUpdateFile,
  onDeleteFile,
  onStartMeeting,
  onManageMembers,
  onUpdateProject,
  onCompleteProject,
  onRequestReview,
  onAddManualMinute,
}) => {
  const { project } = useProject();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<AppFile | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const { user: authUser } = useAuth();


  const projectMembers = allCompanyEmployees.filter(e => project.employeeIds.includes(e.id));
  const projectTasks = allCompanyTasks.filter(t => t.projectId === project.id);
  const projectMinutes = allCompanyMeetingMinutes
    .filter(m => m.projectId === project.id)
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleOpenFileEditor = (file: AppFile | null) => {
    setEditingFile(file);
    setIsEditorOpen(true);
  };

  const handleSaveFile = ({ fileId, name, content, mimeType }: { fileId: string | null; name: string; content: string; mimeType: string; }) => {
      if (fileId) {
          onUpdateFile(fileId, { name, content, mimeType });
      } else {
          onAddFile({
              companyId: project.companyId,
              parentId: project.id,
              parentType: 'project',
              type: 'file',
              name,
              content,
              mimeType,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'Draft',
              authorId: user.id,
              authorName: user.name,
          });
      }
  };

  const isCompleted = project.status === 'Completed';


  const TabButton: React.FC<{ tab: Tab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${
        activeTab === tab
          ? 'border-b-2 border-[var(--color-primary)] text-white'
          : 'text-slate-400 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <TaskBoard
            user={user}
            companyId={project.companyId}
            tasks={projectTasks}
            employees={allCompanyEmployees}
            projects={[project]}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            isEmbedded={true}
            projectId={project.id}
          />
        );
      case 'planning':
        return <ProjectPlanningView />;
      case 'budget':
        return <ProjectBudgetView />;
      case 'members':
        return (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => onManageMembers(project)}
                disabled={isCompleted}
                className="flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                <UsersIcon className="w-5 h-5" />
                Manage Members
              </button>
            </div>
            <div className="space-y-3">
              {projectMembers.length > 0 ? (
                projectMembers.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-slate-800 p-3 flex items-center justify-between"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold">{emp.name}</p>
                        <p className="text-xs text-[var(--color-primary)]">
                          {emp.jobProfile}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenChat(emp, project)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-sm font-semibold hover:bg-[var(--color-primary-hover)]"
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    >
                      <ChatBubbleIcon className="w-4 h-4" />
                      Chat
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">
                  No members assigned to this project yet.
                </p>
              )}
            </div>
          </div>
        );
      case 'minutes':
        return (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => onAddManualMinute(project)}
                disabled={isCompleted}
                className="flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:bg-slate-700 disabled:text-slate-400"
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                <PlusIcon className="w-5 h-5" />
                New Manual Minute
              </button>
            </div>
            <div className="space-y-2">
              {projectMinutes.length > 0 ? projectMinutes.map(minute => (
                  <button 
                      key={minute.id}
                      onClick={() => onOpenMinute(minute)}
                      className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700" 
                      style={{ borderRadius: 'var(--radius-sm)' }}
                  >
                      <p className="text-xs text-slate-400">{formatDate(minute.timestamp, authUser?.settings)}</p>
                      <p className="font-semibold truncate">{minute.title}</p>
                  </button>
              )) : <p className="text-slate-500 text-sm text-center py-8">No meeting minutes for this project yet.</p>}
            </div>
          </div>
        );
      case 'files':
        return (
            <FileBrowser
                rootId={project.id}
                rootName={project.name}
                companyId={project.companyId}
                allFiles={files}
                employees={allCompanyEmployees}
                onAddFile={onAddFile}
                onUpdateFile={onUpdateFile}
                onDeleteFile={onDeleteFile}
                onOpenFileEditor={handleOpenFileEditor}
                isReadOnly={isCompleted}
                onRequestReview={onRequestReview}
            />
        );
    }
  };

  return (
    <div>
      <FileEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveFile}
          file={editingFile}
          employees={allCompanyEmployees}
          onUpdateFile={onUpdateFile}
          onRequestReview={onRequestReview}
      />
      <CompleteProjectModal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          onConfirm={(generateReport) => {
            onCompleteProject(project, generateReport);
            setIsCompleteModalOpen(false);
          }}
          projectName={project.name}
      />
      <button onClick={onBack} className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] mb-4 font-semibold">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Project List
      </button>
      {isCompleted && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-300 p-4 mb-6 flex items-center gap-3" style={{ borderRadius: 'var(--radius-lg)' }}>
            <CheckBadgeIcon className="w-6 h-6" />
            <div>
                <h3 className="font-bold">Project Completed</h3>
                <p className="text-sm">This project was completed on {formatDate(project.completionTimestamp!, authUser?.settings)}. It is now in read-only mode.</p>
            </div>
        </div>
      )}
      <div className="bg-slate-800 p-6 mb-6" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-3xl font-bold">{project.name}</h2>
              <p className="text-slate-400 mt-1 max-w-3xl">{project.description}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
                <button 
                    onClick={() => onStartMeeting(project)}
                    disabled={projectMembers.length === 0 || isCompleted}
                    className="flex items-center gap-2 bg-[var(--color-primary-subtle-bg)] px-4 py-2 font-semibold text-[var(--color-primary-subtle-text)] hover:bg-[var(--color-primary-subtle-bg-hover)] disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                    style={{ borderRadius: 'var(--radius-md)' }}
                    title={projectMembers.length > 0 ? "Start a brainstorming meeting with project members" : "Assign members to the project to start a meeting"}
                >
                    <UsersIcon className="w-5 h-5"/>
                    Start Meeting
                </button>
                {isCompleted ? (
                    <button
                        onClick={() => onUpdateProject(project.id, { status: 'Active', completionTimestamp: undefined })}
                        className="flex items-center gap-2 bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-500 transition-colors"
                        style={{ borderRadius: 'var(--radius-md)' }}
                    >
                        <ArrowUturnLeftIcon className="w-5 h-5" />
                        Re-open Project
                    </button>
                ) : (
                    <button
                        onClick={() => setIsCompleteModalOpen(true)}
                        className="flex items-center gap-2 bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-500 transition-colors"
                        style={{ borderRadius: 'var(--radius-md)' }}
                    >
                        <CheckBadgeIcon className="w-5 h-5"/>
                        Complete Project
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="border-b border-slate-700 mb-6 flex items-center gap-4 overflow-x-auto">
        <TabButton tab="tasks" label="Tasks" icon={<TaskBoardIcon className="w-5 h-5"/>} />
        <TabButton tab="planning" label="Planning" icon={<GanttChartIcon className="w-5 h-5"/>} />
        <TabButton tab="budget" label="Budget" icon={<CurrencyDollarIcon className="w-5 h-5"/>} />
        <TabButton tab="members" label="Members" icon={<UsersIcon className="w-5 h-5"/>} />
        <TabButton tab="minutes" label="Meeting Minutes" icon={<DocumentDuplicateIcon className="w-5 h-5"/>} />
        <TabButton tab="files" label="Files" icon={<FileIcon className="w-5 h-5"/>} />
      </div>

      <div>
        {renderContent()}
      </div>
    </div>
  );
};