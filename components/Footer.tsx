import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center p-4 mt-8">
      <p className="text-slate-500 text-sm">
        &copy; {currentYear} AI Business Co-Pilot. All rights reserved.
      </p>
      <p className="text-slate-500 text-xs mt-2">
        Powered with Google AI Gemini. AI can make mistakes. Check important info.
      </p>
    </footer>
  );
};