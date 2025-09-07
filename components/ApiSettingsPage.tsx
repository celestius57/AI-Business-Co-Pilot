import React, { useState } from 'react';
import type { User, Company } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { DEFAULT_GLOBAL_API_REQUEST_LIMIT } from '../constants';
import { InfoIcon } from './icons/InfoIcon';

interface ApiSettingsPageProps {
  user: User;
  companies: Company[];
  onUpdateUser: (data: Partial<Omit<User, 'id' | 'email'>>) => void;
  onUpdateCompany: (companyId: string, data: Partial<Omit<Company, 'id'>>) => void;
  onBack: () => void;
}

export const ApiSettingsPage: React.FC<ApiSettingsPageProps> = ({
  user,
  companies,
  onUpdateUser,
  onUpdateCompany,
  onBack,
}) => {
  const [globalLimit, setGlobalLimit] = useState(user.settings?.globalApiRequestLimit || DEFAULT_GLOBAL_API_REQUEST_LIMIT);
  const [companyLimits, setCompanyLimits] = useState<Record<string, number>>(() =>
    companies.reduce((acc, company) => {
      acc[company.id] = company.dailyApiRequestLimit || 0;
      return acc;
    }, {} as Record<string, number>)
  );
  const [showDefaultSaveConfirm, setShowDefaultSaveConfirm] = useState(false);
  const [showCompanySaveConfirm, setShowCompanySaveConfirm] = useState<Record<string, boolean>>({});
  
  const handleSaveDefault = () => {
    onUpdateUser({
      settings: {
        ...user.settings,
        globalApiRequestLimit: globalLimit,
      },
    });
    setShowDefaultSaveConfirm(true);
    setTimeout(() => setShowDefaultSaveConfirm(false), 2000);
  };

  const handleSaveCompanyLimit = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const globalRpdLimit = user.settings?.globalApiRequestLimit || DEFAULT_GLOBAL_API_REQUEST_LIMIT;
    const totalAssignedRpd = companies.reduce((sum, c) => sum + (c.dailyApiRequestLimit || 0), 0);
    const originalLimit = company.dailyApiRequestLimit || 0;
    const newLimit = companyLimits[companyId];

    const rpdLeft = globalRpdLimit - (totalAssignedRpd - originalLimit);

    if (newLimit < 0) {
      alert("API limit cannot be negative.");
      return;
    }

    if (newLimit > rpdLeft) {
      alert(`Cannot assign ${newLimit} requests. Only ${rpdLeft} requests are available in your global pool. Please adjust the company limit or increase your global limit.`);
      setCompanyLimits(prev => ({...prev, [companyId]: rpdLeft}));
      return;
    }

    onUpdateCompany(companyId, { dailyApiRequestLimit: newLimit });
    setShowCompanySaveConfirm(prev => ({ ...prev, [companyId]: true }));
    setTimeout(() => setShowCompanySaveConfirm(prev => ({ ...prev, [companyId]: false })), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] mb-6 font-semibold">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Companies
      </button>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
            <SparklesIcon className="w-8 h-8 text-indigo-400"/>
            <h1 className="text-3xl font-bold">API Usage Settings</h1>
        </div>
        
        {/* Global Settings */}
        <section className="mb-8 bg-slate-900/50 p-6 border border-slate-700 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Total Daily API Request Pool</h2>
            <p className="text-sm text-slate-400 mb-4">Set the total number of API requests available per day to be distributed across all your companies.</p>
             <p className="text-xs text-slate-400 mb-4 flex items-center gap-2 bg-slate-800/50 p-2 rounded-md border border-slate-600">
                <InfoIcon className="w-8 h-8 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0" />
                <span>Please refer to your Google account for accurate pricing and to configure your billing. This setting is for simulation and cost management purposes only.</span>
            </p>
            <div className="flex items-center gap-4">
                <input 
                    type="number" 
                    value={globalLimit} 
                    onChange={e => setGlobalLimit(parseInt(e.target.value, 10) || 0)} 
                    min="0"
                    className="w-full md:w-1/3 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button onClick={handleSaveDefault} className="px-4 py-2 bg-indigo-600 rounded-md font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-2 min-w-[100px] justify-center">
                    {showDefaultSaveConfirm ? <CheckIcon className="w-5 h-5"/> : 'Save'}
                </button>
            </div>
        </section>

        {/* Per-Company Settings */}
        <section>
            <h2 className="text-xl font-bold mb-4">Per-Company Settings</h2>
            <div className="space-y-4">
                {companies.length > 0 ? companies.map(company => (
                    <div key={company.id} className="bg-slate-900/50 p-4 border border-slate-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="font-bold">{company.name}</p>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <input 
                                type="number" 
                                value={companyLimits[company.id]} 
                                onChange={e => setCompanyLimits(prev => ({ ...prev, [company.id]: parseInt(e.target.value, 10) || 0 }))} 
                                min="0"
                                className="w-full sm:w-32 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button onClick={() => handleSaveCompanyLimit(company.id)} className="px-4 py-2 bg-slate-600 rounded-md font-semibold hover:bg-slate-500 transition-colors flex items-center gap-2 min-w-[100px] justify-center">
                                {showCompanySaveConfirm[company.id] ? <CheckIcon className="w-5 h-5"/> : 'Save'}
                            </button>
                        </div>
                    </div>
                )) : (
                    <p className="text-slate-500 text-center py-6">You haven't created any companies yet.</p>
                )}
            </div>
        </section>
      </div>
    </div>
  );
};