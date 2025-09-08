import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatCurrency } from '../utils';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { ProjectExpense } from '../types';
import { CheckIcon } from './icons/CheckIcon';

const ExpenseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ProjectExpense, 'id' | 'projectId'>) => void;
  expense?: ProjectExpense | null;
}> = ({ isOpen, onClose, onSave, expense }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
      if (isOpen) {
          if (expense) {
              setDescription(expense.description || '');
              setAmount(expense.amount || 0);
              setCategory(expense.category || 'General');
              setDate(expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]);
          } else {
              setDescription('');
              setAmount(0);
              setCategory('General');
              setDate(new Date().toISOString().split('T')[0]);
          }
      }
  }, [isOpen, expense]);

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
            <h3 className="text-xl font-bold mb-4">{expense ? 'Edit' : 'New'} Expense</h3>
            <div className="space-y-4">
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required className="w-full bg-slate-700 p-2"/>
                <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} placeholder="Amount" required min="0.01" step="0.01" className="w-full bg-slate-700 p-2"/>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g., Software, Marketing)" required className="w-full bg-slate-700 p-2"/>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-slate-700 p-2"/>
            </div>
            <div className="flex gap-4 mt-6 justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]">Save Expense</button>
            </div>
        </form>
    </div>
  );
};

export const ProjectBudgetView: React.FC = () => {
    const { budget, expenses, onUpdateBudget, onAddExpense, onUpdateExpense, onDeleteExpense } = useProject();
    const { user } = useAuth();
    const [isBudgetEditing, setIsBudgetEditing] = useState(false);
    const [newBudget, setNewBudget] = useState(budget?.totalBudget || 0);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);

    useEffect(() => {
        setNewBudget(budget?.totalBudget || 0);
    }, [budget]);

    const totalSpent = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
    const remainingBudget = (budget?.totalBudget || 0) - totalSpent;

    const handleSaveBudget = () => {
        onUpdateBudget({ totalBudget: newBudget });
        setIsBudgetEditing(false);
    };
    
    const handleSaveExpense = (data: Omit<ProjectExpense, 'id' | 'projectId'>) => {
        if (editingExpense) {
            onUpdateExpense(editingExpense.id, data);
        } else {
            onAddExpense(data);
        }
    };
    
    const openAddModal = () => {
        setEditingExpense(null);
        setIsExpenseModalOpen(true);
    };

    const openEditModal = (expense: ProjectExpense) => {
        setEditingExpense(expense);
        setIsExpenseModalOpen(true);
    };
    
    return (
        <div>
            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                expense={editingExpense}
            />
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-400">Total Budget</h4>
                    {isBudgetEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                            <input type="number" value={newBudget} onChange={e => setNewBudget(parseFloat(e.target.value))} className="bg-slate-700 p-1 w-full"/>
                            <button onClick={handleSaveBudget} className="p-1 bg-green-600 rounded"><CheckIcon className="w-4 h-4"/></button>
                            <button onClick={() => setIsBudgetEditing(false)} className="p-1 bg-slate-600 rounded"><XMarkIcon className="w-4 h-4"/></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                             <p className="text-2xl font-bold">{formatCurrency(budget?.totalBudget || 0, user?.settings)}</p>
                             <button onClick={() => setIsBudgetEditing(true)} className="text-slate-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                        </div>
                    )}
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-400">Total Spent</h4>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(totalSpent, user?.settings)}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-400">Remaining Budget</h4>
                    <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(remainingBudget, user?.settings)}</p>
                </div>
            </div>
            
            {/* Expenses List */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><CurrencyDollarIcon className="w-5 h-5"/> Expenses</h3>
                    <button onClick={openAddModal} className="flex items-center gap-1 bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold">
                        <PlusIcon className="w-4 h-4"/> Add Expense
                    </button>
                </div>
                 {expenses.length > 0 ? (
                    <div className="bg-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Description</th>
                                    <th className="p-3 text-left">Category</th>
                                    <th className="p-3 text-right">Amount</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                                    <tr key={exp.id} className="border-b border-slate-700/50 last:border-b-0">
                                        <td className="p-3">{formatDate(exp.date, user?.settings)}</td>
                                        <td className="p-3">{exp.description}</td>
                                        <td className="p-3">{exp.category}</td>
                                        <td className="p-3 text-right font-mono">{formatCurrency(exp.amount, user?.settings)}</td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                 <button onClick={() => openEditModal(exp)} className="p-1 text-slate-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                                                 <button onClick={() => onDeleteExpense(exp.id)} className="p-1 text-slate-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center py-10 text-slate-500">No expenses have been logged for this project yet.</p>
                )}
            </div>
        </div>
    );
};
