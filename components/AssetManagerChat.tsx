import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, Employee, SoftwareAsset, AssetAction } from '../types';
// FIX: Corrected import path for useAuth
import { useAuth } from '../contexts/GoogleAuthContext';
import { getLondonTimestamp, formatTimestamp } from '../utils';
import { getAssetManagerResponse } from '../services/geminiService';
import { ServiceError } from '../services/errors';

interface AssetManagerChatProps {
    companyId: string;
    assetManager: Employee;
    assets: SoftwareAsset[];
    onAddAsset: (assetData: Omit<SoftwareAsset, 'id' | 'companyId'>) => void;
    onUpdateAsset: (assetId: string, updates: Partial<Omit<SoftwareAsset, 'id'>>) => void;
    onRemoveAsset: (assetId: string) => void;
}

export const AssetManagerChat: React.FC<AssetManagerChatProps> = ({
    companyId,
    assetManager,
    assets,
    onAddAsset,
    onUpdateAsset,
    onRemoveAsset,
}) => {
    const { user } = useAuth();
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history]);

    useEffect(() => {
        // Start conversation with a greeting
        setIsLoading(true);
        const greeting: ChatMessage = {
            role: 'model',
            text: `Hello, I am ${assetManager.name}. How can I help you manage your software assets today? You can ask me to add, update, remove, or find information about your company's licenses and subscriptions.`,
            timestamp: getLondonTimestamp(),
        };
        setHistory([greeting]);
        setIsLoading(false);
    }, [assetManager.name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: userInput, timestamp: getLondonTimestamp() };
        const updatedHistory = [...history, newUserMessage];
        setHistory(updatedHistory);
        const prompt = userInput;
        setUserInput('');
        setIsLoading(true);

        try {
            const actionResponse = await getAssetManagerResponse(prompt, assets, companyId);
            
            switch (actionResponse.action) {
                case 'add':
                    if (actionResponse.payload) {
                        // The payload should be complete for 'add'
                        onAddAsset(actionResponse.payload as Omit<SoftwareAsset, 'id' | 'companyId'>);
                    }
                    break;
                case 'update':
                    if (actionResponse.assetName && actionResponse.payload) {
                        const assetToUpdate = assets.find(a => a.name.toLowerCase() === actionResponse.assetName!.toLowerCase());
                        if (assetToUpdate) {
                            onUpdateAsset(assetToUpdate.id, actionResponse.payload);
                        }
                    }
                    break;
                case 'remove':
                    if (actionResponse.assetName) {
                        const assetToRemove = assets.find(a => a.name.toLowerCase() === actionResponse.assetName!.toLowerCase());
                        if (assetToRemove) {
                            onRemoveAsset(assetToRemove.id);
                        }
                    }
                    break;
                case 'query':
                case 'error':
                    // Do nothing, just display the response text
                    break;
            }

            const newModelMessage: ChatMessage = {
                role: 'model',
                text: actionResponse.responseText,
                timestamp: getLondonTimestamp(),
            };

            setHistory(prev => [...prev, newModelMessage]);

        } catch (error) {
            const errorMessage = error instanceof ServiceError ? error.userMessage : 'An error occurred. Please try again.';
            // FIX: Add 'as const' to role to fix TypeScript type error
            setHistory(prev => [...prev, { role: 'model' as const, text: errorMessage, timestamp: getLondonTimestamp() }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
                <img src={assetManager.avatarUrl} alt={assetManager.name} className="w-12 h-12 rounded-full" />
                <div>
                    <h3 className="text-xl font-bold">Chat with {assetManager.name.split(' ')[0]}</h3>
                    <p className="text-sm text-indigo-400">{assetManager.jobProfile}</p>
                </div>
            </div>
            <div className="flex-grow bg-slate-900/50 p-4 overflow-y-auto space-y-4" style={{ borderRadius: 'var(--radius-md)' }}>
                {history.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 px-1">{formatTimestamp(msg.timestamp, user?.settings)}</p>
                    </div>
                ))}
                {isLoading && (
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
                        placeholder={`Message ${assetManager.name.split(' ')[0]}...`}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 pl-4 pr-12 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:bg-slate-500" disabled={isLoading || !userInput.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};
