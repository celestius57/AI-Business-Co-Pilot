import React, { useState, useEffect } from 'react';
import { Company, Team, Employee, MoveAnalysis } from '../types';
import { getEmployeeMoveAnalysis } from '../services/geminiService';
import { ServiceError } from '../services/errors';
import { XMarkIcon } from './icons/XMarkIcon';
import { SwitchHorizontalIcon } from './icons/SwitchHorizontalIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckIcon } from './icons/CheckIcon';

interface MoveEmployeeModalProps {
  isOpen: boolean;
  company: Company;
  teams: Team[];
  employees: Employee[];
  employeeToMove: Employee;
  onClose: () => void;
  onConfirmMove: (employeeId: string, newTeamId: string, analysis: MoveAnalysis | null, acceptedSuggestions: { source?: { name?: string; description?: string; }, destination?: { name?: string; description?: string; }}) => void;
}

type Stage = 'selection' | 'loading' | 'analysis' | 'error';

export const MoveEmployeeModal: React.FC<MoveEmployeeModalProps> = ({ isOpen, company, teams, employees, employeeToMove, onClose, onConfirmMove }) => {
  const [stage, setStage] = useState<Stage>('selection');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [analysis, setAnalysis] = useState<MoveAnalysis | null>(null);
  const [error, setError] = useState('');
  
  const [acceptSourceRename, setAcceptSourceRename] = useState(false);
  const [acceptSourceRedescribe, setAcceptSourceRedescribe] = useState(false);
  const [acceptDestRename, setAcceptDestRename] = useState(false);
  const [acceptDestRedescribe, setAcceptDestRedescribe] = useState(false);

  const availableTeams = teams.filter(t => t.id !== employeeToMove.teamId);
  const sourceTeam = teams.find(t => t.id === employeeToMove.teamId);

  useEffect(() => {
    if (isOpen) {
      setStage('selection');
      setSelectedTeamId('');
      setAnalysis(null);
      setError('');
      setAcceptSourceRename(false);
      setAcceptSourceRedescribe(false);
      setAcceptDestRename(false);
      setAcceptDestRedescribe(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!selectedTeamId) return;
    setStage('loading');
    setError('');
    try {
      const result = await getEmployeeMoveAnalysis(company, teams, employees, employeeToMove, selectedTeamId);
      setAnalysis(result);
      // Pre-check boxes if suggestions exist
      if (result.sourceTeamSuggestions.newName) setAcceptSourceRename(true);
      if (result.sourceTeamSuggestions.newDescription) setAcceptSourceRedescribe(true);
      if (result.destinationTeamSuggestions.newName) setAcceptDestRename(true);
      if (result.destinationTeamSuggestions.newDescription) setAcceptDestRedescribe(true);
      setStage('analysis');
    } catch (err) {
      const errorMessage = err instanceof ServiceError ? err.userMessage : "An unexpected error occurred during analysis.";
      setError(errorMessage);
      setStage('error');
    }
  };
  
  const handleConfirm = () => {
    if (!selectedTeamId) return;
    const acceptedSuggestions: { source?: { name?: string; description?: string; }, destination?: { name?: string; description?: string; }} = {};
    if (analysis) {
        if (acceptSourceRename || acceptSourceRedescribe) {
            acceptedSuggestions.source = {
                name: acceptSourceRename ? analysis.sourceTeamSuggestions.newName : undefined,
                description: acceptSourceRedescribe ? analysis.sourceTeamSuggestions.newDescription : undefined
            }
        }
        if (acceptDestRename || acceptDestRedescribe) {
             acceptedSuggestions.destination = {
                name: acceptDestRename ? analysis.destinationTeamSuggestions.newName : undefined,
                description: acceptDestRedescribe ? analysis.destinationTeamSuggestions.newDescription : undefined
            }
        }
    }
    onConfirmMove(employeeToMove.id, selectedTeamId, analysis, acceptedSuggestions);
  };
  
  const renderContent = () => {
    switch(stage) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <SparklesIcon className="w-12 h-12 text-indigo-400 animate-pulse mx-auto mb-4" />
            <h3 className="text-xl font-bold">Analyzing Move...</h3>
            <p className="text-slate-400">Our AI is assessing the strategic impact.</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center py-8">
            <h3 className="text-xl font-bold text-red-400">Analysis Failed</h3>
            <p className="text-slate-400 my-4">{error}</p>
            <button onClick={() => setStage('selection')} className="bg-indigo-600 px-4 py-2" style={{ borderRadius: 'var(--radius-md)' }}>Try Again</button>
          </div>
        );
      case 'analysis':
        if (!analysis) return null;
        const destTeam = teams.find(t => t.id === selectedTeamId);
        return (
          <div>
            <div className="bg-slate-900/50 p-4 border border-slate-700" style={{ borderRadius: 'var(--radius-md)' }}>
                <h4 className="font-bold text-indigo-300 mb-2 flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> AI Impact Analysis</h4>
                <p className="text-slate-300 text-sm">{analysis.impactAnalysis}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Source Team Suggestions */}
                {(analysis.sourceTeamSuggestions.newName || analysis.sourceTeamSuggestions.newDescription) && sourceTeam && (
                    <div className="bg-slate-700/50 p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                        <h5 className="font-bold mb-2">Suggestions for {sourceTeam.name}</h5>
                        {analysis.sourceTeamSuggestions.newName && (
                            <label className="flex items-start gap-2 text-sm mb-2 cursor-pointer">
                                <input type="checkbox" checked={acceptSourceRename} onChange={e => setAcceptSourceRename(e.target.checked)} className="mt-1 h-4 w-4 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500"/>
                                <div>Rename to: <strong className="text-white">{analysis.sourceTeamSuggestions.newName}</strong></div>
                            </label>
                        )}
                        {analysis.sourceTeamSuggestions.newDescription && (
                            <label className="flex items-start gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={acceptSourceRedescribe} onChange={e => setAcceptSourceRedescribe(e.target.checked)} className="mt-1 h-4 w-4 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500"/>
                                <div>New description: <em className="text-slate-300">"{analysis.sourceTeamSuggestions.newDescription}"</em></div>
                            </label>
                        )}
                    </div>
                )}
                {/* Destination Team Suggestions */}
                {(analysis.destinationTeamSuggestions.newName || analysis.destinationTeamSuggestions.newDescription) && destTeam && (
                    <div className="bg-slate-700/50 p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                        <h5 className="font-bold mb-2">Suggestions for {destTeam.name}</h5>
                        {analysis.destinationTeamSuggestions.newName && (
                            <label className="flex items-start gap-2 text-sm mb-2 cursor-pointer">
                                <input type="checkbox" checked={acceptDestRename} onChange={e => setAcceptDestRename(e.target.checked)} className="mt-1 h-4 w-4 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500"/>
                                <div>Rename to: <strong className="text-white">{analysis.destinationTeamSuggestions.newName}</strong></div>
                            </label>
                        )}
                        {analysis.destinationTeamSuggestions.newDescription && (
                            <label className="flex items-start gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={acceptDestRedescribe} onChange={e => setAcceptDestRedescribe(e.target.checked)} className="mt-1 h-4 w-4 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500"/>
                                <div>New description: <em className="text-slate-300">"{analysis.destinationTeamSuggestions.newDescription}"</em></div>
                            </label>
                        )}
                    </div>
                )}
            </div>
             <div className="mt-6 flex gap-4">
                <button onClick={() => setStage('selection')} className="flex-1 p-2 bg-slate-600 font-semibold" style={{ borderRadius: 'var(--radius-md)' }}>Back</button>
                <button onClick={handleConfirm} className="flex-1 p-2 bg-indigo-600 font-semibold flex items-center justify-center gap-2" style={{ borderRadius: 'var(--radius-md)' }}>
                    <CheckIcon className="w-5 h-5"/>
                    Confirm Move
                </button>
            </div>
          </div>
        );
      case 'selection':
      default:
        return (
          <>
            <div className="space-y-4">
              <div className="text-center">
                <p>Move <strong className="text-white">{employeeToMove.name}</strong> from <strong className="text-white">{sourceTeam?.name || 'Unassigned'}</strong> to:</p>
              </div>
              <select 
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                <option value="" disabled>Select a new team</option>
                {availableTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex gap-4">
              <button onClick={onClose} className="flex-1 p-2 bg-slate-600 font-semibold" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
              <button onClick={handleAnalyze} disabled={!selectedTeamId} className="flex-1 p-2 bg-indigo-600 font-semibold flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:text-slate-400" style={{ borderRadius: 'var(--radius-md)' }}>
                  <SparklesIcon className="w-5 h-5"/>
                  Analyze Move
              </button>
            </div>
          </>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 p-6 w-full max-w-lg mx-4 border border-slate-700 relative transform transition-all animate-slide-up"
        style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white">
          <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <SwitchHorizontalIcon className="w-8 h-8 text-indigo-400" />
          <h2 className="text-2xl font-bold">Move Employee</h2>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};