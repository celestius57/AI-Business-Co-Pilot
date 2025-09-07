

import React, { useMemo } from 'react';
import type { Team, Employee } from '../types';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  assistant?: Employee;
  teams: Team[];
  employees: Employee[];
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({ isOpen, onClose, companyName, assistant, teams, employees }) => {
  const teamMorale = useMemo(() => {
    return teams.map(team => {
      const teamEmployees = employees.filter(e => e.teamId === team.id);
      if (teamEmployees.length === 0) {
        return { name: team.name, average: -1 }; // -1 indicates no employees
      }
      const totalMorale = teamEmployees.reduce((sum, emp) => sum + emp.morale, 0);
      return {
        name: team.name,
        average: Math.round(totalMorale / teamEmployees.length),
      };
    });
  }, [teams, employees]);

  const getMoraleStatus = (average: number): { text: string; color: string } => {
    if (average === -1) return { text: 'No employees', color: 'text-slate-500' };
    if (average > 70) return { text: 'High', color: 'text-green-400' };
    if (average > 30) return { text: 'Stable', color: 'text-yellow-400' };
    return { text: 'Low', color: 'text-red-400' };
  };

  const overallSummary = useMemo(() => {
    const lowMoraleTeams = teamMorale.filter(d => d.average !== -1 && d.average <= 30);
    const highMoraleTeams = teamMorale.filter(d => d.average > 70);

    if (lowMoraleTeams.length > 0) {
      return `It looks like the ${lowMoraleTeams.map(d => d.name).join(', ')} team's morale is a bit low. It might be a good time to check in with them.`;
    }
    
    if (highMoraleTeams.length > 0 && highMoraleTeams.length === teamMorale.filter(d => d.average !== -1).length) {
      return "Team morale is excellent across the board. Keep up the great work!";
    }
    return "Everything looks stable. Let's have a productive day!";
  }, [teamMorale]);


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 p-6 w-full max-w-lg mx-4 border border-slate-700 relative transform transition-all animate-slide-up"
        style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white">
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <img
            src={assistant?.avatarUrl || ''}
            alt={assistant?.name || 'Assistant'}
            className="w-16 h-16 rounded-full bg-slate-700 border-2 border-indigo-500"
          />
          <div>
            <h2 className="text-2xl font-bold">Good morning!</h2>
            <p className="text-slate-400">Here's your daily briefing for {companyName}.</p>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 my-4" style={{ borderRadius: 'var(--radius-md)' }}>
            <h3 className="font-semibold text-lg mb-2 text-indigo-300">Team Morale Summary</h3>
            <p className="text-slate-300">{overallSummary}</p>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {teamMorale.map(({ name, average }) => {
            const status = getMoraleStatus(average);
            return (
              <div key={name} className="flex items-center justify-between bg-slate-700/50 p-3" style={{ borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-3">
                    <UserGroupIcon className="w-5 h-5 text-slate-400"/>
                    <span className="font-semibold">{name}</span>
                </div>
                <span className={`font-bold text-sm ${status.color}`}>{status.text}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 p-2 bg-indigo-600 font-semibold hover:bg-indigo-500 transition-colors"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          Got it, thanks Alex!
        </button>
      </div>
    </div>
  );
};

// Add some simple animations to index.html to support the modal
// This is a quick way without adding a full animation library.
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;
document.head.append(style);