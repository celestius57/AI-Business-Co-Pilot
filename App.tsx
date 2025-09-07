
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Company, Team, Employee, HiringProposal, InitialStructureProposal, ChatMessage, Project, BrainstormSession, Event, User, MeetingMinute, Task, SoftwareAsset, ProjectPhase, ProjectBudget, ProjectExpense, Department, QuickNote, Client, AppFile, GeneratedDocument, Notification } from './types';
import { JobProfile, DEFAULT_BRANDING, DEFAULT_COMPANY_DAILY_REQUEST_LIMIT, DEFAULT_GLOBAL_API_REQUEST_LIMIT } from './constants';
import { CompanyCreator } from './components/CompanyCreator';
import { CompanyDashboard } from './components/CompanyDashboard';
import { DeleteCompanyModal } from './components/DeleteCompanyModal';
import { BuildingIcon } from './components/icons/BuildingIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { ExportIcon } from './components/icons/ExportIcon';
import { ImportIcon } from './components/icons/ImportIcon';
import { generateRandomOceanProfile, generateAvatarUrl, calculateTaskPriority } from './utils';
import { getIconForTeamName } from './components/icons/departmentIcons';
import { useAuth } from './contexts/GoogleAuthContext';
import { AuthHeader } from './components/AuthHeader';
import { Footer } from './components/Footer';
import { ApiSettingsPage } from './components/ApiSettingsPage';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { InfoIcon } from './components/icons/InfoIcon';
import { PencilIcon } from './components/icons/PencilIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { XMarkIcon } from './components/icons/XMarkIcon';

type View = 'list' | 'create_company' | 'dashboard' | 'api_settings';

const App: React.FC = () => {
  const { user, isInitialized, updateUser } = useAuth();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [brainstormSessions, setBrainstormSessions] = useState<BrainstormSession[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>([]);
  const [projectBudgets, setProjectBudgets] = useState<ProjectBudget[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [files, setFiles] = useState<AppFile[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);


  const [view, setView] = useState<View>('list');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingRpdCompanyId, setEditingRpdCompanyId] = useState<string | null>(null);
  const [rpdInputValue, setRpdInputValue] = useState<string>('');

  // Load data from localStorage when user ID changes (on login/logout)
  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setDepartments([]);
      setTeams([]);
      setEmployees([]);
      setProjects([]);
      setClients([]);
      setBrainstormSessions([]);
      setEvents([]);
      setMeetingMinutes([]);
      setTasks([]);
      setSoftwareAssets([]);
      setProjectPhases([]);
      setProjectBudgets([]);
      setProjectExpenses([]);
      setQuickNotes([]);
      setFiles([]);
      setGeneratedDocuments([]);
      setNotifications([]);
      return;
    }
    const loadData = (key: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
      try {
        let saved = localStorage.getItem(`${key}_${user.id}`);

        if (saved) {
            let parsed = JSON.parse(saved);
            // Handle data migrations for older data structures
            if (key === 'companies') {
                parsed = parsed.map((c: any) => {
                    if (c.apiRequestCount === undefined) {
                        c.apiRequestCount = 0;
                    }
                    if (c.lastApiRequestTimestamp === undefined) {
                        c.lastApiRequestTimestamp = Date.now();
                    }
                    return c;
                });
            }
            if (key === 'projects') {
                parsed = parsed.map((p: any) => ({
                    ...p,
                    status: p.status || 'Active', // Add status if it doesn't exist
                }));
            }
            if (key === 'employees') {
                parsed = parsed.map((emp: any) => {
                    if (emp.chatHistory && !emp.chatHistories) {
                        emp.chatHistories = { general: emp.chatHistory };
                        delete emp.chatHistory;
                    }
                    if (!emp.chatHistories) {
                        emp.chatHistories = { general: [] };
                    }
                    if (emp.departmentId && !emp.teamId) {
                        emp.teamId = emp.departmentId;
                        delete emp.departmentId;
                    }
                    delete emp.apiRequestCount;
                    delete emp.lastApiRequestTimestamp;
                    return emp;
                });
            }
            setter(parsed);
        } else {
            setter([]);
        }
      } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        setter([]);
      }
    };
    loadData('companies', setCompanies);
    loadData('departments', setDepartments);
    loadData('teams', setTeams);
    loadData('employees', setEmployees);
    loadData('projects', setProjects);
    loadData('clients', setClients);
    loadData('brainstormSessions', setBrainstormSessions);
    loadData('events', setEvents);
    loadData('meetingMinutes', setMeetingMinutes);
    loadData('tasks', setTasks);
    loadData('softwareAssets', setSoftwareAssets);
    loadData('projectPhases', setProjectPhases);
    loadData('projectBudgets', setProjectBudgets);
    loadData('projectExpenses', setProjectExpenses);
    loadData('quickNotes', setQuickNotes);
    loadData('files', setFiles);
    loadData('generatedDocuments', setGeneratedDocuments);
    loadData('notifications', setNotifications);
  }, [user?.id]);

  // Save data to localStorage when it changes
  useEffect(() => { if (user) { localStorage.setItem(`companies_${user.id}`, JSON.stringify(companies)); } }, [companies, user]);
  useEffect(() => { if (user) { localStorage.setItem(`departments_${user.id}`, JSON.stringify(departments)); } }, [departments, user]);
  useEffect(() => { if (user) { localStorage.setItem(`teams_${user.id}`, JSON.stringify(teams)); } }, [teams, user]);
  useEffect(() => { if (user) { localStorage.setItem(`employees_${user.id}`, JSON.stringify(employees)); } }, [employees, user]);
  useEffect(() => { if (user) { localStorage.setItem(`projects_${user.id}`, JSON.stringify(projects)); } }, [projects, user]);
  useEffect(() => { if (user) { localStorage.setItem(`clients_${user.id}`, JSON.stringify(clients)); } }, [clients, user]);
  useEffect(() => { if (user) { localStorage.setItem(`brainstormSessions_${user.id}`, JSON.stringify(brainstormSessions)); } }, [brainstormSessions, user]);
  useEffect(() => { if (user) { localStorage.setItem(`events_${user.id}`, JSON.stringify(events)); } }, [events, user]);
  useEffect(() => { if (user) { localStorage.setItem(`meetingMinutes_${user.id}`, JSON.stringify(meetingMinutes)); } }, [meetingMinutes, user]);
  useEffect(() => { if (user) { localStorage.setItem(`tasks_${user.id}`, JSON.stringify(tasks)); } }, [tasks, user]);
  useEffect(() => { if (user) { localStorage.setItem(`softwareAssets_${user.id}`, JSON.stringify(softwareAssets)); } }, [softwareAssets, user]);
  useEffect(() => { if (user) { localStorage.setItem(`projectPhases_${user.id}`, JSON.stringify(projectPhases)); } }, [projectPhases, user]);
  useEffect(() => { if (user) { localStorage.setItem(`projectBudgets_${user.id}`, JSON.stringify(projectBudgets)); } }, [projectBudgets, user]);
  useEffect(() => { if (user) { localStorage.setItem(`projectExpenses_${user.id}`, JSON.stringify(projectExpenses)); } }, [projectExpenses, user]);
  useEffect(() => { if (user) { localStorage.setItem(`quickNotes_${user.id}`, JSON.stringify(quickNotes)); } }, [quickNotes, user]);
  useEffect(() => { if (user) { localStorage.setItem(`files_${user.id}`, JSON.stringify(files)); } }, [files, user]);
  useEffect(() => { if (user) { localStorage.setItem(`generatedDocuments_${user.id}`, JSON.stringify(generatedDocuments)); } }, [generatedDocuments, user]);
  useEffect(() => { if (user) { localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications)); } }, [notifications, user]);

  // Notification Generation
  useEffect(() => {
      if (!user) return;

      const checkNotifications = () => {
          const now = new Date();
          const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);
          const userSettings = user.settings?.notificationSettings;
          
          const settings = {
              eventStart: userSettings?.eventStart ?? true,
              reminder: userSettings?.reminder ?? true,
              taskDueDate: userSettings?.taskDueDate ?? true,
          };
          
          let newNotifications: Notification[] = [];

          // 1. Check for upcoming events and reminders
          if (settings.eventStart || settings.reminder) {
              const userEvents = events.filter(e => e.participantIds.includes(user.id));

              userEvents.forEach(event => {
                  const eventStart = new Date(event.start);
                  const notificationId = `notif_event_${event.id}`;
                  const isMeeting = event.type === 'meeting' && settings.eventStart;
                  const isReminder = event.type === 'reminder' && settings.reminder;

                  if ((isMeeting || isReminder) &&
                      eventStart > now &&
                      eventStart <= fifteenMinsFromNow &&
                      !notifications.some(n => n.id === notificationId) &&
                      !newNotifications.some(n => n.id === notificationId)
                  ) {
                      newNotifications.push({
                          id: notificationId,
                          userId: user.id,
                          message: `${event.type === 'meeting' ? 'Meeting' : 'Reminder'}: "${event.title}" is starting soon.`,
                          timestamp: new Date().toISOString(),
                          read: false,
                          link: { type: 'event', id: event.id }
                      });
                  }
              });
          }

          // 2. Check for tasks due today
          if (settings.taskDueDate) {
              const userTasks = tasks.filter(t => t.assigneeId === user.id);

              userTasks.forEach(task => {
                  if (task.dueDate) {
                      const dueDate = new Date(task.dueDate);
                      const notificationId = `notif_task_${task.id}`;
                      
                      const isDueToday = dueDate.getFullYear() === now.getFullYear() &&
                                         dueDate.getMonth() === now.getMonth() &&
                                         dueDate.getDate() === now.getDate();

                      if (isDueToday &&
                          task.status !== 'Done' &&
                          !notifications.some(n => n.id === notificationId) &&
                          !newNotifications.some(n => n.id === notificationId)
                      ) {
                           newNotifications.push({
                              id: notificationId,
                              userId: user.id,
                              message: `Task due today: "${task.title}"`,
                              timestamp: new Date().toISOString(),
                              read: false,
                              link: { type: 'task', id: task.id }
                          });
                      }
                  }
              });
          }
          
          if (newNotifications.length > 0) {
              setNotifications(prev => [...prev, ...newNotifications]);
          }
      };

      // Run once on load, then every minute
      checkNotifications();
      const intervalId = setInterval(checkNotifications, 60 * 1000); 

      return () => clearInterval(intervalId);
  }, [user, events, tasks, notifications]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const handleMarkAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const handleClearAll = () => {
      setNotifications([]);
  };

  const addCompany = useCallback((companyData: Omit<Company, 'id'>, initialStructure: InitialStructureProposal) => {
    const globalRpdLimit = user?.settings?.globalApiRequestLimit || DEFAULT_GLOBAL_API_REQUEST_LIMIT;
    const totalAssignedRpd = companies.reduce((sum, c) => sum + (c.dailyApiRequestLimit || 0), 0);
    const rpdLeft = globalRpdLimit - totalAssignedRpd;
    const limitForNewCompany = rpdLeft > 0 ? rpdLeft : 0;

    let assignedLimit = DEFAULT_COMPANY_DAILY_REQUEST_LIMIT;
    if (rpdLeft < DEFAULT_COMPANY_DAILY_REQUEST_LIMIT) {
        assignedLimit = limitForNewCompany;
        alert(`Warning: Only ${limitForNewCompany} requests remaining in your global pool. This new company will be assigned ${limitForNewCompany} daily requests instead of the default ${DEFAULT_COMPANY_DAILY_REQUEST_LIMIT}.`);
    }
    
    const newCompany: Company = { 
      ...companyData, 
      id: `comp_${Date.now()}`,
      objectives: '',
      policies: '',
      certifications: '',
      branding: DEFAULT_BRANDING,
      dailyApiRequestLimit: assignedLimit,
      apiRequestCount: 0,
      lastApiRequestTimestamp: Date.now(),
    };
    
    const newTeams: Team[] = [];
    const newEmployees: Employee[] = [];

    // Create the default Personal Assistant employee "Alex"
    const assistantSystemInstruction = `You are "Alex", a highly efficient Personal Assistant for ${newCompany.name}. Your primary duties are to assist the user with managing the company and its employees.

- You have access to a complete roster of all employees in the company.
- If the user asks for help with a specific task (e.g., "Who can help me design a new logo?"), analyze the roster and recommend the most suitable employee based on their job profile.
- If no current employee is a good fit, you must recommend hiring a new one by suggesting the user use the "Hire with AI" feature.
- You can also assist with basic tasks like calendar management and setting reminders.
- You should be proactive, polite, and concise.
- Company Profile context: "${newCompany.profile}"`;

    const assistantGenders: Employee['gender'][] = ['Male', 'Female'];
    const assistantGender = assistantGenders[Math.floor(Math.random() * assistantGenders.length)];
    const assistantEmployee: Employee = {
        id: `emp_${newCompany.id}_pa`,
        name: 'Alex',
        jobProfile: JobProfile.PersonalAssistant,
        teamId: '', // Will be assigned later
        systemInstruction: assistantSystemInstruction,
        gender: assistantGender,
        avatarUrl: generateAvatarUrl('Alex', assistantGender),
        oceanProfile: generateRandomOceanProfile(),
        chatHistories: { general: [] },
        morale: 75,
    };

    let assistantTeamId = '';

    // Process the approved structure from the proposal
    initialStructure.teams.forEach(teamProposal => {
        const newTeam: Team = {
            id: `team_${Date.now()}_${teamProposal.name.replace(/\s+/g, '')}`,
            companyId: newCompany.id,
            name: teamProposal.name,
            description: teamProposal.description,
            icon: getIconForTeamName(teamProposal.name),
        };
        newTeams.push(newTeam);

        // Assign assistant to the first team
        if (!assistantTeamId) {
            assistantTeamId = newTeam.id;
        }

        teamProposal.employees.forEach(empProposal => {
            const avatarUrl = generateAvatarUrl(empProposal.name, empProposal.gender);

            const newEmp: Employee = {
                id: `emp_${Date.now()}_${empProposal.name.replace(/\s+/g, '')}`,
                name: empProposal.name,
                jobProfile: empProposal.jobProfile,
                teamId: newTeam.id,
                systemInstruction: empProposal.systemInstruction,
                gender: empProposal.gender,
                avatarUrl,
                oceanProfile: empProposal.oceanProfile,
                chatHistories: { general: [] },
                morale: 75,
            };
            newEmployees.push(newEmp);
        });
    });

    // If no teams were selected, create a default "General" team for Alex.
    if (!assistantTeamId && newTeams.length === 0) {
        const generalTeam: Team = { id: `team_${newCompany.id}_general`, companyId: newCompany.id, name: 'General', description: 'Default team for company operations.', icon: 'default' };
        newTeams.push(generalTeam);
        assistantTeamId = generalTeam.id;
    } else if (!assistantTeamId) {
        assistantTeamId = newTeams[0].id;
    }


    assistantEmployee.teamId = assistantTeamId;
    newEmployees.unshift(assistantEmployee); // Add Alex to the start of the employee list

    setCompanies(prev => [...prev, newCompany]);
    setTeams(prev => [...prev, ...newTeams]);
    setEmployees(prev => [...prev, ...newEmployees]);
    setView('list');
  }, [user, companies]);

  const updateCompany = useCallback((companyId: string, data: Partial<Omit<Company, 'id'>>) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, ...data } : c));
  }, []);

  const addDepartment = useCallback((companyId: string, name: string, description?: string) => {
    const newDepartment: Department = {
        id: `dept_${Date.now()}`,
        companyId,
        name,
        description,
    };
    setDepartments(prev => [...prev, newDepartment]);
  }, []);

  const updateDepartment = useCallback((departmentId: string, data: Partial<Omit<Department, 'id' | 'companyId'>>) => {
      setDepartments(prev => prev.map(d => d.id === departmentId ? { ...d, ...data } : d));
  }, []);

  const deleteDepartment = useCallback((departmentId: string) => {
      setDepartments(prev => prev.filter(d => d.id !== departmentId));
      // Unassign teams from the deleted department
      setTeams(prev => prev.map(t => t.departmentId === departmentId ? { ...t, departmentId: undefined } : t));
  }, []);

  const addTeam = useCallback((companyId: string, name: string, description?: string, icon?: string, departmentId?: string) => {
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      companyId,
      name,
      description,
      icon: icon || 'default',
      departmentId,
    };
    setTeams(prev => [...prev, newTeam]);
  }, []);

  const updateTeam = useCallback((teamId: string, data: Partial<Omit<Team, 'id' | 'companyId'>>) => {
      setTeams(prev => prev.map(d => d.id === teamId ? { ...d, ...data } : d));
  }, []);
  
  const deleteTeam = useCallback((teamId: string) => {
      setTeams(prev => prev.filter(d => d.id !== teamId));
      // Also remove employees in that team
      setEmployees(prev => prev.map(e => e.teamId === teamId ? {...e, teamId: undefined} : e));
  }, []);

  const addEmployee = useCallback((employeeData: Omit<Employee, 'id'>) => {
    const newEmployee = { ...employeeData, id: `emp_${Date.now()}` };
    setEmployees(prev => [...prev, newEmployee]);
  }, []);

  const fireEmployee = useCallback((employeeId: string) => {
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
    // Also remove employee from any projects they were in
    setProjects(prev => prev.map(p => ({
        ...p,
        employeeIds: p.employeeIds.filter(id => id !== employeeId),
    })));
    // And from brainstorm sessions
    setBrainstormSessions(prev => prev.map(s => ({
        ...s,
        participantIds: s.participantIds.filter(id => id !== employeeId)
    })));
    // Unassign tasks from the fired employee
    setTasks(prev => prev.map(t => t.assigneeId === employeeId ? { ...t, assigneeId: '' } : t));
  }, []);

  const moveEmployee = useCallback((employeeId: string, newTeamId: string) => {
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, teamId: newTeamId } : e));
  }, []);
  
  const hireEmployee = useCallback((proposal: HiringProposal) => {
    if (!selectedCompanyId) return;

    let team = teams.find(d => 
        d.name.toLowerCase() === proposal.teamName.toLowerCase() && d.companyId === selectedCompanyId
    );

    let finalTeamId;

    if (team) {
        finalTeamId = team.id;
    } else {
        const newTeam: Team = {
            id: `team_${Date.now()}`,
            companyId: selectedCompanyId,
            name: proposal.teamName,
            description: proposal.teamDescription || "Auto-generated by AI HR Specialist.",
            icon: getIconForTeamName(proposal.teamName),
        };
        setTeams(prev => [...prev, newTeam]);
        finalTeamId = newTeam.id;
    }
    
    const avatarUrl = generateAvatarUrl(proposal.employeeName, proposal.gender);

    const newEmployee: Omit<Employee, 'id'> = {
        name: proposal.employeeName,
        jobProfile: proposal.jobProfile,
        teamId: finalTeamId,
        systemInstruction: proposal.systemInstruction,
        gender: proposal.gender,
        avatarUrl,
        oceanProfile: proposal.oceanProfile,
        chatHistories: { general: [] },
        morale: 75,
    };

    addEmployee(newEmployee);
  }, [selectedCompanyId, teams, addEmployee]);

  const handleUpdateEmployeeMorale = useCallback((employeeId: string, change: number) => {
    setEmployees(prev =>
        prev.map(emp => {
            if (emp.id === employeeId) {
                const newMorale = Math.max(0, Math.min(100, emp.morale + change));
                return { ...emp, morale: newMorale };
            }
            return emp;
        })
    );
  }, []);

  const handleSaveChatHistory = useCallback((employeeId: string, history: ChatMessage[], contextId: string) => {
    setEmployees(prev => 
        prev.map(emp => {
            if (emp.id === employeeId) {
                const newChatHistories = { ...emp.chatHistories, [contextId]: history };
                return { ...emp, chatHistories: newChatHistories };
            }
            return emp;
        })
    );
  }, []);

    const handleIncrementApiUsage = useCallback((companyId: string) => {
        setCompanies(prev =>
            prev.map(c => {
                if (c.id === companyId) {
                    const now = Date.now();
                    const lastRequestDate = new Date(c.lastApiRequestTimestamp || 0).toDateString();
                    const nowDateString = new Date(now).toDateString();

                    const isNewDay = lastRequestDate !== nowDateString;
                    const newCount = isNewDay ? 1 : (c.apiRequestCount || 0) + 1;

                    return {
                        ...c,
                        apiRequestCount: newCount,
                        lastApiRequestTimestamp: now,
                    };
                }
                return c;
            })
        );
    }, []);

  const addProject = useCallback((companyId: string, name: string, description: string, clientId?: string) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      companyId,
      name,
      description,
      employeeIds: [],
      clientId,
      status: 'Active',
    };
    setProjects(prev => [...prev, newProject]);
  }, []);

  const updateProject = useCallback((projectId: string, data: Partial<Omit<Project, 'id' | 'companyId'>>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p));
  }, []);

  const updateProjectMembers = useCallback((projectId: string, employeeIds: string[]) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, employeeIds } : p));
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    // Also delete associated meeting minutes, tasks, and planning data
    setMeetingMinutes(prev => prev.filter(m => m.projectId !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
    setProjectPhases(prev => prev.filter(p => p.projectId !== projectId));
    setProjectBudgets(prev => prev.filter(b => b.projectId !== projectId));
    setProjectExpenses(prev => prev.filter(e => e.projectId !== projectId));
    
    // Recursively delete all files and folders within the project
    setFiles(prevFiles => {
        const idsToDelete = new Set<string>();
        const findChildrenRecursive = (parentId: string) => {
            const children = prevFiles.filter(f => f.parentId === parentId);
            children.forEach(child => {
                idsToDelete.add(child.id);
                if (child.type === 'folder') {
                    findChildrenRecursive(child.id);
                }
            });
        };
        findChildrenRecursive(projectId);
        return prevFiles.filter(f => !idsToDelete.has(f.id));
    });
  }, []);


  const addBrainstormSession = useCallback((sessionData: Omit<BrainstormSession, 'id'>): BrainstormSession => {
    const newSession: BrainstormSession = {
        ...sessionData,
        id: `brainstorm_${Date.now()}`,
    };
    setBrainstormSessions(prev => [...prev, newSession]);
    return newSession;
  }, []);
  
  const updateBrainstormSession = useCallback((updatedSession: BrainstormSession) => {
      setBrainstormSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  }, []);

  const deleteBrainstormSession = useCallback((sessionId: string) => {
      setBrainstormSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const addEvent = useCallback((eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
        ...eventData,
        id: `event_${Date.now()}`,
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);
  
  const updateEvent = useCallback((eventId: string, eventData: Partial<Omit<Event, 'id'>>) => {
      setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, ...eventData } : e)));
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
      setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);
  
  const addMeetingMinute = useCallback((minuteData: Omit<MeetingMinute, 'id'>) => {
    const newMinute: MeetingMinute = {
      ...minuteData,
      id: `minute_${Date.now()}`,
    };
    setMeetingMinutes(prev => [...prev, newMinute]);
  }, []);

  const addTask = useCallback((companyId: string, taskData: Omit<Task, 'id' | 'companyId' | 'status' | 'priority'>) => {
    const priority = calculateTaskPriority(taskData as Partial<Task>);
    const newTask: Task = {
        ...taskData,
        id: `task_${Date.now()}`,
        companyId,
        status: 'To Do',
        priority,
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<Task, 'id' | 'companyId' | 'priority'>>) => {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            const updatedTaskPartial = { ...t, ...updates };
            const newPriority = calculateTaskPriority(updatedTaskPartial);
            return { ...updatedTaskPartial, priority: newPriority };
        }
        return t;
      }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const addAsset = useCallback((companyId: string, assetData: Omit<SoftwareAsset, 'id' | 'companyId'>) => {
    const newAsset: SoftwareAsset = {
        ...assetData,
        id: `asset_${Date.now()}`,
        companyId,
    };
    setSoftwareAssets(prev => [...prev, newAsset]);
  }, []);

  const updateAsset = useCallback((assetId: string, updates: Partial<Omit<SoftwareAsset, 'id'>>) => {
      setSoftwareAssets(prev => prev.map(asset => asset.id === assetId ? { ...asset, ...updates } : asset));
  }, []);

  const removeAsset = useCallback((assetId: string) => {
      setSoftwareAssets(prev => prev.filter(asset => asset.id !== assetId));
  }, []);

  // --- Client Handlers ---
  const addClient = useCallback((companyId: string, clientData: Omit<Client, 'id' | 'companyId'>) => {
    const newClient: Client = {
        ...clientData,
        id: `client_${Date.now()}`,
        companyId,
    };
    setClients(prev => [...prev, newClient]);
  }, []);

  const updateClient = useCallback((clientId: string, data: Partial<Omit<Client, 'id' | 'companyId'>>) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...data } : c));
  }, []);

  const deleteClient = useCallback((clientId: string) => {
      setClients(prev => prev.filter(c => c.id !== clientId));
      // Unassign client from any projects
      setProjects(prev => prev.map(p => p.clientId === clientId ? { ...p, clientId: undefined } : p));
      
      // Recursively delete all files and folders within the client's scope
      setFiles(prevFiles => {
          const idsToDelete = new Set<string>();
          const findChildrenRecursive = (parentId: string) => {
              const children = prevFiles.filter(f => f.parentId === parentId);
              children.forEach(child => {
                  idsToDelete.add(child.id);
                  if (child.type === 'folder') {
                      findChildrenRecursive(child.id);
                  }
              });
          };
          findChildrenRecursive(clientId);
          return prevFiles.filter(f => !idsToDelete.has(f.id));
      });
  }, []);

  // --- Project Planning & Budget Handlers ---
  const handleAddPhase = useCallback((phaseData: Omit<ProjectPhase, 'id'>) => {
    const newPhase: ProjectPhase = { ...phaseData, id: `phase_${Date.now()}` };
    setProjectPhases(prev => [...prev, newPhase]);
  }, []);
  const handleUpdatePhase = useCallback((phaseId: string, updates: Partial<Omit<ProjectPhase, 'id'>>) => {
    setProjectPhases(prev => prev.map(p => p.id === phaseId ? { ...p, ...updates } : p));
  }, []);
  const handleDeletePhase = useCallback((phaseId: string) => {
    setProjectPhases(prev => prev.filter(p => p.id !== phaseId));
  }, []);
  const handleUpdateBudget = useCallback((budgetData: ProjectBudget) => {
    setProjectBudgets(prev => {
        const existing = prev.find(b => b.projectId === budgetData.projectId);
        if (existing) {
            return prev.map(b => b.projectId === budgetData.projectId ? {...existing, ...budgetData} : b);
        }
        return [...prev, budgetData];
    });
  }, []);
  const handleAddExpense = useCallback((expenseData: Omit<ProjectExpense, 'id'>) => {
    const newExpense: ProjectExpense = { ...expenseData, id: `exp_${Date.now()}` };
    setProjectExpenses(prev => [...prev, newExpense]);
  }, []);
  const handleUpdateExpense = useCallback((expenseId: string, updates: Partial<Omit<ProjectExpense, 'id'>>) => {
    setProjectExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, ...updates } : e));
  }, []);
  const handleDeleteExpense = useCallback((expenseId: string) => {
    setProjectExpenses(prev => prev.filter(e => e.id !== expenseId));
  }, []);

  const addQuickNote = useCallback((companyId: string) => {
    const newNote: QuickNote = {
      id: `note_${Date.now()}`,
      companyId,
      content: 'New Note...',
      color: 'yellow',
      isCollapsed: false,
    };
    setQuickNotes(prev => [...prev, newNote]);
  }, []);

  const updateQuickNote = useCallback((noteId: string, updates: Partial<Omit<QuickNote, 'id' | 'companyId'>>) => {
    setQuickNotes(prev => prev.map(note => note.id === noteId ? { ...note, ...updates } : note));
  }, []);

  const deleteQuickNote = useCallback((noteId: string) => {
    setQuickNotes(prev => prev.filter(note => note.id !== noteId));
  }, []);

  // --- File Handlers ---
  const addFile = useCallback((fileData: Omit<AppFile, 'id'>): AppFile => {
    const newFile: AppFile = {
      ...fileData,
      id: `file_${Date.now()}`,
    };
    setFiles(prev => [...prev, newFile]);
    return newFile;
  }, []);

  const updateFile = useCallback((fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f));
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    setFiles(prevFiles => {
        const fileToDelete = prevFiles.find(f => f.id === fileId);
        if (!fileToDelete) return prevFiles;

        const idsToDelete = new Set<string>([fileId]);
        
        if (fileToDelete.type === 'folder') {
            const findChildrenRecursive = (parentId: string) => {
                const children = prevFiles.filter(f => f.parentId === parentId);
                children.forEach(child => {
                    idsToDelete.add(child.id);
                    if (child.type === 'folder') {
                        findChildrenRecursive(child.id);
                    }
                });
            };
            findChildrenRecursive(fileId);
        }
        
        return prevFiles.filter(f => !idsToDelete.has(f.id));
    });
  }, []);

  const addGeneratedDocument = useCallback((docData: Omit<GeneratedDocument, 'id'>): GeneratedDocument => {
    const newDoc: GeneratedDocument = {
        ...docData,
        id: `gendoc_${Date.now()}`,
    };
    setGeneratedDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  }, []);

  const handleRequestReview = useCallback((fileId: string, reviewerId: string) => {
      const reviewer = employees.find(e => e.id === reviewerId);
      if (!reviewer) return;

      const file = files.find(f => f.id === fileId);
      if (!file) return;
      
      const author = employees.find(e => e.id === file.authorId) || user;

      updateFile(fileId, {
        status: 'In Review',
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
      });

      const newNotification: Notification = {
        id: `notif_${Date.now()}`,
        userId: reviewer.id,
        message: `${author?.name} has requested your review on the document: "${file.name}".`,
        timestamp: new Date().toISOString(),
        read: false,
        link: { type: 'file', id: fileId }
      };
      setNotifications(prev => [...prev, newNotification]);
  }, [employees, files, user, updateFile]);


  const selectCompany = (id: string) => {
    setSelectedCompanyId(id);
    setView('dashboard');
  };

  const goToList = () => {
    setSelectedCompanyId(null);
    setView('list');
  };

  const openDeleteModal = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setCompanyToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const confirmDeleteCompany = () => {
    if (!companyToDelete) return;

    const companyId = companyToDelete.id;
    const projectIdsToDelete = projects.filter(p => p.companyId === companyId).map(p => p.id);
    
    setEmployees(prev => prev.filter(e => e.teamId && !teams.find(t => t.id === e.teamId && t.companyId === companyId)));
    setTeams(prev => prev.filter(d => d.companyId !== companyId));
    setDepartments(prev => prev.filter(d => d.companyId !== companyId));
    setClients(prev => prev.filter(c => c.companyId !== companyId));

    setProjectPhases(prev => prev.filter(p => !projectIdsToDelete.includes(p.projectId)));
    setProjectBudgets(prev => prev.filter(b => !projectIdsToDelete.includes(b.projectId)));
    setProjectExpenses(prev => prev.filter(e => !projectIdsToDelete.includes(e.projectId)));

    setProjects(prev => prev.filter(p => p.companyId !== companyId));
    setBrainstormSessions(prev => prev.filter(b => b.companyId !== companyId));
    setEvents(prev => prev.filter(e => e.companyId !== companyId));
    setMeetingMinutes(prev => prev.filter(m => m.companyId !== companyId));
    setTasks(prev => prev.filter(t => t.companyId !== companyId));
    setSoftwareAssets(prev => prev.filter(asset => asset.companyId !== companyId));
    setQuickNotes(prev => prev.filter(note => note.companyId !== companyId));
    setFiles(prev => prev.filter(f => f.companyId !== companyId));
    setGeneratedDocuments(prev => prev.filter(d => d.companyId !== companyId));
    setCompanies(prev => prev.filter(c => c.id !== companyId));
    
    closeDeleteModal();
  };

  const handleExportData = () => {
    const userProfile = {
      name: user?.name,
      picture: user?.picture,
      settings: user?.settings,
    };

    const data = {
      userProfile,
      companies,
      departments,
      teams,
      employees,
      projects,
      clients,
      brainstormSessions,
      events,
      meetingMinutes,
      tasks,
      softwareAssets,
      projectPhases,
      projectBudgets,
      projectExpenses,
      quickNotes,
      files,
      generatedDocuments,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `ai-business-co-pilot-data-${user?.name.replace(/\s/g, '_')}.json`;
    link.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File is not readable');
        }
        const data = JSON.parse(text);

        // Basic validation & migration from old format
        if (Array.isArray(data.companies) && (Array.isArray(data.teams) || Array.isArray(data.departments)) && Array.isArray(data.employees)) {
          
          if (data.userProfile) {
              updateUser({ settings: data.userProfile.settings });
          }

          // Migrate employee data from departmentId to teamId for backward compatibility
          const migratedEmployees = (data.employees as any[]).map(emp => {
              if (emp.departmentId && !emp.teamId) {
                  emp.teamId = emp.departmentId;
                  delete emp.departmentId;
              }
              return emp;
          });
          
          let importedTasks: Task[] = data.tasks || [];
          let importedProjects: Project[] = (data.projects || []).map((p: any) => ({
              ...p,
              status: p.status || 'Active',
          }));
          let importedEvents: Event[] = data.events || [];

          const taskEventsToMigrate = (data.events || []).filter((e: any) => e.type === 'task');

          if (taskEventsToMigrate.length > 0) {
              const importedProjectsMap = new Map<string, string>(); // companyId -> projectId

              // Create necessary "Imported Tasks" projects
              taskEventsToMigrate.forEach((eventToMigrate: Event) => {
                  if (!importedProjectsMap.has(eventToMigrate.companyId)) {
                      const companyProjects = importedProjects.filter(p => p.companyId === eventToMigrate.companyId);
                      let importedProject = companyProjects.find(p => p.name === 'Imported Tasks');
                      
                      if (!importedProject) {
                          const newImportedProject: Project = {
                              id: `proj_imported_${eventToMigrate.companyId}`,
                              companyId: eventToMigrate.companyId,
                              name: 'Imported Tasks',
                              description: 'Tasks automatically migrated from the legacy calendar system.',
                              employeeIds: [],
                              status: 'Active',
                          };
                          importedProjects.push(newImportedProject);
                          importedProjectsMap.set(eventToMigrate.companyId, newImportedProject.id);
                      } else {
                          importedProjectsMap.set(eventToMigrate.companyId, importedProject.id);
                      }
                  }
              });

              // Convert events to tasks
              const migratedTasks: Task[] = taskEventsToMigrate.map((eventToMigrate: Event, index: number) => ({
                  id: `task_migrated_${Date.now()}_${index}`,
                  companyId: eventToMigrate.companyId,
                  projectId: importedProjectsMap.get(eventToMigrate.companyId)!,
                  assigneeId: eventToMigrate.participantIds?.[0] || '',
                  title: eventToMigrate.title,
                  description: eventToMigrate.description,
                  status: 'To Do',
                  priority: 'Medium',
                  dueDate: eventToMigrate.end,
              }));

              importedTasks = [...importedTasks, ...migratedTasks];
              
              // Filter out the migrated tasks from the events array
              const eventIdsToMigrate = new Set(taskEventsToMigrate.map((ev: Event) => ev.id));
              importedEvents = (data.events || []).filter((ev: Event) => !eventIdsToMigrate.has(ev.id));
              
              alert(`${taskEventsToMigrate.length} task(s) were migrated from the calendar to the Task Board. You can find them in the "Imported Tasks" project.`);
          }

          setCompanies(data.companies);
          setDepartments(data.departments || []);
          setTeams(data.teams || data.departments || []);
          setEmployees(migratedEmployees);
          setProjects(importedProjects);
          setClients(data.clients || []);
          setBrainstormSessions(data.brainstormSessions || []);
          setEvents(importedEvents);
          setMeetingMinutes(data.meetingMinutes || []);
          setTasks(importedTasks);
          setSoftwareAssets(data.softwareAssets || []);
          setProjectPhases(data.projectPhases || []);
          setProjectBudgets(data.projectBudgets || []);
          setProjectExpenses(data.projectExpenses || []);
          setQuickNotes(data.quickNotes || []);
          setFiles(data.files || []);
          setGeneratedDocuments(data.generatedDocuments || []);
          setNotifications(data.notifications || []);
          
          if (taskEventsToMigrate.length === 0) {
            alert('Data imported successfully!');
          }

        } else {
          throw new Error('Invalid file format.');
        }
      } catch (error) {
        console.error('Failed to import data:', error);
        alert('Failed to import data. The file may be corrupted or in the wrong format.');
      }
    };
    reader.readAsText(file);
    // Reset file input value to allow re-uploading the same file
    event.target.value = '';
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };


  const renderMainContent = () => {
    if (view === 'create_company') {
      return (
        <div className="w-full max-w-4xl mx-auto">
            <CompanyCreator onCompanyCreated={addCompany} />
        </div>
      );
    }

    if (view === 'api_settings') {
      return (
        <ApiSettingsPage
          user={user!}
          companies={companies}
          onUpdateUser={updateUser}
          onUpdateCompany={updateCompany}
          onBack={() => setView('list')}
        />
      );
    }

    if (view === 'dashboard' && selectedCompanyId) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company) {
        const companyDepartments = departments.filter(d => d.companyId === selectedCompanyId);
        const companyTeams = teams.filter(d => d.companyId === selectedCompanyId);
        const companyClients = clients.filter(c => c.companyId === selectedCompanyId);
        const companyEmployees = employees.filter(e => companyTeams.some(d => d.id === e.teamId));
        const companyProjects = projects.filter(p => p.companyId === selectedCompanyId);
        const companyBrainstorms = brainstormSessions.filter(b => b.companyId === selectedCompanyId);
        const companyEvents = events.filter(e => e.companyId === selectedCompanyId);
        const companyMeetingMinutes = meetingMinutes.filter(m => m.companyId === selectedCompanyId);
        const companyTasks = tasks.filter(t => t.companyId === selectedCompanyId);
        const companySoftwareAssets = softwareAssets.filter(asset => asset.companyId === selectedCompanyId);
        const companyQuickNotes = quickNotes.filter(q => q.companyId === selectedCompanyId);
        const companyFiles = files.filter(f => f.companyId === selectedCompanyId);
        const companyGeneratedDocuments = generatedDocuments.filter(d => d.companyId === selectedCompanyId);
        
        const personalAssistant = companyEmployees.find(e => e.jobProfile === JobProfile.PersonalAssistant);
        
        return (
          <CompanyDashboard
            user={user!}
            company={company}
            departments={companyDepartments}
            teams={companyTeams}
            clients={companyClients}
            employees={companyEmployees}
            projects={companyProjects}
            brainstormSessions={companyBrainstorms}
            events={companyEvents}
            meetingMinutes={companyMeetingMinutes}
            tasks={companyTasks}
            softwareAssets={companySoftwareAssets}
            personalAssistant={personalAssistant}
            projectPhases={projectPhases}
            projectBudgets={projectBudgets}
            projectExpenses={projectExpenses}
            quickNotes={companyQuickNotes}
            files={companyFiles}
            generatedDocuments={companyGeneratedDocuments}
            onAddDepartment={addDepartment}
            onUpdateDepartment={updateDepartment}
            onDeleteDepartment={deleteDepartment}
            onAddTeam={addTeam}
            onHireEmployee={hireEmployee}
            onFireEmployee={fireEmployee}
            onMoveEmployee={moveEmployee}
            onSaveChatHistory={handleSaveChatHistory}
            onUpdateEmployeeMorale={handleUpdateEmployeeMorale}
            onIncrementApiUsage={handleIncrementApiUsage}
            onUpdateCompany={updateCompany}
            onUpdateTeam={updateTeam}
            onDeleteTeam={deleteTeam}
            onAddProject={addProject}
            onUpdateProjectMembers={updateProjectMembers}
            onDeleteProject={deleteProject}
            onAddBrainstormSession={addBrainstormSession}
            onUpdateBrainstormSession={updateBrainstormSession}
            onDeleteBrainstormSession={deleteBrainstormSession}
            onAddEvent={addEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
            onAddMeetingMinute={addMeetingMinute}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onAddAsset={addAsset}
            onUpdateAsset={updateAsset}
            onRemoveAsset={removeAsset}
            onAddPhase={handleAddPhase}
            onUpdatePhase={handleUpdatePhase}
            onDeletePhase={handleDeletePhase}
            onUpdateBudget={handleUpdateBudget}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onAddQuickNote={addQuickNote}
            onUpdateQuickNote={updateQuickNote}
            onDeleteQuickNote={deleteQuickNote}
            onAddFile={addFile}
            onUpdateFile={updateFile}
            onDeleteFile={deleteFile}
            onAddClient={addClient}
            onUpdateClient={updateClient}
            onDeleteClient={deleteClient}
            onUpdateProject={updateProject}
            onAddGeneratedDocument={addGeneratedDocument}
            onRequestReview={handleRequestReview}
            onBack={goToList}
          />
        );
      }
    }

    const globalRpdLimit = user?.settings?.globalApiRequestLimit || DEFAULT_GLOBAL_API_REQUEST_LIMIT;
    const totalAssignedRpd = companies.reduce((sum, c) => sum + (c.dailyApiRequestLimit || 0), 0);
    const rpdLeftToAssign = globalRpdLimit - totalAssignedRpd;

    const handleRpdEditClick = (company: Company) => {
        setEditingRpdCompanyId(company.id);
        setRpdInputValue(String(company.dailyApiRequestLimit || 0));
    };

    const handleRpdSave = (company: Company) => {
        const newLimit = parseInt(rpdInputValue, 10);
        if (isNaN(newLimit) || newLimit < 0) {
            alert("Please enter a valid non-negative number.");
            return;
        }
        
        const originalLimit = company.dailyApiRequestLimit || 0;
        const rpdAvailableForCompany = rpdLeftToAssign + originalLimit;

        if (newLimit > rpdAvailableForCompany) {
            alert(`Cannot assign ${newLimit} requests. Only ${rpdAvailableForCompany} requests are available for this company from the global pool.`);
            return;
        }

        updateCompany(company.id, { dailyApiRequestLimit: newLimit });
        setEditingRpdCompanyId(null);
    };


    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-4xl font-bold">My Companies</h1>
          <div className="flex items-center gap-2">
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportData} style={{ display: 'none' }} />
            <button onClick={triggerImport} className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-lg font-semibold hover:bg-slate-600 transition-colors text-sm">
                <ImportIcon className="w-4 h-4" />
                Import
            </button>
            <button onClick={handleExportData} className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-lg font-semibold hover:bg-slate-600 transition-colors text-sm">
                <ExportIcon className="w-4 h-4" />
                Export
            </button>
            <button onClick={() => setView('create_company')} className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-500 transition-colors">
              <PlusIcon className="w-5 h-5"/>
              New Company
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 mb-8 border border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderRadius: 'var(--radius-lg, 0.75rem)' }}>
            <div className="flex items-center gap-3">
                <SparklesIcon className="w-6 h-6 text-indigo-400"/>
                <div>
                    <h2 className="text-lg font-bold">Global API Requests</h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                        <InfoIcon className="w-3 h-3"/>
                        <span>Please refer to your Google account for accurate pricing and to configure billing.</span>
                    </p>
                </div>
            </div>
            <div className="text-center sm:text-right">
                <p className="text-slate-400 text-sm">RPD Left to Assign</p>
                <p className="text-3xl font-bold text-white">{rpdLeftToAssign}</p>
            </div>
        </div>
        
        {companies.length === 0 ? (
          <div className="text-center bg-slate-800/50 p-12 border border-slate-700" style={{ borderRadius: 'var(--radius-lg, 0.75rem)' }}>
            <BuildingIcon className="w-16 h-16 mx-auto text-slate-600 mb-4"/>
            <h2 className="text-2xl font-bold text-slate-300">No Companies Yet</h2>
            <p className="text-slate-500 mt-2">Get started by creating your first company or importing your data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(company => {
              const isEditingRpd = editingRpdCompanyId === company.id;
              return (
              <div key={company.id} className="relative group bg-slate-800 flex flex-col" style={{ borderRadius: 'var(--radius-lg, 0.75rem)', boxShadow: 'var(--shadow-lg, none)' }}>
                <button
                  onClick={() => selectCompany(company.id)}
                  className="w-full text-center p-6 hover:bg-slate-700/40 transition-colors flex-grow flex flex-col items-center"
                >
                  <div className="bg-slate-700 p-3 mb-4 rounded-lg">
                    {company.branding?.logo ? (
                        <img src={company.branding.logo} alt={`${company.name} logo`} className="w-12 h-12 object-contain"/>
                      ) : (
                        <BuildingIcon className="w-12 h-12 text-indigo-400"/>
                      )}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{company.name}</h3>
                  <p className="text-slate-400 whitespace-pre-wrap">{company.profile}</p>
                </button>
                 <div className="border-t border-slate-700/50 p-3 bg-slate-900/30">
                    {isEditingRpd ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={rpdInputValue}
                                onChange={e => setRpdInputValue(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-sm text-white"
                                autoFocus
                            />
                            <button onClick={() => handleRpdSave(company)} className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-500"><CheckIcon className="w-4 h-4"/></button>
                            <button onClick={() => setEditingRpdCompanyId(null)} className="p-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-500"><XMarkIcon className="w-4 h-4"/></button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-400">DAILY API REQUESTS</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{company.dailyApiRequestLimit || 0}</span>
                                <button onClick={() => handleRpdEditClick(company)} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    )}
                </div>
                <button 
                  onClick={() => openDeleteModal(company)} 
                  className="absolute top-3 right-3 p-2 bg-red-800/60 rounded-full text-red-300 opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity"
                  aria-label={`Delete ${company.name}`}
                  >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!isInitialized || !user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <p>Loading Co-Pilot...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <AuthHeader
          onNavigateToApiSettings={() => setView('api_settings')}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearAll={handleClearAll}
      />
      <main className="p-4 md:p-8 mt-16 flex-grow">
        {renderMainContent()}
      </main>
      <Footer />
      <DeleteCompanyModal
        isOpen={isDeleteModalOpen}
        companyName={companyToDelete?.name || ''}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCompany}
      />
    </div>
  );
};

export default App;
