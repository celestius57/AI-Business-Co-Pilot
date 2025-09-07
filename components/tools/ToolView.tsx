import React, { useState, useEffect } from 'react';
import type { ToolOutput, ProjectPhase, AppFile, Project } from '../../types';
import { Tool as ToolEnum } from '../../constants';
import { Whiteboard } from './Whiteboard';
import { KanbanBoard } from './KanbanBoard';
import { CodeViewer } from './CodeViewer';
import { SparklesIcon } from '../icons/SparklesIcon';
import { DocumentPreview } from './DocumentPreview';
import { DataChangePreview } from './DataChangePreview';
import { SaveIcon } from '../icons/SaveIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { XMarkIcon } from '../icons/XMarkIcon';
import { Chart } from './Chart';

interface ToolViewProps {
  toolOutput: ToolOutput | null;
  projectPhases?: ProjectPhase[];
  onApproveAndSaveDocument?: () => void;
  onApproveDataChange?: () => void;
  project?: Project;
  projects?: Project[];
  onAddFile?: (fileData: Omit<AppFile, 'id'>) => AppFile;
  onUpdateFile?: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
  files?: AppFile[];
  companyId?: string;
  onClose: () => void;
}

export const ToolView: React.FC<ToolViewProps> = ({ toolOutput, projectPhases, onApproveAndSaveDocument, onApproveDataChange, project, projects, onAddFile, onUpdateFile, files, companyId, onClose }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isSvgSaved, setIsSvgSaved] = useState(false);

  useEffect(() => {
    if (toolOutput?.tool !== ToolEnum.Whiteboard) {
      setSvgContent(null);
      setIsSvgSaved(false);
    }
  }, [toolOutput]);
  
  const handleSaveSvgToProject = async () => {
    if (!svgContent || !project || !onAddFile) return;

    const fileName = `whiteboard-diagram-${Date.now()}.svg`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });

    const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',', 2)[1];
            resolve(base64);
        };
        reader.readAsDataURL(blob);
    });

    const base64Content = await blobToBase64(blob);

    onAddFile({
      companyId: project.companyId,
      parentId: project.id,
      parentType: 'project',
      type: 'file',
      name: fileName,
      content: base64Content,
      mimeType: 'image/svg+xml',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setIsSvgSaved(true);
    setTimeout(() => setIsSvgSaved(false), 2000);
  };

  const renderTool = () => {
    if (!toolOutput) return null;
    
    const dataChangeTools = [ToolEnum.ProjectManagement, ToolEnum.Calendar, ToolEnum.CreateTask];
    
    if (dataChangeTools.includes(toolOutput.tool) && onApproveDataChange) {
        return <DataChangePreview toolOutput={toolOutput} onApprove={onApproveDataChange} projectPhases={projectPhases} />;
    }

    switch (toolOutput.tool) {
      case ToolEnum.Whiteboard:
        return <Whiteboard data={toolOutput.data} onContentReady={setSvgContent} />;
      case ToolEnum.Kanban:
        return <KanbanBoard data={toolOutput.data} />;
      case ToolEnum.Code:
        return <CodeViewer data={toolOutput.data} />;
      case ToolEnum.Chart:
        return <Chart data={toolOutput.data} />;
      case ToolEnum.Document:
        return null; // This tool is handled directly in ChatView and doesn't use the canvas
      case ToolEnum.WordDocument:
      case ToolEnum.PowerPoint:
      case ToolEnum.ExcelSheet:
        return <DocumentPreview 
                    toolOutput={toolOutput} 
                    onApproveAndSave={onApproveAndSaveDocument}
                    projects={projects}
                    onAddFile={onAddFile}
                    onUpdateFile={onUpdateFile}
                    files={files}
                    companyId={companyId}
                />;
      default:
        return (
             <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
                <SparklesIcon className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-semibold mb-1">AI Tool Canvas</h3>
                <p>The AI can use this space to generate diagrams, documents, and other visual aids.</p>
            </div>
        );
    }
  };

  return (
    <div className="bg-slate-800 h-full w-full flex flex-col" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-indigo-400"/>
                AI Tool Canvas
            </h2>
            <div className="flex items-center gap-2">
                {toolOutput?.tool === ToolEnum.Whiteboard && svgContent && project && onAddFile && (
                    <button 
                        onClick={handleSaveSvgToProject}
                        disabled={isSvgSaved}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors"
                        style={{ borderRadius: 'var(--radius-sm)' }}
                    >
                        {isSvgSaved ? <><CheckIcon className="w-4 h-4" /> Saved</> : <><SaveIcon className="w-4 h-4" /> Save Diagram</>}
                    </button>
                )}
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-white" title="Close Canvas">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
        <div className="flex-grow min-h-0">
            {renderTool() || (
                 <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
                    <SparklesIcon className="w-12 h-12 mb-4" />
                    <h3 className="text-lg font-semibold mb-1">AI Tool Canvas</h3>
                    <p>The AI can use this space to generate diagrams, documents, and other visual aids.</p>
                </div>
            )}
        </div>
    </div>
  );
};