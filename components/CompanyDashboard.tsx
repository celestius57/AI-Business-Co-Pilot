

import React, { useState, useEffect } from 'react';
import { Company, Team, Employee, HiringProposal, ChatMessage, Project, BrainstormSession, MoveAnalysis, Event, MeetingMinute, Task, User, SoftwareAsset, ProjectPhase, ProjectBudget, ProjectExpense, Department, QuickNote, Client, AppFile, GeneratedDocument, RichTextBlock } from '../types';
import { JobProfile, THEME_COLORS, DEFAULT_COMPANY_DAILY_REQUEST_LIMIT } from '../constants';
import { HiringSpecialist } from './HiringSpecialist';
import { ChatView } from './ChatView';
import { AdminPanel } from './AdminPanel';
import { BrainstormView } from './BrainstormView';
import { CalendarView } from './CalendarView';
import { TaskBoard } from './TaskBoard';
import { AssetManagementView } from './AssetManagementView';
import { DailyBriefingModal } from './DailyBriefingModal';
import { MoraleIndicator } from './MoraleIndicator';
import { MoveEmployeeModal } from './MoveEmployeeModal';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { OrgChartIcon } from './icons/OrgChartIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { CogIcon } from './icons/CogIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TeamIcon } from './icons/departmentIcons';
import { GridViewIcon } from './icons/GridViewIcon';
import { ListViewIcon } from './icons/ListViewIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ProjectsIcon } from './icons/ProjectsIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { getLondonTimestamp, formatTimestamp, formatDate } from '../utils';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { SwitchHorizontalIcon } from './icons/SwitchHorizontalIcon';
import { QuickAccessPanel } from './QuickAccessPanel';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { MeetingMinuteModal } from './MeetingMinuteModal';
import { ManualMinuteModal } from './ManualMinuteModal';
import { TaskBoardIcon } from './icons/TaskBoardIcon';
import { ProjectDetailView } from './ProjectDetailView';
import { ConfirmationModal } from './ConfirmationModal';
import { EventDetailModal } from './EventDetailModal';
import { EditTaskModal } from './EditTaskModal';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { ProjectProvider } from '../contexts/ProjectContext';
import { ApiUsageIndicator } from './ApiUsageIndicator';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { ClientDetailView } from './ClientDetailView';
import { EmployeeProfileModal } from './EmployeeProfileModal';
import { generateProjectCompletionReport } from '../services/geminiService';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { EventCreator } from './EventCreator';

interface CompanyDashboardProps {
  user: User;
  company: Company;
  departments: Department[];
  teams: Team[];
  clients: Client[];
  employees: Employee[];
  projects: Project[];
  brainstormSessions: BrainstormSession[];
  events: Event[];
  meetingMinutes: MeetingMinute[];
  tasks: Task[];
  softwareAssets: SoftwareAsset[];
  personalAssistant: Employee | undefined;
  projectPhases: ProjectPhase[];
  projectBudgets: ProjectBudget[];
  projectExpenses: ProjectExpense[];
  quickNotes: QuickNote[];
  files: AppFile[];
  generatedDocuments: GeneratedDocument[];
  onAddDepartment: (companyId: string, name: string, description?: string) => void;
  onUpdateDepartment: (departmentId: string, data: Partial<Omit<Department, 'id' | 'companyId'>>) => void;
  onDeleteDepartment: (departmentId: string) => void;
  onAddTeam: (companyId: string, name: string, description?: string, icon?: string, departmentId?: string) => void;
  onHireEmployee: (proposal: HiringProposal) => void;
  onFireEmployee: (employeeId: string) => void;
  onMoveEmployee: (employeeId: string, newTeamId: string) => void;
  onSaveChatHistory: (employeeId: string, history: ChatMessage[], contextId: string) => void;
  onUpdateEmployeeMorale: (employeeId: string, change: number) => void;
  onIncrementApiUsage: (companyId: string) => void;
  onUpdateCompany: (companyId: string, data: Partial<Omit<Company, 'id'>>) => void;
  onUpdateTeam: (teamId: string, data: Partial<Omit<Team, 'id' | 'companyId'>>) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddProject: (companyId: string, name: string, description: string, clientId?: string) => void;
  onUpdateProject: (projectId: string, data: Partial<Omit<Project, 'id' | 'companyId'>>) => void;
  onUpdateProjectMembers: (projectId: string, employeeIds: string[]) => void;
  onDeleteProject: (projectId: string) => void;
  onAddBrainstormSession: (sessionData: Omit<BrainstormSession, 'id'>) => BrainstormSession;
  onUpdateBrainstormSession: (session: BrainstormSession) => void;
  onDeleteBrainstormSession: (sessionId: string) => void;
  onAddEvent: (eventData: Omit<Event, 'id'>) => void;
  onUpdateEvent: (eventId: string, eventData: Partial<Omit<Event, 'id'>>) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddMeetingMinute: (minuteData: Omit<MeetingMinute, 'id'>) => void;
  onAddTask: (companyId: string, taskData: Omit<Task, 'id' | 'companyId' | 'status' | 'priority'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'companyId' | 'priority'>>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddAsset: (companyId: string, assetData: Omit<SoftwareAsset, 'id' | 'companyId'>) => void;
  onUpdateAsset: (assetId: string, updates: Partial<Omit<SoftwareAsset, 'id'>>) => void;
  onRemoveAsset: (assetId: string) => void;
  onAddPhase: (data: Omit<ProjectPhase, 'id'>) => void;
  onUpdatePhase: (id: string, data: Partial<Omit<ProjectPhase, 'id'>>) => void;
  onDeletePhase: (id: string) => void;
  onUpdateBudget: (data: ProjectBudget) => void;
  onAddExpense: (data: Omit<ProjectExpense, 'id'>) => void;
  onUpdateExpense: (id: string, data: Partial<Omit<ProjectExpense, 'id'>>) => void;
  onDeleteExpense: (id: string) => void;
  onAddQuickNote: (companyId: string) => void;
  onUpdateQuickNote: (noteId: string, updates: Partial<Omit<QuickNote, 'id' | 'companyId'>>) => void;
  onDeleteQuickNote: (noteId: string) => void;
  onAddFile: (fileData: Omit<AppFile, 'id'>) => AppFile;
  onUpdateFile: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
  onDeleteFile: (fileId: string) => void;
  onAddClient: (companyId: string, clientData: Omit<Client, 'id' | 'companyId'>) => void;
  onUpdateClient: (clientId: string, data: Partial<Omit<Client, 'id' | 'companyId'>>) => void;
  onDeleteClient: (clientId: string) => void;
  onAddGeneratedDocument: (docData: Omit<GeneratedDocument, 'id'>) => GeneratedDocument;
  onRequestReview: (fileId: string, reviewerId: string) => void;
  onBack: () => void;
}

type ViewState = 'dashboard' | 'hiring' | 'admin' | 'clients' | 'internalProjects' | 'groupChats' | 'calendar' | 'tasks' | 'assetManagement';
type OrganigramView = 'card' | 'list';
type ListSortBy = 'team' | 'name';

type ChatContext = { employee: Employee; projectId?: string; project?: Project };

export const CompanyDashboard: React.FC<CompanyDashboardProps> = (props) => {
  const { user, company, departments, teams, clients, employees, projects, brainstormSessions, events, meetingMinutes, tasks, softwareAssets, personalAssistant, onAddDepartment, onUpdateDepartment, onDeleteDepartment, onAddTeam, onHireEmployee, onFireEmployee, onMoveEmployee, onSaveChatHistory, onUpdateEmployeeMorale, onIncrementApiUsage, onUpdateCompany, onUpdateTeam, onDeleteTeam, onAddProject, onUpdateProject, onUpdateProjectMembers, onDeleteProject, onAddBrainstormSession, onUpdateBrainstormSession, onDeleteBrainstormSession, onAddEvent, onUpdateEvent, onDeleteEvent, onAddMeetingMinute, onAddTask, onUpdateTask, onDeleteTask, onAddAsset, onUpdateAsset, onRemoveAsset, onBack, projectPhases, projectBudgets, projectExpenses, onAddPhase, onUpdatePhase, onDeletePhase, onUpdateBudget, onAddExpense, onUpdateExpense, onDeleteExpense, quickNotes, files, onAddQuickNote, onUpdateQuickNote, onDeleteQuickNote, onAddFile, onUpdateFile, onDeleteFile, onAddClient, onUpdateClient, onDeleteClient, generatedDocuments, onAddGeneratedDocument, onRequestReview } = props;
  
  const [viewState, setViewState] = useState<ViewState>('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [organigramView, setOrganigramView] = useState<OrganigramView>('card');
  const [listSortBy, setListSortBy] = useState<ListSortBy>('team');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [collapsedDepartments, setCollapsedDepartments] = useState<Set<string>>(new Set());
  const [selectedBrainstorm, setSelectedBrainstorm] = useState<BrainstormSession | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectClientId, setNewProjectClientId] = useState('');
  
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientData, setNewClientData] = useState<Omit<Client, 'id' | 'companyId'>>({ name: '', contactPerson: '', contactEmail: '', status: 'Active' });

  const [managingMembersOf, setManagingMembersOf] = useState<Project | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const [movingEmployee, setMovingEmployee] = useState<Employee | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);
  const [manualMinuteProject, setManualMinuteProject] = useState<Project | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [creationInitialDate, setCreationInitialDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);

  const uiStyleValues = {
    sharp: {
      '--radius-sm': '0px',
      '--radius-md': '0px',
      '--radius-lg': '0px',
      '--shadow-md': 'none',
      '--shadow-lg': 'none',
    },
    rounded: {
      '--radius-sm': '0.375rem', // rounded-md
      '--radius-md': '0.5rem',   // rounded-lg
      '--radius-lg': '0.75rem',  // rounded-xl
      '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
      '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // shadow-lg
    },
    soft: {
      '--radius-sm': '0.5rem',    // rounded-lg
      '--radius-md': '0.75rem',   // rounded-xl
      '--radius-lg': '1rem',      // rounded-2xl
      '--shadow-md': '0 8px 16px -4px rgb(0 0 0 / 0.1), 0 4px 8px -4px rgb(0 0 0 / 0.1)', // softer shadow
      '--shadow-lg': '0 12px 24px -5px rgb(0 0 0 / 0.1), 0 8px 16px -8px rgb(0 0 0 / 0.1)', // softer shadow
    }
  };

  const { branding } = company;
  const currentUiStyle = uiStyleValues[branding?.uiStyle || 'rounded'];
  const currentFont = branding?.fontFamily || 'Inter, sans-serif';
  const themeColorValue = company.branding?.themeColor || 'indigo';
  const theme = THEME_COLORS.find(t => t.value === themeColorValue) || THEME_COLORS[0];
  
  const dashboardStyles = {
    ...currentUiStyle,
    fontFamily: currentFont,
    '--color-primary': theme.hex,
    '--color-primary-hover': `${theme.hex}d0`,
    '--color-primary-subtle-bg': `${theme.hex}20`,
    '--color-primary-subtle-bg-hover': `${theme.hex}40`,
    '--color-primary-subtle-text': `${theme.hex}b0`,
  } as unknown as React.CSSProperties;


  useEffect(() => {
    const now = Date.now();
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

    if (!company.lastLoginTimestamp || now - company.lastLoginTimestamp > FOUR_HOURS_MS) {
        setIsBriefingOpen(true);
    }
    
    onUpdateCompany(company.id, { lastLoginTimestamp: now });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  useEffect(() => {
    // This effect ensures that if the selected project is updated (e.g., members changed)
    // or deleted from the main projects list, the local state is synchronized.
    if (selectedProject) {
        const updatedProject = projects.find(p => p.id === selectedProject.id);
        if (updatedProject) {
            // A simple stringify check is a performant way to see if the object has changed.
            if (JSON.stringify(updatedProject) !== JSON.stringify(selectedProject)) {
                setSelectedProject(updatedProject);
            }
        } else {
            // The project was deleted, so clear the selection.
            setSelectedProject(null);
        }
    }
  }, [projects, selectedProject]);

  useEffect(() => {
    if (viewState !== 'clients' && viewState !== 'internalProjects') {
      setSelectedProject(null);
    }
    if (viewState !== 'clients') {
        setSelectedClient(null);
    }
  }, [viewState]);

  const handleDeleteProjectClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Prevent card click event from firing
    setConfirmModalState({
        isOpen: true,
        title: 'Delete Project',
        message: 'Are you sure you want to delete this project and all its associated tasks and minutes?\nThis action cannot be undone.',
        onConfirm: () => onDeleteProject(projectId),
    });
  };

  const handleEmployeeHired = (proposal: HiringProposal) => {
    onHireEmployee(proposal);
    setViewState('dashboard');
  }

  const handleFireEmployee = () => {
    if (!selectedEmployee) return;
    setConfirmModalState({
        isOpen: true,
        title: `Fire ${selectedEmployee.name}`,
        message: `Are you sure you want to fire ${selectedEmployee.name}?\nThis action cannot be undone.`,
        onConfirm: () => {
            onFireEmployee(selectedEmployee.id);
            setSelectedEmployee(null); // Return to dashboard
        },
    });
  };
  
  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
        const newSet = new Set(prev);
        if (newSet.has(teamId)) {
            newSet.delete(teamId);
        } else {
            newSet.add(teamId);
        }
        return newSet;
    });
  };
  
  const toggleDepartmentCollapse = (departmentId: string) => {
    setCollapsedDepartments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(departmentId)) {
            newSet.delete(departmentId);
        } else {
            newSet.add(departmentId);
        }
        return newSet;
    });
  };

  const handlePraiseEmployee = (employeeId: string) => {
    onUpdateEmployeeMorale(employeeId, 10);
  };

  const isCompanyApiAvailable = (company: Company): boolean => {
    const limit = company.dailyApiRequestLimit || 0;
    const lastRequestDate = new Date(company.lastApiRequestTimestamp || 0).toDateString();
    const nowDateString = new Date().toDateString();

    const isNewDay = lastRequestDate !== nowDateString;
    return isNewDay || (company.apiRequestCount || 0) < limit;
  };

  const handleInteractWithEmployee = (employeeId: string) => {
    onIncrementApiUsage(company.id);
    onUpdateEmployeeMorale(employeeId, -1);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectDesc.trim()) return;
    onAddProject(company.id, newProjectName, newProjectDesc, newProjectClientId || undefined);
    setIsCreatingProject(false);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectClientId('');
  };
  
  const handleCreateClient = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newClientData.name.trim()) return;
      onAddClient(company.id, newClientData);
      setIsCreatingClient(false);
      setNewClientData({ name: '', contactPerson: '', contactEmail: '', status: 'Active' });
  };


  const openMemberManager = (project: Project) => {
    setManagingMembersOf(project);
    setSelectedMembers(new Set(project.employeeIds));
  };
  
  const closeMemberManager = () => {
    setManagingMembersOf(null);
    setSelectedMembers(new Set());
  };

  const handleToggleMember = (employeeId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleSaveMembers = () => {
    if (managingMembersOf) {
      onUpdateProjectMembers(managingMembersOf.id, Array.from(selectedMembers));
      closeMemberManager();
    }
  };

  const handleRemoveProjectMember = (projectId: string, employeeId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const updatedMemberIds = project.employeeIds.filter(id => id !== employeeId);
    onUpdateProjectMembers(projectId, updatedMemberIds);
  };
  
  const findOrCreateBrainstormSession = (contextType: 'team' | 'project', contextObject: Team | Project) => {
    const existingSession = brainstormSessions.find(s => s.contextType === contextType && s.contextId === contextObject.id);
    if (existingSession) {
      setSelectedBrainstorm(existingSession);
      return;
    }
    
    let participantIds: string[];
    if (contextType === 'team') {
      participantIds = employees.filter(e => e.teamId === contextObject.id && e.jobProfile !== JobProfile.PersonalAssistant).map(e => e.id);
    } else {
      participantIds = (contextObject as Project).employeeIds;
    }

    if (personalAssistant && !participantIds.includes(personalAssistant.id)) {
        participantIds.push(personalAssistant.id);
    }
    
    const isProjectMeeting = contextType === 'project';

    const newSessionData: Omit<BrainstormSession, 'id'> = {
        companyId: company.id,
        topic: isProjectMeeting ? `Meeting: ${contextObject.name}` : `Brainstorm: ${contextObject.name}`,
        description: isProjectMeeting ? `A meeting for the project: ${contextObject.name}` : `A discussion with the ${contextObject.name} team.`,
        participantIds: participantIds,
        history: [],
        contextType,
        contextId: contextObject.id,
        lastActivity: new Date().toISOString()
    };
    
    const newSession = onAddBrainstormSession(newSessionData);
    setSelectedBrainstorm(newSession);
  };

  const handleJoinMeeting = (event: Event) => {
    const existingSession = brainstormSessions.find(s => s.eventId === event.id);

    if (existingSession) {
        setSelectedBrainstorm(existingSession);
        return;
    }

    const participantIds = [...new Set([...event.participantIds, personalAssistant?.id].filter(Boolean) as string[])];

    let contextType: 'project' | 'meeting' = 'meeting';
    let contextId: string = event.id;
    if (event.projectId) {
        contextType = 'project';
        contextId = event.projectId;
    }
    
    const newSessionData: Omit<BrainstormSession, 'id'> = {
        companyId: company.id,
        topic: `Meeting: ${event.title}`,
        description: event.description || `A meeting about "${event.title}"`,
        participantIds: participantIds,
        history: [],
        contextType: contextType,
        contextId: contextId,
        lastActivity: new Date().toISOString(),
        eventId: event.id,
    };

    const newSession = onAddBrainstormSession(newSessionData);
    setSelectedBrainstorm(newSession);
    setViewingEvent(null); // Close the detail modal if it's open
  };

  const handleConfirmMove = (
    employeeId: string,
    newTeamId: string,
    analysis: MoveAnalysis | null,
    acceptedSuggestions: { source?: { name?: string; description?: string; }, destination?: { name?: string; description?: string; }}
  ) => {
    onMoveEmployee(employeeId, newTeamId);
    
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    const sourceTeamId = employee.teamId;

    if (sourceTeamId && acceptedSuggestions.source) {
      const { name, description } = acceptedSuggestions.source;
      const originalTeam = teams.find(t => t.id === sourceTeamId);
      if (originalTeam) {
          onUpdateTeam(sourceTeamId, { 
              name: name || originalTeam.name, 
              description: description || originalTeam.description 
          });
      }
    }

    if (acceptedSuggestions.destination) {
        const { name, description } = acceptedSuggestions.destination;
        const originalTeam = teams.find(t => t.id === newTeamId);
        if (originalTeam) {
            onUpdateTeam(newTeamId, {
                name: name || originalTeam.name,
                description: description || originalTeam.description
            });
        }
    }
    
    setMovingEmployee(null);
  };

  const handleCompleteProject = async (projectToComplete: Project, generateReport: boolean) => {
    if (generateReport) {
        onIncrementApiUsage(company.id);
        const relevantPhases = projectPhases.filter(p => p.projectId === projectToComplete.id);
        const relevantBudget = projectBudgets.find(b => b.projectId === projectToComplete.id) || null;
        const relevantExpenses = projectExpenses.filter(e => e.projectId === projectToComplete.id);
        const relevantTasks = tasks.filter(t => t.projectId === projectToComplete.id);
        const relevantMinutes = meetingMinutes.filter(m => m.projectId === projectToComplete.id);
        try {
            const reportContent = await generateProjectCompletionReport(
                projectToComplete, relevantPhases, relevantBudget, relevantExpenses, relevantTasks, relevantMinutes
            );
            
            onAddFile({
                companyId: projectToComplete.companyId,
                parentId: projectToComplete.id,
                parentType: 'project',
                type: 'file',
                name: `Project Completion Report - ${projectToComplete.name}.md`,
                content: JSON.stringify(reportContent),
                mimeType: 'application/json', // Using JSON to store our RichTextBlock[] structure
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Failed to generate project report", e);
            alert("Sorry, the AI was unable to generate the final project report. The project will be completed without it.");
        }
    }

    onUpdateProject(projectToComplete.id, {
        status: 'Completed',
        completionTimestamp: new Date().toISOString()
    });
};

  
  const isApiAvailableForCompany = isCompanyApiAvailable(company);

  const renderMainContent = () => {
    if (isCreatingEvent || editingEvent) {
        return <EventCreator
            companyId={company.id}
            employees={employees}
            projects={projects}
            clients={clients}
            onAddEvent={(data) => { onAddEvent(data); setIsCreatingEvent(false); }}
            onUpdateEvent={(id, data) => { onUpdateEvent(id, data); setEditingEvent(null); }}
            onDeleteEvent={(id) => { onDeleteEvent(id); setEditingEvent(null); }}
            onBack={() => { setIsCreatingEvent(false); setEditingEvent(null); }}
            initialDate={creationInitialDate ?? undefined}
            eventToEdit={editingEvent}
        />
    }

    if (chatContext) {
      const currentEmployee = employees.find(e => e.id === chatContext.employee.id);
      const currentProject = chatContext.project ? projects.find(p => p.id === chatContext.project.id) : undefined;

      // If employee or project was deleted, exit chat
      if (!currentEmployee || (chatContext.project && !currentProject)) {
        setChatContext(null);
        return renderDashboardSubView();
      }
      
      let relevantFiles: AppFile[] = [];
      if (currentProject) {
          // Files for the project
          relevantFiles.push(...files.filter(f => f.parentType === 'project' && f.parentId === currentProject.id));
          
          // Files for the client, if any
          if (currentProject.clientId) {
              relevantFiles.push(...files.filter(f => f.parentType === 'client' && f.parentId === currentProject.clientId));
          }
      }

      const chatViewComponent = (
        <ChatView
          company={company}
          employee={currentEmployee} // Pass the fresh employee object
          employees={employees}
          teams={teams}
          project={currentProject} // Pass the fresh project object
          projects={projects}
          clients={clients}
          meetingMinutes={meetingMinutes.filter(m => m.projectId === chatContext.projectId)}
          allMeetingMinutes={meetingMinutes}
          allEvents={events}
          allTasks={tasks}
          files={relevantFiles}
          generatedDocuments={generatedDocuments}
          isApiAvailable={isApiAvailableForCompany}
          onBack={() => setChatContext(null)}
          onSaveHistory={(history, contextId) => onSaveChatHistory(currentEmployee.id, history, contextId)}
          onPraise={handlePraiseEmployee}
          onInteract={handleInteractWithEmployee}
          onAddEvent={onAddEvent}
          onAddTask={(taskData) => onAddTask(company.id, taskData)}
          onAddFile={onAddFile}
          onUpdateFile={onUpdateFile}
          onAddGeneratedDocument={onAddGeneratedDocument}
        />
      );

      if (currentProject) { // Use the fresh project object here
        return (
          <ProjectProvider
            user={user}
            project={currentProject}
            allPhases={projectPhases}
            allBudgets={projectBudgets}
            allExpenses={projectExpenses}
            rawAddPhase={onAddPhase}
            rawUpdatePhase={onUpdatePhase}
            rawDeletePhase={onDeletePhase}
            rawUpdateBudget={onUpdateBudget}
            rawAddExpense={onAddExpense}
            rawUpdateExpense={onUpdateExpense}
            rawDeleteExpense={onDeleteExpense}
          >
            {chatViewComponent}
          </ProjectProvider>
        );
      }
      return chatViewComponent;
    }

    if (selectedBrainstorm) {
      let relevantFiles: AppFile[] = [];
      if (selectedBrainstorm.contextType === 'project') {
          const project = projects.find(p => p.id === selectedBrainstorm.contextId);
          if (project) {
              relevantFiles.push(...files.filter(f => f.parentType === 'project' && f.parentId === project.id));
              if (project.clientId) {
                  relevantFiles.push(...files.filter(f => f.parentType === 'client' && f.parentId === project.clientId));
              }
          }
      }
      return (
        <BrainstormView
          company={company}
          participants={employees.filter(e => selectedBrainstorm.participantIds.includes(e.id))}
          session={selectedBrainstorm}
          meetingMinutes={meetingMinutes.filter(m => m.projectId === selectedBrainstorm.contextId)}
          projects={projects}
          generatedDocuments={generatedDocuments}
          files={relevantFiles}
          onSaveHistory={onUpdateBrainstormSession}
          onAddMeetingMinute={onAddMeetingMinute}
          onBack={() => setSelectedBrainstorm(null)}
          onIncrementApiUsage={() => onIncrementApiUsage(company.id)}
          isApiAvailable={isApiAvailableForCompany}
          onAddFile={onAddFile}
          onUpdateFile={onUpdateFile}
          onAddGeneratedDocument={onAddGeneratedDocument}
          companyApiLimit={company.dailyApiRequestLimit || 0}
        />
      );
    }
    
    if (selectedProject) {
        return (
            <ProjectProvider
                user={user}
                project={selectedProject}
                allPhases={projectPhases}
                allBudgets={projectBudgets}
                allExpenses={projectExpenses}
                rawAddPhase={onAddPhase}
                rawUpdatePhase={onUpdatePhase}
                rawDeletePhase={onDeletePhase}
                rawUpdateBudget={onUpdateBudget}
                rawAddExpense={onAddExpense}
                rawUpdateExpense={onUpdateExpense}
                rawDeleteExpense={onDeleteExpense}
            >
                <ProjectDetailView
                    user={user}
                    allCompanyEmployees={employees}
                    allCompanyTasks={tasks}
                    allCompanyMeetingMinutes={meetingMinutes}
                    files={files}
                    onBack={() => setSelectedProject(null)}
                    onAddTask={(taskData) => onAddTask(company.id, taskData)}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onOpenChat={(employee, project) => setChatContext({ employee, projectId: project.id, project })}
                    onOpenMinute={setSelectedMinute}
                    onAddFile={onAddFile}
                    onUpdateFile={onUpdateFile}
                    onDeleteFile={onDeleteFile}
                    onStartMeeting={(project) => findOrCreateBrainstormSession('project', project)}
                    onManageMembers={openMemberManager}
                    onUpdateProject={onUpdateProject}
                    onCompleteProject={handleCompleteProject}
                    onRequestReview={onRequestReview}
                    onAddManualMinute={(project) => setManualMinuteProject(project)}
                />
            </ProjectProvider>
        );
    }

    if (selectedClient) {
        return (
          <ClientDetailView
            client={selectedClient}
            projects={projects.filter(p => p.clientId === selectedClient.id)}
            files={files}
            employees={employees}
            onBack={() => setSelectedClient(null)}
            onSelectProject={setSelectedProject}
            onAddProject={onAddProject}
            onAddFile={onAddFile}
            onUpdateFile={onUpdateFile}
            onDeleteFile={onDeleteFile}
            onRequestReview={onRequestReview}
          />
        );
    }

    if (viewState === 'hiring') {
      return (
        <HiringSpecialist
          company={company}
          teams={teams}
          employees={employees}
          clients={clients}
          onHire={handleEmployeeHired}
        />
      );
    }

    if (viewState === 'admin') {
      return (
        <AdminPanel
          company={company}
          departments={departments}
          teams={teams}
          clients={clients}
          onUpdateCompany={onUpdateCompany}
          onAddDepartment={onAddDepartment}
          onUpdateDepartment={onUpdateDepartment}
          onDeleteDepartment={onDeleteDepartment}
          onAddTeam={onAddTeam}
          onUpdateTeam={onUpdateTeam}
          onDeleteTeam={onDeleteTeam}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
          onBack={() => setViewState('dashboard')}
        />
      );
    }

    return renderDashboardSubView();
  };

  const renderDashboardSubView = () => {
    switch (viewState) {
      case 'assetManagement':
        return <AssetManagementView
                  companyId={company.id}
                  employees={employees}
                  softwareAssets={softwareAssets}
                  onAddAsset={(data) => onAddAsset(company.id, data)}
                  onUpdateAsset={onUpdateAsset}
                  onRemoveAsset={onRemoveAsset}
                />;
      case 'tasks':
        return <TaskBoard 
                  user={user}
                  companyId={company.id}
                  tasks={tasks}
                  employees={employees}
                  projects={projects}
                  onAddTask={(taskData) => onAddTask(company.id, taskData)}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                />;
      case 'calendar':
        return <CalendarView 
                  events={events}
                  employees={employees}
                  teams={teams}
                  clients={clients}
                  projects={projects}
                  onViewEvent={setViewingEvent}
                  onStartCreateEvent={(date) => {
                      setCreationInitialDate(date);
                      setIsCreatingEvent(true);
                  }}
                />;
      case 'groupChats':
        return (
             <div>
                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-y-3 gap-x-6 mb-6">
                    <div className="flex items-center gap-3">
                        <ChatBubbleLeftRightIcon className="w-8 h-8 text-slate-400" />
                        <h2 className="text-3xl font-bold">Group Chats</h2>
                    </div>
                </div>
                <div className="space-y-4">
                    {brainstormSessions.length === 0 ? (
                         <p className="text-center text-slate-500 py-10">No group chats yet. Start one from a team or project card.</p>
                    ) : (
                        brainstormSessions.sort((a,b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()).map(session => {
                            const sessionParticipants = employees.filter(e => session.participantIds.includes(e.id));
                            return (
                                <div key={session.id} className="bg-slate-800 p-4 group" style={{ borderRadius: 'var(--radius-lg)' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold">{session.topic}</h3>
                                            <p className="text-sm text-slate-400">{session.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2 overflow-hidden ml-auto">
                                                {sessionParticipants.slice(0, 5).map(emp => (
                                                    <img key={emp.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-800" src={emp.avatarUrl} alt={emp.name} title={emp.name} />
                                                ))}
                                            </div>
                                            <button onClick={() => setSelectedBrainstorm(session)} className="bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)]" style={{ borderRadius: 'var(--radius-md)' }}>
                                                Open
                                            </button>
                                            <button 
                                                onClick={() => setConfirmModalState({
                                                    isOpen: true,
                                                    title: 'Delete Group Chat',
                                                    message: `Are you sure you want to delete the group chat "${session.topic}"?`,
                                                    onConfirm: () => onDeleteBrainstormSession(session.id),
                                                })} 
                                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        );
        case 'clients':
            return (
              <div>
                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-y-3 gap-x-6 mb-6">
                    <div className="flex items-center gap-3">
                        <BriefcaseIcon className="w-8 h-8 text-slate-400" />
                        <h2 className="text-3xl font-bold">Clients</h2>
                    </div>
                    <button onClick={() => setIsCreatingClient(true)} className="flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>
                        <PlusIcon className="w-5 h-5" />
                        New Client
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {clients.map(client => {
                    const clientProjects = projects.filter(p => p.clientId === client.id);
                    return (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className="bg-slate-800 p-6 hover:bg-slate-700/70 transition-colors cursor-pointer"
                        style={{ borderRadius: 'var(--radius-lg)' }}
                      >
                        <h3 className="text-xl font-bold">{client.name}</h3>
                        <p className={`text-sm font-semibold mt-1 ${client.status === 'Active' ? 'text-green-400' : 'text-slate-400'}`}>{client.status}</p>
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <p className="text-sm text-slate-300">{clientProjects.length} Active Project(s)</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
        case 'internalProjects':
            const activeProjects = projects.filter(p => !p.clientId && p.status === 'Active');
            const completedProjects = projects.filter(p => !p.clientId && p.status === 'Completed');
            const projectsToShow = showCompletedProjects ? completedProjects : activeProjects;

            return (
                <div>
                    <div>
                        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-y-3 gap-x-6 mb-6">
                            <div className="flex items-center gap-3">
                                <ProjectsIcon className="w-8 h-8 text-slate-400" />
                                <h2 className="text-3xl font-bold">Internal Projects</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                {completedProjects.length > 0 &&
                                    <button
                                        onClick={() => setShowCompletedProjects(!showCompletedProjects)}
                                        className="px-3 py-1.5 border border-slate-600 text-sm font-semibold hover:bg-slate-700" style={{ borderRadius: 'var(--radius-md)' }}
                                    >
                                        {showCompletedProjects ? 'Show Active' : `Show Completed (${completedProjects.length})`}
                                    </button>
                                }
                                <button onClick={() => setIsCreatingProject(true)} className="flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>
                                    <PlusIcon className="w-5 h-5" />
                                    New Project
                                </button>
                            </div>
                        </div>

                        {isCreatingProject && (
                            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setIsCreatingProject(false)}>
                                <form onSubmit={handleCreateProject} className="bg-slate-800 p-6 w-full max-w-lg border border-slate-700" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                                    <h3 className="text-xl font-bold mb-4">Create New Project</h3>
                                    <div className="space-y-4">
                                        <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project Name" required className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }} />
                                        <textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Project Description" required rows={4} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}></textarea>
                                        <select value={newProjectClientId} onChange={e => setNewProjectClientId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}>
                                            <option value="">No Client (Internal Project)</option>
                                            {clients.map(client => (
                                                <option key={client.id} value={client.id}>{client.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-4 mt-4 justify-end">
                                        <button type="button" onClick={() => setIsCreatingProject(false)} className="px-4 py-2 bg-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-md)' }}>Create</button>
                                    </div>
                                </form>
                            </div>
                        )}
                        
                        <div className="space-y-6">
                            {projectsToShow.length === 0 ? (
                                <p className="text-center text-slate-500 py-10">{showCompletedProjects ? 'No completed internal projects.' : 'No active internal projects.'}</p>
                            ) : (
                                projectsToShow.map(project => {
                                    const projectMembers = employees.filter(e => project.employeeIds.includes(e.id));
                                    const projectTasks = tasks.filter(t => t.projectId === project.id);
                                    const projectMinutes = meetingMinutes.filter(m => m.projectId === project.id);
                                    const projectClient = clients.find(c => c.id === project.clientId);
                                    const activeTasksCount = projectTasks.filter(t => t.status !== 'Done').length;
                                    const activeFilesCount = files.filter(f => f.parentType === 'project' && f.parentId === project.id && !f.isArchived).length;

                                    return (
                                        <div
                                            key={project.id}
                                            className={`relative group w-full text-left bg-slate-800 p-6 hover:bg-slate-700/70 transition-colors cursor-pointer hover:ring-2 ring-[var(--color-primary)] ${project.status === 'Completed' ? 'opacity-70' : ''}`}
                                            style={{ borderRadius: 'var(--radius-lg)' }}
                                            onClick={() => setSelectedProject(project)}
                                        >
                                            {project.status === 'Completed' && (
                                                <div className="absolute top-4 left-4 bg-green-500/20 text-green-300 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
                                                    <CheckBadgeIcon className="w-4 h-4" />
                                                    Completed
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => handleDeleteProjectClick(e, project.id)}
                                                className="absolute top-4 right-4 p-2 bg-red-800/60 rounded-full text-red-300 opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity z-10"
                                                aria-label={`Delete project ${project.name}`}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-grow">
                                                    <h3 className="text-xl font-bold">{project.name}</h3>
                                                    {projectClient && (
                                                        <p className="text-sm font-semibold text-indigo-400 mt-1">{projectClient.name}</p>
                                                    )}
                                                    <p className="text-slate-400 mt-1 mb-4 max-w-2xl">{project.description}</p>
                                                    <h4 className="font-bold mb-2 mt-4 text-slate-300">Project Members ({projectMembers.length})</h4>
                                                    <div className="flex -space-x-2 overflow-hidden">
                                                        {projectMembers.slice(0, 10).map(emp => (
                                                            <img key={emp.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-800" src={emp.avatarUrl} alt={emp.name} title={emp.name} />
                                                        ))}
                                                        {projectMembers.length > 10 && (
                                                            <div className="flex items-center justify-center w-8 h-8 text-xs font-medium text-white bg-slate-700 border-2 border-slate-900 rounded-full">+{projectMembers.length - 10}</div>
                                                        )}
                                                         {projectMembers.length === 0 && <p className="text-sm text-slate-500">No members.</p>}
                                                    </div>
                                                </div>
                                                <div className="md:w-1/4 md:border-l md:border-slate-700 md:pl-6 flex-shrink-0 grid grid-cols-2 gap-4 text-center">
                                                    <div>
                                                        <p className="text-2xl font-bold">{activeTasksCount}</p>
                                                        <p className="text-sm text-slate-400">Active Tasks</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold">{activeFilesCount}</p>
                                                        <p className="text-sm text-slate-400">Active Files</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-2xl font-bold">{projectMinutes.length}</p>
                                                        <p className="text-sm text-slate-400">Meeting Minutes</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            );
      case 'dashboard':
      default:
        const groupedByDepartment = departments.reduce((acc, dept) => {
            acc[dept.id] = { department: dept, teams: [] };
            return acc;
        }, {} as Record<string, { department: Department, teams: Team[] }>);

        const unassignedTeams: Team[] = [];

        teams.forEach(team => {
            if (team.departmentId && groupedByDepartment[team.departmentId]) {
                groupedByDepartment[team.departmentId].teams.push(team);
            } else {
                unassignedTeams.push(team);
            }
        });

        const departmentOrder = Object.values(groupedByDepartment).filter(group => group.teams.length > 0);
        if (unassignedTeams.length > 0) {
            const unassignedDept: Department = { id: 'unassigned', companyId: company.id, name: 'General Teams', description: 'Teams not assigned to a specific department.' };
            departmentOrder.push({ 
                department: unassignedDept,
                teams: unassignedTeams 
            });
        }

        return (
            <div>
                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-start gap-y-3 gap-x-6 mb-6">
                    <div className="flex items-center gap-3">
                        <OrgChartIcon className="w-8 h-8 text-slate-400" />
                        <h2 className="text-3xl font-bold">Company Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-800 p-1" style={{ borderRadius: 'var(--radius-md)' }}>
                            <button 
                                onClick={() => setOrganigramView('card')}
                                className={`px-3 py-1 text-sm font-semibold flex items-center gap-2 transition-colors ${organigramView === 'card' ? 'bg-[var(--color-primary)] text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                aria-label="Card View"
                                style={{ borderRadius: 'var(--radius-sm)' }}
                            >
                                <GridViewIcon className="w-4 h-4" />
                                Card View
                            </button>
                            <button 
                                onClick={() => setOrganigramView('list')}
                                className={`px-3 py-1 text-sm font-semibold flex items-center gap-2 transition-colors ${organigramView === 'list' ? 'bg-[var(--color-primary)] text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                aria-label="List View"
                                style={{ borderRadius: 'var(--radius-sm)' }}
                            >
                                <ListViewIcon className="w-4 h-4" />
                                List View
                            </button>
                        </div>
                        {organigramView === 'list' && (
                            <div className="relative">
                                <select
                                    id="list-sort"
                                    value={listSortBy}
                                    onChange={(e) => setListSortBy(e.target.value as ListSortBy)}
                                    className="bg-slate-800 p-1.5 text-sm font-semibold text-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none appearance-none pr-8 cursor-pointer"
                                    style={{ 
                                        borderRadius: 'var(--radius-md)',
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                                        backgroundPosition: 'right 0.5rem center', 
                                        backgroundRepeat: 'no-repeat', 
                                        backgroundSize: '1.5em 1.5em' 
                                    }}
                                >
                                    <option value="team">Sort by Team</option>
                                    <option value="name">Sort by Name</option>
                                </select>
                                <label htmlFor="list-sort" className="sr-only">Sort employees by</label>
                            </div>
                        )}
                    </div>
                </div>

                {organigramView === 'card' ? (
                     <div className="space-y-8">
                        {departmentOrder.map(({ department, teams: departmentTeams }) => {
                            const isCollapsed = collapsedDepartments.has(department.id);
                            return (
                                <section key={department.id}>
                                    <button
                                        onClick={() => toggleDepartmentCollapse(department.id)}
                                        className="w-full text-left p-2 hover:bg-slate-800/50 rounded-lg"
                                        aria-expanded={!isCollapsed}
                                    >
                                        <div className="pb-2 border-b-2 border-slate-700 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                                    <BuildingIcon className="w-6 h-6 text-slate-500" />
                                                    {department.name}
                                                </h3>
                                                {department.description && <p className="text-slate-400 mt-1 pl-9">{department.description}</p>}
                                            </div>
                                            <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isCollapsed ? '-rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    {!isCollapsed && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4 animate-fade-in">
                                            {departmentTeams.map(team => {
                                                const teamEmployees = employees.filter(emp => emp.teamId === team.id && emp.jobProfile !== JobProfile.PersonalAssistant);
                                                return (
                                                    <div key={team.id} className="bg-slate-800 p-6 flex flex-col" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <TeamIcon iconName={team.icon} className="w-6 h-6 text-[var(--color-primary)]"/>
                                                                <h3 className="text-xl font-bold">{team.name}</h3>
                                                            </div>
                                                        </div>
                                                        {team.description && <p className="text-sm text-slate-400 mb-4 border-l-2 border-[var(--color-primary)]/50 pl-3">{team.description}</p>}
                                                        <button 
                                                            onClick={() => findOrCreateBrainstormSession('team', team)}
                                                            disabled={teamEmployees.length === 0}
                                                            className="w-full flex items-center justify-center gap-2 mb-4 p-2 bg-[var(--color-primary-subtle-bg)] hover:bg-[var(--color-primary-subtle-bg-hover)] text-[var(--color-primary-subtle-text)] font-semibold disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                                                            title="Brainstorm with Team"
                                                            style={{ borderRadius: 'var(--radius-sm)' }}
                                                        >
                                                            <UsersIcon className="w-5 h-5" />
                                                            Brainstorm with Team
                                                        </button>
                                                        <div className="space-y-3 flex-grow">
                                                            {teamEmployees.length > 0 ? teamEmployees.map(emp => {
                                                                return (
                                                                    <div key={emp.id} className="bg-slate-900/70 p-3 border border-slate-700" style={{ borderRadius: 'var(--radius-md)' }}>
                                                                        <div className="flex items-start gap-3">
                                                                            <img src={emp.avatarUrl} alt={emp.name} className="w-10 h-10 rounded-full bg-slate-700 shrink-0"/>
                                                                            <div className="flex-1">
                                                                                <h4 className="font-bold text-white text-sm">{emp.name}</h4>
                                                                                <p className="text-xs text-[var(--color-primary)]/80 mb-2">{emp.jobProfile}</p>
                                                                                <MoraleIndicator morale={emp.morale} />
                                                                                <div className="mt-2 space-y-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <button 
                                                                                            onClick={() => setSelectedEmployee(emp)} 
                                                                                            className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 font-semibold"
                                                                                            style={{ borderRadius: 'var(--radius-sm)' }}
                                                                                        >
                                                                                            Profile
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={() => setChatContext({ employee: emp })} 
                                                                                            disabled={!isApiAvailableForCompany}
                                                                                            className="flex-1 text-xs px-2 py-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] font-semibold flex items-center justify-center gap-1.5 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
                                                                                            style={{ borderRadius: 'var(--radius-sm)' }}
                                                                                        >
                                                                                            <ChatBubbleIcon className="w-3 h-3" />
                                                                                            {isApiAvailableForCompany ? 'Chat' : 'Resting'}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }) : (
                                                                <div className="flex items-center justify-center h-full">
                                                                    <p className="text-slate-500 text-center py-4 text-sm">No employees yet.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            )
                        })}
                    </div>
                ) : ( // List View
                    listSortBy === 'team' ? (
                        <div className="space-y-8">
                           {departmentOrder.map(({ department, teams: departmentTeams }) => {
                                const isCollapsed = collapsedDepartments.has(department.id);
                                return (
                                <section key={department.id}>
                                    <button
                                        onClick={() => toggleDepartmentCollapse(department.id)}
                                        className="w-full text-left p-2 hover:bg-slate-800/50 rounded-lg"
                                        aria-expanded={!isCollapsed}
                                    >
                                        <div className="pb-2 border-b-2 border-slate-700 flex justify-between items-center">
                                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                                <BuildingIcon className="w-6 h-6 text-slate-500" />
                                                {department.name}
                                            </h3>
                                            <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isCollapsed ? '-rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    {!isCollapsed && (
                                        <div className="space-y-4 mt-4 animate-fade-in">
                                            {departmentTeams.map(team => {
                                                const teamEmployees = employees.filter(emp => emp.teamId === team.id && emp.jobProfile !== JobProfile.PersonalAssistant);
                                                const isExpanded = expandedTeams.has(team.id);
                                                return (
                                                    <div key={team.id} className="bg-slate-800 transition-all duration-300" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
                                                        <button 
                                                            onClick={() => toggleTeamExpansion(team.id)}
                                                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50"
                                                            style={{ borderRadius: 'var(--radius-lg)' }}
                                                            aria-expanded={isExpanded}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <TeamIcon iconName={team.icon} className="w-8 h-8 text-[var(--color-primary)]"/>
                                                                <div>
                                                                    <h3 className="text-xl font-bold">{team.name}</h3>
                                                                    <p className="text-sm text-slate-400">{teamEmployees.length} employee{teamEmployees.length !== 1 ? 's' : ''}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); findOrCreateBrainstormSession('team', team); }}
                                                                    disabled={teamEmployees.length === 0}
                                                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[var(--color-primary-subtle-bg)] hover:bg-[var(--color-primary-subtle-bg-hover)] text-[var(--color-primary-subtle-text)] font-semibold disabled:bg-slate-700/50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    title="Brainstorm with Team"
                                                                    style={{ borderRadius: 'var(--radius-sm)' }}
                                                                >
                                                                    <UsersIcon className="w-4 h-4" />
                                                                    Brainstorm
                                                                </button>
                                                                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                        </button>
                                                        {isExpanded && (
                                                            <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
                                                                {team.description && <p className="text-sm text-slate-400 my-4 border-l-2 border-[var(--color-primary)]/50 pl-3">{team.description}</p>}
                                                                <div className="space-y-3">
                                                                    {teamEmployees.length > 0 ? teamEmployees.map(emp => {
                                                                        return (
                                                                            <div key={emp.id} className="bg-slate-900/70 p-3 border border-slate-700 flex items-center justify-between gap-4" style={{ borderRadius: 'var(--radius-md)' }}>
                                                                                <div className="flex items-center gap-3 flex-1">
                                                                                    <img src={emp.avatarUrl} alt={emp.name} className="w-10 h-10 rounded-full bg-slate-700 shrink-0"/>
                                                                                    <div className="flex-1">
                                                                                        <h4 className="font-bold text-white text-sm">{emp.name}</h4>
                                                                                        <p className="text-xs text-[var(--color-primary)]/80 mb-2">{emp.jobProfile}</p>
                                                                                        <MoraleIndicator morale={emp.morale} />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 shrink-0">
                                                                                    <button onClick={() => setSelectedEmployee(emp)} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 font-semibold" style={{ borderRadius: 'var(--radius-sm)' }}>
                                                                                        Profile
                                                                                    </button>
                                                                                    <button onClick={() => setChatContext({ employee: emp })} disabled={!isApiAvailableForCompany} className="text-xs px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] font-semibold flex items-center justify-center gap-1.5 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed">
                                                                                        <ChatBubbleIcon className="w-3 h-3" />
                                                                                        {isApiAvailableForCompany ? 'Chat' : 'Resting'}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    }) : (
                                                                        <p className="text-slate-500 text-center py-4 text-sm">No employees in this team.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            )})}
                        </div>
                    ) : ( // Sort by Name
                        <div className="space-y-3 bg-slate-800 p-4" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
                            {employees
                                .filter(emp => emp.jobProfile !== JobProfile.PersonalAssistant)
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(emp => {
                                    const team = teams.find(d => d.id === emp.teamId);
                                    return (
                                        <div key={emp.id} className="bg-slate-900/70 p-3 border border-slate-700 flex items-center justify-between gap-4" style={{ borderRadius: 'var(--radius-md)' }}>
                                            <div className="flex items-center gap-3 flex-1">
                                                <img src={emp.avatarUrl} alt={emp.name} className="w-10 h-10 rounded-full bg-slate-700 shrink-0"/>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white text-sm">{emp.name}</h4>
                                                    <p className="text-xs text-[var(--color-primary)]/80 mb-2">{emp.jobProfile}</p>
                                                    <MoraleIndicator morale={emp.morale} />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 text-sm text-slate-400 shrink-0 w-48">
                                                {team && <TeamIcon iconName={team.icon} className="w-4 h-4" />}
                                                <span>{team?.name || 'Unassigned'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button onClick={() => setSelectedEmployee(emp)} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 font-semibold" style={{ borderRadius: 'var(--radius-sm)' }}>
                                                    Profile
                                                </button>
                                                <button onClick={() => setChatContext({ employee: emp })} disabled={!isApiAvailableForCompany} className="text-xs px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] font-semibold flex items-center justify-center gap-1.5 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed">
                                                    <ChatBubbleIcon className="w-3 h-3" />
                                                    {isApiAvailableForCompany ? 'Chat' : 'Resting'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )
                )}
            </div>
        )
    }
  }

  const isImmersiveView = !!chatContext || !!selectedBrainstorm || !!selectedProject || !!selectedClient || isCreatingEvent || editingEvent;
  const teamForSelectedEmployee = selectedEmployee ? teams.find(t => t.id === selectedEmployee.teamId) : undefined;

  return (
    <div className="w-full h-full" style={dashboardStyles}>
        {managingMembersOf && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={closeMemberManager}>
                <div className="bg-slate-800 p-6 w-full max-w-lg border border-slate-700 flex flex-col" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4">Manage Members for {managingMembersOf.name}</h3>
                    <div className="space-y-2 overflow-y-auto max-h-96 pr-2">
                        {employees
                        .filter(e => e.jobProfile !== JobProfile.PersonalAssistant)
                        .map(emp => (
                            <label key={emp.id} className="flex items-center gap-3 p-2 bg-slate-900/50 cursor-pointer hover:bg-slate-700" style={{ borderRadius: 'var(--radius-md)' }}>
                                <input type="checkbox" checked={selectedMembers.has(emp.id)} onChange={() => handleToggleMember(emp.id)} className="h-5 w-5 rounded bg-slate-700 border border-slate-600 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"/>
                                <img src={emp.avatarUrl} alt={emp.name} className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="font-semibold">{emp.name}</p>
                                    <p className="text-xs text-slate-400">{emp.jobProfile}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-4 justify-end pt-4 border-t border-slate-700">
                        <button type="button" onClick={closeMemberManager} className="px-4 py-2 bg-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
                        <button type="button" onClick={handleSaveMembers} className="px-4 py-2 bg-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-md)' }}>Save Members</button>
                    </div>
                </div>
            </div>
        )}
        {isCreatingClient && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setIsCreatingClient(false)}>
              <form onSubmit={handleCreateClient} className="bg-slate-800 p-6 w-full max-w-lg border border-slate-700" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Create New Client</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Client Name" value={newClientData.name} onChange={e => setNewClientData(prev => ({ ...prev, name: e.target.value }))} required className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }} />
                  <input type="text" placeholder="Contact Person (Optional)" value={newClientData.contactPerson} onChange={e => setNewClientData(prev => ({ ...prev, contactPerson: e.target.value }))} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }} />
                  <input type="email" placeholder="Contact Email (Optional)" value={newClientData.contactEmail} onChange={e => setNewClientData(prev => ({ ...prev, contactEmail: e.target.value }))} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }} />
                  <select value={newClientData.status} onChange={e => setNewClientData(prev => ({ ...prev, status: e.target.value as Client['status'] }))} className="w-full bg-slate-700 border border-slate-600 p-2" style={{ borderRadius: 'var(--radius-md)' }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Prospect">Prospect</option>
                  </select>
                </div>
                <div className="flex gap-4 mt-4 justify-end">
                  <button type="button" onClick={() => setIsCreatingClient(false)} className="px-4 py-2 bg-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-md)' }}>Create</button>
                </div>
              </form>
            </div>
          )}
        <EmployeeProfileModal
            isOpen={!!selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            employee={selectedEmployee}
            team={teamForSelectedEmployee}
            onFire={handleFireEmployee}
            onMove={() => {
                if (selectedEmployee) {
                    setMovingEmployee(selectedEmployee);
                    setSelectedEmployee(null);
                }
            }}
            files={files}
        />
        <ManualMinuteModal 
            isOpen={!!manualMinuteProject} 
            project={manualMinuteProject!} 
            onClose={() => setManualMinuteProject(null)} 
            onAddMinute={onAddMeetingMinute} 
        />
        <MeetingMinuteModal 
            isOpen={!!selectedMinute} 
            minute={selectedMinute} 
            onClose={() => setSelectedMinute(null)} 
        />
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
        <EventDetailModal
            isOpen={!!viewingEvent}
            onClose={() => setViewingEvent(null)}
            event={viewingEvent}
            employees={employees}
            onEdit={(event) => {
                setViewingEvent(null);
                setEditingEvent(event);
            }}
            onJoinMeeting={handleJoinMeeting}
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
        <DailyBriefingModal
            isOpen={isBriefingOpen}
            onClose={() => setIsBriefingOpen(false)}
            companyName={company.name}
            assistant={personalAssistant}
            teams={teams}
            employees={employees}
        />
        {movingEmployee && (
            <MoveEmployeeModal 
                isOpen={true}
                company={company}
                teams={teams}
                employees={employees}
                employeeToMove={movingEmployee}
                onClose={() => setMovingEmployee(null)}
                onConfirmMove={handleConfirmMove}
            />
        )}
        
        <div className={`flex flex-col lg:flex-row gap-6 ${isImmersiveView ? 'h-full' : ''}`}>
            {/* Left Sidebar */}
            {!isImmersiveView && (
                <aside className="lg:w-64 xl:w-72 space-y-6 shrink-0">
                    <button onClick={onBack} className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-semibold w-full">
                        <ArrowLeftIcon className="w-5 h-5" />
                        Back to Companies
                    </button>
                    
                    <div className="bg-slate-800/50 p-4 text-center" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
                        <div className="bg-slate-700/50 p-3 inline-block mb-2" style={{ borderRadius: 'var(--radius-md)' }}>
                        {company.branding?.logo ? (
                            <img src={company.branding.logo} alt={`${company.name} logo`} className="w-8 h-8 object-contain"/>
                        ) : (
                            <BuildingIcon className="w-8 h-8 text-[var(--color-primary)]" />
                        )}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                        <p className="text-slate-400 mt-1 text-sm">Company Dashboard</p>
                    </div>

                    {personalAssistant && (
                        <div className="bg-slate-800 p-4 space-y-3" style={{ borderRadius: 'var(--radius-lg)' }}>
                            <h2 className="text-sm font-bold text-slate-300 text-center">Personal Assistant</h2>
                            <div className="flex items-center gap-3">
                                <img src={personalAssistant.avatarUrl} alt={personalAssistant.name} className="w-10 h-10 rounded-full bg-slate-700 shrink-0"/>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold">{personalAssistant.name.split(' ')[0]}</h3>
                                    <p className="text-xs text-[var(--color-primary)]/80 mb-1">{personalAssistant.jobProfile}</p>
                                    <MoraleIndicator morale={personalAssistant.morale} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setSelectedEmployee(personalAssistant)} 
                                    className="text-sm px-3 py-2 bg-slate-700 hover:bg-slate-600 font-semibold"
                                    style={{ borderRadius: 'var(--radius-md)' }}
                                    title="View Alex's Profile"
                                >
                                    <UserCircleIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setChatContext({ employee: personalAssistant })} 
                                    className="flex-1 text-sm py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] font-semibold flex items-center justify-center gap-1.5"
                                    style={{ borderRadius: 'var(--radius-md)' }}
                                >
                                    <ChatBubbleIcon className="w-4 h-4" />
                                    Chat with Alex
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-800 p-4 space-y-3" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <h2 className="text-sm font-bold text-slate-300 text-center">Company-Wide API Usage</h2>
                        <ApiUsageIndicator currentUsage={company.apiRequestCount || 0} limit={company.dailyApiRequestLimit || 0} />
                    </div>
                    
                    <div className="bg-slate-800 p-4 space-y-3" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <button onClick={() => setViewState('dashboard')} className={`w-full flex items-center gap-3 p-3 transition-colors ${viewState === 'dashboard' ? 'bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)]' : 'hover:bg-slate-700/50'}`} style={{ borderRadius: 'var(--radius-md)' }}>
                            <OrgChartIcon className="w-6 h-6"/>
                            <h2 className="text-md font-bold">Dashboard</h2>
                        </button>
                        <button onClick={() => setViewState('clients')} className={`w-full flex items-center gap-3 p-3 transition-colors ${viewState === 'clients' ? 'bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)]' : 'hover:bg-slate-700/50'}`} style={{ borderRadius: 'var(--radius-md)' }}>
                            <BriefcaseIcon className="w-6 h-6"/>
                            <h2 className="text-md font-bold">Clients</h2>
                        </button>
                        <button onClick={() => setViewState('internalProjects')} className={`w-full flex items-center gap-3 p-3 transition-colors ${viewState === 'internalProjects' ? 'bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)]' : 'hover:bg-slate-700/50'}`} style={{ borderRadius: 'var(--radius-md)' }}>
                            <ProjectsIcon className="w-6 h-6"/>
                            <h2 className="text-md font-bold">Internal Projects</h2>
                        </button>
                        <button onClick={() => setViewState('tasks')} className={`w-full flex items-center gap-3 p-3 transition-colors ${viewState === 'tasks' ? 'bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)]' : 'hover:bg-slate-700/50'}`} style={{ borderRadius: 'var(--radius-md)' }}>
                            <TaskBoardIcon className="w-6 h-6"/>
                            <h2 className="text-md font-bold">Task Board</h2>
                        </button>
                        <button onClick={() => setViewState('groupChats')} className={`w-full flex items-center gap-3 p-3 transition-colors ${viewState === 'groupChats' ? 'bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)]' : 'hover:bg-slate-700/50'}`} style={{ borderRadius: 'var(--radius-md)' }}>
                            <ChatBubbleLeftRightIcon className="w-6 h-6"/>
                            <h2 className="text-md font-bold">Group Chats</h2>
                        </button>
                        <button onClick={() => setViewState('calendar')} className={`w-full flex items-center gap-3 p-3 transition-colors ${viewState === 'calendar' ? 'bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)]' : 'hover:bg-slate-700/50'}`} style={{ borderRadius: 'var(--radius-md)' }}>
                            <CalendarIcon className="w-6 h-6 "/>
                            <h2 className="text-md font-bold">Calendar</h2>
                        </button>
                        <button 
                            onClick={() => setViewState('assetManagement')} 
                            title="Manage Software Assets"
                            className={`w-full flex items-center gap-3 p-3 transition-colors ${viewState === 'assetManagement' ? 'bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)]' : 'hover:bg-slate-700/50'}`} 
                            style={{ borderRadius: 'var(--radius-md)' }}
                        >
                            <DatabaseIcon className="w-6 h-6"/>
                            <h2 className="text-md font-bold">Asset Management</h2>
                        </button>
                    </div>

                    <div className="bg-slate-800 p-4 space-y-3" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <button onClick={() => setViewState('hiring')} className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary-subtle-bg)] border border-[var(--color-primary)]/50 px-4 py-3 font-semibold text-[var(--color-primary-subtle-text)] hover:bg-[var(--color-primary-subtle-bg-hover)] hover:text-white transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>
                            <SparklesIcon className="w-5 h-5"/>
                            <span>Hire with AI</span>
                        </button>
                        <button onClick={() => setViewState('admin')} className="w-full flex items-center justify-center gap-2 bg-slate-700/50 px-4 py-3 font-semibold text-slate-300 hover:bg-slate-600 hover:text-white transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>
                            <CogIcon className="w-5 h-5"/>
                            <span>Company Settings</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                {renderMainContent()}
            </main>

            {/* Quick Access Panel */}
            <QuickAccessPanel 
                events={events} 
                employees={employees} 
                tasks={tasks} 
                quickNotes={quickNotes}
                onViewEvent={setViewingEvent} 
                onViewTask={setEditingTask}
                onJoinMeeting={handleJoinMeeting}
                onAddQuickNote={() => onAddQuickNote(company.id)}
                onUpdateQuickNote={onUpdateQuickNote}
                onDeleteQuickNote={onDeleteQuickNote}
            />
        </div>
    </div>
  );
};