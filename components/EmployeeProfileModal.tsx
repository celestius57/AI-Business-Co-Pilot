import React from 'react';
import type { Employee, Team, AppFile } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SwitchHorizontalIcon } from './icons/SwitchHorizontalIcon';
import { TeamIcon } from './icons/departmentIcons';
import { MoraleIndicator } from './MoraleIndicator';
import { InfoIcon } from './icons/InfoIcon';
import { JobProfile } from '../constants';

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  team: Team | undefined;
  onFire: () => void;
  onMove: () => void;
  // FIX: Add files prop to match component usage in CompanyDashboard.tsx
  files: AppFile[];
}

const OCEAN_DESCRIPTIONS = {
  Openness: "Reflects a person's degree of intellectual curiosity, creativity, and preference for novelty and variety.",
  Conscientiousness: "A tendency to be organized, dependable, and show self-discipline.",
  Extraversion: "Characterized by sociability, talkativeness, assertiveness, and excitability.",
  Agreeableness: "A tendency to be compassionate and cooperative rather than suspicious and antagonistic.",
  Neuroticism: "The tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, or vulnerability."
};

const OceanBar: React.FC<{ label: keyof typeof OCEAN_DESCRIPTIONS, value: number }> = ({ label, value }) => (
    <div>
        <div className="flex justify-between items-center text-sm mb-1">
            <div className="relative flex items-center gap-1.5 group">
                <span className="text-slate-300">{label}</span>
                <InfoIcon className="w-4 h-4 text-slate-500" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-900 border border-slate-600 rounded-md text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {OCEAN_DESCRIPTIONS[label]}
                </div>
            </div>
            <span className="font-bold text-white">{value}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
            <div
                className="bg-indigo-500 h-2 rounded-full"
                style={{ width: `${value}%` }}
            ></div>
        </div>
    </div>
);


export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({ isOpen, onClose, employee, team, onFire, onMove }) => {
    if (!isOpen || !employee) return null;

    const isPersonalAssistant = employee.jobProfile === JobProfile.PersonalAssistant;

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 p-6 w-full max-w-2xl h-[80vh] border border-slate-700 relative transform transition-all animate-slide-up flex flex-col"
                style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-4 border-b border-slate-700 pb-4">
                    <img src={employee.avatarUrl} alt={employee.name} className="w-20 h-20 rounded-full bg-slate-700" />
                    <div>
                        <h2 className="text-3xl font-bold">{employee.name}</h2>
                        <p className="text-indigo-400 font-semibold">{employee.jobProfile}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Team & Morale */}
                        <div className="bg-slate-900/50 p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                            <h3 className="font-bold text-slate-300 mb-2">Current Status</h3>
                            <div className="flex items-center gap-2 text-sm mb-3">
                                <TeamIcon iconName={team?.icon} className="w-5 h-5 text-slate-400" />
                                <span>Team: <strong className="text-white">{team?.name || 'Unassigned'}</strong></span>
                            </div>
                            <div>
                                <span className="text-sm text-slate-300">Morale:</span>
                                <MoraleIndicator morale={employee.morale} />
                            </div>
                        </div>
                        {/* OCEAN Profile */}
                        <div className="bg-slate-900/50 p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                            <h3 className="font-bold text-slate-300 mb-2">OCEAN Personality Profile</h3>
                            <div className="space-y-2">
                                <OceanBar label="Openness" value={employee.oceanProfile.openness} />
                                <OceanBar label="Conscientiousness" value={employee.oceanProfile.conscientiousness} />
                                <OceanBar label="Extraversion" value={employee.oceanProfile.extraversion} />
                                <OceanBar label="Agreeableness" value={employee.oceanProfile.agreeableness} />
                                <OceanBar label="Neuroticism" value={employee.oceanProfile.neuroticism} />
                            </div>
                        </div>
                    </div>
                    {/* System Instruction */}
                    <div>
                        <h3 className="font-bold text-slate-300 mb-2">AI System Instruction</h3>
                        <div className="bg-slate-900/50 p-3 text-slate-300 whitespace-pre-wrap font-mono text-xs max-h-48 overflow-y-auto" style={{ borderRadius: 'var(--radius-md)' }}>
                            {employee.systemInstruction}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end gap-4 flex-shrink-0">
                    <button
                        onClick={onFire}
                        disabled={isPersonalAssistant}
                        title={isPersonalAssistant ? "The Personal Assistant cannot be fired." : "Fire Employee"}
                        className="flex items-center gap-2 px-4 py-2 bg-red-800/80 text-white font-semibold hover:bg-red-700/80 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                        style={{ borderRadius: 'var(--radius-md)' }}
                    >
                        <TrashIcon className="w-5 h-5" />
                        Fire Employee
                    </button>
                    <button
                        onClick={onMove}
                        disabled={isPersonalAssistant}
                        title={isPersonalAssistant ? "The Personal Assistant cannot be moved." : "Move Employee"}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                        style={{ borderRadius: 'var(--radius-md)' }}
                    >
                        <SwitchHorizontalIcon className="w-5 h-5" />
                        Move Employee
                    </button>
                </div>
            </div>
        </div>
    );
};
