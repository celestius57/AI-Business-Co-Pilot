import React, { useState } from 'react';
import { AIChatWizard } from './AIChatWizard';
import type { ChatMessage, Company, InitialStructureProposal } from '../types';
import { getSystemInstructionForCompanyChat, summarizeConversationForProfile, getInitialStructureProposal } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { UserIcon } from './icons/UserIcon';
import { ServiceError } from '../services/errors';

interface CompanyCreatorProps {
  onCompanyCreated: (companyData: Omit<Company, 'id' | 'userId'>, initialStructure: InitialStructureProposal) => void;
}

type Stage = 'chat' | 'summarizing' | 'proposing' | 'review' | 'error';

export const CompanyCreator: React.FC<CompanyCreatorProps> = ({ onCompanyCreated }) => {
  const [stage, setStage] = useState<Stage>('chat');
  const [companyData, setCompanyData] = useState<Omit<Company, 'id' | 'userId'> | null>(null);
  const [proposal, setProposal] = useState<InitialStructureProposal | null>(null);
  const [selections, setSelections] = useState<Record<string, { selected: boolean; employees: Record<string, boolean> }>>({});
  const [error, setError] = useState('');

  const handleCreationComplete = async (history: ChatMessage[]) => {
    setStage('summarizing');
    try {
        const profileSummary = await summarizeConversationForProfile(history);
        
        const userMessages = history.filter(m => m.role === 'user');
        // userMessages[0] is the hidden initial prompt. userMessages[1] is the user's response to the first question (company name).
        const companyName = userMessages.length > 1 ? userMessages[1].text.trim() : 'Unnamed Company';
        
        const newCompanyData = { name: companyName, profile: profileSummary };
        setCompanyData(newCompanyData);

        setStage('proposing');
        const structureProposal = await getInitialStructureProposal(profileSummary);
        setProposal(structureProposal);

        const initialSelections: typeof selections = {};
        structureProposal.teams.forEach(team => {
            initialSelections[team.name] = {
                selected: true,
                employees: {},
            };
            team.employees.forEach(emp => {
                initialSelections[team.name].employees[emp.name] = true;
            });
        });
        setSelections(initialSelections);
        setStage('review');

    } catch (err) {
        console.error("Failed during company creation steps:", err);
        const errorMessage = err instanceof ServiceError ? err.userMessage : "An unexpected error occurred while building your company. Please try again.";
        setError(errorMessage);
        setStage('error');
    }
  };

  const handleToggleTeam = (teamName: string) => {
    setSelections(prev => {
        const newSelections = { ...prev };
        const team = newSelections[teamName];
        const isSelected = !team.selected;
        team.selected = isSelected;
        // Toggle all employees in the team along with the team itself
        Object.keys(team.employees).forEach(empName => {
            team.employees[empName] = isSelected;
        });
        return newSelections;
    });
  };

  const handleToggleEmployee = (teamName: string, empName: string) => {
    setSelections(prev => {
        const newSelections = { ...prev };
        const team = newSelections[teamName];
        team.employees[empName] = !team.employees[empName];
        
        // If at least one employee is selected, make sure the team is also selected.
        if (Object.values(team.employees).some(isSelected => isSelected)) {
            team.selected = true;
        } else {
            // If no employees are selected, unselect the team.
            team.selected = false;
        }

        return newSelections;
    });
  };

  const handleFinalizeSetup = () => {
    if (!companyData || !proposal) return;

    // Filter the proposal based on user selections
    const finalStructure: InitialStructureProposal = {
        teams: proposal.teams
            .filter(team => selections[team.name]?.selected)
            .map(team => ({
                ...team,
                employees: team.employees.filter(emp => selections[team.name]?.employees[emp.name]),
            })),
    };

    onCompanyCreated(companyData, finalStructure);
  };

  if (stage === 'chat') {
      return (
          <AIChatWizard
              title="Create a New Company"
              systemInstruction={getSystemInstructionForCompanyChat()}
              onComplete={handleCreationComplete}
              completionKeyword="I have everything I need"
          />
      );
  }

  if (stage === 'summarizing' || stage === 'proposing') {
      const message = stage === 'summarizing' 
          ? 'Analyzing your conversation...' 
          : 'Generating initial company structure...';
      const subMessage = stage === 'summarizing' 
          ? 'Our AI is creating your company profile.' 
          : 'Alex, your new Personal Assistant, is proposing teams and key roles.';

      return (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800 rounded-xl shadow-2xl h-[70vh]">
              <SparklesIcon className="w-12 h-12 text-indigo-400 animate-pulse mb-4" />
              <h2 className="text-2xl font-bold mb-2">{message}</h2>
              <p className="text-slate-400">{subMessage}</p>
          </div>
      );
  }

  if (stage === 'error') {
      return (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800 rounded-xl shadow-2xl h-[70vh]">
              <h2 className="text-2xl font-bold mb-2 text-red-400">An Error Occurred</h2>
              <p className="text-slate-400 mb-6">{error}</p>
              <button onClick={() => setStage('chat')} className="bg-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-500">
                  Start Over
              </button>
          </div>
      );
  }

  if (stage === 'review' && proposal && companyData) {
      return (
          <div className="bg-slate-800 p-6 w-full max-w-4xl mx-auto" style={{ borderRadius: 'var(--radius-lg, 0.75rem)', boxShadow: 'var(--shadow-lg, none)' }}>
              <div className="text-center border-b border-slate-700 pb-4 mb-6">
                  <SparklesIcon className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                  <h2 className="text-2xl font-bold">Initial Structure Proposal</h2>
                  <p className="text-slate-400">Alex, your AI assistant, has proposed the following structure for <span className="font-bold text-white">{companyData.name}</span>.</p>
                  <p className="text-slate-500 text-sm mt-1">Review and select the teams and employees you want to create initially.</p>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                  {proposal.teams.map(team => (
                      <div key={team.name} className="bg-slate-900/50 p-4 border border-slate-700" style={{ borderRadius: 'var(--radius-md, 0.5rem)' }}>
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <UserGroupIcon className="w-6 h-6 text-indigo-400"/>
                                  <div>
                                      <h3 className="text-lg font-bold">{team.name}</h3>
                                      <p className="text-sm text-slate-400">{team.description}</p>
                                  </div>
                              </div>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                  <span className="text-sm font-medium">Create Team</span>
                                  <input 
                                      type="checkbox" 
                                      checked={selections[team.name]?.selected || false}
                                      onChange={() => handleToggleTeam(team.name)}
                                      className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                  />
                              </label>
                          </div>
                          <div className="mt-4 pl-8 border-l-2 border-slate-700/50 space-y-3">
                              {team.employees.map(emp => (
                                  <div key={emp.name} className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <UserIcon className="w-5 h-5 text-slate-400"/>
                                          <div>
                                              <h4 className="font-semibold">{emp.name}</h4>
                                              <p className="text-xs text-indigo-400/80">{emp.jobProfile}</p>
                                          </div>
                                      </div>
                                      <input 
                                          type="checkbox"
                                          checked={selections[team.name]?.employees[emp.name] || false}
                                          onChange={() => handleToggleEmployee(team.name, emp.name)}
                                          className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                      />
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-700">
                  <button onClick={handleFinalizeSetup} className="w-full p-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors" style={{ borderRadius: 'var(--radius-md, 0.5rem)' }}>
                      Finalize Company Setup
                  </button>
              </div>
          </div>
      );
  }

  return null;
};