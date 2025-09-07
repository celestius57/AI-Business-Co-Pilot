


import React, { useState, useMemo } from 'react';
import type { AppFile, Employee } from '../types';
import { useAuth } from '../contexts/GoogleAuthContext';
import { formatTimestamp, richTextToMarkdown, downloadFileFromContent, downloadFileFromBase64 } from '../utils';
import { FileIcon } from './icons/FileIcon';
import { FolderIcon } from './icons/FolderIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { RequestReviewModal } from './RequestReviewModal';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import JSZip from 'jszip';

interface FileBrowserProps {
  rootId: string;
  rootName: string;
  companyId: string;
  allFiles: AppFile[];
  employees: Employee[];
  onAddFile: (fileData: Omit<AppFile, 'id'>) => AppFile;
  onUpdateFile: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
  onDeleteFile: (fileId: string) => void;
  onOpenFileEditor: (file: AppFile | null) => void;
  isReadOnly: boolean;
  onRequestReview: (fileId: string, reviewerId: string) => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  rootId,
  rootName,
  companyId,
  allFiles,
  employees,
  onAddFile,
  onUpdateFile,
  onDeleteFile,
  onOpenFileEditor,
  isReadOnly,
  onRequestReview,
}) => {
    const { user } = useAuth();
    const [currentFolderId, setCurrentFolderId] = useState(rootId);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [reviewModalState, setReviewModalState] = useState<{ isOpen: boolean; fileId: string | null }>({ isOpen: false, fileId: null });
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    const fileMap = useMemo(() => new Map(allFiles.map(f => [f.id, f])), [allFiles]);

    const path = useMemo(() => {
        const result: { id: string, name: string }[] = [];
        let currentId: string | undefined = currentFolderId;
        
        if (currentId === rootId) {
            return [{ id: rootId, name: rootName }];
        }

        while(currentId && currentId !== rootId) {
            const folder = fileMap.get(currentId);
            if (folder) {
                result.unshift({ id: folder.id, name: folder.name });
                currentId = folder.parentId;
            } else {
                break;
            }
        }
        result.unshift({ id: rootId, name: rootName });
        return result;
    }, [currentFolderId, rootId, rootName, fileMap]);

    const currentFiles = useMemo(() => {
        const children = allFiles.filter(f => f.parentId === currentFolderId);
        const active = children.filter(f => !f.isArchived);
        const archived = children.filter(f => f.isArchived);
        return { active, archived };
    }, [allFiles, currentFolderId]);

    const filesToDisplay = showArchived ? currentFiles.archived : currentFiles.active;
    filesToDisplay.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });

    const handleCreateFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        const parentFile = allFiles.find(f => f.id === currentFolderId);
        onAddFile({
            companyId,
            parentId: currentFolderId,
            parentType: parentFile ? parentFile.parentType : (rootId.startsWith('proj_') ? 'project' : 'client'), // Heuristic
            type: 'folder',
            name: newFolderName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        setIsCreatingFolder(false);
        setNewFolderName('');
    };
    
    const handleNewFileClick = () => {
        const parentFile = allFiles.find(f => f.id === currentFolderId);
        const newFileStub: Omit<AppFile, 'id'> & {id: null} = {
            id: null,
            companyId,
            parentId: currentFolderId,
            parentType: parentFile ? parentFile.parentType : (rootId.startsWith('proj_') ? 'project' : 'client'),
            type: 'file',
            name: 'New Document.md',
            content: JSON.stringify([{ type: 'heading1', content: 'New Document' }]),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'Draft',
            authorId: user?.id,
            authorName: user?.name,
        }
        onOpenFileEditor(newFileStub);
    };

    const handleDownloadFile = (file: AppFile) => {
        if (!file.content) {
            alert("File has no content to download.");
            return;
        }

        if (file.mimeType?.startsWith('image/') || file.mimeType?.includes('wordprocessingml') || file.mimeType?.includes('presentationml') || file.mimeType?.includes('spreadsheetml')) {
            if (file.mimeType === 'image/svg+xml' && file.content.trim().startsWith('<svg')) {
                 downloadFileFromContent(file.content, file.name, file.mimeType);
            } else {
                 downloadFileFromBase64(file.content, file.name, file.mimeType);
            }
        } else if (file.mimeType === 'application/json') {
            try {
                const blocks = JSON.parse(file.content);
                const markdownContent = richTextToMarkdown(blocks);
                const fileName = file.name.replace(/\.[^/.]+$/, "") + ".md";
                downloadFileFromContent(markdownContent, fileName, 'text/markdown');
            } catch (e) {
                console.error("Failed to parse and convert rich text file:", e);
                downloadFileFromContent(file.content, file.name, 'application/json');
            }
        } else {
            downloadFileFromContent(file.content, file.name, file.mimeType || 'text/plain');
        }
    };

    const handleDownloadAll = async () => {
        setIsDownloadingAll(true);
        try {
            const zip = new JSZip();

            const addFilesToZip = async (zipFolder: JSZip, parentId: string) => {
                const children = allFiles.filter(f => f.parentId === parentId);

                for (const item of children) {
                    if (item.isArchived) continue;

                    if (item.type === 'folder') {
                        const newFolder = zipFolder.folder(item.name);
                        if (newFolder) {
                            await addFilesToZip(newFolder, item.id);
                        }
                    } else if (item.content) {
                        let fileContent: string | Blob;
                        let fileName = item.name;

                        if (item.mimeType?.startsWith('image/') || item.mimeType?.includes('wordprocessingml') || item.mimeType?.includes('presentationml') || item.mimeType?.includes('spreadsheetml')) {
                            if (item.mimeType === 'image/svg+xml' && item.content.trim().startsWith('<svg')) {
                                fileContent = new Blob([item.content], { type: item.mimeType });
                            } else {
                                const byteCharacters = atob(item.content);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                fileContent = new Blob([byteArray], { type: item.mimeType });
                            }
                        } else if (item.mimeType === 'application/json') {
                            const blocks = JSON.parse(item.content);
                            const markdownContent = richTextToMarkdown(blocks);
                            fileName = item.name.replace(/\.[^/.]+$/, "") + ".md";
                            fileContent = markdownContent;
                        } else {
                            fileContent = item.content;
                        }
                        zipFolder.file(fileName, fileContent);
                    }
                }
            };

            await addFilesToZip(zip, rootId);

            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${rootName}-files.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (err) {
            console.error("Failed to create zip file", err);
            alert("Sorry, there was an error creating the zip file.");
        } finally {
            setIsDownloadingAll(false);
        }
    };

    const statusConfig: Record<string, string> = {
        'Draft': 'bg-slate-600 text-slate-300',
        'In Review': 'bg-blue-600/50 text-blue-300',
        'Approved': 'bg-green-600/50 text-green-300',
    };


    return (
        <div>
            <RequestReviewModal
                isOpen={reviewModalState.isOpen}
                onClose={() => setReviewModalState({ isOpen: false, fileId: null })}
                employees={employees}
                onConfirm={(reviewerId) => {
                    if (reviewModalState.fileId) {
                        onRequestReview(reviewModalState.fileId, reviewerId);
                    }
                    setReviewModalState({ isOpen: false, fileId: null });
                }}
                currentAuthorId={fileMap.get(reviewModalState.fileId || '')?.authorId}
            />
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-1 text-sm text-slate-400 flex-wrap">
                    {path.map((p, index) => (
                        <React.Fragment key={p.id}>
                            <button onClick={() => setCurrentFolderId(p.id)} className="hover:text-white hover:underline disabled:text-white disabled:no-underline disabled:cursor-default" disabled={index === path.length-1}>
                                {p.name}
                            </button>
                            {index < path.length - 1 && <ChevronRightIcon className="w-4 h-4" />}
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleDownloadAll} disabled={isDownloadingAll} className="flex items-center gap-2 bg-slate-700/80 px-3 py-1.5 text-sm font-semibold hover:bg-slate-700 transition-colors disabled:bg-slate-800 disabled:text-slate-500" style={{ borderRadius: 'var(--radius-md)' }}>
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        {isDownloadingAll ? 'Zipping...' : 'Download All'}
                    </button>
                    {!isReadOnly && 
                        <button onClick={() => setIsCreatingFolder(true)} className="flex items-center gap-2 bg-slate-700/80 px-3 py-1.5 text-sm font-semibold hover:bg-slate-700 transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>
                            <FolderIcon className="w-5 h-5" /> New Folder
                        </button>
                    }
                    {!isReadOnly &&
                        <button onClick={handleNewFileClick} className="flex items-center gap-2 bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>
                            <PlusIcon className="w-5 h-5" /> New File
                        </button>
                    }
                    {(currentFiles.active.length > 0 || currentFiles.archived.length > 0) &&
                        <button onClick={() => setShowArchived(!showArchived)} className="px-3 py-1.5 border border-slate-600 text-sm font-semibold hover:bg-slate-700" style={{ borderRadius: 'var(--radius-md)' }}>
                            {showArchived ? `View Active Files (${currentFiles.active.length})` : `View Archived (${currentFiles.archived.length})`}
                        </button>
                    }
                </div>
            </div>
            <div className="space-y-2">
                 {isCreatingFolder && (
                    <form onSubmit={handleCreateFolder} className="bg-slate-800 p-3 flex items-center gap-2" style={{ borderRadius: 'var(--radius-md)' }}>
                        <FolderIcon className="w-6 h-6 text-slate-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="New folder name"
                            className="bg-slate-700 border border-slate-600 p-1 text-white focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none flex-grow"
                            autoFocus
                            onBlur={() => setIsCreatingFolder(false)}
                        />
                    </form>
                )}
                {filesToDisplay.length > 0 ? filesToDisplay.map(file => (
                    <div key={file.id} className="group bg-slate-800 p-3 flex justify-between items-center" style={{ borderRadius: 'var(--radius-md)' }}>
                        <button
                            onClick={() => file.type === 'folder' ? setCurrentFolderId(file.id) : onOpenFileEditor(file)}
                            className="flex items-center gap-3 text-left flex-grow min-w-0"
                        >
                            {file.type === 'folder' ? (
                                <FolderIcon className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                            ) : (
                                <FileIcon className="w-6 h-6 text-slate-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                                <p className="font-semibold truncate">{file.name}</p>
                                <p className="text-xs text-slate-500">Updated {formatTimestamp(file.updatedAt, user?.settings)}</p>
                            </div>
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {file.type === 'file' && file.status && (
                                <span
                                    title={file.status === 'In Review' && file.reviewerName ? `In review by ${file.reviewerName}` : file.status}
                                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusConfig[file.status] || 'bg-slate-600'}`}
                                >
                                    {file.status}
                                </span>
                            )}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {file.type === 'file' && (
                                    <button onClick={() => handleDownloadFile(file)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full" title="Download">
                                        <DocumentArrowDownIcon className="w-5 h-5" />
                                    </button>
                                )}
                                {!isReadOnly && file.type === 'file' && file.status === 'Draft' && (
                                    <button
                                        onClick={() => setReviewModalState({ isOpen: true, fileId: file.id })}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full"
                                        title="Request Review"
                                    >
                                        <ChatBubbleIcon className="w-5 h-5" />
                                    </button>
                                )}
                                {!isReadOnly &&
                                    <button onClick={() => onUpdateFile(file.id, { isArchived: !file.isArchived })} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full" title={showArchived ? 'Unarchive' : 'Archive'}>
                                        {showArchived ? <ArrowUturnLeftIcon className="w-5 h-5" /> : <ArchiveBoxIcon className="w-5 h-5" />}
                                    </button>
                                }
                                <button onClick={() => onDeleteFile(file.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-full">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    !isCreatingFolder && <p className="text-center text-slate-500 py-10">
                        {showArchived ? 'No archived items in this folder.' : 'This folder is empty.'}
                    </p>
                )}
            </div>
        </div>
    );
};