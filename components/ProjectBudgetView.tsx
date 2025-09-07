import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/GoogleAuthContext';
import { formatDate, formatCurrency } from '../utils';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { ProjectExpense } from '../types';

const ExpenseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ProjectExpense, 'id' | 'projectId'>) => void;
  expense?: ProjectExpense | null;
}> = ({ isOpen, onClose, onSave, expense }) => {
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount || 0);
  const [category, setCategory] = useState(expense?.category || 'General');
  const [date, setDate] = useState(expense?.date.split('T')[0] || new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;
    onSave({ description, amount, category, date: new Date(date).toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 w-full max-w-md" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{expense ? 'Edit' : 'Add'} Expense</h3>
            <div className="space-y-4">
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required className="w-full bg-slate-700 p-2" />
                <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} placeholder="Amount" required min="0.01" step="0.01" className="w-full bg-slate-700 p-2" />
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" required className="w-full bg-slate-700 p-2" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-slate-700 p-2" />
            </div>
            <div className="flex gap-4 mt-6 justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]">Save</button>
            </div>
        </form>
    </div>
  );
};

export const ProjectBudgetView: React.FC = () => {
    const { budget, expenses, onUpdateBudget, onAddExpense, onUpdateExpense, onDeleteExpense } = useProject();
    const { user } = useAuth();
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);
    const [newTotalBudget, setNewTotalBudget] = useState(budget?.totalBudget || 0);

    const totalSpent = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
    const remainingBudget = (budget?.totalBudget || 0) - totalSpent;

    const handleSaveBudget = () => {
        onUpdateBudget({ totalBudget: newTotalBudget });
        setIsBudgetModalOpen(false);
    };

    const handleSaveExpense = (data: Omit<ProjectExpense, 'id' | 'projectId'>) => {
        if (editingExpense) {
            onUpdateExpense(editingExpense.id, data);
        } else {
            onAddExpense(data);
        }
    };

    const openEditExpenseModal = (expense: ProjectExpense) => {
        setEditingExpense(expense);
        setIsExpenseModalOpen(true);
    };
    
    const openAddExpenseModal = () => {
        setEditingExpense(null);
        setIsExpenseModalOpen(true);
    };

    return (
        <div>
            {isBudgetModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setIsBudgetModalOpen(false)}>
                    <div className="bg-slate-800 p-6 w-full max-w-sm" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Set Project Budget</h3>
                        <input type="number" value={newTotalBudget} onChange={e => setNewTotalBudget(parseFloat(e.target.value))} placeholder="Total Budget" min="0" className="w-full bg-slate-700 p-2" />
                        <div className="flex gap-4 mt-6 justify-end">
                            <button onClick={() => setIsBudgetModalOpen(false)} className="px-4 py-2 bg-slate-600">Cancel</button>
                            <button onClick={handleSaveBudget} className="px-4 py-2 bg-[var(--color-primary)]">Set Budget</button>
                        </div>
                    </div>
                </div>
            )}
            <ExpenseModal 
                isOpen={isExpenseModalOpen} 
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                expense={editingExpense}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800 p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                    <h4 className="text-sm font-semibold text-slate-400">Total Budget</h4>
                    <p className="text-2xl font-bold">{formatCurrency(budget?.totalBudget || 0, user?.settings)}</p>
                    <button onClick={() => setIsBudgetModalOpen(true)} className="text-xs text-[var(--color-primary)] hover:underline mt-1">Set Budget</button>
                </div>
                <div className="bg-slate-800 p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                    <h4 className="text-sm font-semibold text-slate-400">Total Spent</h4>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(totalSpent, user?.settings)}</p>
                </div>
                <div className="bg-slate-800 p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                    <h4 className="text-sm font-semibold text-slate-400">Remaining</h4>
                    <p className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(remainingBudget, user?.settings)}</p>
                </div>
            </div>

            <div className="bg-slate-800 p-4" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Expense Log</h3>
                    <button onClick={openAddExpenseModal} className="flex items-center gap-1 bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold">
                        <PlusIcon className="w-4 h-4"/>
                        Add Expense
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-4 py-3">Date</th>
                                <th scope="col" className="px-4 py-3">Description</th>
                                <th scope="col" className="px-4 py-3">Category</th>
                                <th scope="col" className="px-4 py-3 text-right">Amount</th>
                                <th scope="col" className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length > 0 ? expenses.map(exp => (
                                <tr key={exp.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="px-4 py-3">{formatDate(exp.date, user?.settings)}</td>
                                    <td className="px-4 py-3 font-medium text-white">{exp.description}</td>
                                    <td className="px-4 py-3">{exp.category}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(exp.amount, user?.settings)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => openEditExpenseModal(exp)} className="p-1 text-slate-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                                        <button onClick={() => onDeleteExpense(exp.id)} className="p-1 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">No expenses logged yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};