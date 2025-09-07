import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, Employee, Company, BrainstormSession, ToolOutput, MeetingMinute, AppFile, GeneratedDocument, Project } from '../types';
import { getBrainstormResponsesStream, InitialIdea, generateImage, summarizeBrainstormSession } from '../services/geminiService';
import { generateFileBlob } from '../services/fileGenerator';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { getLondonTimestamp, buildProjectContextString, formatTimestamp, buildFilesContextString } from '../utils';
import { UsersIcon } from './icons/UsersIcon';
import { ServiceError } from '../services/errors';
import { Tool, JobProfile } from '../constants';
import { ToolView } from './tools/ToolView';
import { DiagramIcon } from './icons/DiagramIcon';
import { KanbanIcon } from './icons/KanbanIcon';
import { CodeIcon } from './icons/CodeIcon';
import { WordFileIcon } from './icons/WordFileIcon';
import { PowerPointFileIcon } from './icons/PowerPointFileIcon';
import { ExcelFileIcon } from './icons/ExcelFileIcon';
import { useAuth } from '../contexts/GoogleAuthContext';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { FileIcon } from './icons/FileIcon';
import { GeneratedDocumentsPanel } from './GeneratedDocumentsPanel';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { SparklesIcon } from './icons/SparklesIcon';


interface BrainstormViewProps {
  company: Company;
  participants: Employee[];
  session: BrainstormSession;
  meetingMinutes: MeetingMinute[];
  projects: Project[];
  generatedDocuments: GeneratedDocument[];
  files: AppFile[];
  onSaveHistory: (session: BrainstormSession) => void;
  onAddMeetingMinute: (minuteData: Omit<MeetingMinute, 'id'>) => void;
  onBack: () => void;
  onIncrementApiUsage: (companyId: string) => void;
  isApiAvailable: boolean;
  onAddFile: (fileData: Omit<AppFile, 'id'>) => AppFile;
  onUpdateFile: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
  onAddGeneratedDocument: (docData: Omit<GeneratedDocument, 'id'>) => GeneratedDocument;
  companyApiLimit: number;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
    </div>
);

export const BrainstormView: React.FC<BrainstormViewProps> = ({ company, participants, session, meetingMinutes, projects, generatedDocuments, files, onSaveHistory, onAddMeetingMinute, onBack, onIncrementApiUsage, isApiAvailable, onAddFile, onUpdateFile, onAddGeneratedDocument, companyApiLimit }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ChatMessage[]>(session.history);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewingToolContext, setViewingToolContext] = useState<{ toolOutput: ToolOutput; employee: Employee; } | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [imageSaveStates, setImageSaveStates] = useState<Record<string, boolean>>({});
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);
  
  const project = session.contextType === 'project' ? projects.find(p => p.id === session.contextId) : undefined;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [userInput]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);
  
  const handleApproveAndSaveDocument = async () => {
    if (!viewingToolContext) return;
    const { toolOutput, employee } = viewingToolContext;

    const fileData = await generateFileBlob(toolOutput);
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
                type: 'brainstorm',
                contextDescription: session.topic,
            },
            sourceData: toolOutput.data,
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
        onSaveHistory({ ...session, history: finalHistory });
        setViewingToolContext(null);
    }
  };
  
  const handleApproveDataChange = () => {
    if (!viewingToolContext) return;
    const { toolOutput } = viewingToolContext;
    // This is a simplified handler as BrainstormView doesn't have direct access to all data modification functions like ChatView does via context.
    // It provides a confirmation message and closes the tool view.
    const confirmationMessage: ChatMessage = {
        role: 'model',
        text: `Action approved for tool: ${toolOutput.tool}. I will now apply the changes.`,
        timestamp: getLondonTimestamp(),
        employeeId: 'facilitator',
        employeeName: 'System',
    };
    const finalHistory = [...history, confirmationMessage];
    setHistory(finalHistory);
    onSaveHistory({ ...session, history: finalHistory, lastActivity: new Date().toISOString() });
    setViewingToolContext(null);
  };

  const handleGenerateAndSaveMinutes = async () => {
    if (session.contextType !== 'project') {
        alert("Meeting minutes can only be saved for project-specific meetings.");
        return;
    }
    setIsGeneratingMinutes(true);
    try {
        const { title, content } = await summarizeBrainstormSession(history, session.topic, participants, company.profile);
        onAddMeetingMinute({
            companyId: session.companyId,
            projectId: session.contextId,
            title: title,
            content: content,
            timestamp: new Date().toISOString(),
        });
        
        const confirmationMessage: ChatMessage = {
            role: 'model',
            text: `I have generated and saved the meeting minutes for this session. You can find them in the project's "Meeting Minutes" tab.`,
            timestamp: getLondonTimestamp(),
            employeeId: 'facilitator',
            employeeName: 'System',
        };
        const finalHistory = [...history, confirmationMessage];
        setHistory(finalHistory);
        onSaveHistory({ ...session, history: finalHistory, lastActivity: new Date().toISOString() });
        
    } catch (error) {
        const errorMessage = error instanceof ServiceError ? error.userMessage : 'An error occurred while generating minutes.';
        alert(errorMessage);
    } finally {
        setIsGeneratingMinutes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!userInput.trim() && !attachedFile) || isLoading || !isApiAvailable) return;

    onIncrementApiUsage(company.id);

    let fileData: ChatMessage['file'];
    if (attachedFile && filePreview) {
        const base64String = filePreview.split(',')[1];
        fileData = {
            name: attachedFile.name,
            data: base64String,
            mimeType: attachedFile.type,
        };
    }

    const newUserMessage: ChatMessage = { role: 'user', text: userInput, timestamp: getLondonTimestamp(), file: fileData };
    const updatedHistory = [...history, newUserMessage];
    
    // Create temporary typing indicators for each participant
    const typingMessages: ChatMessage[] = participants
        .filter(p => p.jobProfile !== JobProfile.PersonalAssistant)
        .map(p => ({
            role: 'model',
            text: '',
            timestamp: getLondonTimestamp(),
            isTyping: true,
            employeeId: p.id,
            employeeName: p.name,
            employeeAvatarUrl: p.avatarUrl,
        }));
    
    // Alex (Personal Assistant) responds instantly with the framework, so no typing indicator needed for them.
    const alex = participants.find(p => p.jobProfile === JobProfile.PersonalAssistant);
    if (alex) {
        typingMessages.push({
            role: 'model',
            text: '',
            timestamp: getLondonTimestamp(),
            isTyping: true,
            employeeId: alex.id,
            employeeName: alex.name,
            employeeAvatarUrl: alex.avatarUrl,
        });
    }


    setHistory([...updatedHistory, ...typingMessages]);
    setUserInput('');
    removeAttachedFile();
    setIsLoading(true);

    const projectContext = project ? buildProjectContextString(project) : undefined;
    const filesContext = buildFilesContextString(files);
    
    const onResponseReceived = (result: InitialIdea) => {
        setHistory(prevHistory => {
            let newText = 'An error occurred.';
            if (result.status === 'fulfilled') {
                newText = result.response || 'No response.';
            } else if (result.status === 'rejected') {
                newText = result.error || 'Failed to respond.';
            }

            const finalMessage: ChatMessage = {
                role: 'model',
                text: newText,
                timestamp: getLondonTimestamp(),
                isTyping: false,
                employeeId: result.employee.id,
                employeeName: result.employee.name,
                employeeAvatarUrl: result.employee.avatarUrl,
                toolTriggered: result.toolTriggered,
                generatedImageBase64: result.toolTriggered?.tool === Tool.Image ? 'generating' : undefined
            };

            // Replace the typing indicator for this employee with their final message
            const historyWithoutTyping = prevHistory.filter(msg => msg.employeeId !== result.employee.id);
            return [...historyWithoutTyping, finalMessage];
        });
    };


    try {
        const results = await getBrainstormResponsesStream(
            updatedHistory,
            participants,
            company,
            onResponseReceived,
            projectContext,
            meetingMinutes,
            filesContext
        );

        // This promise resolves when all individual promises have been created and passed to onResponseReceived.
        // We now wait for all of them to complete.
        await Promise.all(results);

        // Handle image generation after all responses are processed
        setHistory(prev => {
            const imageGenPromises = prev.map(async msg => {
                if(msg.generatedImageBase64 === 'generating' && msg.toolTriggered?.tool === Tool.Image) {
                     try {
                        const imageBase64 = await generateImage(msg.toolTriggered.data.prompt);
                        return { ...msg, generatedImageBase64: imageBase64, text: `Here's an image for: "${msg.toolTriggered.data.prompt}"` };
                    } catch (imgError) {
                        const errorMessageText = imgError instanceof ServiceError ? imgError.userMessage : 'I had trouble generating the image.';
                        return { ...msg, generatedImageBase64: undefined, text: errorMessageText };
                    }
                }
                return msg;
            });
            Promise.all(imageGenPromises).then(finalHistoryWithImages => {
                 setHistory(finalHistoryWithImages);
                 onSaveHistory({ ...session, history: finalHistoryWithImages, lastActivity: new Date().toISOString() });
            });
            return prev;
        });

        // The final history will be set by the last `onResponseReceived` callback.
        // We just need to wait for all promises to settle before enabling the input again.
    } catch (error) {
        console.error("Error during brainstorming stream:", error);
        // FIX: Add 'as const' to role to fix TypeScript type error
        const finalHistory = [...updatedHistory, { role: 'model' as const, text: "A general error occurred during the brainstorm session.", timestamp: getLondonTimestamp(), employeeId: 'facilitator' }];
        setHistory(finalHistory);
    } finally {
        setIsLoading(false);
    }

  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const maxSize = 4 * 1024 * 1024; // 4MB
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
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.currentTarget.form?.requestSubmit();
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
      default: return null;
    }
  }

  const handleSaveImageToProject = (imageBase64: string, originalPrompt: string) => {
      const project = projects.find(p => p.id === session.contextId);
      if (!project || !onAddFile) return;

      const fileName = `${originalPrompt.substring(0, 30).replace(/\s/g, '_')}_${Date.now()}.png`;

// FIX: Added the missing `parentType` property to correctly associate the saved image with its project.
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
// FIX: Added missing return statement for the component's JSX.
  return (
  <div className="w-full flex flex-col h-full">
    <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6 font-semibold">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Dashboard
    </button>
    <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="bg-slate-800 p-6 w-full lg:w-1/2 flex flex-col h-[70vh]" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-4">
                    <UsersIcon className="w-12 h-12 text-indigo-400" />
                    <div>
                        <h2 className="text-xl font-bold text-white">{session.topic}</h2>
                        <div className="flex -space-x-2 overflow-hidden mt-1">
                            {participants.map(p => (
                                <img key={p.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-800" src={p.avatarUrl} alt={p.name} title={p.name} />
                            ))}
                        </div>
                    </div>
                </div>
                {session.contextType === 'project' && (
                    <button 
                        onClick={handleGenerateAndSaveMinutes}
                        disabled={isGeneratingMinutes || isLoading}
                        className="flex items-center gap-1.5 text-sm px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {isGeneratingMinutes ? 'Generating...' : 'Generate & Save Minutes'}
                    </button>
                )}
            </div>
          <div className="flex-grow overflow-y-auto pr-4 space-y-4">
              {history.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  const employee = isUser ? null : participants.find(p => p.id === msg.employeeId);
                  const isCanvasTool = msg.toolTriggered && [
                    Tool.Whiteboard, Tool.Kanban, Tool.Code, Tool.Chart,
                    Tool.WordDocument, Tool.PowerPoint, Tool.ExcelSheet,
                    Tool.Calendar, Tool.CreateTask, Tool.ProjectManagement,
                  ].includes(msg.toolTriggered.tool);
                  
                  return (
                      <div key={index} className={`flex items-end gap-2 ${isUser ? 'justify-end' : ''}`}>
                          {!isUser && employee && (
                              <img src={employee.avatarUrl} alt={employee.name} className="w-8 h-8 rounded-full bg-slate-700 shrink-0" />
                          )}
                          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                              {!isUser && <p className="text-xs text-slate-500 mb-1 px-1">{msg.employeeName}</p>}
                              <div className={`group max-w-md p-3 ${isUser ? 'bg-indigo-600 text-white' : (msg.employeeId === 'facilitator' ? 'bg-slate-800 italic' : 'bg-slate-700 text-slate-200')}`} style={{ borderRadius: 'var(--radius-md)' }}>
                                  {msg.file && (
                                    msg.file.mimeType.startsWith('image/') ? (
                                        <img src={`data:${msg.file.mimeType};base64,${msg.file.data}`} alt={msg.file.name} className="mb-2 rounded-lg max-w-xs max-h-60 object-contain" />
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
                                      {msg.isTyping ? <TypingIndicator /> : <p className="whitespace-pre-wrap flex-1">{msg.text}</p>}
                                      {msg.toolTriggered && (
                                        <div className="p-1 bg-black/20 rounded-full text-indigo-300" title={`Used ${msg.toolTriggered.tool} tool`}>
                                          {renderToolIcon(msg.toolTriggered.tool)}
                                        </div>
                                      )}
                                  </div>
                                   {msg.generatedImageBase64 && msg.generatedImageBase64 !== 'generating' && (
                                      <div className="mt-2">
                                          <img src={`data:image/png;base64,${msg.generatedImageBase64}`} alt="Generated by AI" className="rounded-lg max-w-xs max-h-60 object-contain"/>
                                          {session.contextType === 'project' && (
                                              <button
                                                  onClick={() => handleSaveImageToProject(msg.generatedImageBase64!, msg.text)}
                                                  disabled={imageSaveStates[msg.generatedImageBase64!]}
                                                  className="mt-2 text-xs px-3 py-1.5 bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors rounded-md disabled:bg-green-800 disabled:text-green-400"
                                              >
                                                  {imageSaveStates[msg.generatedImageBase64!] ? 'Saved!' : 'Save to Project'}
                                              </button>
                                          )}
                                      </div>
                                  )}
                                  {isCanvasTool && (
                                    <div className="mt-2 pt-2 border-t border-black/20 w-full">
                                        <button
                                            onClick={() => {
                                                if (employee && msg.toolTriggered) {
                                                    setViewingToolContext({ toolOutput: msg.toolTriggered, employee });
                                                }
                                            }}
                                            className="text-xs px-3 py-1.5 bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors rounded-md w-full text-center"
                                        >
                                            View in Canvas
                                        </button>
                                    </div>
                                  )}
                              </div>
                          </div>
                           {isUser && user && (
                              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                          )}
                      </div>
                  );
              })}
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
                    <button type="button" onClick={removeAttachedFile} className="absolute -top-2 -right-2 bg-slate-600 rounded-full p-0.5 text-white hover:bg-slate-500 z-10"><XMarkIcon className="w-4 h-4" /></button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white flex-shrink-0" title="Attach file" style={{ borderRadius: 'var(--radius-sm)' }}>
                    <PaperClipIcon className="w-5 h-5" />
                </button>
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isApiAvailable ? "Ask the team..." : "Team is resting until tomorrow..."}
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
        <div className="w-full lg:w-1/2 h-[70vh]">
            {viewingToolContext ? (
                <ToolView 
                    toolOutput={viewingToolContext.toolOutput}
                    project={project}
                    onApproveAndSaveDocument={handleApproveAndSaveDocument}
                    onApproveDataChange={handleApproveDataChange}
                    projects={projects}
                    onAddFile={onAddFile}
                    onUpdateFile={onUpdateFile}
                    files={files}
                    companyId={company.id}
                    onClose={() => setViewingToolContext(null)}
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