import React, { useState, useEffect, useRef } from 'react';
import type { QuickNote } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { ChevronUpDownIcon } from './icons/ChevronUpDownIcon';

interface StickyNoteProps {
    note: QuickNote;
    onUpdate: (noteId: string, updates: Partial<Omit<QuickNote, 'id' | 'companyId'>>) => void;
    onDelete: (noteId: string) => void;
}

const NOTE_COLORS: { name: string; bg: string; text: string }[] = [
    { name: 'yellow', bg: 'bg-yellow-200', text: 'text-yellow-800' },
    { name: 'pink', bg: 'bg-pink-200', text: 'text-pink-800' },
    { name: 'blue', bg: 'bg-blue-200', text: 'text-blue-800' },
    { name: 'green', bg: 'bg-green-200', text: 'text-green-800' },
];

export const StickyNote: React.FC<StickyNoteProps> = ({ note, onUpdate, onDelete }) => {
    const [content, setContent] = useState(note.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isCollapsed = note.isCollapsed ?? false;

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current && !isCollapsed) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [content, isCollapsed]);
    
    // Update content in component state if note prop changes from parent
    useEffect(() => {
        setContent(note.content);
    }, [note.content]);

    const handleBlur = () => {
        if (content.trim() !== note.content.trim()) {
            onUpdate(note.id, { content: content.trim() });
        }
    };

    const handleColorChange = (color: string) => {
        onUpdate(note.id, { color });
    };

    const handleToggleCollapse = () => {
        onUpdate(note.id, { isCollapsed: !isCollapsed });
    };

    const selectedColor = NOTE_COLORS.find(c => c.name === note.color) || NOTE_COLORS[0];
    const firstLine = content.split('\n')[0];

    return (
        <div className={`group relative p-3 rounded-md shadow-sm ${selectedColor.bg} ${selectedColor.text}`}>
            <div className="absolute top-1 right-1 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleToggleCollapse}
                    className="p-0.5 bg-black/10 rounded-full text-black/40 hover:bg-black/20 hover:text-black/70"
                    aria-label={isCollapsed ? "Expand note" : "Collapse note"}
                >
                    <ChevronUpDownIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(note.id)}
                    className="p-0.5 bg-black/10 rounded-full text-black/40 hover:bg-black/20 hover:text-black/70"
                    aria-label="Delete note"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>
            
            {isCollapsed ? (
                <p 
                    className="text-sm pr-12 truncate cursor-pointer" 
                    onClick={handleToggleCollapse}
                    title="Click to expand"
                >
                    {firstLine || <span className="italic opacity-70">Empty note</span>}
                </p>
            ) : (
                <>
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleBlur}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none p-0 text-sm placeholder-black/40"
                        placeholder="Type your note..."
                        rows={1}
                        autoFocus
                    />
                    <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {NOTE_COLORS.map(color => (
                            <button
                                key={color.name}
                                onClick={() => handleColorChange(color.name)}
                                className={`w-4 h-4 rounded-full ${color.bg} ${note.color === color.name ? 'ring-2 ring-offset-2 ring-slate-600 ring-offset-slate-800' : 'hover:ring-1 hover:ring-slate-600'}`}
                                aria-label={`Change color to ${color.name}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
