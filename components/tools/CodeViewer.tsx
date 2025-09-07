import React from 'react';

interface CodeViewerProps {
  data: { language: string; code: string };
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ data }) => {
  if (!data || typeof data.code !== 'string') {
    return <div className="p-4 text-slate-400">No code to display or data is in the wrong format.</div>;
  }
  
  return (
    <div className="bg-slate-900 rounded-b-xl overflow-hidden h-full flex flex-col">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex-shrink-0">
        <span className="text-xs font-mono text-slate-400">{data.language || 'code'}</span>
      </div>
      <div className="flex-grow overflow-auto">
        <pre className="p-4 text-sm text-white h-full">
          <code>{data.code}</code>
        </pre>
      </div>
    </div>
  );
};
