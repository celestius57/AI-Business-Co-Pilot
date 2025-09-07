import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { continueConversation } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { getLondonTimestamp, formatTimestamp } from '../utils';
import { ServiceError } from '../services/errors';
// FIX: Corrected import path for useAuth
import { useAuth } from '../contexts/GoogleAuthContext';

interface AIChatWizardProps {
  title: string;
  systemInstruction: string;
  onComplete: (history: ChatMessage[]) => void;
  completionKeyword: string;
}

export const AIChatWizard: React.FC<AIChatWizardProps> = ({ title, systemInstruction, onComplete, completionKeyword }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);

  const startConversation = useCallback(async () => {
    setIsLoading(true);
    setHistory([]);
    // This is a "fake" user message to kickstart the conversation based on the system prompt
    const initialUserMessage: ChatMessage = { role: 'user', text: 'Hello, please ask your first question.', timestamp: getLondonTimestamp() };
    const initialHistory = [initialUserMessage];
    try {
        const modelResponse = await continueConversation(initialHistory, systemInstruction);
        // FIX: Add 'as const' to role to fix TypeScript type error
        setHistory([
          ...initialHistory,
          { role: 'model' as const, text: modelResponse, timestamp: getLondonTimestamp() },
        ]);
    } catch (error) {
        console.error("Failed to start conversation:", error);
        const errorMessage = error instanceof ServiceError ? error.userMessage : 'Sorry, I am having trouble starting. Please try again later.';
        // FIX: Add 'as const' to role to fix TypeScript type error
        setHistory([{ role: 'model' as const, text: errorMessage, timestamp: getLondonTimestamp() }]);
    } finally {
        setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemInstruction]);

  useEffect(() => {
    startConversation();
  }, [startConversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', text: userInput, timestamp: getLondonTimestamp() };
    const updatedHistory = [...history, newUserMessage];
    setHistory(updatedHistory);
    setUserInput('');
    setIsLoading(true);
    
    try {
        const modelResponse = await continueConversation(updatedHistory, systemInstruction);
        const newModelMessage = { role: 'model' as const, text: modelResponse, timestamp: getLondonTimestamp() };
        setHistory(prev => [...prev, newModelMessage]);
        if (modelResponse.includes(completionKeyword)) {
            setTimeout(() => onComplete([...updatedHistory, newModelMessage]), 1000);
        }
    } catch (error) {
        console.error("Failed to get model response:", error);
        const errorMessage = error instanceof ServiceError ? error.userMessage : 'An error occurred. Please try again.';
        // FIX: Add 'as const' to role to fix TypeScript type error
        setHistory(prev => [...prev, { role: 'model' as const, text: errorMessage, timestamp: getLondonTimestamp() }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-auto flex flex-col h-[70vh]">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-4">
        <SparklesIcon className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="flex-grow overflow-y-auto pr-4 space-y-4">
        {history.map((msg, index) => {
          if (index === 0) return null; // Hide the initial prompt message
          return (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1 px-1">{formatTimestamp(msg.timestamp, user?.settings)}</p>
            </div>
          );
        })}
        {isLoading && history.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-md p-3 rounded-lg bg-slate-700 text-slate-200">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-700">
        <div className="relative">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your answer..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 pl-4 pr-12 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={isLoading}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:bg-slate-500" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};
