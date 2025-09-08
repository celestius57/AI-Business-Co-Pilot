import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, Employee, Company, ToolOutput, Team, Project, MeetingMinute, Event, EventType, Task, Client, AppFile, ProjectPhase, ProjectExpense, RichTextBlock, GeneratedDocument } from '../types';
import { continueConversation, getCollaboratorResponse, generateImage } from '../services/geminiService';
import { generateFileBlob } from '../services/fileGenerator';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { getLondonTimestamp, buildCompanyContextString, buildEmployeeRosterString, getToolsForJobProfile, buildToolsInstructions, buildProjectContextString, formatTimestamp, buildMeetingMinutesContextString, buildAllProjectsContextString, buildAllMeetingMinutesContextString, buildAllEventsContextString, buildAllTasksContextString, buildAllClientsContextString, buildProjectPhasesContextString, buildProjectBudgetContextString, buildFilesContextString, formatCurrency } from '../utils';
import { JobProfile, Tool } from '../constants';
import { ToolView } from './tools/ToolView';
import { DiagramIcon } from './icons/DiagramIcon';
import { KanbanIcon } from './icons/KanbanIcon';
import { CodeIcon } from './icons/CodeIcon';
import { ServiceError } from '../services/errors';
import { ThumbUpIcon } from './icons/ThumbUpIcon';
import { WordFileIcon } from './icons/WordFileIcon';
import { PowerPointFileIcon } from './icons/PowerPointFileIcon';
import { ExcelFileIcon } from './icons/ExcelFileIcon';
import { useAuth } from '../contexts/AuthContext';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ProjectsIcon } from './icons/ProjectsIcon';
import { FileIcon } from './icons/FileIcon';
import { useOptionalProject } from '../contexts/ProjectContext';
import { GeneratedDocumentsPanel } from './GeneratedDocumentsPanel';
import { CheckIcon } from './icons/CheckIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';


interface ChatViewProps {
  company: Company;
  employee: Employee;
  employees: Employee[];
  teams: Team[];
  project?: Project;
  projects: Project[];
  clients: Client[];
  meetingMinutes: MeetingMinute[];
  allMeetingMinutes: MeetingMinute[];
  allEvents: Event[];
  allTasks: Task[];
  files?: AppFile[];
  generatedDocuments: GeneratedDocument[];
  isApiAvailable: boolean;
  onBack: () => void;
  onSaveHistory: (history: ChatMessage[], contextId: string) => void;
  onPraise: (employeeId: string) => void;
  onInteract: (employeeId: string) => void;
  onAddEvent: (eventData: Omit<Event, 'id'>) => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'companyId' | 'status'>) => void;
  onAddFile: (fileData: Omit<AppFile, 'id'>) => AppFile;
  onUpdateFile: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
  onAddGeneratedDocument: (docData: Omit<GeneratedDocument, 'id'>) => GeneratedDocument;
}

export const ChatView: React.FC<ChatViewProps> = ({ company, employee, employees, teams, onBack, onSaveHistory, onPraise, onInteract, project, projects, clients, meetingMinutes, allMeetingMinutes, allEvents, allTasks, onAddEvent, onAddTask, isApiAvailable, onAddFile, onUpdateFile, files = [], generatedDocuments, onAddGeneratedDocument }) => {
  const { user } = useAuth();
  const projectContext = useOptionalProject();
  const contextId = project?.id || 'general';
  const [history, setHistory] = useState<ChatMessage[]>(employee.chatHistories?.[contextId] || []);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewingToolOutput, setViewingToolOutput] = useState<ToolOutput | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [imageSaveStates, setImageSaveStates] = useState<Record<string, boolean>>({});
  const conversationStartedRef = useRef<Record<string, boolean>>({});
  const [praisedMessageTimestamp, setPraisedMessageTimestamp] = useState<string | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [userInput]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);

  const getFinalSystemInstruction = useCallback(() => {
    const companyContext = buildCompanyContextString(company);
    const tools = getToolsForJobProfile(employee.jobProfile);
    const toolsInstruction = buildToolsInstructions(tools);

    const documentAnalysisInstruction = `\n\n**Document Analysis:**
You can analyze documents uploaded by the user, including text files (.txt, .md), spreadsheets (.xlsx), documents (.docx), and presentations (.pptx). When a file is uploaded, provide a concise summary, extract key insights, or answer questions based on its content, according to your job profile. For example, a Sales Manager can analyze sales data from a spreadsheet, and a Marketing Specialist can review a campaign proposal from a document.`;

    const moraleInstruction = `\n\n**Morale-Based Interaction Style:**
Your current morale is ${employee.morale}/100. This affects your communication style but NOT your competence.
- High Morale (75-100): You are proactive, enthusiastic, and offer creative suggestions.
- Standard Morale (25-74): You are professional and direct in your responses.
- Low Morale (0-24): You are brief, more literal, and less conversational. You get the job done without extra flair.`;

    let finalInstruction = `${employee.systemInstruction}${moraleInstruction}\n\n${companyContext}${documentAnalysisInstruction}`;

    const clientForProject = project?.clientId ? clients.find(c => c.id === project.clientId) : undefined;
    const filesContext = buildFilesContextString(files);

    if (employee.jobProfile === JobProfile.PersonalAssistant) {
        const rosterContext = buildEmployeeRosterString(employees);
        const allProjectsContext = buildAllProjectsContextString(projects, clients);
        const allClientsContext = buildAllClientsContextString(clients);
        const allTasksContext = buildAllTasksContextString(allTasks, employees, projects);
        const allMinutesContext = buildAllMeetingMinutesContextString(allMeetingMinutes, projects);
        const allEventsContext = buildAllEventsContextString(allEvents);
        
        finalInstruction += `\n\n${rosterContext}\n\n${allClientsContext}\n\n${allProjectsContext}\n\n${allTasksContext}\n\n${allMinutesContext}\n\n${allEventsContext}`;

        if (project) {
            finalInstruction += `\n\n---
**CURRENT FOCUS:**
The current conversation is specifically about the "${project?.name}" project. Please prioritize this context in your immediate response, but use your knowledge of all other company data for broader insights and connections.
---`;
        }
    } else {
        const projectContextString = project ? buildProjectContextString(project, clientForProject) : '';
        const minutesContext = project && meetingMinutes.length > 0 ? buildMeetingMinutesContextString(meetingMinutes) : '';
        if (projectContextString) {
          finalInstruction += `\n\n${projectContextString}`;
        }
        if (minutesContext) {
          finalInstruction += `\n\n${minutesContext}`;
        }
    }

    if (projectContext) {
        const { phases, budget, expenses } = projectContext;
        const phasesContext = buildProjectPhasesContextString(phases);
        const budgetContext = buildProjectBudgetContextString(budget, expenses, user?.settings?.currency || 'USD');
        finalInstruction += `\n\n${phasesContext}\n\n${budgetContext}`;
    }

    finalInstruction += `\n\n${filesContext}`;
    finalInstruction += `\n\n${toolsInstruction}`;
    
    return finalInstruction;
  }, [company, employee, employees, project, projects, meetingMinutes, allMeetingMinutes, allEvents, allTasks, clients, projectContext, files, user?.settings]);

  useEffect(() => {
    const contextKey = `${employee.id}-${contextId}`;
    const propHistory = employee.chatHistories?.[contextId] || [];
    setHistory(propHistory);

    if (propHistory.length > 0 || conversationStartedRef.current[contextKey]) {
      setIsLoading(false);
      if(propHistory.length > 0){
        conversationStartedRef.current[contextKey] = true;
      }
      return;
    }

    const startConversation = async () => {
      setIsLoading(true);
      conversationStartedRef.current[contextKey] = true;
      const initialUserMessage: ChatMessage = { role: 'user', text: 'Hello.', timestamp: getLondonTimestamp() };
      try {
        onInteract(employee.id);
        const finalSystemInstruction = getFinalSystemInstruction();
        const modelResponse = await continueConversation([initialUserMessage], finalSystemInstruction);
        const finalHistory = [
          initialUserMessage,
          { role: 'model' as const, text: modelResponse, timestamp: getLondonTimestamp() },
        ];
        onSaveHistory(finalHistory, contextId);
      } catch (error) {
        console.error("Failed to start conversation:", error);
        const errorMessage = error instanceof ServiceError ? error.userMessage : 'Sorry, I am having trouble starting. Please try again later.';
        setHistory([{ role: 'model' as const, text: errorMessage, timestamp: getLondonTimestamp() }]);
        setIsLoading(false);
        conversationStartedRef.current[contextKey] = false; // Allow retry on error
      }
    };

    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.chatHistories, contextId, getFinalSystemInstruction, onInteract, onSaveHistory, employee.id]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'text/plain', 'text/markdown', 'application/json', 'text/csv',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
        ];
        const maxSize = 4 * 1024 * 1024; // 4MB

        if (!allowedMimeTypes.includes(file.type)) {
            alert('Unsupported file type. Please select a valid document or image file.');
            return;
        }
        if (file.size > maxSize) {
            alert('File is too large. Please select a file smaller than 4MB.');
            return;
        }
        setAttachedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const removeAttachedFile = () => {
      setAttachedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };
  
  const handleApproveAndSaveDocument = async () => {
    if (!viewingToolOutput) return;
    const fileData = await generateFileBlob(viewingToolOutput);
    if (fileData && onAddGeneratedDocument) {
        onAddGeneratedDocument({
            companyId: company.id,
            fileName: fileData.fileName,
            base64Content: fileData.base64Content,
            mimeType: fileData.mimeType,
            createdAt: new Date().toISOString(),
            generatedByEmployeeId: employee.id,
            generatedByEmployeeName: employee.name,
            generatedByEmployeeAvatarUrl: employee.avatarUrl,
            context: {
                type: 'direct',
                contextDescription: project ? `Project: ${project.name}` : `Chat with ${employee.name}`,
            },
            sourceData: viewingToolOutput.data,
        });

        const confirmationMessage: ChatMessage = {
            role: 'model',
            text: `I've generated "${fileData.fileName}". You can find it in the Generated Documents panel.`,
            timestamp: getLondonTimestamp(),
            employeeId: 'facilitator',
            employeeName: 'System',
        };
        const finalHistory = [...history, confirmationMessage];
        setHistory(finalHistory);
        onSaveHistory(finalHistory, contextId);
        setViewingToolOutput(null);
    }
  };

  const handleApproveDataChange = () => {
    if (!viewingToolOutput) return;
    let confirmationText = '';

    switch (viewingToolOutput.tool) {
        case Tool.Calendar: {
            if (onAddEvent) {
                const eventData = viewingToolOutput.data;
                const type = (eventData.type || 'meeting') as EventType;
                let start = eventData.start;
                let end = eventData.end;
                let color = 'bg-purple-500';
                if (!start || !end) {
                    const now = new Date();
                    start = now.toISOString();
                    end = now.toISOString();
                }
                if (type === 'reminder') color = 'bg-yellow-500';

                onAddEvent({
                    companyId: company.id, title: eventData.title, description: eventData.description || '',
                    start: new Date(start).toISOString(), end: new Date(end).toISOString(),
                    participantIds: eventData.participantIds || [], color, type,
                });
                confirmationText = `OK. I've added "${eventData.title}" to the company calendar.`;
            }
            break;
        }
        case Tool.CreateTask: {
            if (onAddTask) {
                const taskData = viewingToolOutput.data;
                onAddTask(taskData);
                const assignee = employees.find(e => e.id === taskData.assigneeId);
                confirmationText = `Task "${taskData.title}" created and assigned to ${assignee ? assignee.name : 'the designated employee'}.`;
            }
            break;
        }
        case Tool.ProjectManagement: {
            if (projectContext) {
                const { action, payload } = viewingToolOutput.data || {};

                switch (action) {
                    case 'add_phase':
                        if (payload && payload.name && payload.startDate && payload.endDate) {
                            const phaseToAdd: Omit<ProjectPhase, 'id' | 'projectId'> = {
                                name: payload.name,
                                description: payload.description || `Phase created on ${new Date().toLocaleDateString()}`,
                                startDate: new Date(payload.startDate).toISOString(),
                                endDate: new Date(payload.endDate).toISOString(),
                                status: 'Not Started',
                            };
                            projectContext.onAddPhase(phaseToAdd); 
                            confirmationText = `New phase "${payload.name}" has been added to the project plan.`;
                        } else {
                            confirmationText = "I can't add a phase without a name, start date, and end date. Please provide more details.";
                        }
                        break;
                    case 'add_multiple_phases':
                        if (Array.isArray(payload) && payload.length > 0) {
                            let addedCount = 0;
                            payload.forEach(phase => {
                                if (phase && phase.name && phase.startDate && phase.endDate) {
                                    const phaseToAdd: Omit<ProjectPhase, 'id' | 'projectId'> = {
                                        name: phase.name,
                                        description: phase.description || `Phase created on ${new Date().toLocaleDateString()}`,
                                        startDate: new Date(phase.startDate).toISOString(),
                                        endDate: new Date(phase.endDate).toISOString(),
                                        status: 'Not Started',
                                    };
                                    projectContext.onAddPhase(phaseToAdd);
                                    addedCount++;
                                }
                            });
                            confirmationText = `Successfully added ${addedCount} new phase(s) to the project plan.`;
                        } else {
                            confirmationText = "I couldn't add the new phases. The data seems to be missing or in the wrong format.";
                        }
                        break;
                    case 'update_phase':
                        if (!payload || !payload.phaseId || !payload.updates) {
                            confirmationText = "I need to know which phase to update and what to change. Please be more specific.";
                        } else {
                            const phaseToUpdate = projectContext.phases.find(p => p.id === payload.phaseId);
                            if (phaseToUpdate) {
                                projectContext.onUpdatePhase(phaseToUpdate.id, payload.updates);
                                confirmationText = `Phase "${phaseToUpdate.name}" has been successfully updated.`;
                            } else {
                                confirmationText = `I'm sorry, I couldn't find a phase with ID "${payload.phaseId}" to update.`;
                            }
                        }
                        break;
                    case 'delete_phase':
                        if (!payload || !payload.phaseId) {
                            confirmationText = "I need to know which phase to delete. Please specify the ID.";
                        } else {
                            const phaseToDelete = projectContext.phases.find(p => p.id === payload.phaseId);
                            if (phaseToDelete) {
                                projectContext.onDeletePhase(phaseToDelete.id);
                                confirmationText = `Phase "${phaseToDelete.name}" has been deleted from the project plan.`;
                            } else {
                                 confirmationText = `I'm sorry, I couldn't find a phase with ID "${payload.phaseId}" to delete.`;
                            }
                        }
                        break;
                    case 'set_budget':
                        if (payload && typeof payload.totalBudget === 'number') {
                            projectContext.onUpdateBudget({ totalBudget: payload.totalBudget }); 
                            confirmationText = `Project budget has been set to ${formatCurrency(payload.totalBudget, user?.settings)}.`;
                        } else {
                            confirmationText = "To set the budget, please provide a valid number.";
                        }
                        break;
                    case 'add_expense':
                        if (payload && typeof payload.amount === 'number' && payload.description) {
                            const expenseToAdd: Omit<ProjectExpense, 'id' | 'projectId'> = {
                                description: payload.description,
                                amount: payload.amount,
                                category: payload.category || 'Uncategorized',
                                date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
                            };
                            projectContext.onAddExpense(expenseToAdd); 
                            confirmationText = `Expense of ${formatCurrency(payload.amount, user?.settings)} for "${payload.description}" has been logged.`;
                        } else {
                            confirmationText = "To log an expense, please provide at least a description and an amount.";
                        }
                        break;
                    default:
                        confirmationText = `I'm not sure how to handle that project management action: ${action}.`;
                        break;
                }
            } else {
                 confirmationText = "I can only manage project plans from within a project's dedicated chat. Please navigate to the specific project to make these changes.";
            }
            break;
        }
    }

    if (confirmationText) {
        const confirmationMessage: ChatMessage = {
            role: 'model',
            text: confirmationText,
            timestamp: getLondonTimestamp(),
            employeeId: 'facilitator',
            employeeName: 'System',
        };
        const finalHistory = [...history, confirmationMessage];
        setHistory(finalHistory);
        onSaveHistory(finalHistory, contextId);
    }
    
    // Clear the tool view after approval
    setViewingToolOutput(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!userInput.trim() && !attachedFile) || isLoading || !isApiAvailable) return;
    const originalUserInput = userInput;

    onInteract(employee.id);
    
    let fileData: ChatMessage['file'];
    if (attachedFile && filePreview) {
        const base64String = filePreview.split(',')[1];
        fileData = {
            name: attachedFile.name,
            data: base64String,
            mimeType: attachedFile.type,
        };
    }

    const newUserMessage: ChatMessage = { role: 'user', text: originalUserInput, timestamp: getLondonTimestamp(), file: fileData };
    const updatedHistory = [...history, newUserMessage];
    setHistory(updatedHistory);
    setUserInput('');
    removeAttachedFile();
    setIsLoading(true);
    
    try {
        const finalSystemInstruction = getFinalSystemInstruction();
        const modelResponse = await continueConversation(updatedHistory, finalSystemInstruction);
        
        let toolTriggered: ToolOutput | undefined = undefined;
        let modelText = modelResponse;

        // Robustly find and parse a JSON tool call from the model's response.
        let jsonString: string | undefined;
        const markdownMatch = modelResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            jsonString = markdownMatch[1];
        } else {
            const startIndex = modelResponse.indexOf('{');
            const endIndex = modelResponse.lastIndexOf('}');
            if (startIndex !== -1 && endIndex > startIndex) {
                jsonString = modelResponse.substring(startIndex, endIndex + 1);
            }
        }

        if (jsonString) {
            try {
                const parsedResponse = JSON.parse(jsonString);
                if (parsedResponse.tool && parsedResponse.data && parsedResponse.text) {
                    toolTriggered = { 
                        tool: parsedResponse.tool, 
                        data: parsedResponse.data, 
                        text: parsedResponse.text 
                    };
                    modelText = parsedResponse.text;
                }
            } catch (error) {
                // Failed to parse, so we treat the whole response as plain text.
            }
        }
        
        const initialModelMessage: ChatMessage = { role: 'model' as const, text: modelText, timestamp: getLondonTimestamp(), toolTriggered };
        let finalHistory = [...updatedHistory, initialModelMessage];
        setHistory(finalHistory); // Show text response immediately
        
        if (toolTriggered?.tool === Tool.Document) {
            const { fileName, content } = toolTriggered.data;
            if (fileName && Array.isArray(content) && onAddFile && project) {
                onAddFile({
                    companyId: company.id,
                    parentId: project.id, // Saving to the root of the project
                    parentType: 'project',
                    type: 'file',
                    name: fileName,
                    content: JSON.stringify(content),
                    mimeType: 'application/json', // Internal rich text format
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authorId: employee.id,
                    authorName: employee.name,
                    status: 'Draft',
                });
            }
        } else if (toolTriggered?.tool === Tool.Collaboration) {
            const { employeeId, question } = toolTriggered.data;
            const collaborator = employees.find(e => e.id === employeeId);

            if (!collaborator) {
                 const errorHistory = [...updatedHistory, { role: 'model' as const, text: "I tried to find a colleague to help, but they seem to be unavailable right now.", timestamp: getLondonTimestamp() }];
                 setHistory(errorHistory);
                 onSaveHistory(errorHistory, contextId);
            } else {
                const askingHistory = [...updatedHistory, { ...initialModelMessage, toolTriggered: undefined }];
                setHistory(askingHistory);

                const collaboratorResponse = await getCollaboratorResponse(collaborator, question, company);

                const followUpText = `You asked your colleague, ${collaborator.name}, the following question: "${question}".\n\nThey responded with: "${collaboratorResponse}".\n\nNow, use this new information to construct your final, synthesized response to the user's original request. The user's original request was: "${originalUserInput}". Address the user directly.`;
                
                const followUpUserMessage: ChatMessage = { role: 'user', text: followUpText, timestamp: getLondonTimestamp() };
                const historyForFinalCall = [...updatedHistory, followUpUserMessage];
                
                const finalModelResponse = await continueConversation(historyForFinalCall, finalSystemInstruction);
                
                let finalToolTriggered: ToolOutput | undefined = undefined;
                let finalText = finalModelResponse;
                
                let finalJsonString: string | undefined;
                const finalMarkdownMatch = finalModelResponse.match(/```json\s*([\s\S]*?)\s*```/);
                if (finalMarkdownMatch && finalMarkdownMatch[1]) {
                    finalJsonString = finalMarkdownMatch[1];
                } else {
                    const finalStartIndex = finalModelResponse.indexOf('{');
                    const finalEndIndex = finalModelResponse.lastIndexOf('}');
                    if (finalStartIndex !== -1 && finalEndIndex > finalStartIndex) {
                        finalJsonString = finalModelResponse.substring(finalStartIndex, finalEndIndex + 1);
                    }
                }

                if (finalJsonString) {
                    try {
                      const finalParsed = JSON.parse(finalJsonString);
                      if (finalParsed.tool && finalParsed.data && finalParsed.text) {
                        finalToolTriggered = { tool: finalParsed.tool, data: finalParsed.data, text: finalParsed.text };
                        finalText = finalParsed.text;
                      }
                    } catch (e) { /* not a tool response */ }
                }

                finalHistory = [...askingHistory, { role: 'model' as const, text: finalText, timestamp: getLondonTimestamp(), toolTriggered: finalToolTriggered }];
                setHistory(finalHistory);
            }
        } else if (toolTriggered?.tool === Tool.Image) {
            const imagePrompt = toolTriggered.data.prompt;
            try {
                const imageBase64 = await generateImage(imagePrompt);
                const imageMessage: ChatMessage = {
                    role: 'model',
                    text: `Here is the image I generated for: "${imagePrompt}"`,
                    timestamp: getLondonTimestamp(),
                    generatedImageBase64: imageBase64
                };
                finalHistory = [...finalHistory, imageMessage];
                setHistory(finalHistory);
            } catch (imgError) {
                const errorMessageText = imgError instanceof ServiceError ? imgError.userMessage : 'I had trouble generating the image.';
                const errorMessage: ChatMessage = { role: 'model', text: errorMessageText, timestamp: getLondonTimestamp() };
                finalHistory = [...finalHistory, errorMessage];
                setHistory(finalHistory);
            }
        }
        onSaveHistory(finalHistory, contextId);
    } catch (error) {
        console.error("Failed to get model response:", error);
        const errorMessage = error instanceof ServiceError ? error.userMessage : 'An error occurred. Please try again.';
        const errorHistory = [...updatedHistory, { role: 'model' as const, text: errorMessage, timestamp: getLondonTimestamp() }];
        setHistory(errorHistory);
        onSaveHistory(errorHistory, contextId);
    } finally {
        setIsLoading(false);
    }
  };
  
  const renderToolIcon = (tool: Tool) => {
    switch(tool) {
      case Tool.Whiteboard: return <DiagramIcon className="w-4 h-4" />;
      case Tool.Kanban: return <KanbanIcon className="w-4 h-4" />;
      case Tool.Code: return <CodeIcon className="w-4 h-4" />;
      case Tool.Chart: return <ChartBarIcon className="w-4 h-4" />;
      case Tool.WordDocument: return <WordFileIcon className="w-4 h-4" />;
      case Tool.PowerPoint: return <PowerPointFileIcon className="w-4 h-4" />;
      case Tool.ExcelSheet: return <ExcelFileIcon className="w-4 h-4" />;
      case Tool.Document: return <FileIcon className="w-4 h-4" />;
      default: return null;
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.currentTarget.form?.requestSubmit();
    }
  };

  const handleSaveImageToProject = (imageBase64: string, originalPrompt: string) => {
    if (!project || !onAddFile) return;

    const fileName = `${originalPrompt.substring(0, 30).replace(/\s/g, '_')}_${Date.now()}.png`;

    onAddFile({
        companyId: project.companyId,
        parentId: project.id,
        parentType: 'project',
        type: 'file',
        name: fileName,
        content: imageBase64,
        mimeType: 'image/png',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    setImageSaveStates(prev => ({ ...prev, [imageBase64]: true }));
    setTimeout(() => {
        setImageSaveStates(prev => ({ ...prev, [imageBase64]: false }));
    }, 3000);
  };

  const handlePraiseClick = (messageTimestamp: string) => {
    const messageIndex = history.findIndex(m => m.timestamp === messageTimestamp);
    if (messageIndex === -1 || history[messageIndex].isPraised) {
      return; // Already praised or not found
    }
    
    onPraise(employee.id);
    
    const updatedHistory = history.map((msg, index) => 
        index === messageIndex ? { ...msg, isPraised: true } : msg
    );
    onSaveHistory(updatedHistory, contextId);

    setPraisedMessageTimestamp(messageTimestamp);
    setTimeout(() => {
        setPraisedMessageTimestamp(null);
    }, 2000); // Revert after 2 seconds
  };

  return (
    <div className="w-full flex flex-col h-full">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6 font-semibold">
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
        </button>
        <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
            {/* Left Pane: Chat */}
            <div className="bg-slate-800 p-6 w-full lg:w-1/2 flex flex-col h-[70vh]" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-center gap-4 border-b border-slate-700 pb-4 mb-4">
                  <img src={employee.avatarUrl} alt={employee.name} className="w-12 h-12 rounded-full bg-slate-700" />
                  <div>
                      <h2 className="text-xl font-bold text-white">{employee.name}</h2>
                      <p className="text-indigo-400 font-semibold text-sm">{employee.jobProfile}</p>
                      {project && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full max-w-fit" title={`Conversation focused on project: ${project.name}`}>
                              <ProjectsIcon className="w-4 h-4 text-slate-500" />
                              <span className="font-semibold">{project.name}</span>
                          </div>
                      )}
                  </div>
              </div>
              <div className="flex-grow overflow-y-auto pr-4 space-y-4">
                  {history.map((msg, index) => {
                      const isUser = msg.role === 'user';
                      const isJustPraised = praisedMessageTimestamp === msg.timestamp;
                      const isPraised = msg.isPraised;
                      const isCanvasTool = msg.toolTriggered && [
                          Tool.Whiteboard, Tool.Kanban, Tool.Code, Tool.Chart,
                          Tool.WordDocument, Tool.PowerPoint, Tool.ExcelSheet,
                          Tool.Calendar, Tool.CreateTask, Tool.ProjectManagement,
                      ].includes(msg.toolTriggered.tool);

                      return (
                          <div key={index} className={`flex items-end gap-2 ${isUser ? 'justify-end' : ''}`}>
                              {!isUser && msg.employeeId !== 'facilitator' && (
                                  <img src={employee.avatarUrl} alt={employee.name} className="w-8 h-8 rounded-full bg-slate-700 shrink-0" />
                              )}
                              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                  <div className={`group max-w-md p-3 ${isUser ? 'bg-indigo-600 text-white' : (msg.employeeId === 'facilitator' ? 'bg-slate-800 italic' : 'bg-slate-700 text-slate-200')}`} style={{ borderRadius: 'var(--radius-md)' }}>
                                      {msg.file && (
                                          msg.file.mimeType.startsWith('image/') ? (
                                            <img 
                                                src={`data:${msg.file.mimeType};base64,${msg.file.data}`} 
                                                alt={msg.file.name}
                                                className="mb-2 rounded-lg max-w-xs max-h-60 object-contain"
                                            />
                                          ) : (
                                            <div className="mb-2 p-3 bg-indigo-700 rounded-lg border border-indigo-500 flex items-center gap-3">
                                                <FileIcon className="w-8 h-8 text-indigo-300 flex-shrink-0" />
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-semibold text-white truncate">{msg.file.name}</p>
                                                    <p className="text-xs text-indigo-200">{msg.file.mimeType}</p>
                                                </div>
                                            </div>
                                          )
                                      )}
                                      <div className="flex items-start gap-2">
                                        <p className="whitespace-pre-wrap flex-1">{msg.text}</p>
                                        {msg.toolTriggered && (
                                          <div className="p-1 bg-black/20 rounded-full text-indigo-300" title={`Used ${msg.toolTriggered.tool} tool`}>
                                            {renderToolIcon(msg.toolTriggered.tool)}
                                          </div>
                                        )}
                                      </div>
                                       {msg.generatedImageBase64 && (
                                        <div className="mt-2">
                                            <img 
                                                src={`data:image/png;base64,${msg.generatedImageBase64}`} 
                                                alt="Generated by AI"
                                                className="rounded-lg max-w-xs max-h-60 object-contain"
                                            />
                                            {project && (
                                                <button
                                                    onClick={() => handleSaveImageToProject(msg.generatedImageBase64!, msg.text)}
                                                    disabled={imageSaveStates[msg.generatedImageBase64]}
                                                    className="mt-2 text-xs px-3 py-1.5 bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors rounded-md disabled:bg-green-800 disabled:text-green-400"
                                                >
                                                    {imageSaveStates[msg.generatedImageBase64] ? 'Saved!' : 'Save to Project'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {isCanvasTool && (
                                        <div className="mt-2 pt-2 border-t border-black/20 w-full">
                                            <button
                                                onClick={() => setViewingToolOutput(msg.toolTriggered!)}
                                                className="text-xs px-3 py-1.5 bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors rounded-md w-full text-center"
                                            >
                                                View in Canvas
                                            </button>
                                        </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-500 mt-1 px-1">{msg.employeeId === 'facilitator' ? 'System' : formatTimestamp(msg.timestamp, user?.settings)}</p>
                                    {!isUser && msg.employeeId !== 'facilitator' && (
                                      isJustPraised ? (
                                        <div className="flex items-center gap-1 p-1 text-green-400">
                                            <CheckIcon className="w-4 h-4" />
                                            <span className="text-xs font-semibold">Praised!</span>
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={() => handlePraiseClick(msg.timestamp)}
                                          disabled={isPraised}
                                          className={`p-1 rounded-full transition-opacity ${
                                              isPraised 
                                              ? 'text-green-400 cursor-default' 
                                              : 'text-slate-500 hover:text-green-400 hover:bg-slate-600/50'
                                          }`}
                                          title={isPraised ? "Praised" : "Praise this response"}
                                        >
                                            <ThumbUpIcon className="w-4 h-4" />
                                        </button>
                                      )
                                    )}
                                  </div>
                              </div>
                              {isUser && user && (
                                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                              )}
                          </div>
                      );
                  })}
                  {isLoading && (
                  <div className="flex justify-start">
                      <div className="max-w-md p-3 bg-slate-700 text-slate-200" style={{ borderRadius: 'var(--radius-md)' }}>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                      </div>
                      </div>
                  </div>
                  )}
                  <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-700">
                  {attachedFile && filePreview && (
                    <div className="relative mb-2 p-2 border border-slate-600 rounded-lg bg-slate-700/50 max-w-xs">
                        {attachedFile.type.startsWith('image/') ? (
                            <img src={filePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <FileIcon className="w-10 h-10 text-slate-400 flex-shrink-0" />
                                <div className="overflow-hidden">
                                    <p className="text-sm font-semibold text-white truncate">{attachedFile.name}</p>
                                    <p className="text-xs text-slate-400">{Math.round(attachedFile.size / 1024)} KB</p>
                                </div>
                            </div>
                        )}
                        <button type="button" onClick={removeAttachedFile} className="absolute -top-2 -right-2 bg-slate-600 rounded-full p-0.5 text-white hover:bg-slate-500 z-10">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.txt,.md,.json,.csv,.docx,.xlsx,.pptx" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white flex-shrink-0" title="Attach file" style={{ borderRadius: 'var(--radius-sm)' }}>
                        <PaperClipIcon className="w-5 h-5" />
                    </button>
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isApiAvailable ? `Message ${employee.name.split(' ')[0]}...` : `${employee.name.split(' ')[0]} is resting until tomorrow...`}
                        className="flex-1 bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none overflow-y-auto disabled:bg-slate-700/50"
                        style={{ borderRadius: 'var(--radius-md)', maxHeight: '150px' }}
                        disabled={isLoading || !isApiAvailable}
                    />
                    <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-500 flex-shrink-0" style={{ borderRadius: 'var(--radius-sm)' }} disabled={isLoading || (!userInput.trim() && !attachedFile) || !isApiAvailable}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </button>
                  </div>
              </form>
            </div>

            {/* Right Pane: Tools */}
            <div className="w-full lg:w-1/2 h-[70vh]">
                {viewingToolOutput ? (
                    <ToolView 
                        toolOutput={viewingToolOutput}
                        project={project}
                        projectPhases={projectContext?.phases}
                        onApproveAndSaveDocument={handleApproveAndSaveDocument}
                        onApproveDataChange={handleApproveDataChange}
                        projects={projects}
                        onAddFile={onAddFile}
                        onUpdateFile={onUpdateFile}
                        files={files}
                        companyId={company.id}
                        onClose={() => setViewingToolOutput(null)}
                    />
                ) : (
                    <GeneratedDocumentsPanel
                        companyId={company.id}
                        generatedDocuments={generatedDocuments}
                        projects={projects}
                        onAddFile={onAddFile}
                        onUpdateFile={onUpdateFile}
                        files={files}
                    />
                )}
            </div>
        </div>
    </div>
  );
};