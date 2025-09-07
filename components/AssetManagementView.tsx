import React, { useState, useEffect } from 'react';
import type { SoftwareAsset, Employee, User } from '../types';
import { useAuth } from '../contexts/GoogleAuthContext';
import { formatDate, formatCurrency } from '../utils';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { AssetManagerChat } from './AssetManagerChat';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ConfirmationModal } from './ConfirmationModal';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<SoftwareAsset, 'id' | 'companyId'>) => void;
    asset: SoftwareAsset | null;
    user: User | null;
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({ isOpen, onClose, onSave, asset, user }) => {
    const [formData, setFormData] = useState<Omit<SoftwareAsset, 'id' | 'companyId'>>({
        name: '',
        description: '',
        version: '',
        website: '',
        type: 'SaaS Subscription',
        seats: 1,
        cost: 0,
        costFrequency: 'monthly',
        renewalDate: new Date().toISOString().split('T')[0],
        assignedTo: '',
    });

    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name,
                description: asset.description || '',
                version: asset.version || '',
                website: asset.website || '',
                type: asset.type,
                seats: asset.seats,
                cost: asset.cost,
                costFrequency: asset.costFrequency,
                renewalDate: asset.renewalDate.split('T')[0],
                assignedTo: asset.assignedTo,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                version: '',
                website: '',
                type: 'SaaS Subscription',
                seats: 1,
                cost: 0,
                costFrequency: 'monthly',
                renewalDate: new Date().toISOString().split('T')[0],
                assignedTo: '',
            });
        }
    }, [asset, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Asset Name is required.');
            return;
        }
        onSave(formData);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-slate-800 p-6 w-full max-w-lg" style={{ borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{asset ? 'Edit' : 'Add'} Asset</h3>
                    <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Asset Name" required className="w-full bg-slate-700 p-2" />
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description (optional, e.g., what is this used for?)" rows={2} className="w-full bg-slate-700 p-2" />
                    <input name="version" type="text" value={formData.version} onChange={handleChange} placeholder="Version (e.g., 2.5.1)" className="w-full bg-slate-700 p-2" />
                    <input name="website" type="url" value={formData.website} onChange={handleChange} placeholder="Official Website (e.g., https://example.com)" className="w-full bg-slate-700 p-2" />
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-slate-700 p-2">
                        <option value="SaaS Subscription">SaaS Subscription</option>
                        <option value="Software License">Software License</option>
                        <option value="Other">Other</option>
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Seats / Licenses</label>
                            <input name="seats" type="number" value={formData.seats} onChange={handleChange} required min="0" className="w-full bg-slate-700 p-2" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Cost ({user?.settings?.currency || 'USD'})</label>
                            <input name="cost" type="number" value={formData.cost} onChange={handleChange} required min="0" step="0.01" className="w-full bg-slate-700 p-2" />
                        </div>
                    </div>
                    <select name="costFrequency" value={formData.costFrequency} onChange={handleChange} className="w-full bg-slate-700 p-2">
                        <option value="monthly">Monthly</option>
                        <option value="annually">Annually</option>
                    </select>
                    <input name="renewalDate" type="date" value={formData.renewalDate} onChange={handleChange} required className="w-full bg-slate-700 p-2" />
                    <input name="assignedTo" type="text" value={formData.assignedTo} onChange={handleChange} placeholder="Assigned To (e.g., Team Name)" required className="w-full bg-slate-700 p-2" />
                </div>
                <div className="flex gap-4 mt-6 justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-[var(--color-primary)]">Save Asset</button>
                </div>
            </form>
        </div>
    );
};


interface AssetManagementViewProps {
    companyId: string;
    employees: Employee[];
    softwareAssets: SoftwareAsset[];
    onAddAsset: (assetData: Omit<SoftwareAsset, 'id' | 'companyId'>) => void;
    onUpdateAsset: (assetId: string, updates: Partial<Omit<SoftwareAsset, 'id'>>) => void;
    onRemoveAsset: (assetId: string) => void;
}

export const AssetManagementView: React.FC<AssetManagementViewProps> = ({ companyId, employees, softwareAssets, onAddAsset, onUpdateAsset, onRemoveAsset }) => {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<SoftwareAsset | null>(null);
    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const assetManagerKeywords = ['asset', 'licence', 'license', 'subscription'];
    const assetManager = employees.find(e =>
        assetManagerKeywords.some(keyword => e.jobProfile.toLowerCase().includes(keyword))
    );

    const handleAddClick = () => {
        setEditingAsset(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (asset: SoftwareAsset) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };
    
    const handleDeleteClick = (asset: SoftwareAsset) => {
        setConfirmModalState({
            isOpen: true,
            title: `Delete Asset`,
            message: `Are you sure you want to delete the asset "${asset.name}"? This action cannot be undone.`,
            onConfirm: () => onRemoveAsset(asset.id),
        });
    };

    const handleSaveAsset = (assetData: Omit<SoftwareAsset, 'id' | 'companyId'>) => {
        if (editingAsset) {
            onUpdateAsset(editingAsset.id, assetData);
        } else {
            onAddAsset(assetData);
        }
        setIsModalOpen(false);
    };


    return (
        <div>
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
            <AssetFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAsset}
                asset={editingAsset}
                user={user}
            />

            <div className="flex items-center gap-3 mb-6">
                <DatabaseIcon className="w-8 h-8 text-slate-400" />
                <h2 className="text-3xl font-bold">Software Asset Management</h2>
            </div>
            <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Left Pane: Asset Ledger */}
                <div className={`bg-slate-800 p-6 ${assetManager ? 'w-full lg:w-2/3' : 'w-full'}`} style={{ borderRadius: 'var(--radius-lg)' }}>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold mb-2">Software Asset Ledger</h3>
                            <p className="text-sm text-slate-400">
                                {assetManager ? 'Manage assets manually or via the AI assistant.' : 'Manage all company software assets here.'}
                            </p>
                        </div>
                        <button onClick={handleAddClick} className="flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors" style={{ borderRadius: 'var(--radius-md)' }}>
                            <PlusIcon className="w-5 h-5" />
                            New Asset
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Asset Name</th>
                                    <th scope="col" className="px-4 py-3">Description</th>
                                    <th scope="col" className="px-4 py-3">Version</th>
                                    <th scope="col" className="px-4 py-3">Type</th>
                                    <th scope="col" className="px-4 py-3">Seats</th>
                                    <th scope="col" className="px-4 py-3">Cost</th>
                                    <th scope="col" className="px-4 py-3">Renewal</th>
                                    <th scope="col" className="px-4 py-3">Assigned To</th>
                                    <th scope="col" className="px-4 py-3">Website</th>
                                    <th scope="col" className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {softwareAssets.length > 0 ? softwareAssets.map(asset => {
                                    let url = asset.website;
                                    if (url && !/^https?:\/\//i.test(url)) {
                                        url = 'https://' + url;
                                    }

                                    return (
                                        <tr key={asset.id} onClick={() => handleEditClick(asset)} className="border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer">
                                            <td className="px-4 py-3 font-medium text-white">{asset.name}</td>
                                            <td className="px-4 py-3 max-w-xs truncate text-slate-400" title={asset.description}>{asset.description}</td>
                                            <td className="px-4 py-3">{asset.version || 'N/A'}</td>
                                            <td className="px-4 py-3">{asset.type}</td>
                                            <td className="px-4 py-3 text-center">{asset.seats}</td>
                                            <td className="px-4 py-3">{formatCurrency(asset.cost, user?.settings)} {asset.costFrequency}</td>
                                            <td className="px-4 py-3">{formatDate(asset.renewalDate, user?.settings)}</td>
                                            <td className="px-4 py-3">{asset.assignedTo}</td>
                                            <td className="px-4 py-3">
                                                {url ? (
                                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                                                        Visit Site
                                                    </a>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); handleEditClick(asset); }} className="p-2 text-slate-400 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(asset); }} className="p-2 text-slate-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={10} className="text-center py-10 text-slate-500">No software assets have been added yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Pane: Chat */}
                {assetManager && (
                    <div className="w-full lg:w-1/3 bg-slate-800 p-6" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <AssetManagerChat
                            companyId={companyId}
                            assetManager={assetManager}
                            assets={softwareAssets}
                            onAddAsset={onAddAsset}
                            onUpdateAsset={onUpdateAsset}
                            onRemoveAsset={onRemoveAsset}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};