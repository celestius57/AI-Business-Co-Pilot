import React, { createContext, useContext, useMemo } from 'react';
import type { Project, ProjectPhase, ProjectBudget, ProjectExpense, User } from '../types';

interface ProjectContextType {
  project: Project;
  phases: ProjectPhase[];
  budget: ProjectBudget | null;
  expenses: ProjectExpense[];
  onAddPhase: (phaseData: Omit<ProjectPhase, 'id' | 'projectId'>) => void;
  onUpdatePhase: (phaseId: string, updates: Partial<Omit<ProjectPhase, 'id' | 'projectId'>>) => void;
  onDeletePhase: (phaseId: string) => void;
  onUpdateBudget: (budgetData: Omit<ProjectBudget, 'projectId' | 'currency'>) => void;
  onAddExpense: (expenseData: Omit<ProjectExpense, 'id' | 'projectId'>) => void;
  onUpdateExpense: (expenseId: string, updates: Partial<Omit<ProjectExpense, 'id' | 'projectId'>>) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

interface ProjectProviderProps {
  children: React.ReactNode;
  user: User;
  project: Project;
  allPhases: ProjectPhase[];
  allBudgets: ProjectBudget[];
  allExpenses: ProjectExpense[];
  // Raw handlers from App.tsx
  rawAddPhase: (phaseData: Omit<ProjectPhase, 'id'>) => void;
  rawUpdatePhase: (phaseId: string, updates: Partial<Omit<ProjectPhase, 'id'>>) => void;
  rawDeletePhase: (phaseId: string) => void;
  rawUpdateBudget: (budgetData: ProjectBudget) => void;
  rawAddExpense: (expenseData: Omit<ProjectExpense, 'id'>) => void;
  rawUpdateExpense: (expenseId: string, updates: Partial<Omit<ProjectExpense, 'id'>>) => void;
  rawDeleteExpense: (expenseId: string) => void;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children, user, project, allPhases, allBudgets, allExpenses,
  rawAddPhase, rawUpdatePhase, rawDeletePhase, rawUpdateBudget,
  rawAddExpense, rawUpdateExpense, rawDeleteExpense
}) => {
  const projectId = project.id;
  
  const phases = useMemo(() => allPhases.filter(p => p.projectId === projectId), [allPhases, projectId]);
  const budget = useMemo(() => allBudgets.find(b => b.projectId === projectId) || null, [allBudgets, projectId]);
  const expenses = useMemo(() => allExpenses.filter(e => e.projectId === projectId), [allExpenses, projectId]);

  // Wrap raw handlers to automatically inject projectId
  const onAddPhase = (data: Omit<ProjectPhase, 'id' | 'projectId'>) => rawAddPhase({ ...data, projectId });
  const onUpdatePhase = (id: string, data: Partial<Omit<ProjectPhase, 'id' | 'projectId'>>) => rawUpdatePhase(id, data);
  const onDeletePhase = (id: string) => rawDeletePhase(id);
  const onUpdateBudget = (data: Omit<ProjectBudget, 'projectId' | 'currency'>) => rawUpdateBudget({ ...data, projectId, currency: user.settings?.currency || 'USD' });
  const onAddExpense = (data: Omit<ProjectExpense, 'id' | 'projectId'>) => rawAddExpense({ ...data, projectId });
  const onUpdateExpense = (id: string, data: Partial<Omit<ProjectExpense, 'id' | 'projectId'>>) => rawUpdateExpense(id, data);
  const onDeleteExpense = (id: string) => rawDeleteExpense(id);

  const value = {
    project, phases, budget, expenses,
    onAddPhase, onUpdatePhase, onDeletePhase, onUpdateBudget,
    onAddExpense, onUpdateExpense, onDeleteExpense
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const useOptionalProject = (): ProjectContextType | null => {
    return useContext(ProjectContext);
};