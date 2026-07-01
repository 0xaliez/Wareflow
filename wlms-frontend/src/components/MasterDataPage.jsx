import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import Modal from './shared/Modal';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';

const MasterDataPage = ({ 
    endpoint, 
    title, 
    fields, 
    nameField, 
    idField, 
    canDeactivate = false 
}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const finalEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
            const response = await apiClient.get(finalEndpoint);
            setData(response.data);
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [endpoint]);

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData(item);
        } else {
            setFormData({});
            // Initialize empty values for fields
            fields.forEach(f => setFormData(prev => ({ ...prev, [f.name]: '' })));
        }
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const finalEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
            if (editingItem) {
                await apiClient.put(`${finalEndpoint}${idField}/${editingItem[idField]}`, formData);
            } else {
                await apiClient.post(finalEndpoint, formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.msg || err.message || 'Operation failed';
            alert(`Error: ${errorMsg}`);
            console.error('Full API Error:', err);
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this entity?')) return;
        try {
            await apiClient.patch(`${endpoint}/${id}/deactivate`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Deactivation failed');
        }
    };

    const filteredData = data.filter(item => 
        item[nameField]?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} className="mr-2" /> Add New
                </button>
            </div >

            <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                </div >
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full md:w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div >

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                        <tr>
                            {fields.map(f => <th key={f.name} className="px-6 py-4">{f.label}</th>)}
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr >
                    </thead >
                    <tbody className="divide-y divide-gray-200">
                        {filteredData.map(item => (
                            <tr key={item[idField]} className="hover:bg-gray-50 transition-colors">
                                {fields.map(f => (
                                    <td key={f.name} className="px-6 py-4 text-gray-700">
                                        {item[f.name]}
                                    </td >
                                ))}
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(item)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {canDeactivate && (
                                            <button 
                                                onClick={() => handleDeactivate(item[idField])}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div >
                                </td >
                            </tr >
                        ))}
                    </tbody >
                </table >
            </div >

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingItem ? 'Edit Entry' : 'Add New Entry'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map(f => (
                        <div key={f.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                            <input 
                                name={f.name}
                                type={f.type || 'text'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData[f.name] || ''}
                                onChange={handleInputChange}
                                required={f.required}
                            />
                        </div >
                    ))}
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                    </div >
                </form>
            </Modal>
        </div >
    );
};

export default MasterDataPage;
