import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppFile, RichTextBlock, Employee } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { performTextAction } from '../services/geminiService';
import { ServiceError } from '../services/errors';
import { RequestReviewModal } from './RequestReviewModal';
// FIX: Corrected import path for useAuth
import { useAuth } from '../contexts/AuthContext';
import { FileIcon } from './icons/FileIcon';
import { richTextToHtml, richTextToMarkdown } from '../utils';
import { marked } from 'marked';
import { BoldIcon } from './icons/BoldIcon';
import { ItalicIcon } from './icons/ItalicIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ListOrderedIcon } from './icons/ListOrderedIcon';
import { QuoteIcon } from './icons/QuoteIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';


interface FileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saveData: { fileId: string | null, name: string, content: string, mimeType: string }) => void;
  file: AppFile | null;
  employees: Employee[];
  onUpdateFile: (fileId: string, updates: Partial<Omit<AppFile, 'id'>>) => void;
  onRequestReview: (fileId: string, reviewerId: string) => void;
}

export const FileEditorModal: React.FC<FileEditorModalProps> = ({ isOpen, onClose, onSave, file, employees, onUpdateFile, onRequestReview }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [originalMimeType, setOriginalMimeType] = useState<string | undefined>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

    const isEditable = useMemo(() => {
        if (!file) return false;
        return !file.mimeType?.startsWith('image/');
    }, [file]);

    const renderedPreviewContent = useMemo(() => {
        if (!file || !content || isEditable) return null;
        if (file.mimeType?.startsWith('image/')) {
            let imageSrc = '';
            if (file.mimeType === 'image/svg+xml' && content.trim().startsWith('<svg')) {
                try {
                    imageSrc = `data:image/svg+xml;base64,${btoa(content)}`;
                } catch (e) { return <p className="text-red-400">Error displaying SVG.</p>; }
            } else {
                imageSrc = `data:${file.mimeType};base64,${content}`;
            }
            return <img src={imageSrc} alt={file.name} className="max-w-full h-auto mx-auto" />;
        }
        return null;
    }, [file, content, isEditable]);
    
    const markdownPreview = useMemo(() => {
        if (activeTab === 'preview') {
            return marked.parse(content, { gfm: true, breaks: true });
        }
        return '';
    }, [content, activeTab]);

    useEffect(() => {
        if (file) {
            setName(file.name);
            setOriginalMimeType(file.mimeType);
            setActiveTab('write');

            if (file.mimeType === 'application/json' && file.content) {
                try {
                    const blocks: RichTextBlock[] = JSON.parse(file.content);
                    setContent(richTextToMarkdown(blocks));
                } catch (e) {
                    setContent(file.content || '');
                }
            } else {
                setContent(file.content || '');
            }
        }
    }, [file]);
    
    useEffect(() => {
        if (activeTab === 'write' && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content, activeTab]);

    const handleSave = () => {
        let finalMimeType = originalMimeType;
        // If we started with our rich text format or it's a new file, save as markdown
        if (originalMimeType === 'application/json' || !file?.id) {
            finalMimeType = 'text/markdown';
        }

        onSave({
            fileId: file?.id || null,
            name: name,
            content: content,
            mimeType: finalMimeType || 'text/plain',
        });
        onClose();
    };
    
    const handleFormat = (type: 'bold' | 'italic' | 'h1' | 'h2' | 'ul' | 'ol' | 'quote' | 'code') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = content;
        
        const selection = text.substring(start, end);
        let newContent = '';

        const lineWrappers: Record<string, string> = {
            h1: '# ', h2: '## ', ul: '- ', quote: '> ',
        };

        if (type === 'bold' || type === 'italic' || type === 'code') {
            const syntax = type === 'bold' ? '**' : type === 'italic' ? '*' : '`';
            newContent = text.substring(0, start) + syntax + selection + syntax + text.substring(end);
            setContent(newContent);
        } else {
            const lineStart = text.lastIndexOf('\n', start - 1) + 1;
            let lineEnd = text.indexOf('\n', end);
            if (lineEnd === -1) lineEnd = text.length;
            
            const selectedLinesText = text.substring(lineStart, lineEnd);
            const lines = selectedLinesText.split('\n');
            
            let transformedLines: string[] = [];
            if (type === 'ol') {
                const alreadyNumbered = lines.every(line => /^\d+\.\s/.test(line.trim()));
                if(alreadyNumbered) {
                    transformedLines = lines.map(line => line.replace(/^\d+\.\s/, ''));
                } else {
                    transformedLines = lines.map((line, i) => `${i + 1}. ${line}`);
                }
            } else {
                const prefix = lineWrappers[type as keyof typeof lineWrappers];
                const allHavePrefix = lines.every(line => line.trim().startsWith(prefix));
                if (allHavePrefix) {
                    transformedLines = lines.map(line => line.replace(prefix, ''));
                } else {
                    transformedLines = lines.map(line => prefix + line);
                }
            }
            
            const replacement = transformedLines.join('\n');
            newContent = text.substring(0, lineStart) + replacement + text.substring(lineEnd);
            setContent(newContent);
        }

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                // We can add more intelligent cursor placement later if needed
                textareaRef.current.setSelectionRange(start, end);
            }
        }, 0);
    };


    const handleAiAction = async (action: 'improve' | 'summarize' | 'formal' | 'casual') => {
        if (!content.trim()) return;
        setIsAiLoading(true);
        try {
            const result = await performTextAction(content, action);
            setContent(result);
        } catch (err) {
            const errorMessage = err instanceof ServiceError ? err.userMessage : "An error occurred while using the AI action.";
            alert(errorMessage);
        } finally {
            setIsAiLoading(false);
        }
    };

    if (!isOpen || !file) return null;

    return (
        <>
        <RequestReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            employees={employees}
            onConfirm={(reviewerId) => {
                if (file.id) {
                    onRequestReview(file.id, reviewerId);
                }
                setIsReviewModalOpen(false);
            }}
            currentAuthorId={file.authorId}
        />
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 p-6 w-full max-w-4xl h-[90vh] border border-slate-700 flex flex-col" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0 flex-grow">
                        <FileIcon className="w-6 h-6 text-slate-400 flex-shrink-0" />
                        {isEditable ? (
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="text-xl font-bold bg-transparent border-0 ring-0 focus:ring-2 focus:ring-indigo-500 rounded-md p-1 -m-1 w-full"
                            />
                        ) : (
                             <h3 className="text-xl font-bold truncate">{file.name}</h3>
                        )}
                    </div>
                    <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                
                 {isEditable && (
                    <div className="border-b border-slate-700 mb-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                             <button onClick={() => setActiveTab('write')} className={`px-3 py-2 text-sm font-semibold ${activeTab === 'write' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-400'}`}>Write</button>
                             <button onClick={() => setActiveTab('preview')} className={`px-3 py-2 text-sm font-semibold ${activeTab === 'preview' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-400'}`}>Preview</button>
                        </div>
                    </div>
                 )}
                
                <div className="flex-grow bg-slate-900/50 rounded-md overflow-auto relative">
                    {activeTab === 'write' && isEditable ? (
                        <>
                            <div className="sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10 p-2 border-b border-slate-700 flex flex-wrap items-center gap-1">
                                <button onClick={() => handleFormat('h1')} className="px-2 py-1 text-sm font-bold rounded hover:bg-slate-700" title="Heading 1">H1</button>
                                <button onClick={() => handleFormat('h2')} className="px-2 py-1 text-sm font-bold rounded hover:bg-slate-700" title="Heading 2">H2</button>
                                <div className="w-px h-5 bg-slate-700 mx-1"></div>
                                <button onClick={() => handleFormat('bold')} className="p-1.5 rounded hover:bg-slate-700" title="Bold"><BoldIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleFormat('italic')} className="p-1.5 rounded hover:bg-slate-700" title="Italic"><ItalicIcon className="w-5 h-5"/></button>
                                <div className="w-px h-5 bg-slate-700 mx-1"></div>
                                <button onClick={() => handleFormat('ul')} className="p-1.5 rounded hover:bg-slate-700" title="Bulleted List"><ListBulletIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleFormat('ol')} className="p-1.5 rounded hover:bg-slate-700" title="Numbered List"><ListOrderedIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleFormat('quote')} className="p-1.5 rounded hover:bg-slate-700" title="Blockquote"><QuoteIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleFormat('code')} className="p-1.5 rounded hover:bg-slate-700" title="Code"><CodeBracketIcon className="w-5 h-5"/></button>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full h-full bg-transparent p-4 resize-none border-0 focus:ring-0 text-slate-200"
                                placeholder="Start writing..."
                            />
                        </>
                    ) : activeTab === 'preview' && isEditable ? (
                        <div className="prose prose-invert p-4 max-w-none" dangerouslySetInnerHTML={{ __html: markdownPreview as string }} />
                    ) : (
                        <div className="p-4 flex items-center justify-center h-full">
                            {renderedPreviewContent}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap justify-between items-center mt-4 pt-4 border-t border-slate-700 flex-shrink-0 gap-4">
                    {isEditable ? (
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleAiAction('improve')} disabled={isAiLoading || activeTab === 'preview'} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700 font-semibold hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-md">
                                <MagicWandIcon className="w-4 h-4" /> Improve
                            </button>
                             <button onClick={() => handleAiAction('summarize')} disabled={isAiLoading || activeTab === 'preview'} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700 font-semibold hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-md">
                                Summarize
                            </button>
                            <button onClick={() => handleAiAction('formal')} disabled={isAiLoading || activeTab === 'preview'} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700 font-semibold hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-md">
                                Make Formal
                            </button>
                            <button onClick={() => handleAiAction('casual')} disabled={isAiLoading || activeTab === 'preview'} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700 font-semibold hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-md">
                                Make Casual
                            </button>
                        </div>
                    ) : <div></div>}
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-600 font-semibold rounded-md hover:bg-slate-500">Close</button>
                        {isEditable && (
                            <>
                            {file.id && (file.status === 'Draft' || file.status === 'Approved') && (
                                <button onClick={() => setIsReviewModalOpen(true)} className="px-6 py-2 bg-slate-600 font-semibold rounded-md hover:bg-slate-500">Request Review</button>
                            )}
                            <button onClick={handleSave} className="px-6 py-2 bg-[var(--color-primary)] font-semibold rounded-md hover:bg-[var(--color-primary-hover)]">Save</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};