import React from 'react';
import type { GeneratedDocument } from '../types';
import { Tool } from '../constants';
import { XMarkIcon } from './icons/XMarkIcon';
import { WordFileIcon } from './icons/WordFileIcon';
import { PowerPointFileIcon } from './icons/PowerPointFileIcon';
import { ExcelFileIcon } from './icons/ExcelFileIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument | null;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('wordprocessingml')) return <WordFileIcon className="w-8 h-8 text-blue-400" />;
    if (mimeType.includes('presentationml')) return <PowerPointFileIcon className="w-8 h-8 text-orange-400" />;
    if (mimeType.includes('spreadsheetml')) return <ExcelFileIcon className="w-8 h-8 text-green-400" />;
    return <DocumentTextIcon className="w-8 h-8 text-slate-400" />;
};


const RenderPreviewContent: React.FC<{ doc: GeneratedDocument }> = ({ doc }) => {
    const { mimeType, sourceData } = doc;

    if (!sourceData) {
        return <p className="text-slate-400">Preview is not available for this older document format.</p>;
    }

    if (mimeType.includes('wordprocessingml')) {
        return sourceData.content?.map((item: { type: string; text: string }, index: number) => {
            if (item.type === 'heading1') {
                return <h1 key={index} className="text-2xl font-bold text-white mb-2">{item.text}</h1>;
            }
            return <p key={index} className="text-slate-300 mb-2">{item.text}</p>;
        });
    }

    if (mimeType.includes('presentationml')) {
        return sourceData.slides?.map((slide: { title: string; content: string }, index: number) => (
            <div key={index} className="mb-4 pb-2 border-b border-slate-700 last:border-b-0">
                <h2 className="text-xl font-semibold text-white mb-1">{slide.title}</h2>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                    {slide.content?.split('\n').map((point, i) => point.trim() && <li key={i}>{point}</li>)}
                </ul>
            </div>
        ));
    }

    if (mimeType.includes('spreadsheetml')) {
        return sourceData.sheets?.map((sheet: { name: string; data: (string | number)[][] }, index: number) => (
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
    }

    return <p>Preview not available for this file type.</p>;
};

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, document }) => {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 p-6 w-full max-w-2xl border border-slate-700 flex flex-col h-[70vh]" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {getFileIcon(document.mimeType)}
            <h3 className="text-xl font-bold">{document.fileName}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div 
          className="bg-slate-900/50 p-4 max-h-full overflow-y-auto flex-grow" 
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          <RenderPreviewContent doc={document} />
        </div>
      </div>
    </div>
  );
};
