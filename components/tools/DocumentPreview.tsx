import React, { useState } from 'react';
import type { ToolOutput, Project, AppFile } from '../../types';
import { Tool } from '../../constants';
import { generateFileBlob } from '../../services/fileGenerator';
import { findUniqueFileName } from '../../utils';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { FolderPlusIcon } from '../icons/FolderPlusIcon';
import { AddToProjectModal } from '../AddToProjectModal';
import { DuplicateFileModal } from '../DuplicateFileModal';

interface DocumentPreviewProps {
    toolOutput: ToolOutput;
    onApproveAndSave?: () => void;
    projects?: Project[];
    onAddFile?: (fileData: Omit<AppFile, 'id'>) => AppFile;
    onUpdateFile?: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
    files?: AppFile[];
    companyId?: string;
}

const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ toolOutput, onApproveAndSave, projects, onAddFile, onUpdateFile, files = [], companyId }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isHistorySaved, setIsHistorySaved] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [duplicateFileConflict, setDuplicateFileConflict] = useState<{
        projectId: string;
        existingFile: AppFile;
    } | null>(null);
    
    const handleDownload = async () => {
        setIsDownloading(true);
        const fileData = await generateFileBlob(toolOutput);
        if (fileData) {
            downloadFile(fileData.blob, fileData.fileName);
        }
        setIsDownloading(false);
    };
    
    const handleSaveToHistory = () => {
        if (onApproveAndSave) {
            onApproveAndSave();
            setIsHistorySaved(true);
            // Parent component will close this view.
        }
    };

    const handleConfirmAddToProject = async (projectId: string) => {
        if (!onAddFile || !companyId || !onApproveAndSave) return;
        
        const projectFiles = files.filter(f => f.parentId === projectId && f.parentType === 'project' && !f.isArchived);
        const existingFile = projectFiles.find(f => f.name === toolOutput.data.fileName);

        setIsProjectModalOpen(false);

        if (existingFile) {
            setDuplicateFileConflict({ projectId, existingFile });
        } else {
            const fileData = await generateFileBlob(toolOutput);
            if (!fileData) return;
            // FIX: Added missing `type` property to correctly categorize the new file.
            onAddFile({
                companyId,
                parentId: projectId,
                parentType: 'project',
                type: 'file',
                name: fileData.fileName,
                content: fileData.base64Content,
                mimeType: fileData.mimeType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            onApproveAndSave();
        }
    };

    const handleOverwrite = async () => {
        if (!duplicateFileConflict || !onUpdateFile || !onApproveAndSave) return;
        const { existingFile } = duplicateFileConflict;

        const fileData = await generateFileBlob(toolOutput);
        if (!fileData) return;
        
        onUpdateFile(existingFile.id, {
            content: fileData.base64Content,
            updatedAt: new Date().toISOString(),
        });
        setDuplicateFileConflict(null);
        onApproveAndSave();
    };

    const handleSaveAsCopy = async () => {
        if (!duplicateFileConflict || !onAddFile || !onApproveAndSave || !companyId) return;
        const { projectId } = duplicateFileConflict;

        const fileData = await generateFileBlob(toolOutput);
        if (!fileData) return;
        
        const projectFileNames = files
            .filter(f => f.parentId === projectId && f.parentType === 'project')
            .map(f => f.name);
            
        const newName = findUniqueFileName(fileData.fileName, projectFileNames);

        // FIX: Added missing `type` property to correctly categorize the new file.
        onAddFile({
            companyId,
            parentId: projectId,
            parentType: 'project',
            type: 'file',
            name: newName,
            content: fileData.base64Content,
            mimeType: fileData.mimeType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        setDuplicateFileConflict(null);
        onApproveAndSave();
    };


    const renderContent = () => {
        const { tool, data } = toolOutput;
        switch (tool) {
            case Tool.WordDocument:
                return data.content?.map((item: { type: string; text: string }, index: number) => {
                    if (item.type === 'heading1') {
                        return <h1 key={index} className="text-2xl font-bold text-white mb-2">{item.text}</h1>;
                    }
                    return <p key={index} className="text-slate-300 mb-2">{item.text}</p>;
                });
            case Tool.PowerPoint:
                return data.slides?.map((slide: { title: string; content: string }, index: number) => (
                    <div key={index} className="mb-4 pb-2 border-b border-slate-700 last:border-b-0">
                        <h2 className="text-xl font-semibold text-white mb-1">{slide.title}</h2>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                            {slide.content?.split('\n').map((point, i) => point.trim() && <li key={i}>{point}</li>)}
                        </ul>
                    </div>
                ));
            case Tool.ExcelSheet:
                return data.sheets?.map((sheet: { name: string; data: (string | number)[][] }, index: number) => (
                    <div key={index} className="mb-4">
                        <h3 className="text-lg font-semibold text-white mb-2">{sheet.name}</h3>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr>
                                    {sheet.data[0]?.map((header, i) => <th key={i} className="bg-slate-800 p-2 border border-slate-700">{header}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {sheet.data.slice(1)?.map((row, i) => (
                                    <tr key={i}>
                                        {row.map((cell, j) => <td key={j} className="p-2 border border-slate-700">{cell}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ));
            default:
                return null;
        }
    };

    return (
        <>
            {projects && <AddToProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                projects={projects}
                onConfirm={handleConfirmAddToProject}
            />}
            <DuplicateFileModal
                isOpen={!!duplicateFileConflict}
                fileName={toolOutput.data.fileName}
                onOverwrite={handleOverwrite}
                onSaveAsCopy={handleSaveAsCopy}
                onCancel={() => setDuplicateFileConflict(null)}
            />
            <div className="flex flex-col h-full w-full">
                <div className="p-4 border-b border-slate-700 flex-shrink-0 flex justify-between items-center">
                    <h3 className="font-bold text-slate-300">{toolOutput.data.fileName || 'Document Preview'}</h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleDownload} 
                            disabled={isDownloading}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-600 text-white font-semibold hover:bg-slate-500 transition-colors"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            {isDownloading ? 'Downloading...' : 'Download'}
                        </button>
                        {onApproveAndSave && (
                            <button 
                                onClick={handleSaveToHistory} 
                                disabled={isHistorySaved}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-600 text-white font-semibold hover:bg-slate-500 transition-colors"
                            >
                                {isHistorySaved ? <><CheckIcon className="w-4 h-4" /> Saved</> : <><SaveIcon className="w-4 h-4" /> Save to History</>}
                            </button>
                        )}
                         {projects && projects.length > 0 && onAddFile && onApproveAndSave && (
                            <button 
                                onClick={() => setIsProjectModalOpen(true)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
                            >
                                <FolderPlusIcon className="w-4 h-4" />
                                Save to Project...
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-4 overflow-auto h-full w-full bg-slate-900 rounded-b-xl">
                    {renderContent()}
                </div>
            </div>
        </>
    );
};