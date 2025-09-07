import React, { useEffect, useRef } from 'react';

interface WhiteboardProps {
  data: string; // Mermaid syntax
  onContentReady: (svgContent: string) => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ data, onContentReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (data && containerRef.current) {
        // Clear previous content
        containerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400">Generating diagram...</div>';
        try {
          const mermaidModule = await import('mermaid');
          const mermaid = mermaidModule.default;

          mermaid.initialize({ startOnLoad: false, theme: 'dark', darkMode: true, securityLevel: 'loose' });

          const { svg } = await mermaid.render('mermaid-graph-' + Date.now(), data);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
          onContentReady(svg);
        } catch (error: any) {
          if (containerRef.current) {
            const errorMessage = error.message || 'An unknown error occurred while rendering the diagram.';
            containerRef.current.innerHTML = `<div class="p-4 text-left"><h4 class="font-bold text-red-400 mb-2">Diagram Error</h4><pre class="text-sm text-red-300 whitespace-pre-wrap">${errorMessage}</pre></div>`;
          }
        }
      } else if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }
    renderDiagram();
  }, [data, onContentReady]);

  return (
    <div className="p-4 w-full h-full flex items-center justify-center overflow-auto bg-slate-900 rounded-b-xl">
        <div ref={containerRef} className="w-full h-full [&>svg]:w-full [&>svg]:h-full text-white">
            {!data && <p className="text-slate-500">The whiteboard is ready. Ask me to draw something!</p>}
        </div>
    </div>
  );
};
