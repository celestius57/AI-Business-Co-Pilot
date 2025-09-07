import React, { useState, useMemo } from 'react';
import type { User, GeneratedDocument, Project, AppFile } from '../types';
import { useAuth } from '../contexts/GoogleAuthContext';
import { formatTimestamp, findUniqueFileName } from '../utils';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { WordFileIcon } from './icons/WordFileIcon';
import { PowerPointFileIcon } from './icons/PowerPointFileIcon';
import { ExcelFileIcon } from './icons/ExcelFileIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { CheckIcon } from './icons/CheckIcon';
import { AddToProjectModal } from './AddToProjectModal';
import { DuplicateFileModal } from './DuplicateFileModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { EyeIcon } from './icons/EyeIcon';

interface GeneratedDocumentsPanelProps {
  companyId: string;
  generatedDocuments: GeneratedDocument[];
  projects: Project[];
  files: AppFile[];
  onAddFile: (fileData: Omit<AppFile, 'id'>) => AppFile;
  onUpdateFile: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
}

export const GeneratedDocumentsPanel: React.FC<GeneratedDocumentsPanelProps> = ({ companyId, generatedDocuments, projects, files, onAddFile, onUpdateFile }) => {
    const { user } = useAuth();
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<GeneratedDocument | null>(null);
    const [showAddedConfirm, setShowAddedConfirm] = useState(false);
    const [duplicateFileConflict, setDuplicateFileConflict] = useState<{
        doc: GeneratedDocument;
        projectId: string;
        existingFile: AppFile;
    } | null>(null);
    const [previewingDoc, setPreviewingDoc] = useState<GeneratedDocument | null>(null);

    const timeframe = user?.settings?.generatedDocsTimeframe ?? 30;

    const filteredDocs = useMemo(() => {
        const companyDocs = generatedDocuments.filter(d => d.companyId === companyId);
        if (timeframe === 0) return companyDocs;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - timeframe);
        return companyDocs.filter(d => new Date(d.createdAt) >= cutoff);
    }, [generatedDocuments, companyId, timeframe]);

    const handleDownload = (doc: GeneratedDocument) => {
        const byteCharacters = atob(doc.base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: doc.mimeType });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleOpenAddToProject = (doc: GeneratedDocument) => {
        setSelectedDoc(doc);
        setIsProjectModalOpen(true);
    };

    const handleConfirmAddToProject = (projectId: string) => {
        if (!selectedDoc) return;

        const projectFiles = files.filter(f => f.parentId === projectId && f.parentType === 'project' && !f.isArchived);
        const existingFile = projectFiles.find(f => f.name === selectedDoc.fileName);

        if (existingFile) {
            setDuplicateFileConflict({ doc: selectedDoc, projectId, existingFile });
        } else {
            // FIX: Added missing `type` property to correctly categorize the new file.
            onAddFile({
                companyId: selectedDoc.companyId,
                parentId: projectId,
                parentType: 'project',
                type: 'file',
                name: selectedDoc.fileName,
                content: selectedDoc.base64Content,
                mimeType: selectedDoc.mimeType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            setShowAddedConfirm(true);
            setTimeout(() => setShowAddedConfirm(false), 2000);
        }
        setIsProjectModalOpen(false);
        setSelectedDoc(null);
    };

    const handleOverwrite = () => {
        if (!duplicateFileConflict) return;
        const { doc, existingFile } = duplicateFileConflict;
        onUpdateFile(existingFile.id, {
            content: doc.base64Content,
            updatedAt: new Date().toISOString(),
        });
        setDuplicateFileConflict(null);
        setShowAddedConfirm(true);
        setTimeout(() => setShowAddedConfirm(false), 2000);
    };

    const handleSaveAsCopy = () => {
        if (!duplicateFileConflict) return;
        const { doc, projectId } = duplicateFileConflict;
        
        const projectFileNames = files
            .filter(f => f.parentId === projectId && f.parentType === 'project')
            .map(f => f.name);
            
        const newName = findUniqueFileName(doc.fileName, projectFileNames);

        // FIX: Added missing `type` property to correctly categorize the new file.
        onAddFile({
            companyId: doc.companyId,
            parentId: projectId,
            parentType: 'project',
            type: 'file',
            name: newName,
            content: doc.base64Content,
            mimeType: doc.mimeType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        setDuplicateFileConflict(null);
        setShowAddedConfirm(true);
        setTimeout(() => setShowAddedConfirm(false), 2000);
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('wordprocessingml')) return <WordFileIcon className="w-6 h-6 text-blue-400" />;
        if (mimeType.includes('presentationml')) return <PowerPointFileIcon className="w-6 h-6 text-orange-400" />;
        if (mimeType.includes('spreadsheetml')) return <ExcelFileIcon className="w-6 h-6 text-green-400" />;
        return <DocumentTextIcon className="w-6 h-6 text-slate-400" />;
    };

    return (
        <div className="bg-slate-800 h-full w-full flex flex-col" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
            <AddToProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                projects={projects}
                onConfirm={handleConfirmAddToProject}
            />
            <DuplicateFileModal
                isOpen={!!duplicateFileConflict}
                fileName={duplicateFileConflict?.doc.fileName || ''}
                onOverwrite={handleOverwrite}
                onSaveAsCopy={handleSaveAsCopy}
                onCancel={() => setDuplicateFileConflict(null)}
            />
            <DocumentPreviewModal
                isOpen={!!previewingDoc}
                onClose={() => setPreviewingDoc(null)}
                document={previewingDoc}
            />


            <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold">Generated Documents</h2>
                {showAddedConfirm && <div className="text-sm text-green-400 flex items-center gap-1"><CheckIcon className="w-4 h-4" /> Added to project!</div>}
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto p-4 space-y-3">
                {filteredDocs.length > 0 ? (
                    filteredDocs.map(doc => (
                        <div key={doc.id} className="bg-slate-900/50 p-3 rounded-md group">
                            <div className="flex items-center gap-3">
                                {getFileIcon(doc.mimeType)}
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-sm truncate">{doc.fileName}</p>
                                    <p className="text-xs text-slate-400">
                                        by {doc.generatedByEmployeeName} on {formatTimestamp(doc.createdAt, user?.settings)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setPreviewingDoc(doc)} title="Preview" className="p-2 text-slate-300 hover:bg-slate-700 rounded-full"><EyeIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDownload(doc)} title="Download" className="p-2 text-slate-300 hover:bg-slate-700 rounded-full"><DocumentArrowDownIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleOpenAddToProject(doc)} title="Add to Project" className="p-2 text-slate-300 hover:bg-slate-700 rounded-full"><FolderPlusIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-500 py-10">
                        <DocumentTextIcon className="w-12 h-12 mx-auto mb-2"/>
                        <p>No documents generated recently.</p>
                    </div>
                )}
            </div>
        </div>
    );
};