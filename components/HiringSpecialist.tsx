

import React, { useState } from 'react';
import type { Company, Team, Employee, HiringProposal, Client } from '../types';
import { getHiringProposals } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { generateAvatarUrl } from '../utils';
import { ServiceError } from '../services/errors';

interface HiringSpecialistProps {
  company: Company;
  teams: Team[];
  employees: Employee[];
  clients: Client[];
  onHire: (proposal: HiringProposal) => void;
}

type Stage = 'prompt' | 'loading' | 'review' | 'error';

export const HiringSpecialist: React.FC<HiringSpecialistProps> = ({ company, teams, employees, clients, onHire }) => {
    const [stage, setStage] = useState<Stage>('prompt');
    const [userInput, setUserInput] = useState('');
    const [proposals, setProposals] = useState<HiringProposal[] | null>(null);
    const [selectedProposal, setSelectedProposal] = useState<HiringProposal | null>(null);
    const [error, setError] = useState<string>('');

    const handleGetProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;
        setStage('loading');
        setError('');
        try {
            const results = await getHiringProposals(company.profile, teams, employees, clients, userInput);
            setProposals(results);
            if (results.length === 1) {
                setSelectedProposal(results[0]);
            }
            setStage('review');
        } catch (err) {
            console.error("Failed to get hiring proposal:", err);
            const errorMessage = err instanceof ServiceError ? err.userMessage : 'The AI HR Specialist is currently unavailable. Please try again in a moment.';
            setError(errorMessage);
            setStage('error');
        }
    };

    const handleApprove = () => {
        if (selectedProposal) {
            onHire(selectedProposal);
        }
    };

    const handleStartOver = () => {
        setStage('prompt');
        setUserInput('');
        setProposals(null);
        setSelectedProposal(null);
        setError('');
    };

    const renderContent = () => {
        switch (stage) {
            case 'loading':
                return (
                    <div className="text-center">
                        <SparklesIcon className="w-12 h-12 text-indigo-400 animate-pulse mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Analyzing Your Request...</h2>
                        <p className="text-slate-400">Our AI HR Specialist is crafting the perfect employee profile based on your needs.</p>
                    </div>
                );

            case 'error':
                 return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2 text-red-400">Proposal Generation Failed</h2>
                        <p className="text-slate-400 mb-6">{error}</p>
                        <button onClick={handleStartOver} className="bg-indigo-600 px-4 py-2 font-semibold hover:bg-indigo-500" style={{ borderRadius: 'var(--radius-md)' }}>
                            Try Again
                        </button>
                    </div>
                );
            
            case 'review':
                if (!proposals) return null;
                const avatarUrl = selectedProposal ? generateAvatarUrl(selectedProposal.employeeName, selectedProposal.gender) : '';
                const isNewTeam = selectedProposal ? !teams.some(d => d.name.toLowerCase() === selectedProposal.teamName.toLowerCase()) : false;

                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6">Employee Proposal</h2>

                        {proposals.length > 1 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-slate-300 mb-3 text-center">Our AI has a few suggestions for this role. Please select one to review and hire.</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {proposals.map((p, index) => (
                                        <button 
                                            key={index}
                                            onClick={() => setSelectedProposal(p)}
                                            className={`p-4 text-left border-2 transition-all ${selectedProposal === p ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}
                                            style={{ borderRadius: 'var(--radius-md)' }}
                                        >
                                            <p className="font-bold">{p.employeeName}</p>
                                            <p className="text-sm text-indigo-400">{p.jobProfile}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedProposal && (
                            <div className="bg-slate-900/50 p-6 border border-slate-700 animate-fade-in" style={{ borderRadius: 'var(--radius-lg)' }}>
                                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                                    <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full bg-slate-700 border-2 border-indigo-500"/>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-3xl font-bold">{selectedProposal.employeeName}</h3>
                                        <p className="text-indigo-400 font-semibold text-lg">{selectedProposal.jobProfile}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <strong className="text-slate-400 block mb-1">Proposed Team</strong>
                                        <p className="text-white font-semibold">
                                            {selectedProposal.teamName} 
                                            {isNewTeam && <span className="text-xs bg-indigo-500/30 text-indigo-300 rounded-full px-2 py-0.5 ml-2">New Team</span>}
                                        </p>
                                        {isNewTeam && selectedProposal.teamDescription && (
                                            <p className="text-sm text-slate-400 mt-1 italic">"{selectedProposal.teamDescription}"</p>
                                        )}
                                    </div>
                                    <div>
                                        <strong className="text-slate-400 block mb-1">AI's Reasoning</strong>
                                        <p className="text-slate-300 italic">"{selectedProposal.reasoning}"</p>
                                    </div>
                                    <div>
                                        <strong className="text-slate-400 block mb-1">AI System Instruction</strong>
                                        <p className="bg-slate-800 p-3 text-slate-300 whitespace-pre-wrap font-mono text-xs max-h-40 overflow-y-auto" style={{ borderRadius: 'var(--radius-sm)' }}>{selectedProposal.systemInstruction}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 mt-6">
                            <button onClick={handleStartOver} className="flex-1 p-3 bg-slate-600 text-white font-semibold hover:bg-slate-500" style={{ borderRadius: 'var(--radius-md)' }}>Start Over</button>
                            <button 
                                onClick={handleApprove} 
                                className="flex-1 p-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                                disabled={!selectedProposal}
                                style={{ borderRadius: 'var(--radius-md)' }}
                            >
                                Approve & Hire
                            </button>
                        </div>
                    </div>
                );

            case 'prompt':
            default:
                return (
                    <form onSubmit={handleGetProposal}>
                        <div className="text-center mb-6">
                            <UserCircleIcon className="w-16 h-16 text-slate-500 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold mb-1">AI HR Specialist</h2>
                            <p className="text-slate-400">Describe the new role you need, and I'll generate a complete AI employee profile for you.</p>
                        </div>
                        <textarea
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            placeholder="e.g., 'We need someone to manage our social media presence and run ad campaigns' or 'Our customer support tickets are piling up, I need help.'"
                            className="w-full bg-slate-900/80 border border-slate-700 py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            style={{ borderRadius: 'var(--radius-md)' }}
                            rows={4}
                            required
                        />
                        <button type="submit" className="w-full mt-4 p-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:bg-slate-500 flex items-center justify-center gap-2" disabled={!userInput.trim()} style={{ borderRadius: 'var(--radius-md)' }}>
                            <SparklesIcon className="w-5 h-5"/>
                            Generate Proposal
                        </button>
                    </form>
                );
        }
    }


    return (
        <div className="bg-slate-800 p-8 w-full max-w-2xl mx-auto" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
            {renderContent()}
        </div>
    )
};