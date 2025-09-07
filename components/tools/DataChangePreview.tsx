import React, { useState, useMemo } from 'react';
import type { ToolOutput, ProjectPhase } from '../../types';
import { Tool } from '../../constants';
import { CheckBadgeIcon } from '../icons/CheckBadgeIcon';
import { SparklesIcon } from '../icons/SparklesIcon';

interface DataChangePreviewProps {
    toolOutput: ToolOutput;
    onApprove: () => void;
    projectPhases?: ProjectPhase[];
}

export const DataChangePreview: React.FC<DataChangePreviewProps> = ({ toolOutput, onApprove, projectPhases }) => {
    const [isApproved, setIsApproved] = useState(false);

    const isActionValid = useMemo(() => {
        const { tool, data } = toolOutput;
        if (tool === Tool.ProjectManagement) {
            if (!data?.action) return false;

            const action = data.action;
            const payload = data.payload;

            if (['update_phase', 'updatePhase', 'delete_phase', 'deletePhase'].includes(action)) {
                return !!payload?.phaseId;
            }
            if (['add_multiple_phases', 'addMultiplePhases'].includes(action)) {
                return Array.isArray(payload) && payload.length > 0 && payload.every(p => p.name && p.startDate && p.endDate);
            }
            return true;
        }
        if (tool === Tool.Calendar || tool === Tool.CreateTask) {
            return !!data?.title;
        }
        return true; // Default to valid
    }, [toolOutput]);


    const handleApprove = () => {
        onApprove();
        setIsApproved(true);
    };

    const renderSummary = () => {
        const { tool, data } = toolOutput;
        switch (tool) {
            case Tool.Calendar:
                return `Create a new calendar event: "${data?.title || 'Untitled Event'}"`;
            case Tool.CreateTask:
                return `Create a new task: "${data?.title || 'Untitled Task'}"`;
            case Tool.ProjectManagement: {
                if (!data?.action) {
                    return 'Proposing an invalid project management update.';
                }
                const { action, payload } = data;
                
                switch (action) {
                    case 'add_phase':
                        return `Add new project phase: "${payload?.name || 'Unnamed Phase'}"`;
                    case 'add_multiple_phases':
                        if (Array.isArray(payload) && payload.length > 0) {
                            const phaseNames = payload.map((p: any) => `"${p.name || 'Unnamed'}"`).join(', ');
                            return `Add ${payload.length} new project phases: ${phaseNames}`;
                        }
                        return 'Add multiple new project phases.';
                    case 'update_phase': {
                        const phase = projectPhases?.find(p => p.id === payload?.phaseId);
                        return `Update project phase: "${phase?.name || payload?.phaseId || 'Unknown Phase'}"`;
                    }
                    case 'delete_phase': {
                        const phase = projectPhases?.find(p => p.id === payload?.phaseId);
                        return `Delete project phase: "${phase?.name || payload?.phaseId || 'Unknown Phase'}"`;
                    }
                    case 'set_budget':
                        return `Set project budget to $${payload?.totalBudget?.toLocaleString() || '0'}`;
                    case 'add_expense':
                        return `Add expense of $${payload?.amount?.toLocaleString() || '0'} for "${payload?.description || 'No description'}"`;
                    default:
                        return `Proposing an unknown project management update for action: ${action}.`;
                }
            }
            default:
                return 'An action has been proposed.';
        }
    };

    return (
        <div className="flex flex-col h-full w-full p-6 items-center justify-center text-center">
            <div className="bg-slate-800 p-6 border border-slate-700 rounded-lg max-w-sm">
                {isApproved ? (
                    <>
                        <CheckBadgeIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-green-400">Action Approved</h3>
                        <p className="text-slate-400 text-sm mt-1">The changes have been applied.</p>
                    </>
                ) : !isActionValid ? (
                     <>
                        <SparklesIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-red-400">Invalid Action Proposed</h3>
                        <p className="text-slate-400 mt-2 text-sm">The AI proposed an incomplete action and it cannot be approved.</p>
                        <p className="text-slate-500 mt-1 text-xs">Please try rephrasing your request.</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-xl font-bold mb-2">Action Required</h3>
                        <p className="text-slate-400 mb-4 text-sm">{toolOutput.text || 'The AI has proposed an action requiring your approval.'}</p>
                        <div className="bg-slate-900/50 p-3 rounded-md text-slate-300 font-mono text-xs mb-6 text-left">
                            {renderSummary()}
                        </div>
                        <button
                            onClick={handleApprove}
                            className="w-full p-3 bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors rounded-md"
                        >
                            Approve Change
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};