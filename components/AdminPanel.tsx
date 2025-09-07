import React, { useState } from 'react';
import type { Company, Team, Department, Client } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { TEAM_ICON_LIST, TeamIcon } from './icons/departmentIcons';
import { SparklesIcon } from './icons/SparklesIcon';
import { generateTeamDescription } from '../services/geminiService';
import { ServiceError } from '../services/errors';
import { THEME_COLORS, DEFAULT_BRANDING, FONT_OPTIONS, UI_STYLE_OPTIONS } from '../constants';
import { ImageIcon } from './icons/ImageIcon';
import { ConfirmationModal } from './ConfirmationModal';


interface AdminPanelProps {
  company: Company;
  departments: Department[];
  teams: Team[];
  clients: Client[];
  onUpdateCompany: (companyId: string, data: Partial<Omit<Company, 'id'>>) => void;
  onAddDepartment: (companyId: string, name: string, description?: string) => void;
  onUpdateDepartment: (departmentId: string, data: Partial<Omit<Department, 'id' | 'companyId'>>) => void;
  onDeleteDepartment: (departmentId: string) => void;
  onAddTeam: (companyId: string, name: string, description?: string, icon?: string, departmentId?: string) => void;
  onUpdateTeam: (teamId: string, data: Partial<Omit<Team, 'id' | 'companyId'>>) => void;
  onDeleteTeam: (teamId: string) => void;
  onUpdateClient: (clientId: string, data: Partial<Omit<Client, 'id' | 'companyId'>>) => void;
  onDeleteClient: (clientId: string) => void;
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  company,
  departments,
  teams,
  clients,
  onUpdateCompany,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onUpdateClient,
  onDeleteClient,
  onBack,
}) => {
  const [companyName, setCompanyName] = useState(company.name);
  const [companyProfile, setCompanyProfile] = useState(company.profile);
  const [companyObjectives, setCompanyObjectives] = useState(company.objectives || '');
  const [companyPolicies, setCompanyPolicies] = useState(company.policies || '');
  const [companyCerts, setCompanyCerts] = useState(company.certifications || '');
  const [branding, setBranding] = useState(company.branding || DEFAULT_BRANDING);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentDesc, setNewDepartmentDesc] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState('');
  const [editingDepartmentDesc, setEditingDepartmentDesc] = useState('');

  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamIcon, setNewTeamIcon] = useState('default');
  const [newTeamDepartmentId, setNewTeamDepartmentId] = useState('');

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [editingTeamDesc, setEditingTeamDesc] = useState('');
  const [editingTeamIcon, setEditingTeamIcon] = useState('default');
  const [editingTeamDepartmentId, setEditingTeamDepartmentId] = useState('');
  
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientFormData, setClientFormData] = useState<Omit<Client, 'id' | 'companyId'>>({ name: '', contactPerson: '', contactEmail: '', status: 'Active' });


  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });


  const handleCompanyUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const companyUpdates: Partial<Omit<Company, 'id'>> = { 
        name: companyName, 
        profile: companyProfile,
        objectives: companyObjectives,
        policies: companyPolicies,
        certifications: companyCerts,
        branding,
    };
    
    onUpdateCompany(company.id, companyUpdates);
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/') && file.size < 2 * 1024 * 1024) { // 2MB limit
        const reader = new FileReader();
        reader.onloadend = () => {
            setBranding(prev => ({ ...prev, logo: reader.result as string }));
        };
        reader.readAsDataURL(file);
    } else if (file) {
        alert('Please select a valid image file under 2MB.');
    }
  };

  const getThemeButtonClasses = (themeValue: string, currentThemeValue: string) => {
    const base = "w-24 p-2 border-2 flex items-center gap-2 justify-center transition-colors";
    const activeClasses: Record<string, string> = {
        indigo: 'border-indigo-500 bg-indigo-500/10 text-indigo-300',
        sky: 'border-sky-500 bg-sky-500/10 text-sky-300',
        emerald: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
        rose: 'border-rose-500 bg-rose-500/10 text-rose-300',
        amber: 'border-amber-500 bg-amber-500/10 text-amber-300',
        violet: 'border-violet-500 bg-violet-500/10 text-violet-300',
        teal: 'border-teal-500 bg-teal-500/10 text-teal-300',
    };
    const inactiveClasses = 'border-slate-600 bg-slate-800 hover:border-slate-500';

    return `${base} ${themeValue === currentThemeValue ? activeClasses[themeValue] : inactiveClasses}`;
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) return;
    onAddDepartment(company.id, newDepartmentName, newDepartmentDesc);
    setIsAddingDepartment(false);
    setNewDepartmentName('');
    setNewDepartmentDesc('');
  };

  const handleStartEditDepartment = (dept: Department) => {
    setEditingDepartmentId(dept.id);
    setEditingDepartmentName(dept.name);
    setEditingDepartmentDesc(dept.description || '');
  };

  const handleCancelEditDepartment = () => {
    setEditingDepartmentId(null);
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartmentId || !editingDepartmentName.trim()) return;
    onUpdateDepartment(editingDepartmentId, { name: editingDepartmentName, description: editingDepartmentDesc });
    handleCancelEditDepartment();
  };
  
  const handleDeleteDepartment = (dept: Department) => {
    setConfirmModalState({
        isOpen: true,
        title: `Delete Department "${dept.name}"`,
        message: `Are you sure you want to delete this department?\nAny teams within it will become unassigned.\nThis action cannot be undone.`,
        onConfirm: () => onDeleteDepartment(dept.id),
    });
  };
  
  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    onAddTeam(company.id, newTeamName, newTeamDesc, newTeamIcon, newTeamDepartmentId || undefined);
    setIsAddingTeam(false);
    setNewTeamName('');
    setNewTeamDesc('');
    setNewTeamIcon('default');
    setNewTeamDepartmentId('');
  };

  const handleStartEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
    setEditingTeamDesc(team.description || '');
    setEditingTeamIcon(team.icon || 'default');
    setEditingTeamDepartmentId(team.departmentId || '');
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditingTeamName('');
    setEditingTeamDesc('');
    setEditingTeamIcon('default');
    setEditingTeamDepartmentId('');
  };

  const handleUpdateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeamId || !editingTeamName.trim()) return;
    onUpdateTeam(editingTeamId, { name: editingTeamName, description: editingTeamDesc, icon: editingTeamIcon, departmentId: editingTeamDepartmentId || undefined });
    handleCancelEdit();
  };

  const handleDeleteTeam = (team: Team) => {
    setConfirmModalState({
        isOpen: true,
        title: `Delete Team "${team.name}"`,
        message: `Are you sure you want to delete this team?\nEmployees in this team will become unassigned.\nThis action cannot be undone.`,
        onConfirm: () => onDeleteTeam(team.id),
    });
  };

  const handleGenerateDescription = async () => {
    if (!editingTeamId) return;

    if (!editingTeamName.trim()) {
        alert("Please provide a team name before generating a description.");
        return;
    }

    setIsGeneratingDesc(true);
    try {
        const generatedDescription = await generateTeamDescription(company.profile, editingTeamName);
        setEditingTeamDesc(prev => {
            if (prev.trim() === '') {
                return generatedDescription;
            }
            const separator = `\n\n###GENERATED USING AI###\n`;
            return `${prev.trim()}${separator}${generatedDescription}`;
        });
    } catch (err) {
        console.error("Failed to generate description:", err);
        const errorMessage = err instanceof ServiceError ? err.userMessage : "An error occurred while generating the description.";
        alert(errorMessage);
    } finally {
        setIsGeneratingDesc(false);
    }
  };

  const handleClientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setClientFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStartEditClient = (client: Client) => {
    setEditingClientId(client.id);
    setClientFormData({
        name: client.name,
        contactPerson: client.contactPerson || '',
        contactEmail: client.contactEmail || '',
        status: client.status,
    });
  };

  const handleCancelEditClient = () => {
    setEditingClientId(null);
    setClientFormData({ name: '', contactPerson: '', contactEmail: '', status: 'Active' });
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientId || !clientFormData.name.trim()) return;
    onUpdateClient(editingClientId, clientFormData);
    handleCancelEditClient();
  };

  const handleDeleteClient = (client: Client) => {
    setConfirmModalState({
        isOpen: true,
        title: `Delete Client "${client.name}"`,
        message: `Are you sure you want to delete this client?\nAny projects associated with them will become internal projects.\nThis action cannot be undone.`,
        onConfirm: () => onDeleteClient(client.id),
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <ConfirmationModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onConfirm={() => {
            confirmModalState.onConfirm();
            setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }}
        onClose={() => setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
      <button onClick={onBack} className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] mb-6 font-semibold">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Dashboard
      </button>
      
      <div className="bg-slate-800 p-6" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
        <h1 className="text-3xl font-bold mb-6 text-center">Company Settings</h1>
        
        {/* Company Details */}
        <section className="mb-8">
            <form onSubmit={handleCompanyUpdate} className="bg-slate-900/50 p-6 border border-slate-700" style={{ borderRadius: 'var(--radius-md)' }}>
                 <div className="flex items-center gap-3 mb-4">
                    <BuildingIcon className="w-6 h-6 text-[var(--color-primary)]"/>
                    <h2 className="text-xl font-bold">Company Details</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                        <input id="companyName" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }}/>
                    </div>
                    <div>
                        <label htmlFor="companyProfile" className="block text-sm font-medium text-slate-300 mb-1">Company Profile</label>
                        <textarea id="companyProfile" value={companyProfile} onChange={e => setCompanyProfile(e.target.value)} rows={5} className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }}></textarea>
                    </div>
                    <div>
                        <label htmlFor="companyObjectives" className="block text-sm font-medium text-slate-300 mb-1">Company Objectives</label>
                        <textarea id="companyObjectives" value={companyObjectives} onChange={e => setCompanyObjectives(e.target.value)} rows={4} className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }} placeholder="e.g., Increase market share by 20% in Q4. Launch Product X by year-end."></textarea>
                    </div>
                    <div>
                        <label htmlFor="companyPolicies" className="block text-sm font-medium text-slate-300 mb-1">Company Policies</label>
                        <textarea id="companyPolicies" value={companyPolicies} onChange={e => setCompanyPolicies(e.target.value)} rows={4} className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }} placeholder="e.g., All customer interactions must be logged in the CRM. Employees must adhere to a strict remote work security protocol."></textarea>
                    </div>
                    <div>
                        <label htmlFor="companyCerts" className="block text-sm font-medium text-slate-300 mb-1">Industry Certifications & Standards</label>
                        <textarea id="companyCerts" value={companyCerts} onChange={e => setCompanyCerts(e.target.value)} rows={3} className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }} placeholder="e.g., ISO 9001, SOC 2 Type II, GDPR compliance."></textarea>
                    </div>
                </div>

                {/* Company Branding */}
                <div className="mt-6 pt-6 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <ImageIcon className="w-6 h-6 text-[var(--color-primary)]"/>
                        <h2 className="text-xl font-bold">Company Branding</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Company Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-slate-700 flex items-center justify-center p-1" style={{ borderRadius: 'var(--radius-md)' }}>
                                    {branding.logo ? (
                                        <img src={branding.logo} alt="Company Logo" className="w-full h-full object-contain" style={{ borderRadius: 'var(--radius-sm)' }}/>
                                    ) : (
                                        <BuildingIcon className="w-10 h-10 text-slate-500"/>
                                    )}
                                </div>
                                <input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={handleLogoUpload}/>
                                <label htmlFor="logo-upload" className="cursor-pointer bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>
                                    Upload Logo
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Dashboard Theme</label>
                            <div className="flex gap-3 flex-wrap">
                                {THEME_COLORS.map(theme => (
                                    <button key={theme.value} type="button" onClick={() => setBranding(prev => ({ ...prev, themeColor: theme.value }))} className={getThemeButtonClasses(theme.value, branding.themeColor)} style={{ borderRadius: 'var(--radius-md)' }}>
                                        <span className={`w-4 h-4 rounded-full bg-${theme.value}-500`}></span>
                                        <span className="font-semibold text-sm">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                 {/* Appearance */}
                <div className="mt-6 pt-6 border-t border-slate-700">
                    <h2 className="text-xl font-bold mb-4">Appearance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="fontFamily" className="block text-sm font-medium text-slate-300 mb-2">Font Family</label>
                            <select
                                id="fontFamily"
                                value={branding.fontFamily}
                                onChange={e => setBranding(prev => ({ ...prev, fontFamily: e.target.value }))}
                                className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
                                style={{ borderRadius: 'var(--radius-md)' }}
                            >
                                {FONT_OPTIONS.map(font => (
                                    <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">UI Style</label>
                            <div className="flex flex-col gap-2">
                                {UI_STYLE_OPTIONS.map(opt => (
                                    <label key={opt.value} className="flex items-center gap-3 p-3 bg-slate-800 border-2 cursor-pointer" style={{ borderRadius: 'var(--radius-md)', borderColor: branding.uiStyle === opt.value ? 'var(--color-primary)' : 'transparent' }}>
                                        <input
                                            type="radio"
                                            name="uiStyle"
                                            value={opt.value}
                                            checked={branding.uiStyle === opt.value}
                                            onChange={e => setBranding(prev => ({ ...prev, uiStyle: e.target.value as any }))}
                                            className="h-4 w-4 bg-slate-700 border-slate-600 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                        />
                                        <span className="font-semibold">{opt.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="mt-6 pt-6 border-t border-slate-700 flex items-center justify-end gap-4">
                    {showSaveConfirmation && (
                        <div className="flex items-center gap-2 text-green-400 font-semibold transition-opacity duration-300">
                            <CheckIcon className="w-5 h-5" />
                            <span>Changes Saved!</span>
                        </div>
                    )}
                    <button type="submit" className="bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>Save Company Changes</button>
                </div>
            </form>
        </section>

        {/* Client Management */}
        <section className="mb-8">
            <div className="bg-slate-900/50 p-6 border border-slate-700" style={{ borderRadius: 'var(--radius-md)' }}>
                <div className="flex justify-between items-center gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <UserGroupIcon className="w-6 h-6 text-[var(--color-primary)]"/>
                        <h2 className="text-xl font-bold">Client Management</h2>
                    </div>
                </div>

                <div className="space-y-3">
                    {clients.map(client => (
                        <div key={client.id}>
                            {editingClientId === client.id ? (
                                <form onSubmit={handleUpdateClient} className="bg-slate-800/60 p-3 border border-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                                    <div className="space-y-2">
                                        <input type="text" name="name" value={clientFormData.name} onChange={handleClientFormChange} required className="w-full bg-slate-700 border border-slate-600 py-1 px-3" />
                                        <input type="text" name="contactPerson" value={clientFormData.contactPerson} onChange={handleClientFormChange} className="w-full bg-slate-700 border border-slate-600 py-1 px-3" />
                                        <input type="email" name="contactEmail" value={clientFormData.contactEmail} onChange={handleClientFormChange} className="w-full bg-slate-700 border border-slate-600 py-1 px-3" />
                                        <select name="status" value={clientFormData.status} onChange={handleClientFormChange} className="w-full bg-slate-700 border border-slate-600 py-1 px-3">
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                            <option value="Prospect">Prospect</option>
                                        </select>
                                    </div>
                                    <div className="mt-2 flex gap-2 justify-end">
                                        <button type="button" onClick={handleCancelEditClient} className="p-1.5 bg-slate-600 hover:bg-slate-500" style={{ borderRadius: 'var(--radius-sm)' }}><XMarkIcon className="w-4 h-4"/></button>
                                        <button type="submit" className="p-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]" style={{ borderRadius: 'var(--radius-sm)' }}><CheckIcon className="w-4 h-4"/></button>
                                    </div>
                                </form>
                            ) : (
                                <div className="bg-slate-800 p-3 flex justify-between items-center" style={{ borderRadius: 'var(--radius-sm)' }}>
                                    <div>
                                        <h4 className="font-semibold">{client.name}</h4>
                                        <p className="text-sm text-slate-400">{client.contactPerson || 'No contact person'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${client.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-300'}`}>{client.status}</span>
                                        <button onClick={() => handleStartEditClient(client)} className="p-2 bg-slate-700 hover:bg-slate-600" style={{ borderRadius: 'var(--radius-sm)' }}><PencilIcon className="w-4 h-4 text-slate-300"/></button>
                                        <button onClick={() => handleDeleteClient(client)} className="p-2 bg-red-800/50 hover:bg-red-800/80" style={{ borderRadius: 'var(--radius-sm)' }}><TrashIcon className="w-4 h-4 text-red-300"/></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Department Management */}
        <section className="mb-8">
            <div className="bg-slate-900/50 p-6 border border-slate-700" style={{ borderRadius: 'var(--radius-md)' }}>
                <div className="flex justify-between items-center gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <BuildingIcon className="w-6 h-6 text-[var(--color-primary)]"/>
                        <h2 className="text-xl font-bold">Department Management</h2>
                    </div>
                    {!isAddingDepartment && (
                        <button onClick={() => setIsAddingDepartment(true)} className="flex items-center gap-1.5 bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-primary-subtle-bg-hover)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                            <PlusIcon className="w-4 h-4" />
                            Add Department
                        </button>
                    )}
                </div>

                {isAddingDepartment && (
                    <form onSubmit={handleAddDepartment} className="bg-slate-800/60 p-4 mb-4 border border-slate-600" style={{ borderRadius: 'var(--radius-sm)' }}>
                        <h3 className="font-bold mb-2">New Department</h3>
                        <div className="space-y-3">
                            <input type="text" placeholder="Department Name" value={newDepartmentName} onChange={e => setNewDepartmentName(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }}/>
                            <textarea placeholder="Description (Optional)" value={newDepartmentDesc} onChange={e => setNewDepartmentDesc(e.target.value)} rows={2} className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white" style={{ borderRadius: 'var(--radius-sm)' }}></textarea>
                        </div>
                         <div className="mt-3 flex gap-2 justify-end">
                            <button type="button" onClick={() => setIsAddingDepartment(false)} className="bg-slate-600 px-3 py-1 text-sm font-semibold hover:bg-slate-500" style={{ borderRadius: 'var(--radius-sm)' }}>Cancel</button>
                            <button type="submit" className="bg-[var(--color-primary)] px-3 py-1 text-sm font-semibold hover:bg-[var(--color-primary-hover)]" style={{ borderRadius: 'var(--radius-sm)' }}>Save</button>
                        </div>
                    </form>
                )}

                <div className="space-y-3">
                    {departments.map(dept => (
                        <div key={dept.id}>
                            {editingDepartmentId === dept.id ? (
                                <form onSubmit={handleUpdateDepartment} className="bg-slate-800/60 p-3 border border-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                                    <div className="space-y-2">
                                        <input type="text" value={editingDepartmentName} onChange={e => setEditingDepartmentName(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 py-1 px-3 text-white" style={{ borderRadius: 'var(--radius-sm)' }}/>
                                        <textarea value={editingDepartmentDesc} onChange={e => setEditingDepartmentDesc(e.target.value)} rows={2} className="w-full bg-slate-700 border border-slate-600 py-1 px-3 text-white" style={{ borderRadius: 'var(--radius-sm)' }}/>
                                    </div>
                                    <div className="mt-2 flex gap-2 justify-end">
                                        <button type="button" onClick={handleCancelEditDepartment} className="p-1.5 bg-slate-600 hover:bg-slate-500" style={{ borderRadius: 'var(--radius-sm)' }}><XMarkIcon className="w-4 h-4"/></button>
                                        <button type="submit" className="p-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]" style={{ borderRadius: 'var(--radius-sm)' }}><CheckIcon className="w-4 h-4"/></button>
                                    </div>
                                </form>
                            ) : (
                                <div className="bg-slate-800 p-3 flex justify-between items-center" style={{ borderRadius: 'var(--radius-sm)' }}>
                                    <div>
                                        <h4 className="font-semibold">{dept.name}</h4>
                                        <p className="text-sm text-slate-400">{dept.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleStartEditDepartment(dept)} className="p-2 bg-slate-700 hover:bg-slate-600" style={{ borderRadius: 'var(--radius-sm)' }}><PencilIcon className="w-4 h-4 text-slate-300"/></button>
                                        <button onClick={() => handleDeleteDepartment(dept)} className="p-2 bg-red-800/50 hover:bg-red-800/80" style={{ borderRadius: 'var(--radius-sm)' }}><TrashIcon className="w-4 h-4 text-red-300"/></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Team Management */}
        <section>
             <div className="bg-slate-900/50 p-6 border border-slate-700" style={{ borderRadius: 'var(--radius-md)' }}>
                <div className="flex justify-between items-center gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <UserGroupIcon className="w-6 h-6 text-[var(--color-primary)]"/>
                        <h2 className="text-xl font-bold">Team Management</h2>
                    </div>
                    {!isAddingTeam && (
                        <button onClick={() => setIsAddingTeam(true)} className="flex items-center gap-1.5 bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-primary-subtle-bg-hover)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                            <PlusIcon className="w-4 h-4" />
                            Add Team
                        </button>
                    )}
                </div>

                {isAddingTeam && (
                    <form onSubmit={handleAddTeam} className="bg-slate-800/60 p-4 mb-4 border border-slate-600" style={{ borderRadius: 'var(--radius-sm)' }}>
                        <h3 className="font-bold mb-2">New Team</h3>
                        <div className="space-y-3">
                            <input type="text" placeholder="Team Name" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }}/>
                            <textarea placeholder="Team Description (Optional)" value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} rows={2} className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }}></textarea>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                                <select value={newTeamDepartmentId} onChange={e => setNewTeamDepartmentId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }}>
                                    <option value="">-- Unassigned --</option>
                                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
                                <div className="grid grid-cols-8 gap-2">
                                    {TEAM_ICON_LIST.map(iconKey => (
                                        <button type="button" key={iconKey} onClick={() => setNewTeamIcon(iconKey)} className={`p-2 border-2 transition-colors ${newTeamIcon === iconKey ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle-bg)]' : 'border-slate-600 bg-slate-700 hover:bg-slate-600'}`} style={{ borderRadius: 'var(--radius-md)' }} title={iconKey}>
                                            <TeamIcon iconName={iconKey} className="w-5 h-5 mx-auto text-white"/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                         <div className="mt-3 flex gap-2 justify-end">
                            <button type="button" onClick={() => setIsAddingTeam(false)} className="bg-slate-600 px-3 py-1 text-sm font-semibold hover:bg-slate-500" style={{ borderRadius: 'var(--radius-sm)' }}>Cancel</button>
                            <button type="submit" className="bg-[var(--color-primary)] px-3 py-1 text-sm font-semibold hover:bg-[var(--color-primary-hover)]" style={{ borderRadius: 'var(--radius-sm)' }}>Save</button>
                        </div>
                    </form>
                )}

                <div className="space-y-3">
                    {teams.map(team => (
                        <div key={team.id}>
                            {editingTeamId === team.id ? (
                                <form onSubmit={handleUpdateTeam} className="bg-slate-800/60 p-3 border border-[var(--color-primary)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                                    <div className="space-y-2">
                                        <div>
                                            <label htmlFor={`team-name-${team.id}`} className="block text-sm font-medium text-slate-300 mb-1">Team Name</label>
                                            <input id={`team-name-${team.id}`} type="text" value={editingTeamName} onChange={e => setEditingTeamName(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 py-1 px-3 text-white" style={{ borderRadius: 'var(--radius-sm)' }}/>
                                        </div>
                                        <div>
                                            <label htmlFor={`team-desc-${team.id}`} className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                                            <div className="relative">
                                                <textarea
                                                    id={`team-desc-${team.id}`}
                                                    value={editingTeamDesc}
                                                    onChange={e => setEditingTeamDesc(e.target.value)}
                                                    rows={4}
                                                    className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none pr-10"
                                                    placeholder="Team Description (Optional)"
                                                    style={{ borderRadius: 'var(--radius-sm)' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateDescription}
                                                    disabled={isGeneratingDesc}
                                                    className="absolute top-2 right-2 p-1.5 bg-[var(--color-primary-subtle-bg)] text-[var(--color-primary-subtle-text)] hover:bg-[var(--color-primary-subtle-bg-hover)] disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                                                    style={{ borderRadius: 'var(--radius-sm)' }}
                                                    title="Generate description with AI"
                                                >
                                                    <SparklesIcon className={`w-4 h-4 ${isGeneratingDesc ? 'animate-pulse' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor={`team-dept-${team.id}`} className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                                            <select id={`team-dept-${team.id}`} value={editingTeamDepartmentId} onChange={e => setEditingTeamDepartmentId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 py-2 px-3 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" style={{ borderRadius: 'var(--radius-sm)' }}>
                                                <option value="">-- Unassigned --</option>
                                                {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mt-2 mb-2">Icon</label>
                                            <div className="grid grid-cols-8 gap-2">
                                                {TEAM_ICON_LIST.map(iconKey => (
                                                    <button type="button" key={iconKey} onClick={() => setEditingTeamIcon(iconKey)} className={`p-2 border-2 transition-colors ${editingTeamIcon === iconKey ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle-bg)]' : 'border-slate-600 bg-slate-700 hover:bg-slate-600'}`} style={{ borderRadius: 'var(--radius-md)' }} title={iconKey}>
                                                        <TeamIcon iconName={iconKey} className="w-5 h-5 mx-auto text-white"/>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex gap-2 justify-end">
                                        <button type="button" onClick={handleCancelEdit} className="p-1.5 bg-slate-600 hover:bg-slate-500" style={{ borderRadius: 'var(--radius-sm)' }}><XMarkIcon className="w-4 h-4"/></button>
                                        <button type="submit" className="p-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]" style={{ borderRadius: 'var(--radius-sm)' }}><CheckIcon className="w-4 h-4"/></button>
                                    </div>
                                </form>
                            ) : (
                                <div className="bg-slate-800 p-3 flex justify-between items-center" style={{ borderRadius: 'var(--radius-sm)' }}>
                                    <div className="flex items-center gap-3">
                                        <TeamIcon iconName={team.icon} className="w-5 h-5 text-[var(--color-primary)]" />
                                        <div>
                                            <h4 className="font-semibold">{team.name}</h4>
                                            <p className="text-sm text-slate-400">{team.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleStartEdit(team)} className="p-2 bg-slate-700 hover:bg-slate-600" style={{ borderRadius: 'var(--radius-sm)' }}><PencilIcon className="w-4 h-4 text-slate-300"/></button>
                                        <button onClick={() => handleDeleteTeam(team)} className="p-2 bg-red-800/50 hover:bg-red-800/80" style={{ borderRadius: 'var(--radius-sm)' }}><TrashIcon className="w-4 h-4 text-red-300"/></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};